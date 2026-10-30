# Performance Optimization — v2.1 (MIT contributions)

A Codex-compatible game-performance skill that diagnoses measured regressions,
identifies the limiting subsystem, implements minimal changes, and validates
frame pacing and gameplay behavior. Three.js/WebGL and Canvas 2D receive
first-class treatment; Godot, Unity and Unreal remain supported.

## Install

Copy this entire `performance-optimization/` folder into the relevant skills
folder used by your Codex installation; do not copy only `SKILL.md`.
See Codex's currently documented skill discovery paths for your configuration.

## Package contents

| Path | Purpose |
| --- | --- |
| `SKILL.md` | Activation, safety constraints and diagnosis workflow |
| `references/browser-threejs.md` | Rendering and GPU/CPU attribution in Three.js |
| `references/canvas2d-performance.md` | Pixel-art and Canvas pipeline checks |
| `references/profiling-and-budgets.md` | Cross-engine profiling + practical techniques |
| `references/benchmark-protocol.md` | Repeatable A/B performance evaluation |
| `assets/performance-report.md` | Evidence-backed QA report template |
| `scripts/analyze_frame_times.py` | Frame-interval CSV/JSON analyzer, stdlib-only |
| `tests/` | Package and analyzer unit tests |

## Smoke check

```bash
python -m unittest discover -s tests -v
python scripts/analyze_frame_times.py --help
```

## Licensing

**MIT — Copyright (c) 2026 Waldemar Soroka** for newly authored
contributions (see `LICENSE`). The original upstream Apache-2.0 project has
not transferred its copyrights. Its attribution and redistribution notices
are retained in `THIRD_PARTY_NOTICES.md`, `NOTICE` and `LICENSES/` to address
any material that remains subject to upstream conditions. Do not construe
MIT here as a relicensing of someone else's prior copyright.
