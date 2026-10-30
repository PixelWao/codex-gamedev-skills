// Copyright (c) 2026 Waldemar Soroka. MIT.
// Engine neutral navmesh invalidation and steering. Owns neither physics nor scene.
const isVec = p => p&&[p.x,p.y,p.z].every(Number.isFinite);
export class TileNavCoordinator {
  constructor({rebuildTile,queryPath}={}){
    if(typeof rebuildTile!=='function'||typeof queryPath!=='function')throw new TypeError('callbacks required');
    this.rebuildTile=rebuildTile;this.queryPath=queryPath;this.revision=0;this.dirty=new Set();this.tileGeneration=new Map();this.inFlight=new Set();this.generation=0;
  }
  markDirty(tiles){if(!Array.isArray(tiles))throw new TypeError('tiles must be array');
    for(const tile of tiles){if(typeof tile!=='string'||!tile.length)throw new RangeError('invalid tile ID');this.dirty.add(tile);this.tileGeneration.set(tile,(this.tileGeneration.get(tile)||0)+1);}
    if(tiles.length){this.revision++;this.generation++;}
    return this.revision;
  }
  async rebuild({maxTiles=4}={}){
    if(!Number.isSafeInteger(maxTiles)||maxTiles<1)throw new RangeError('invalid maxTiles');
    const finished=[],failed=[];for(const tile of [...this.dirty].filter(t=>!this.inFlight.has(t)).slice(0,maxTiles)){
      const startedAt=this.tileGeneration.get(tile);this.inFlight.add(tile);
      try{await this.rebuildTile(tile);if(this.tileGeneration.get(tile)===startedAt){this.dirty.delete(tile);finished.push(tile);}this.revision++;this.generation++;}
      catch(error){failed.push({tile,error:String(error)});}
      finally{this.inFlight.delete(tile);}
    }
    return {finished,failed,remaining:this.dirty.size,revision:this.revision};
  }
  async requestPath(start,goal,{signal}={}){
    if(!isVec(start)||!isVec(goal))throw new RangeError('start/goal must be finite xyz');
    if(signal?.aborted)return {status:'aborted',path:null,revision:this.revision};
    if(this.dirty.size)return {status:'rebuilding',path:null,revision:this.revision};
    const revision=this.revision;
    let path;
    try{path=await this.queryPath({...start},{...goal},{signal});}
    catch(error){if(signal?.aborted)return {status:'aborted',path:null,revision};return {status:'error',path:null,reason:String(error),revision};}
    if(signal?.aborted)return {status:'aborted',path:null,revision};
    if(this.revision!==revision||this.dirty.size)return {status:'stale',path:null,revision};
    if(!Array.isArray(path)||path.some(p=>!isVec(p)))return {status:'invalid',path:null,revision};
    return {status:path.length?'ok':'unreachable',path:path.map(p=>({...p})),revision};
  }
  accepts(result){return result?.status==='ok'&&result.revision===this.revision&&!this.dirty.size;}
}
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
const delta=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const norm=v=>Math.hypot(v.x,v.y,v.z);
const unit=v=>{const d=norm(v);return d>1e-9?{x:v.x/d,y:v.y/d,z:v.z/d}:{x:0,y:0,z:0};};
export function seekVelocity({position,target,maxSpeed,slowRadius=0}){
  if(!isVec(position)||!isVec(target)||!Number.isFinite(maxSpeed)||maxSpeed<0||!Number.isFinite(slowRadius)||slowRadius<0)throw new RangeError('invalid input');
  const to=delta(target,position),distance=norm(to),speed=maxSpeed*(slowRadius>0?clamp(distance/slowRadius,0,1):1);
  const d=unit(to);return {x:d.x*speed,y:d.y*speed,z:d.z*speed};
}
export function steerVelocity({velocity,desired,maxAcceleration,dt}){
  if(!isVec(velocity)||!isVec(desired)||!Number.isFinite(maxAcceleration)||maxAcceleration<0||!Number.isFinite(dt)||dt<0)throw new RangeError('invalid steering');
  const change=delta(desired,velocity),c=norm(change),limit=maxAcceleration*dt,f=c>limit&&c>0?limit/c:1;
  return {x:velocity.x+change.x*f,y:velocity.y+change.y*f,z:velocity.z+change.z*f};
}
export function advancePath({position,path,index=0,reachRadius=.3}={}){
  if(!isVec(position)||!Array.isArray(path)||path.some(p=>!isVec(p))||!Number.isInteger(index)||index<0||!Number.isFinite(reachRadius)||reachRadius<0)throw new RangeError('invalid path');
  while(index<path.length&&norm(delta(position,path[index]))<=reachRadius)index++;
  return {index,finished:index>=path.length,waypoint:path[index]??null};
}
// Inject physics cast for solid-body motion; world stepping remains external.
export function planMotion({position,velocity,target,dt,maxSpeed=3,maxAcceleration=12,slowRadius=.6,castMotion=null}){
  if(!Number.isFinite(dt)||dt<0||dt>.5)throw new RangeError('bad timestep');
  const desired=seekVelocity({position,target,maxSpeed,slowRadius});
  const nextVelocity=steerVelocity({velocity,desired,maxAcceleration,dt});
  const displacement={x:nextVelocity.x*dt,y:nextVelocity.y*dt,z:nextVelocity.z*dt};
  if(castMotion!==null&&typeof castMotion!=='function')throw new TypeError('castMotion must be function');
  const result=castMotion?castMotion(position,displacement):displacement;
  if(!isVec(result))throw new RangeError('castMotion must return finite permitted displacement');
  return {velocity:nextVelocity,requestedDisplacement:displacement,permittedDisplacement:result};
}
export function separationVelocity(position,neighbors,{radius=1,strength=1,maxSpeed=2}={}){
  if(!isVec(position)||!Array.isArray(neighbors)||!Number.isFinite(radius)||radius<=0||!Number.isFinite(strength)||strength<0||!Number.isFinite(maxSpeed)||maxSpeed<0)throw new RangeError('invalid separation');
  let sx=0,sz=0;
  for(const p of neighbors){if(!isVec(p))throw new RangeError('neighbor');const x=position.x-p.x,z=position.z-p.z,d=Math.hypot(x,z);
    if(d>1e-6&&d<radius){const weight=(radius-d)/radius;sx+=x/d*weight;sz+=z/d*weight;}}
  const len=Math.hypot(sx,sz),speed=Math.min(maxSpeed,len*strength);
  return len>0?{x:sx/len*speed,y:0,z:sz/len*speed}:{x:0,y:0,z:0};
}
