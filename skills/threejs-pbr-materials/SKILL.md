---
name: threejs-pbr-materials
description: Use for Three.js PBR materials, metalness, roughness, transmission and texture role debugging; not light placement.
---
# Three.js PBR Materials Engineering

## Purpose and boundaries
Create, diagnose and maintain physically-based materials in existing Three.js/WebGL scenes. **Do not** rewrite the renderer, game loop, glTF importer, asset ownership manager, custom GLSL, TSL graph, or shader QA system. Coordinate with the project's existing asset manager. Honor `AGENTS.md`, pinned Three.js revision, renderer backend, output color workflow and project conventions. Check installed API before changing source.

## Task workflow (mandatory)
1. **Inventory** the surface: geometry UV/uv1, normals/tangents, source images, imported glTF materials, map ownership, renderer, lighting/environment and target hardware. Establish a before screenshot and scene settings.
2. **Diagnose the actual defect**: compare under diffuse key + neutral environment; temporarily use a debug normal/unlit material without mutating the original shared asset. Distinguish lack of light, wrong UV, normal polarity, tone mapping, texture role and material blending.
3. **Select least complex material**: unlit `MeshBasicMaterial` only when intentionally unlit; `MeshStandardMaterial` for ordinary PBR; `MeshPhysicalMaterial` only for required clearcoat, anisotropy, sheen, iridescence or transmission. Don't upgrade every prop to Physical.
4. **Validate textures**: sRGB for color/emissive/specular-color/sheen-color; `NoColorSpace` for normal, roughness, metalness, AO, displacement, thickness and masks; honor HDR's source color encoding. Do not blindly overwrite textures coming from GLTFLoader. Confirm `uv1` for AO when required by the target version; inspect actual texture channels.
5. **Treat materials and textures as shared assets**: a caller-supplied map remains caller-owned. Do not dispose its texture from a material factory. Dispose only exclusive resources on removal and only after all consumers release them.
6. **Compile and inspect** using project's installed Three.js, target renderer and real GPU. Capture warnings, first-frame shader compilation, screenshots of calibrated swatches and p50/p95 GPU/CPU frame times where observable; compare against baseline.
7. **Report** configuration delta, assets modified, image references, device/browser/revision, performance and lifetime behavior. Roll back if visual or perf gates fail.

## Common failure triage
| Symptom | Confirm before fix | Candidate mitigation |
|---|---|---|
| Black standard material | lights, environment, normals, UV, visibility | add valid lighting/IBL rather than switch whole scene to unlit |
| Faded/almost white albedo | map color space, exposure, double conversion | annotate only the correct color data, inspect output pipeline |
| Bricks have inside-out bumps | normal orientation, normalScale.y, texture axes | adjust the specific normal map after comparison |
| AO missing | correct UV set, aoMapIntensity, lighting | provide appropriate UV channel or bake |
| Glass renders opaque | `transmission`, `opacity`, environment, backend | configure Physical with `opacity:1` and measured transmission |
| Glass/foliage sorting wrong | depthWrite/transparent/alphaTest, draw ordering | cutout for binary masks, sort/fakes only if justified |
| Excess GPU cost | transmission, double-sided transparent passes, map sizes, overdraw | targeted simplification and remeasure |

## Runnable tools and examples
- `node scripts/audit_materials.mjs input.json [--strict]`: machine-readable material manifest audit; zero dependencies, does not compile a GPU shader.
- `node --test tests/*.test.mjs`: surface roles, invalid ranges, ownership, audit exit behavior.
- `examples/create-material.mjs`: dependency-injected factory; import into an existing Three.js app, **do not** create your own `setAnimationLoop`.
- `examples/reference-swatches.mjs`: attach a small calibration collection to a supplied scene. Test on the installed Three.js version.
- `assets/MATERIAL_REVIEW_TEMPLATE.md`: human + automated evidence fields.

## Acceptance criteria
All material roles and numeric parameters valid; no silent fallback; no double-disposal of shared maps; baseline/reference render comparable at fixed camera/exposure/environment; confirmed compile on target WebGL/WebGPU as applicable; no unexplained rise in draw calls or GPU memory. If rendering cannot be executed, write **NOT TESTED**, never a pass.

## References
Read `references/pbr-workflow.md`, `references/texture-and-transparency.md` and `references/compatibility-and-qa.md` only as needed. See `PROVENANCE.md` and `QA_REPORT.md`.
