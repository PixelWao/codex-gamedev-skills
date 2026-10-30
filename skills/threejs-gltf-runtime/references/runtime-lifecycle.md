# Runtime lifecycle and failure handling

## Import boundaries

1. Confirm `gltf.scene` is an `Object3D` and `gltf.animations` an array; models
   without clips are legitimate. Check null root, scale, invisible layers,
   bounding box, PBR lighting, coordinate conventions and extension support.
2. Download progress: `loaded` bytes can increase while total remains zero;
   show indeterminate state rather than `Infinity%`. `LoadingManager.onProgress`
   counts completed **items**, not precise bytes or parse progress. Decode,
   upload and shader compilation occur after transfer.
3. Error handling: errors should expose URL, requested extension and decoder
   configuration, without leaking secrets or credentials in telemetry.
4. Race: on route unload before an awaited import finishes, release the lease
   immediately on completion. Abort depends on loader/network implementation;
   do not promise GLTFLoader cancellation when none is available.

## Ownership matrix

| Entity | Typical ownership | Despawn action |
| --- | --- | --- |
| Scene node / `Object3D` | Instance | Remove from parent |
| AnimationMixer | Instance | stop actions; `uncacheRoot` |
| Skeleton from `SkeletonUtils.clone` | Instance | `.dispose()` once if distinct |
| Geometry / PBR material / texture | Shared model template | Dispose only after final lease |
| ImageBitmap CPU image | Explicit external ownership | `.close()` only when all users are finished |
| DRACOLoader / KTX2Loader decoder workers | Loader service | `.dispose()` at pipeline shutdown |
| Custom render target / environment | Game renderer | Application-specific cleanup, not model unload |

`scene.remove()` does **not** imply resource disposal. Material disposal does not
free its textures. Inspect array materials, maps, normal/occlusion textures,
user-defined uniforms and texture sharing. The example store scans common
material properties and uniform values; it is deliberately **not** a universal
resource graph/GC replacement.

## Integration QA matrix

- Same URL 10 concurrent loads → one in-flight request, ten root instances.
- 100 repeated spawn/despawn cycles → geometries/textures return to an observed
  steady state, no visible regression, no unbounded skeleton/mixer growth.
- Unload one of multiple enemies → remaining model/animation still correct.
- GLB with no animations and GLB with missing texture → no uncaught exception.
- Failed 404 or corrupted payload → retry works, UI recovers, cache not poisoned.
- Unknown content length → indeterminate progress; no `Infinity` or `NaN`.
- Parent `Object3D` controlled by Rapier/scene graph → do not overwrite transform
  synchronization authority.
