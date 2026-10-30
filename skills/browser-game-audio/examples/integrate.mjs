import { BrowserGameAudio } from '../scripts/audio-engine.mjs';
// Call once during game bootstrap; share your game's existing context if present.
const context = new AudioContext();
export const audio = new BrowserGameAudio({ context, maxVoices: 28 });
// Browser autoplay policy: do not await any unrelated promise before resume() in gesture.
export function bindStartButton(button) {
  button.addEventListener('click', async () => {
    const allowed = await audio.unlock();
    if (!allowed) console.warn('Audio remained suspended; show an unmute affordance');
  });
}
export async function preloadSFX(url) { return audio.loadBuffer(url); }
export function impactSound(buffer, impulse, x, y, z) {
  if (impulse < 4) return;
  return audio.play(buffer, { bus:'sfx', position:[x,y,z], volume:Math.min(1, impulse/35),
    cooldownKey: `impact-${Math.round(x)}-${Math.round(z)}`, cooldownSeconds:0.045 });
}
// The game owns physics, simulation, rAF and input; this module creates none.
