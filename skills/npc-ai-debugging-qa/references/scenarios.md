# Scenario matrix

| Scenario | Conditions | Invariant |
|---|---|---|
| Patrol to combat | target detected | patrol aborted once, chase started |
| Target lost | perception invalidates | chase aborts according to policy |
| Attack interrupted | hit or target lost | cooldown not reset; no orphan projectile reservation |
| Zero eligible actions | no ammo, no retreat | null decision, no invalid action |
| Utility near tie | oscillating sensor | hysteresis bounds action switches |
| Parallel action completion | subtask complete | no duplicate one-shot effects |
| Many agents | 100, 500 or target-defined | measure decision CPU p95 and memory, no universal FPS promise |
| Replay | same seed, same build, same inputs | identical trace summary/hash when deterministic conditions hold |

For game-specific tests write scripted scenario fixtures. Separate `logic passed` from `in-engine behavior passed`; the JSONL analyzer is not a navigation/physics simulator.
