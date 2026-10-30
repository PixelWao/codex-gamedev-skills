---
name: threejs-camera-rigs-3d
description: Use for Three.js orbit, third-person, RTS, cinematic framing, collision-aware 3D cameras and Rapier adapters; not Canvas 2D.
---
# Three.js Camera Rigs 3D

Respect the existing `threejs-scene-setup` owner of the renderer and loop, and the existing physics engine owner of collision queries. Inspect Three.js and Rapier versions before selecting API calls. A camera rig should compute a *pose*; the game decides when to apply it.

## Procedure

1. Find the active camera(s), controls (OrbitControls/custom), update order, frame interpolation and collision rules; record the current user input mappings and camera projection settings.
2. Separate three positions: simulation target, smoothed focus, and visual camera pose. On teleports, hard reset focus and interpolation history. Do not use the same smoothing twice.
3. Use `scripts/rig3d.mjs` to produce orbit yaw/pitch pose and apply it to the existing `THREE.Camera` using `applyPoseToThreeCamera`. One rig must own one camera transform at a time; do not allow OrbitControls and custom rig to fight over that transform.
4. Implement *collisionQuery* against existing static and dynamic colliders, excluding the player and sensors. Start with a ray, then prefer a shape sweep or near-plane-aware collision for production camera clearance; do not assume a ray protects camera corners.
5. For multi-target framing, start with `groupFraming` **only in world-aligned view**. It is an approximation for a camera looking toward the chosen frame center along world Z. For arbitrary orientation project bounding corners into camera right/up/depth axes and solve for FOV and nearest depth. Include target radii and motion padding.
6. For strategic camera bounds use `clampTarget`, adjust for zoom/visible frustum as required by design, and permit scripted temporary overrides for cinematics.
7. Respect resize: change `PerspectiveCamera.aspect` or orthographic width and run `updateProjectionMatrix()`. When OrbitControls is used, call its `update()` as required and `dispose()` on teardown; never create a second loop.
8. Verify occlusion cases, tight corridors, cliffs, high-speed movement, target loss, camera cuts, resize, and FPS stability. Run `node --test tests/*.test.mjs`.

## Included resources

- `scripts/rig3d.mjs` — renderer-agnostic orbit rig and framing math, and explicit Three.js camera adapter.
- `scripts/rig3d.d.mts` — TS contracts.
- `examples/rig-integration.mts` — typechecked integration sketch.
- `references/rapier-and-threejs.md` — adapter contracts and engine-version issues.
- `references/godot-unity.md` — SpringArm3D and Cinemachine comparisons.

## Safety and edge cases

- Rapier query direction and distance units must agree with Three scene scale. Use the installed Rapier library and **actual API signature**, not a guessed `castShape` call.
- A collisionQuery must return `null` for clear, a finite nonnegative hit distance for blocked. A hit inside the min-distance zone pulls the camera to configured minimum; consider a fallback character outline/fade to preserve visibility.
- Clamp the focus rather than moving physics entities. Camera yaw/pitch are independent inputs, pitch clamped away from poles.
- Do not render or dispose meshes in this skill; imported/shared scene resources are owned elsewhere.
- Note what is math-only tested and what still requires integration/visual QA.
