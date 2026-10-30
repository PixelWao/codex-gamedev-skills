# Profiling, common fixes and budget policy

This reference provides troubleshooting checkpoints, profiler entry points, and change
selection criteria for game-engine performance. Interpret metrics in the context of the
actual pipeline and installed toolchain; don't assume identical profiler behavior between
engine versions or build configurations.

## 1. First-pass decision tree

1. Is the problem reproducible on a production-like build and relevant hardware? If not,
   capture the reproducible case first and label current evidence incomplete.
2. Is performance limited by an FPS cap or display refresh? If yes, a flat FPS figure cannot
   reveal headroom; use traces and an appropriate unlocked/controlled diagnostic scenario.
3. Are bad frames primarily CPU/main-thread, GPU, GC, loading, or some combination? Confirm by
   profilers/counters and controlled perturbations. A single “GPU > CPU” threshold is not
   reliable with async pipelines, queues, VSync, and incomplete browser timing APIs.
4. Can work be *eliminated*, bounded or updated less often **without gameplay changes**?
5. Can compatible rendering work be merged, instanced, culled or simplified? Assess CPU and GPU
   costs separately; batching might improve submission but increase visibility granularity.
6. Is the improvement statistically/stably visible across comparable runs and platforms?
   Otherwise revert or continue diagnosing.

## 2. Engine-specific profiler entry points

### Godot 4.x

- **Debugger → Profiler** for script/physics time; **Debugger → Monitors** for process/physics,
  draw calls, objects and memory. Inspect live/export build differences.
- `Performance.get_monitor(...)` exposes relevant monitor values. Consult the local Godot API
  for exact `Performance` monitor enum identifiers and units; do not blindly paste symbols
  from a different minor version.
- For render-server cost, identify viewport rendering and visibility; for physics cost,
  coordinate with the physics-specific workflow while keeping fixed tick semantics.
- `MultiMesh`/`MultiMeshInstance2D`/`MultiMeshInstance3D` can reduce repeated-object submission
  when scene/material patterns support them; inspect culling and per-instance changes.

### Unity 6.x

- **Profiler** CPU Usage, GPU Usage (where supported), Rendering, Memory; **Frame Debugger** to
  inspect actual submissions / batching. **ProfilerRecorder** and frame timing APIs for
  targeted runtime telemetry; check counter availability and units in the installed version.
- Profile a development player build on device, with profiler overhead understood; compare
  also against a non-instrumented production-like build. **Deep Profile** adds substantial
  overhead and is for call attribution, not unbiased frame-time comparisons.
- GC alloc hot paths: reuse buffers, pre-cache component lookups, avoid excess short-lived
  strings, LINQ and accidental boxing in the steady-state loop. Be careful with non-alloc
  physics query semantics and result-buffer sizes. Do not optimize away required events.
- Batching and GPU instancing depend on pipeline, shader/material, static/movable state and
  culling; verify with Frame Debugger rather than assuming toggling an option will help.

### Unreal Engine 5.x

- `stat unit`, `stat fps`, `stat game`, `stat scenerendering`, and where supported `stat gpu` for
  orientation; **Unreal Insights** for timing and traces; GPU profiling for passes and shaders.
- Distinguish Game Thread, Render Thread, RHI submission and GPU; do not combine their times
  naively when diagnosing pipelined workloads.
- For repeat geometry, evaluate Instanced Static Mesh or HISM, visibility, and lighting; use
  Insights to check whether submission, scene traversal or actual GPU rendering improves.

### Browser games

- Read `browser-threejs.md` for WebGL/Three.js/Chrome, or `canvas2d-performance.md` for Canvas.
- Main-thread trace is not proof of GPU work; `requestAnimationFrame` intervals are not a
  profiler of simulation CPU or GPU execution.

## 3. Pooling, allocation and lifecycle

Generic bounded pool:

```text
pool = { free: [], inUse: Set, capacity }
prewarm(n)  -> create up to capacity outside gameplay hot path
acquire()   -> pop a free resource; otherwise create if within allowed policy
release(x)  -> reset ALL state, unregister events, disable collisions/visibility, put into free
shutdown()  -> dispose owned resources; unregister listeners; clear retained references
```

Use for *frequently created, short-lived and reusable* entities: bullets, effects, floating
numbers, temporary UI. Consider pool limits/overflow behavior, prewarm cost, memory footprint,
reset correctness, entity identity, textures and audio. A pool can **worsen** memory usage,
introduce stale behavior or increase CPU bookkeeping. Measure allocations + memory + FPS.

C# example idea (adapt to actual engine/version; not a drop-in implementation): cache reusable
hit buffers for supported nonalloc physics queries and iterate the returned valid hit count.
GDScript: avoid recreating large arrays/dictionaries per `_process` where real profiling shows
churn. JavaScript: avoid fresh object creation and string churn in measured hot sections,
but do not replace idiomatic code with complexity unless heap/GC traces justify it.

## 4. Batching, instancing and other rendering fixes

- Material/texture/state changes, geometry types, pass structure and render ordering affect
  batching opportunities. **One mesh ≠ always one draw call**, and **one material ≠ always one
  draw call**; shaders, instances, passes and transparency change the relationship.
- **Instancing:** use for many objects sharing compatible geometry/material, with per-instance
  transforms/attributes. Check CPU matrix-buffer updates, instance count and culling granularity.
- **Atlases:** reduce compatible sprite texture changes; consider bleeding, filtering/mipmaps,
  atlas upload/update cost, animation formats and batching order.
- **Static grouping:** share/bake stationary geometry only if transform and ownership remain
  valid; avoid rebuilding huge geometry after each minor edit.
- **GPU work:** inspect overdraw (transparency, particles), postprocess bandwidth, material
  cost, shadow casters/resolution, pixel ratio, dynamic lights and large render targets.
- **LOD/culling:** test whether skipping offscreen/distant objects saves real work; never cull
  gameplay logic inadvertently. Occlusion queries and LOD transitions have costs too.

Reducing draw calls can improve CPU render submission and sometimes GPU processing; **measure
both outcomes where possible**. Never describe draw-call reduction as inherently a GPU-only
optimization.

## 5. Algorithmic wins that respect gameplay

- Prefer O(n log n) or localized queries over O(n²) pair checks, if semantics remain identical.
- Spatial partitioning: grid / quadtree / octree; measure insertion/update and query costs.
- Memoize derived values with correct invalidation and bounded caches; stale results are bugs.
- Run asynchronous/non-critical tasks less frequently only when permissible: telemetry,
  decorative particles, editor previews, offscreen non-gameplay UI. **Do not** skip input,
  network reconciliation, collision steps or deterministic gameplay updates to improve FPS.
- Incremental loading and deferred compilation reduce hitches but can increase perceived
  loading time, stall first use or hold resources longer; benchmark transitions too.

## 6. Budgets: what is legitimate

Frame deadlines are mathematical: 30/60/120 Hz correspond to approximately 33.33/16.67/8.33 ms
per display interval, respectively. **No universal draw-call or triangle limit exists** across
hardware, browsers, scenes or renderers. Texture dimensions alone do not predict memory;
format, compression, mips, layers, render targets and DPR also matter.

Set a **budget sheet** for each target hardware class and representative level:

| Budget | Track | Acceptance principle |
| --- | --- | --- |
| Display frame pacing | p50/p95/p99/worst ms, over-budget % | target-specific, measured |
| Main-thread CPU | per-subsystem traces/timers | regressions must be explained |
| Physics/simulation | fixed-step CPU and max steps | no lost/doubled simulation steps |
| GPU | valid timer queries or GPU profiler | do not infer exact GPU ms from rAF |
| Render submission | renderer calls, submit CPU ms | lower count only useful if total time improves |
| Memory | retained heap, geometry/texture counts, GPU resources where available | stable plateau after repeated cycles |
| Loading | time-to-interactive, max transition hitch | user-visible cost explicit |
| Mobile sustained | time/fps after warm and prolonged play | thermal throttling test |

A starting **hypothesis** can use 16.67 ms @60 FPS plus operational headroom, but do not assign
immutable “scripts=5ms, physics=3ms” splits or universal desktop/mobile mesh budgets.

For device-specific mobile tests, run long enough to reveal thermal behavior, and note charging,
ambient conditions, power-saving mode, background apps and display refresh rate.

## 7. Vendor documentation to verify on each project

Exact counters and tuning switches evolve. Consult the authoritative documentation for the
version actually installed rather than relying on memorized names or guessed defaults:

- https://docs.godotengine.org/en/stable/tutorials/scripting/debug/the_profiler.html
- https://docs.godotengine.org/en/stable/classes/class_performance.html
- https://docs.unity3d.com/Manual/Profiler.html
- https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-insights-in-unreal-engine
- https://developer.chrome.com/docs/devtools/performance/overview
