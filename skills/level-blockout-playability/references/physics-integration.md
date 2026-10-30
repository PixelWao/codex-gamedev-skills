# Authoritative physics adapters: integration notes

**Rapier 3D:** do not instantiate another world. Use existing collider and `world.createCharacterController(offset)` only if already appropriate for the project's controller; call `computeColliderMovement(collider,desiredMovement)` and read `computedMovement()`. Apply the corrected movement using the project's existing kinematic body policy. Gravity is not automatically applied by Rapier character controller; avoid stepping live world during offline QA. For reliable tests use isolated cloned physics state or deterministic test scene and include collision groups/slope/step settings. Docs: https://rapier.rs/docs/user_guides/javascript/character_controller/.

**Planck.js 2D:** inspect installed API and existing `world.step(dt)` loop. For isolated reachability tests create a *test* world or deterministic snapshot/replay; do not mutate production bodies. Use `body.getPosition()` and collision contacts from that world. Preserve actual gravity, fixture dimensions and contact ordering. Docs: https://piqnt.com/planck.js/.

**Three.js:** visualization only; geometry is not by itself collision. `addThreeBlockout` accepts injected namespace and scene; add collision boxes in the host's own pipeline. Update scene matrices before world-space Box3 calculations. Only dispose geometries the adapter owns. Never dispose a material supplied by the host.

**Coordinate policy:** `jumpEnvelope` uses an upward-positive Y axis; Canvas often renders downward-positive. Convert before calling. Test platform width/ledge safety with a collision-aware probe; analytic range gives an upper-bound-style estimate under its strict assumptions, not a certification of playability.

**Dynamic/destructible worlds:** when obstacles break, re-evaluate affected geometry and portal links, invalidate stale plans and re-run reachability. Include independent world state versions or a deterministic event log; route graph updates belong to `dynamic-navmesh-steering` / `grid-pathfinding-strategy`, not this skill.
