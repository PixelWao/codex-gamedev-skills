# Asset optimization matrix and measurement protocol

## Baselines

Before modifications record: SHA-256, byte size, mesh counts, primitive counts,
accessor counts, triangle estimate, material and texture sizes/resolutions,
clip names/durations, required glTF extensions and target renderer/backend.
Use Khronos validator for specification-level errors. The bundled parser makes
only structural checks and **underreports** some primitive modes.

## Staged transforms

1. Remove provably unused resources; inspect changes for references and name
   lookups used by the game (bones, selection, hit zones, animations).
2. Geometry: check `gltf-transform inspect`. Evaluate quantization, pruning,
   vertex cache, DRACO or Meshopt only where the runtime decoder exists.
3. Textures: evaluate resolution, mipmaps, WebP vs KTX2/Basis; inspect GPU
   device transcode support, alpha, normal map quality and roughness artifacts.
4. LOD: choose by projected size, gameplay readability and target mobile GPU.
   Do not decimate collision meshes or break animated rig skin weights.
5. Blender materials: compare roughness/metallic, double-sidedness, alpha
   blending/cutout, tangent/normal maps and color space against rendered source.
6. Test on target hardware: transfer time, decode CPU, upload, draw calls,
   peak memory, 1st visible frame and short animation clip playback.

## Concrete commands (adapt to installed pinned CLI)

```bash
gltf-transform inspect models/source.glb
# Inspect `gltf-transform optimize --help` before choosing compression:
gltf-transform optimize models/source.glb models/candidate.glb --compress draco
```

Never trust a smaller GLB alone: candidate can increase decode latency, runtime
memory or change appearance. Preserve hash of both and a reversible roll-back.
