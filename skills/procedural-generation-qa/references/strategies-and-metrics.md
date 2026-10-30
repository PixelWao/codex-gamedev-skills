# Procedural regression test strategy

## Test strata

1. **Pinned seeds**: small stable set stored with algorithm/engine versions, useful to reproduce historical bugs and save compatibility.
2. **Boundary/invalid inputs**: tiny maps, near-maximum sizes, zero/negative/NaN weights, no rooms, max room too big, all walls, border spawns, unreachable key, contradictory tiles, exhausted search budget, negative global coords.
3. **Exploratory seed sweep**: hundreds of heterogeneous seeds where compute budget permits. Include rare failure/timeout logging and stop rule.
4. **Distribution sweep**: tile types, map coverage, structural paths, room sizes, resource access, faction spawn fairness and duplicate structures.
5. **Headless gameplay smoke**: project-specific agents with actual physics and objectives. A successful graph test is not enough.
6. **Cross-build compare**: same seed and config on both baseline/candidate in a controlled environment. Check distribution regressions and frame-time/generation-time separately.

## Statistical cautions

- p50/p95 of *successful* seeds systematically exclude failures. Always display `failure_rate` first.
- A low duplicate rate does not establish high aesthetic diversity; hash differs even when only one wall cell changes.
- A finite sample of random seeds cannot logically prove absence of a rare failure; choose acceptable risk bounds and record sample size.
- Median and p95 path length do not measure challenge, speedrun complexity or solvability of physically constrained platformers.
- Compare histograms/quantiles with common seed vectors when tuning; independent samples add extra random variation.
- Treat algorithm changes as compatibility-breaking for seed-only saves unless proven otherwise.

## Reproduction record

For any failure save: commit/branch, generator version, algorithm ID, dependency/engine versions, OS/runtime, all parameters, exact seed, JSON output, minimal expected/observed difference, timeout, stats and one-line command. On replay, fail-fast if the original bug resurfaces.

## Useful additional custom checks

- World strategy map: minimum passable area per faction, resources within travel cost threshold, spawn-to-spawn distance fairness, ports/coast access, sea-lane connectivity, route costs per movement class.
- Puzzle: solution exists, count solutions up to two (if uniqueness needed), number of forced moves, instrumentation for contradiction/retries and actual actions.
- Platformer: collision-state reachability, stable landing surfaces, dash clearance, moving platforms, destructible terrain/portals, respawn states, input latency impact.
- WFC/module construction: local compatibility, global route, allowed adjacency count, maximum backtracks, percent unresolved or retries.

When a custom checker is missing, mark that metric NOT TESTED rather than substituting a proxy.
