# Planck scheduler, world mutation safety, and QA

**Planck standard call:** `world.step(fixedDt, velocityIterations, positionIterations)`. These two iteration counts are *solver sweeps*, not separate substeps. Typical example values 8/3 are a starting point, not a global optimum. Inspect the installed version. Only the authoritative game loop should call `world.step`; browser rendering can be called at a different frequency.

**Autoclear forces:** if a project implements multiple Planck time substeps with repeated forces, verify `World.setAutoClearForces`/`clearForces` policy against current release so forces are not applied zero times or twice.

**Mutations:** callbacks may execute while the world is locked. In world listeners, record a stable ID and queue a command rather than calling `destroyBody`, `createJoint` etc. The documented `queueUpdate` function can help when supported, but a centralized deferred-command queue may suit project architecture better.

**Instrumentation fields** (`scripts/physics_trace_qa.py`): `tick`, stable `body`, `x`, `y` required; optional `vx`, `vy`, `joint_error`, `penetration` (nonnegative world units), `step_ms` (milliseconds per fixed tick). Missing optional fields remain **unmeasured**. Include grid-conservation residual in a **separate** project-specific assertion/log; checker does not validate mass conservation from trace.

```sh
python scripts/physics_trace_qa.py --input candidate.json --baseline baseline.json --max-penetration 0.03
python -m unittest discover -s tests -v
```

Check same-seed, same-tick tests at multiple rendering refresh rates; no run with real Planck is included in this package. Fill out `assets/physics-qa-report.md` with measured defects, remaining known failures and explicit rollback procedure.
