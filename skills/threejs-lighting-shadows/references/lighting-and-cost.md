# Light selection and cost assessment

- `HemisphereLight` and ambient fill are inexpensive scene-wide light approximations but not shadow sources.
- `DirectionalLight` key light and selective shadow caster are often suitable for outdoor scenes; do not force intensities between 2 and 3. Calibration depends on material, scene scale, exposure, IBL and desired style.
- `PointLight` and `SpotLight` are local lights; shadow-casting point lights require cube shadow sampling and multiple faces. The number of passes alone is not equivalent to exact GPU milliseconds. Observe profiler, renderer.info, GPU timers where supported.
- `RectAreaLight` requires matching helper and is not a default real-time shadow solution; do not recommend enabling `.castShadow` blindly.

## Checklist
- [ ] verify shadow map enabled only when needed
- [ ] verify light/mesh casts and receiver flags
- [ ] inspect light targets, parent transforms and world-space movement
- [ ] fit shadow frustum and projection matrix
- [ ] select bias, normalBias, mapSize by visual QA
- [ ] benchmark before and after with same view/device/DPR
- [ ] track shadow updates from destructive world changes

## Budget caveat
`shadow_budget.mjs` counts map faces and theoretical bytes for supplied depth-like estimates, not actual allocations. Atlas layout, backend attachments, format, filter copies, VSM blur targets and renderer internals change real memory. Never label its estimate 'measured VRAM'.

Docs: https://threejs.org/docs/pages/LightShadow.html ; https://threejs.org/manual/pages/webgpurenderer
