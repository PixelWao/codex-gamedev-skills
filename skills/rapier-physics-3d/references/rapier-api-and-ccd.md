# Rapier JavaScript 3D — API checks, CCD and scaling

## Version compatibility is mandatory

Inspect the installed `@dimforge/rapier3d` or `@dimforge/rapier3d-compat` package and its `.d.ts` files. Do not import symbols from a different release branch. Some Rapier documentation includes C/Rust/Bevy-specific fields and naming; never paste those into JS without checking.

High-value areas to confirm in the actual project:

- World construction and init / compatibility build loading; physics is not initialized until WASM is ready.
- `world.integrationParameters.dt` and integration settings in the installed JS release, world step scheduling and event collection.
- Body and collider descriptors, collision and solver groups, sensor flags, active events, query predicates.
- `RigidBodyDesc.dynamic().setCcdEnabled(true)` or runtime `rigidBody.enableCcd(true)` where available.
- `setAdditionalSolverIterations` when the installed API exposes it.
- `World.createImpulseJoint` versus `World.createMultibodyJoint` and how joints are removed.
- Debug rendering, snapshot and world lifecycle cleanup.

## CCD is a diagnostic branch, not the default fix

Rapier JS docs describe automatic motion clamping/sweeping for fast dynamic vs fixed colliders and an opt-in CCD mode for moving dynamic/kinematic targets. Both have limitations; even two CCD-enabled bodies may tunnel for certain relative motion. Enabling per-body CCD cannot correct a collider in the wrong place, an inactive collision pair, teleportation, or uncontrolled object updates.

Measure: `speed * dt`, collider effective thickness/shape, relative velocity and angle, target's motion, missed contact count, step cost, gameplay outcome.

Run targeted A/B tests: default → enable specific bullet body's CCD → optionally test appropriate substep count/shape changes. Do not set `maxCcdSubsteps=0` accidentally (this disables world CCD mechanisms in documented versions). If using predictive soft CCD, tune its prediction distance against false premature collisions and broad-phase cost.

## Filtering is two distinct questions

- **Contact/filtering:** decide which pairs interact through collision groups and rigid/kinematic/fixed collision rules.
- **Event collection:** decide which contact/intersection events are emitted and drained after stepping; lack of event is not necessarily lack of collision.

Audit sensor flags and filters separately. Named semantic layers are better than unexplained bit constants; test representative pairs (body vs floor, debris vs barrier, ball vs crane, character vs loose fragment).

## Units and mass properties

Pick one world length unit convention and document graphics ↔ physics coordinate conversion. Rapier solver tolerances and contact behavior are sensitive to geometric scale. Distinguish density-derived mass, explicitly specified mass properties, center-of-mass offsets, tensor of inertia and kinematic motion. Check that friction/restitution combined across interacting collider materials matches intended outcome in installed version.

## Reproducibility

Rapier WASM/JS documents cross-platform deterministic simulation subject to identical version, operations, initial conditions, body creation/removal order, and cross-platform deterministic setup values. Random scripts, `Math.sin/cos` setup and nondeterministic callbacks can invalidate those premises. Compare equal-tick snapshots when appropriate; otherwise compare measured invariants and representative runs. See https://rapier.rs/docs/user_guides/javascript/determinism/.
