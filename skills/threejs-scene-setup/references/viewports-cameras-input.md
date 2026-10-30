# Container viewport, cameras, input and DPR

## CSS display size is not drawing buffer size

Do not size editor viewport with `window.innerWidth`. The visible area can be a docked panel changed by splitter drags. Read its bounding rect and use `ResizeObserver`; set `renderer.setSize(width,height,false)` so CSS layout remains in charge. Zero-size hidden panels must not overwrite camera aspect with Infinity/NaN.

The bundled viewport controller uses `setPixelRatio` plus `setSize` for portable WebGLRenderer usage, with an explicit **pixel-count cap**. Observe the actual drawing buffer when implementing post-processing/picking/screenshot reading because CSS pixel and device-pixel sizes differ. A project may prefer exact `setDrawingBufferSize` for its backend; don't mix sizing strategies without auditing other consumers.

If DPR changes without a CSS resize event (screen drag between displays), call `viewport.update()` in the app's existing update path or add explicit DPR observation; the module listens for window resize as a fallback but cannot guarantee all OS/device scenarios.

## Projection correctness

Perspective: `camera.aspect = width/height`, then `camera.updateProjectionMatrix()`; keep near/far depth precision reasonable. Orthographic: preserve vertical world half-extent (supplied to helper) and derive horizontal extent from aspect; then update matrix. For camera switching, ensure controls target, pointer projection and projection-specific zoom semantics are updated together.

## Input mapping

Use **canvas viewport rectangle**, not global window dimensions:

```js
const point = toNDC({clientX: event.clientX, clientY: event.clientY,
  rect: renderer.domElement.getBoundingClientRect()});
raycaster.setFromCamera(point, camera);
```

In multi-view/split-screen, first identify the target viewport rectangle and map pointer positions into that rectangle. Watch overlay DOM elements, scrolling, CSS scaling and pointer capture. For touch input ensure simultaneous interactions and focus management are not broken by OrbitControls wiring.

## Suggested QA matrix

- Main viewport at small, large, mobile aspect ratios; panel split drag; tab hidden/shown (zero size).
- DPR 1, 1.25, 2, 3 and max pixel budget; post-process render target resolution.
- Perspective and orthographic camera; selection and gizmo pointer at center/corners.
- Canvas CSS position offset in page and nested scroll containers.
- Mobile touch and desktop pointer controls, with teardown/remount.
