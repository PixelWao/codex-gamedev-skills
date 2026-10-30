// MIT — Copyright (c) 2026 Waldemar Soroka
// Inject an existing AnimationMixer; do not make a new render/update loop.
export function createAnimationController({ mixer, root, clips = [], onFinished = () => {} }) {
  if (!mixer || !root || !Array.isArray(clips)) throw new TypeError('mixer/root/clips required');
  const actions = new Map();
  for (const clip of clips) {
    if (!clip || !clip.name || actions.has(clip.name)) {
      throw new Error('Missing or duplicate animation clip name');
    }
    actions.set(clip.name, mixer.clipAction(clip));
  }
  let current = null;
  let currentName = null;
  let disposed = false;
  let paused = false;
  let previousScale = 1;
  const completed = event => {
    if (!disposed && event.action === current) onFinished(currentName, event);
  };
  mixer.addEventListener?.('finished', completed);

  function transition(name, { fade = 0.2, once = false, loopOnce } = {}) {
    if (disposed) throw new Error('Controller disposed');
    if (!actions.has(name)) return false; // missing clip, no crash
    if (!Number.isFinite(fade) || fade < 0) throw new RangeError('Invalid fade');
    if (currentName === name) return true; // preserve current phase
    const next = actions.get(name);
    next.reset().setEffectiveWeight(1);
    next.enabled = true;
    if (once && loopOnce !== undefined) {
      next.setLoop(loopOnce, 1);
      next.clampWhenFinished = true;
    }
    next.play();
    if (current && fade > 0) current.crossFadeTo(next, fade, false);
    else current?.stop();
    current = next;
    currentName = name;
    return true;
  }
  function update(deltaSeconds) {
    if (disposed) return;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new RangeError('delta in seconds >=0 required');
    mixer.update(deltaSeconds); // once per frame, called by project's existing loop
  }
  function pause(value = true) {
    if (disposed) return;
    if (value && !paused) { previousScale = mixer.timeScale; mixer.timeScale = 0; paused = true; }
    else if (!value && paused) { mixer.timeScale = previousScale; paused = false; }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    mixer.removeEventListener?.('finished', completed);
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
    actions.clear();
    current = null;
    currentName = null;
  }
  return {
    get state() { return currentName; },
    get available() { return [...actions.keys()]; },
    transition, update, pause, dispose
  };
}
