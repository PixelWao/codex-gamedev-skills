# Animation state machine engineering

## State chart

`Idle ↔ Walk ↔ Run`; `Attack` and `Hit` are interruptible one-shots;
`Death` is terminal unless respawn resets the controller. Encode rules in the
*game's* state machine, not a guessed global map. Source of truth for movement
remains the character controller/physics system, not baked glTF root offsets.

## Important details

- `AnimationMixer` plays a root's clips. Reuse the mixer and action cache.
- Cross-fade only from currently active action. A transition into the same
  action should preserve phase unless restart is explicitly intended.
- `reset()` on incoming actions is appropriate for a new action, but not for
  continuous locomotion replay where phase continuity is desired.
- One-shots: `LoopOnce`, `clampWhenFinished=true`, listen for mixer's `finished`
  event, verify `event.action` refers to current one-shot, remove handler at
  teardown. Interrupted events are not necessarily `finished`.
- Animation tracks may contain root translation. If physics drives the root,
  use explicit root-motion extraction or author clips in-place; otherwise the
  skinned character can appear to slide or fight the rigid-body transform.
- Re-target only on compatible skeletons with verified rest poses, scales,
  humanoid naming and expected bone mapping; test visually before release.
- For many NPCs, measure cost of mixer's independent updates vs shared group
  animation and offscreen policies. Do not skip updates if gameplay state
  depends on event timings unless the game handles that intentionally.

## Update authority

The project's single update scheduler passes seconds to `controller.update`.
Do not create a timer per character or replace existing RAF. With Three.js
`Timer`, call `update(timestamp)` once per app frame, optionally connect to
`document` to handle hidden tabs. If the simulation is deterministic fixed-step,
keep animation timing policy consistent with game tick and playback needs.
