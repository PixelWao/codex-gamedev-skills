# Animation QA checklist

| Scenario | Expected |
|---|---|
| Static GLB, no clips | Model loads, no crash |
| Required clip absent | Warning/fallback, controller returns false |
| 50 idle→walk→run transitions | No stale fade from old action |
| Re-enter same state | Preserves action phase |
| Attack one-shot interrupted by Hit | No false Attack completion |
| Two enemies with same source model | Independent bones, poses and mixers |
| Paused tab then resume | No uncontrolled huge jump |
| Repeated despawn/respawn | Listener count and mixers return to baseline |
| Large and small delta | No non-finite animation data |
| Rapier-driven controller | No root-motion fight or position drift |
| Animation tracks on absent nodes | No unhandled errors; report broken targets |

Collect baseline scenes and short reference GIF/frames at known animation times.
FPS and CPU profiling belong to the dedicated performance skill. Don't claim
pixel-diff alone validates skinned joint plausibility.
