---
name: navigation-debugging-qa
description: Use to validate agent routes, path costs, navigation versions and stuck movement from telemetry; not to implement pathfinding.
---
# Navigation Debugging & QA

## Scope
Independently validate route correctness and recorded NPC movement. This skill does not create an NPC AI, step physics, render a scene, or build a NavMesh. Works without depending on other skills.

## Workflow
1. Identify the authoritative map snapshot or navmesh revision. Capture movement permissions, tile weights, directions, links, agent dimensions and goal conditions.
2. Collect route fixtures at multiple seeds/topology versions, including blocked nodes, destructible walls, reachable and unreachable goals. Compare grid paths against an independent positive-weight Dijkstra implementation.
3. Capture *actual* agent trace data as JSON, JSONL or CSV containing agent ID, time, position, goal, state and optionally path revision.
4. Run the auditor; handle nonzero exit status as regression. Never report `unreachable` for `budget` results from a search that stopped early.
5. Analyze stuck agents, movement spikes, stale route revision, cost mismatch, corner cutting, out-of-bounds traversal and undue replanning. Where results depend on physics or geometry, use in-game tests.
6. Record baseline, fixed seeds, build version, device, FPS and test duration; compare after changes, preserving known good configurations.

## Implementation and references
- [`scripts/navigation_qa.py`](scripts/navigation_qa.py): standalone Python stdlib CLI.
- [`references/trace-schema.md`](references/trace-schema.md): file fields and measurement interpretation.
- [`references/test-matrix.md`](references/test-matrix.md): static/dynamic/large-crowd scenario list and evidence level.
- [`examples/routes.json`](examples/routes.json) and [`examples/trace.jsonl`](examples/trace.jsonl): sample inputs.
- [`tests/test_navigation_qa.py`](tests/test_navigation_qa.py): unit tests.
- [`assets/navigation-qa-report.md`](assets/navigation-qa-report.md): reporting template.

```bash
python scripts/navigation_qa.py --routes examples/routes.json --trace examples/trace.jsonl --output navigation-report.json
python -m unittest discover -s tests
```

## Limitations / quality bar
A grid-coordinate validation is not proof of NavMesh polygon clearance, physics feasibility, off-mesh transfer timing, crowd avoidance or game completion. A recorded `stale_route_in_use` is observable when `pathRevision < revision` and state is moving; this is a trace signal, not a universal engine-wide concurrency proof. Velocity spikes are diagnosed from telemetry and require investigation for legitimate teleport events. Compare all detected failures with expected behavior and classify waived tests explicitly.
