# Simulation time, ownership, and presentation

## Canonical problem: two clocks

The real-time render clock is irregular; the physics integrator benefits from an explicitly controlled integration interval. Diagnosing frame-rate dependence starts by proving which subsystem advances time. Do **not** paste a second loop into a Godot, Unity, Unreal, Rapier-wrapper, or Planck project that already steps its own world.

Engine-neutral pseudocode, **illustrative, not a drop-in patch**:

```text
fixedDt = 1 / configuredPhysicsHz
accumulator = 0
onRenderFrame(frameElapsed):
  accumulator += clamp(frameElapsed, 0, maxFrameCredit)
  ticks = 0
  while accumulator >= fixedDt and ticks < maxCatchUpTicks:
    storePrevPhysicsPoseForRender()
    takeInputScheduledForThisTick()
    applyQueuedWorldMutationsAndForces()
    existingPhysicsWorld.step(fixedDt)
    consumeEventsAfterStep()
    storeCurrentPhysicsPoseForRender()
    accumulator -= fixedDt
    ticks += 1
  if ticks == maxCatchUpTicks and accumulator >= fixedDt:
    reportOverloadAndApplyExistingTimeDebtPolicy()
  render(visualInterpolation(prev, curr, clamp01(accumulator / fixedDt)))
```

### Pick an overload policy intentionally

- **Drop excess simulation time:** eliminates runaway catch-up, but perceived simulation time advances slower after big stalls; record lost time.
- **Keep debt:** catches up later but may freeze if steps remain more expensive than wall time.
- **Slow overall time:** lockstep games can sacrifice wall-time sync to preserve controlled simulation.
- Never silently reset `accumulator` or interpolate between unrelated snapshots; identify current project policy.

### Preserve state ownership

Rigid body pose is owned by the physics world unless specifically kinematic. Render pose is a *read-only* view. A renderer updating authoritative rigid positions every frame can override forces and produce contradictory velocities. Distinguish impulse, force (integrated over time), velocity setter, kinematic target, and teleport; these have different semantics. Reset smoothing on teleport.

### Interpolation and rotations

For positions interpolate between snapshots; for 3D orientation use a quaternion shortest-path interpolation. Do not linearly blend Euler rotations that cross +/-180°. Interpolating between last two completed ticks introduces deliberate presentation latency. If physics is behind, interpolation cannot invent missing simulation steps. Avoid extrapolation without an explicit acceptable overshoot policy.

### Input versus physics cadence

Read frame-sensitive input at the host layer, timestamp or buffer it, then consume it at the owning fixed tick. Distinguish jump/button edge from held force. Network/rollback sampling needs its own tick contract. Pauses must stop applying forces without producing a huge dt on resume.

### First audit checks

- Two overlapping update owners? 
- Scaling mismatch between pixels and meters?
- Previous/current snapshot stored in the wrong order?
- Direct visual coordinates accidentally written to simulation bodies?
- Forces applied each render frame vs each fixed physics step?
- Scene reload retaining old handlers, body instances, or queued mutations?

Do not label *all* jitter a time-step issue: camera smoothing, browser presentation, bad geometry, and contact manifold changes can look similar. Measure first.
