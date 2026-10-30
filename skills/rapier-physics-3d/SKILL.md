---
name: rapier-physics-3d
description: Use for Rapier 3D rigid bodies, contacts, joints, CCD, cranes, ropes and mass tuning in Three.js; not 2D Planck physics.
---
# Rapier Physics 3D — controlled engineering

**Scope:** production 3D Rapier physics and Three.js/WASM integrations. Do **not** silently convert Rapier 2D, replace the game loop, inject a new world, or modify game design to make a benchmark pass. For generic loop diagnosis use the principles in `references/step-and-qa.md`; this skill is independently usable.

## Gate 0: establish actual API and system

1. Read `AGENTS.md`, package lockfile, Rapier import and init path (`@dimforge/rapier3d` / `-compat` / pinned WASM build), scene code, adapters, and any existing hooks.
2. Check **installed version's** declarations for every proposed property/method; web examples may target a different version. Record renderer (Three.js) and physics ownership boundary.
3. Inventory all worlds, rigid bodies, colliders, rigid-body types, impulse and multibody joints, anchors, motors, contacts, collision/event queues and `world.step` callers.
4. Capture baseline reproduction and profiling before changing world parameters; log scale, gravity, timesteps, masses/inertia, CCD, groups, debris shape costs and active islands.

## Red lines

- No second `world.step`, parallel integrator, or direct writes of interpolated render pose into simulated rigid bodies.
- No arbitrary override of Rapier integration settings across the entire game when one mechanism or island is unstable.
- No hard-coded universal limits on mass ratios, triangle count, iterations or fall speed; calibrate to scene size and behavior.
- No collider approximations that alter apparent destructibility, injury/failure zones or collision-critical spaces without user signoff.
- No mutation of scene serialization, IDs, editor data or exported content unless explicitly required.
- Keep `world.free()`/WASM cleanup and event lifecycle as established by installed build. Do not leak old worlds after restart.

## Diagnose in this order

1. **Time + units:** confirm fixed timestep and single stepping owner. Check length units, gravity scale and graphics-to-world coordinate mapping.
2. **Shape + contacts:** body collider shape, offsets, parents, sensors, groups, restitution and contact traces; debug-render shapes to distinguish visuals from actual colliders.
3. **Mass + inertia:** verify dynamic mass/inertia, center of mass, incorrect immovable kinematic assumptions and contradictory transform setters.
4. **Constraints:** record joint local anchor error, motor target, stiffness/damping, angular velocity and solver iteration effects. See `references/rigging-and-constraints.md`.
5. **High velocity:** test candidate CCD modes on actual moving targets, with measured CPU cost. The built-in automatic sweep against fixed obstacles is not equivalent to enabling CCD for dynamic bodies.
6. **Debris:** validate separation at spawn, realistic fragment colliders, contact density, wake/sleep, and fracture impulse conservation. See `references/fracture-and-debris.md`.
7. **Tune only after classification:** choose geometry fix / single-body CCD / local island precision / joint design / restrained substep; run before-after tests.

## Example: local solver precision

```js
// Example only: confirm this method exists in the INSTALLED Rapier typings.
// Apply selectively to a problematic mechanism, not every debris fragment.
const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setAdditionalSolverIterations(4);
const body = world.createRigidBody(bodyDesc);
```

This increases work for the connected island; it is **not** a free per-body adjustment. Compare joint error and physics-step p95 before promoting. More iterations can conceal invalid anchors or intersecting colliders.

## Acceptance gates

- Reproduce original fault using a fixed scene/seed and exact tick counts.
- Include at minimum floor drop, swing under load, fast impact on a moving target, debris contact stress, pause-resume/scene reload and regression around injury/fail zones if present.
- Record `step_ms` p50/p95/p99, joint anchor error, worst measured penetration, CCD misses, active bodies/islands and time-to-sleep.
- Export trace described in `references/step-and-qa.md`, run `python scripts/physics_trace_qa.py --input candidate.json --baseline baseline.json` with **calibrated** explicit thresholds, and complete `assets/physics-qa-report.md`.
- A green numeric report is not sufficient without a visible/collision correctness check. A proposed change without real-engine execution is **UNVERIFIED**.

## References

- `references/rapier-api-and-ccd.md` — package/API audit, CCD, groups, snapshots.
- `references/rigging-and-constraints.md` — swinging loads, cranes, joints, motors and stability.
- `references/fracture-and-debris.md` — fracture, rubble, collision/CPU tradeoffs.
- `references/step-and-qa.md` — time ownership, metrics and trace format.
- `SOURCES.md` — verified source index.
