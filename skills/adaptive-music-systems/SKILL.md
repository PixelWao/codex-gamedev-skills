---
name: adaptive-music-systems
description: Use for beat- or bar-synced adaptive game music, Web Audio stem layers, intensity transitions and music scheduling; not ordinary SFX playback.
---
# Adaptive Music Systems — audio-clock scheduling

## Mission
Implement sample-time scheduling for existing game music playback; avoid
frame-timed beat transitions. Does not replace game's sound effect engine.

## Workflow
1. Inspect ownership of current audio bus/context; record BPM, time signature,
   musical downbeat, sample rate, clip length, stem loop markers, browser targets.
2. Choose vertical layers (aligned stems), horizontal sections (A/B/combat) or
   stinger overlays. Preserve current music service/API where feasible.
3. Export stems using the SAME sample rate, exact frame count, bar-aligned
   duration and matching head/tail; fail-fast for incompatible assets.
4. Schedule every related `AudioBufferSourceNode.start(when)` against one
   AudioContext clock; `requestAnimationFrame` may only drive game intensity,
   never source start timing.
5. Use musical grid: clock-origin, BPM, beats/bar, quantization; define policy
   for exact boundary (this implementation allows current boundary), latency
   and lookahead. Avoid scheduling decoded assets that aren't ready.
6. Smooth intensity by delta seconds (not per-frame lerp coefficients), add
   hysteresis so thresholds do not oscillate, and fade layers on the gain node.
7. Test at 30/60/144 FPS, background/foreground, AudioContext suspension and
   tempo changes; do not assume game-frame timestamps are audio timestamps.
8. Document interruption/cancel/restart policy and dynamic music state snapshots
   if saving the game. Do not insert duplicate engine loops or audio contexts.

## Implementation
- `scripts/adaptive-music.mjs`: MusicalClock, stem alignment and music sections.
- `scripts/adaptive-music.d.mts`: declarations for TypeScript projects.
- `examples/music-integration.mjs`: gameplay intensity to layers.
- `references/scheduling-and-quantization.md`: time origin, bars, stingers.
- `references/composition-and-assets.md`: loops, loudness and file formats.
- `references/godot-interop.md`: engine-native equivalent and known traps.
- `tests/music.test.mjs`: numeric and scheduling checks.

## Commands
```bash
node --test tests/*.test.mjs
tsc -p tsconfig.json
```

## Important limitations of the reference implementation
`requestSection` supports a conservative single queued future transition and
throws on attempts to queue another before it starts. Production planners may
implement replace/cancel queues with explicit source and envelope ownership.
All examples assume predecoded AudioBuffers; streaming music, tempo ramps,
seamless phrase navigation and time-stretch require an additional media strategy
and listening tests. Fading two sources prevents some hard cuts but cannot
repair poorly authored loop boundaries.
