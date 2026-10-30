# FPS Combat Engineering — Codex skill v2.0.0

Single reusable skill, focused on shooter combat systems. New MIT-licensed implementation; JavaScript ESM runtime, TypeScript declarations, Rapier/Three.js adapters, deterministic QA, and references for game integration. No renderer, physics world, camera controller, or npm dependency is bundled.

**Install globally on Windows:** copy the `fps-shooter` folder to `%USERPROFILE%\.agents\skills\`. The folder must contain `SKILL.md` at its root. Close/reopen Codex if not detected. To install for one repository, use `<repo>/.agents/skills/fps-shooter/`.

**Examples**: `node examples/integration.mjs` and `examples/typescript-integration.mts`. **Tests:** commands are in `SKILL.md`.

**Important limits**: adapters use injectable mocks in automated tests, so you must verify the exact Rapier/Three.js API and real scene collisions in the destination project. No real engine or browser render test is claimed.
