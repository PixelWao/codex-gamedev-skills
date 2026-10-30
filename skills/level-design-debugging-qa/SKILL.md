---
name: level-design-debugging-qa
description: Use to test level solvability, unreachable goals, soft-locks, invalid rooms and progression regressions; not author level pacing.
---
# Level Design Debugging & QA

## When to use
Audit authored or procedural level JSON for structural integrity, reachability, key/ability gating, traps, physics jump estimates, checkpoints and progression regressions. Independent offline validator for `level-progression-pacing` and a lightweight deterministic JS telemetry recorder.

## Procedure
1. Obtain target level snapshot, controller metrics, game version and seed. Respect the user's own save, physics, pathfinding and generator ownership.
2. Normalize level to `references/level-schema.md` or write a lossless adapter; never pretend your engine's level JSON matches the schema without mapping all relevant gates and one-way edges.
3. Run `python src/level_qa.py examples/solvable-level.json --strict-softlocks --out report.json`. For broken fixtures expect **exit 1**; budget-limited **exit 2** (inconclusive). Parse `status`, `issues`, `softlocks`, `coverage` and `witness`. Pure Python, no network or external dependencies.
4. Feed instrumented game events to `LevelTrace`: `enter`, `death`, `checkpoint`, `puzzle`, `destroy`, `complete` with stable event ID, timestamp and room ID. Export JSONL. Instrument live game only; this tracer does not drive simulation.
5. Check custom checkpoint/death semantics, destruction, optional consumables and puzzle reset directly in the game. Failure to find a bug under a finite search cap is **not** proof of solvability.
6. Run invariant/negative tests and compare the independent Python search to JavaScript progress solver on shared fixtures. For three.js / Rapier / Planck physical verification load a representative scene and deterministic seed, compare with actual collider contacts. Use manual playtests for readability and delight.
7. Attach a reproducible JSON report, seed, source revision, environment, failed witness/trap route, uncovered states and limitations.

## Contract
CLI `src/level_qa.py`, runtime `src/telemetry.mjs`, types `src/telemetry.d.mts`; tests in `tests/`. Inputs JSON v1 from `level-progression-pacing`. Python search is independently implemented and **not** a wrapper over JS. Jump estimates are simplified constant-acceleration ballistics; actual physics and timed puzzles require in-engine coverage.

## Related skills
level-blockout-playability, level-progression-pacing, procedural-generation-qa, navigation-debugging-qa

## References
`references/level-schema.md`, `references/qa-matrix.md`, `examples/solvable-level.json`, `examples/broken-level.json`.
