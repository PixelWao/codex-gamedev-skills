# Fitting shadow cameras safely

Directional light shadows use an orthographic camera and a `DirectionalLight.target`. The shadow camera is internally oriented to look along light->target. You can tune its `left/right/top/bottom/near/far`, but must call `shadow.camera.updateProjectionMatrix()` after changing them. Bounds must be finite, left<right, bottom<top, near>0 and far>near. Start with the region containing relevant shadow casters and receivers, not the entire planet.

Use a `CameraHelper(shadow.camera)` to inspect the frustum. In a large world, a 2048x2048 map covering 200m across allocates roughly ten times fewer texels per meter than one covering 20m — high map size alone cannot fix poor fit. For moving cameras and destructible worlds, re-evaluate camera bounds and shadow update triggers. Frustum snapping/temporal stabilization may reduce jitter but requires careful measurements and backend verification.

SpotLight uses a perspective projection. PointLight shadow maps render multiple cube faces. For point/spot shadow tuning, avoid applying orthographic bounds. Improve `near`/`far` based on actual light influence; no arbitrary 1e-5 near planes.

Shadow acne vs peter-panning require a paired visual test at grazing angles. Small bias changes can suppress acne but separate a shadow from its caster; excessive normalBias is visible as a detached penumbra. Save before and after screenshots.

Relevant docs: https://threejs.org/docs/pages/OrthographicCamera.html ; https://threejs.org/docs/pages/LightShadow.html ; https://threejs.org/docs/pages/DirectionalLight.html
