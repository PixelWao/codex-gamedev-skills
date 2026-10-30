# `qa_sweep.py` input contract

Accepted input `schema="pcg-map-v1"`, `kind="world"` or `"level"`, `grid` array of nonempty equal-length strings, `metadata.width/height` matching the grid. Limit 250000 cells and 25 MB per input file. JSON must not contain NaN/Infinity.

**World:** tile alphabet `WSDGFHMTI`, numeric `heightfield` and `moisture` with exactly height rows of width floats in `[0,1]`. This validation proves shape and bounded values only; a world with islands may be perfectly valid while land is disconnected. `coverage` counts tiles except W/S and solid wall.

**Level:** tile alphabet `#.SKDE`, two `[x,y]` locations `spawn` and `exit`, both on non-wall cells. Open cells are reachable by four-neighbor steps. One simple key `K` may open every `D` door; `K` is a permanent Boolean acquisition, not a consumable item. Multi-key puzzles, sequence switches and physics must use a specialized validator. Exit is considered reachable only with actual key state.

**Report:** `schema=pcg-qa-report-v1`, PASS/FAIL with thresholds, success count, failed cases, coverage, fingerprints, path lengths and percentile metrics. A case that crashes, times out, emits no output, wrong JSON schema or a disconnected demo level counts as failure. Output `--report` JSON and optional `--csv` are written to user-named isolated paths. Default `--max-failure-rate 0`, `--max-duplicate-rate 1` (permissive); override as appropriate.

**CLI:** pass `--exec` *last* followed by separate argv tokens and the literal placeholder values `{seed}` and `{output}`. The tool calls `subprocess.run` with `shell=False`; no command substitution, pipeline or shell quoting is evaluated. For paths with spaces, quote each corresponding argument at your terminal; avoid passing a single string representing the entire command. Timeout per seed is configurable.

Exit codes: 0 on PASS, 2 on FAIL or input usage errors. For subprocess failures the report contains `errors` and a bounded tail of stderr.

**Caveat:** A report cannot prove physics solvability, optimality, unique solution, human perceived difficulty, or statistical fairness unless a new game-specific oracle is integrated and actually run. Never call a metric "quality" without its game-design interpretation.
