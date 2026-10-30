import {Evaluator,inverseLerp,combine,curves,mulberry32} from '../scripts/utility.mjs';
const ai=new Evaluator([
 {name:'attack',available:f=>f.ammo>0&&f.lineOfSight,score:f=>combine([inverseLerp(f.distance,20,2),curves.sigmoid(f.health,8,.35)])},
 {name:'retreat',score:f=>curves.smoothstep(1-f.health)},
 {name:'patrol',available:f=>!f.lineOfSight,score:()=>.3}
],{rng:mulberry32(42),hysteresis:.08});
for(const facts of [{ammo:10,lineOfSight:true,distance:4,health:.9},{ammo:0,lineOfSight:true,distance:4,health:.2}])console.log(ai.choose(facts));
