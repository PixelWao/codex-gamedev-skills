# Preparing music assets

- Stem set: same BPM, same time signature, same frame count/sample rate,
  identical start downbeat; avoid untrimmed encoder delay. Measure/preview at
  the wrap point. Do not use stretched browser `playbackRate` as pitch-neutral
  time stretching.
- Segments: document loop-in and loop-out sample frames, desired crossfade
  length and whether transition happens at beat, bar or phrase.
- Music gain: never boost layers until clipping occurs; leave headroom and
  measure final master output. Peak samples ≠ true peak; RMS ≠ LUFS.
- Large files: decoding uncompressed multitrack PCM uses substantial RAM.
  Streaming long sources requires a separate loading/timing architecture and
  may weaken sample alignment without a shared renderer.
- State: decide how resume/restart after pause, checkpoint or browser audio
  permission denial should behave before implementing gameplay reactions.
