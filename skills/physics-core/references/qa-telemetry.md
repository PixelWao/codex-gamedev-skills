# Repeatable Physics QA — trace contract

## What to record

Stable scenario id, build SHA, package version, seed, simulation tick, engine settings, world length units, entity IDs, event ordering, environment, and target machine/browser. For each tick optionally emit a record for each tracked body:

```json
{"tick": 9, "body": "weight", "x": 1.2, "y": 3.4, "z": 0.0,
 "vx": 2.0, "vy": -0.3, "joint_error": 0.005,
 "penetration": 0.0, "step_ms": 0.6}
```

**Units:** x/y/z in *world units*, velocities in world units/s, errors in world units, step_ms as the wall-time cost for the **whole fixed step** in milliseconds. One step_ms per tick may be repeated for every body but values must match within the tick. The checker deduplicates timings by tick. Do not compare world units across different project scales.

Fields required by checker: tick (nonnegative integer), body (nonempty stable ID), x and y (finite numbers). Optional: z/vx/vy/vz, joint_error, penetration, step_ms. Missing optional values are **unmeasured**, not zeros. Negative errors/penetrations are invalid; use nonnegative magnitudes. The checker cannot derive contacts or penetration from positions alone. It is not a simulator.

Example:

```sh
python scripts/physics_trace_qa.py --input assets/sample_trace.json --max-joint-error 0.02 --max-penetration 0.02
python scripts/physics_trace_qa.py --input candidate.json --baseline baseline.json --max-step-ms-p95 3.0 --regression-tolerance 0.15 --output report.json
python -m unittest discover -s tests -v
```

- `PASS` means only that *requested numeric gates and optional regressions* passed for supplied data. It does not imply correct physical gameplay.
- For coverage require the metric explicitly with `--max-*` where appropriate: the script then fails on absent metrics.
- Report 0/1/2 exit codes; distinguish invalid telemetry from failed physics gates.
- Baseline/candidate must have same map, entities, seed, workload, time window and comparable hardware for time measurements. The checker does not enforce identical scenarios.
- Don't compare p95 results on very small samples as statistically meaningful. Record warm-up separately; report repeated-runs distributions.
- Per-body velocities should be logged for debugging but checker does not currently gate them; assert gameplay invariants using project-specific tests.

## Determinism testing

Run the same scene at exact tick count with identical initial conditions, order and version. For engines supporting reproducible serialization, compare snapshots or canonical state hashes. Floating-point approximate comparisons are diagnostic aids, not proof of bitwise determinism. Distinguish per-platform from cross-platform guarantees.

## Acceptance record

Copy `assets/physics-qa-report.md`, fill measured baseline and candidate values, document environmental limits and rollback route. Tests must include both the reported failure and at least two neighboring mechanics. For no test access, report **unverified implementation**.
