# Runtime integration recipe

1. Find the project's authoritative game loop and decide a bounded AI decision cadence (e.g. every 100–250 ms if appropriate for gameplay; these are not mandatory defaults). Keep physics integration independent.
2. Construct one tree of mutable Node objects **per NPC**. Immutable configuration can be shared; never share mutable `Wait`, `Sequence`, `Repeat`, `Cooldown` objects between agents.
3. Inject `{ bb, time, dt }`, where `time` and `dt` refer to the simulation's monotonic timeline and dt is the elapsed **AI decision step**, not automatically a render frame interval.
4. Map action leaves to existing navigation/animation/combat commands. On `abort`, cancel timers, reservations, active commands, or callbacks that would otherwise continue after abandonment.
5. Use `Guard` to continuously validate a running subtree. A `ReactiveSelector` above an ordinary memory `Sequence` alone cannot recheck a completed condition leaf.
6. Treat `ParallelAll` as *cooperative stepping*, not actual multithreading. Avoid two running leaves writing the same actuator.
7. Emit lifecycle transitions in QA JSONL. Test at fixed deterministic seeds and replay user-visible behavior after a change.

Use dedicated pathfinding and physics tooling for locomotion and collision logic; the BT only issues commands. Check availability, permissions and installed library versions before using vendor APIs.
