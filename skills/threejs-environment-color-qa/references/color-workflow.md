# Three.js color pipeline

## Roles
- Lighting and material shading occur in Linear-sRGB working space; CSS/hex input can be converted automatically when ColorManagement is active.
- Albedo/emissive PNG or JPG containing perceptual RGB -> `SRGBColorSpace`.
- Normal, ORM, roughness, metallic, AO and displacement -> `NoColorSpace`.
- Linear HDR source (e.g. EXR loader) -> appropriate linear encoding; determine from metadata, do not hardcode `SRGBColorSpace`.
- Display output from WebGLRenderer normally `outputColorSpace=SRGBColorSpace`.

## Postprocessing
In a standard WebGL `EffectComposer` pipeline, use `OutputPass` to perform tone mapping and conversion once, usually at the end (special exceptions such as FXAA may require a different order, so test). Do not add a second gamma conversion by hand. The WebGPURenderer postprocessing system is different; review backend and installed revision before altering effects.

## Calibration capture
Record white/gray/albedo calibration swatches, HDR environment rotation/intensity, background rotation/intensity, exposure, tone mapping, and screenshots for at least neutral and high-contrast conditions. A histogram threshold or pixel diff alone cannot prove natural appearance.

Docs: https://threejs.org/manual/pages/color-management.html ; https://threejs.org/docs/pages/OutputPass.html ; https://threejs.org/manual/pages/webgpurenderer
