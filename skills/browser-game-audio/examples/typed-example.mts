import { BrowserGameAudio } from '../scripts/audio-engine.mjs';
export function createAudio(context: AudioContext): BrowserGameAudio {
  const engine = new BrowserGameAudio({context, maxVoices:24});
  engine.setBusLevel('sfx', 0.8);
  return engine;
}
