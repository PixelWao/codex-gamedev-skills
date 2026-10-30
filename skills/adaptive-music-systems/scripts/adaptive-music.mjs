/** Sample-time scheduling of game music. MIT; Copyright (c) 2026 Waldemar Soroka. */
function requireFinite(v, label) { if (!Number.isFinite(v)) throw new TypeError(`${label} must be finite`); return v; }
export function secondsPerBeat(bpm) { requireFinite(bpm, 'BPM'); if (bpm <= 0) throw new RangeError('BPM must be positive'); return 60/bpm; }
export function smoothIntensity(current, target, deltaSeconds, timeConstant = 0.8) {
  for (const [v, n] of [[current,'current'],[target,'target'],[deltaSeconds,'deltaSeconds'],[timeConstant,'timeConstant']]) requireFinite(v,n);
  if (deltaSeconds < 0 || timeConstant < 0) throw new RangeError('Negative timing');
  return timeConstant === 0 ? target : current + (target-current) * -Math.expm1(-deltaSeconds/timeConstant);
}
export function hysteresisLevel(value, previous, {low = .35, high = .65} = {}) {
  if (![value, low, high].every(Number.isFinite) || !(low < high)) throw new RangeError('Invalid hysteresis thresholds');
  return previous ? (value <= low ? 0 : 1) : (value >= high ? 1 : 0);
}
export class MusicalClock {
  constructor({ bpm = 120, beatsPerBar = 4, origin = 0 } = {}) {
    this.beatSeconds = secondsPerBeat(bpm); this.bpm = bpm;
    if (!Number.isSafeInteger(beatsPerBar) || beatsPerBar < 1) throw new RangeError('beatsPerBar must be a positive integer');
    requireFinite(origin, 'origin'); this.beatsPerBar = beatsPerBar; this.origin = origin;
  }
  boundaryAtOrAfter(time, { bars = 1, epsilon = 1e-7 } = {}) {
    requireFinite(time, 'time');
    if (!Number.isSafeInteger(bars) || bars < 1) throw new RangeError('bars must be a positive integer');
    const interval = bars * this.beatsPerBar * this.beatSeconds;
    const phase = (time-this.origin) / interval;
    const nearest = Math.round(phase);
    // A bar boundary exactly on the clock is valid *now*, no full-bar delay.
    const index = Math.abs(phase - nearest) <= epsilon / interval ? nearest : Math.ceil(phase);
    return Math.max(time, this.origin + index*interval);
  }
  beatAtOrAfter(time, { epsilon = 1e-7 } = {}) {
    requireFinite(time,'time'); const phase = (time - this.origin)/this.beatSeconds;
    const nearest = Math.round(phase);
    return Math.max(time, this.origin + (Math.abs(phase-nearest) <= epsilon/this.beatSeconds ? nearest : Math.ceil(phase)) * this.beatSeconds);
  }
}
const mix = (p, time, to, duration) => {
  p.cancelScheduledValues(time);
  // Preserve current gain at start of fade: capture via stored target if available.
  p.setValueAtTime(p.value, time);
  if (duration === 0) p.setValueAtTime(to, time);
  else p.linearRampToValueAtTime(to, time+duration);
};
/** Schedules already decoded assets. The host still owns AudioContext, gameplay and render loop. */
export class AdaptiveMusicDirector {
  constructor({ context, output, bpm = 120, beatsPerBar = 4, lookaheadSeconds = 0.1 } = {}) {
    if (!context || typeof context.createBufferSource !== 'function') throw new TypeError('Pass AudioContext');
    if (!output || typeof output.connect !== 'function') throw new TypeError('Pass a music bus AudioNode');
    this.context = context; this.output = output;
    this.clock = new MusicalClock({bpm, beatsPerBar});
    if (!Number.isFinite(lookaheadSeconds) || lookaheadSeconds < 0) throw new RangeError('Invalid lookahead');
    this.lookaheadSeconds = lookaheadSeconds; this.active = []; this.closed = false; this.stems = new Map(); this.current = null;
  }
  #assertOpen() { if (this.closed) throw new Error('Music director disposed'); }
  #makeSource(buffer, {gainValue=1, loop=true, at}) {
    if (!buffer || !(buffer.duration>0)) throw new TypeError('Decoded AudioBuffer required');
    const source=this.context.createBufferSource(), volume=this.context.createGain();
    source.buffer=buffer; source.loop=loop; volume.gain.value=gainValue;
    source.connect(volume); volume.connect(this.output);
    const token={ source, volume, stopAt:Infinity, stop:(when)=> {
      const t=when ?? this.context.currentTime;
      // A scheduled future stop can be brought forward during teardown.
      if (t >= token.stopAt) return;
      token.stopAt=t;
      try { source.stop(t); } catch {}
    }};
    source.onended=()=>{ this.active=this.active.filter(item=>item!==token); source.disconnect(); volume.disconnect(); };
    source.start(at); this.active.push(token); return token;
  }
  startStems(buffers, {base='base', at} = {}) {
    this.#assertOpen(); if (this.stems.size) throw new Error('Stems already started');
    const entries=Object.entries(buffers ?? {});
    if (!entries.length || !entries.some(([k])=>k===base)) throw new Error('Missing base stem');
    const first=entries[0][1];
    if (!(first?.sampleRate>0) || !(first?.length>0)) throw new Error('Invalid AudioBuffer');
    for (const [,buf] of entries) {
      if (buf.sampleRate !== first.sampleRate || buf.length !== first.length)
        throw new Error('Stems must have identical sampleRate and frame count');
    }
    const time=at ?? this.context.currentTime+this.lookaheadSeconds;
    if (!Number.isFinite(time) || time < this.context.currentTime) throw new RangeError('Scheduling time is in the past');
    // Shared exact AudioContext time; NEVER call .start() without its time arg.
    this.clock.origin = time;
    for (const [name, buffer] of entries) this.stems.set(name, this.#makeSource(buffer, {at:time, gainValue:name===base?1:0}));
    return time;
  }
  setStem(name, audible, {at=this.context.currentTime, fadeSeconds=.5} = {}) {
    this.#assertOpen(); const token=this.stems.get(name);
    if (!token) throw new Error(`Unknown stem ${name}`);
    requireFinite(at,'at'); requireFinite(fadeSeconds,'fadeSeconds');
    if (at < this.context.currentTime || fadeSeconds < 0) throw new RangeError('Invalid timing');
    mix(token.volume.gain, at, audible ? 1 : 0, fadeSeconds);
  }
  requestSection(buffer, {at, quantizeBars=1, crossfade=.25, loop=true} = {}) {
    this.#assertOpen();
    requireFinite(crossfade,'crossfade'); if (crossfade < 0) throw new RangeError('crossfade must be nonnegative');
    if (!buffer || !(buffer.duration>0)) throw new Error('Decode the section first');
    const ready=this.context.currentTime+this.lookaheadSeconds;
    const boundary=this.clock.boundaryAtOrAfter(Math.max(at ?? ready,ready), {bars:quantizeBars});
    if (this.current?.startedAt > this.context.currentTime) throw new Error('A pending future section is already scheduled; do not double-queue');
    const next=this.#makeSource(buffer, {at:boundary, gainValue:crossfade===0?1:0, loop});
    if (crossfade > 0) {
      next.volume.gain.setValueAtTime(0, boundary);
      next.volume.gain.linearRampToValueAtTime(1, boundary+crossfade);
    }
    if (this.current) {
      mix(this.current.token.volume.gain,boundary,0,crossfade);
      this.current.token.stop(boundary+crossfade);
    }
    this.current={token:next,startedAt:boundary};
    return boundary;
  }
  stop({at=this.context.currentTime}={}) {
    if (this.closed) return; requireFinite(at,'at');
    for (const t of [...this.active]) t.stop(at);
    this.stems.clear(); this.current=null;
  }
  dispose() { if (this.closed) return; this.stop(); this.closed=true; }
}
