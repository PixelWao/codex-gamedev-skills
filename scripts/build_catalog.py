"""Regenerate the public catalog and checksums after an intentional skill update."""
import json
from package_data import ROOT, read_skills, package_files

skills, files = read_skills(), package_files()
(ROOT / "catalog.json").write_text(json.dumps({"version": 1, "skills": skills}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
(ROOT / "MANIFEST.json").write_text(json.dumps({"version": 1, "files": files}, indent=2) + "\n", encoding="utf-8", newline="\n")
rows = [f"| [`{s['name']}`]({s['path']}/SKILL.md) | {s['description'].replace('|', '/').replace(chr(10), ' ')} |" for s in skills]
intro = """# Codex Game Development Skills

49 focused agent skills for building and testing games, engines and editors.
The collection covers Three.js, Rapier, browser input, audio, NPC AI,
procedural generation, destructible worlds, performance profiling and QA.

The skill instructions are in English. Each folder contains its entrypoint
and the supporting references, scripts, fixtures, templates and licenses.

## Install

Choose individual folders from [`skills/`](skills/). Copy each whole folder
into the skills location used by your agent; keep its references, assets,
scripts, provenance and licenses together.

With Codex's skill installer, you can request for example:

```text
Use $skill-installer to install skills/fps-shooter from PixelWao/codex-gamedev-skills.
```

After installation, use the skill by name, for example `$fps-shooter` or
`$rapier-physics-3d`. Individual helpers document their own input and dependency
requirements. The collection is a set of agent workflows and helper tools,
not a game engine dependency.

## Catalog

| Skill | Scope |
| --- | --- |
"""
outro = """

The machine-readable index is [`catalog.json`](catalog.json).

## Validate this snapshot

Python 3.10+ and PyYAML are used for package validation:

```sh
python -m pip install -r requirements-dev.txt
python scripts/validate.py
```

The check parses every skill's YAML frontmatter, checks folder names and
licenses, and verifies every packaged file against [`MANIFEST.json`](MANIFEST.json).
It does not execute every runtime helper or replace project-level testing.

After intentionally updating skill files, regenerate the catalog and manifest:

```sh
python scripts/build_catalog.py
python scripts/validate.py
```

## License and attribution

Original contributions by **Waldemar Soroka** are distributed under the
[MIT license](LICENSE), to the extent protectable and owned. This collection
includes adaptations prepared with reference to `awesome-gamedev-agent-skills`
by Abhishek Barali and contributors (Apache-2.0). Existing upstream rights and
terms remain in force for the material they cover.

Read the root [NOTICE](NOTICE) and each skill's `LICENSE`, `PROVENANCE.md`,
`attribution/`, `LICENSES/`, `third_party/` and additional notices where present.
The root MIT notice does not relicense third-party material.

Publication snapshot: **2026-10-30**. Skill files are preserved from the
installed collection; repository packaging and validation tools were added.
"""
(ROOT / "README.md").write_text(intro + "\n".join(rows) + outro, encoding="utf-8", newline="\n")
print(json.dumps({"skills": len(skills), "files": len(files), "bytes": sum(f["bytes"] for f in files)}))
