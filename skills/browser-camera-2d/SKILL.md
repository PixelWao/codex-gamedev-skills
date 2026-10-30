---
name: browser-camera-2d
description: Use for Canvas 2D or pixel-art camera follow, deadzones, look-ahead, zoom, bounds and teleport handling; not 3D camera rigs.
---
# Browser Camera 2D

Provide a camera controller without replacing the game's renderer, physics engine, player controller, or main loop. Start by inspecting the project's camera/update/resize architecture and existing settings. Never silently replace a working camera or change gameplay physics.

## Procedure

1. **Inspect** Canvas CSS dimensions vs backing buffer, DPR, world-to-screen conventions, the active fixed-timestep and interpolation policy, camera ownership, zoom semantics, UI layers and game bounds.
2. **Reproduce** symptoms (jitter, frame-independent smoothing issues, level-edge peeking, look-ahead jerk, zoom defects) with a fixed seed and before-metrics.
3. **Choose** behavior: horizontal/vertical deadzones, separate easing for look-ahead, exponential following `alpha = 1 - exp(-rate * dt)`, zoom limits, grounded vs airborne framing, explicit cuts for portals and respawns.
4. **Integrate** `scripts/camera2d.mjs` or its documented algorithm *inside the existing loop*. Feed render-interpolated player transforms when fixed physics and render FPS differ. Use the same interpolation convention as the game; do not interpolate across teleports.
5. **Render** by clearing the Canvas in identity transform, then applying `Camera2D.applyCanvasTransform(ctx)` only for world draw calls. Restore identity before drawing screen-space HUD; account for DPR in viewport units (see `references/canvas-integration.md`).
6. **Clamp** based on visible half-extents including zoom. If a map is smaller than the viewport, center it on that axis and allow intentional letterboxing; apply shake *before* final clamp. Keep camera and visual-shake offsets distinct.
7. **Verify** at 30/60/144 Hz, variable aspect ratio, zoom, small maps, portal cuts, sudden reversals and pause. Run `node --test tests/*.test.mjs`; consider `camera-debugging-qa` for telemetry if installed, but no dependency is required.

## Bundled implementation

- `scripts/camera2d.mjs` — dependency-free camera, target interpolation and coordinate conversion.
- `scripts/camera2d.d.mts` — TypeScript types for the `.mjs` module.
- `examples/canvas-integration.mts` — typed wiring sketch (requires Canvas / browser, not runnable as standalone).
- `references/canvas-integration.md` — render order, device pixels and portals.
- `references/godot-unity.md` — Godot and Unity analogies with explicit API boundaries.

## Non-goals and protection rules

- Physics/pathfinding is upstream; do not update position, impulses or collision layers here.
- Screen shake *intensity and triggers* belong to game feel; this skill only accepts an offset.
- Camera samples **visual interpolated** targets, not a second simulated world.
- Do not change FPS, switch to an unrelated renderer, add a competing RAF loop, or adjust scene logic to hide camera bugs.
- Report before/after reproduction steps and any features unverified in the target browser/device.

## Exit criteria

All target sizes finite, no undefined positions, UI remains stable, bounds obey design, teleports snap without interpolation streaks, look-ahead reversals ease, coordinate transforms round-trip, and no change to physics tick. Never claim GPU/browser certification based only on Node tests.
