---
name: game-e2e-integration-qa
description: Use to run browser game Playwright scenarios, screenshots and full-flow regression checks after changes; not unit-level tests.
---
# game-e2e-integration-qa

## Mission
Test existing game flows in a real browser without changing gameplay, render loop, physics or application code except for minimally invasive observability hooks.

## Procedure
1. Examine the existing app start command, router, game input ownership and available debug/test hooks; ask for no new game loop.
2. Start the game via a real local HTTP server and confirm `index.html` and all assets load.
3. Define a short JSON scenario in `examples/scenario.json` style. Prefer observable UI assertions and read-only `window.gameProbe()` over blind sleeps.
4. Run `python src/run_game_e2e.py --url http://127.0.0.1:8000/ --scenario examples/scenario.json --output artifacts/e2e-run`. Install `playwright` and Chromium via `python -m pip install playwright && python -m playwright install chromium`; optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for a system browser.
5. On failure inspect `result.json`, screenshot, console/page errors, timing and the exact failed action. Distinguish flaky/timing failures from deterministic gameplay bugs.
6. Re-run at viewport profiles and with reduced motion. Treat screenshots as evidence; use separate baseline-comparison tools when pixel-regression assertions are required.
7. Report explicit scope and missing coverage: real game integration is only validated after running against that game, not by the bundled fixture alone.

## Responsibility boundaries
Do not mutate game physics to make tests pass, force game timeScale, disable collision, bypass progression, or replace live game controls. Actions `assert_js` must only evaluate trusted, local scenarios. Test scenario browser interactions are distinct from deterministic headless physics tests.

## Files to use
- `src/` — tested algorithms and/or CLI.
- `tests/` — independent regression checks.
- `examples/` — small fixture, not a claim about project compatibility.
- `references/integration.md` — interop rules and use cases.
- `references/sources.md` — documentation sources, limitations.
- `PROVENANCE.md` — licensing scope.

## Verification
Run the tests described in `README.md` after any change; cite untested engine/device integrations as unverified.
