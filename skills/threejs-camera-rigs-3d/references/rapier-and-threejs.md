# Three.js and Rapier integration

**The rig provides a query interface; it does not import Rapier.** This avoids version coupling and prevents creating competing physics worlds.

```js
rig.update(dt, {
  collisionQuery({origin,direction,maxDistance,excludePlayer}) {
    // Use your project's existing physics query interface.
    // Convert origin and direction to native vector types, exclude the player,
    // cast along the camera boom up to maxDistance; return nearest solid hit
    // measured along the normalized direction, or null if no hit.
    return null;
  }
});
```

A production solution may use a swept sphere/capsule or cone/near-plane samples rather than a single ray. The precise collider sweep API, query filtering (`QueryFilterFlags`, groups), exclusion syntax and timing depend on the installed Rapier JS/WASM version. Verify using https://rapier.rs/docs/user_guides/javascript/scene_queries/ before coding.

## Update order

- Fixed physics tick -> interpolated visual target -> rig.update(renderDt, query) -> apply pose -> renderer.render.
- Pause: keep camera static or allow purely cosmetic orbit depending on design.
- Teleport: setTarget(..., {cut:true}), reset physics history, avoid interpolating target across distant locations.
- A collision hit pulls camera in at once; clear space permits time-smoothed return; this prevents clipping on entry and popping on exit.

## Framing and editor controls

The groupFraming sample is **not** a general algorithm for any camera orientation. Use camera-space bounding boxes, camera FOV and correct aspect ratio for general target groups. Consider selecting an authored framing camera for dramatic multi-target compositions. RTS zoom-to-cursor should be implemented by calculating the ground-plane intersection before and after zoom, then translating camera target to conserve the intersection point.

Never update an OrthographicCamera's clip bounds without calling `updateProjectionMatrix()`. Preserve vertical span in resize helper; if a project wants constant horizontal span, implement a separate explicit policy.

Sources:
- Three.js PerspectiveCamera: https://threejs.org/docs/pages/PerspectiveCamera.html
- Three.js OrthographicCamera: https://threejs.org/docs/pages/OrthographicCamera.html
- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls.html
- Rapier scene queries: https://rapier.rs/docs/user_guides/javascript/scene_queries/
