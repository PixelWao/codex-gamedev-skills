# Provenance, rights and technical sources

The new text and example implementations in this directory were developed for
Waldemar Soroka in 2026 and are distributed under `LICENSE` (MIT). Copyright
marking is not a claim to third-party trademarks, engine APIs, prior works or
exclusive rights beyond those available under applicable law.

This skill was developed after examining the original `audio-design` skill in
`awesome-gamedev-agent-skills`, copyright 2026 Abhishek Barali and contributors,
licensed under Apache-2.0. The original source text is not reproduced as a
working example here. The source's license and NOTICE are preserved in
`attribution/upstream/` because the new work builds on the project's concepts
and the relationship should remain transparent. The MIT license does not
supersede the Apache-2.0 obligations of any upstream-protected material.

Upstream concept references: mixing buses; dynamic music layers/segments;
variation of repetitive SFX. Specific code and engineering safeguards were
independently drafted with the public primary technical documentation below.

Primary technical references:
- MDN Web Audio best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MDN AudioBufferSourceNode.start: https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start
- MDN autoplay policy: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- Godot 4 AudioStreamSynchronized: https://docs.godotengine.org/en/stable/classes/class_audiostreamsynchronized.html
- Tone.js Transport reference: https://github.com/tonejs/tone.js/wiki/Transport
- ITU-R BS.1770 recommendation: https://www.itu.int/rec/R-REC-BS.1770/en
- FFmpeg EBU R128 filter: https://ffmpeg.org/ffmpeg-filters.html#ebur128-1

These are technical references, not incorporated third-party source code.
