# Regression matrix and limitations

| Scenario | Automated check | Real integration still required |
| --- | --- | --- |
| overlapping hit-stop | balanced IDs / expiry and time scale unit tests | pause/input/game-loop behavior |
| external slow motion | preserve external live baseline | physics time step behavior |
| sprite pop | same absolute-time value at 30/60/144 Hz | visual/art review |
| repeated contacts | duplicate ID suppression | event naming from actual physics |
| dense destruction | event/particle budgets | GPU heap, draw calls, frame timings |
| reduced motion | no camera/VFX/flash channels | browser preference wiring and accessibility |
| flash disabled | no flash channel | display brightness/frequency |
| camera delta | finite x/y/roll and decay | aim separation and collision integration |
| cancelled animation | restoration of baseline | scene unload in real engine |

For real release, record browser and hardware, inspect both desktop/mobile, and manually check comfort, responsiveness, visibility and audio/visual balance. Passing math/unit tests does not certify subjective game feel or photosensitivity safety.
