# threejs-camera-rigs-3d — 1.0.0

Standalone Codex agent skill. Copy into `.agents/skills/` or user-level `$HOME/.agents/skills/`. Renderer-neutral rig math and explicit compatibility adapters for an *existing* Three.js camera and *existing* Rapier physics world; no physics or Three dependency required to run math tests.

Test: `node --test tests/*.test.mjs` and `tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext examples/*.mts`.

Real integration requires installed Three.js version and possibly Rapier and an actual rendered scene; check the `references/` documents before wiring. No backend/GPU guarantee is implied by node-only tests.
