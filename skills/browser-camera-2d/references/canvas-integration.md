# Canvas 2D — integration contract

The module operates in **world units** (+X right, +Y down). `viewport.width/height` are the dimensions of the **logical camera viewport**; one world unit projects to `zoom` logical pixels. For HiDPI either render to an offscreen logical-size canvas and upscale, or apply a DPR factor *in addition to* the world camera transform. Never multiply camera dimensions by DPR and also apply DPR again.

## Example renderer order

```js
const cssWidth = canvas.clientWidth;
const cssHeight = canvas.clientHeight;
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = Math.round(cssWidth * dpr);
canvas.height = Math.round(cssHeight * dpr);
camera.setViewport(cssWidth, cssHeight);
// For each frame:
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.save();
ctx.scale(dpr, dpr);
camera.applyCanvasTransform({ setTransform(a,b,c,d,e,f) {
  // camera transform supplied in CSS-pixel coordinates; keep DPR scaling.
  ctx.setTransform(a*dpr,b*dpr,c*dpr,d*dpr,e*dpr,f*dpr);
}});
renderWorld(ctx);
ctx.restore();
ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0); renderHUD(ctx); ctx.restore();
```

The wrapper above is illustrative, not necessary; you can instead compute one combined matrix explicitly and call `ctx.setTransform(dpr*zoom, 0, 0, dpr*zoom, dpr*tx, dpr*ty)`. Avoid mixing CSS and backing-store coordinates when using `screenToWorld`.

## Fixed physics and interpolation

When the physics engine maintains two snapshots, calculate an interpolation factor in [0,1] from the existing loop and feed `interpolateTarget(previous,current,alpha)` to camera.update. Preserve causal sequencing; if your renderer intentionally uses extrapolation, document that instead. On teleport or hard scene cut call `camera.reset(newPosition)` and invalidate the old physics interpolation snapshot.

## Tuning

- `followRate`/`leadRate` use inverse seconds. A fixed target is nearly FPS-invariant under exponential smoothing.
- Deadzone is in world units, measured relative to `focus`; unlike a spring it can produce intentional discontinuous focus movement on entering the zone. Select sizes based on level design.
- `lookAhead` is a scalar world distance; slow velocity normalized to a full lead can feel abrupt. For variable look-ahead magnitude, customize target lead using a velocity-to-distance response curve.
- For pixel art, integer viewport sizes, integer or constrained camera zoom and pixel snapping usually produce cleaner pixels. Pixel snapping may reduce temporal smoothness; benchmark on representative devices.
- When viewport is bigger than bounds, centering does not fill the screen — render an intentional border/background.

## Sources / review

- MDN CanvasRenderingContext2D.setTransform: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
- MDN ResizeObserver: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- Original ideas: `camera-systems` (Apache-2.0; provenance and attribution retained).
