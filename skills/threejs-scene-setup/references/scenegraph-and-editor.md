# Scene graph and editor integration

Three.js Object3D transforms are local to a parent. A fresh camera points down -Z; +Y is the customary up axis. Radians are used for rotations; `PerspectiveCamera.fov` is degrees. World transforms combine all parents, so local `position` is not a substitute for world pose.

## Reparenting

- `newParent.add(object)` preserves **local** transform but may change **world** pose.
- `newParent.attach(object)` attempts to preserve world transform and has documented limitations with nonuniform parent scaling. The provided `reparentPreservingWorld` rejects common unsupported branches; this is a conservative precheck, not a full matrix/shear validator.
- Before modifying physics entities, decide whether physics body poses are defined in world space, then resynchronize appropriately. Don't apply visual parent scale blindly to physical mass/colliders.

## Project invariants

Do not replace persistent IDs with transient Three.js `id`. Preserve stable UUID/project IDs, inspector fields, serialized hierarchy, selection references, Undo/Redo commands, prefab instances and reusable resource handles. Never rebuild a full scene graph on every UI change if small property patches suffice.

For editor undoable hierarchy change: snapshot previous parent and transforms; apply operation; issue one editor event, push undo command; validate re-selection, save/reload and traversal. For unknown engine architecture, implement a small isolated adapter rather than injecting undocumented mutations.

## Camera/controller ownership

OrbitControls is appropriate for orbit/pan/dolly inspection, not always gameplay camera. Call `controls.dispose()` during removal and clean up own listeners. While damping or autoRotate is enabled, controls must update in active frames. During editor text input or gizmo drag, coordinate controls.enabled with focus and transform operations.

## Picking

Use the current active camera, correct viewport-relative normalized device coordinates and world matrices after graph changes. For multiple views, map pointer to the view's DOM rectangle rather than assuming one full canvas.
