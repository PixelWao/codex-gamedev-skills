# gltf-asset-pipeline-qa — Codex skill (MIT)

Install as `.agents/skills/gltf-asset-pipeline-qa/` and read `SKILL.md`.

Run the **stdlib-only structural inspector and tests**:

```bash
python3 -m unittest discover -s tests -p 'test*.py' -v
python3 scripts/inspect_gltf.py tests/fixtures/triangle.glb
node --check scripts/khronos-validate.mjs
```

For genuine Khronos validation install a pinned `gltf-validator` in your project
and run `node scripts/khronos-validate.mjs model.glb` from the project where
Node can resolve the package. Alternatively use official Khronos glTF Validator
web app or CLI. This optional package is not included and has not been tested
in the bundle creation environment.

Optimize only after reviewing `references/asset-optimization.md`; glTF Transform
is a separate project/tool, and is not vendored here.

See `QA_REPORT.md` for test results. MIT for new files:
Copyright © 2026 Waldemar Soroka. Attribution in `PROVENANCE.md` and
`attribution/upstream/`.
