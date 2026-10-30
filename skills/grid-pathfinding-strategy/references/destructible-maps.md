# Dynamic terrain, portals and unit footprints

Map lifecycle: apply deterministic world edit → update collision/topology state → bump navigation revision → mark affected routes/fields stale → request a new path within the game budget. Do not mutate a separate phantom nav grid while the physics/collision world still considers the old wall solid. Decide which subsystem is authoritative for passability.

**Destruction:** wall demolition and new bridge construction must affect both graph passability and physics at a defined synchronization point. Existing routes are invalidated immediately. Until a safe replanning result arrives, NPC should stop, wait, or use another explicit fallback; do not silently run through unvalidated geometry.

**Portals and lifts:** represent directed edges with explicit travel cost and prerequisites. Portal exits can be blocked. A portal in a platformer may require time-dependent availability, ability constraints or a state-space search (position + abilities), outside this minimal grid reference.

**Footprints:** square clearance dilation in the reference script helps reject narrow passages. For irregular colliders or diagonal corridors use geometry/physics clearance queries, not a cell approximation.

**Battle-of-Keppler example:** terrain costs and movement classes should be separated; water impassable to land units unless abilities allow it. Do not assume a 12×12 map or alter campaign/map settings. Route scheduling should honor unit turn rules and fog-of-war information.

**MELTDOWN / CRASH LAB:** register destructible tile updates and portal revisions; use existing engine's physics to determine if a path segment is traversable. A plan for moving platforms must account for timing rather than static 2D A* alone.
