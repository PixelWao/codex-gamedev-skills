---
name: impact-animation-vfx
description: Use for hit flashes, squash/stretch, tweens, damage numbers, particles and Canvas/Three.js impact effects; not hit-stop timing.
---
# Impact Animation / VFX

## Source and tests
- `src/vfx.mjs` / `src/vfx.d.mts`: easing, TweenDirector, ParticlePool, Canvas/Three.js adapters.
- `references/easing-lifecycle.md`: correct tween mathematics and animation conflict rules.
- `references/render-adapters.md`: Canvas 2D, Three.js, Godot/Unity, physics and disposal contracts.
- `examples/demo.mjs`, `examples/typed.mts` and `tests/vfx.test.mjs`.

## Workflow
1. Inspect the project's existing sprite/material animation owner, renderer and particle infrastructure. Extend existing code rather than creating a second render loop or shader pipeline.
2. Add new effects only to **visual child** nodes, never rigid bodies or colliders. Choose a feedback tier from `game-feel-event-orchestration` or an existing event system.
3. Use absolute progress `u=clamp((realMs-startMs)/durationMs,0,1)` and `interpolated = from+(to-from)*ease(u)`. Never ease by repeatedly interpolating from last frame's result. For `outBack`, use the actual overshooting curve.
4. Use `TweenDirector.play(object, property,...)`; one tween owns a `(target,property)`. A replacement cancels the earlier animation. To recover from interrupted effects, preserve the original baseline and call `cancel(...,{restore:true})` or `dispose()`.
5. Use bounded `ParticlePool({capacity})`; `spawn` reports admitted/rejected count. Decay with supplied real milliseconds from existing loop. Aggregate collision contacts (e.g., debris) before VFX emission. Use visual-only particle motion.
6. Canvas: render with `renderCanvasParticles(ctx, particles)` or a custom draw callback. Preserve and restore Canvas state. Three.js: call `syncThreeInstances(existingMesh, particles, makeMatrix)`; caller owns geometry, materials and cleanup. Verify real installed Three.js version and actual GPU performance.
7. For reduced motion, skip or diminish particles and overshoot; for disabled flashes use static outlines/tints. Preserve legibility and input responsiveness.
8. Validate unit tests (`node --test tests/*.test.mjs`), TypeScript (`tsc -p tsconfig.json`) and real-game visual results on target platforms. Send VFX active/count telemetry to `game-feel-debugging-qa`.

## Constraints
No secondary physics engine, renderer, camera, audio or UI system; no new event loop. Never assume the world uses unit-scale sprites. No unlimited allocations, shared mutable screen alpha, or unhandled tween competition.

New materials under MIT ©2026 Waldemar Soroka; keep upstream Apache 2.0 attribution and license.
