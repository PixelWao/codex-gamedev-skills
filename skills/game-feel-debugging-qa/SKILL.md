---
name: game-feel-debugging-qa
description: Use to audit hit-stop, camera impulse, VFX budgets, flash accessibility and feedback traces; not to create visual effects.
---
# Game Feel Debugging / QA

## Resources
- `src/feel_qa.py`: standalone Python3 standard-library auditor for JSON / JSONL / CSV.
- `src/trace.mjs` / `src/trace.d.mts`: bounded JavaScript telemetry recorder.
- `references/schema.md`: event schema, CLI and error codes.
- `references/qa-matrix.md`: automated and manual acceptance scenarios.
- `tests/test_audit.py`, `tests/trace.test.mjs`, and `examples/`.

## Workflow
1. Identify the actual owners of time scale, camera, input, VFX and rendering. Collect meaningful event IDs, test scenes and device targets. Avoid sensitive personal data in traces.
2. Capture trace events with monotonic **unscaled milliseconds**. Supply recorder's `push` to both `HitStopManager.onTrace` and `FeedbackDirector.onTrace`, and optionally record camera deltas and VFX pool counts.
3. Preserve record order in `.jsonl` files; include start/extend/end for hit-stop and accessibility settings for accepted events.
4. Run `python src/feel_qa.py path/to/trace.jsonl --out report.json`. Exit code 1 indicates errors; warnings require evaluation but do not change exit code. Adjust budget thresholds to the game's performance targets.
5. Run `python -m unittest discover -s tests -p 'test_*.py' -v`, `node --test tests/*.test.mjs`, and `tsc -p tsconfig.json`.
6. Add game-specific cases: multiple overlapping hit-stops, scene unload mid-freeze, nonunit sprite scales, 30/60/144 FPS, duplicate contact pairs, 1000+ debris collisions, tab resume, reduce motion/flash, varied viewport.
7. Clearly distinguish deterministic logic tests from manual visual quality, full GPU/mobile tests, input delay metrics and photosensitivity review — these cannot be inferred from JSONL alone.

## Primary detections
`duplicate_accepted`, `hitstop_not_released`, `hitstop_orphan_end`, `hitstop_double_start`, `hitstop_excessive`, `out_of_order`, `reduced_motion_violation`, `flashes_disabled_violation`, `particle_budget_exceeded`, `event_budget_exceeded`, `camera_nonfinite`, and `vfx_capacity_exceeded`.

New code and documentation MIT ©2026 Waldemar Soroka. Original Apache-2.0 attribution preserved.
