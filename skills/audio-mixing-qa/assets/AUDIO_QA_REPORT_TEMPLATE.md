# Audio QA — report template

## Scope and configuration
Project/build, source audio files, browsers/devices, sample rates, playback chain.

## Instrumentation
Commands, FFmpeg build/version, thresholds, trace schema, captures.

## Measurements
| Asset/event | Sample peak | RMS | LUFS/TP (if actually measured) | Findings |
|---|---|---|---|---|

## Reproduction
Seed, scene, input events, exact timestamp of offending clip/transition.

## Fixed / still failing
Describe changed code and control sample.

## Limitations
Explicitly separate unit tests, synthetic traces, browser render and real speakers.
