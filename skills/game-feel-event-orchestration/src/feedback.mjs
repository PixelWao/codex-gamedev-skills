// MIT Copyright (c) 2026 Waldemar Soroka
const finite = (n,k) => { if (!Number.isFinite(n)) throw new RangeError(`${k} must be finite`); return n; };
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
export class HitStopManager {
  constructor({baseScale=()=>1,applyScale=()=>{},onTrace=()=>{}}={}) { this.baseScale=baseScale;this.applyScale=applyScale;this.onTrace=onTrace;this.active=new Map();this.last=undefined; }
  request({id,atMs,durationMs,multiplier=0}){
    if(typeof id!=='string'||!id)throw new TypeError('hitstop id required');
    [atMs,durationMs,multiplier].forEach((n,i)=>finite(n,['time','duration','multiplier'][i]));
    if(durationMs<0||multiplier<0||multiplier>1)throw new RangeError('invalid hitstop');
    if(durationMs===0)return false;
    const old=this.active.get(id), until=Math.max(old?.until??-Infinity,atMs+durationMs);
    this.active.set(id,{until,multiplier:Math.min(old?.multiplier??1,multiplier)});
    this.onTrace({type:old?'hitstop_extended':'hitstop_start',eventId:id,atMs,untilMs:until});
    this.tick(atMs);return true;
  }
  tick(atMs){
    finite(atMs,'time');
    for(const [id,s] of this.active)if(s.until<=atMs){this.active.delete(id);this.onTrace({type:'hitstop_end',eventId:id,atMs,deadlineMs:s.until});}
    const base=finite(this.baseScale(),'baseScale');if(base<0)throw new RangeError('negative base scale');
    const factor=Math.min(1,...Array.from(this.active.values(),x=>x.multiplier));
    const result=base*factor;
    if(result!==this.last){this.applyScale(result);this.last=result;}
    return result;
  }
  cancel(id,atMs){if(this.active.delete(id))this.onTrace({type:'hitstop_end',eventId:id,atMs,reason:'cancelled'});return this.tick(atMs);}
  dispose(atMs){for(const id of this.active.keys())this.onTrace({type:'hitstop_end',eventId:id,atMs,reason:'disposed'});this.active.clear();return this.tick(atMs);}
}
export class TraumaShake {
  constructor({decay=1.4,maxX=12,maxY=8,maxRoll=.08,frequency=18}={}){[decay,maxX,maxY,maxRoll,frequency].forEach((n,i)=>finite(n,String(i)));if(decay<=0||maxX<0||maxY<0||maxRoll<0||frequency<0)throw new RangeError('invalid camera shake');Object.assign(this,{decay,maxX,maxY,maxRoll,frequency});this.trauma=0;}
  add(strength){finite(strength,'strength');this.trauma=clamp(this.trauma+strength,0,1);}
  sample(dtSeconds,elapsedSeconds){finite(dtSeconds,'dt');finite(elapsedSeconds,'time');if(dtSeconds<0)throw new RangeError('negative dt');this.trauma=Math.max(0,this.trauma-this.decay*dtSeconds);const a=this.trauma**2;if(a===0)return {x:0,y:0,roll:0};const t=elapsedSeconds*this.frequency;return {x:this.maxX*a*Math.sin(t),y:this.maxY*a*Math.sin(t*1.33+.7),roll:this.maxRoll*a*Math.sin(t*.83+1)};}
  clear(){this.trauma=0;}
}
export function composeVisualCamera(base,delta){return {...base,x:base.x+delta.x,y:base.y+delta.y,rotation:(base.rotation??0)+delta.roll};}
export const DEFAULT_PRESETS=Object.freeze({small:{shake:.12,hitstopMs:0,particles:2,cue:'tick',flashMs:0},medium:{shake:.35,hitstopMs:45,particles:8,cue:'hit',flashMs:45},large:{shake:.7,hitstopMs:100,particles:25,cue:'boom',flashMs:60}});
export class FeedbackDirector {
  constructor({hitstop=null,shake=null,sinks={},settings={},limits={},presets=DEFAULT_PRESETS,onTrace=()=>{}}={}){
    this.hitstop=hitstop;this.shake=shake;this.sinks=sinks;this.presets=presets;this.onTrace=onTrace;
    this.settings={reducedMotion:false,allowFlashes:true,shakeMultiplier:1,...settings};
    this.limits={windowMs:100,events:32,particles:120,duplicateTtlMs:10000,...limits};
    if(!(this.limits.windowMs>0&&this.limits.events>=0&&this.limits.particles>=0&&this.limits.duplicateTtlMs>0))throw new RangeError('budget');
    this.seen=new Map();this.start=null;this.lastTime=-Infinity;this.eventCount=0;this.particleCount=0;
  }
  setSettings(changes){
    this.settings={...this.settings,...changes};
    if(this.settings.reducedMotion)this.shake?.clear();
  }
  emit(event){
    if(this.settings.reducedMotion)this.shake?.clear();
    if(typeof event?.id!=='string'||!event.id)throw new TypeError('event.id required');const atMs=finite(event.atMs,'atMs');
    if(atMs<this.lastTime)throw new RangeError('timestamp regression');this.lastTime=atMs;
    for(const [id,until] of this.seen)if(until<=atMs)this.seen.delete(id);
    const reject=reason=>{this.onTrace({type:'feedback_rejected',eventId:event.id,atMs,reason});return {accepted:false,reason};};
    if(this.seen.has(event.id))return reject('duplicate');
    const preset=this.presets[event.tier??'medium'];if(!preset)throw new RangeError('invalid tier');
    if(this.start===null||atMs-this.start>=this.limits.windowMs){this.start=atMs;this.eventCount=0;this.particleCount=0;}
    if(this.eventCount>=this.limits.events)return reject('event_budget');
    this.seen.set(event.id,atMs+this.limits.duplicateTtlMs);this.eventCount++;
    const channels=[];
    if(!this.settings.reducedMotion&&this.shake&&preset.shake){const a=clamp(preset.shake*finite(this.settings.shakeMultiplier,'shakeMultiplier'),0,1);if(a>0){this.shake.add(a);channels.push('shake');}}
    if(this.hitstop&&preset.hitstopMs){this.hitstop.request({id:event.id,atMs,durationMs:preset.hitstopMs});channels.push('hitstop');}
    const count=this.settings.reducedMotion?0:Math.max(0,Math.min(preset.particles,this.limits.particles-this.particleCount));
    if(count&&this.sinks.particles){this.sinks.particles({...event,count});this.particleCount+=count;channels.push('particles');}
    if(this.sinks.audio&&preset.cue){this.sinks.audio({...event,cue:preset.cue});channels.push('audio');}
    if(this.settings.allowFlashes&&!this.settings.reducedMotion&&preset.flashMs&&this.sinks.flash){this.sinks.flash({...event,durationMs:preset.flashMs});channels.push('flash');}
    if(this.sinks.ui){this.sinks.ui(event);channels.push('ui');}
    this.onTrace({type:'feedback_accepted',eventId:event.id,atMs,tier:event.tier??'medium',channels,particles:this.sinks.particles?count:0,reducedMotion:this.settings.reducedMotion,allowFlashes:this.settings.allowFlashes});
    return {accepted:true,channels};
  }
  dispose(atMs){this.seen.clear();this.shake?.clear();this.hitstop?.dispose(atMs);}
}
