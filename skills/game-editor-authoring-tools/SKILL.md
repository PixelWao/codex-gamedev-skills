---
name: game-editor-authoring-tools
description: Use to build game level editors with object IDs, snapping, undo/redo, prefab edits and Three.js tooling; not procedural generation.
---
# game-editor-authoring-tools

## Mission
Provide a safe authoring data model and editor transactions that adapt to existing Three.js/Canvas games without replacing the runtime renderer, camera, physics, or save system.

## Procedure
1. Identify which scene data is authoritative, current IDs, prefab model, transform units, physics colliders, undo conventions and serialization schema.
2. Use `LevelDocument` as an isolated authoring model; integrate it using adapters, not as a duplicate live game scene.
3. Implement selection, translation, rotation and scale via existing inputs. For Three.js use `TransformControls` in the project, with event-driven updates; detach/dispose on editor shutdown.
4. Snap with `snap(value, increment)` and validate all transforms, parent relations, unique IDs, scale positivity and no parent cycles.
5. Use `add`, `update`, `remove`, `duplicate` and `import` transactions. Support `undo()`/`redo()` and never skip validation when importing external JSON.
6. Integrate save/export with `browser-game-saves`; validate generated levels with `level-design-debugging-qa` and pathfinding before shipping.
7. Test sample assets, multiple edit histories, invalid imports, prefab duplication, scene reload and canvas/UI coordinate transforms.

## Responsibility boundaries
`applyTransformToThreeNode` updates an existing object only; it does not create a renderer, controls, colliders or game loop. Complex prefab inheritance and multi-user collaboration are out of scope for v1.0. Never modify a physics body directly during a solver callback.

## Files to use
- `src/` — tested algorithms and/or CLI.
- `tests/` — independent regression checks.
- `examples/` — small fixture, not a claim about project compatibility.
- `references/integration.md` — interop rules and use cases.
- `references/sources.md` — documentation sources, limitations.
- `PROVENANCE.md` — licensing scope.

## Verification
Run the tests described in `README.md` after any change; cite untested engine/device integrations as unverified.
