// MIT © 2026 Waldemar Soroka.
import {add,sub,scale,unit,distance,length,requirePositive,requireFinite,sampleCone} from './math.mjs';
function validateHit(hit,maxDist) {
  if (hit==null) return null;
  if (!Number.isFinite(hit.distance)||hit.distance<0||hit.distance>maxDist+1e-7) throw new RangeError('raycast returned invalid distance');
  if (hit.kind!=='world' && hit.kind!=='damageable') throw new TypeError('raycast hit.kind must be world or damageable');
  return hit;
}
/** castRay MUST return nearest blocking collider across world and damageable layers; never DAMAGEABLE-only. */
export function fireHitscan({cameraOrigin,cameraDirection,muzzleOrigin,range,castRay,spreadRad=0,random=Math.random,shooterId=null}) {
  requirePositive(range,'range'); if(typeof castRay!=='function') throw new TypeError('castRay required');
  const dir=sampleCone(cameraDirection,spreadRad,random);
  const aim=validateHit(castRay(cameraOrigin,dir,range,{excludeActorId:shooterId,stage:'camera'}),range);
  const aimPoint=aim?.point ?? add(cameraOrigin,scale(dir,range));
  // A second cast from the true barrel origin prevents aiming through a close wall.
  const delta=sub(aimPoint,muzzleOrigin),d=length(delta);
  const barrelDir=d<=1e-9?dir:unit(delta);
  const muzzleRange=Math.min(range,Math.max(d,1e-6));
  const muzzleHit=validateHit(castRay(muzzleOrigin,barrelDir,muzzleRange,{excludeActorId:shooterId,stage:'muzzle'}),muzzleRange);
  return {cameraHit:aim,hit:muzzleHit,aimPoint,direction:barrelDir,origin:muzzleOrigin,
    distance:muzzleHit?.distance??null,blocked:!!muzzleHit && muzzleHit.kind==='world',
    damageable:!!muzzleHit && muzzleHit.kind==='damageable'};
}
/** Physics-neutral projectile, continuous sweep performed by caller. */
export function advanceProjectile(projectile,dt,sweep) {
  requireFinite(dt,'dt');if(dt<=0)throw new RangeError('dt must be positive');
  if(typeof sweep!=='function')throw new TypeError('sweep(start,end,radius,options) required');
  if(projectile.done) return {projectile,events:[]};
  const {position,velocity,gravity={x:0,y:0,z:0},radius=0,maxRange,travelled=0,age=0,maxLife} = projectile;
  if (![position?.x,position?.y,position?.z,velocity?.x,velocity?.y,velocity?.z,gravity?.x,gravity?.y,gravity?.z].every(Number.isFinite))throw new RangeError('projectile vectors must be finite');
  if(length(velocity)===0 && length(gravity)===0)throw new RangeError('projectile requires velocity or gravity');
  requirePositive(maxRange,'maxRange');requirePositive(maxLife,'maxLife');
  if(!Number.isFinite(radius)||radius<0)throw new RangeError('invalid projectile radius');
  const remainingLife=Math.max(0,maxLife-age),remainingRange=Math.max(0,maxRange-travelled);
  if(remainingLife===0||remainingRange===0)return {projectile:{...projectile,done:true},events:[{type:'expired'}]};
  const effectiveDt=Math.min(dt,remainingLife);
  const endVelocity=add(velocity,scale(gravity,effectiveDt));
  const displacement=add(scale(velocity,effectiveDt),scale(gravity,.5*effectiveDt*effectiveDt));
  const proposedLen=length(displacement),fraction=proposedLen>0?Math.min(1,remainingRange/proposedLen):1;
  const end=add(position,scale(displacement,fraction)),segment=distance(position,end);
  // Swept-circle/sphere or continuous ray query is caller-defined: no endpoint-only hit tests.
  const impact=segment>0 ? sweep(position,end,radius,{excludeActorId:projectile.ownerId}) : null;
  if(impact!=null && (!Number.isFinite(impact.fraction)||impact.fraction<0||impact.fraction>1))throw new RangeError('sweep fraction must lie [0,1]');
  const p=impact?add(position,scale(sub(end,position),impact.fraction)):end;
  const progressed=segment*(impact?.fraction??1);
  const done=!!impact||fraction<1||effectiveDt===remainingLife||travelled+progressed>=maxRange-1e-8;
  return {projectile:{...projectile,position:p,velocity:endVelocity,travelled:travelled+progressed,
    age:age+effectiveDt*fraction*(impact?.fraction??1),done},events:impact?[{type:'impact',hit:impact,point:p}]:done?[{type:'expired'}]:[]};
}
export class DamageLedger {
  constructor() {this.seen=new Set();}
  apply(target,amount,eventId,{headMultiplier=1,falloff=1}={}) {
    if(eventId==null)throw new TypeError('unique eventId required');
    if(this.seen.has(eventId))return {applied:0,killed:false,duplicate:true};
    requireFinite(amount,'amount');requireFinite(headMultiplier,'headMultiplier');requireFinite(falloff,'falloff');
    if(amount<0||headMultiplier<0||falloff<0)throw new RangeError('nonnegative damage required');
    if(!Number.isFinite(target.hp)||target.hp<0)throw new RangeError('invalid hp');
    this.seen.add(eventId);
    if(target.hp===0)return {applied:0,killed:false,duplicate:false};
    const total=amount*headMultiplier*falloff;requireFinite(total,'scaled damage');
    const amountActual=Math.min(target.hp,total);
    target.hp=Math.max(0,target.hp-amountActual);
    return {applied:amountActual,killed:target.hp===0,duplicate:false};
  }
  clear(){this.seen.clear();} // clear on session/replay boundary, not between hits
}
