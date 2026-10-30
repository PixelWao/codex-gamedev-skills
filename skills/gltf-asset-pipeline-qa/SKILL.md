---
name: gltf-asset-pipeline-qa
description: Use to inspect, validate and optimize glTF/GLB files, compression, assets and export pipeline; not runtime animations.
---
# glTF Asset Pipeline QA — verify before deploying

**Scope:** input asset inspection, conversion, validation and measurable
optimization, independent of the live renderer. Keep original assets untouched
and produce reproducible optimized variants for review.

## Workflow

1. Inventory GLB/glTF path, origin, source blend/export, Blender/exporter
   version, hash, size and pinned Three.js revision.
2. Run offline structural triage (`python3 scripts/inspect_gltf.py model.glb`)
   to catch obvious broken headers, JSON, references and dimension warnings.
   This is **not** full glTF conformance validation.
3. Run Khronos validator with an installed, pinned `gltf-validator` package:
   `node scripts/khronos-validate.mjs model.glb`. Treat errors as blockers,
   inspect warning codes and supported extension requirements.
4. Use pinned `@gltf-transform/cli` in the *project* (not bundled here) for
   `inspect`/`optimize`/texture compression. Do not assume its latest syntax;
   check `gltf-transform --help` and the installed CLI version.
5. Compare original and candidate: GLB bytes, total textures, triangles,
   decode/render times, texture fidelity, animation clips/rig behavior and
   WebGL compatibility on target mobile + desktop hardware.
6. Do not run lossy compression on originals without backup. DRACO and Meshopt
   are alternatives for geometry; KTX2/Basis and WebP are different tradeoffs.
   Check extension+decoder support before release.
7. Test raw assets with source-size limits, corrupt/missing resource cases,
   material correctness and verified scene camera framing.
8. Export machine-readable report and recommend approve/revert based on both
   fidelity and performance. Keep hash and commands with report.

## Included

- `scripts/inspect_gltf.py` — standalone structural triage for glTF 2.0/GLB,
  with conservative parser, reference checks and JSON output.
- `scripts/khronos-validate.mjs` — optional genuine Khronos validator wrapper;
  requires external `gltf-validator` installed in a compatible Node project.
- `tests/test_inspector.py` — corruption and reference tests (stdlib only).
- `references/asset-optimization.md` — measured optimization matrix.
- `references/blender-export.md` — coordinate/rig/material hygiene.
- `assets/REPORT_TEMPLATE.md` — review checklist.

## Testing

```bash
python3 -m unittest discover -s tests -p 'test*.py' -v
python3 scripts/inspect_gltf.py /path/to/asset.glb --output /tmp/asset-report.json
node --check scripts/khronos-validate.mjs
```

**Do not** claim GLB visual correctness or spec conformance from the offline
inspector alone. True acceptance requires Khronos validation, glTFLoader
runtime import and animation/render screenshot review in a representative app.

## Sources

- https://github.com/KhronosGroup/glTF-Validator
- https://gltf-transform.dev/cli
- https://threejs.org/docs/pages/GLTFLoader.html
