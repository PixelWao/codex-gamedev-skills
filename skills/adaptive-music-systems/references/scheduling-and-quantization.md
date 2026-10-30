# Beat, bar and scheduler details

The only authoritative scheduling timeline is `AudioContext.currentTime`, not
Date.now(), audio element `currentTime`, or frame `delta`.

`beatSeconds = 60 / BPM`; `barSeconds = beatSeconds × beatsPerBar`. The transport
origin marks the first downbeat. `boundaryAtOrAfter(now)` returns `now` when it
falls on the beat boundary (within epsilon); if playback/decode is not ready,
provide `now+lookahead` instead. Avoid missing deadlines when main thread stalls.

Schedule multiple decoded buffers at the same `when` value; Web Audio schedules
start sample positions on its rendering timeline. It cannot guarantee that
already separately encoded stems have equal musical pre-roll/tail; enforce
frame count and alignment. Adjust scheduled transitions on context suspend,
resume, tab throttling and track replacement. Beware multiple starts on a
one-shot AudioBufferSourceNode.

If using Tone.js, callbacks supply audio scheduling times; pass those times
through to instrument/source API. Do not merely trigger source playback when a
callback executes.
