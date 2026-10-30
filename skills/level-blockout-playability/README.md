# Level Blockout & Playability v1.0.0

Install by copying this **entire directory** to `%USERPROFILE%\.agents\skills\level-blockout-playability` (or project-local `.agents/skills/level-blockout-playability`). A skill is an instruction pack with runnable examples, not an automatically activated game engine.

New material: MIT, Copyright © 2026 Waldemar Soroka; original Apache-2.0 attribution preserved in `attribution/upstream/` and `PROVENANCE.md`.

Run tests: `node --test tests/*.test.mjs` (Python command specified in TESTING.md). Check declarations: `tsc -p tsconfig.json --noEmit`. Node 22+, Python 3.10+, TypeScript 5.8 tested. No npm install required for tests.

**Integration principle:** inspect the current game first; don't replace its renderer, physics world, camera, input, saved state, navigation or event loop. Geometric/graph proofs use simplified abstractions and must not be reported as complete engine-level proof.
