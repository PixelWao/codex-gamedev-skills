# Practical GPU performance matrix

Record at least:

- browser, OS, GPU and driver, WebGL vs WebGPU backend, renderer version and shader variant;
- resolution, DPR, actual render target size, texture formats and MSAA;
- FPS as context only; frame time p50, p95, p99, stalls, long frames and warmup/compilation time;
- GPU timer queries/timestamps **only if available** and annotate disjoint/unreliable measurements;
- draw calls, polygons, number/size of render targets, texture sampling and overdraw where tooling supports it;
- quality level and acceptable degradation on mobile.

Test representative scenes: empty baseline, typical gameplay, worst-case particles/transparency, multiple dynamic lights, low-power/mobile target and post-stack toggles. Change exactly one parameter per experiment, repeat trials, and compare distributions rather than one FPS value. Shader source length and number of branches alone are not performance measurements.

Do not automatically lower resolution, disable bloom, replace transparency with cutout, or reduce physics because an effect becomes slow: provide an evidence-based option and let the owner choose a visual tradeoff.
