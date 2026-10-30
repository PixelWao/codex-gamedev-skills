# Rendering and engine adapters

Canvas 2D: sample physics-interpolated target, compute authoritative camera pose, then `composeVisualCamera(basePose, visualDelta)` at draw time. Save/restore context. Do not write shake offsets back to the camera solver.

Three.js: preserve camera-rig pose from `threejs-camera-rigs-3d`. Apply shake to visual pivot or recompute view pose from the immutable base transform each frame. Never keep adding offsets frame-after-frame. Pointer aim and collision queries should use authoritative camera/weapon geometry unless recoil semantics explicitly require otherwise.

Rapier/Planck: collisions may produce IDs and contact metadata; never update body transforms from visual shake. Avoid processing a separate feedback event for thousands of resting debris contacts.

Browser accessibility example:
```js
const mq = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)');
const options = { reducedMotion: mq?.matches ?? false, allowFlashes: false };
mq?.addEventListener?.('change', e => { options.reducedMotion = e.matches; });
// Forward policy into feedback.settings. Allow an explicit in-game override.
```

Godot 4 reference: `SceneTree.create_timer(seconds,true,false,true)` uses unscaled time; a timer/coroutine per hit that restores `Engine.time_scale=1` is unsafe if effects overlap. Centralize all requests and preserve the base policy.

Unity / Cinemachine reference: `WaitForSecondsRealtime` avoids scaled timer lockup but doesn't solve concurrency by itself. Cinemachine Impulse uses independent sources/listeners; integrate with that mechanism if project uses it instead of implementing a second camera effect system.

Explicitly disable flashes for photosensitivity; `prefers-reduced-motion` is not automatically sufficient for flash controls. Do not imply screen-reader or playtest validation from unit tests.
