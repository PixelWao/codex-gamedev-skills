# Research and provenance

Research refreshed: 2026-10-22. Treat the **installed dependency versions and their local type definitions as authoritative**; upstream documentation may describe a newer API.

## Origin of this skill family

This family is a newly written, specialist replacement for the original `physics-tuning` skill distributed in `awesome-gamedev-agent-skills` (repository revision `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd`). Its original files were `physics-tuning/SKILL.md` and `physics-tuning/references/timestep-and-ccd.md` (Apache-2.0). The original documents informed the general subject matter; their examples and explanatory paragraphs are not reproduced here. Original project notices and license are retained under `third_party/` to preserve origin and clarify rights.

Original project: https://github.com/gamedev-skills/awesome-gamedev-agent-skills (identify repository revision above before relying on upstream material).

## Primary technical documentation

- Codex/Agent Skills structure: https://developers.openai.com/api/docs/guides/tools-skills ; https://learn.chatgpt.com/docs/build-skills
- Rapier JavaScript user guide: https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ ; https://rapier.rs/docs/user_guides/javascript/joints/
- Rapier CCD: https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/
- Rapier solver and islands: https://rapier.rs/docs/user_guides/javascript/rigid_body_solver_settings/
- Rapier determinism: https://rapier.rs/docs/user_guides/javascript/determinism/
- Rapier integration parameters: https://rapier.rs/docs/user_guides/javascript/simulation_structures/
- Planck documentation: https://piqnt.com/planck.js/docs/
- Planck stepping: https://piqnt.com/planck.js/docs/world/simulation.html
- Planck contacts: https://piqnt.com/planck.js/docs/contacts.html
- Planck collision filtering: https://piqnt.com/planck.js/docs/fixture.html
- Planck `World` API and mutation safety: https://piqnt.com/planck.js/docs/api/classes/World.html
- MIT license text: https://opensource.org/license/mit

## Accuracy boundaries

- Numerical thresholds and performance budgets in these skills are **illustrative** unless calibrated to the real scene and hardware.
- Avoid claiming universal determinism: Rapier WASM/JS documents cross-platform determinism only for matching initial conditions, package version, operations, creation order, and deterministic setup. Do not generalize that to custom integration, browser scheduling, Planck.js, or multiple machines without proof.
- CCD behavior, collision masks, world stepping, solver controls, and rope joint APIs are **version-sensitive**. Inspect installed packages before editing code.
- Nothing in the bundled skill constitutes a verified change or benchmark to a user project.
