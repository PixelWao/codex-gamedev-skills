---
name: physics-core
description: Use to diagnose general fixed-step physics, collision timing, interpolation, determinism and jitter; not engine-specific joints.
---
# Physics Core — integrity first

**Purpose:** find the smallest verified correction to a physics defect without rewriting the gameplay model. This skill owns the **engine-neutral diagnostic protocol**; use `rapier-physics-3d` or `planck-custom-physics-2d` for engine-specific implementations. Never assume either specialist is installed.

## Trigger and boundary

Activate on stuttering rigid bodies, missed contacts, unstable step scheduling, pause/resume explosions, divergent replays, unexpected sleeping, incorrect transform ownership, or when asked for a physics QA audit. Do not activate to create a replacement engine, invent vehicle handling, modify platformer input windows, or optimize Canvas graphics alone.

## Non-negotiable invariants

1. Read repository `AGENTS.md`, existing physics adapter, game loop, scene lifecycle, locked dependency versions, test harness, and user-provided constraints **before edits**.
2. Preserve the existing world/solver. **No second world, no second physics loop, no unsolicited library upgrades or migrations.** Do not bypass gameplay layers with a competing transform update.
3. Distinguish physics state from visual interpolation state; do not write interpolated positions back to rigid bodies.
4. Preserve collisions, map/save format, input timing, scripted state transitions, entity IDs, editor/inspector hooks, and network/replay contracts.
5. Change one cause at a time in a minimal, reversible patch. For each change, record before/after data; if it fails, roll it back.
6. Keep performance and stability measurements separate: no improvement claim without comparable runs and no 'fully deterministic' claim without controlled evidence.

## Data collection before choosing a fix

- Identify physics engine/version/build and whether update scheduling is owned by an editor/plugin, game loop, worker, or WASM module.
- Diagram the actual order: input sampling → spawn/destroy queue → forces → integration → collision callbacks → game logic → transforms → rendering.
- Record world units and scale, `dt`, clamp/max steps, time scale, sleep, contact layers/groups, CCD and interpolation.
- Capture a reproducible scenario (seed, steps, initial bodies, trigger, platform/hardware, consistent camera). Check whether **same simulation tick** was compared.
- Instrument physics step duration (p50/p95/p99), bodies active/asleep, contacts, penetrations, constraints, missed collisions and any nonfinite values.

## Decision workflow

1. **Classify symptom:** visual jitter, real integration instability, tunneling, contact graph/filter, joint stretch, energy injection, nondeterminism, or life-cycle error. See `references/diagnostic-playbook.md`.
2. **Inspect update ownership:** if two systems integrate the same body, fix ownership before touching solver settings.
3. **Reproduce with fixed initial conditions** and instrument the failing sample; save a baseline trace.
4. **Hypothesize one mechanism** and choose the narrowest change. Separate cause vs mitigation (e.g. CCD is not a repair for an incorrect collider shape).
5. **Re-run the original and adjacent regression scenarios**, preserving tick count and controlling machine/browser load.
6. **Report observed improvements and tradeoffs** (e.g. joint-error p95 vs physics-step p95); if no measurement was possible, label as unverified.

## Fixed update rules

- Use the engine's existing fixed-step owner when provided; otherwise instrument a single accumulator loop per `references/integration-and-state.md`.
- Cap catch-up workload, but **report and choose explicitly** whether accumulated simulation time is dropped, retained, or gameplay time slows after overload. Never silently change policy mid-project.
- Interpolate only presentation transforms from adjacent physics snapshots; reset on teleport, scene-load, rollback, respawn, origin rebase.
- Avoid floating-point claims about exact replay when the simulation depends on callbacks, asynchronous I/O, nondeterministic event ordering, random seeds, or engines with no determinism guarantee.

## QA gate

For every substantial change provide a small table of baseline/candidate: scenario, same tick budget, collisions/penetration, joint error, physics-step p95, visible artifacts and failures. Run `python scripts/physics_trace_qa.py --input <candidate.json> --baseline <baseline.json>` when compatible telemetry is available. Its exit codes are 0=pass, 1=gate fails, 2=invalid data. Telemetry format and limitations: `references/qa-telemetry.md`. Avoid using only the sample file for final acceptance.

## Load references selectively

- `references/integration-and-state.md` — fixed stepping, interpolation, lifecycle.
- `references/diagnostic-playbook.md` — symptom → discriminating test → minimal fix.
- `references/qa-telemetry.md` — repeatability, logger format, thresholds.
- `assets/physics-qa-report.md` — report template.
- `SOURCES.md` — primary sources and factual scope.

**Completion condition:** defect addressed or explicitly unresolved, measurements reproducible, unrelated mechanics unchanged, and rollback information recorded.
