// Illustrative self-contained integration; replace fake physics query with Rapier adapter.
import {WeaponController,fireHitscan,DamageLedger,damageFalloff,seededRng} from '../src/index.mjs';
const config={mode:'auto',roundsPerSecond:5,magazineSize:8,reserveAmmo:16,reloadSeconds:1,baseDamage:25,range:100,spreadRadians:.02,recoilPattern:[1,1.4,2]};
const gun=new WeaponController(config), random=seededRng(2026), ledger=new DamageLedger(), enemy={hp:60};
const camera={x:0,y:1.6,z:0}, muzzle={x:.2,y:1.3,z:0};
const raycast=(origin,direction,maxDistance,options)=>{
  // Mock physics returns a target at 6m on both rays. Real casts MUST include solid world colliders.
  const distance=6; if(maxDistance<distance)return null;
  return {kind:'damageable',targetId:'enemy-1',distance,point:{x:origin.x+direction.x*distance,y:origin.y+direction.y*distance,z:origin.z+direction.z*distance}};
};
const events=[];
for(let i=0;i<60;i++){
  for(const event of gun.tick(1/60,{triggerDown:true})){
    if(event.type!=='shot')continue;
    const shot=fireHitscan({cameraOrigin:camera,cameraDirection:{x:0,y:0,z:-1},muzzleOrigin:muzzle,range:config.range,castRay:raycast,random,spreadRad:event.spreadRadians});
    if(shot.damageable){
      const damage=ledger.apply(enemy,config.baseDamage,`player:gun:${event.index}`,{falloff:damageFalloff(shot.distance,20,60,.4)});
      events.push({time:event.time,type:'hit',damage:damage.applied,killed:damage.killed});
    }
  }
}
console.log(JSON.stringify({shots:gun.shotCount,enemyHP:enemy.hp,hits:events.length,kills:events.filter(e=>e.killed).length},null,2));
