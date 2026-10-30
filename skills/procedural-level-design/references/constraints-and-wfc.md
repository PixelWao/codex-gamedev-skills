# Modular tile constraints and Wave Function Collapse

## Distinguish three problems

1. **Tile adjacency CSP** (the bundled `constraint_tiles.py`): each cell has a domain of tile types; compatibility checks must match ports in four directions; propagation removes impossible options; bounded backtracking resolves ambiguity.
2. **Simple-tiled WFC**: related adjacency rules, often weighted entropy selection and tile symmetries. The bundled solver is intentionally simpler than a full WFC implementation; do not label it overlapping-model WFC.
3. **Overlapping-pattern WFC**: models allowed `N x N` patterns from samples and synthesizes new local arrangements. It can contradict and stop without a valid output. Source: https://github.com/mxgmn/WaveFunctionCollapse

## Local vs global validity

Correct neighbors do not imply a connected route, an exit, sufficient loot, an accessible doorway, or puzzle solvability. Use a two-stage pipeline: 

- local tile solver with bounded node/iteration budget and explicit contradiction report;
- global validation of connectivity/progression/game-rule constraints; reject or repair with finite attempts.

For large maps, favor hierarchical layouts: top-level progression graph, rooms/regions, then local tile filling. An enormous unconstrained WFC grid with many global requirements can incur impractical search or produce bland results.

## CLI example

```bash
python scripts/constraint_tiles.py --seed doors --width 5 --height 5 --fixed '{"2,2":"cross"}' --max-nodes 20000 --output tiles.json
```

`PORTS` names: `empty`, `ew`, `ns`, `ne`, `es`, `sw`, `wn`, `cross`, `n`, `e`, `s`, `w`. Output is `pcg-constraint-tiles-v1`, deliberately separate from `pcg-map-v1`. `check_layout` verifies matching ports and no open ports to the exterior. Fixed constraints such as `"0,0":"n"` can be unsatisfiable; that must fail explicitly.

The seed and tile ordering is fixed for a pinned Python/runtime baseline. `random.Random` stream compatibility between all future Python versions is not asserted. For persistent game saves use a specified portable PRNG, stable tile ordering and snapshot fixtures.
