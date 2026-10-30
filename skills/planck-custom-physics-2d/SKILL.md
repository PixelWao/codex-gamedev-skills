---
name: planck-custom-physics-2d
description: Use for Planck.js 2D bodies, contacts, ropes, buoyancy, tiles and coupled particle simulations; not Rapier 3D.
---
# Planck & Hybrid 2D Physics — contacts before tricks

Use for existing Planck.js dynamics and games that combine rigid bodies with a custom cell grid (sand, water, steam, lava, etc.). This skill is independently installable and must **not** demand replacing an existing custom simulator with Planck, nor assume Planck can simulate a fluid grid without a coupling layer.

## Before modifying anything

1. Inspect `AGENTS.md`, lockfile/import API, existing scene loop, Planck world initialization, world units (meters vs pixels), fixed step, interpolation, body ownership and all cell/rigid interfaces.
2. Identify Planck version and test the exact local API. Planck's documentation borrows Box2D terminology; other Box2D major versions and forks do not necessarily share its JavaScript API.
3. Capture a deterministic-enough minimal scenario, exact tick count, grid cell dimensions, material density, mass / contact data and a video or logs where available.
4. Map physical ownership: grid solver, rigid solver, conveyor/steam network, visual renderer, triggers. Explicitly define which systems may apply impulses or alter rigid bodies and **when**.

## Non-negotiable rules

- One authoritative world step; never add another hidden `world.step()` in the renderer or interaction handler.
- Do not mutate/destroy/create bodies or joints while the Planck World is locked during contact callbacks. Queue requested changes to a safe post-step point or use documented `queueUpdate` if supported in installed build.
- Do not treat sensor contacts as physical resistance; verify fixture sensors, filter masks and group indices.
- Preserve grid conservation rules and layer semantics; never adjust buoyancy by introducing infinite water, steam or fuel.
- Keep collision/interaction with portals, moving platforms, tile damage, checkpoints and user data; a cosmetic improvement cannot violate gameplay physics.
- Distinguish visual correctness from actual contact/collision impulses and stabilize by evidence.

## Diagnostic workflow

1. **Ownership and scale:** establish which solver updates a body, mapping of pixels to meters, source of collision shapes and time integration.
2. **Contact tracing:** reproduce with `begin-contact`, `pre-solve`, `post-solve` logs as appropriate, inspect fixture filtering and sensor state. Do not create/destroy world entities in these callbacks.
3. **Geometry:** compare collider position/orientation against world grid; fix gaps, wrong edges, body origin and thin surfaces before globally raising iterations.
4. **Time + solver:** distinguish fixed simulation ticks, `velocityIterations`, `positionIterations`, actual substeps, continuous physics and bullet bodies.
5. **Joints:** validate anchors, limits, motors, break logic and chain/rope tension. See `references/joints-and-contacts.md`.
6. **Custom grid coupling:** measure buoyancy, displacement, contact area/volume proxies and transfers with a strict one-way update contract. See `references/grid-and-fluid-coupling.md`.
7. **Regression:** run same-scene, same-tick replay at multiple render rates, plus new failure tests. Record numbers and limitations.

## Minimal Planck stepping example

```js
// Illustrative only. Use the project's existing world and scheduler.
const fixedDt = 1 / 60;
const velocityIterations = 8;
const positionIterations = 3;
// Called by the SINGLE owning fixed-step scheduler:
world.step(fixedDt, velocityIterations, positionIterations);
// Note: solver iterations are NOT physics substeps.
```

Values above are starting points from common documentation, not tuned universal defaults. Avoid blindly switching force autoclearing when adding substeps. Validate against the installed `World.step` signature.

## QA acceptance

- Reproduce bug at known seed/tick. Include block-floor contact, rotating plank edge, fast projectile/thin barrier, hanging rope load, floating/submerged wood, cell flow around solids, scene reload and loaded grid.
- Measure penetration, angular drift, rope anchor stretch, conservation residuals, collision callback counts, per-tick CPU time and number of bodies/fixtures/contacts.
- Run `python scripts/physics_trace_qa.py --input candidate.json --baseline baseline.json` with calibrated thresholds; `assets/physics-qa-report.md` contains the report structure.
- The checker only validates recorded numbers, **not** Planck or fluid behavior. Missing optional metrics must not be presented as passed.

## References

- `references/joints-and-contacts.md` — body/fixture filtering, contacts, joint behavior, bullet testing.
- `references/grid-and-fluid-coupling.md` — rigid-grid coupling, floating, conservation.
- `references/rope-destructible-terrain.md` — rope/grapple and terrain carving regression plan.
- `references/step-and-qa.md` — scheduling, trace contract, step/iteration distinction.
- `SOURCES.md` — reference URLs and compatibility boundaries.
