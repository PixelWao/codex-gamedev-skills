---
name: dynamic-navmesh-steering
description: Use for 3D NavMesh navigation, dynamic obstacle invalidation, crowd steering and Rapier movement adapters; not grid A*.
---
# Dynamic NavMesh & Steering

## Responsibilities
Produce path requests, versioned navigation updates, movement intent and an engine adapter for existing Three.js/Rapier scenes. **Never** instantiate a new renderer, second game loop, duplicate Rapier world or independent NPC decision system. For grid tactics use `grid-pathfinding-strategy`; for route telemetry use `navigation-debugging-qa` when installed.

## Implementation workflow
1. Inspect repo's actual installed Three.js, Rapier, navcat or recast-navigation-js version and its import paths. Check whether a navmesh exists and where its geometry comes from. Never silently upgrade package versions.
2. Choose library empirically: navcat offers pure JavaScript tiled/solo navmesh; recast-navigation-js offers WASM and crowd integration; three-pathfinding is suited to supplied navmesh input. **Do not invent library API methods** from unrelated releases.
3. Choose agent radius, height, maximum slope, step height, traversal layer and special links. Validate units, coordinate spaces (Y-up) and collider geometry.
4. Build separate navigation **query** and **movement** adapters. Navigation returns waypoints; physics resolves actual displacement. Do not set a dynamic body's transform directly.
5. On destruction or door updates, mark affected nav tiles dirty and record a revision **before** accepting new routes. Rebuild via bounded batches. Old routes may not be used after changing topology.
6. Throttle replans, avoid re-routes every frame, add movement dead zones, arrival slowing and congestion policies. Record which agents become stuck or oscillate.
7. Validate a representative scene: normal passage, narrow corridor, after building collapse, moving blockers, multiple agent sizes, off-mesh links and cancel/reload.

## Working reference
- [`scripts/nav-steering.mjs`](scripts/nav-steering.mjs): `TileNavCoordinator`, steering, arrival, separation and collision callback.
- [`references/navmesh-adapters.md`](references/navmesh-adapters.md): library integration contract and version checks.
- [`references/rapier-destruction.md`](references/rapier-destruction.md): synchronization of destruction, physics and navigation updates.
- [`examples/steering-demo.mjs`](examples/steering-demo.mjs): standalone, engine-neutral example.
- [`tests/nav.test.mjs`](tests/nav.test.mjs): tests for invalidation, concurrent rebuild race and steering.

## Required boundaries and handoff
`TileNavCoordinator` accepts caller-provided `queryPath(start,goal,{signal})` and `rebuildTile(tileId)`; it does **not** generate a NavMesh itself. The actual tile enumeration, geometry rebuild and query API must be supplied by the project's installed navigation library. A `planMotion()` callback returns **permitted displacement**; call the existing controller or Rapier world for collision computation, then apply movement in the project-owned physics tick.

Do not equate dynamic obstacle *avoidance* with navmesh *regeneration*. For a movable obstacle, local avoidance may suffice; for a destroyed wall, rebuild navigation geometry if the game's NavMesh requires it. `steerVelocity` works in metres and seconds if the game uses metres. Do not use 2D grid nodes as an exact navmesh agent-radius model.

## QA evidence
Unit tests of the adapter and steering are not evidence that navcat, Recast, Rapier or Three.js has been exercised. Record tested dependency versions, installed runtime, coverage of real collider/geometry queries and missing integration tests separately. Report navigation revision, affected tiles, queued rebuilds, accepted route count and how stale results are rejected.
