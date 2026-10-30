# Shared resource ownership and safe teardown

## Ownership is explicit

A `Mesh` referencing a `BufferGeometry`, `Material`, or `Texture` is not necessarily its owner. Instances and cloned GLB skeletons can share GPU geometry/materials and textures. Calling `dispose()` on every descendant while removing a single instance can invalidate other live users and cause expensive reuploads.

The bundled registry implements **leases** on disposables: each `lease(resource,{owned:true})` returns an idempotent release callback; the resource is disposed once all leases end. `owned:false` denotes borrowed resource and prevents disposal. It is intentionally **not** a GC or scene-graph traversal algorithm.

```js
const registry = createResourceRegistry();
const releaseGeoA = registry.lease(sharedGeometry);
const releaseGeoB = registry.lease(sharedGeometry);
releaseGeoA();  // geometry still usable by B
releaseGeoB();  // last owning lease: calls geometry.dispose()
```

**Important:** All interested scene owners must use the same registry (or an existing asset-manager ownership model); independent registries of the same resource are unsafe. Texture lifetimes must be tracked independently of material lifetimes. Do not register a resource that an external asset manager already owns as `owned:true`; instead keep an external release handle or borrow it.

## Scope and full renderer cleanup

Use `createLifecycleScope` for listeners/observers/control cleanup. It does not dispose scene GPU objects implicitly. Distinguish removing one level from deleting the entire renderer: renderer.dispose is permitted only by the application's renderer owner. Include shadow maps, postprocessing passes, offscreen targets, HDR/PMREM buffers, and CPU-side ImageBitmap.close() where relevant and truly owned.

## QA scenarios

1. Two meshes share geometry and material: removing one must not dispose resources.
2. Two GLB clones share texture cache: scene unload A must not blank scene B.
3. Repeated mount/unmount N times: listeners/observers remain constant; GPU memory doesn't continuously climb after warmup (note that internal renderer caches can remain).
4. Error during asynchronous asset load: release already-acquired resources, remove listeners and ignore stale completions safely.
