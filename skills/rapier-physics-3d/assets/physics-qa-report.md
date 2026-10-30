# Physics QA report

- Project / build commit:
- Date / investigator:
- Skill invoked:
- Engine and installed version:
- Project world units and dt:
- Scenario ID / seed / same tick count:
- Hardware / browser / profiler mode:
- Change and reason (one mechanism at a time):
- Before reproduction steps:
- After reproduction steps:

| Evidence | Baseline | Candidate | Verdict / confidence |
|---|---|---|---|
| Fixed physics tick count | | | |
| Repeated test runs | | | |
| Physics step p50 / p95 / p99 ms | | | |
| Active / sleeping bodies | | | |
| Contact / pair failures | | | |
| Peak measured penetration (world units) | | | |
| Joint anchor stretch (world units) | | | |
| Maximum velocity / unexpected impulse | | | |
| NaN / Infinity / exploding bodies | | | |
| Visible/gameplay correctness | | | |
| Adjacent scenario regressions | | | |

## Evidence integrity

- Measured metrics (not assumptions):
- Not measured and why:
- Logger field definitions and units:
- Data/trace artifacts and command-line output:
- Determinism limits / event order:

## Release gate

- [ ] Original fault reproduced before change.
- [ ] Original fault retested at matching workload after change.
- [ ] All requested numeric thresholds evaluated; missing ones explicitly marked unmeasured.
- [ ] At least two related mechanics visually and physically checked.
- [ ] Performance cost assessed separately from correctness.
- [ ] Pause/resume, reload and disposal covered.
- [ ] Revert path recorded.

Decision: VERIFIED / PARTIAL / UNVERIFIED / REJECTED
Rollback command or commit:
Residual risk:
