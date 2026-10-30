---
name: performance-optimization
description: >-
  Use to profile and improve game FPS, CPU/GPU cost, frame pacing, memory, Canvas or Three.js rendering without gameplay changes.
---
# Game performance optimization — measured, regression-safe

## Contract

Optimize only **after establishing a measured baseline**. Change one bottleneck at a time,
re-measure under comparable conditions, and **keep or revert according to evidence**. Preserve
visual correctness, input latency, simulation semantics, deterministic behavior, save formats,
scene ownership, accessibility, and gameplay behavior. Never treat a profiler guess, a lower
draw-call count, or an unmeasured FPS claim as proof of improvement.

The golden loop is **reproduce → instrument → locate → hypothesize → change → validate → compare
→ retain/revert**. Prefer doing less work (algorithmic improvement, incremental computation,
spatial indexing, caching) before clever per-instruction micro-optimization.

## Activation and routing

- Trigger on performance diagnosis/optimization requests for games, game editors and renderers.
- **Browser / Three.js / WebGL:** read `references/browser-threejs.md`.
- **Browser / Canvas 2D / pixel art:** read `references/canvas2d-performance.md`.
- **Any engine:** read `references/profiling-and-budgets.md`.
- **Before benchmarks / comparing versions / reporting numbers:** read
  `references/benchmark-protocol.md`, then use `assets/performance-report.md`.
- **Physics-specific problems:** coordinate with `physics-core` and the relevant 2D/3D physics skill if installed, but maintain
  physical invariants here. Do not silently fix a performance issue by modifying physics.
- For a user's existing project, **inspect `AGENTS.md` and local versions first**. The repo's
  architectural rules and source code take precedence over examples in this skill.

## Project invariants — mandatory

1. Inventory existing application lifecycle: game loop, render loop, fixed-step simulation,
   input, UI, physics world, worker boundaries, scene/resource owners, serializers.
2. **Do not create a second render loop, physics world, state store or persistence format.**
   Instrument existing loops and systems at their existing ownership boundary.
3. Keep logical time, fixed-step accumulators, input event order, collision behavior, and
   deterministic seeded runs unchanged unless the user explicitly authorizes a redesign.
4. For a game editor: preserve node graph / inspector contracts, history/undo/redo,
   scene deserialization, asset-library ownership, exports and all supported viewport modes.
5. Check local Three.js declarations/source (e.g. r180) before copying examples that may
   target a different release or renderer backend. Don't substitute WebGPU metrics for WebGL.
6. Make isolated, reviewable changes. Avoid mass refactors during a performance-only task.
7. Stop and report when the bottleneck cannot be measured on available hardware; propose a
   test plan rather than inventing before/after values.

## Execution workflow

### 1. Establish a benchmark contract

Record: target hardware and OS; browser/engine and build/version; resolution and device pixel
ratio (DPR); graphics quality/VSync/frame cap; input mode; scene/seed; active actors, objects,
physics bodies, lights/effects; test duration; target frame budget. Identify at least one typical
scene and one **repeatable worst case**. Work with a production-like optimized build when
possible. For a browser, record browser version, whether DevTools is open, power state and tab
visibility. Use consistent CPU/GPU throttling settings if testing with throttling.

Budget examples: **30 FPS ≈ 33.33 ms**, **60 FPS ≈ 16.67 ms**, **120 FPS ≈ 8.33 ms** per displayed
frame. Budgets are targets, **not** proof that each subsystem consumes a fixed portion of the
frame. CPU and GPU work overlap; don't add their elapsed times as if always sequential.

### 2. Collect baseline evidence

- Record frame interval distribution: p50, p95, p99, worst interval, over-budget percentage,
  and long-frame counts. FPS averages alone can hide spikes.
- Capture traces/counters for CPU main thread, script/logic, physics, render submission,
  browser style/layout/paint/compositor (if relevant), draw calls, resolution, resource counts,
  GC and memory. Record actual GPU timing **only when supported and valid**.
- Separate the **display/frame interval** (e.g., successive `requestAnimationFrame` timestamps),
  **CPU function duration**, **CPU render submission**, and **GPU execution duration**.
  None of these is a drop-in substitute for the others.
- Treat VSync, frame caps, tab throttling, recording overhead and laptop power modes as possible
  confounders. A capped 60 FPS run can conceal unused headroom.

### 3. Triage bottleneck with evidence

| Evidence | Likely path to investigate | Verify before acting |
| --- | --- | --- |
| Long JS tasks / high main-thread CPU | scripts, AI, physics, allocations, DOM/UI rebuilds | call tree/trace and subsystem timers |
| GPU time high (measured) or strong resolution sensitivity | fill rate, overdraw, shadows, postprocess, shaders | controlled resolution/effect comparison |
| High render submit CPU, many calls/state changes | draw-call orchestration, scene traversal, materials | CPU flame chart + renderer counters |
| Periodic GC pauses / rising retained heap | allocations, retained references, pools, listeners | heap snapshots + allocation timeline |
| Spikes during spawn/load/scene change | uploads, shader compilation, asset decode, instantiation | mark event and trace first occurrence |
| FPS capped with spare CPU/GPU | VSync / limiter / display refresh | change test conditions safely |

**Do not assume** “high draw calls = GPU-bound.” Draw-call preparation and driver submission
can be CPU-limited; draw count alone is not a timing measurement. The effect of reducing it
must be verified on total frame pacing. Browser measurements may not supply a clean CPU/GPU
split; explicitly mark the diagnosis as provisional where necessary.

### 4. Choose one hypothesis and smallest reversible change

Examples, selected only when the evidence supports them:

- **Algorithmic / scheduling:** avoid full-scene iteration, repeated pathfinding, O(n²)
  interactions; memoize with correct invalidation, use spatial queries or stagger independent
  background tasks without changing gameplay timing.
- **Memory / garbage collection:** stop needless transient allocations in hot paths; reuse
  buffers; use bounded object pools **only when lifecycle and reuse are safe**. Pools trade
  memory and complexity for allocation pressure; do not introduce unlimited pools.
- **Rendering submission:** share compatible materials/geometries, atlas where appropriate,
  instance truly repeated meshes. Dynamic instancing still has update/culling tradeoffs.
- **GPU rendering:** test pixel ratio, fill rate, expensive transparency, shadow maps,
  postprocessing, texture bandwidth, shader complexity. Never lower visual quality silently.
- **Loading spikes:** separate eager compilation/prewarming, incremental uploads, or cached
  assets from gameplay-critical scheduling and test the resulting latency/memory tradeoff.

Give each proposed change a hypothesis, expected impacted metric, visual/behavioral risks,
rollback method and concrete acceptance criterion before implementation.

### 5. Compare, validate, decide

Re-run baseline and candidate with **the same** scene, seed, hardware, config, warm-up and
sample policy. Prefer repeated A/B or A/B/A comparisons to detect thermal drift and noisy
machines. Report p50/p95/p99, over-budget ratio, relevant subsystem time, and counts; use
relative deltas only alongside raw measurements and sample sizes. Check correctness via
existing tests and in-game smoke/regression scenarios (input, camera, save/load, physics,
visual snapshots). Revert changes that regress outcomes, add complexity without measurable
benefit, or violate invariants; note uncertain results as inconclusive.

If a change helps only in an isolated microbenchmark but not in the full scene, do not report
it as a frame-time win. If measurements were not possible, label each expected effect as a
**hypothesis**, not a verified result.

### 6. Budget and deliver

Use budgets suited to the device, scenes and product; calibrate texture/triangle/draw-call
limits empirically rather than treating generic numbers as universal caps. Add a lightweight
regression test and explicit acceptable variance once hardware noise is characterized.

Deliver a report in `assets/performance-report.md` format including baseline environment,
reproduction, evidence, diagnosis, files changed, numerical comparison, functional checks,
tradeoffs, rollback, and pending uncertainties. Explicitly distinguish **measured**,
**inferred**, and **not measured**.

## What to avoid

- Optimizing before collecting a representative trace; optimizing only average FPS.
- Using the same number for frame interval, JS execution time, CPU submission and GPU time.
- Claiming that reducing draw calls automatically reduces GPU time.
- Shipping benchmarks obtained only with DevTools heavy instrumentation as unbiased timings.
- Profiling editor/debug builds as the sole release evidence.
- Running costly console logging or synchronous GPU readbacks every frame.
- Triggering GC manually to “improve” FPS; suppressing errors or dropping simulation ticks to
  make graphs prettier.
- Increasing pool sizes indefinitely, duplicating assets, or leaking listeners/geometry.
- Changing simulation fixed delta, collision settings, input responsiveness, art resolution or
  functional UI to meet a number without explicit approval and regression checks.

## Materials

- `references/profiling-and-budgets.md`: cross-engine profiling guidance;
  Godot/Unity/Unreal entry points, scheduling, pooling, budgets.
- `references/browser-threejs.md`: Three.js/WebGL, Chrome, resource lifecycle and timing.
- `references/canvas2d-performance.md`: Canvas 2D/pixel art/UI bottlenecks.
- `references/benchmark-protocol.md`: controlled frame-pacing experiment, metric definitions,
  reproducibility, sampling and regression policy.
- `assets/performance-report.md`: reusable QA report.
- `scripts/analyze_frame_times.py`: optional stdlib analyzer for exported frame-interval data;
  outputs descriptive timing statistics, **not** GPU timings.

## Source verification (reviewed 2026-10-22)

Official references and version-specific caveats are linked within the topic files. For Codex
skill structure see https://developers.openai.com/api/docs/guides/tools-skills . For Chrome
tracing see https://developer.chrome.com/docs/devtools/performance/overview . Refresh API
assumptions against the installed engine/browser when working on a project.

## Package license

Original authored materials: **MIT (Copyright 2026 Waldemar Soroka)**. Do not
remove the independent upstream attributions and Apache-2.0 notice bundled in
`THIRD_PARTY_NOTICES.md` and `LICENSES/` when redistributing this adaptation.
