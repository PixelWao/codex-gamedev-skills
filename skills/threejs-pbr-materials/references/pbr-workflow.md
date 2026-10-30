# PBR material selection and calibration

## Inputs to record
- Three.js version and rendering backend (WebGLRenderer or WebGPURenderer); `MeshPhysicalMaterial` advanced features can have different costs/features across backends.
- Scene geometry (world scale, normals, tangents, UV sets), texture provenance, renderer output, light types, environment, postprocessing chain, target devices.
- Whether the material is source-owned by GLTFLoader or a mutable runtime override. Never `dispose()` shared maps while other materials use them.

## Selection
1. `MeshBasicMaterial`: deliberately unlit UI/labels, no lighting response. For accurate 2D presentation test tone mapping and output treatment separately.
2. `MeshStandardMaterial`: metal/rough PBR including typical painted metal, wood, plastic and terrain. Use `metalness` near 0 for dielectrics and near 1 for metals, with wear masks when needed. **Not** a hard physical rule to quantize every surface to 0/1 — mixed texels, dirt and painted metal can have transitions.
3. `MeshPhysicalMaterial`: add only required features: clearcoat for multilayer varnish, transmission for physical glass, anisotropy for brushed metal, iridescence for thin films, sheen for fabric. Check supported parameters on pinned version and measure each feature.
4. `MeshToonMaterial`: intentional stylization rather than a PBR upgrade. Inspect shadows and gradientMap colorSpace requirements.

## Reference scenes
- A neutral swatch board with 3x3 combinations of roughness (0.1, 0.5, 0.9) and metalness (0, 0.5, 1). These are diagnostic, not physically representative presets.
- Reference cube, sphere, flat wall, thin plane and correctly UV-mapped sample. Fix exposure and HDR before comparing texture differences.
- Avoid treating a screenshot made on a different GPU/driver as mathematically identical. Use tolerances, diagnostic crops, and visual review.

## Diagnostics
- Black object: inspect material visibility, normals, light, environment, shape and camera clipping; first compare a temporarily assigned debug material without mutating the original asset.
- Flat reflection: inspect `scene.environment`, roughness, normal map and tone mapping before increasing lights.
- Surface too glossy: verify whether roughness texture channel is interpreted correctly; metallic/roughness glTF may be packed in channels (G=roughness, B=metallic), so do not assume independent grayscale data.
- Sparkling/shimmering: inspect normalMap mipmapping, anisotropy and minification aliasing. Avoid gratuitously increasing anisotropy to maximum.

## Source references
- https://threejs.org/docs/pages/MeshStandardMaterial.html
- https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- https://threejs.org/manual/pages/color-management.html
