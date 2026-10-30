// Supply the app's installed Three.js namespace and scene; do NOT create a renderer here.
import {addThreeBlockout,checkAabbClearance} from '../src/blockout.mjs';
export function installBlockout(THREE, scene, material) {
  const spec={id:'ledge',x:0,y:1,z:0,width:4,height:2,depth:3};
  const ownership=addThreeBlockout({THREE,scene,material,boxes:[spec]});
  // world/Three units are meters; keep physics collider authored separately.
  const clearance=checkAabbClearance({min:{x:0,y:0,z:0},max:{x:2,y:3,z:2}},{x:1,y:2,z:1});
  return {clearance, dispose:ownership.dispose};
}
