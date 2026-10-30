# HDR and PMREM resource ownership

## Ownership table
| Resource | Creator | When safe to dispose |
|---|---|---|
| Temporary RoomEnvironment Scene | environment creator | after `pmrem.fromScene` completes and target stored |
| PMREMGenerator helper | environment creator | after conversion; releasing generator does not substitute target disposal |
| Generated PMREM render target | scoped environment owner | after scene/material consumers detach and replacement commits |
| Source HDR texture | loader/asset manager | after PMREM conversion if not needed for scene background; otherwise keep |
| Shared HDR texture | global asset cache | only after last consumer releases it |
| Background texture | scene/asset manager | independent from environment ownership; don't dispose from environment helper |

**Important:** a temporary helper may be disposed while the resulting render target remains active. Store the actual target returned by `fromScene` or `fromEquirectangular`, not only `.texture`. For a direct HDR assignment `scene.environment=hdr`, Three.js may internally convert it; in that path follow the renderer's lifecycle rules instead of inventing an extra PMREM target. The included `createEnvironmentOwner` is *one-scene scoped*: it refuses to silently consume assets shared across scenes. A global cache must manage ref counts separately.

## Safe swap
Create new texture and target; verify success; atomically assign `scene.environment`; free previous owned target only after assignment; do not free unowned previous environment. A failing load must leave old environment active. `dispose()` detaches only the owned texture, restores the previous unowned scene environment if it has not been externally changed, and disposes the target once.

## Common bugs
- Disposing `pmrem` output target immediately after assignment -> missing lighting.
- Disposing user-provided HDR texture while it is still displayed as background -> missing background.
- Keeping old PMREM outputs after each room transition -> growing GPU residency.
- Forcing sRGB on HDR source -> broken highlights.

Docs: https://threejs.org/docs/pages/PMREMGenerator.html ; https://threejs.org/docs/pages/Scene.html ; https://threejs.org/manual/pages/how-to-dispose-of-objects.html
