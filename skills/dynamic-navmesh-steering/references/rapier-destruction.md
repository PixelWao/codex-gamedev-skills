# Rapier / Three.js / destruction integration

Pipeline: player action → game updates/despawns geometry and colliders at a safe physics synchronization point → navigation marks affected tiles dirty → navigation pipeline rebuilds geometry → only then accept paths with current revision. Renderable GLB geometry and rigid body colliders can differ; identify the authoritative collision state first.

**Rapier:** query methods such as `World.castRay`, `World.castShape`, controller displacement queries, and collision groups vary by Rapier version and by 2D vs 3D. Consult https://rapier.rs/docs/user_guides/javascript/scene_queries/ for exact API. A ray is not the same as swept-capsule clearance. A character controller can provide collision-corrected movement — the adapter should request it rather than overriding translations of a physics body.

**Dynamic debris:** hundreds of tiny rigid bodies should not cause a full navmesh rebuild each physics tick. Pick a size and permanence threshold. Temporary bodies can be handled by avoidance; structural destruction can mark affected tiles. For moving lifts, doors and portals, model the link's changing availability and state; static mesh pathfinding alone is insufficient.

**Three.js:** this skill must not initialize `WebGLRenderer`, create another `setAnimationLoop`, or dispose materials/geometries owned by `threejs-gltf-runtime` or `threejs-scene-setup`.

**Performance:** track rebuild queue depth, max tile build time, path latency p95, rejected stale routes and wait state duration; only call these measurements if actually collected.
