# threejs-gltf-runtime — Codex skill (MIT)

Install this folder in `.agents/skills/threejs-gltf-runtime/` (or your configured Codex skills
root). The skill operates on the current project; never replace a project's
Three.js version, renderer, animation update or loading pipeline unprompted.
Read `SKILL.md` for the workflow; `references/` for deeper procedures;
`examples/` for working JavaScript; `scripts/` and `tests/` for validation.

Run local dependency-free tests from this folder:

```bash
node --test tests/*.test.mjs
```

See `QA_REPORT.md` for tested and untested behavior. Some integration tests need
an installed compatible version of `three`, browser/WebGL, or an external glTF
validator; those are documented rather than claimed as passed.

MIT for new materials — Copyright © 2026 Waldemar Soroka.
Original project provenance in `PROVENANCE.md` and `attribution/upstream/`.
