/** Renderer-neutral scene timing and loop ownership. ES2022; compatible with Three.js r180. */
const ownedLoops = new WeakMap();

export function createFrameCoordinator({ update = () => {}, draw = () => {}, maxDeltaSeconds = 0.05 } = {}) {
  if (typeof update !== 'function' || typeof draw !== 'function') throw new TypeError('update and draw must be functions');
  if (!Number.isFinite(maxDeltaSeconds) || maxDeltaSeconds <= 0) throw new RangeError('invalid maxDeltaSeconds');
  let previousMs = null;
  let paused = false;
  let disposed = false;
  let frameCount = 0;
  function tick(timestampMs) {
    if (disposed || paused) return false;
    if (!Number.isFinite(timestampMs)) throw new TypeError('timestamp must be finite milliseconds');
    const dt = previousMs === null ? 0 : Math.min(maxDeltaSeconds, Math.max(0, (timestampMs - previousMs) / 1000));
    previousMs = timestampMs;
    update(dt, timestampMs);
    draw(dt, timestampMs);
    frameCount += 1;
    return true;
  }
  return {
    tick,
    pause() { paused = true; previousMs = null; },
    resume() { if (!disposed) { paused = false; previousMs = null; } },
    resetClock() { previousMs = null; },
    get frameCount() { return frameCount; },
    get paused() { return paused; },
    dispose() { disposed = true; paused = true; previousMs = null; },
  };
}

/**
 * Installs the *only* animation loop on this renderer. Caller must verify no existing
 * third-party loop is in use: Three.js has no public introspection API for that.
 */
export function installOwnedAnimationLoop({ renderer, coordinator, confirmExclusiveOwnership = false }) {
  if (!confirmExclusiveOwnership) throw new Error('Explicit confirmation of loop ownership required');
  if (!renderer || typeof renderer.setAnimationLoop !== 'function') throw new TypeError('renderer.setAnimationLoop required');
  if (!coordinator || typeof coordinator.tick !== 'function') throw new TypeError('coordinator.tick required');
  if (ownedLoops.has(renderer)) throw new Error('A loop is already installed by this module');
  const token = {};
  ownedLoops.set(renderer, token);
  try {
    renderer.setAnimationLoop((timestampMs) => coordinator.tick(timestampMs));
  } catch (error) {
    ownedLoops.delete(renderer);
    throw error;
  }
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (ownedLoops.get(renderer) === token) {
      renderer.setAnimationLoop(null);
      ownedLoops.delete(renderer);
    }
  };
}

/** True render-on-demand. No persistent animation loop; only one pending frame. */
export function createDemandScheduler({ requestFrame, cancelFrame, draw, updateControls = () => {} }) {
  if (![requestFrame, cancelFrame, draw, updateControls].every((fn) => typeof fn === 'function')) {
    throw new TypeError('requestFrame, cancelFrame, draw and updateControls must be functions');
  }
  let pending = null;
  let disposed = false;
  let paused = false;
  let frameCount = 0;
  function frame(timeMs) {
    pending = null;
    if (disposed || paused) return;
    updateControls(); // OrbitControls damping may dispatch change and request another frame.
    draw(timeMs);
    frameCount++;
  }
  function invalidate() {
    if (disposed || paused || pending !== null) return false;
    pending = requestFrame(frame);
    if (pending == null) throw new Error('requestFrame must return a non-null handle');
    return true;
  }
  return {
    invalidate,
    pause() { paused = true; if (pending !== null) cancelFrame(pending); pending = null; },
    resume() { if (!disposed) { paused = false; invalidate(); } },
    dispose() { disposed = true; if (pending !== null) cancelFrame(pending); pending = null; },
    get pending() { return pending !== null; },
    get frameCount() { return frameCount; },
  };
}
