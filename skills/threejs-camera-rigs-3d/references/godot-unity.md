# Engine references: Godot and Unity

- Godot 4.x `SpringArm3D` performs a ray or shape sweep, applies a margin and allows excluding a character collider; a ray-only camera cast may still let geometry cover screen corners. Check https://docs.godotengine.org/en/stable/tutorials/3d/spring_arm.html and https://docs.godotengine.org/en/stable/classes/class_springarm3d.html
- Unity Cinemachine 3 provides Follow, Deoccluder and TargetGroup camera workflows; verify installed package version, as older Cinemachine components use different names. See https://docs.unity.cn/Packages/com.unity.cinemachine@3.1/manual/CinemachineDeoccluder.html and https://docs.unity.cn/Packages/com.unity.cinemachine@3.1/manual/CinemachineTargetGroup.html
- Three.js OrbitControls is an alternative to writing an orbit rig, not something to run simultaneously on the same camera. Use `OrbitControls.update()` when damping/autorotate require it, and `dispose()` on teardown: https://threejs.org/docs/pages/OrbitControls.html

Keep Godot / Unity as reference architectures, not code dependencies for JS projects.
