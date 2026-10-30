# Phased migration from WebGLRenderer

**Gate 0 – Inventory.** List all current ShaderMaterials, RawShaderMaterials, `onBeforeCompile()` patches, custom passes, render targets, MRT, texture formats, shadow maps and XR requirements. Record shader ownership and shader variant count.

**Gate 1 – Existing baseline.** Screenshot and measure representative scene on WebGLRenderer at fixed resolution, camera, time, seed. Include transparent assets and tone mapping. Save baseline configuration.

**Gate 2 – Isolated trial.** Port one bounded effect or material. Maintain original implementation behind a feature flag; do not alter gameplay. Check visual parity and memory clean-up.

**Gate 3 – Backend parity.** Test WebGPU and `forceWebGL: true` with real devices. Check profile warnings, compile errors, pipeline creation and shader graph APIs of the **pinned** Three.js version.

**Gate 4 – Post stack.** Classic EffectComposer is not a drop-in WebGPURenderer option. Plan RenderPipeline/node-based effects separately and verify tone/output conversions happen once. Cover alpha, depth, antialiasing, UI overlays and screenshot captures.

**Gate 5 – Performance and fallback.** Measure actual impact; do not assume the newer backend is faster. Benchmark software fallback on real target machines. Never equate WebGPU backend support with compute parity under WebGL2 fallback.

**Gate 6 – Ship/rollback.** Rollout only when full validation passes. Keep existing WebGL path until the user approves its removal.

Source: https://threejs.org/manual/pages/webgpurenderer
