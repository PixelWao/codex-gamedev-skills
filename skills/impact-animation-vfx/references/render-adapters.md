# Render backend adapters

Canvas 2D: `renderCanvasParticles(ctx,pool.particles,{draw})`. Save/restore context, even if drawing throws. For pixel art, snap only render coordinates where appropriate, not simulation coordinates. Cull out-of-view effects in performance-critical worlds.

Three.js: caller supplies an existing `THREE.InstancedMesh`; `syncThreeInstances` populates per-instance matrices and updates `instanceMatrix.needsUpdate`. Caller builds matrices with existing `THREE.Matrix4`, owns geometry/material, and disposes their GPU resources on scene shutdown. Re-evaluate per-version attribute count and bounding culling behavior. Integration here is an adapter interface, not a shipped copy of Three.js.

```js
// Example: scratchMatrix from the host's installed Three.js. Avoid per-particle Matrix4 allocation.
syncThreeInstances(mesh,pool.particles,p=>{
  scratchMatrix.compose(new THREE.Vector3(p.x,p.y,0),identityQuaternion,new THREE.Vector3(p.radius,p.radius,p.radius));
  return scratchMatrix;
});
```

Godot: use a tween on a visual Node2D/Node3D, kill any earlier tween targeting same property; use existing particles. Unity: use cached base transform and absolute `t` in a coroutine or animation curve, cancel competing property writers. These are adaptation guidelines, not compiled engine-specific code.

Rapier/Planck: consume contact position/energy as data for VFX but don't create secondary physics bodies unless separately authorized. Burst budgets prevent particle storms in destructible maps.
