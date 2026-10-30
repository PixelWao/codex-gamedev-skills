# `pcg-map-v1`: terrain JSON contract

`python scripts/worldgen.py --seed 4 --width 16 --height 12 --output region.json`

Mandatory top-level fields: `schema="pcg-map-v1"`, `kind="world"`, `algorithm`, `seed` (string), `metadata`, `grid`, `heightfield`, `moisture`, `metrics`. Metadata includes: `width`, `height`, `shape`, `world_size`, `origin`, `sea_level`, `scale`, `octaves`, `tile_legend`. `grid` is an array of `height` strings of exactly `width` one-character symbols; scalar fields are `height x width` numeric arrays with values in [0,1]. All data is row-major with increasing y downward.

Tiles: `W` deep water, `S` shoreline water/shallow zone, `D` desert, `G` grass, `F` forest, `H` hills, `M` mountain, `T` tundra, `I` ice. The `S` symbol is classified as water in this demo, not as a beach walkable by default; project adapters decide mobility and navigation.

`metrics.tile_counts` counts symbolic tiles, `water_fraction` includes W and S. It is *not* a navigability or hydrology measure.

Compatible QA: independent `procedural-generation-qa/scripts/qa_sweep.py` accepts these exports, checks numeric ranges and shape. The extra skill is optional; ordinary consumers may use standard JSON parser and their own validator.

Do not modify this schema in-place without bumping its identifier and updating fixtures. There is no 3D mesh, no rivers, no gameplay entities in this format.
