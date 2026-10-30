---
name: level-progression-pacing
description: Use to design key/ability gates, puzzle progression, critical routes, challenge pacing and checkpoints; not geometry collision metrics.
---
# Level Progression & Pacing

## When to use
Level goals, critical path, ability gates, keys, puzzles, checkpoints, story/encounter beats, non-linear returns, irreversible traversal and destructible walls. Do not generate maps here; reuse `procedural-level-design` when present. For independent validation use `level-design-debugging-qa`.

## Procedure
1. Inspect actual game goals, inventory persistence, checkpoint restore semantics, nav and puzzle logic. Do not silently substitute invented mechanics or a second save system.
2. Describe rooms and **directed** exits as plain JSON (`examples/solvable-level.json`, schema in `references/level-schema.md`); link each gate to a real ability/key/flag/world change. Make one-way exits intentional and telegraphed.
3. Use `validateLevel()` first to catch missing nodes, unreachable sources of resources and invalid key counts. Correct the **historical** missing `boss` and missing `red_key` before any art is authored.
4. Run `analyzeProgression()` with a bounded finite-state search. It records acquired abilities, flags, destroyed obstacles, **consumable** keys and rooms already looted. Backtracking is allowed. `solvable` means *one route* exists; inspect `softlocks` for alternate decisions which cannot reach the goal.
5. Treat `inconclusive` as unknown: increase state budget or simplify abstractions; never advertise as solved or impossible. Physics-dependent switches, time limits, movable debris and analog machines require an instrumented game simulation. This solver assumes monotonic flags/destruction, deterministic gates and one-time room pickups.
6. Use `analyzePacing()` to check teaching a mechanic before a test and presence of rest before climaxes. Pacing quality remains a human-design judgment; playtest and measure actual pacing.
7. Check checkpoint restore against the actual save rules; `respawnAtCheckpoint()` is merely a configurable conservative helper, not a full proof of persistence correctness.
8. Record validated witness paths, warnings and reproducible seeds; integrate QA in procedural generation without letting runtime graph checks replace physical testing.

## API
`src/progression.mjs` and `src/progression.d.mts`; tests `node --test tests/*.test.mjs`. The level format is a declared abstraction, not a runtime engine scene or editor import format. For optional branching, report softlocks explicitly. No effects should be granted again by repeatedly entering a looted room.

## Related skills
level-blockout-playability, level-design-debugging-qa, procedural-level-design, grid-pathfinding-strategy

## References
`references/level-schema.md`, `references/pacing-playtests.md`, `examples/solvable-level.json`, `examples/broken-level.json`.
