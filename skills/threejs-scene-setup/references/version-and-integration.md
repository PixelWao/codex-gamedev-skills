# Version gate and integration audit

## Mandatory preflight

1. Inspect `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` or import maps; resolve **actual installed** `three` dependency, not the requested semver range alone.
2. Search for `new WebGLRenderer`, `WebGPURenderer`, `setAnimationLoop(`, `requestAnimationFrame(`, `renderer.render(` and `new Rapier.World` / Planck step calls. Document which module owns each.
3. Search for `OrbitControls`, viewport `ResizeObserver`, pointer NDC transforms, object/asset disposals, `scene.toJSON()` and editor save/undo contracts.
4. In a running app inspect `THREE.REVISION` and compare with the resolved installed version. Detect multiple Three.js copies and addons resolving to a different release.
5. Confirm render backend and shader/material pipeline; never migrate it as a side effect of scene setup.

## Compatibility matrix (specific points)

| API / assumption | r180 (project baseline in archive) | r183+ / current API | Safe decision |
|---|---|---|---|
| `WebGLRenderer`, `setAnimationLoop`, `setSize(w,h,false)` | Available | Available | Stable foundation |
| `OrbitControls` from `three/addons/controls/OrbitControls.js` | Available | Available | Import from same release |
| `THREE.Clock` | Available | Deprecated from r183 | Prefer injected frame timestamp; keep r180 code compatible |
| `THREE.Timer` | **Not available in r180** | Added as Clock alternative; Clock deprecated from r183 | Check actual version before use |
| `Object3D.attach` | Available; nonuniform scale limitation | Same conceptual limitation | Guard transformations |
| `WebGPURenderer` | Version-specific capabilities | Evolving; can use WebGL2 fallback | Require independent compatibility/migration testing |

Do not infer an API exists from *current* online docs if the project pins an older release. If only a feature in a new release can solve the issue, write a migration assessment and get project-specific authorization before upgrading.

## Integration decision

- **Game already running**: wire module callbacks into the *existing* game-loop; do not call `setAnimationLoop` in added code. Keep physics fixed timestep unchanged.
- **New single-purpose standalone demo**: `installOwnedAnimationLoop()` requires an explicit ownership assertion; it cannot discover third-party loops and thus must not be used blindly.
- **Editor with no continuous state changes**: `createDemandScheduler()` schedules a single RAF when invalidated; observe `OrbitControls.change`, asset/inspector updates and viewport resize.
- **Mixed editor/play mode**: design one state machine selecting scheduling strategy. Stop and dispose prior coordinator before switching; do not run both loops.

## Troubleshooting

- Blank canvas: verify successful module imports, WebGL context, canvas size, camera near/far and clipping, material requirements and console shader logs.
- Frozen scene: verify `renderer.render` is called, the correct loop owns callbacks, tab visibility and pause state.
- Unresponsive OrbitControls: ensure DOM target overlays are not stealing input; call `controls.update()` after camera changes and while damping/autoRotate is active.
- WebGPU: confirm secure context/browser support, renderer initialization contract, material/backend support; retain known working WebGL renderer until migration verified.
