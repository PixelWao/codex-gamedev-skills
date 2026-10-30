# Solvability tests by abstraction strength

**Tier 0 / geometry**: rectangular grid, no overlap, legal spawn and exit, valid tile symbols.

**Tier 1 / simple graph**: flood-fill/BFS for 4-neighbor walkable cells; this checks only simple cardinal connectivity. The demo can provide this proof.

**Tier 2 / rules progression**: inventory/switch state graph for locks and objectives, including temporary obstacles. Complete puzzle solvers are genre-specific. To claim a unique solution, enumerate solutions until >=2 are found; a timeout means UNKNOWN, not UNIQUE.

**Tier 3 / actual physics and controls**: platformer/jump/dash/portal routes and destructible structures depend on continuous position, velocity, collision normals, trajectories, physics step and ability state. Build a reachable-state graph using actual movement rules or a headless game-runner; robustly bound time/state count. Never equate Manhattan distance to jumpability.

For MELTDOWN-type cellular/rigid/fluid worlds, include dynamic state of doors, steam pressure, pumps, valves, inventory, temperature, materials and checkpoint respawn. For a Ball Dash platformer, include breakable block thresholds, portal pairing and momentum. No generic BFS over floor cells validates these interactions.

## Regression corpus

At least: tiny and huge allowed map, blocked spawn/exit, disconnected subregions, key behind door, wrong-way one-way platform, high-speed tunneling case, moving object vs static blocker, jump just at physical limit, destructible shortcut, portal chain and maximum-budget level. Each counterexample should be pinned as a fixture with the exact algorithm version and seed.

## Reporting

A valid report states: `generated successfully`, `topologically connected`, `lock-state reachable`, `physics-reachable`, `puzzle solvable`, `uniqueness checked`; unknown/unrun fields are explicitly `NOT TESTED`. Gameplay difficulty is a subjective design question in addition to objective validity.
