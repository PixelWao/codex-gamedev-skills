import { AdaptiveMusicDirector, smoothIntensity, hysteresisLevel } from '../scripts/adaptive-music.mjs';
// Pass the music bus from your existing audio runtime, never context.destination directly.
export function configureDirector(audioContext, musicBus, stemBuffers) {
  const director = new AdaptiveMusicDirector({context:audioContext,output:musicBus,bpm:120,beatsPerBar:4});
  // The stems MUST be exported aligned and must share identical sample count/rate.
  director.startStems(stemBuffers);
  let intensity=0, level=0;
  return { director, update(gameState, dt) {
    intensity = smoothIntensity(intensity, Math.min(1,gameState.enemiesNearby/5), dt, .75);
    const next=hysteresisLevel(intensity,level);
    if (next !== level) { level=next; director.setStem('drums',Boolean(level),{fadeSeconds:.45}); }
  }};
}
