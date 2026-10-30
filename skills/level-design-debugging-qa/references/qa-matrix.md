# Automated and real-world QA matrix

| Scope | Automated rule | Extra integration required |
|---|---|---|
| Graph | Missing room, exit target, ability/key source | Review unintended optional dead ends |
| Inventory | Collect-once, consume-on-cross, nonnegative counts | Save/reload inventory replication |
| Destruction | Monotonic destroyed-gate flags | Actual collider modification and path invalidation |
| Jump | Analytic ballistic reach at destination height | Rapier/Planck contact, dash, double jump, moving platforms |
| Softlock | Exhausted BFS and reverse-goal reachability | Time-based switches, movable physical boxes, enemy AI |
| Checkpoint | Recorded checkpoint ID | Explicit simulate death/reload in destination game |
| Pacing | Mechanic taught before test, rest before climax | Real player observation and accessibility |
| Telemetry | Unique IDs, monotonically ordered timestamps | Browser timestamps, network telemetry clock domains |

Use `--strict-softlocks` in CI. Expected CLI exit statuses: 0 audited without high-severity issues, 1 invalid/unsolvable/jump-infeasible/strict soft-lock, 2 budget-exceeded and incomplete. `issue` records for pacing remain advisory. Mark unmodeled physics as **NOT VERIFIED**, rather than passing them as correct.
