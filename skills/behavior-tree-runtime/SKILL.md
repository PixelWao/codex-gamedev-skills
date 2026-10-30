---
name: behavior-tree-runtime
description: Use to implement or debug Behavior Tree nodes, blackboards, abort cleanup and NPC task lifecycle; not Utility AI scoring or navigation.
---
# Behavior Tree Runtime

Use this skill when working on Behavior Trees or interruptible NPC behavior. Read `references/lifecycle.md` before changing task scheduling, then consult `scripts/bt.mjs` and tests.

## Procedure
1. Inspect existing game loop, `AGENTS.md`, navigation/physics APIs and installed packages. Never create a second game loop, physics engine or actor update loop.
2. Decide whether memory composites or a reactive selector is intended. Specify `Running`, `Success`, `Failure`, and interruptions in a written behavior contract.
3. Make one runtime instance per NPC; do not share stateful node instances. Maintain facts on a per-agent blackboard; inject monotonic `time` and decision-step `dt` (seconds).
4. Implement all movement, effects and sounds via the project's existing commands. Leaves should return statuses; `onAbort` releases reservations, cancels motions, and stops pending effects safely.
5. Do not confuse a completed task with an aborted task. Preserve durable cooldown across subtree resets. `Parallel` must latch completed children.
6. Run `node --test tests/*.test.mjs` and the example `node examples/guard.mjs`. Use `tsc --noEmit -p tsconfig.json` when installed. Report missing integration coverage explicitly.
7. Log transitions, not every tick; run behavior replay with a fixed seed and bounded time. Include safety cases: interruption, reticking, cooldown, zero children and replay after reset.

## Contracts
- `Sequence` and `Selector`: memory semantics. `ReactiveSelector`: re-evaluates from highest priority and aborts previously running lower-priority branches. `Parallel`: all-success / fail-fast, cached completed children.
- `reset`: prepare for a fresh run; if `Running`, first abort. `abort`: terminate the active branch; never erase long-lived cooldown state. Terminal root automatically resets *before its next independent execution*.
- Action code must be explicit about cancellation; avoid async promises that mutate world after an abort unless guarded with cancellation tokens.
- Treat `scripts/bt.mjs` as a **reference implementation**, not a replacement for project-specific movement or combat systems.

## Materials
- `scripts/bt.mjs` and `scripts/bt.d.mts`: standalone JS implementation and TypeScript declarations.
- `references/lifecycle.md` and `references/integration.md`: state machine, integration;
- `references/lifecycle.md`: state machine, decision cadence and integration hazards.
- `references/csharp-interop.md`: C# translation guidance and intentional differences.
- `examples/guard.mjs` / `examples/typed-example.mts`: working usage.
- `tests/`: executable regression tests.
