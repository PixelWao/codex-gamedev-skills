# Reproducible visual regression for materials and environment

## Baseline manifest
Include Three.js semver, lockfile hash, browser revision, operating system, GPU, backend, camera pose/FOV, viewport CSS px, DPR, screenshot pixel dimensions, lights/HDR asset hash, toneMapping, exposure, outputColorSpace, antialiasing, shadow type, app seed and scene name. Preserve comparable baseline images. Avoid treating anti-aliasing differences as shader regressions without review.

## Automated image diff
`compare_images.py baseline.png candidate.png --mae-max 5 --changed-pct-max 2 --pixel-diff 20 --out report.json`
- MAE = mean absolute difference per RGB channel (0..255) without alpha masking by default.
- RMSE = root mean square channel error.
- Changed pixels = pixels with at least one RGB channel absolute diff strictly greater than pixel-diff.
- If images differ in dimensions, fail. Image comparisons require Pillow. If unavailable, mark NOT RUN and install only after approval.
- Automatically pass/fail **numerical thresholds only**. Human review needed to determine whether the difference is acceptable.

## Images and performance
Test at low/high exposure, neutral HDR and production HDR, with/without postprocess, and edge-of-screen UI. Benchmark p50/p95 GPU/CPU times separately. Never infer GPU performance from Python image diff.

Docs: https://threejs.org/manual/pages/color-management.html
