# browser-camera-2d — 1.0.0

A standalone Codex agent skill for Canvas 2D camera engineering. Copy this folder into `.agents/skills/` in your repository or `$HOME/.agents/skills/` for global use. Codex activates the `SKILL.md` workflow for camera-follow, teleport, pixel-art, viewport and smoothing tasks.

Core: `scripts/camera2d.mjs`. No third-party runtime dependencies; JS supported in browser/Node ESM. TypeScript declarations are provided in `scripts/camera2d.d.mts`.

Tests: `node --test tests/*.test.mjs`. TypeScript example: `tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext examples/*.mts`. Browser integration requires user project and Canvas; not certified by isolated Node tests.
