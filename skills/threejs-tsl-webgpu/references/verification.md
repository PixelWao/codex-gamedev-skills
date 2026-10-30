# WebGPU/TSL QA checklist

- Record source repo commit, locked Three.js package, browser version, adapter/device, selected backend, DPR/viewport, sample count, color settings and flags.
- Separate syntax checks (`node --check`), source lint, real WGSL module compilation and actual pipeline/render/compute tests. Passing one does not imply passing another.
- `getCompilationInfo()` messages must be checked, but shader module compilation success cannot guarantee valid resource layouts or later pipeline configuration.
- Check browser secure context and presence of navigator.gpu; no adapter, no context, or device lost = **unavailable**, not passing.
- Compare images with frozen uniforms/time and comparable output color space. Include normal viewing distance, transparency, depth ordering, and postprocessing parity.
- Capture frame p50/p95/p99 and GPU timing only if actually supported; measure warmup and shader-compile stutters separately.
- Verify disposal and hot reload. Avoid leaking WebGPU buffers, textures or repeated material variants.
- Document fallback path, untested platforms, and rollback criteria.
