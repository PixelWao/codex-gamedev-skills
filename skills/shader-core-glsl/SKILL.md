---
name: shader-core-glsl
description: Use to write or debug GLSL shaders, uniforms, ShaderMaterial and WebGL color/UV bugs; not WebGPU TSL or shader QA.
---
# Shader Core: GLSL / WebGL

## Non-negotiable workflow

1. Inspect repository instructions (`AGENTS.md`), installed Three.js version, renderer class, shader source, lighting path, output settings, texture annotations and build/test commands. Determine **WebGL 1 vs 2** and **GLSL ES 1.00 vs 3.00** before writing code.
2. Capture baseline: screenshot, console compilation/link logs, rendered output, viewport/DPR, device/browser, FPS or frame timings if relevant. Reproduce the issue.
3. Classify failure: parse/link error, varying mismatch, vertex transform, world/view-space mix, premultiplied alpha, texture sampling, sRGB/linear conversion, precision or API version mismatch.
4. Make the smallest local fix. Preserve the main render loop, renderer, animation state, scene graph, game logic, physics, post stack and material appearance outside the defect. No silent renderer migration.
5. Validate with genuine shader compile **and program link** on each supported WebGL profile when possible. If GPU context is unavailable, run syntax/style checks and explicitly mark runtime compile **unverified**.
6. Verify on target devices using before/after screenshots, alpha boundaries, mixed-light scenes, opaque/transparent ordering and measured frame time. Roll back unproven regressions.
7. Report changed files, shader dialect, validation commands, actual results, unrun tests, risks and rollback procedure.

## Three.js and GLSL ES rules

- `WebGLRenderer` and `ShaderMaterial`/`RawShaderMaterial` are supported choices; do **not** assume raw shader code works with `WebGPURenderer`. Read `references/webgl-dialects.md` and `references/threejs-material-contract.md`.
- GLSL 1.00: `attribute`/`varying`/`texture2D` and `gl_FragColor`, `gl_Position`; GLSL 3.00: `#version 300 es`, `in/out`, `texture`, explicit fragment output; precision qualifiers in fragment shaders. `#version` must be first line of raw GLSL ES 3.00 shader.
- For `ShaderMaterial`, Three.js inserts uniforms/attributes and supports shader chunks. For `RawShaderMaterial`, provide declarations explicitly. Do not mix the two template styles.
- Keep positions, normals, lighting vectors and view directions in explicitly identified spaces. Renormalize interpolated vectors in fragment shader.
- Mark sRGB color textures as such; leave data textures (`normal`, `roughness`, noise) as non-color. Work in linear for lighting. Verify output conversion and tone mapping once (not twice).
- Do not assert that `discard`, dynamic branching or additional texture fetches are universally expensive; benchmark rather than simplifying on faith.
- Avoid undefined `smoothstep(edge0,edge1,x)` with `edge0 >= edge1`. Avoid `pow` on negative bases when exponent is fractional; clamp input when appropriate.
- Evaluate transparency and alpha as an application-level pipeline decision: sorting, depthWrite, blending, cutouts, padding; `discard` and alpha blending are not interchangeable.

## Supported verification

- `python scripts/check_glsl.py examples` — static dialect and common-trap diagnostics; not a compiler.
- `python -m unittest discover -s tests -v` — checker self-tests.
- Run `tests/browser_compile.html` (plus `examples/threejs-shadermaterial.mjs` for engine integration) on a supported browser with working WebGL (the standalone page compiles and links reference shader pairs). Check DevTools logs and screenshots.
- Optional `glslangValidator -S vert examples/webgl2/basic.vert` and `glslangValidator -S frag examples/webgl2/basic.frag` for syntax. Note: its target profile/settings must match browser, and static compilation alone does not validate full runtime pipeline.

## Read as needed

- `references/webgl-dialects.md` — version mapping and GLSL/HLSL caveats.
- `references/threejs-material-contract.md` — material and renderer integration.
- `references/debug-and-performance.md` — triage matrix and device benchmarks.

## Hand-off contract

Provide: reproducible symptom, exact shader dialect and engine version, changed files, compilation/link status per backend, before/after visual check, performance effect, remaining compatibility caveats, and next test on hardware.
