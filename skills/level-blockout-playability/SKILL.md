---
name: level-blockout-playability
description: Use for 2D/3D blockouts, player movement metrics, jump reachability and physical space validation; not story progression.
---
# Level Blockout & Playability

## When to use
Whitebox/greybox geometry, platform gaps, jump arcs, traversal reach, corridor clearance, collision scale, 2D/3D editor testing. Do **not** use this skill to generate assets or replace the user's existing physics or renderer. For room gating use `level-progression-pacing`; for QA audits use `level-design-debugging-qa`.

## Procedure
1. Inspect the current player controller, physics tick, scale, collider, camera view and abilities; measure *actual* run speed, jump impulse, gravity, dash, air control and size. Never assume 70% of horizontal range is a safe gap when elevation differs.
2. Author coarse geometry from `examples/platforms.json`, preserving world scale and passage widths. Validate clearance and conservative jump envelopes with `src/blockout.mjs`.
3. Treat `jumpEnvelope` as **analytic, constant horizontal speed, constant gravity, upward-Y ballistics only**: moving platforms, collision contacts, slope physics, jump hold, portals, double jump, momentum and player size require a physics-backed probe. Negative deltaY denotes a lower landing platform.
4. For target project's real controller, pass `sampleTraversal({advance,isGoal})` an adapter to advance a cloned or isolated simulation state; if the step budget expires, report `inconclusive`, NOT unreachable. Never step the live production world during validation.
5. Draw blockout on existing `CanvasRenderingContext2D` with `drawCanvasPlatforms(ctx,...)` inside existing camera transform. Or inject existing `THREE`, `scene`, and shared material to `addThreeBlockout` and **dispose** when changing levels. Do not spawn a second renderer/game loop.
6. Confirm in-engine with collision bodies. Rapier/Planck are physics **owners**; follow adapter notes in `references/physics-integration.md`.
7. Record measured metrics, edge-margin changes, blocked routes and replay seeds; attach screenshots and playtest observations. Test at 30/60/144 FPS as appropriate.

## Contract
Source: `src/blockout.mjs` with type declarations `src/blockout.d.mts`. Examples and `node --test tests/*.test.mjs`. Invalid numerical parameters throw instead of yielding NaNs; `sampleTraversal` never asserts impossibility based on a finite attempt limit. `addThreeBlockout` owns meshes it creates but **not** the shared material or scene.

## Related skills
level-progression-pacing, level-design-debugging-qa, browser-camera-2d, threejs-camera-rigs-3d, rapier-physics-3d, planck-custom-physics-2d

## References
- `references/physics-integration.md` — Rapier/Planck adapter boundaries, authoritative simulation, moving levels.
- `references/whitebox-workflow.md` — blockout protocol, jumping, camera and geometry.
- `examples/canvas-blockout-demo.html`, `examples/three-blockout.mjs`, `examples/platforms.json`.
