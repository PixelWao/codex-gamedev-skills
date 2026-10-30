# Combat QA: executable tests and integration gates

## Automated checks

```bash
node --test tests/*.test.mjs
python -m unittest discover -s tests -p 'test_*.py'
tsc -p tsconfig.json
node examples/integration.mjs
python scripts/analyze_combat_trace.py assets/sample-combat-trace.jsonl --rate 5
```

`tsc` is optional development tooling already present in many projects; the sample runtime itself has no third-party dependencies.

## Required regression scenarios

1. World collider between muzzle and enemy blocks damage even if camera sees the target.
2. All solid obstacles and damageable hitboxes participate in the same ordered query. Collider filters do not exclude walls.
3. Rate of fire and first-shot time match across 30/60/144-FPS step schedules; no duplicate shot at frame boundary.
4. Semi / auto / burst transition correctly on press/release; interrupted reload and switch do not grant free ammo.
5. Empty magazine, empty reserve, recoil pattern empty, zero/negative/NaN damage or speed are explicit errors or safely rejected input.
6. Projectile sweeps resolve first collision, stop on impact, and obey max life/range. Test actual Rapier thin colliders.
7. Identical seed and inputs reproduce the same shot directions.
8. Unique hit event applied at most once, kill awarded at most once.
9. No unbounded catch-up after tab suspension, no second physics loop.
10. Record CPU cost of a high-volume projectile/trace scenario on a real build; mocks are not performance measurements.

## Trace format

JSONL, one event per line; `time` is simulation time in seconds. `shot` must include `actor`, `weapon`, and stable `shotId`. `hit`/`kill` include `shotId`. Run `scripts/analyze_combat_trace.py` to detect duplicate shots, rate violations, and clock regressions. The tool checks event structure, not truthfulness of hits or anti-cheat.

## Reporting discipline

Distinguish pure JS unit tests, mock adapter tests, TypeScript typechecks, real installed-package integration, browser visual tests, actual Rapier contact tests, and hardware performance benchmarks. Only the first three are required by the sample package; the rest need a target game and hardware.
