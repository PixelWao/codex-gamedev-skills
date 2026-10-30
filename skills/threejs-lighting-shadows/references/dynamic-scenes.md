# Dynamic shadow invalidation: vehicles, demolition and grunts

Use automatic shadow refresh for changing geometry until measurements justify caching. A scene with settling rubble is dynamic: caching every shadow immediately after the first frame produces stale contact information and floating geometry. When using `light.shadow.autoUpdate=false`, issue `light.shadow.needsUpdate=true` on actual changes such as removed building section, vehicle crossing, swinging crane ball or major light/target movement. Prefer an invalidation event from existing engine events, not scanning every rigid body at 60Hz.

Do not add a new physics clock or call `renderer.render` inside the shadow helper. If pausing updates, verify that resumed frames catch all invalidations. For LOD of distant rubble, only turn off shadow casting if difference remains acceptable at the player's camera position.

Regression scenes: stacked rigid bodies, collapsing wall, high crane swing, low sun grazing angle, day/night transition, pause/resume, camera chase, resize and DPR switch. Profile p50/p95 using existing performance QA.

Docs: https://threejs.org/docs/pages/LightShadow.html
