# QA matrix — record evidence for each platform

1. Before first gesture: audio remains blocked/quiet and controls work.
2. Unlock after first click/tap, pause and resume, tab-background throttling.
3. Mute and independent Music/SFX/UI volume persist without override by ducking.
4. Trigger many simultaneous impacts: voice budget enforced, priority preserved,
   no hung nodes or uncaught decode errors.
5. Switch scenes 100 times: no accumulated event listeners, voices or contexts.
6. Request multiple music transitions at bar/phrase boundaries. Check queued
   changes, late decodes, background resume, and acoustic seam by listening.
7. Stereo and mono, headphones/speakers, low and high volume, mobile Safari and
   Android Chromium. Real-device tests are mandatory for hardware claims.
8. Compare FFT/rms/peak trends across revisions; a screenshot or event log is
   not evidence of acoustic quality by itself.
