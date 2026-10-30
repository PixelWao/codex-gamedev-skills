---
name: threejs-gltf-runtime
description: Use to load, clone, dispose and manage glTF/GLB assets in a Three.js scene; not skeletal blending or file compression.
---
# Three.js glTF Runtime — safe loading and ownership

Goal: load, instantiate and unload models **without replacing the existing
renderer, render loop, physics integration, scene manager or pinned Three.js
version**. Require explicit ownership and measurements before optimization.

## Dispatch

- GLB import, decoder path, duplicate loads, repeated spawning, GPU leaks,
  resource cleanup → use this skill.
- Character transitions, locomotion/blending, events, root motion →
  `threejs-animation-systems` when installed; operate independently if not.
- Validate raw `.glb`, Blender export, triangles, texture compression →
  `gltf-asset-pipeline-qa` when installed; not an obligatory dependency.
- Do not use the original `threejs-gltf-loading` alongside this skill.

## Mandatory workflow

1. Inspect `package.json` and lockfile for the **exact Three.js revision**;
   identify current `WebGLRenderer`/`WebGPURenderer` and asset ownership.
2. Locate the authoritative scene lifecycle and existing update loop. Do not
   call `setAnimationLoop` inside loaders and do not create a second RAF loop.
3. Review model metadata, URLs, extensions, compression decoders and
   application asset cache. Fail visibly when an extension is unsupported.
4. Use `loadAsync()` with `try/catch`, explicit fallback UI, and safe handling
   of absent animations. Avoid divide-by-zero for unknown download length.
5. Use `SkeletonUtils.clone()` for skinned assets. A clone has independent bones,
   but shares geometries, materials and textures. Ownership is *not* cloning.
6. Retain a loaded template while any instance exists. Release private skeletons
   at despawn; free shared resources only after the final owner releases them.
7. If imported textures or materials become shared with other applications,
   transfer ownership explicitly; do **not** blindly traverse and dispose.
8. Record before/after `renderer.info.memory` and browser memory traces across
   repeated load/unload runs; renderer internals may retain caches and memory
   counters alone cannot establish a leak.
9. Run `node --test tests/*.test.mjs`, check example JavaScript with `node --check`,
   and run project browser/GPU tests. Report gaps separately.

## Implementations and safe boundaries

- `examples/asset-store.mjs` — dependency-free, injectable, shared asset lease
  prototype with clean last-release behavior and failure retry.
- `examples/progress.mjs` — safe indeterminate download progress display.
- `examples/integrate-three.mjs` — Three.js imports, local DRACO/Basis paths,
  Meshopt decoder and correct decoder lifetime.
- `references/runtime-lifecycle.md` — disposal matrix, loading progress,
  errors, dynamic lifecycle and race conditions.
- `references/decoder-compatibility.md` — format compression compatibility.
- `assets/REPORT_TEMPLATE.md` — standard before/after validation.

**Important limitations:** the included store handles resource ownership for
*exclusive glTF asset bundles*, not arbitrary externally shared texture
atlases, custom shader uniforms or manually replaced materials. Introduce an
application-level asset registry when those appear. Prefer **explicit**
lease transfer over `dispose()` on every removed mesh. Never use glTF visual
triangles as Rapier collision meshes without a physics design review.

## Exit criteria

Static and skinned GLBs import; missing assets fail cleanly; concurrent loads
reuse one parse; repeated instances display correctly; unloading one instance
does not break the others; the last release frees only owned resources;
no new game loop; startup and memory baselines are documented. Mark true
runtime/WebGL checks **BLOCKED** until exercised in the actual game.

## References

- https://threejs.org/docs/pages/GLTFLoader.html
- https://threejs.org/docs/pages/module-SkeletonUtils.html
- https://threejs.org/manual/pages/how-to-dispose-of-objects.html
