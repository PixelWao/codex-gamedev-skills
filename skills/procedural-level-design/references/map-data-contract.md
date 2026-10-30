# Level JSON contracts

`levelgen.py` exports `pcg-map-v1` with `kind="level"`, `algorithm="bounded-level-v1"`, string `seed`, metadata `{mode,width,height,tile_legend,movement}`, `grid` as row strings, `spawn` and `exit` as `[x,y]` integer pairs, and `metrics`. Valid demo chars are `#` solid, `.` cardinal-walkable; QA accepts optional `S` (start), `E` (goal), `K` (one collectable key) and `D` (one key-locked door). Movement is four-neighbor, diagonal crossing is not implied.

`constraint_tiles.py` exports **a different format**: `pcg-constraint-tiles-v1` with `tiles` as a 2D array of port-name strings. It is not directly accepted by the generic QA script; a project-specific adapter must define which modules are traversable and how they map to gameplay tiles. The bundled local constraint checker only verifies port matching.

Do not extend a row-string map to multi-character symbols without changing schema/renderer/QA or introducing a 2D array format. Version serialized maps and tests together; never silently reinterpret old symbols.
