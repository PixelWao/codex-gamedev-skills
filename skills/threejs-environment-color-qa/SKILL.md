---
name: threejs-environment-color-qa
description: Use for Three.js HDR environments, PMREM, exposure, tone mapping and color QA; not individual PBR surface design.
---
# Three.js Environment & Color QA

## Responsibility
Manage scene-level image-based lighting (IBL), HDR environments, PMREM render-target lifetime, background rotation/brightness, exposure and output-color consistency, and visual regression methodology. Do not overwrite the runtime's renderer or postprocessing without explicit approval, or duplicate the asset manager. Verify Three.js release and backend before applying instructions.

## Procedure
1. Capture initial renderer configuration (`outputColorSpace`, `toneMapping`, `toneMappingExposure`, postprocess output pass), source texture encoding, scene environment/background, environment intensity and background intensity/rotation.
2. Label each image by role: ordinary PNG/JPEG albedo or emissive -> sRGB; non-color maps -> `NoColorSpace`; HDR linear image -> encoding indicated by loader. Never infer from filename alone without checking metadata.
3. For WebGLRenderer standard PBR, use environment texture in a supported mapping; Three.js can internally prepare PMREM from equirectangular input. If generating explicitly via `PMREMGenerator`, **retain returned render target** and dispose it only when no scene/material references its texture. Dispose temporary `RoomEnvironment`, inputs and generator only according to ownership contracts.
4. Distinguish background from illumination. `scene.background` does not guarantee identical lighting to `scene.environment`; calibrate `environmentIntensity` and `backgroundIntensity` separately. Scene rotations depend on current API and active renderer.
5. Keep lighting math linear; apply tone mapping and output conversion exactly once. WebGL EffectComposer typically uses `OutputPass` at the end, not a second hand-rolled gamma pass. Do not port to WebGPURenderer just to change tone mapping; new pipeline may require TSL-specific passes.
6. For visual QA, pin scene seed, camera, viewport, DPR, renderer revision, GPU, browser, shadows, tone mapping, exposure and colorSpace. Capture baselines before changes; compare differences with allowed tolerance and inspect false positives from anti-aliasing / nondeterministic driver paths.
7. Load/replace environments atomically: prepare the new target first, assign, release previous owned target only after successful commit, and restore previous environment on errors. Dispose scene-scoped environment on level unloading, never a target shared between scenes without ownership tracking.
8. Record QA report with screenshot hashes, warnings, performance data, ownership handoff and any untested areas.

## Expected tool use
- `examples/environment-owner.mjs`: lifecycle helper with injected renderer/PMREM and single-scene ownership model. Avoids extra loops and releases previous render targets when replaced.
- `scripts/color_pipeline_audit.mjs`: manifest checks for incorrect map-space roles and pipeline settings (not an image renderer).
- `scripts/compare_images.py`: Pillow-powered screenshot comparison (RMSE, MAE and changed-pixel ratio; tolerances configurable); requires `pip install pillow` only for this optional tool.
- `node --test tests/*.test.mjs` and `python -m unittest discover -s tests -p 'test_*.py'`.

## Acceptance criteria
No unknown-color-space assumptions; valid IBL intensity and scene/background independence; owned targets cleaned after consumers detach; no double tone mapping; image-regression result reviewed by a human for meaningful artifacts; GPU rendering or HDR decode tests clearly marked NOT TESTED if not exercised.

## References
`references/ibl-lifecycle.md`, `references/color-workflow.md`, `references/visual-qa.md`.
