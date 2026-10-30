# Blender → glTF 2.0 export hygiene

- Confirm unit scale, dimensions, +Y-up glTF convention vs Blender Z-up;
  avoid applying transforms indiscriminately on *skinned rigs* since this can
  change inverse bind/rest matrices. Validate actual export in viewer.
- Keep stable node and clip names referenced by game code; avoid hidden
  animation tracks on unrelated objects and duplicate names.
- Inspect armature rest pose, skin weight normalization, bone count and
  animation bounds; test mesh deformation at first/middle/last frame.
- Standard glTF metallic-roughness materials export; verify normal/roughness
  maps, alpha and double-sidedness after loading. Unsupported Blender nodes
  are not portable shader graphs.
- GLB packages images/geometry conveniently, but may still reference optional
  extensions; inspect `extensionsRequired` in the exported manifest.
- Avoid treating visual mesh as physical collider by default. Build collider
  strategy separately in the physics skill and compare positions/scales.
- Record exporter version and hash so changes remain reproducible.

External references: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
