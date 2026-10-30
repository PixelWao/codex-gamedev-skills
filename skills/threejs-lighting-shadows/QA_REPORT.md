# QA / evidence — threejs-lighting-shadows v1.0.0

## Included tests
The release is intended to pass Node.js built-in `node --test tests/*.test.mjs` and to validate its own example scripts and manifests. For `threejs-environment-color-qa` the optional pixel-image tool is covered by Python unittest (Pillow required). See package-level `VALIDATION_REPORT.json` for actual automated results after packaging.

## Not executed in this release environment
- Real Three.js module runtime against a pinned installed npm `three` package: **NOT TESTED** (npm Three.js package absent).
- GPU shader compile, WebGL/WebGPU rendering, HDR decoding with target driver: **NOT TESTED**.
- Pixel-perfect before/after screenshot of a game scene and actual GPU timing: **NOT TESTED**.
- Integration into a specific user game/repository and its production renderer/asset-manager: **NOT TESTED**.

No GPU performance claim or production compatibility guarantee is made from static tests. Follow `SKILL.md` acceptance gates when integrating into a real game.
