# destructible-world-engineering

Version 1.0.0 (2026-10-23). MIT © 2026 Waldemar Soroka.

## Run tests
```shell
node --test tests/*.test.mjs && tsc -p tsconfig.json
```

## Run example
```shell
node examples/demo.mjs
```

All pure algorithm/unit examples run without dependency installation beyond Python or Node as appropriate. Three.js/Rapier adapters require those packages in the actual host game.

## Installation
Copy this entire folder to `%USERPROFILE%\.agents\skills\destructible-world-engineering\` on Windows (or `~/.agents/skills/destructible-world-engineering/` elsewhere). The main Codex entry point is `SKILL.md`.

## Testing boundary
Unit tests do not prove integration with the complete user game. See `references/integration.md` and `PROVENANCE.md`.
