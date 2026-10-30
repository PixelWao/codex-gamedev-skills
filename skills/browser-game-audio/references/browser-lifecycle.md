# Browser context lifecycle and controls

- The game must present a clear sound on/off control. Usually create/resume the
  context in a user-activated click/tap handler; browser autoplay rules vary.
- `AudioContext.resume()` may fail or leave context suspended; handle both.
  Do not open a second context to bypass browser policy.
- On visibility loss, select a documented policy: suspend all audio, keep music,
  or lower ambience. Pausing AudioContext also halts its musical clock: retime
  future transitions on resume and handle background throttling.
- Distinguish `AudioBuffer` (decoded in memory) from media-element streaming.
  For long compressed songs, measure decoding RAM before choosing buffers.
- No `AudioContext.close()` during per-level unload when the application owns
  it. On full app shutdown, call `dispose()` first, then close only owned context.
- Test on desktop Chromium, Firefox, Safari/iOS, Android and reduced-resource
  devices; emulation and mocks are not device evidence.
- Never capture microphone input or persist audio activity without explicit
  feature requirements and consent.
