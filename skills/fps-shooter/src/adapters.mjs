// MIT © 2026 Waldemar Soroka. Adapters are opt-in, do not own worlds/renderers.
import {unit,add,scale} from './math.mjs';
/** Actual THREE instance and all blockers required. Mesh raycasts are NOT physics-authoritative. */
export function createThreeRaycastAdapter(THREE,{objects,resolveHit}) {
  if(!THREE?.Raycaster||!THREE?.Vector3||!Array.isArray(objects)||typeof resolveHit!=='function') throw new TypeError('THREE, objects and resolveHit required');
  const caster=new THREE.Raycaster();
  return (origin,direction,range,options={})=>{
    caster.set(new THREE.Vector3(origin.x,origin.y,origin.z),new THREE.Vector3(...['x','y','z'].map(k=>unit(direction)[k])));
    caster.near=0;caster.far=range;
    const hits=caster.intersectObjects(objects,true);
    for(const hit of hits){
      const info=resolveHit(hit.object,hit,options);
      if(!info||info.ignore===true||(options.excludeActorId!=null&&info.actorId===options.excludeActorId))continue;
      return {kind:info.kind??'world',targetId:info.targetId??null,hitZone:info.hitZone??null,
        distance:hit.distance,point:{x:hit.point.x,y:hit.point.y,z:hit.point.z},normal:hit.normal??null,collider:hit.object};
    }
    return null;
  };
}
/** Rapier 3D adapter with closest blocking physics collider, not a DAMAGEABLE-only filter. */
export function createRapierRaycastAdapter(RAPIER,world,{classifyCollider,filterFlags=undefined,filterGroups=undefined,
  excludeRigidBody=null,excludeCollider=null}={}) {
  if(!RAPIER?.Ray||!world?.castRayAndGetNormal||typeof classifyCollider!=='function')throw new TypeError('Rapier, world, classifyCollider required');
  return (origin,direction,range,options={})=>{
    const ray=new RAPIER.Ray(origin,unit(direction));
    const predicate=(collider)=>{
      const info=classifyCollider(collider,options);
      return info?.ignore!==true&&(options.excludeActorId==null||info?.actorId!==options.excludeActorId);
    };
    const raw=world.castRayAndGetNormal(ray,range,true,filterFlags,filterGroups,excludeCollider,excludeRigidBody,predicate);
    if(!raw)return null;
    const collider=raw.collider??(raw.colliderHandle!=null?world.getCollider?.(raw.colliderHandle):null);
    if(!collider)throw new Error('Rapier returned unresolved collider; verify installed API');
    const info=classifyCollider(collider,options)??{};
    const distance=raw.timeOfImpact??raw.toi;
    if(!Number.isFinite(distance))throw new Error('Rapier ray hit lacks timeOfImpact/toi');
    const point=ray.pointAt(distance);
    return {kind:info.kind??'world',targetId:info.targetId??null,hitZone:info.hitZone??null,
      distance,point,normal:raw.normal??null,collider};
  };
}
/** Projectile adapter must sweep a sphere and return the earliest blocking collision. */
export function createRapierSphereSweepAdapter(RAPIER,world,{classifyCollider,groups=undefined}={}) {
  if(!RAPIER?.Ball||!world?.castShape||typeof classifyCollider!=='function')throw new TypeError('Rapier castShape adapter dependencies missing');
  return (start,end,radius,options={})=>{
    const move={x:end.x-start.x,y:end.y-start.y,z:end.z-start.z};
    const norm=Math.hypot(move.x,move.y,move.z); if(norm<=1e-12)return null;
    const shape=new RAPIER.Ball(radius);
    const unitMove={x:move.x/norm,y:move.y/norm,z:move.z/norm};
    const predicate=(collider)=>{
      const info=classifyCollider(collider,options);
      return info?.ignore!==true&&(options.excludeActorId==null||info?.actorId!==options.excludeActorId);
    };
    // Verify signature against installed Rapier version; maxToi is distance when velocity normalized.
    const h=world.castShape(start,{x:0,y:0,z:0,w:1},unitMove,shape,0,norm,true,undefined,groups,null,null,predicate);
    if(!h)return null;
    const d=h.timeOfImpact??h.toi;
    if(!Number.isFinite(d))throw new Error('invalid castShape time of impact');
    return {fraction:Math.max(0,Math.min(1,d/norm)),collider:h.collider??null};
  };
}
