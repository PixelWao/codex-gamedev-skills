# Camera trace schema `camera-qa/1`

### JSONL and JSON

One object per rendered frame (or JSON array of objects):

```json
{"t":0.016667,"target":{"x":0,"y":0},"camera":{"x":0,"y":0},"teleport":false,"occluded":false}
```

3D also requires `z` on target and camera, and CLI flag `--dimension 3`.

### CSV

` t,target_x,target_y,camera_x,camera_y,teleport,occluded ` with optional `_z` columns. Timestamp must be strictly increasing. Timestamps and coordinates are finite numeric values.

### Metrics

- `follow_error`: Euclidean distance in **world units** between the visual camera center and chosen target; median and interpolated p95; high error may be **intentional** (look-ahead, cinematic framing).
- `max_camera_speed`: max norm of camera Δposition/Δtime, world units/second.
- `max_velocity_jump`: max norm of two neighboring sampled camera velocities, world units/second; this is frame-cadence-sensitive and is **not** jerk or physical acceleration. Standardize sampling / resample before cross-FPS comparison.
- `occlusion_rate`: fraction of records where caller explicitly reports occlusion.
- `bounds_violations`: check centered view inside 2D level bounds; for smaller map, correct camera center is map midpoint.
- `teleport_grace`: seconds to omit following-error and sampled-speed checks following hard cuts; bounds still checked.
- `passed`: whether **supplied** numeric thresholds were violated. Without thresholds, a report being passed does **not** prove quality.

### Recommended cases

1. 30, 60, 144 Hz same pre-recorded moving target and seed; compare visual output and qualitative trajectories, not just final position.
2. Instant reversal and stop, long rapid movement, respawn/teleport (reset interpolation), zoom changes, short map axis and screen shake near boundaries.
3. Third-person obstruction entry/exit, corner clipping, thin geometry, self-collider exclusion, hidden target, camera forward retreat.
4. Cinematic camera transitions, dynamic groups, differing aspect ratio and orientation.

Document each threshold and source of units. No magic universal number is valid for all camera styles.
