---
name: game-build-release-engineering
description: Use to package and verify browser game releases, HTML5 assets, ZIPs, hashes and platform requirements; not gameplay development.
---
# game-build-release-engineering

## Mission
Produce reproducible, auditable distributable artifacts with clear platform profiles and verified dependencies while keeping release packaging outside runtime code.

## Procedure
1. Identify target platform, deployment root, app build command and all required runtime files, fonts, sounds and licenses. Always build from a clean output directory.
2. For itch.io HTML5, ensure `index.html` at ZIP root, relative paths, UTF-8 filenames, and platform limits. Run `python src/release.py --build path/to/dist --zip path/to/your-game.zip --report report.json`.
3. Inspect JSON errors and warnings. Fix missing CSS/HTML references, root-absolute assets and case collisions. External URLs are warnings, not proof of offline readiness.
4. Run actual browser E2E tests against the unpacked build via a local HTTP server, not source files. Test desktop and mobile, pause/resume, sound unlock, save migration and all essential game assets.
5. Record ZIP SHA-256 and optionally a signed game manifest. Preserve game version, license files and upstream asset attributions. Do not bundle dev-only secrets, sourcemaps or server credentials unintentionally.
6. Publish only after independent target-specific checks; Steam and YouTube Playables require separate certification and packaging rules not implemented by this sample validator.

## Responsibility boundaries
This validator statically inspects direct HTML/CSS URL references and ZIP constraints; it cannot follow every dynamic import(), network fetch, worker, JS-generated asset path or external CDN asset. Report such limitations; use actual browser smoke tests to close them. Never claim official YouTube/Steam certification.

## Files to use
- `src/` — tested algorithms and/or CLI.
- `tests/` — independent regression checks.
- `examples/` — small fixture, not a claim about project compatibility.
- `references/integration.md` — interop rules and use cases.
- `references/sources.md` — documentation sources, limitations.
- `PROVENANCE.md` — licensing scope.

## Verification
Run the tests described in `README.md` after any change; cite untested engine/device integrations as unverified.
