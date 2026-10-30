# Diagnosis and performance procedure

| Symptom | Check before editing |
|---|---|
| Black/blank object | compiler and linker logs, precision, shader attribute binding, visibility, clipping, depth, uniforms, tex completeness |
| Wrong lighting orientation | world-space normal vs view-space light/view direction, transforms, nonuniform scale, normalization |
| Colors too light/dark | texture annotation, output conversion, tone mapping, composer, premultiplied alpha |
| Sprite border missing | mesh extent, UV wrap, atlas padding, alpha threshold and interpolation |
| Flicker | low precision, Z-fighting, NaN/Inf, derivatives, changing uniforms, batching |
| First-frame hitch | pipeline variant compilation, `compileAsync`, number of material permutations |
| Mobile-only artifacts | highp support, texture formats, derivatives, texture unit count, transparent overdraw |

Performance baseline should record device, GPU/browser, target resolution/DPR, scene/camera, shader features/defines, frame timing distribution (p50/p95/p99) and repeatability. Optimize only measured bottlenecks. Actual GPU timing needs a supported GPU timestamp/timer-query path; `requestAnimationFrame` interval is **not** GPU execution time.

Use a controlled screenshot with frozen time/seed, direct color and alpha probe samples, plus fullscreen comparison when edits are intended to preserve appearance. Browser tab background throttling invalidates some timings. Check WebGL context loss and restoration when relevant.
