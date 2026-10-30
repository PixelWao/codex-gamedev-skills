# Compression, decoder compatibility and readiness

- Check glTF `extensionsRequired` before loading. `KHR_draco_mesh_compression`
  requires `DRACOLoader`; `EXT_meshopt_compression` needs a compatible Meshopt
  decoder; `KHR_texture_basisu`/KTX2 requires transcoder and a renderer-backed
  `KTX2Loader.detectSupport(renderer)`.
- Host decoder/transcoder files locally, pinned to installed Three.js package.
  No implicit moving CDN `latest` or decoder version drift.
- Reuse DRACO decoder workers across model loads; dispose only when pipeline
  is retired, after in-flight decoding is finished.
- glTF compression may reduce transfer and increase CPU decompression and GPU
  upload time. Compare *total time to first rendered frame*, file bytes and
  visual fidelity for target mobile/desktop GPUs, not compression ratio alone.
- glTF PBR textures use correct color-space interpretation supplied by loader;
  avoid overriding colorSpace blindly.
- Do not assume every new Three.js glTF extension is available on a project's
  older pinned revision. Consult exact installed `GLTFLoader` implementation.

Reference: https://threejs.org/docs/pages/GLTFLoader.html
