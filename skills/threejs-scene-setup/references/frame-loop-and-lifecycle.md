# Render scheduling, pause and lifecycle

## One owner

`setAnimationLoop` replaces the callback; it does **not** register a second listener. Installing it from multiple modules causes ownership bugs. The reference `installOwnedAnimationLoop` only detects installations made by the bundled helper; this **does not** detect an arbitrary pre-existing application loop. `confirmExclusiveOwnership` therefore requires actual inspection of the codebase.

Separate tasks: (1) game simulation at fixed physics steps (owned by game/physics), (2) interpolation/visual updates, (3) actual rendering. Avoid adding a physics step in renderer callbacks. Consider CPU and GPU budgets separately; consult performance skill if present.

## Continuous

Call coordinator.tick(rafTimestamp) from existing `setAnimationLoop`. Delta is in seconds, clamped to avoid jumps; first/resume tick has dt=0. Note that clamping is a safety policy, **not** a replacement for a proper physics accumulator. Do not assume callback timestamps and `Date.now()` share the same origin.

On pause: call `coordinator.pause()`; on resume call `coordinator.resume()` or `resetClock()`. Add visibility policies appropriate to music/network/gameplay; don't unilaterally pause multiplayer networking. Use `renderer.setAnimationLoop(null)` only if your module owns the loop and teardown is intentional.

## True demand mode

For idle editor scenes, one scheduled `requestAnimationFrame` is enough. `createDemandScheduler` guarantees no more than one pending request. `OrbitControls` damping may emit additional `change` events; request a new frame only when needed. Animation clips, particle systems, camera auto-rotate and live physics invalidate demand assumptions; switch to the existing continuous loop deliberately.

## Context loss and recovery

Handle native canvas `webglcontextlost` (and usually call `preventDefault()` where restoration is intended), followed by `webglcontextrestored`. Coordinate resource rebuild with Three.js renderer behavior and existing asset manager; do not auto-create a second renderer while the previous one might recover. Browser context-loss tests must be executed on a GPU-capable browser; mock events alone do not verify GPU recovery.

## Teardown order

1. Disable incoming editor/interaction events; stop *owned* RAF/animation loop.
2. Remove registered event listeners and disconnect observers; dispose controls that the scene owns.
3. Unregister gizmos/selection helpers and dispose per-scene local subscriptions, tweens and per-scene render targets.
4. Release explicit resource leases; shared resources remain live until their last lease is released. Coordinate with scene GLB/material caches.
5. On **full renderer ownership teardown only**, `renderer.dispose()`; do not dispose renderer when switching levels if renderer is shared.
6. Verify no duplicate controls listeners or observers remain after N mount/unmount cycles.

## Notes about helpers

- `createFrameCoordinator` is independent of Three.js and therefore usable with r180+.
- `createDemandScheduler` needs injected browser `requestAnimationFrame`/`cancelAnimationFrame` and explicit invalidation sources.
- `createLifecycleScope` runs cleanups in reverse registration order, collects errors and reports them as `AggregateError` without preventing the remaining cleanups.
