---
name: npc-ai-debugging-qa
description: Use to audit NPC decisions, Behavior Tree traces, abort cleanup and action oscillation; not to implement NPC decision models.
---
# NPC AI Debugging & QA

Use this skill to test agent behavior and investigate why NPCs chose an action. It complements Behavior Trees and Utility AI but is independently usable.

## Workflow
1. Identify the existing decision system and host simulation clock; never add a second game loop. Define a deterministic scenario matrix: patrol -> engage, loss of target, attack cancel/cooldown, interrupted reservation, death, no eligible action, and crowded scene.
2. Emit line-delimited JSON events with fields from `references/trace-schema.md`. Transition events and decision events are preferable to high-volume per-frame logs.
3. Collect reproducible test runs with `(seed, generatorVersion, scenarioVersion, build, timestep)`; compare behavioral outcomes, not solely FPS. Record test fixtures and expected agent state snapshots.
4. Run `python3 scripts/analyze_trace.py sample.jsonl --json result.json` or `python3 -m unittest discover -s tests -v`. The tool flags non-finite numeric metrics, rapid decision flips, unfinished running nodes and invalid transition order according to its documented assumptions.
5. Validate that cancellation produces `aborted` and that effects/locks are released. Trace validation **cannot prove** real collision correctness or absence of side effects; test in the game.
6. Check simulation CPU p50/p95/p99 and decision budgets separately from render FPS. Test dozens, then hundreds of agents on target hardware if appropriate.

## Isolation
Do not recreate BT or Utility runtimes, navigation, physics, saving, or animation inside this skill. Ingest telemetry from whatever the project already uses.

## Files
- `scripts/analyze_trace.py`: stdlib-only report generator (nonzero exit for severe errors, optional thresholds)
- `references/trace-schema.md`: event contract and test protocol
- `references/scenarios.md`: scenario matrix and expected behavior
- `assets/AI_QA_REPORT_TEMPLATE.md`: report skeleton
- `tests/` and `examples/`: runnable fixtures

See `references/csharp-instrumentation.md` when ingesting telemetry from a C# game.
