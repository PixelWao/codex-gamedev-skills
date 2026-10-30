---
name: audio-mixing-qa
description: Use to audit game audio loudness, WAV peaks, loops, clipping, silence or audio event logs; not to implement the playback engine.
---
# Audio Mixing & QA — measurements and evidence

## Mission
Audit files and telemetry objectively, and hand off reproducible findings.
Never claim that sample peaks are true peaks, that RMS equals LUFS, or that a
simulated trace proves audible real-device synchronization.

## Workflow
1. Discover the game's asset formats, expected channels/sample rate, target
   platforms, reference listening mix, headroom strategy and device test matrix.
2. For uncompressed integer PCM WAV run `scripts/audio_audit.py`; it reports
   sample peak dBFS, RMS dBFS, DC offset, candidate loop edge jump, duration
   and warnings. Reject unsupported/non-PCM formats, don't guess.
3. For credible LUFS and true-peak metrics, use the optional FFmpeg `ebur128`
   mode; record FFmpeg version and backend. EBU R128's metrics do not directly
   prescribe a universal loudness target for all games.
4. For event logs, emit JSONL with audio-clock `time`, `event`, unique `id`,
   scheduled and observed times. Run `scripts/audio_event_qa.py` for voice
   budgets, duplicate starts, orphan stops and suspicious drift.
5. Perform headphone/speaker listening, browser autoplay, pause/resume,
   intentional silence/mute, rapid SFX storms and low-memory device tests.
6. Write report with severity, reproducer, before/after outputs, measurement
   method, instrument/environment and everything not tested.

## Commands
```bash
python -m unittest discover -s tests -v
python scripts/audio_audit.py examples/sample.wav --output report.json
python scripts/audio_audit.py examples/sample.wav --with-ebur128
python scripts/audio_event_qa.py examples/clean_trace.jsonl
```

## Tool scope
- `scripts/audio_audit.py`: PCM integer WAV 8/16/24/32-bit technical audit;
  no float-WAV or MP3 native parse; FFmpeg optional for BS.1770-style measures.
- `scripts/audio_event_qa.py`: synthetic or captured JSONL instrumented trace.
- `references/metrics.md`: interpretation and measurement limitations.
- `references/qa-scenarios.md`: reproducible scenarios for audio regression.
- `assets/AUDIO_QA_REPORT_TEMPLATE.md`: audit deliverable.

**Caution:** a high difference between the first and last sample is only a
candidate click. Proper seam QA must account for wave phase, interpolation,
codec delay and listening. Integrated LUFS needs actual compliant measurement,
not approximate windowed PCM RMS.
