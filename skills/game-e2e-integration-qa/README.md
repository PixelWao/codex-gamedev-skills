# game-e2e-integration-qa

Version 1.0.0 (2026-10-23). MIT © 2026 Waldemar Soroka.

## Run tests
```shell
python -m unittest discover -s tests -v
```

## Run example
```shell
python src/run_game_e2e.py --url http://127.0.0.1:8000/ --scenario examples/scenario.json --output artifacts/e2e-run
```

Playwright installation: `python -m pip install playwright`; `python -m playwright install chromium`. Run `python -m http.server 8000 --directory examples` in another terminal; the fixture page is `demo.html`, so use a local URL that actually resolves to that file. If you need a bare-root scenario, copy/serve `demo.html` as `index.html`.

## Installation
Copy this entire folder to `%USERPROFILE%\.agents\skills\game-e2e-integration-qa\` on Windows (or `~/.agents/skills/game-e2e-integration-qa/` elsewhere). The main Codex entry point is `SKILL.md`.

## Testing boundary
Unit tests do not prove integration with the complete user game. See `references/integration.md` and `PROVENANCE.md`.
