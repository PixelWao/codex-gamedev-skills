---
name: procedural-level-design
description: Use to generate seeded playable levels, rooms, corridors, caves and puzzle layouts; not whole-world terrain or QA reports.
---
# Procedural level design

Purpose: produce **playable, paced, reproducible challenges**, not merely attractive random tile arrangements. Work within the existing game's movement model, goals, physics, and editor. Tools are small deterministic, stdlib-only reference implementations; they do not replace the production level generator.

## Activate for

Roguelike dungeons, rooms/corridors, cave layouts, BSP, tile adjacency/WFC, puzzle generation, modular structures, destructible platformer routes, accessible exits, locks/keys, spawn hazards, or difficulty control. Global terrain/biomes belong to `procedural-world-generation`; cross-generator statistical QA belongs to `procedural-generation-qa` (optional).

## First inspect

1. Read `AGENTS.md`, authoritative map/physics format, collision grid, portal semantics, player states, jump/dash parameters and current level authoring pipeline.
2. Write level contract: movement topology, start/exit, locks/switches, required pickups, hazard costs, destructibility, enemy capabilities, completion goals and generation budget.
3. Define **proof obligation per rule**: graph connectivity for grid movement is not physical jumpability, and adjacency correctness is not puzzle solvability.
4. Choose algorithm family to match the goal: graph + rooms for readable flow; bounded random walk for organic caves; constrained tiles for modular aesthetics; gameplay-aware constructive grammars for puzzles.

## Generate / validate / iterate

1. Define a **progression graph** before decorating: regions, required encounters, critical path and optional branches, locks and prerequisite rewards. Mark explicit requirements; do not bury them in random rolls.
2. Use seeded, domain-separated randomness for topology, decoration, items, enemies. Cap every placement/restart/backtrack attempt and emit an informative failure instead of looping indefinitely.
3. Generate minimal **logical level data** first. Keep appearance and engine objects out of the layout solver. Respect saved-algorithm version and existing generator API.
4. Validate geometry, bounds, spawn safety, reachable exit, locked progression state, no invalid overlaps and objective conditions. If impossible, reject/retry with a finite cap or repair under constraints, then revalidate from scratch.
5. For platformers, test **reachable physics states** using the actual movement/collision code (standing, falling, jumping, dash, portals, destructible surfaces). A 4-neighbor BFS is only a grid diagnostic; never claim it proves platformer completion.
6. For puzzles, integrate a genuine rule-specific solver and check uniqueness **when required**; no generic tile flood-fill proves e.g. Slitherlink, Nurikabe or mechanical pressure puzzles.
7. For tile constraint generators (WFC-like), run local-constraint solver, detect contradictions and search-budget exhaustion, then **separately** enforce global paths, game rules and style budgets.
8. Sweep fixed and varied seeds. Report success, rejection and repair rates, minimum/median path lengths, difficulty and distribution. Preserve unchanged gameplay and save data when tuning presentation.

## Working baseline commands

```bash
python scripts/levelgen.py --mode rooms --seed 123 --width 48 --height 32 --output room-map.json
python scripts/levelgen.py --mode cave --seed 123 --width 48 --height 32 --target 0.40 --output cave-map.json
python scripts/constraint_tiles.py --seed 123 --width 5 --height 5 --output modular-tiles.json
python -m unittest discover -s tests -v
```

`levelgen.py` yields `pcg-map-v1` JSON, safe spawn and a far reachable exit. It validates cardinal connectivity and bounds and raises an explicit budget error for stalled caves. Cave target is a fraction of **interior** cells; the border remains solid. It does not simulate player physics. `constraint_tiles.py` demonstrates bounded simple-tiled adjacency CSP (a WFC-related family), **not** overlapping sample-image WFC. Its output states explicitly that global connectivity/solvability is unproven.

## Acceptance gate

- Every generated map can be recreated by seed + algorithm version + config; new versions invalidate old snapshot hashes only intentionally.
- Every invalid parameter (tiny grid, impossible room bounds, invalid target, impossible adjacency, budget exhaustion) fails clearly and quickly.
- Grid maps satisfy their declared movement graph; progression locks are checked with **stateful** search including pickups and abilities.
- True 2D physics/platformer solvability is established by simulation or by a justified equivalent movement-state solver, with collision masks and movable/destroyed objects correctly modeled.
- Puzzle-solvers are game-rule-specific, check completion (and optionally uniqueness) and reject impossible/no-solution layouts.
- No unapproved replacement of editor, loop, renderer, physics engine, existing levels or player abilities.

## Troubleshooting

| Failure | Diagnostic | Corrective direction |
|---|---|---|
| Rooms can't fit | Check min size vs border, attempts, occupancy | Decrease room footprint, report unattained quotas |
| Endless cave generation | Goal exceeds interior, bounded walk stagnates | Bound attempts/steps, reduce goal, deterministic retry |
| Tile set generates contradictions | Empty domains, edge port compatibility | Review adjacency / preconstraints, cap search, report seed |
| Exit reachable in BFS but not in game | Grid neighbor assumptions ≠ jump/dash/portal physics | Run actual movement-state solver/simulator |
| Key placed behind its own lock | Objective dependency cycle | State-space BFS with key inventory; repair order |
| Repeated bland layouts | Inspect progression graph, diversity and optional loops | Vary structural archetypes rather than random noise |

## Supporting resources

- `references/dungeons-and-graphs.md` — topological planning, bounded carving, progression.
- `references/constraints-and-wfc.md` — local adjacency and global constraints.
- `references/solvability-and-physics.md` — test layers, movement states, uniqueness.
- `references/map-data-contract.md` — output schemas, compatibility.
- `references/sources.md` — bibliography and adaptation guardrails.
- `assets/LEVEL_ACCEPTANCE_REPORT.md` — QA report template.

Do not assert level playability without validating the real ruleset; document exactly which abstractions were verified.
