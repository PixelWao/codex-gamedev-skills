// MIT © 2026 Waldemar Soroka. Pure weapon state machine: no renderer/game loop ownership.
import {requirePositive,requireFinite} from './math.mjs';
export function validateWeaponConfig(c) {
  if(!c||typeof c!=='object')throw new TypeError('weapon configuration required');
  const mode=c.mode??'auto';
  if(!['semi','auto','burst'].includes(mode))throw new RangeError('mode must be semi, auto, burst');
  for(const k of ['roundsPerSecond','magazineSize','reloadSeconds','baseDamage','range'])requirePositive(c[k],k);
  if(!Number.isSafeInteger(c.magazineSize)||c.magazineSize<1)throw new RangeError('magazineSize must be positive integer');
  if(mode==='burst'&&(!Number.isSafeInteger(c.burstSize)||c.burstSize<1))throw new RangeError('burstSize must be integer >0');
  const reserve=c.reserveAmmo??0;
  if(!Number.isSafeInteger(reserve)||reserve<0)throw new RangeError('reserveAmmo must be nonnegative integer');
  if(c.recoilPattern!==undefined&&(!Array.isArray(c.recoilPattern)||!c.recoilPattern.length||!c.recoilPattern.every(Number.isFinite)))throw new RangeError('nonempty finite recoilPattern required');
  if(c.spreadRadians!==undefined&&(!Number.isFinite(c.spreadRadians)||c.spreadRadians<0||c.spreadRadians>=Math.PI/2))throw new RangeError('spreadRadians invalid');
  if(c.heatPerShot!==undefined||c.heatCapacity!==undefined||c.coolPerSecond!==undefined) {
    for(const k of ['heatPerShot','heatCapacity','coolPerSecond'])requirePositive(c[k],k);
    if(c.heatPerShot>c.heatCapacity)throw new RangeError('heatPerShot may not exceed heatCapacity');
  }
  return {...c,mode,reserveAmmo:reserve,burstSize:c.burstSize??1,recoilPattern:c.recoilPattern??[0],spreadRadians:c.spreadRadians??0};
}
/** Call once per existing simulation tick with dt; returned events include precise scheduled times. */
export class WeaponController {
  constructor(config,{maxShotsPerTick=64}={}) {
    this.config=validateWeaponConfig(config);
    if(!Number.isSafeInteger(maxShotsPerTick)||maxShotsPerTick<1)throw new RangeError('invalid maxShotsPerTick');
    this.maxShotsPerTick=maxShotsPerTick;
    this.time=0;this.nextFireAt=0;this.reloadEndsAt=null;
    this.ammo=this.config.magazineSize;this.reserve=this.config.reserveAmmo;
    this.lastDown=false;this.burstRemaining=0;this.shotCount=0;
    this.heat=0;this.overheated=false;
    this.active=true;
  }
  get state(){return !this.active?'holstered':this.reloadEndsAt!==null?'reloading':this.overheated?'overheated':this.ammo===0?'empty':'ready';}
  cancel(){this.burstRemaining=0;this.lastDown=false;this.reloadEndsAt=null;this.active=false;}
  equip(){this.active=true;this.lastDown=false;}
  /** Step absolute monotonic simulation clock. Avoid giant dt after tab suspension. */
  tick(dt,{triggerDown=false,reload=false}={}) {
    requireFinite(dt,'dt');if(dt<=0||dt>0.25)throw new RangeError('tick dt must lie in (0,0.25]; use fixed steps and cap resume');
    const t0=this.time, end=t0+dt, c=this.config, events=[],eps=1e-10;
    const pressed=!!triggerDown&&!this.lastDown;
    if(!this.active){this.lastDown=!!triggerDown;this.time=end;return events;}
    if(reload&&this.reloadEndsAt===null&&this.ammo<c.magazineSize&&this.reserve>0){
      this.reloadEndsAt=t0+c.reloadSeconds;this.burstRemaining=0;
      events.push({type:'reload-start',time:t0});
    }
    if(pressed&&c.mode==='burst'&&this.reloadEndsAt===null)this.burstRemaining=c.burstSize;
    let cursor=t0,shots=0;
    const coolUntil=(t)=>{
      if(c.coolPerSecond) this.heat=Math.max(0,this.heat-c.coolPerSecond*Math.max(0,t-cursor));
      cursor=t;
      if(this.overheated&&this.heat<=c.heatCapacity*0.35+eps)this.overheated=false;
    };
    while(true){
      // Process reload completion without losing the rest of the frame.
      if(this.reloadEndsAt!==null){
        if(this.reloadEndsAt>=end-eps){coolUntil(end);if(this.reloadEndsAt<=end+eps){
          const t=this.reloadEndsAt;const count=Math.min(c.magazineSize-this.ammo,this.reserve);
          this.ammo+=count;this.reserve-=count;this.reloadEndsAt=null;events.push({type:'reload-complete',time:t,amount:count});
        }break;}
        const t=this.reloadEndsAt;coolUntil(t);const count=Math.min(c.magazineSize-this.ammo,this.reserve);
        this.ammo+=count;this.reserve-=count;this.reloadEndsAt=null;events.push({type:'reload-complete',time:t,amount:count});
      }
      const wants=c.mode==='auto'?!!triggerDown:c.mode==='semi'?pressed&&shots===0:this.burstRemaining>0;
      if(!wants||this.ammo===0||shots>=this.maxShotsPerTick){if(shots>=this.maxShotsPerTick&&wants)events.push({type:'shots-cap-reached',time:cursor});coolUntil(end);break;}
      const shotAt=Math.max(cursor,this.nextFireAt);
      if(shotAt>=end-eps){coolUntil(end);break;}
      coolUntil(shotAt);
      if(this.overheated) {coolUntil(end);break;}
      if(c.heatPerShot&&this.heat+c.heatPerShot>c.heatCapacity+eps){this.overheated=true;events.push({type:'overheated',time:shotAt});coolUntil(end);break;}
      this.ammo--;const recoil=c.recoilPattern[this.shotCount%c.recoilPattern.length];
      events.push({type:'shot',time:shotAt,index:this.shotCount,ammo:this.ammo,recoil,spreadRadians:c.spreadRadians});
      this.shotCount++;shots++;
      if(c.heatPerShot){this.heat+=c.heatPerShot;if(this.heat>=c.heatCapacity-eps){this.overheated=true;events.push({type:'overheated',time:shotAt});}}
      if(c.mode==='burst')this.burstRemaining--;
      this.nextFireAt=shotAt+1/c.roundsPerSecond;
      if(this.overheated){coolUntil(end);break;}
    }
    this.lastDown=!!triggerDown;this.time=end;
    return events;
  }
}
