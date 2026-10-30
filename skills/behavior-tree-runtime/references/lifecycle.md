# Execution and cancellation semantics

Statuses: `READY` (not started), `RUNNING` (in progress), `SUCCESS`, `FAILURE`. A node terminates once, parent retains its status until reset. Root resets after terminal result when called again. This guarantees a `Wait` counts from zero on its next visit.

`reset` is idempotent, and aborts a `RUNNING` subtree before removing transient state. `abort` calls user cleanup for running actions. A successful action does *not* call abort. Persistent combat cooldown must be stored outside transient node state (or within a decorator field preserved across reset).

Reactive selector: at each decision step re-evaluate children left-to-right. When higher priority becomes available, abort the previous lower-priority `RUNNING` subtree. Beware: a blocking condition evaluation, or mutating world during scoring, makes cancellation late and nondeterministic.

Parallel: do not run succeeded children again while others still run. Fail-fast cancels remaining running children. Multiple commands to one actuator need arbitration (e.g. do not mix `moveTo` and `knockback` writers).

Timers are supplied from the host simulation, not `Date.now()`. Physics owns integration; BT issues intents. Never change simulation frequency simply to tune NPC responsiveness. Decision cadence, sensor cadence and rendering cadence may differ.

A reactive selector **does not automatically make a memory Sequence reactive**. Use an explicit `Guard` around its running subtree to recheck validity on every tick, and test threat loss.
