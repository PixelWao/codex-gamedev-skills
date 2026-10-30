# Interpreting game audio measurements

- Sample peak dBFS = `20 log10(max(|sample|))`. This differs from true peak:
  reconstruction can exceed the maximum stored sample value.
- RMS dBFS = `20 log10(sqrt(mean(sample²)))`; this is not EBU R128/BS.1770
  integrated LUFS. Use FFmpeg ebur128 for independent integrated loudness and
  true-peak analysis; record its version and inputs. For silence, -infinity dBFS
  is displayed as JSON null, never illegal NaN.
- DC offset is signed mean PCM amplitude. Large offset creates wasted
  headroom and may exacerbate seams.
- Loop edge heuristic = max absolute difference between first and final
  sample per channel. It is not a definitive click detector; check the actual
  loop splice, phase and matching waveform derivative.
- Voice budget telemetry needs complete unique IDs and real start/end events.
  Source release must be instrumented; purely synthetic test traces only prove
  analysis logic.
- Do not impose fixed -14/-16 LUFS across every SFX/music/genre. Explicitly
  determine delivery constraints and listening safety. Avoid long high-volume
  listening during test.

Primary reference: https://ffmpeg.org/ffmpeg-filters.html#ebur128-1
