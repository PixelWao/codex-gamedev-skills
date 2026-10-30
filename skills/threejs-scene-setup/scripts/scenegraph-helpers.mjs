/** Scenegraph integration helpers; no global scene or renderer creation. */
export function toNDC({ clientX, clientY, rect }) {
  if (!rect || !Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) {
    throw new RangeError('Canvas rect must have positive dimensions');
  }
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) throw new TypeError('pointer coordinates must be finite');
  return { x: ((clientX - rect.left) / rect.width) * 2 - 1, y: -((clientY - rect.top) / rect.height) * 2 + 1 };
}
export function reparentPreservingWorld(object, targetParent, { epsilon = 1e-5 } = {}) {
  if (!object || !targetParent || typeof targetParent.attach !== 'function') throw new TypeError('Object3D and target Object3D required');
  // Object3D.attach explicitly does not support non-uniformly-scaled ancestors.
  for (const branch of [object, targetParent]) {
    for (let node = branch; node; node = node.parent) {
      const scale = node.scale;
      if (scale && (Math.abs(scale.x - scale.y) > epsilon || Math.abs(scale.y - scale.z) > epsilon)) {
        throw new Error('World-preserving attach is unsupported with non-uniform ancestor scale');
      }
    }
  }
  targetParent.attach(object);
  return object;
}
