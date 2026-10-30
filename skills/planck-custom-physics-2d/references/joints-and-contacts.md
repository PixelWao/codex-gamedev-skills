# Planck 2D joints, collision and callback safety

## Body, fixture and contact separation

A body has motion and mass properties; fixtures attach shapes plus density, friction, restitution, sensor state and collision filters. The world creates/destroys contacts as fixtures overlap. A contact callback is an observation/modification point **inside the simulation**; it is not a safe spot to destroy/create fixtures or bodies. Queue world mutations for after stepping. Planck's `World.queueUpdate` is documented but verify its existence before using it.

```js
// Planck event names from docs; adapt to local installed version.
world.on('begin-contact', (contact) => {
  // Record contact pair identifiers; schedule body creation/destruction later.
});
world.on('post-solve', (contact, impulse) => {
  // Sample physical impulse if supported; do not spawn rigid bodies here.
});
```

### Contact filtering

Planck fixture filtering uses category/mask checks in *both directions*: `(catA & maskB) && (catB & maskA)` for normal groups. Same nonzero `filterGroupIndex` can override mask behavior (positive: force pair interaction; negative: disable), subject to other engine rules. Sensors can generate events without collision response. Check exact fixture creation options: `filterCategoryBits`, `filterMaskBits`, `filterGroupIndex`, `isSensor`.

### Prove collision before editing it

Visual overlap alone doesn't show a missed contact: use debug bodies, contact list, begin/end sequence, impulse magnitude and resulting velocities. Boundary contacts may be transient under continuous collision and missed if inspected only after a timestep; use registered contact listeners.

## Joint tuning

Planck supports several joint types, including revolute, distance, prismatic, rope/pulley in documented builds. The physics effect depends on anchors, limits, motor parameters and which bodies can collide with one another. Begin with one clean joint at rest, then swing, pull, load and release. Test anti-explosion and wake/sleep with representative mass ratio; don't apply a magic '10:1' law.

Solver settings like `world.step(dt, velocityIterations, positionIterations)` adjust constraint resolution. A solver iteration is *not* a time substep. Before increasing either iteration count, confirm valid anchors, reasonable scale, no double stepping and a reliable fixture topology.

## Bullets and thin walls

Continuous collision may solve particular fast collisions using time of impact, but costs CPU and can miss particular complex/moving interactions. Verify bullet configuration of the relevant body, thickness, relative displacement per physics tick, body type and disabled filtering. Prefer test cases covering both static walls and moving targets.
