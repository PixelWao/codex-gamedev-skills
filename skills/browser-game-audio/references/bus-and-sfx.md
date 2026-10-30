# Routing, SFX and impact-event contracts

Signal path: `Sound → per-voice Gain → optional Panner → one of 5 buses → Master
→ AudioContext.destination`. Music uses an additional dedicated duck Gain.
Ducking is multiplicative and must *not* overwrite a player's music slider.

`sliderGain(x)` intentionally uses `x²`: ergonomic approximation, not a
universal psychoacoustic law. Slider 0 is exactly silent. Validate gain and
reconcile with stored settings; never set linear slider fractions as dB.

Voice handling: decoded buffers can be cached; every one-shot must create a
new source. Use cooldown keys for repeated collision bursts, event thresholds,
priorities and source cancellation; avoid allocating dozens of voices per
physics contact. Test aggressive collision storms and silence when muted.

3D audio: update listener and PannerNode positions in the existing frame/update
loop. Use a consistent world scale and explicitly choose inverse/linear
attenuation. Do not connect visual mesh coordinates blindly without checking
coordinate systems and camera transform.

Do not infer loudness from `volume` metadata. If assets require exact peak,
LUFS or seam checks, use the companion QA skill and listening tests.
