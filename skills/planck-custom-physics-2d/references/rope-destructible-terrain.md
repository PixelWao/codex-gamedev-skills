# Ropes, portals and destructible tile terrain

## Ropes / grapples

Decide whether a rope is only a distance cap, a hanging chain, a spring, or a collision-enabled flexible body. These are different physical contracts and cannot be treated as equivalent. Measure: attachment point distance, max extension above rest length, angular/linear energy after load release, break threshold, interaction with terrain edges and player impulses. During a level restart remove old listeners and any associated joints.

Debug route: reproduce with stationary anchors → suspended load → obstacle wrap (if supported) → moving anchor → rope break under load → simultaneous jump/dash/portal traversal. Analyze changes to input sampling separately from the constraint solver.

## Destruction handoff

Damage is gameplay state, but physical removal of cells/fixtures must happen at safe update boundaries. Defer collider chunk rebuilds until neither Planck World nor grid iterators are traversing mutable state. Ensure the set of destroyed cells is applied **once** to physics and art. Update contact manifolds before running integrity tests on support structures.

For rigid pieces cut out of tiles, track parent mass/shape and spawn finite child bodies using an explicit material density, velocity, and tolerable contact separation. Do not destroy a fixture in its own contact callback. If a projectile crosses two portals, preserve travel direction and collision eligibility after transform changes; clear interpolation history on teleport.

## QA scenes

- Fast Ball Dash strikes light and reinforced blocks.
- High-speed slam against thin floor, before/after hole creation.
- Two portals; projectile and rigid body traverse without trapping.
- Hanging object over tiled ledge with rope load at oblique angle.
- Wood floats / rotates in water adjacent to solid bank.
- Fluid escapes into a newly opened cavity; conservation measured.
- Repeated collision, reload and fixture teardown with no listener leaks.

Pass criteria must be set for each mechanic. 'No crash' and 'looks okay' are not acceptance gates for collision geometry or grid conservation.
