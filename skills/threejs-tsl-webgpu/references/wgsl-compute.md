# WGSL + compute engineering

Treat WGSL as an independently validated language: address spaces (`var<storage,...>`, `var<uniform>`), binding groups, entry point decorations (`@vertex`, `@fragment`, `@compute`), workgroup size, alignment, host buffer layouts, and usage flags must agree exactly with JavaScript-side pipeline descriptors.

1. Check secure-context WebGPU availability, request adapter/device, inspect `device.features` and `device.limits`.
2. Build shader module with `device.createShaderModule({code})`, **then** await `getCompilationInfo()` and review warnings/errors.
3. Build compute or render pipeline with async creation where available; catch validation errors with error scopes and device loss monitoring.
4. Validate bind groups, storage buffer byte length, offsets, access modes and bounds. Never trust dispatch counts to stay within allocated arrays; guard `global_invocation_id`.
5. Submit commands, synchronize readback by copying to MAP_READ buffer and awaiting `mapAsync`, and compare with deterministic CPU reference.
6. Test non-multiple-of-workgroup-length arrays (e.g. N=17 with workgroup=8), N=0, large N, wrong binding and repeated dispatches.
7. GPU compute requires explicit data ownership, frame synchronization and fallback policy; no automatic transfer of game physics or authoritative gameplay to compute.

The `examples/wgsl/compute-add-one.wgsl` exercise uses a storage buffer of floats plus a uniform count, with a guard against out-of-range dispatch. It is a **shader fixture**; a production engine must supply a compatible pipeline and buffers.

Specs: https://gpuweb.github.io/gpuweb/wgsl/ ; https://developer.mozilla.org/en-US/docs/Web/API/GPUShaderModule/getCompilationInfo
