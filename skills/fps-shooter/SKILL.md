---
name: fps-shooter
description: Use to implement or debug FPS weapons, hitscan, projectiles, ammo, reload, spread, damage and Rapier raycasts; not camera controls.
---
# FPS Shooter — Combat Engineering v2.0

Use this skill to implement **combat logic** for FPS and transferable shooter mechanics. Prioritize correct collision semantics, reproducible behavior, and regressions over feature count.

## Scope and boundaries

- Own: weapon state, firing, ray hits, projectile sweeps, ammo/reload, recoil/spread events, damage calls, combat balancing, validation.
- **Do not own:** game loop, Three.js renderer, Rapier world, camera controller, input binding, animation engine, HUD, enemy decision AI, or networking. Integrate through adapter callbacks.
- Inspect installed `three` and `@dimforge/rapier3d-compat` / `@dimforge/rapier3d` versions before writing adapter code. Treat examples as contracts, not a reason to upgrade versions.
- Use project-specific `AGENTS.md` and established component boundaries. Preserve persistent state and public APIs. Never silently change game rules.
- Multiplayer requires a server-authoritative design; the sample is **single-player only**. Do not trust client hit reports.

## Required workflow

1. **Inspect** the existing update loop, physics step, coordinate conventions, collision groups, weapon/equipment system, damage model, camera, and input. Identify authoritative state and target platform.
2. **Pick** hitscan vs moving projectile based on gameplay. For both, include solid world geometry, damageable hitboxes, and correct exclusion of the shooter. For hitscan, compare camera aim with muzzle clearance; never use a `SHOOTABLE`-only collision mask.
3. **Model** weapon transitions explicitly (semi, auto, burst; cooldown, reload, magazine/reserve, overheat, switch). Decide how input edges, game pause, switching, and interruptions behave before coding.
4. **Integrate** on the project's existing fixed step. Generate shot events at deterministic simulation times; consume them via existing audio/visual/health systems. Do not create a second `requestAnimationFrame`, `setAnimationLoop`, or physics world.
5. **Validate** numeric parameters and failure cases. Spread sampling must match desired distribution. Make RNG seedable; keep hit confirmation and death rewards idempotent.
6. **Measure and test** scenarios in `references/qa-and-integration.md`; run included unit tests and per-project physics tests. Save baseline metrics and failing seeds.
7. **Report** changed files, measurement environment, test results, limits, and any deferred integration checks. Avoid claims about actual GPU or Rapier correctness based on mocks.

## Read supporting materials only when applicable

| Need | Reference / implementation |
|---|---|
| Combat state machine, burst/reload/cooling | `references/weapon-fsm.md` and `src/weapon.mjs` |
| Hitscan, muzzle obstruction, projectile sweeps | `references/ballistics-hit-detection.md`, `src/ballistics.mjs` |
| Three.js / Rapier integration and version checks | `references/threejs-rapier-integration.md`, `src/adapters.mjs` |
| Recoil, spread, TTK, accessible aim-feel tuning | `references/weapon-feel-balancing.md`, `src/math.mjs` |
| Deterministic regression, performance, test scope | `references/qa-and-integration.md`, `scripts/analyze_combat_trace.py` |
| Implementation example | `examples/integration.mjs`; typed usage `examples/typescript-integration.mts` |

## Implementation contract

- All combat ray casts MUST return the *nearest blocking collision* from all relevant solid world and actor colliders. Mark as `{kind:'world'}` or `{kind:'damageable'}`; arbitrary hitboxes that should not block must be excluded deliberately, **not** by filtering all walls away.
- `fireHitscan()` first gets a camera aim point, then casts from actual muzzle to validate clearance. The muzzle result determines damage. Collision adapters must include solid obstacles even when the target is behind them.
- `advanceProjectile()` requires a swept query callback each physics step. An endpoint-only overlap cannot guarantee no tunneling. Fast curved projectiles may require substeps or more sophisticated motion casts.
- `WeaponController.tick(dt,input)` accepts `0 < dt <= 0.25s`. Call on a fixed simulation tick; on visibility/resume, cap accumulator according to game policy. `shot` events carry intended simulation time; avoid render-FPS-dependent fire rates.
- Separate **recoil** (camera output event) from **spread** (aim direction change). Never mutate camera rotation from deep within the weapon core.
- `DamageLedger` suppresses repeated application of the same event and duplicate kills within its scope. Use stable IDs and bound its lifetime; in multiplayer, implement idempotency on the authoritative server.
- Validate `magazineSize`, positive fire rate/damage/projectile speed, finite angles and recoil patterns. Treat zero/NaN/Infinity as errors, not silent defaults.

## Ready-to-run QA (from this skill directory)

```bash
node --test tests/*.test.mjs
python -m unittest discover -s tests -p 'test_*.py'
tsc -p tsconfig.json
node examples/integration.mjs
python scripts/analyze_combat_trace.py assets/sample-combat-trace.jsonl --rate 5
```

Node.js 20+ and Python 3.10+; TypeScript compiler needed only for `tsc`. No runtime npm installation required for pure JS tests. **Real Three.js/Rapier integration is a separate test** requiring versions already installed in the target project.

## Acceptance gates

- No wall penetration when camera sees a target but the muzzle is obstructed.
- Rate, ammo, reload and burst tests pass at 30, 60 and 144 FPS-equivalent steps.
- No `NaN` or unbounded loops. The first shot, interval, and last shot have explicit timing semantics.
- Spread directions are normalized and inside the configured cone; seed replays match.
- Projectile sweeps use world obstacles and terminate on first impact/range/lifetime.
- No duplicate damage/kill events; no unintentional change to existing camera/physics/input implementation.
- Integration and performance claims are backed by actual target-game tests, not mock results.
