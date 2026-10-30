# Release QA — Three.js Scene Engineering v2.0.0

**Date:** 2026-10-22  
**Scope:** independent Codex skill package; source revision derived from upstream `threejs-scene-setup`.

## Verified in this environment

- Package layout / required files / local Markdown links: **PASS** (`scripts/validate_skill.py`).
- JavaScript ES module source and demo syntax with Node v22: **PASS** (`node --check`, all bundled `.mjs`).
- Mock-based runtime unit tests: **33 PASS, 0 FAIL** (`node --test tests/*.test.mjs`).
- Standalone static version check for demo: **PASS**, identified pin `three@0.180.0` and correctly warned about `THREE.Timer` only becoming available later.
- Upstream license/NOTICE: **PRESENT**; new work marked MIT / Copyright © 2026 Waldemar Soroka.
- ZIP archive consistency, checksums, and post-extraction tests: verified by release script.

## Not completed / skipped

- Real `three` package import and Object3D transform test: **SKIPPED**, `three` dependency not installed in runner; `npm view` failed due to DNS/network error.
- Actual GPU browser render, framebuffer screenshots, WebGL context-loss/restoration, WebGPU fallback: **NOT RUN**.
- Integration into the user's real editor/games (physics, undo/redo, asset cache, persistent IDs): **NOT RUN**; cannot be inferred from mock tests.
- Multi-platform browser/device DPR and touch tests: **NOT RUN**.

## Required before production rollout

Run with the project's installed Three.js release, integrate into an isolated scene checkpoint, verify no loop takeover and no shared-resource disposal, exercise resize/picking/controls, test graphics output and memory on target devices, and fill `assets/QA_REPORT_TEMPLATE.md`.
