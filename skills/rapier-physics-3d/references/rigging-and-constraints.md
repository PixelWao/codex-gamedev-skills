# Cranes, suspension, ropes, links, motors and load paths

## Diagnose the physical structure, not just its appearance

Represent the force path: anchor support → suspension joint / rope segments → load → contacts with target. Identify which entities are dynamic, kinematic or fixed. A purely visual line has no physical tension. A joint supports specific degrees of freedom; attach at the **correct local anchor coordinates**, not simply world coordinates copied into a local-anchor constructor.

### Isolation test sequence

1. One load, one anchor, no contact. Observe free swing, angular velocity, anchor displacement.
2. Same test with gravity, then drive/motor or moving crane body.
3. Add ground contact, then wall impact, then maximum expected impulse.
4. Attach all chains/segments; measure peak anchor stretch (in world units), oscillation frequency, damping and CPU.
5. Repeat with debris; check large connected islands and solver accuracy tradeoffs.

### Approaches, each with tradeoffs

- Single load plus spherical joint/pivot: robust when the gameplay only needs a pendulum and rope shape is cosmetic. Does not model rope slack/collision.
- Multiple constrained rigid segments: models piecewise rope contact and slack-like behavior, but increases joint constraints and solver cost. Self-collision policies matter.
- Tension-only distance/rope model: may be custom, verify mathematical convention and solver stability; don't assume a particular joint type is available in every Rapier version.
- Multibody articulation: potentially better for defined articulated structures; check supported joint type, solver behavior and dynamic rearrangement in the installed release.

### Typical mistakes

- World-space anchor interpreted as local-space anchor.
- Applying an external position correction every render frame after constraints solve.
- Combining strong motors with unbounded angular velocity or wrong joint axes.
- Heavy wrecking ball attached to numerically tiny hook with mismatched scale/inertia.
- Treating solver iteration count as a universal replacement for physical geometry correction.
- Attaching visual mesh to a stale body that was removed and recreated.

### Measurement contract

`joint_error` = difference between the expected anchor relationship and measured relationship at the same tick (world units); define precisely for each joint. Also capture tension/impulse if exposed, per-step solver cost, max stretch, oscillation envelope, and the resulting effect on the target structure. A 'rope looks stable' judgment is not adequate for large impacts.
