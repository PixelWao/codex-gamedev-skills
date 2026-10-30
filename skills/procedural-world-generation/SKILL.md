---
name: procedural-world-generation
description: Use for seeded terrain, biomes, islands, heightmaps, chunks and large game worlds; not room-by-room level pacing.
---
# Procedural world generation

Purpose: design **reproducible, extensible world data** independently of visuals. An optional stdlib Python tool provides a working and testable baseline. Do not mistake its stylized heightfields for realistic hydrology or production-grade procedural worlds.

## Activate for

Heightfields, continents, islands, biomes, world-map resources, globally coherent terrain, seed sharing, chunk borders, LOD/streaming terrain in HTML5/Three.js, and spatial distributions. For dungeon structure, authored challenge pacing or puzzle rules use `procedural-level-design` instead; for large-scale seed sweeps use `procedural-generation-qa`. Neither is a required dependency.

## Mandatory discovery

1. Read project `AGENTS.md` and existing generator, serialization, renderer, camera, navigation, and physics boundaries. Respect engine/API version and user constraints.
2. Identify map topology (bounded/infinite/wrapped), world units, chunk boundaries, 2D-vs-3D needs, collision/navigation ownership, seed and save format, platform and memory budget.
3. Record generation **contract**: world seed, algorithm ID/version, parameters, layer names, coordinate origin, float/quantization policy, serialized schema, and generation order.
4. Set measurable acceptance criteria: exact replay for fixed test seeds, valid biome symbols, absence of chunk-boundary discontinuities, runtime and memory limits, world-specific playability constraints.

## Implementation workflow

1. Separate **sampling** (seeded, pure function of global coordinates and domain) from **assembly** (regions/chunks) and from **presentation** (mesh, tilemap, textures, collider). Do not create another update/render loop.
2. Use independent stable random domains for `elevation`, `moisture`, `temperature`, `landmask`, `resources` etc. Never use `Math.random()` for persistent world generation. Save every version identifier that affects output.
3. Select topology deliberately: unbounded global noise for persistent chunks, finite boundary mask for islands, or periodic coordinates if wraparound is genuinely required. Don't silently normalize each chunk by chunk dimensions.
4. Compose geography in logical layers: elevation -> climate/moisture -> biome -> hydrology/erosion if requested -> resources/settlements -> navigation masks. Define ordering and dependencies explicitly.
5. Handle deterministic placement with finite budgets and explicit rejection reasons. Test fairness, coast access, terrain traversability and excluded spawn biomes as required by the game.
6. Build visuals from data using project's existing Three.js/tilemap path; do not conflate render triangles with authoritative collision/navigation data or mutate production saves without migration.
7. Compare fixed-seed snapshots **and** a multi-seed sweep. Report failure rate, distribution, chunk seam tests, latency and memory before any claims of improvement.

## Working baseline: stdlib world generator

From this skill directory:

```bash
python scripts/worldgen.py --seed 147 --world-width 96 --world-height 64 --width 96 --height 64 --shape island --output world.json
python scripts/worldgen.py --seed 147 --world-width 96 --world-height 64 --width 32 --height 32 --origin-x 32 --origin-y 0 --shape island --output chunk.json
python -m unittest discover -s tests -v
```

`worldgen.py` offers continuous **value noise**, normalized fBm, separate seed namespaces, stylized biome lookup and an island/archipelago envelope. It emits `pcg-map-v1` JSON with `grid`, `heightfield`, `moisture` and metadata. It **does not** simulate rivers, wind, rainfall, erosion, collision, reachable cities, or natural ecosystems. Implement those as distinct, measured stages only when requested. It caps maps at 150,000 cells per invocation.

## QA gate (do not skip)

- Same seed + params + algorithm ID + runtime => same logical output/hash. Check old save replays against pinned fixtures; **upgrading an algorithm intentionally changes worlds unless migrated**.
- Full-world sample equals every equivalent slice generated independently, including seam cells with negative global origins in infinite mode.
- No NaN/Infinity, values in the declared range, valid symbols, dimensions and coordinates.
- World-specific validation goes beyond connectivity: balanced spawns, accessible resources, navigable connections, coastline and collision continuity **as appropriate**, checked in gameplay.
- Runtime/performance regression is measured, not assumed. No mesh, physics, or render pipeline changes without separate confirmation.

## Troubleshooting

| Symptom | First diagnostic | Safer action |
|---|---|---|
| Adjacent chunks mismatch | Compare global-coordinate samples at same coordinates | Unify origin/scale/seed/domain; never reseed per chunk |
| Changes elsewhere shuffle all resources | Shared sequential RNG stream | Derive independent domain/key per placement ID |
| Map is mostly one biome | Histograms and height/climate ranges | Tune masks, quantiles and thresholds on many seeds |
| Rivers flow uphill | Missing flow routing or gradient field | Add explicit drainage model; noise threshold is not river simulation |
| Same seed gives changed save | Algo/library or float policy changed | Bump version, pin dependency and migrate/reject gracefully |
| Three.js fps collapses | Profile render/geometry/GC separately | Chunk culling/LOD on measured hotspot; avoid physics/render loop rewrites |

## Read only as needed

- `references/terrain-and-biomes.md` — noise, climate, rivers, resources and 3D presentation.
- `references/chunks-and-reproducibility.md` — global coordinates, seed namespaces and versioning.
- `references/map-data-contract.md` — exact output format, tile legend and bounds.
- `references/sources.md` — external primary sources and copyright boundaries.
- `assets/WORLD_QA_REPORT.md` — acceptance/report template.

Do not present stylistic terrain as simulated geography or 2D map reachability as proven 3D walkability. Report measured facts, assumptions, and untested cases separately.
