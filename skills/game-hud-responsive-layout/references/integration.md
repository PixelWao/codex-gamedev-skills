# Layout integration and source references

## HTML5
- CSS `env(safe-area-inset-*)`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
- `ResizeObserver`: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- `VisualViewport`: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
- WebGL overlay: transform world coordinates into CSS viewport pixels *after* the real camera matrices have updated.
- Never multiply a CSS-space coordinate by DPR before setting `style.left/top`; DPR only applies to canvas backing bitmap.

## Three.js runtime adapter

```js
// camera, scene and Vector3 are owned by the existing project.
scene.updateMatrixWorld(true);
camera.updateMatrixWorld();
const labelPosition = new THREE.Vector3(target.x, target.y + 1.8, target.z).project(camera);
const front = labelPosition.z >= -1 && labelPosition.z <= 1;
const visible = front && Math.abs(labelPosition.x) <= 1 && Math.abs(labelPosition.y) <= 1;
label.hidden = !visible;
if (visible) {
  label.style.left = `${(labelPosition.x * .5 + .5)*container.clientWidth}px`;
  label.style.top  = `${(-labelPosition.y * .5 + .5)*container.clientHeight}px`;
}
```

If you need geometric behind-camera detection, use `projectThreeToCss()` in `src/hud.mjs`, or
transform the target into camera space before projection. The example alone does not prove occlusion:
check depth against geometry only when needed (raycast or depth buffer with performance budget).

## Godot / Unity reference, not executable code

- Godot: `Control` anchors + Container flow. On window resize re-evaluate safe area in the **same**
  coordinate space. `DisplayServer.get_display_safe_area()` may use screen-space pixels: convert
  screen-to-window before applying margins. Signal connect then initial `current_hp` render;
  clamp `max_hp=0`. Docs: https://docs.godotengine.org/en/stable/classes/class_displayserver.html
- Unity: `CanvasScaler` (Scale With Screen Size), `RectTransform` anchors and layout groups,
  `Screen.safeArea` normalized using the corresponding `Screen.width` and `Screen.height`.
  Reapply on orientation/size change. Docs: https://docs.unity3d.com/ScriptReference/Screen-safeArea.html

## Ownership compatibility

`threejs-scene-setup` owns renderer + scene loop; `threejs-camera-rigs-3d` owns camera;
`game-menu-navigation-flow` owns overlay navigation; `browser-input-action-system` owns gameplay actions.
HUD reads snapshots and displays them, not the reverse.
