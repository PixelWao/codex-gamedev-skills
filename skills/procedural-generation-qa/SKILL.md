---
name: procedural-generation-qa
description: Use to test procedural seeds, map validity, connectivity, reachability and generator regressions; not write generators.
---
# Procedural generation QA

Purpose: turn claims about procedural generation into **repeatable evidence**. This skill audits generators but does not redesign them or silently repair broken levels. Its CLI is independent and can consume any exporter implementing `pcg-map-v1`; external adapters are explicit.

## Activate for

Broken/unsolvable seeds, flaky level generators, map quality thresholds, empty/duplicate maps, seam regressions, speed benchmarks, procedural CI, comparison of algorithm versions, or player reports containing seeds. Works without either other procedural skill.

## Audit workflow

1. Read repository instructions, source generator, output format, seed versioning, engine physics/progression rules, and baseline reports. Classify assumptions as proven/testable/not testable by grid alone.
2. Freeze test contract: generator command, algorithm and runtime version, full settings, seed set, expected map schema, acceptable failure rate, coverage and minimum path lengths. Use **independent** sample and regression seeds.
3. Execute finite, isolated cases; never `eval` or execute shell strings, and always set a subprocess timeout and max outputs. Preserve reproduction commands and failing seeds.
4. Validate serialization and shape **before** applying game rules: rectangular grid, legal tile symbols, all numeric values finite and bounded, matching width/height, valid spawn and exit.
5. Evaluate playability at the justified abstraction level: for rooms cardinal flood-fill, for one-key/one-door grid state-space search; for platforms, puzzles, power networks or movable objects require project-specific solvers and real physics-state testing.
6. Detect repeated layouts via content fingerprints independent of volatile metadata. Report duplicates, distributions, coverage, path lengths and failure categories. Avoid interpreting p95 as proof of quality; add tests linked to the game design.
7. Compare baseline and candidate using **identical seed vectors** and hardware/engine settings, with regressions clearly enumerated. Use seed snapshots for historical compatibility; document intentional changes behind algorithm versions.
8. Issue PASS only for thresholds actually enforced. Do not claim successful headless gameplay runs unless they were run.

## Working CLI

```bash
# Audit existing exports (all *.json in folder):
python scripts/qa_sweep.py --input-dir maps --min-path 12 --max-failure-rate 0 --report reports/pcg-qa.json --csv reports/seeds.csv

# Run a generator through argv (no shell; --exec MUST come last):
python scripts/qa_sweep.py --count 20 --min-path 12 --max-failure-rate 0 --report qa.json --exec python /absolute/path/to/levelgen.py --seed {seed} --output {output}

# Unit tests (pure stdlib):
python -m unittest discover -s tests -v
```

The input must be `pcg-map-v1`. Use a **separate explicitly reviewed adapter** for your project's file format. `qa_sweep.py` limits input size and seed count, enforces generator timeouts, writes JSON/CSV and returns exit code **0 PASS / 2 FAIL**. Default duplicate threshold is permissive (`1.0`); configure stricter `--max-duplicate-rate` where diversity is mandatory.

## Audit meanings

- `failure_rate`: fraction of cases with invalid output or failed supported checks.
- `duplicate_rate`: repeated logical fingerprints / successfully parsed maps; lower is generally better, but duplicates can be allowed in small domains.
- `coverage`: fraction of non-wall, non-water/shore cells (for worlds this is land share, **not** accessible navigable land).
- `path_steps`: cardinal movement shortest path with one Boolean key that unlocks tile `D`; **not** time, difficulty or real physics reachability.
- `p50/p95_path_steps`: distribution across **passing** level cases only. A report should mention selection bias when many maps fail.

## Mandatory boundaries

- `pcg-map-v1` is defined in `references/qa-contract.md`. The base script accepts only a **single interchangeable key/door rule**. A level with multiple keys, portals, pushable blocks, weighted hazards, liquids or falling platforms requires an extension/simulator.
- A `world` map has no mandatory connected-land test: separated islands may be intended. Use separate world-specific route/resource fairness checks.
- Do not claim uniqueness of generated puzzles from occupancy checks. Use an exhaustive, rule-appropriate solver with finite budgets and separately report UNKNOWN when proof is not obtained.
- Never overwrite original saves, production caches, AGENTS.md or the engine. Keep experiment outputs isolated.

## Escalation and deliverables

Any failing seed: capture seed, version, exact command, params, minimal JSON fixture, observed vs expected, severity and proposed minimal repair. After repair, rerun the failing seed, pinned seeds, random seeds and performance baseline. Emit the report using `assets/PCG_QA_REPORT.md`.

## References

- `references/qa-contract.md` — serialized schema, supported checks and thresholds.
- `references/strategies-and-metrics.md` — regression seeds, metrics, confidence caveats and property tests.
- `references/sources.md` — relevant external documentation.
