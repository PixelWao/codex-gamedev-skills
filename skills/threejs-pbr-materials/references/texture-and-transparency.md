# Texture semantics, alpha and lifecycle

## Color maps vs data maps
An sRGB PNG/JPEG that stores perceptual color for material `.map`, `.emissiveMap`, `.sheenColorMap`, `.specularColorMap` must have correct sRGB annotation (unless the import pipeline already did that). `.normalMap`, `.roughnessMap`, `.metalnessMap`, `.aoMap`, `.alphaMap`, `.transmissionMap`, `.thicknessMap`, displacement and most masks are non-color signals: generally `NoColorSpace`. RGBE/EXR HDR inputs require their own loader/encoding and should not be blanket-labelled sRGB.

Never assign colorSpace based solely on variable name; the manifest and the actual loaded `texture.colorSpace` must be inspected together. A map may be shared by many materials: no automatic `texture.dispose()` in the material factory.

## UV and normals
- Confirm `uv` for base map and normal map; account for AO additional UV channel according to Three.js revision (`uv1` convention) and imported glTF.
- Normal map expects tangent-space data unless configured otherwise. Mirrored UVs, negative transforms and normalScale can invert highlights. Check tangents if normal-mapping highly detailed geometry.
- Test the texture with a rotating light and under IBL.

## Alpha and glass
- `alphaTest` for binary foliage/fences when a hard cutout is acceptable (often depth-friendly, avoids order-dependent blending). Adjust alpha-to-coverage when supported if edge softness is needed.
- `transparent: true` + opacity for blended surfaces. `depthWrite:false` can mitigate transparent particles but is **not** a universal fix for glass or overlapping solids.
- `transmission` with `MeshPhysicalMaterial` for physically based transparent surfaces; documentation advises `opacity:1` while transmission is non-zero. Quality/perf of transmission varies by backend and nearby geometry.
- `DoubleSide` with transparent meshes may need multiple passes; set `forceSinglePass` only if that tradeoff is acceptable and measured for flat billboards/foliage.

## Ownership contract
The loader/runtime has a resource table. Track material references, texture references and optional render targets. Releasing one object does not release shared maps. `Material.dispose()` does not automatically call `.dispose()` on textures. If using a new texture from a factory, mark it owned and release it only after no consumers remain. Test repeated scene enter/exit.

## Sources
- https://threejs.org/docs/pages/Material.html
- https://threejs.org/docs/pages/Texture.html
- https://threejs.org/manual/pages/how-to-dispose-of-objects.html
