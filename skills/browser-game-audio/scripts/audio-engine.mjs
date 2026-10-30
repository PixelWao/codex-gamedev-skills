/** Browser game audio runtime. MIT; Copyright (c) 2026 Waldemar Soroka. */
export const BUS_NAMES = Object.freeze(['music', 'sfx', 'ui', 'ambience', 'voice']);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
function numberBetween(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${label} must be within ${min}..${max}`);
  return value;
}
export function sliderGain(value, power = 2) {
  numberBetween(value, 0, 1, 'slider');
  numberBetween(power, 0.1, 10, 'power');
  return value ** power; // 0 is exactly silent, not -80 dB
}
export function dbToGain(db) {
  if (db === -Infinity) return 0;
  if (!Number.isFinite(db)) throw new TypeError('Finite dB or -Infinity required');
  return 10 ** (db / 20);
}
export function gainToDb(gain) {
  numberBetween(gain, 0, Number.MAX_VALUE, 'gain');
  return gain === 0 ? -Infinity : 20 * Math.log10(gain);
}
export class BrowserGameAudio {
  constructor({ context, maxVoices = 32, rng = Math.random } = {}) {
    if (!context || typeof context.createGain !== 'function') throw new TypeError('Provide an existing AudioContext');
    if (!Number.isSafeInteger(maxVoices) || maxVoices < 1) throw new RangeError('maxVoices must be a positive integer');
    if (typeof rng !== 'function') throw new TypeError('rng must be a function');
    this.context = context; this.maxVoices = maxVoices; this.rng = rng;
    this.master = context.createGain(); this.master.connect(context.destination);
    this.buses = new Map(); this.levels = new Map(); this.voices = new Set();
    this.muted = false; this.duckGain = 1; this.closed = false;
    this.lastEvent = new Map(); this.buffers = new Map();
    for (const name of BUS_NAMES) {
      const gain = context.createGain();
      if (name === 'music') { this.musicDucker = context.createGain(); gain.connect(this.musicDucker); this.musicDucker.connect(this.master); }
      else gain.connect(this.master);
      this.buses.set(name, gain); this.levels.set(name, 1);
    }
    this.musicDucker.gain.value = 1;
  }
  #check() { if (this.closed) throw new Error('Audio engine is disposed'); }
  async unlock() {
    this.#check();
    // Must be invoked from a user gesture, not unconditionally on page load.
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context.state === 'running';
  }
  setMaster(value) { this.setMasterLevel(value); }
  setMute(muted) { this.#check(); this.muted = Boolean(muted); this.master.gain.value = this.muted ? 0 : (this.savedMaster ?? 1); }
  setMasterLevel(value) { this.#check(); this.savedMaster = sliderGain(value); this.master.gain.value = this.muted ? 0 : this.savedMaster; }
  setBusLevel(name, value) {
    this.#check(); if (!this.buses.has(name)) throw new RangeError(`Unknown bus ${name}`);
    const gain = sliderGain(value); this.buses.get(name).gain.value = gain; this.levels.set(name, gain);
  }
  duckMusic(active, { amountDb = -9, timeConstant = 0.08 } = {}) {
    this.#check(); numberBetween(amountDb, -60, 0, 'amountDb'); numberBetween(timeConstant, 0.001, 10, 'timeConstant');
    const target = active ? dbToGain(amountDb) : 1;
    const p = this.musicDucker.gain; p.cancelScheduledValues(this.context.currentTime);
    p.setTargetAtTime(target, this.context.currentTime, timeConstant);
    this.duckGain = target;
    // Dedicated duck gain leaves the user's music setting untouched.
  }
  async loadBuffer(url, { fetcher = fetch } = {}) {
    this.#check(); if (typeof url !== 'string' || !url) throw new TypeError('url required');
    if (!this.buffers.has(url)) {
      const pending = (async () => {
        const response = await fetcher(url);
        if (!response.ok) throw new Error(`Audio fetch failed: ${response.status}`);
        return this.context.decodeAudioData(await response.arrayBuffer());
      })();
      this.buffers.set(url, pending);
      // Retry failures; do not cache rejected promises permanently.
      pending.catch(() => { if (this.buffers.get(url) === pending) this.buffers.delete(url); });
    }
    return this.buffers.get(url);
  }
  play(buffer, { bus = 'sfx', volume = 1, playbackRate = 1, loop = false, position = null,
    cooldownKey = null, cooldownSeconds = 0, priority = 0, steal = 'oldest' } = {}) {
    this.#check();
    if (!buffer || !(buffer.duration > 0)) throw new TypeError('A decoded AudioBuffer is required');
    if (!this.buses.has(bus)) throw new RangeError(`Unknown bus ${bus}`);
    numberBetween(volume, 0, 4, 'volume'); numberBetween(playbackRate, 0.1, 4, 'playbackRate');
    numberBetween(cooldownSeconds, 0, 60, 'cooldownSeconds');
    if (!Number.isFinite(priority)) throw new TypeError('priority must be finite');
    if (cooldownKey != null && cooldownSeconds > 0) {
      const last = this.lastEvent.get(cooldownKey) ?? -Infinity;
      if (this.context.currentTime - last < cooldownSeconds) return null;
    }
    if (this.voices.size >= this.maxVoices) {
      if (steal === 'reject') return null;
      // Do not steal a more important voice for a lower-priority event.
      const candidates = [...this.voices].filter(v => v.priority <= priority);
      if (!candidates.length) return null;
      candidates.sort((a, b) => a.priority - b.priority || a.startedAt - b.startedAt);
      candidates[0].stop();
    }
    let source = this.context.createBufferSource(); source.buffer = buffer;
    source.loop = Boolean(loop); source.playbackRate.value = playbackRate;
    const gain = this.context.createGain(); gain.gain.value = volume;
    let pan = null;
    if (position != null) {
      if (!Array.isArray(position) || position.length !== 3 || !position.every(Number.isFinite)) throw new TypeError('position must be [x,y,z]');
      pan = this.context.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse';
      [pan.positionX, pan.positionY, pan.positionZ].forEach((axis, i) => { axis.value = position[i]; });
      source.connect(gain); gain.connect(pan); pan.connect(this.buses.get(bus));
    } else { source.connect(gain); gain.connect(this.buses.get(bus)); }
    const voice = { source, priority, startedAt: this.context.currentTime, stopped: false,
      stop: () => { if (!voice.stopped) { voice.stopped = true; try { source.stop(); } catch {} cleanup(); } } };
    const cleanup = () => { this.voices.delete(voice); source.onended = null; source.disconnect(); gain.disconnect(); pan?.disconnect(); };
    source.onended = cleanup;
    try { source.start(this.context.currentTime); this.voices.add(voice); }
    catch (e) { cleanup(); throw e; }
    if (cooldownKey != null) this.lastEvent.set(cooldownKey, this.context.currentTime);
    return voice;
  }
  playVaried(buffers, options = {}) {
    this.#check(); if (!Array.isArray(buffers) || !buffers.length) throw new RangeError('Provide at least one buffer');
    const r = this.rng(); numberBetween(r, 0, 1, 'rng result');
    const ix = Math.min(buffers.length - 1, Math.floor(r * buffers.length));
    return this.play(buffers[ix], { ...options, playbackRate: options.playbackRate ?? 0.96 + 0.08 * this.rng() });
  }
  async suspend() { this.#check(); if (this.context.state === 'running') await this.context.suspend(); }
  async resume() { this.#check(); if (this.context.state === 'suspended') await this.context.resume(); }
  dispose() {
    if (this.closed) return;
    this.closed = true;
    for (const voice of [...this.voices]) voice.stop();
    for (const bus of this.buses.values()) bus.disconnect();
    this.musicDucker.disconnect(); this.master.disconnect();
    this.buffers.clear(); this.lastEvent.clear();
    // Intentionally does NOT close an AudioContext owned by the host application.
  }
}
