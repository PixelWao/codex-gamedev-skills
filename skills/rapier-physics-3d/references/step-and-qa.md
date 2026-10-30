# Rapier Three.js integration and QA

Use exactly the game's current physics clock. Rapier `world.step` is advanced according to the world's integration settings; wrapping it in another `requestAnimationFrame` callback creates a second update owner. Render frame dt and physics dt are not interchangeable.

## Render synchronization

Store previous/current authoritative rigid body transforms after distinct ticks. Render Three.js objects with interpolated **visual** poses, including quaternion interpolation; never feed interpolated positions back into Rapier as a dynamic transform. Reset interpolation after teleports, scene restoration, rewind and origin shifts.

## Measurable trace

Use JSON or CSV. Required fields: `tick`, `body`, `x`, `y`; recommended for 3D: `z`, velocity, `joint_error` (anchor displacement world units), `penetration` (nonnegative world units), and `step_ms` (world step time per tick). Repeated `step_ms` for multiple bodies in same tick must be equal. If a field cannot be measured, explicitly report it as **unmeasured**, not zero.

```sh
python scripts/physics_trace_qa.py --input assets/sample_trace.json --max-joint-error 0.02
python scripts/physics_trace_qa.py --input candidate.json --baseline baseline.json --max-step-ms-p95 3.0 --max-penetration 0.025
python -m unittest discover -s tests -v
```

Configure numerical thresholds from the real model (scale and expected load). The included sample demonstrates the checker, **not** a validated crane or any actual game. Inspect events, wall-clock profile and image/scene outcomes separately.

## Acceptance report

Use `assets/physics-qa-report.md`, include package version, hardware, same-seed/tick replay and pictures/videos only if available. Mark code that has not been run against the game as **UNVERIFIED**. Record revert command/commit.
