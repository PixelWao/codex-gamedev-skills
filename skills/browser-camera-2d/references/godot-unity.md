# Godot / Unity reference equivalents

These are **references**, not identical drop-in implementations. Check engine version before code changes.

- **Godot 4 Camera2D:** position smoothing, drag margins, limits, zoom and camera offset can express most of the 2D behavior. Camera offset may display content beyond camera limits by design; verify bounds after shake. See https://docs.godotengine.org/en/stable/classes/class_camera2d.html
- **Godot physics interpolation:** query interpolated target transforms at render time where supported; reset interpolation on teleports. See https://docs.godotengine.org/en/stable/tutorials/physics/interpolation/index.html
- **Unity Cinemachine 3:** position composer/dead and soft zones, follow targets, damping and target groups are higher-level alternatives. Select package API based on installed Cinemachine version; do not assume Cinemachine 2.x names. See https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/index.html
- **Unity non-Cinemachine:** camera follow belongs in the appropriate post-physics update phase, commonly LateUpdate; interpolate rigidbody target instead of chasing discrete physics poses. Confirm game loop before modification.

Preserve existing engine conventions rather than porting the JS helper into Godot or Unity blindly.
