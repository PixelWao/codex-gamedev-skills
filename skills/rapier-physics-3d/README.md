# rapier-physics-3d

An independently installable Codex skill. The three-skill family has deliberately distinct trigger scopes; installing just this one is supported.

- Skill ID: `rapier-physics-3d`
- Version: `1.0.0` (2026-10-22)
- New documentation and utilities: MIT — copyright notice: Waldemar Soroka
- Original upstream project and license information: `THIRD_PARTY_NOTICES.md` and `third_party/`
- Technical research: `SOURCES.md`
- No runtime or network dependencies for the Python QA script (Python >= 3.9; standard library).

## Install

Copy this entire directory to an installed skills directory (for instance, a repository's `.agents/skills/rapier-physics-3d/`). Do **not** copy individual Markdown files into a different skill. If the old `physics-tuning` remains installed it may overlap with `physics-core`; disable or remove that older skill if you want the new routing to take precedence.

## Verification

Run `python scripts/physics_trace_qa.py --input assets/sample_trace.json --max-joint-error 0.02 --max-penetration 0.02`. This validates example telemetry and the checker; it does **not** simulate a real physics engine. Run `python -m unittest discover -s tests -v` for the included regression tests.

## Ownership clarity

The MIT notice is a requested designation of copyright ownership for original contributions, not a legal guarantee that every AI-assisted sentence is independently copyrightable. No third-party ownership is transferred by rewriting or this package.
