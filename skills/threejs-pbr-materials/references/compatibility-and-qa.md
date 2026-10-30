# Material QA and migration rules

## Version-aware integration
- Read `package.json`/lockfile and actual import aliases. Do not guess the user's Three.js version from a tutorial. Confirm whether the current path uses WebGLRenderer or WebGPURenderer. ShaderMaterial/onBeforeCompile pipelines require explicit migration for WebGPURenderer; changing a PBR material alone does not authorize renderer migration.
- Keep existing game-loop, instancing system, glTF loader and material ID/save format unchanged unless the task requires a reviewed migration.

## Gates
1. Static audit (sample CLI): map role colorSpace, bounded physical material parameters, alpha mode, texture refs, suspicious combinations.
2. Runtime compile in target backend; read browser console, shader compiler diagnostics and unexpected fallbacks.
3. Visual review with fixed camera/lights/HDR/toneMapping/exposure/DPR; include metallic and roughness controls, color calibration chart and transparency overlap shot.
4. Profile GPU/CPU and draw-call changes with production-size scene. Do not assert GPU gains based only on manifest values.
5. Allocate/deallocate cycles under profiler. Compare renderer.info memory trends after warm-up; internal caches may remain, so investigate rather than declare every retained allocation a leak.

## Defects to reject
Unintended changes to glTF texture metadata; double conversion of color map; shared resource disposal; use of higher-cost MeshPhysicalMaterial everywhere; changes to persistent material schema without migration; no visual test of transparency or normal maps.

## Links
- https://threejs.org/manual/pages/color-management.html
- https://threejs.org/manual/pages/webgpurenderer
