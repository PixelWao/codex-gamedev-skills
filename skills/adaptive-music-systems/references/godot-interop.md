# Godot reference and corrected concepts

Godot 4 `AudioStreamSynchronized` starts underlying streams together; a for-loop
of `AudioStreamPlayer.play()` calls is not a sample-alignment guarantee.
Use buses (`AudioServer.get_bus_index`, `AudioServer.set_bus_volume_db`) and
verify index != -1. `linear_to_db(0)` should result in explicit mute policy,
not a tiny but nonzero surrogate.

Duck level is relative to user music settings; do not reset to absolute 0 dB.
Cancel/reuse existing tweens so rapid combat/voice changes do not fight.

Correct the original issue where `seconds_per_beat-fmod(pos,seconds_per_beat)`
incorrectly waits an entire beat on an exact beat. Choose inclusive or
exclusive quantization intentionally. Per-frame `lerp(..., 0.05)` depends on
FPS; use an exponential factor computed from `delta`.

Primary documentation:
https://docs.godotengine.org/en/stable/classes/class_audiostreamsynchronized.html
