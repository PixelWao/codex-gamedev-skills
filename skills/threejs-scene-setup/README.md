# threejs-scene-setup — Advanced Scene Engineering v2.0.0

One independently usable Codex skill replacing the former introductory `threejs-scene-setup`. Uses small reference modules and testable ES2022 code. Focus: integration into an existing Three.js r180 (or version-checked newer) editor/game.

## Installation

Place this folder under your Codex project's `.agents/skills/threejs-scene-setup/` or another configured skills location. Do not keep two different directories advertising the same skill name. The repository's `AGENTS.md` remains authoritative.

## Included

- `SKILL.md`: short entry point and required workflow.
- `references/`: version gate, loop/lifecycle, viewport/camera/input, graph/editor, GPU ownership, QA, source links.
- `scripts/*.mjs`: isolated utilities for frame scheduling, container resize, explicit shared leases and transforms; plus a version-audit CLI. No npm dependencies.
- `examples/demo/`: independently runnable minimal r180 WebGL scene using import map; requires network + actual WebGL browser.
- `tests/`: 26 unit tests using built-in `node:test` and one optional real-three integration check.
- `scripts/validate_skill.py`: static release checks.
- `assets/QA_REPORT_TEMPLATE.md`: deployment QA report template.
- `LICENSE`, `PROVENANCE.md`, `attribution/upstream/`: MIT for new additions and upstream attribution.

## Test

```sh
node --test tests/*.test.mjs
python3 scripts/validate_skill.py .
```

For browser demo (from the **skill root**):

```sh
python3 -m http.server 8765
# Open http://localhost:8765/examples/demo/
```

`file://` cannot serve ES module imports reliably. The CDN requires access to jsDelivr; pin local dependencies in production. Browser/WebGL QA and integration with a real game remain mandatory before production approval.

## Important

- `installOwnedAnimationLoop` requires the caller to confirm the renderer is exclusively owned: it cannot introspect other Three.js clients.
- The resource registry must be shared across all owners of a resource. It cannot infer externally-owned glTF assets or automatically collect texture ownership.
- Use one engine instance and keep the project's own physics, inspector, Undo/Redo, save data and render policies.
