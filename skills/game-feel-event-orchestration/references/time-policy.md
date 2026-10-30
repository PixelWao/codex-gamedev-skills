# Time and event ownership

Four clocks may exist: **unscaled real time** (deadlines, trace), **simulation time** (physics), **render presentation time** (camera/VFX) and **audio time** (Web Audio clock). Never use simulation time to complete hit-stop when the simulation is frozen.

The policy used in `HitStopManager`: `effective = externallyOwnedBaseScale * min(1, ...activeMultipliers)`. Each impact has its own ID and `atMs + durationMs`. If A runs 0..80ms and B 30..150ms, the stop must remain active until 150ms. Cancelling A does not cancel B. On scene shutdown clear requests and recompute from live external base.

**Avoid recursive tempo:** `baseScale()` must not return the effective value produced by `applyScale()`. Centralize ownership of effective time scale in one project component. For per-actor hit-stop, adapt a dedicated entity-local clock instead of using global time scale.

`FeedbackDirector` admits an event only once while its ID is cached. Default tiers (configurable): small 2 visual particles/no stop, medium 8/45ms, large 25/100ms. Default budgets 32 events and 120 particles per 100ms. First-come processing cannot guarantee highest priority; aggregate contacts then order by tier and stable ID when prioritization matters.

`HitStopManager` traces start/extension/end; `FeedbackDirector` traces accepted/rejected, delivered channels, particles and accessibility settings. Wire both to `TraceRecorder` in `game-feel-debugging-qa`. Check exceptions thrown by game-owned sinks; do not silently swallow them.
