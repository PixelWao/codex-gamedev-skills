// MIT Copyright (c) 2026 Waldemar Soroka
const finite=(v,k)=>{if(!Number.isFinite(v))throw new RangeError(`${k} nonfinite`);return v;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const easing={linear:t=>t,outCubic:t=>1-(1-t)**3,inOutSine:t=>(1-Math.cos(Math.PI*t))/2,outBack:t=>1+2.70158*(t-1)**3+1.70158*(t-1)**2};
const copy=v=>Array.isArray(v)?v.slice():v;
function valid(v){if(typeof v==='number')return Number.isFinite(v);return Array.isArray(v)&&v.length>0&&v.every(Number.isFinite);}
function mix(a,b,t){if(typeof a==='number'&&typeof b==='number')return a+(b-a)*t;if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length)return a.map((v,i)=>v+(b[i]-v)*t);throw new TypeError('tween shape mismatch');}
export class TweenDirector{
 constructor(){this.active=new Map();}
 play(object,key,{from,to,durationMs,atMs,curve='outBack'}){
  if(!object||typeof object!=='object'||typeof key!=='string')throw new TypeError('invalid target');finite(durationMs,'duration');finite(atMs,'time');
  if(durationMs<0||!easing[curve]||!valid(to))throw new RangeError('invalid tween');
  const previous=this.active.get(object)?.get(key),baseline=copy(previous?.baseline??object[key]),start=copy(from===undefined?object[key]:from);
  if(!valid(baseline)||!valid(start)||Array.isArray(start)!==Array.isArray(to)||Array.isArray(start)&&start.length!==to.length)throw new TypeError('invalid tween vector');
  object[key]=copy(start);if(durationMs===0){object[key]=copy(to);this._remove(object,key);return;}
  let fields=this.active.get(object);if(!fields){fields=new Map();this.active.set(object,fields);}fields.set(key,{from:start,to:copy(to),durationMs,atMs,curve,baseline});
 }
 _remove(object,key){const fields=this.active.get(object);fields?.delete(key);if(fields?.size===0)this.active.delete(object);}
 tick(atMs){finite(atMs,'time');for(const [o,fields] of this.active)for(const [key,tw] of fields){const u=clamp((atMs-tw.atMs)/tw.durationMs,0,1);o[key]=mix(tw.from,tw.to,easing[tw.curve](u));if(u===1)this._remove(o,key);}}
 cancel(object,key,{restore=true}={}){const tw=this.active.get(object)?.get(key);if(!tw)return false;if(restore)object[key]=copy(tw.baseline);this._remove(object,key);return true;}
 dispose({restore=true}={}){for(const [o,fields] of this.active)for(const [key,tw] of fields)if(restore)o[key]=copy(tw.baseline);this.active.clear();}
}
export class ParticlePool{
 constructor({capacity=256,random=Math.random}={}){if(!Number.isSafeInteger(capacity)||capacity<0)throw new RangeError('capacity');this.capacity=capacity;this.random=random;this.particles=[];this.free=[];this.created=0;this.rejected=0;}
 spawn({count=1,x=0,y=0,speed=60,ttlMs=300,radius=2}={}){
  [x,y,speed,ttlMs,radius].forEach((v,i)=>finite(v,String(i)));if(!Number.isInteger(count)||count<0||speed<0||ttlMs<=0||radius<0)throw new RangeError('particle args');
  let accepted=0;for(let i=0;i<count;i++){if(this.particles.length>=this.capacity){this.rejected++;continue;}const a=this.random()*Math.PI*2;const p=this.free.pop()??{};if(Object.keys(p).length===0)this.created++;Object.assign(p,{x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,ageMs:0,ttlMs,radius});this.particles.push(p);accepted++;}return {accepted,rejected:count-accepted};
 }
 update(dtMs){finite(dtMs,'dt');if(dtMs<0)throw new RangeError('negative dt');for(const p of this.particles){p.ageMs+=dtMs;p.x+=p.vx*dtMs/1000;p.y+=p.vy*dtMs/1000;}for(let i=this.particles.length-1;i>=0;i--){if(this.particles[i].ageMs>=this.particles[i].ttlMs){const p=this.particles[i];this.particles[i]=this.particles[this.particles.length-1];this.particles.pop();this.free.push(p);}}return this.particles.length;}
 clear(){this.free.push(...this.particles);this.particles.length=0;}
}
export function renderCanvasParticles(ctx,particles,{reducedMotion=false,draw=null}={}){if(reducedMotion)return 0;let count=0;ctx.save();try{for(const p of particles){const alpha=clamp(1-p.ageMs/p.ttlMs,0,1);if(alpha<=0)continue;if(draw)draw(ctx,p,alpha);else{ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,2*Math.PI);ctx.fill();}count++;}}finally{ctx.restore();}return count;}
export function syncThreeInstances(mesh,particles,makeMatrix){if(typeof mesh?.setMatrixAt!=='function'||typeof makeMatrix!=='function')throw new TypeError('instanced mesh adapter');const max=mesh.instanceMatrix?.count??mesh.count??particles.length,n=Math.min(max,particles.length);for(let i=0;i<n;i++)mesh.setMatrixAt(i,makeMatrix(particles[i],i));mesh.count=n;if(mesh.instanceMatrix)mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere?.();return n;}
export function damagePop({x,y,value,startedMs,nowMs,durationMs=600,rise=32}){[x,y,startedMs,nowMs,durationMs,rise].forEach((v,i)=>finite(v,String(i)));if(durationMs<=0)throw new RangeError('duration');const u=clamp((nowMs-startedMs)/durationMs,0,1);return {x,y:y-rise*easing.outCubic(u),alpha:1-u,text:String(value),done:u===1};}
