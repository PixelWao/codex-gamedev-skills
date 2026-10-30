# Three.js ShaderMaterial integration

1. Pin installed Three.js release and confirm `renderer` type and version.
2. `ShaderMaterial` prepends some built-in declarations. `RawShaderMaterial` does not. Each requires the correct source style; avoid declaring `projectionMatrix` twice.
3. GLSL ES 3.00 in `ShaderMaterial` normally uses `glslVersion: THREE.GLSL3`, with syntax adaptation to Three.js injection. Raw shaders carry `#version 300 es` at the start; verify behavior against installed version.
4. `onBeforeCompile` is `WebGLRenderer`-only and fragile under upgrades; do not introduce it reflexively.
5. For custom raw color outputs, account for Three.js color-space conversion and tone mapping. In `ShaderMaterial`, the documented `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` chunks may be appropriate depending on output architecture. Confirm actual installed version and post stack before adding them.
6. `OutputPass` normally belongs at the end of classic `EffectComposer` chains. Do not apply an output conversion in the material *and* again in the wrong stage.
7. Set `texture.colorSpace = THREE.SRGBColorSpace` for ordinary albedo/color textures; do not mark lookup masks, normals and roughness as sRGB.
8. If an outline needs pixels outside a sprite quad, enlarge geometry/texture padding or use a separate pass; sampling neighbors does not create rasterized fragments beyond mesh boundaries.

References: https://threejs.org/docs/pages/ShaderMaterial.html ; https://threejs.org/docs/pages/RawShaderMaterial.html ; https://threejs.org/manual/pages/color-management.html ; https://threejs.org/docs/pages/OutputPass.html
