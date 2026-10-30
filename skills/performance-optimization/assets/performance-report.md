# Performance QA — [project / build / scene]

**Date:** [YYYY-MM-DD]  **Status:** [measured / partial / not measurable]

## 1. Scope and invariants

**Goal:** [observable performance target]

**Explicitly protected:** [physics timing, mechanics, UI, save/load, graphics, input, editor behavior]

**Change permission:** [what may be modified; what must not change]

## 2. Reproduction and baseline

| Parameter | Value |
| --- | --- |
| Hardware/OS/power | [ ] |
| Browser/engine and version | [ ] |
| Commit/build | [ ] |
| Scene/seed and camera/input script | [ ] |
| Viewport, resolution, DPR | [ ] |
| Effects/quality/refresh cap | [ ] |
| Warm-up and captured duration | [ ] |
| Traces vs low-overhead telemetry | [ ] |
| Samples / independent runs | [ ] |

## 3. Bottleneck evidence

**Observed:** [trace/counters with units, capture source, timing scope]

**Inference:** [hypothesis and alternative explanations]

**Unavailable measurements:** [e.g. GPU ms unsupported, missing target hardware]

## 4. Single change

**Hypothesis:** [ ]

**Files/components changed:** [ ]

**Expected affected metric:** [ ]

**Tradeoffs / rollback:** [ ]

## 5. Before / after (identical scenario)

| Metric (units + source) | Baseline A | Candidate B | Difference | Measured / inferred / unavailable |
| --- | ---: | ---: | ---: | --- |
| Frame interval p50 (ms) | | | | |
| Frame interval p95 (ms) | | | | |
| Frame interval p99 (ms) | | | | |
| Frame interval worst (ms) | | | | |
| Over target deadline (%) | | | | |
| Main-thread update (ms) | | | | |
| CPU render submission (ms) | | | | |
| GPU command time (ms; if valid) | | | | |
| Draw calls/frame | | | | |
| Retained heap / resource counts | | | | |
| Input latency / load hitch (if measured) | | | | |

**Run-level variability:** [how many comparable sessions; spread and possible drift]

## 6. Regression checks

- [ ] Gameplay mechanics and deterministic replay / state checked
- [ ] Simulation step count and collision behavior checked
- [ ] Input: mouse, touch, keyboard/gamepad as relevant
- [ ] Camera, viewport resizing, DPR and visual comparison checked
- [ ] UI, menus, save/load, undo/export if editor
- [ ] Scene cleanup and repeated transitions checked
- [ ] No unexpected memory growth or visual quality reduction
- [ ] Test/build/lint commands and outputs recorded

## 7. Decision

**Keep / revert / inconclusive:** [ ]

**Why:** [actual measurements and correctness checks]

**Known limitations:** [target hardware unavailable, unmeasured GPU, profiler overhead]

**Follow-up:** [next measured bottleneck; no speculative mass edits]
