---
name: threejs-scene-setup
description: Use to configure or debug Three.js renderer, scene, camera defaults, resize handling, render loop and resource ownership.
---
# Three.js Scene Engineering

## Contract

**First inspect, then integrate; never silently replace an existing engine.** This skill supplies an architecture workflow and testable, dependency-injected ES modules. Do not treat example code as permission to recreate the user's render loop, physics world, asset registry, inspector, Undo/Redo, or serialization.

1. Read the project's `AGENTS.md`, lockfile/package versions, scene ownership conventions and existing tests. The source archive used for this modernization references Three.js **r180**; its old examples targeted r186. Use *installed* version, not either assumption. See [Version and integration](references/version-and-integration.md).
2. Find the single owner of `renderer.setAnimationLoop`, `requestAnimationFrame` and physics stepping; identify continuous gameplay versus static editor. Reuse the existing loop if one exists. See [Frame loop and lifecycle](references/frame-loop-and-lifecycle.md).
3. Locate the real viewport container, camera and pointer target. Determine CSS size, backing-buffer size, DPR limits and projection rules. See [Viewports, cameras and input](references/viewports-cameras-input.md).
4. Audit graph invariants: parent/local/world transforms, persistent IDs, prefab/editor events, physics sync and pick coordinates. See [Scene graph and editor](references/scenegraph-and-editor.md).
5. Trace assets from creation/import to release. *Never recursively dispose arbitrary meshes.* Registry ownership must be consistent with glTF loading, material libraries and texture caches. See [Resource ownership](references/resource-ownership.md).
6. Make **one minimal change**, collect evidence before and after, run QA and report limitations. See [QA protocol](references/qa-protocol.md).

## Scope

**Use for** renderer initialization, WebGL canvas debugging, scene/camera setup, resize, controls, picking transforms, render scheduling, scene creation/destruction and context-loss strategy.

**Delegate (if installed)** asset import to `threejs-gltf-runtime`, animations to `threejs-animation-systems`, PBR/light management to `threejs-pbr-materials` and `threejs-lighting-shadows`, GPU optimization to `performance-optimization`, and shader authoring to `shader-core-glsl` / `threejs-tsl-webgpu`. Never require these other skills to exist or create hidden dependencies.

## Critical invariants

- Exactly **one owner** of the continuous rendering callback per renderer. Do not install `setAnimationLoop()` inside a loader, control handler or scene module.
- Never call or resize renderers from a zero-size or hidden viewport without explicitly handling it. Call `camera.updateProjectionMatrix()` after camera projection changes.
- Fixed physics steps belong to the physics subsystem; rendering only consumes interpolated states. Do not add a second physics accumulator.
- Editor with no live animation: schedule actual single frames only when dirty. Continuous animations/XR require the project's primary loop, not a second scheduler.
- Dispose event listeners, controls, observers and renderer on **owner teardown**. Release GPU resources only after the **last owning lease**; do not treat every scene node as owner of shared textures/materials.
- If editing hierarchy with world-preserving reparent, `Object3D.attach()` is only appropriate where transform limitations (especially nonuniform ancestors) are satisfied.
- Preserve existing editor IDs, save schema, prefab references, undo history, physics mappings and observable scene semantics.
- Do not auto-switch WebGLRenderer to WebGPURenderer; WebGPU requires feature and shader/material compatibility checks.

## Provided working utilities (no external JS dependencies)

| Module | Purpose | Guardrails |
|---|---|---|
| `scripts/frame-coordinator.mjs` | Clamped delta and pause/resume; optional explicit ownership of continuous loop; genuine on-demand scheduling | Won't install a loop without explicit ownership confirmation |
| `scripts/viewport-controller.mjs` | ResizeObserver, container-relative perspective/ortho projection, capped DPR and pixel budget | Zero-size guard, listener cleanup |
| `scripts/resource-scope.mjs` | Reference-counted leases for *explicitly owned* disposable objects, plus cleanup stack | Does not traverse/dispose unowned objects |
| `scripts/scenegraph-helpers.mjs` | Pointer NDC conversion and guarded world-preserving reparent | Rejects nonuniform ancestor scaling |

For an audit of a real project, run `node scripts/version-audit.mjs /path/to/project` and reconcile its findings with pnpm/yarn/Vite config where relevant. This script is an advisory **static checker**, not full package resolution.

Run from the skill folder:

```sh
node --test tests/*.test.mjs
python3 scripts/validate_skill.py .
```

Open the reference example in `examples/demo/` via an HTTP static server (not `file://`). It uses an import map pinned to Three.js **0.180.0**; replace with a *single* compatible version or use the project's bundler. Browser execution requires networking for the demo CDN and working WebGL; node unit tests do not.

## Implementation recipes

### Integrate a game that already owns its loop

```js
import { createFrameCoordinator } from './scripts/frame-coordinator.mjs';
const sceneFrame = createFrameCoordinator({
  update: (dt) => { controls.update(); /* game simulation is elsewhere */ },
  draw: () => renderer.render(scene, camera),
});
// Existing engine: call sceneFrame.tick(timeMs) from its ONE primary loop.
// Do NOT install another setAnimationLoop here.
```

### Bootstrap a NEW standalone scene only

```js
import { installOwnedAnimationLoop } from './scripts/frame-coordinator.mjs';
const stop = installOwnedAnimationLoop({ renderer, coordinator: sceneFrame,
  confirmExclusiveOwnership: true }); // caller audited exclusive ownership
// Stop once on full teardown: stop(); sceneFrame.dispose();
```

### True render-on-demand in a static editor

```js
import { createDemandScheduler } from './scripts/frame-coordinator.mjs';
const schedule = createDemandScheduler({
  requestFrame: (fn) => requestAnimationFrame(fn),
  cancelFrame: (id) => cancelAnimationFrame(id),
  updateControls: () => controls.update(),
  draw: () => renderer.render(scene, camera),
});
const dirty = () => schedule.invalidate();
controls.addEventListener('change', dirty); // damping can queue another frame
schedule.invalidate();
// On teardown: controls.removeEventListener('change', dirty); schedule.dispose();
```

Use no continuously running `setAnimationLoop` in this editor pattern. Pure demand scheduling is **not** appropriate while the scene has continuous animations, a live physics simulation or WebXR.

## QA definition of done

- Change works at the installed Three.js version and project backend; no new game-loop, physics, save or asset-manager owners.
- Validate viewport after panel drag, DPR change, hidden/show, mobile rotation and camera switch.
- Run unit tests, scene mount/unmount tests, picking tests and reference screenshots on at least one real GPU-capable browser when possible. Test an actual WebGL context loss if applicable.
- Check scene disposal for N repeated loads and for shared materials/geometry surviving removal of one instance.
- Record test status explicitly as **passed / failed / skipped**. `node --check` and mock tests are not evidence of real GPU render correctness.
- If any benchmark or browser test is unavailable, say so in the QA report rather than claiming it passed.

See [Sources and version evidence](references/sources.md), [QA protocol](references/qa-protocol.md) and `assets/QA_REPORT_TEMPLATE.md`.
