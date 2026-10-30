---
name: shader-effects-qa
description: Use to validate visual shader effects, screenshots, color correctness, regressions and GPU budgets; not write base GLSL pipelines.
---
# Shader Effects and Visual Quality Assurance

## Scope

Effects engineering and validation only. Preserve simulation state, gameplay, physics, destruction rules, save format, and screen layout unless the user explicitly requests change. Target renderer is determined by **the existing project**, not by whichever shader framework is newest.

## Workflow

1. Inspect renderer, game loop, game-state ownership, assets, color workflow, target devices, active post-processing, resolution scaling and relevant `AGENTS.md`.
2. Record desired look, visual reference or acceptance description, performance limits and degradations allowed on mobile. Freeze time, camera and random seed for reproducibility.
3. Select implementation tier: sprite or atlas shader, material node, overlay quad, depth/normal-aware post-pass, multipass compositor or CPU Canvas 2D fallback. Ensure the selected tier can draw pixels where desired (a sprite shader cannot paint outside its rasterized bounds).
4. Construct a small test scene with representative alpha, depth, colored lights, solid and textured geometry, UI overlay, motion, varying viewport/DPR and HDR/SDR where applicable.
5. Validate shader **compile/link**, material integration and the effect's mathematical behavior; test clamping, NaN/Inf, alpha mode, blend order, and color conversion. See `references/effect-patterns.md`.
6. Capture baseline/reference screenshots at the same deterministic state. Compare with `scripts/compare_images.py` using **actual saved PNG/PPM files** and documented thresholds. Quantitative image similarity does not prove artistic or gameplay correctness.
7. Benchmark after warmup and record p50/p95/p99 frame times, outlier frames, overdraw, textures, render targets and compile hitches. A significant quality difference may justify slower rendering only with explicit approval.
8. Report visual changes and device compatibility, pass/fail of QA gates, untested platforms, and rollback. Do not imply benchmark success from a static shader lint.

## Practical tools

- `python scripts/effect_math.py --self-test` — numerical checks for vignette/dissolve mathematics.
- `python scripts/compare_images.py baseline.png candidate.png --json report.json` — compare same-dimension images, using Pillow if available; PPM P6 supported with standard library. Default accepts PNG with Pillow installed, which is optional.
- `python -m unittest discover -s tests -v` — tests including image comparison and math edge cases.
- `examples/vignette-300es.frag` + `examples/fullscreen-300es.vert` — paired GLSL ES 3.00 effect example; compilation must be checked with an actual WebGL2 context.

## Core invariants

- `smoothstep(edge0, edge1, x)` requires ascending edges. Use clamped positive width and explicit direction of mask.
- Preserve authored sprite silhouette: external outline needs padded geometry/atlas or separate pass; bilinear filtering and alpha fringing must be considered.
- Lighting computations generally occur in linear space; output conversion and tone mapping should happen in the appropriate final pass only once.
- Bloom/glow in HDR is not an exact substitute for emissive color. Color grading and screen overlay semantics vary by backend.
- Test cutout versus blending, depth sorting and MSAA; `discard` is not always faster than alpha blending.
- Use GPU compute only with an approved design and device capability checks. Do not offload game logic just to simplify a visual shader.

References: `references/effect-patterns.md`, `references/visual-regression.md`, `references/gpu-benchmark.md`, `assets/QA_REPORT_TEMPLATE.md`.
