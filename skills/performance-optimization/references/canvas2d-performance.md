# Canvas 2D / pixel-art game performance

Applies to HTML Canvas 2D game renderers, pixel-art worlds, editor thumbnails, tilemaps,
HUDs and particle layers. Preserve input hit-testing and coordinate transforms, physics,
render ordering, visual fidelity and deterministic update behavior. Benchmark using the
**existing** game loop rather than adding a competing `requestAnimationFrame`.

## 1. Diagnose before changing rendering structure

With Chrome Performance trace and optional bounded timers, split rendering work into:

1. **Simulation**: game update, tile physics, particles, world state and collisions.
2. **Preparation**: tile visibility, text layout, sprite lookup, draw command generation.
3. **Canvas calls**: `drawImage`, paths, fills, strokes, alpha, shadows, compositing.
4. **Browser**: style/layout/compositor, canvas backing-store work, paint and raster.
5. **Presentation**: frame pacing, display cap and compositing.

Canvas call timing on the main thread is **not** a direct GPU measurement. A fast `drawImage`
call can still contribute to later raster work. Determine whether the bottleneck is in
JavaScript logic, Canvas API dispatch or browser rendering. Profile a normal release-like
build, representative DPR and viewport size, and a worst-case dirty scene.

## 2. Choose a technique only for its measured use case

| Observation | Possible change | Validate |
| --- | --- | --- |
| Expensive static scenery re-painted every frame | Pre-render a static layer or cache chunks | invalidation on edits, extra memory/blits |
| Tiny part of scene changes | Dirty-rectangle redraw | correct overlap, lighting, particles, transparency |
| Repeated procedural paths / text | Raster cache for stable content | cache size, scaling, pixel quality and invalidation |
| Huge tilemap drawn blindly | Camera-aware tile/chunk culling | edge padding, camera zoom/rotation, occlusion |
| Repeated state mutations | Group compatible draw ops, avoid redundant state changes | intended z-order, alpha and clipping |
| Canvas is huge at high DPR | Controlled resolution test, use appropriate backing size | sharpness, layout, input mapping |
| Alpha blending / shadow blur dominant | Minimize large translucent layers or blur cost | appearance and accessibility |
| UI rebuilds regardless of change | Separate static UI from dynamic world | stacking, pointer events and input hitboxes |
| Main-thread draw work high | Try `OffscreenCanvas` worker pipeline | browser support, message overhead, ordering |

**Do not** reflexively use dirty rectangles: blended pixels, shadows, global transforms,
post-effects and sprites overlapping multiple rectangles can make the optimization incorrect
or slower. Compare full redraw to partial redraw in a controlled scenario.

## 3. Pixel art, rendering math and image caching

- Keep logical pixels, CSS pixels and physical backing-store pixels distinct.
- For crisp pixel art, select `imageSmoothingEnabled = false` where intended, appropriate
  integer-aligned source and destination coordinates, and consistent zoom. Sub-pixel drawing
  can cause filtering/aliasing or extra work, but rounding every camera coordinate can damage
  smooth movement; validate appearance before adopting coordinate snapping.
- Sprite atlases can reduce binding/draw overhead, but using a single massive atlas may hurt
  memory and update behavior. Cache stable sprites and pre-scaled variants only if measurements
  justify memory cost and correct DPR/zoom variants.
- Avoid unnecessary per-frame resizing of `canvas.width/height`; changing dimensions resets
  context state and may reallocate backing storage.
- Avoid per-frame DOM measurements and layout reads mixed with writes when working on HUDs.
- `alpha: false` on a fully opaque canvas can be worth testing; it is not suitable if the
  canvas must composite transparently with underlying DOM or layers.

## 4. Layer, chunk and cache ownership

Layer choices to measure:

- **Static background**: DOM/CSS background or cached Canvas layer if truly unchanged.
- **Terrain/chunks**: render cached tiles; invalidate local chunks after modifications.
- **Dynamic world**: characters, particles, moving props, fluids and destructible pieces.
- **HUD**: redraw only on changed status, while preserving appropriate visual animations.

Document which system invalidates which cache. A terrain edit, destruction event, palette
change, zoom, viewport resize and devicePixelRatio change may require different invalidation.
For physics sand/fluid games, a dirty-grid analysis may offer large gains, but **never** skip
simulation of cells simply because a visual region did not change. Dirty simulation and dirty
rendering are separate concepts.

## 5. OffscreenCanvas / workers — conditional route

- `OffscreenCanvas` can decouple rendering work from the main thread on supported platforms,
  but moving to a worker is an architectural change, not a default performance tweak.
- Check context and worker support, ownership of the transferred canvas, transferability of
  resources, message batching, viewport resize, input forwarding, font/image readiness and
  loss/recovery behavior. `transferControlToOffscreen()` is not suitable when the HTML canvas
  already has an initialized context.
- A worker may improve main-thread responsiveness yet leave total raster/GPU time unchanged;
  measure both input latency and frame pacing.
- Do not duplicate world state, introduce a new deterministic timebase, or relocate physics
  without explicit project authorization.

## 6. Sample checks for a before/after pass

- Same camera, zoom, DPR, window size, seed, actor counts, active animation/effects.
- Check static, scrolling, zooming, fullscreen effects, dense particle scene, UI interactions.
- Test damage/destruction and tile edits to catch incorrect cache invalidation.
- Verify touch/mouse hit testing after any resolution or layer change.
- Check screenshots at native resolution and inspect pixel edges, text and color blending.
- Observe memory growth after repeated resizes, scene transitions, cache rebuilds.
- Report differences in frame intervals and CPU traces; do not invent GPU timing.

## Official documentation (checked 2026-10-22)

- MDN optimizing Canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- MDN OffscreenCanvas control transfer: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen
- MDN rAF / refresh behavior: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Chrome Performance: https://developer.chrome.com/docs/devtools/performance/overview
