import { MusicalClock, smoothIntensity } from '../scripts/adaptive-music.mjs';
export function nextTransition(audioTime:number):number {
  const clock=new MusicalClock({bpm:128,beatsPerBar:4,origin:0});
  return clock.boundaryAtOrAfter(audioTime,{bars:2})+smoothIntensity(0,0,0);
}
