# Reproducible performance QA protocol

## Goal and definitions

**Frame interval** = difference between successive presentation-scheduling samples (typically
consecutive `requestAnimationFrame` callback timestamps). It is useful for **frame pacing**,
not identical to GPU time, JavaScript duration or necessarily display scanout time.
A browser hidden tab can pause rAF; exclude those intervals, never mix hidden/foreground.
**Work duration** = elapsed CPU time around an identified update or render submission.
**GPU time** = measured asynchronous GPU command-range time when supported; do not create
this field unless it was directly observed by a valid timing mechanism.

Aiming at X fps gives a display interval target `1000 / X` ms. Use target-device refresh,
VSync and caps appropriately. A cap changes the interpretation of headroom.

## Mandatory experimental record

| Field | Record |
| --- | --- |
| Platform | device model or machine, CPU, GPU, RAM, OS, power source / mode |
| Software | exact project commit, browser + build, Three.js/engine version, renderer API |
| Render config | viewport CSS px, backing buffer px, DPR, shadow/post FX, graphics quality |
| Simulation config | seed, difficulty, entities, physics bodies, duration, scene, camera path |
| Input | scripted or recorded representative input (including touch where applicable) |
| Capture | trace on/off, overlay on/off, recording tool, profiler overhead |
| Target | frame deadline, permitted visual/behavioral changes, regression tolerance |
| Metrics | actual data origin and units, sample count, sampling windows |

Use at least a typical and worst-case scene. For a long session test sustained behavior,
including mobile thermal effects, resize, alt-tab recovery, loading and scene transitions.

## Measurement sequence

1. **Control environmental factors:** same hardware, browser, tabs, display refresh, driver,
   background workload and charger/thermal state as far as possible. Verify visible foreground
   tab. Lock scene seed, camera path, quality, and time scale.
2. **Warm-up:** load and run enough to stabilize asset uploads, shader compilation, caches,
   and expected thermal behavior. Record the warm-up procedure, don't assert an arbitrary
   number of seconds is universally sufficient.
3. **Baseline A:** perform the representative scripted path. Collect low-overhead rAF
   interval samples and optional bounded subsystem spans. Capture a **separate** Chrome
   DevTools trace to locate bottlenecks; tracing can affect timings.
4. **Candidate B:** change one suspected bottleneck with no unrelated fixes; repeat the same
   procedure. Use multiple runs. Prefer **A/B/A** if feasible to expose drift/thermal changes.
5. **Functional regression QA:** verify physics fixed-tick count, replay results, UI,
   controls, save/load, visual appearance and resource cleanup.
6. **Decision:** keep if improvement is repeatable on relevant user-visible metrics and passes
   correctness. Revert on regressions or inconclusive evidence. Report if improvement exists
   only in a microbenchmark.

### Suggested metrics (choose appropriate to project)

- `frameIntervalMs`: p50, p95, p99, maximum; ratio > frame deadline; ratio > 1.5× and 2×
  deadline for hitch classification. These are **conventions**, not universal UX thresholds.
- `updateCpuMs`, `renderSubmitCpuMs`, `physicsCpuMs`, `uiCpuMs` from explicit local timers.
- Valid `gpuElapsedMs` from a supported GPU profiler/timer query; record scope/availability.
- Draw calls, triangles, resource counts, heap after settling, loading spikes, input latency,
  sustained performance after extended play. Counters should be compared at matching points.
- For statistical reliability, prefer enough representative independent runs to capture run-to-
  run variability. Many adjacent frames from one run are correlated; do not treat them as
  thousands of independent hardware experiments.

**Percentile definition:** `scripts/analyze_frame_times.py` uses a documented nearest-rank
percentile over positive finite interval observations. This is a descriptive statistic, not
an inferential confidence interval. For small N (especially p99), label sample size and
avoid overconfidence. An average FPS derived from intervals (`1000 / mean interval ms`)
reflects observed cadence, **not** GPU processing capacity.

## Optional data file and analyzer

Export measured rAF intervals (ms) as either a JSON array or JSON object:

```json
{
  "frameIntervalsMs": [16.7, 16.4, 16.6, 18.0, 19.1],
  "metadata": {"scene": "stress-scene", "build": "baseline"}
}
```

Or a CSV with one numeric column named `frame_ms`:

```csv
frame_ms
16.7
16.4
16.6
```

Keep metadata separately in report/template and do not place unmeasured CPU/GPU numbers inside
a frame-interval file. Run the **optional** zero-dependency Python analyzer:

```bash
python scripts/analyze_frame_times.py data/baseline.json --target-fps 60
python scripts/analyze_frame_times.py data/candidate.csv --baseline data/baseline.csv --target-fps 60 --json
```

The `--skip-first N` option skips a known number of intervals after collection begins when
warm-up is **explicitly not** excluded at the source; prefer capturing settled periods to
blind trimming. Analyzer output does not establish causal performance improvement: the QA
protocol and trace diagnosis remain required.

### Minimal collection pattern inside the existing browser loop

Attach a bounded recorder to the callback **already** scheduled by the game. This is a
conceptual insertion pattern; align it to existing scheduling and visibility ownership:

```js
const frameProbe = { last: null, intervals: [], maxSamples: 1800 };
function recordExistingFrameTimestamp(rafTimestamp) {
  if (document.visibilityState !== 'visible') {
    frameProbe.last = null; // exclude background-tab gaps
    return;
  }
  if (frameProbe.last !== null && frameProbe.intervals.length < frameProbe.maxSamples) {
    frameProbe.intervals.push(rafTimestamp - frameProbe.last);
  }
  frameProbe.last = rafTimestamp;
}
// Invoke recordExistingFrameTimestamp(timestamp) at the beginning of the game's
// ALREADY-EXISTING requestAnimationFrame callback; do not schedule another one.
// Export after the test, outside the hot path:
// JSON.stringify({frameIntervalsMs: frameProbe.intervals})
```

Reset the probe between A/B runs. This detects pacing gaps between callbacks; it does not
measure a GPU draw, and may capture irregular event-loop scheduling. Avoid collecting
unbounded arrays, running heavy `JSON.stringify` each frame, or reporting values as GPU ms.

## What constitutes a meaningful result

- An observed p95 improvement can be useful; verify p99/tail hitches, visual correctness,
  memory retention and input latency did not degrade materially.
- Percent changes in a capped scene can be statistically ambiguous; compare difficult scenes
  or other relevant metrics rather than forcing cap removal in user builds.
- Explain run-to-run noise. Unless the project's acceptance criterion specifies it and repeat
  tests establish it, **do not invent a blanket “5% is significant” rule**.
- Under 60 Hz VSync, intervals may cluster around one or multiple refresh periods. A “33 ms”
  frame could indicate a missed deadline, not that JavaScript update necessarily took 33 ms.
- A reducing counter (fewer calls, smaller heap after GC) is **supporting evidence** and not
  proof of full-frame improvement.

## Related authoritative sources

- Chrome trace measurement: https://developer.chrome.com/docs/devtools/performance/overview
- `requestAnimationFrame` and background throttling: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Timing marks: https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
- Timing measures: https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
