---
name: threejs-animation-systems
description: Use for Three.js AnimationMixer, clips, skeletal animation, blending and runtime animation lifecycle; not GLB export validation.
---
# Three.js Animation Systems — clips, state and lifecycle

**Scope:** animation playback, transitions and state control for existing GLB
characters in an existing game. Do not take ownership of the renderer,
physics, character controller, main loop or scene initialization.

## Workflow

1. Inspect `three` version and model `gltf.animations` names/durations/tracks.
   Missing clips are normal for static GLBs; treat gracefully.
2. Identify animation authority and existing update subscription. Call
   `mixer.update(dtSeconds)` once per active mixer per authoritative update.
   Never install a nested `setAnimationLoop`/RAF; clamp or handle tab throttling
   according to game architecture, not arbitrarily.
3. Create one mixer per independent animated root, with its own clip actions.
   When instancing skinned GLBs use SkeletonUtils correctly (runtime skill).
4. Maintain explicit `currentAction` and `currentState`; fade from the active
   action only. Validate transitions, duration, clip existence and identity.
5. Separate visual locomotion from Rapier/controller movement. Do not blindly
   apply glTF hip/root track translations as movement authority; document root
   motion extraction and retargeting explicitly before enabling.
6. Handle one-shot finished events, interruption, paused state, replay and
   unknown states. Apply loop modes and clip cancellation intentionally.
7. On despawn remove listeners, stop actions, `mixer.uncacheRoot(root)`,
   unsubscribe updates; avoid lingering mixers retaining skeletons.
8. Test `node --test tests/*.test.mjs` and real Three.js integration with your
   project's actual clips; report mock tests vs runtime checks separately.

## Included implementation

- `examples/animation-controller.mjs` — dependency-injected, tested controller.
- `examples/integrate-three.mjs` — integration template; project update registry
  is an explicitly marked placeholder, not a Three.js API.
- `references/animation-fsm.md` — transitions, interruption, one-shots, root motion.
- `references/animation-qa.md` — regression checks and test matrix.
- `assets/REPORT_TEMPLATE.md` — acceptance record.

**Limits:** example controller supports one active logical state with blending,
not layered animations, per-bone masks, retargeting or deterministic event
replay. Add those only after confirming game requirements and available rigs.

## Exit criteria

Each intended clip exists and plays, transitions begin from the actual active
clip, multiple characters advance independently, timers use seconds, pause/
resume and one-shots work, no leaked listeners after despawn and no changes to
movement/physics unless explicitly approved. Rendered test is required for a
production-ready claim.

## Official references

- https://threejs.org/docs/pages/AnimationMixer.html
- https://threejs.org/docs/pages/AnimationAction.html
- https://threejs.org/docs/pages/module-SkeletonUtils.html
- https://threejs.org/docs/pages/Timer.html
