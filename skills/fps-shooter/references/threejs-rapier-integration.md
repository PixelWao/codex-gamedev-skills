# Browser integration contracts: Three.js and Rapier

## Resolve versions before integration

- Read project `package.json`, lockfile, and import maps. Different versions of `@dimforge/rapier3d-compat` and `@dimforge/rapier3d` can expose different result property names and method signatures.
- `src/adapters.mjs` is a **version-sensitive starting adapter**; verify it against the installed Rapier package source/types before using it in a shipped game. Its mock tests do not prove a real Rapier integration.
- Use exactly one authoritative world for gameplay hit detection (prefer existing physics world when colliders are authoritative). Three.js raycasts are valid for editor picking or explicitly geometry-authoritative worlds.

## Rapier query

`createRapierRaycastAdapter(RAPIER, world, {classifyCollider})` constructs a Rapier `Ray` and uses `world.castRayAndGetNormal`. The classify function returns `kind: 'world' | 'damageable'` with actor metadata and possible `ignore` flag. Include walls in collision groups. Exclude only the shooter's collider/body as appropriate. Keep `solid=true` when starting inside a collider must count as blocked. Verify actual `hit.collider` versus `colliderHandle`, `timeOfImpact` versus `toi`, and query predicate semantics for your version.

The optional sphere-sweep adapter uses `world.castShape` and is an illustration of a versioned signature. Explicitly validate initial overlap and moving-body behavior on the project's physics version; unit tests currently verify only the abstract sweep contract.

## Three.js

`createThreeRaycastAdapter(THREE,{objects,resolveHit})` expects the `objects` collection to contain blockers as well as damageable meshes. Intersections are ordered by distance; `resolveHit` may ignore an object intentionally. `THREE.Raycaster` is not identical to physics queries (backfaces, shader displacement, skinned meshes, instancing may differ). Test the actual game after choosing this adapter.

## Loop and input

- Existing physics tick: call `weapon.tick(dt, {triggerDown,reload})`, consume `shot` events; produce muzzle flash/audio/recoil from those events.
- Mouse look belongs to existing camera/input skill. Pointer Lock API uses event movement deltas; do not multiply raw mouse movement by render `dt`. Resume contexts require explicit user interaction and proper cancellation on Escape/blur.
- For input events between fixed steps, optionally timestamp/queue them; a sampled trigger edge has up to one tick of input latency.
- Do not call `renderer.setAnimationLoop()` or `world.step()` from the combat module.

## Collision scenarios to test in target game

Wall at 3m, enemy 8m; camera exposed while muzzle behind nearby cover; firing from inside wall; collider-only blocker with invisible renderer; mesh-only visual with no collider; thin fast projectile; overlapping NPC hitboxes; moving targets and moving shooter.

## Primary documentation

- Rapier scene queries: https://rapier.rs/docs/user_guides/javascript/scene_queries/
- Rapier shape casting: https://rapier.rs/docs/user_guides/javascript/scene_queries_shape_casting/
- Rapier rigid bodies/CCD: https://rapier.rs/docs/user_guides/javascript/rigid_bodies/
- Three.js Raycaster: https://threejs.org/docs/pages/Raycaster.html
- MDN Pointer Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
