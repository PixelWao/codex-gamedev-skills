import { Camera2D, interpolateTarget } from '../scripts/camera2d.mjs';
const camera = new Camera2D({viewport:{width:960,height:540},zoom:2,deadzone:{x:30,y:16},lookAhead:50});
const previous={x:100,y:40},current={x:101,y:40};
const dt=1/60;
const player=interpolateTarget(previous,current,0.5);
camera.update(player,{x:60,y:0},dt);
const screen=camera.worldToScreen(player);
const roundTrip=camera.screenToWorld(screen);
if (!Number.isFinite(roundTrip.x)) throw new Error('Camera invalid');
// Usage within the project's existing draw loop; do not create a second RAF.
// ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(...);
// camera.applyCanvasTransform(ctx); drawWorld();
// ctx.setTransform(1,0,0,1,0,0); drawHUD();
