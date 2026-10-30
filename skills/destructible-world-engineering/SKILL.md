---
name: destructible-world-engineering
description: Use for structural damage graphs, collapsing supports and dirty navigation regions in destructible worlds; not rigid-body solver tuning.
---
# destructible-world-engineering

## Mission
Coordinate structural integrity and physical world updates for 2D/3D destruction without owning the simulation loop, physics engine, renderer, or level state persistence.

## Procedure
1. Inspect existing physics stack (Rapier, Planck, custom), current material taxonomy, entity IDs, save schemas, collision event format, and level graph.
2. Identify authoritative persistent geometry and collision ownership; do not duplicate live rigid bodies. Define anchors, nodes, bonds, health and regional dirty flags.
3. Process contact-force/impact events after fixed physics step. Convert force and fixed dt into a clearly labeled approximate impulse; tune a gameplay damage law separately from actual momentum conservation.
4. Call `DestructionGraph.enqueueImpact()` or `enqueueBondDamage()` for a unique event ID; call `flush()` only at a safe transaction boundary. Collect destruction events.
5. Remove or replace meshes/colliders in the existing engine only after `flush()`, avoiding mutation within collision callbacks. Update navigation dirtiness and save-schema events atomically.
6. Validate anchor connectivity, cascades, material and collision-filter consistency, performance budgets, repeatability, and visual/physics alignment. Test with debris density and the longest collapse chains.
7. Compare replay traces against baseline and report physics-version differences, mesh/collider mismatch, tunneling and user-visible defects.

## Responsibility boundaries
The bundled graph handles damage and connected support, NOT volumetric cutting, finite-element stress, CSG, rigid body forces, fracture mesh generation or real Rapier/Planck simulation. The `strength` bond attribute is reduced by explicit `enqueueBondDamage` events; global physics forces remain authoritative in the host game.

## Files to use
- `src/` — tested algorithms and/or CLI.
- `tests/` — independent regression checks.
- `examples/` — small fixture, not a claim about project compatibility.
- `references/integration.md` — interop rules and use cases.
- `references/sources.md` — documentation sources, limitations.
- `PROVENANCE.md` — licensing scope.

## Verification
Run the tests described in `README.md` after any change; cite untested engine/device integrations as unverified.
