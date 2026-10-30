import {test} from 'node:test';
import assert from 'node:assert/strict';
import {add,scale,sampleCone,seededRng,unit,damageFalloff,idealTtk,WeaponController,DamageLedger,fireHitscan,advanceProjectile,createRapierRaycastAdapter,createThreeRaycastAdapter,validateWeaponConfig} from '../src/index.mjs';
const v=(x,y=0,z=0)=>({x,y,z});
const conf=(over={})=>({mode:'auto',roundsPerSecond:10,magazineSize:40,reserveAmmo:80,reloadSeconds:1,baseDamage:20,range:100,recoilPattern:[1,2],...over});
const close=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
function replay(fps,c=conf(),dur=1){const w=new WeaponController(c);const ev=[];for(let i=0;i<fps*dur;i++)ev.push(...w.tick(1/fps,{triggerDown:true}));return ev.filter(x=>x.type==='shot').map(x=>+x.time.toFixed(6));}
for(const fps of [30,60,144])test(`auto exactly 10 shots/sec at ${fps}fps`,()=>assert.deepEqual(replay(fps),Array.from({length:10},(_,i)=>+(i/10).toFixed(6))));
test('semi requires new edge',()=>{const w=new WeaponController(conf({mode:'semi'}));const a=w.tick(.05,{triggerDown:true});const b=w.tick(.15,{triggerDown:true});w.tick(.02,{triggerDown:false});const c=w.tick(.03,{triggerDown:true});assert.equal(a.filter(e=>e.type==='shot').length,1);assert.equal(b.filter(e=>e.type==='shot').length,0);assert.equal(c.filter(e=>e.type==='shot').length,1)});
test('burst finishes after release but not repeats',()=>{const w=new WeaponController(conf({mode:'burst',burstSize:3}));let e=[...w.tick(.05,{triggerDown:true})];for(let i=0;i<7;i++)e.push(...w.tick(.05,{triggerDown:false}));assert.equal(e.filter(x=>x.type==='shot').length,3)});
test('reload consumes reserve and blocks shots',()=>{const w=new WeaponController(conf({magazineSize:2,reserveAmmo:1,reloadSeconds:.3}));w.tick(.2,{triggerDown:true});assert.equal(w.ammo,0);assert.equal(w.state,'empty');w.tick(.1,{reload:true,triggerDown:true});assert.equal(w.state,'reloading');const end=w.tick(.2,{triggerDown:true});assert.equal(w.ammo,1);assert.equal(w.reserve,0);assert.ok(end.some(e=>e.type==='reload-complete'))});
test('cannot reload full magazine',()=>{const w=new WeaponController(conf());assert.equal(w.tick(.1,{reload:true}).length,0)});
test('holster cancels burst and does not fire',()=>{const w=new WeaponController(conf({mode:'burst',burstSize:4}));w.tick(.05,{triggerDown:true});w.cancel();assert.equal(w.tick(.2,{triggerDown:true}).length,0);w.equip();assert.equal(w.burstRemaining,0)});
test('large dt rejected, no burst after tab resume',()=>assert.throws(()=>new WeaponController(conf()).tick(15,{triggerDown:true}),/fixed/));
test('empty recoil pattern rejected',()=>assert.throws(()=>validateWeaponConfig(conf({recoilPattern:[]})),/recoilPattern/));
test('invalid ammo and rates rejected',()=>{for(const c of [{magazineSize:0},{roundsPerSecond:0},{range:-1},{reserveAmmo:-1}])assert.throws(()=>validateWeaponConfig(conf(c)))});
test('overheat locks then recovers',()=>{const w=new WeaponController(conf({heatCapacity:2,heatPerShot:1,coolPerSecond:2}));const a=w.tick(.25,{triggerDown:true});assert.equal(a.filter(e=>e.type==='shot').length,2);assert.ok(a.some(e=>e.type==='overheated'));const b=w.tick(.25,{triggerDown:true});assert.equal(b.filter(e=>e.type==='shot').length,0);w.tick(.25,{triggerDown:true});const d=w.tick(.25,{triggerDown:true});assert.ok(d.some(e=>e.type==='shot'))});
test('cone 0 unchanged',()=>assert.deepEqual(sampleCone(v(1),0),v(1)));
test('cone samples within half-angle and unit norm',()=>{const random=seededRng(57),axis=unit(v(1,1,1));for(let i=0;i<1000;i++){let out=sampleCone(axis,.12,random);const dot=out.x*axis.x+out.y*axis.y+out.z*axis.z;assert.ok(dot>=Math.cos(.12)-1e-12);close(Math.hypot(out.x,out.y,out.z),1);}});
test('seed reproducibility',()=>{let a=seededRng(42),b=seededRng(42);for(let i=0;i<50;i++)assert.deepEqual(sampleCone(v(0,0,1),.1,a),sampleCone(v(0,0,1),.1,b))});
test('TTK 1-shot 0 sec',()=>assert.deepEqual(idealTtk({hp:100,damage:110,roundsPerSecond:10}),{shots:1,seconds:0}));
test('TTK invalid data',()=>{for(const args of [{hp:0,damage:1,roundsPerSecond:1},{hp:10,damage:0,roundsPerSecond:2},{hp:10,damage:2,roundsPerSecond:0}])assert.throws(()=>idealTtk(args))});
test('damage falloff edge cases and invalid ranges',()=>{close(damageFalloff(10,20,60,.4),1);close(damageFalloff(60,20,60,.4),.4);close(damageFalloff(40,20,60,.4),.7);assert.throws(()=>damageFalloff(10,20,20))});
const castOf=(cameraDist,muzzleDist,cameraKind='damageable',muzzleKind='damageable')=> (origin,dir,r,opt)=> {
  const d=opt.stage==='camera'?cameraDist:muzzleDist;
  if(d>r)return null;
  return {kind:opt.stage==='camera'?cameraKind:muzzleKind,distance:d,point:{x:origin.x+dir.x*d,y:origin.y+dir.y*d,z:origin.z+dir.z*d}};
};
test('closest wall blocks damage',()=>{const shot=fireHitscan({cameraOrigin:v(0),cameraDirection:v(1),muzzleOrigin:v(0,0,-.4),range:100,castRay:castOf(8,3,'damageable','world')});assert.equal(shot.blocked,true);assert.equal(shot.damageable,false)});
test('muzzle close wall even when camera sees target',()=>{const shot=fireHitscan({cameraOrigin:v(0,2),cameraDirection:v(1),muzzleOrigin:v(0),range:20,castRay:castOf(10,.2,'damageable','world')});assert.equal(shot.blocked,true)});
test('damageable first hit',()=>{const shot=fireHitscan({cameraOrigin:v(0),cameraDirection:v(1),muzzleOrigin:v(0),range:20,castRay:castOf(8,8)});assert.equal(shot.damageable,true)});
test('misconfigured hit type rejected',()=>assert.throws(()=>fireHitscan({cameraOrigin:v(0),cameraDirection:v(1),muzzleOrigin:v(0),range:20,castRay:()=>({kind:'ghost',distance:2})}),/kind/));
test('shooting from inside wall hits at zero',()=>{const shot=fireHitscan({cameraOrigin:v(0),cameraDirection:v(1),muzzleOrigin:v(0),range:20,castRay:castOf(0,0,'world','world')});assert.equal(shot.hit.distance,0)});
test('no damage for duplicate hit event or dead target',()=>{const t={hp:30},l=new DamageLedger();assert.equal(l.apply(t,50,'x').killed,true);assert.equal(l.apply(t,50,'x').duplicate,true);assert.equal(l.apply(t,50,'y').killed,false);assert.equal(t.hp,0)});
test('projectile continuous sweep hits thin barrier',()=>{const p={position:v(0),velocity:v(100),maxRange:200,maxLife:2,age:0,travelled:0};const out=advanceProjectile(p,.1,()=>({fraction:.5}));assert.equal(out.events[0].type,'impact');close(out.projectile.position.x,5);assert.equal(out.projectile.done,true)});
test('projectile no sweep hit moves',()=>{const p={position:v(0),velocity:v(10),maxRange:200,maxLife:10};const out=advanceProjectile(p,.1,()=>null);close(out.projectile.position.x,1);assert.equal(out.projectile.done,false)});
test('projectile expires at range',()=>{const p={position:v(0),velocity:v(100),maxRange:4,maxLife:5};const out=advanceProjectile(p,.1,()=>null);close(out.projectile.position.x,4);assert.equal(out.events[0].type,'expired')});
test('projectile bad sweep fraction rejected',()=>assert.throws(()=>advanceProjectile({position:v(0),velocity:v(100),maxRange:5,maxLife:5},.1,()=>({fraction:1.5})),/fraction/));
test('rapier mock returns nearest collider metadata',()=>{
  const collider={handle:11}, R={Ray:class{constructor(o,d){this.origin=o;this.dir=d}pointAt(t){return add(this.origin,scale(this.dir,t))}}};
  const w={castRayAndGetNormal:(ray,range,solid,flags,groups,exc,body,pred)=>pred(collider)?{collider,timeOfImpact:2,normal:v(-1)}:null};
  const fn=createRapierRaycastAdapter(R,w,{classifyCollider:()=>({kind:'world'})});
  assert.equal(fn(v(0),v(1),5).distance,2);
});
test('three mock returns first blocker not ignored',()=>{
  class V{constructor(x,y,z){this.x=x;this.y=y;this.z=z}};
  class R{set(){} intersectObjects(){return [{object:{id:1},distance:2,point:v(2)},{object:{id:2},distance:3,point:v(3)}]}};
  const cast=createThreeRaycastAdapter({Raycaster:R,Vector3:V},{objects:[{}],resolveHit:(object)=>object.id===1?{ignore:true}:{kind:'world'}});
  assert.equal(cast(v(0),v(1),9).distance,3);
});

test('stationary projectile without gravity rejected',()=>assert.throws(()=>advanceProjectile({position:v(0),velocity:v(0),maxRange:10,maxLife:1},.05,()=>null),/velocity or gravity/));
test('projectile can drop from rest under gravity',()=>{const p=advanceProjectile({position:v(0),velocity:v(0),gravity:v(0,-10),maxRange:10,maxLife:2},.2,()=>null);close(p.projectile.position.y,-.2)});
test('holstering cancels reload without ammo gain',()=>{const w=new WeaponController(conf({magazineSize:1,reserveAmmo:4}));w.tick(.1,{triggerDown:true});w.tick(.1,{reload:true});w.cancel();w.tick(.2,{});w.equip();w.tick(.2,{});assert.equal(w.ammo,0);assert.equal(w.reserve,4)});
test('projectile already done emits no second impact',()=>{const p={position:v(0),velocity:v(1),maxLife:1,maxRange:10,done:true};const o=advanceProjectile(p,.1,()=>({fraction:0}));assert.equal(o.events.length,0)});
