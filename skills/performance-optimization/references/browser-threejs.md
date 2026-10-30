# Browser / Three.js / WebGL performance workflow

For a real project, identify the installed Three.js version (`package.json`, lockfile, local
source/API) and renderer (`WebGLRenderer` vs WebGPU/other) first. Examples here target **WebGL**
semantics and may need adjustment for local releases (e.g. r180). Never add a new animation
loop merely to collect telemetry. Observe the existing loop.

## 1. Reproduce and capture browser evidence

1. Collect browser/version, GPU or integrated graphics, power mode, scene, DPR, drawing-buffer
   size, viewport CSS size, WebGL version, extensions, graphics quality, VSync/frame cap and
   scene seed. Record a typical and a deliberately worst-case scene.
2. Profile with **Chrome DevTools → Performance**, inspect Main thread (Scripting, style,
   layout), frames, rendering/compositing and GC. Use CPU bottom-up/call tree for expensive JS
   functions. Advanced paint instrumentation can materially affect performance.
3. Use DevTools **Memory** heap snapshots/allocation instruments for detached DOM, old scenes,
   retained arrays, event listeners and repeated loaded assets.
4. Measure with low-overhead logging/telemetry in non-profiled runs; avoid `console.log()` every
   frame and screenshot/trace instrumentation when obtaining unbiased frame intervals.
5. Separate: JS/physics update ms; renderer submission CPU ms; displayed frame intervals;
   **actual GPU ms only if an extension/profiler supplies a valid asynchronous result**.

## 2. Low-overhead CPU spans within the *existing* loop

```js
// Add only around the existing update/render code; do NOT create another rAF loop.
const t0 = performance.now();
updateSimulation(delta);                   // existing fixed-step / update logic stays intact
const t1 = performance.now();
renderer.render(scene, camera);            // or existing composer pipeline
const t2 = performance.now();
// Append preallocated/ring-buffered samples outside hot allocations if necessary:
recordSample({ simulationCpuMs: t1 - t0, renderSubmitCpuMs: t2 - t1 });
```

`renderSubmitCpuMs` is elapsed time on the JavaScript thread around the renderer call; it is
**not GPU rendering time**. If renderer initialization or external postprocessing happens in
other calls, capture separately and document scope. For DevTools labeling, use
`performance.mark('game-update-start')`, `mark('game-update-end')`,
`performance.measure('game-update', ... )` sparingly during diagnostics; clear stored marks and
measures, or use bounded sampling to avoid measurement overhead.

### Renderer counters — WebGLRenderer

```js
const info = renderer.info;
const drawCalls = info.render.calls;
const triangles = info.render.triangles;
const geometries = info.memory.geometries;
const textures = info.memory.textures;
```

Read at the same point of the frame each time. In multi-pass/postprocessing scenes,
`renderer.info` may reset per render call; use the installed version's documented
`renderer.info.autoReset = false` and reset **once per complete frame** at a coordinated point
if counters need to aggregate multiple passes. Do not change reset behavior without checking
all consumers. `renderer.info.memory` is an approximation of tracked graphics resources,
**not total GPU VRAM**; some internal allocations persist legitimately.

## 3. GPU vs CPU diagnosis

- **High JS update:** find loops/functions, object churn, expensive callbacks, physics queries,
  world graph traversals, per-frame asset conversion, UI relayout and large array copies.
- **High submission CPU / calls:** look at separate material state changes, scene traversal,
  shadow/picking/outline passes and excessive per-object uniforms. Test compatible batching.
- **High actual GPU time:** inspect fill-rate (DPR/resolution), alpha overdraw, transparent
  sorting, shadows, full-screen postprocessing, lights, shader complexity, MSAA and render
  target sizes. A reduction in DPR is a controlled **diagnostic test**, not an automatic fix.
- **Ambiguous:** compare same scene with lower pixel count vs fewer objects and use the Chrome
  trace. GPU queue behavior, VSync and CPU/GPU overlap mean simple elapsed-time subtraction
  does not reveal GPU time.

### GPU timer queries (only when supported)

- In WebGL2 request `EXT_disjoint_timer_query_webgl2`; WebGL1 uses
  `EXT_disjoint_timer_query`. Support is optional, varies by browser/device/context/security.
- Queries should be asynchronous; poll availability later without blocking the GPU. Reject
  samples when the disjoint flag is set, and delete query resources. Overlapping/invalid queries
  are API errors. Avoid a new GPU readback/stall on the main rendering path.
- Such queries time a command range, **not necessarily the entire displayed frame**. Scope,
  queueing and multipass work must be documented.

Do not report fabricated GPU timings if query support is missing.

## 4. High-leverage changes and caveats

| Evidence / pattern | Candidate | Risks / checks |
| --- | --- | --- |
| Many identical meshes | `InstancedMesh` with shared geometry/material | update cost, culling bounds, per-instance transforms/colors |
| Many static meshes with compatible materials | merge static geometry or batch | memory, picking, editability, rebake cost |
| Large render target or high DPR | limit internal resolution or upscale | visual sharpness/UI/text, user approval |
| Too many shadows | reduce shadow updates, selected casters, map sizes | scene aesthetics, animation correctness |
| Transparent particles / overlapping sprites | reduce overdraw via tighter bounds, fewer overlapping layers | ordering and game feel |
| Large numbers of scene nodes | optimize traversal/culling/visibility ownership | interaction & raycasting equivalence |
| Recurring runtime asset creation | reuse geometry/material/texture refs | lifecycle/ref-count and mutation bugs |
| Per-frame model/clips/text rebuild | cache or update only on change | invalidation and correctness |

`InstancedMesh` reduces draw-call overhead for shared geometry/material but is not always a
win (especially small counts or costly instance updates). After `setMatrixAt`/
`setColorAt`, mark the relevant attributes for update per locally installed API. Check
bounding volumes after position changes and ensure raycasting, editor selection and per-object
visibility remain correct. Preserve transforms, normals, material and color behavior.

## 5. Resource lifecycle, leaks and cleanup

- Removing a `Mesh` or an entire scene from the graph does **not** automatically dispose of
  `BufferGeometry`, `Material`, `Texture` and `WebGLRenderTarget` GPU resources.
- Dispose **owned, no-longer-used** resources appropriately; do not dispose shared assets that
  remain in use elsewhere. Keep ownership/reference tracking; dispose passes/composers/controls
  and listeners according to their APIs, and close owned `ImageBitmap`s when applicable.
- Repeatedly create/destroy scene N times; compare retained JS heap snapshots,
  `renderer.info.memory.geometries/textures`, active listeners and app-owned resource counts
  after comparable settled points. It is normal for some internal caches to persist.
- Test cleanup/reload and camera/editor navigation; memory plateau matters more than expecting
  *every* counter to become zero. Asset caching is not automatically a leak.

## 6. Common traps

- Do not create a second `requestAnimationFrame`, `setAnimationLoop` or new physics world to
  monitor performance. Instrument the owner that already exists.
- Do not turn off physics or game logic solely to make render benchmarks look faster; such a
  run can be a **diagnostic A/B**, never reported as the production improvement.
- Do not treat `renderer.info.render.calls` as “GPU frame milliseconds.”
- Do not measure only once after startup (shader compilation / warmup makes early frames noisy).
- Do not add `gl.finish()` or synchronous `readPixels()` in production hot paths to force GPU
  results; they may cause stalls and materially distort the measurement.
- For custom engine editors, never break object selection, node inspector serialization,
  undo/redo, exporting, picking, or scene ownership in an attempt to batch geometry.

## Official documentation (checked 2026-10-22)

- WebGLRenderer.info (check your version): https://threejs.org/docs/#api/en/renderers/WebGLRenderer
- WebGLRenderer reference: https://threejs.org/docs/pages/WebGLRenderer
- InstancedMesh: https://threejs.org/docs/pages/InstancedMesh
- Disposal: https://threejs.org/manual/pages/how-to-dispose-of-objects.html
- Chrome Performance: https://developer.chrome.com/docs/devtools/performance/overview
- Chrome Memory: https://developer.chrome.com/docs/devtools/memory-problems
- WebGL timer query extension: https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query
- User Timing API: https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
