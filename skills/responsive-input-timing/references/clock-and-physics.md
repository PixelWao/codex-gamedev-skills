# Fixed timestep and input event handoff

Browser events may arrive at arbitrary times between physics steps. Capture the down and up edges, with monotonic `performance.now()`-compatible timestamps. Do not reduce them to a single `held` boolean before the physics step: an entire short tap can be lost.

The recommended order per existing simulation iteration:

1. Read already captured edges with `edgeQueue.drainThrough(simulatedWallClockMs)`.
2. Forward unique press IDs and release events to timing logic.
3. Ask collision/physics controller for grounded state and pass it to `JumpAssist.setGrounded`.
4. Call `tryConsume` once and pass resulting jump request to physics. The physics engine chooses the jump impulse.
5. Clear both queue and pending timing state after pause, scene swap and blur if dropped inputs should no longer apply.

When simulation is paused, define whether a monotonic presentation clock continues (usually yes) and whether input buffers expire while paused (usually clear them rather than releasing jumps after unpausing). If physics uses simulated time that stops on pause, synchronize clocks before passing events. Never compare raw relative frame counters against DOM event timestamps.

Sample tunings: input buffer 100–150 ms, coyote 80–120 ms are starting points, not universal. Inspect input-to-action latency at actual Hz and mobile touch delays.

Related references: Gaffer on Games *Fix Your Timestep* https://gafferongames.com/post/fix_your_timestep/ ; MDN performance.now https://developer.mozilla.org/en-US/docs/Web/API/Performance/now ; original `input-systems` was consulted under Apache 2.0 attribution.
