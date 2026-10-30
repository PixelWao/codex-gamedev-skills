---
name: responsive-input-timing
description: Use for jump buffering, coyote time, subframe input edges and fixed-timestep input replay; not browser device bindings.
---
# Responsive Input Timing (v1.0.0)

This skill owns **event timestamps, short buffering, coyote windows, consume-once edges and replay**. It NEVER changes velocity, gravity or character physics directly; expose a jump request to the existing controller and preserve its solver. It does not replace the `browser-input-action-system`, which captures physical input, nor `game-feel-event-orchestration`, which owns time-scale feedback.

## Implementation procedure

1. Identify one monotonic clock and simulation/update order. Convert timestamps at the system boundary rather than mixing `performance.now()`, seconds from physics simulation and wall clock milliseconds.
2. Have the action system capture each browser down/up as edge with a timestamp. **Do not require the button to still be held by the next fixed tick**. Forward to `FixedStepEdgeQueue` before simulation.
3. For platformer jump use `JumpAssist({bufferMs:120,coyoteMs:100})`; tune actual windows by playtest, not by frame count. `press(time,id)` stores unique input event ID; `tryConsume(time)` returns a single request if grounded or inside grace period; `setGrounded(time,bool)` updates the grounded state.
4. Call `tryConsume` once per simulated tick **after** processing buffered edges and grounded/landing state. Pass the returned request to the current movement controller (which owns velocity/impulse).
5. `release(time)` returns whether the jump was held, allowing the physics/controller to request upward velocity cut/modified gravity; this library does not select gravity values.
6. Cancel pending events on focus loss, pause, respawn, teleport or level transition as appropriate. The source queue's `cancel()` and `JumpAssist.cancel()` must both be invoked when dropping stale inputs.
7. Keep deterministic ordering: events in the same time domain, stable IDs, monotonic times. Use `InputTimeline` to capture and replay logical events, not browser event objects containing nonserializable properties.
8. Test `node --test tests/*.test.mjs` and `tsc --noEmit -p tsconfig.json`, then test against target physics with real platform collision timing.

## Semantics and edge cases

- Buffer window is inclusive at its boundary; an input expires strictly after `bufferMs`. Coyote window also includes its boundary. Both require nonnegative finite timestamps.
- Consume-once is enforced for a jump. An additional jump is gated until a **new ground contact**. Multiple different presses can replace pending jump; a configurable jump queue policy may be required by genre.
- A second jump in midair (double jump) is a **separate action/ability**; do not bypass the re-arming gate to simulate it.
- `FixedStepEdgeQueue.capture` validates monotonic arrival timestamps and `drainThrough(tickTime)` never repeats processed edges. Events arriving out of timestamp order must be normalized upstream or rejected.
- `InputTimeline` rejects duplicate event IDs and records events in order. `replay(handler)` is pure replay of event payloads; deterministic physics requires deterministic solver, random state and fixed timestep as well.
- Variable-height jump and apex assistance are recommendations for the **movement controller**, not new features in this module.

## Files

- `src/timing.mjs` / `src/timing.d.mts`
- `tests/timing.test.mjs` with 30/60/144 FPS and short-tap tests
- `examples/platformer-integration.mjs`
- `references/clock-and-physics.md`

## Boundaries

Integration requires test-scene timing and gameplay feel playtests. Pure test success is not proof of low-latency physical input on the display or of deterministic physics.
