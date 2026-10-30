# Rigid bodies interacting with cellular material worlds

## Model the interface explicitly

Planck integrates rigid bodies while a separate grid simulation updates sand/water/gas/steam/heat. Neither should silently integrate the same object twice. Implement a narrow adapter that samples the grid's state once per fixed tick and passes forces/impulses to the physical body, then queues displacement/material updates according to gameplay rules.

**Proposed order, adapt to existing architecture**:

1. Snapshot grid material and temperature for this tick.
2. Determine body-grid overlap in world units and sample occupied fluid cells.
3. Compute force/drag/buoyancy from current occupancy; clamp and validate finite outputs.
4. Apply forces/torques to bodies via existing Planck adapter.
5. Advance the existing rigid world exactly once.
6. Queue grid displacement/erosion/damage requests and execute them at safe grid update boundary.
7. Emit gameplay events and sync render state separately.

If the game's existing order is different, preserve it unless a measured defect requires a controlled change. Never let the cell solver teleport rigid bodies and then use the same frame's integrated pose as if they were independent.

## Buoyancy and floating wood

For a fully submerged body, buoyant force approximates `fluid_density * displaced_volume * gravity`. A 2D engine needs a clearly defined *effective depth* to map area to volume; treating pixels as physical meters changes scale radically. Waterline intersection changes the submerged portion and **center of buoyancy**, producing torque. In a complex cell world, estimate submerged area/centroid robustly rather than applying a fixed upward force at the body center.

Diagnostics for 'wood rests on a corner and refuses to rotate or enter water':

- Is the collider intersecting the bank or incorrectly snapping at one contact point?
- Does an invisible floor/tile collider extend into the water?
- Are torque and angular velocity constrained by a bug or a kinematic override?
- Are overlapping water cells actually counted in displaced volume/area?
- Is the applied buoyancy at the wrong center, producing zero or opposite torque?
- Are contact friction/fixtures and body density incompatible with intended behavior?

## Conservation and material coupling

Keep an explicit ledger: `water_before + water_added - water_removed = water_after + residual`, with analogous fuel/steam mass or game-defined volume rules. If the game adopts a nonphysical rule (e.g. 3 steam cells to 1 water cell) preserve it as a declared invariant instead of 'correcting' it using real-world physics. Record net exchanges between pipes, tanks, grid, bodies and condensers separately. Grid-to-body displacement must not create fluid or solid cells unexpectedly.

## Collision representations

Tile merging and contour extraction can speed colliders, but invalidate contact geometry if changed too aggressively. Treat tiny, fast projectiles differently from large slow rigid bodies. Rebuild only affected collider chunks and validate boundary seams, navigation, foot planting and fall-through at edges. Never introduce a collidable ghost floor to make floating look right.
