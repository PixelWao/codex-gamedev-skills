---
name: camera-debugging-qa
description: Use to measure camera jitter, follow errors, bounds, occlusion and teleport regressions from traces; not to build a camera rig.
---
# Camera Debugging & QA

Diagnose camera behavior with falsifiable metrics and scene reproduction. Do not assert visual comfort or GPU performance based only on numeric traces.

## Procedure

1. State the camera's intended behavior and operating conditions (platformer look-ahead, RTS pan, target group, scripted shot). Select measurements appropriate to that design; a camera deliberately framing *ahead* of the player will not have zero follow error.
2. Collect telemetry from **the existing render loop**. Write one record per rendered frame: timestamp `t` in seconds, world `target` and visual `camera` positions, optional `teleport`, optional `occluded`. Never store user-identifying data.
3. For 2D bounds, record the effective logical viewport, zoom, and rectangular level bounds. Match units: world positions and viewport divided by zoom. Do not conflate CSS pixels with backing pixels.
4. Save as JSONL, JSON array / `{ "records": [...] }`, or CSV with flat fields; see `references/trace-schema.md`.
5. Run `python scripts/camera_trace_qa.py TRACE.jsonl --max-speed 500 --max-velocity-jump 60 --output report.json` (thresholds illustrative, must be adapted per game). Exit 0=pass, 2=threshold breach, 3=bad input.
6. Review failure frames and reproduce them visually. Rerun the same seed, scene, machine class and input trace after change. Include 30/60/144 Hz or frame-time variation, direction reversal, pause/resume, resize, teleports and obstructions.
7. Report summary, pass/fail thresholds, any intentional violations and any GPU/browser/mobile tests not performed.

## Built-in tools

- `scripts/camera_trace_qa.py` — standard-library Python 3, JSONL/JSON/CSV, robust input validation, p50/p95 following error, speed, velocity jump, occlusion and bounds.
- `tests/test_camera_trace_qa.py` — automated edge-case tests.
- `examples/trace.jsonl` — known-good demonstration trace.
- `references/trace-schema.md` — schema, metric semantics and constraints.
- `assets/camera-qa-report.md` — reusable report.

## Measurement limitations

- Velocity jump is `|v[n]-v[n-1]|`, **not** acceleration per second squared and **not** jerk.
- A camera is not meant to sit on its target for all game styles; following error is diagnostic, not universally a failure.
- Samples recorded directly after teleports are excluded from follow/speed checks for a configurable grace interval; other failures are still tracked.
- Occlusion flag requires a **real visibility or collision query** supplied by the game; this tool cannot infer it from camera/target positions alone.
- Unit tests alone cannot prove screen composition, image stability, comfort, input latency or CPU/GPU performance.

## Verification

Run `python -m unittest discover -s tests -v` from the skill root; invoke CLI on the example trace; inspect JSON report. Validate that missing fields, NaN, non-monotonic timestamps and impossible bounds fail closed.
