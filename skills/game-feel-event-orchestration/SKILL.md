---
name: game-feel-event-orchestration
description: Use to coordinate hit-stop, camera impulses and prioritized feedback events without owning camera, audio or physics systems.
---
# Game Feel — Event Orchestration

Use this skill when feedback is disconnected, causes pause conflicts, duplicated events, camera jitter or too many effects. This skill **does not** implement gameplay physics, input buffering, damage, camera tracking, shaders or an audio engine.

## Resources
- `src/feedback.mjs` + `.d.mts`: actual JS runtime and TypeScript declarations.
- `examples/demo.mjs`, `examples/typed.mts`: working examples.
- `references/time-policy.md`: clocks, overlap, cleanup and event budgeting.
- `references/integration.md`: Canvas 2D / Three.js / Godot / Unity / accessibility adapters.
- `tests/feedback.test.mjs`: automated regressions.

## Workflow
1. Inspect the project's loop, simulation time owner, physics backend, camera pose owner, VFX/audio systems and event IDs. Do not add another rAF or another renderer.
2. Hook discrete collision/attack/pickup/dash events with globally stable ID, monotonic **unscaled** `atMs`, tier and optional world position. Aggregate dense debris contacts before dispatch.
3. Create `HitStopManager({baseScale,applyScale,onTrace})`. `baseScale` must return the **external baseline policy** (pause/slow motion), never the feedback-modified effective scale. Tick it with monotonic real time even while game simulation is stopped. Overlapping requests use minimum active multiplier; each has its own deadline.
4. Create `TraumaShake` and `FeedbackDirector` with callbacks to existing audio, VFX, UI systems. The director only emits effects; it does not claim those subsystems' ownership.
5. Compose shake as a temporary **visual delta** on the frame's base camera pose. Never mutate rigid bodies or authoritative aim rays. Use `composeVisualCamera` for 2D; see Three.js adapter notes for 3D.
6. Read `prefers-reduced-motion` where available and explicit user settings. `reducedMotion` suppresses shake, flashes, particles; `allowFlashes=false` prevents flashes independently. Use nonflashing cues for important gameplay information.
7. Set event/particle budgets, sort simultaneous events by importance before dispatch when priority matters, and enforce deduplication. Trigger feedback once per *impact*, not once per frame of a held attack.
8. Call `dispose(realMs)` on scene teardown; it restores the **current external** baseline, not hardcoded `1.0`.
9. Run tests (`node --test tests/*.test.mjs`), typecheck (`tsc -p tsconfig.json`), integrate QA traces and verify in real browsers. Report mock vs real results separately.

## Minimal integration
```js
const hitstop = new HitStopManager({
  baseScale: () => game.clock.baseScale,
  applyScale: value => game.clock.setEffectiveScale(value)
});
const shake = new TraumaShake();
const feedback = new FeedbackDirector({
  hitstop, shake,
  sinks: { audio:e => game.sfx.play(e.cue), particles:e => game.vfx.burst(e.position,e.count) }
});
// In the EXISTING game render loop:
hitstop.tick(realNowMs);
const cameraDelta = shake.sample(realDtSeconds, realNowMs/1000);
// Only apply the delta to presentation. Base game camera and physics remain unchanged.
```

## Acceptance
Prove concurrent hit-stops, external slow-motion restoration, repeated events, 30/60/144fps independence and reduced-motion toggle. Never claim user comfort, GPU performance or game-specific integration without actual testing.

New material: MIT Copyright (c) 2026 Waldemar Soroka; original Apache-2.0 license and attribution in `PROVENANCE.md` and `attribution/upstream/`.
