# QA report — FPS Combat Engineering v2.0.0

**Date:** 2026-10-22. **Scope:** one standalone Codex skill. **New contents:** MIT © 2026 Waldemar Soroka. **Upstream:** attribution files preserved.

| Validation | Status | Evidence |
|---|---|---|
| Node.js unit tests (combat math, FSM, raycast contract, projectiles) | PASS | `node --test tests/*.test.mjs` |
| Python QA trace tests | PASS | `python -m unittest discover -s tests -p 'test_*.py'` |
| TypeScript declaration/usage | PASS | `tsc -p tsconfig.json` |
| Illustrative JS example | PASS | `node examples/integration.mjs` (mock raycast, 5 shots / 1 kill) |
| JSONL trace checker | PASS | `python scripts/analyze_combat_trace.py assets/sample-combat-trace.jsonl --rate 5` |
| Structural/missing references/syntax | PASS | `python scripts/validate_skill.py` |
| Three.js raycast integration | NOT RUN | Real `three` dependency unavailable in this environment |
| Rapier raycast & castShape integration | NOT RUN | Real Rapier dependency unavailable in this environment |
| Browser Pointer Lock / visual FPS / physics performance | NOT RUN | Needs target project and hardware |
| Multiplayer/server hit validation | OUT OF SCOPE | Single-player reference runtime only |

The automatic adapter tests are mocks of expected method contracts, not substitutes for target-version API tests. Test status says nothing about real graphics quality or hardware frame time. A production game must implement and test combat input, authoritative collisions, animation and audio wiring using the installed versions.
