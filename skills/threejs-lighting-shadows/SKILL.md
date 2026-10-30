---
name: threejs-lighting-shadows
description: Use for Three.js light placement, shadow maps, shadow acne and lighting performance; not material or environment QA.
---
# Three.js Lighting & Shadow Engineering

## Purpose and boundaries
Tune lights and shadows inside an existing scene while preserving its render loop, renderer backend, asset cache, game mechanics, physics and level geometry. You own *lighting and shadow configuration*, not custom GLSL/TSL, postprocessing, glTF loading, or generic performance remediation. Respect `AGENTS.md` and pinned Three.js revision.

## Method: evidence before edits
1. Record camera, scene scale, bounding region of shadow receivers/casters, light type/transform/target, shadow settings, renderer output, target device, existing frame-time metrics and before screenshots.
2. Determine whether defect is visibility, light orientation, shadow acne, peter-panning, crop/frustum, resolution, z-fighting, bias, shadow update policy or insufficient lighting. Changing bias must not be first reflex.
3. Confirm the **three shadow switches**: `renderer.shadowMap.enabled`, shadow-casting light `.castShadow`, object `.castShadow` and `.receiveShadow` as needed. A receiving plane need not cast.
4. For directional shadows, fit an orthographic shadow camera to the **actual** region; change only camera bounds/near/far then always call `camera.updateProjectionMatrix()`. Update `light.target` position/matrices appropriately. Display `CameraHelper` during diagnosis.
5. Prefer as few shadow-casting lights as materially necessary. A point-light cube shadow can require six shadow faces; treat the rendering cost as scene dependent, not as a fixed multiplier for whole frame. Profile CPU submit, GPU, passes and allocation.
6. For stable static scenes, consider `light.shadow.autoUpdate = false`, followed by explicit `light.shadow.needsUpdate = true` on every meaningful caster/light/receiver change. Do not freeze shadows in destructible scenes with changing geometry.
7. Use `light.shadow.bias`, `normalBias`, map size and camera fit jointly. Benchmark p50/p95 frame times and visual differences, including mobile/DPR changes and camera motion.
8. Return diff, screenshots, measurements, environmental assumptions, remaining artifacts and rollback plan.

## Diagnostic matrix
| Artifact | Inspect | Avoid |
|---|---|---|
| Cropped shadows | directional camera bounds, light direction, target | raising map size before frustum fit |
| Blocky shadows | texels per world unit, contact distance, cascades if available | 4K everywhere |
| Acne / stripes | depth precision, bias/normalBias, geometry | arbitrary large bias |
| Floating shadows | too much bias, normalBias, clipping | hiding artifact with stronger fill |
| Unstable moving shadows | near/far, moving camera, shadow update cadence | caching dynamic casters |
| Sudden frame drops | point/spot shadow faces, visible casters, alpha-test | assuming every face equals one whole-frame render cost |

## Tooling
- `examples/configure-shadows.mjs`: validated helper for a supplied light and renderer; has no animation loop.
- `scripts/shadow_budget.mjs`: estimates shadow map texel allocations and face counts from a JSON manifest. This is **not** a measurement of GPU memory or milliseconds.
- `node --test tests/*.test.mjs`: checks projection refresh, shape/range validation, update toggles and budget limits.
- `assets/LIGHTING_REVIEW_TEMPLATE.md`: scene setup, lighting and performance comparison.

## Acceptance gates
Shadow camera fits target, no clipping at movement extremes, no unacceptable acne or detached shadow, correct update after destruction, no second render loop, tracked resource cleanup when unloading and no unapproved change in performance. Confirm with browser and actual project, else label GPU/visual integration NOT TESTED.

## References
`references/shadow-frusta.md`, `references/lighting-and-cost.md`, `references/dynamic-scenes.md`.
