/** Explicit resource ownership and event listener teardown; never blindly traverse().dispose(). */
export function createResourceRegistry() {
  const resources = new Map();
  function lease(resource, { owned = true } = {}) {
    if (!resource || typeof resource.dispose !== 'function') throw new TypeError('resource.dispose() is required');
    const entry = resources.get(resource);
    if (entry && entry.owned !== owned) throw new Error('Conflicting ownership policy for shared resource');
    const value = entry || { count: 0, owned };
    value.count += 1;
    resources.set(resource, value);
    let released = false;
    return function release() {
      if (released) return false;
      released = true;
      value.count--;
      if (value.count === 0) {
        resources.delete(resource);
        if (value.owned) resource.dispose();
      }
      return true;
    };
  }
  return {
    lease,
    get activeResources() { return resources.size; },
    get activeLeases() { return [...resources.values()].reduce((total, x) => total + x.count, 0); },
  };
}

/** General cleanup stack. Does not automatically dispose shared geometry, material or textures. */
export function createLifecycleScope() {
  const callbacks = [];
  let disposed = false;
  return {
    defer(callback) {
      if (disposed) throw new Error('LifecycleScope already disposed');
      if (typeof callback !== 'function') throw new TypeError('cleanup callback required');
      callbacks.push(callback);
      return callback;
    },
    listen(target, type, handler, options) {
      if (!target?.addEventListener || !target?.removeEventListener) throw new TypeError('EventTarget required');
      target.addEventListener(type, handler, options);
      this.defer(() => target.removeEventListener(type, handler, options));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const errors = [];
      while (callbacks.length) {
        try { callbacks.pop()(); } catch (e) { errors.push(e); }
      }
      if (errors.length) throw new AggregateError(errors, 'Some scene cleanups failed');
    },
    get disposed() { return disposed; },
  };
}
