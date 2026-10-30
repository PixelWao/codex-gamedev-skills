# Scene Engineering QA protocol

## Evidence tiers

1. **Static**: YAML metadata, local references, JS syntax, pinning of import map.
2. **Unit / mock**: timing, ownership, DPR, observer cleanup, pointer math, reparent guards.
3. **Real Three.js API**: exact pinned library available, scene/camera/material creation, OrbitControls module import, world transforms.
4. **Browser WebGL/WebGPU**: image rendered, console errors, interaction, repeated load/dispose, context loss and pixel buffers on target GPU.
5. **Game integration**: original project save/undo, physics, editor selection, user inputs, timings and regressions.

**Never mark tiers 3–5 passed solely because tiers 1–2 passed.** Use `passed`, `failed`, `skipped` separately.

## Required test matrix

| Case | Expected |
|---|---|
| Existing game loop | No second loop; one update/render per frame |
| Continuous pause/resume | First post-resume dt=0, no time jump |
| Idle static editor | Zero queued frames when scene is clean |
| 0×0 hidden panel | No invalid camera matrix or NaN |
| Dock panel resize | Aspect corrected without CSS distortion |
| DPR/pixel budget | Drawing resolution within declared cap |
| Shared material + geometry | Removing one instance does not dispose shared resources |
| OrbitControls mount/unmount | No accumulating DOM listeners |
| Perspective/ortho switch | Correct projected view and picking |
| Reparent | World pose preserved where supported |
| r180 module compatibility | No r183-only `Timer` assumed |
| WebGL context loss | Correct recovery/no duplicate renderers (real browser required) |
| Repeated scene lifecycle | No monotonically increasing resource leaks |

## Test commands

```sh
node --test tests/*.test.mjs
node --check scripts/frame-coordinator.mjs
node --check scripts/viewport-controller.mjs
node --check scripts/resource-scope.mjs
node --check scripts/scenegraph-helpers.mjs
node --check examples/demo/main.mjs
python3 scripts/validate_skill.py .
node scripts/version-audit.mjs examples/demo
```

For browser QA: serve `examples/demo/` with a local HTTP server, verify network can resolve its pinned Three.js CDN, open on a GPU-capable browser, manually resize the editor pane and observe console errors. Browser render correctness and version compatibility **cannot** be proven by a Node mock alone.

Record a QA report using `assets/QA_REPORT_TEMPLATE.md`; state environment, installed Three.js release, actual backend, test seed/scene, results, skipped tests and follow-up work.
