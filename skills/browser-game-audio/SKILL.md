---
name: browser-game-audio
description: Use for HTML5 Web Audio SFX playback, buses, spatial sound, autoplay unlock, pause and voice limits; not adaptive composition.
---
# Browser Game Audio — runtime integration

## Mission and activation
Create or repair browser game sound playback, buses, SFX, spatial events, mobile
unlock/pause and voice budgets. Do not implement music composition/scheduling (see
`adaptive-music-systems`) or claim loudness compliance (see `audio-mixing-qa`).

## Non-negotiable integration rules
1. Inspect game bootstrap, existing sound library, AudioContext ownership, input
   gesture, event bus, build tooling and browser support *before coding*.
2. Reuse the existing audio graph unless user explicitly approves replacing it.
   An existing renderer/game loop and physics system must remain untouched.
3. Unlock/resume AudioContext from an actual user gesture; no background
   auto-play promises. Provide user mute and independent music/SFX controls.
4. Use ONE AudioContext where possible; never close a context you do not own.
5. AudioBufferSourceNode is one-shot: create a new node for each playback; cache
   decoded AudioBuffers, not started source nodes. Limit simultaneous voices.
6. Avoid loading untrusted URLs without checking response status, decode errors
   and cross-origin restrictions. Include loading fallback and UI failure path.
7. Do not execute expensive audio processing on each animation frame. Use
   AudioParam automation, and schedule at AudioContext.currentTime.

## Workflow for Codex
- **Audit:** locate callers, audio ownership, browser targets, bus volumes,
  high-frequency collision event sources, test runner and performance budgets.
- **Plan:** state scope and constraints; define `music/sfx/ui/ambience/voice` bus
  routing and a conservative global voice budget; do not enforce arbitrary
  platform-specific limits without profiling.
- **Integrate:** adapt `scripts/audio-engine.mjs` into existing service or use
  example `examples/integrate.mjs`. Inject existing AudioContext; leave physics,
  rendering, routing and save systems owned by the game.
- **Test:** unlock blocked/allowed, mute/volume persistence, paused state,
  repeated collision bursts, mobile voice cap, spatial position, long-running
  remove/restart. Always separate simulated Web Audio tests from speaker tests.
- **Report:** before/after regression evidence, browser/device matrix and exact
  untested items. Attach `assets/INTEGRATION_CHECKLIST.md` checklist.

## Files and live entrypoints
- `scripts/audio-engine.mjs`: runtime with injected AudioContext, five buses,
  exact mute, independent duck gain, buffer cache, capped voices, optional HRTF.
- `scripts/audio-engine.d.mts`: TypeScript API declaration.
- `examples/integrate.mjs`: minimal game event integration (not a new game loop).
- `examples/offline-browser-smoke.html`: run on localhost to test Web Audio path.
- `tests/audio-engine.test.mjs`: Node test suite, including mock API behavior.
- `references/browser-lifecycle.md`: autoplay, mobile, failure and privacy.
- `references/bus-and-sfx.md`: mix graph, gamefeel and limits.

## Commands
```bash
node --test tests/*.test.mjs
tsc --project tsconfig.json
```

## Limits / honesty
`OfflineAudioContext` render proves graph output, not audible quality, output
latency, clipping through OS mixer, real stereo imaging or mobile compatibility.
Do not generate claims of sample-accurate measured delivery from JavaScript
wall-clock timestamps alone.
