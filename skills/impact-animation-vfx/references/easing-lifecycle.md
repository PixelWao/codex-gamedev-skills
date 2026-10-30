# Tween mathematics and lifecycle

An animation must compute `v(t)=start+(target-start)*E(clamp((realNow-startTime)/duration))`. This is independent of rendering frequency at the same timestamp. Repeating `lerp(current,target,k)` makes the result depend on the number of frames; avoid it. The original `game-feel` Unity snippet calculates a `back` curve and then doesn't apply it; use the actual curve.

`TweenDirector` stores a separate baseline (prior to the first tween), start, destination and owner keyed by target and property. A second tween replaces the first; `cancel()` and `dispose()` can restore baseline. A completed tween uses its specified `to`, which need not equal baseline; for hit squash use `to=baseline` to recover original sprite scale.

`outBack` visibly overshoots 1 then settles; `outCubic` slows smoothly; `inOutSine` is appropriate for camera/UI settle. Use overshoot sparingly and keep flash frequency low.

For non-unit originals (e.g. `[2,2]`), apply squash/stretch relative to the base (`[2.6,1.4]`) and return to `[2,2]`. Never animate a physics collider's transform as a visual pop.

Particles have finite TTL and capacity. Use event priority or aggregate bursts when heavy destruction generates thousands of contacts. The pool intentionally avoids rigid-body physics; the project's Rapier/Planck implementation remains authoritative.
