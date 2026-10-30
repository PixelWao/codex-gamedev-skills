import { WeaponController, fireHitscan, type RayCast, type WeaponConfig } from '../src/index.mjs';
const config: WeaponConfig={mode:'semi',roundsPerSecond:7,magazineSize:12,reloadSeconds:1.5,baseDamage:15,range:70};
const gun=new WeaponController(config);
const world:RayCast=(_origin,_direction,_range)=>null; // replace with physics-authoritative world raycast
const shotEvents=gun.tick(1/60,{triggerDown:true});
for(const event of shotEvents){
  if(event.type==='shot'){
    const result=fireHitscan({cameraOrigin:{x:0,y:1,z:0},cameraDirection:{x:0,y:0,z:-1},muzzleOrigin:{x:0,y:1,z:0},range:config.range,castRay:world,spreadRad:event.spreadRadians});
    if(result.blocked)console.log('wall blocks shot');
  }
}
