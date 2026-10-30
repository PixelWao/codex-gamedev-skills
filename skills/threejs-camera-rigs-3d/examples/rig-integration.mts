import { OrbitCameraRig, groupFraming } from '../scripts/rig3d.mjs';
const rig = new OrbitCameraRig({target:{x:0,y:2,z:0},idealDistance:9});
rig.setAngles(Math.PI/3,.4);
const pose=rig.update(1/60,{collisionQuery:()=>null});
const selection=groupFraming([{x:0,y:0,z:0},{x:3,y:2,z:0}],{aspect:16/9});
if (!Number.isFinite(pose.distance) || selection.distance <=0) throw new Error('invalid pose');
// Existing game loop: rig.update(dt, {collisionQuery: existingPhysicsQuery});
// applyPoseToThreeCamera(existingThreeCamera, pose); existingRenderer.render(...)
