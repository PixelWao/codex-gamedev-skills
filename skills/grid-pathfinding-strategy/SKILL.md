---
name: grid-pathfinding-strategy
description: Use for grid A*, Dijkstra, BFS, flow fields, terrain costs and tactical movement routes; not 3D NavMesh steering.
---
# Grid Pathfinding & Strategy Navigation

## Mission and scope
Implement safe navigation on discrete 2D grid maps. This skill owns **path queries and route costs**, not unit physics, AI intent, scene creation, or rendering. For 3D navmesh use `dynamic-navmesh-steering`; for independent validation use `navigation-debugging-qa` (optional, no hard dependency).

## Required workflow
1. Inspect the **existing** map representation, map version, cell dimensions, diagonal/corner policy, terrain weights, unit footprint and portal rules. Do not silently replace its graph or save schema.
2. Choose BFS for equal-cost steps, Dijkstra for weighted maps or multi-goal reference cost, A* for single weighted destination, or reversed-edge flow fields for many units moving toward a common objective.
3. Identify whether portal costs / teleports are possible. If so, a purely geometric A* heuristic may **overestimate**; use Dijkstra/zero heuristic until a proven admissible heuristic exists.
4. Validate positive finite movement costs, start/goal passability and bounded node expansions; report `blocked`, `unreachable`, `budget`, or `ok` explicitly.
5. In destructible maps bump the graph revision on topology/cost edits, invalidate dependent routes/flow fields, and schedule recalculation using an explicit budget. Do not request paths every animation frame.
6. Unit steering must consume the route but remain controlled by the existing movement/physics API. Do not teleport rigid bodies by overwriting transforms.
7. Test against independent Dijkstra and multi-seed maps, plus special cases (corner cutting, unit footprint, one-way portals). Keep a before/after benchmark.

## Files to use selectively
- [`scripts/grid-navigation.mjs`](scripts/grid-navigation.mjs): standalone `DynamicGrid`, `findPath`, `buildFlowField`. Algorithms are deliberately small and non-rendering.
- [`references/algorithm-policy.md`](references/algorithm-policy.md): algorithm selection, costs, routing and budgets.
- [`references/destructible-maps.md`](references/destructible-maps.md): map invalidation, dynamic changes, portals, strategic units and integration.
- [`examples/grid-demo.mjs`](examples/grid-demo.mjs): executable sample. `node examples/grid-demo.mjs`.
- [`tests/grid.test.mjs`](tests/grid.test.mjs): `node --test tests/grid.test.mjs`.

## Interface and cautions
Use grid cells `[x, y]`; `findPath` returns `{status, path, cost, expanded, revision}`. `buildFlowField` returns `{dist, next, route(), revision}`. Passing an out-of-bounds cell throws; blocked and unreachable paths have explicit statuses. Costs describe entering destination cells, with diagonal step multiplier `sqrt(2)` and positive-cost directed off-grid links for portals. A footprint measured in grid cell radius is an approximate square clearance check, **not** an exact polygonal agent radius.

Use seeded deterministic generation for source maps, not `Math.random()` hidden within routing. Graph iteration order intentionally fixed. Never assume all unreachable terrain can be bridged by the generator. Compare results by numerical cost and legality, not by requiring one particular tie-broken path.

## QA / exit contract
Report map dimensions and revision, selected algorithm, found cost or failure reason, peak expansion budget, invalidation strategy and tests actually run. Never report successful GPU, physics, navmesh or live gameplay tests from pure grid unit tests.
