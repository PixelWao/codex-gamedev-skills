# shader-effects-qa

Shader effects, visual QA and performance. Independent Codex skill. Install this folder in `.agents/skills/shader-effects-qa/` or your Codex personal skills directory; retain the folder and subpaths.

- Read `SKILL.md` for the workflow and safety boundaries.
- Read `references/` only when task-specific details are relevant.
- Inspect `examples/` before adapting the reference samples; examples must not be pasted into an existing project without reconciling renderers, shader versions, and asset ownership.
- Run the tests described in `SKILL.md` and `tests/README.md`.
- License: `LICENSE` (MIT for newly authored files). See `PROVENANCE.md` and `attribution/upstream/` for source attribution.

This package does not add npm or Python dependencies automatically. Device-validated shader compile/render checks require compatible graphics hardware or a working browser GPU backend. Static checks are not equivalent to GPU compilation.
