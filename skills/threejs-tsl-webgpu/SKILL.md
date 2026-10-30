---
name: threejs-tsl-webgpu
description: Use for Three.js TSL nodes, WebGPURenderer, WGSL and WebGL fallback migration; not WebGL GLSL-only effects.
---
# Three.js TSL, WebGPU and WGSL

## Start with architecture, not migration

1. Read `AGENTS.md`, `package.json`/lockfile, renderer creation, lighting, material variants, postprocessing, device targets, and asset/texture format. Note precise Three.js release. Check WebGPU availability and browser secure context.
2. Ask what problem motivates TSL or WebGPU: author a new node material, port a specific shader, or run compute. Keep the existing `WebGLRenderer` for a compatible project unless migration is explicitly approved.
3. Write a compatibility matrix: expected WebGPU, forced WebGL2 fallback, target browsers/mobile, extensions/limits, XR and rendering features. Distinguish **renderer fallback** from compatibility of every shader effect and compute operation.
4. Implement a minimal vertical slice with same baseline scene/camera/textures and material behavior; do not redesign game loop or physics. Use `three/webgpu` and `three/tsl` imports appropriate to **installed** Three.js version.
5. Validate JavaScript syntax, TSL node construction, renderer init/compilation, visual output, color management, alpha and depth. WGSL modules must be checked with real device compilation info; source heuristics alone do not validate WGSL.
6. Exercise WebGPU and forced WebGL2 paths separately and verify actual effect support, feature negotiation and device loss handling. Compute may require a dedicated WebGPU path and cannot be assumed to work on all fallbacks.
7. Measure GPU/CPU frame cost (not just average FPS), source compile/pipeline stalls, memory footprint, and shader variants. Retain previous path as rollback unless explicitly retired.
8. Report precise tested versions/backends, performance, visual parity, failures and remaining device caveats.

## Rules

- `WebGPURenderer` targets WebGPU and can fall back to a WebGL2 backend. **It does not support `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile()` or classic `EffectComposer` as drop-in replacements.** Use node materials/TSL and the compatible render pipeline. Refer to `references/migration.md`.
- TSL is JavaScript that builds a shader graph; it is not direct WGSL source text. Write reusable nodes and avoid backend-specific assumptions.
- Only use `navigator.gpu` and `requestAdapter` / `requestDevice` in a secure context. Validate requested limits, features, resource bindings, formats and workgroup sizes against the actual adapter/device.
- After creating a WGSL module, call `getCompilationInfo()` and treat `error` messages as failure; shader module construction alone is insufficient. Also await actual pipeline creation to surface layout and validation errors.
- Confirm correct output color space, tone mapping and postprocess order. Keep all game simulation on its designated owner; GPU compute simulation requires explicit design approval and a data synchronization plan.
- Never introduce a new animation loop, renderer, WebGPU device or compute dispatch into an existing game just to 'modernize' it.

## Practical tests

- `node --check examples/tsl-color-material.mjs` and `node --check examples/webgpu-compile-wgsl.mjs`
- `node scripts/audit_wgsl.mjs examples` — source-level lint with explicit heuristic-only status.
- `node --test tests/*.test.mjs` — self-tests of the lint tool and source fixtures.
- For real hardware support run `examples/wgsl-browser-check.html` and a project-specific Three.js/TLS scene in secure-context browser, and save compilation/errors and frames. Browser fallback may still require feature-specific adjustments.

Read `references/tsl-patterns.md`, `references/migration.md`, `references/wgsl-compute.md`, `references/verification.md` as needed.
