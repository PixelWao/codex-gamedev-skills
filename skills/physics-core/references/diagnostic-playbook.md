# Symptom-driven diagnosis

Use the following as hypotheses, never as an automatic checklist of fixes.

| Symptom | Distinguishing measurement/test | Narrowest candidate fix | Regression risk |
|---|---|---|---|
| Visual judder, physics trace smooth | Render pose vs authoritative pose, frame pacing | Correct interpolation ownership and snapshot timing | Interpolation latency / teleports |
| Actual oscillating body | Contact normals, mass ratio, impulses, contact cache | Fix collider contacts or conflicting transforms before iterations | Rigid stack behavior |
| Tunnel through thin wall | Speed*dt vs collider thickness, relative motion, body type | Appropriate per-engine CCD, shape geometry, or targeted substeps | CPU load, CCD limits |
| Joints stretch | Anchor-frame error, angular speed, effective mass | Correct local anchors, scale, motor strength, then iterations | Joint stiffness and oscillation |
| Exploding pile after break | Colliders spawn intersecting; impulse and mass log | Spawn collision-safe fragments; separate overlaps conservatively | Destruction look and energy |
| Collisions missing but overlap visible | Pair filtering, sensor state, update order | Repair group/mask/callback expectations | Gameplay triggers |
| Bodies never sleep | Velocity thresholds, continuously applied forces | Stop noise forces and validate wake events | Sleeping too early |
| Pause/resume jumps | First frame delta, timestep debt | Preserve established pause-time policy and reset timing | Replay tick count |
| Replays diverge | Seed, body insertion/removal order, callback nondeterminism | Align initial conditions and event ordering | Existing recordings |
| Frame-time spike scales with bodies | Active islands, contacts, joint graph, step p95 | Profile narrow hotspot before changing precision | Accuracy loss |

## Physics sanity scenarios

1. Small cube falling on a floor (single contact).
2. Heavy object on light object and reversed arrangement (mass ratio).
3. Fast sphere aimed at the thinnest real production wall (CCD).
4. Chain/rope at rest, swing, pull, impact, release (anchor constraints).
5. Pile of fractured debris at high contact density.
6. Pause, scene reload, teleport, respawn, world disposal.
7. Mixed world interactions: rigid body with tile grid, moving platform, or character controller.
8. Repeated 30, 60, 120, 144-Hz **render** schedules with unchanged fixed ticks.

For each scenario capture a distinct expected behavior. Do not treat 'did not crash' as passing collision correctness.
