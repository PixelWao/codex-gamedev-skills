// MIT — Copyright (c) 2026 Waldemar Soroka
// Framework-neutral lifecycle control; inject real GLTFLoader and SkeletonUtils.clone.
function resourceSet(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const skeletons = new Set();
  root.traverse(node => {
    if (node.geometry?.isBufferGeometry) geometries.add(node.geometry);
    if (node.skeleton?.dispose) skeletons.add(node.skeleton);
    const list = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
    for (const mat of list) {
      materials.add(mat);
      for (const value of Object.values(mat)) {
        if (value?.isTexture) textures.add(value);
      }
      for (const uniform of Object.values(mat.uniforms ?? {})) {
        const value = uniform?.value;
        if (value?.isTexture) textures.add(value);
        if (Array.isArray(value)) for (const tex of value) if (tex?.isTexture) textures.add(tex);
      }
    }
  });
  return { geometries, materials, textures, skeletons };
}
function disposeUnique(items) { for (const item of items) item.dispose?.(); }

/**
 * Cache loaded asset while active instances exist. Model-owned resources are
 * shared; instance skeletons are private and disposed on instance release.
 * Do not mix these asset-owned geometries/materials/textures with independent
 * scene objects without adding an external ownership system.
 */
export function createAssetStore({ loader, clone }) {
  if (typeof loader?.loadAsync !== 'function' || typeof clone !== 'function') {
    throw new TypeError('Provide GLTFLoader-like loader and SkeletonUtils.clone');
  }
  const entries = new Map();
  let closed = false;

  function clearIfIdle(url, record) {
    if (record.leases !== 0 || entries.get(url) !== record) return;
    entries.delete(url);
    const owned = resourceSet(record.gltf.scene);
    disposeUnique(owned.skeletons);
    disposeUnique(owned.geometries);
    disposeUnique(owned.materials);
    disposeUnique(owned.textures);
    // ImageBitmap.close() is deliberately NOT automatic: bitmap may be shared
    // with unrelated textures; track and close only with explicit ownership.
  }

  async function acquire(url) {
    if (closed) throw new Error('Asset store is closed');
    if (typeof url !== 'string' || url.length === 0) throw new TypeError('Invalid URL');
    let record = entries.get(url);
    if (!record) {
      record = { leases: 0, gltf: null, promise: null };
      record.promise = Promise.resolve().then(() => loader.loadAsync(url)).then(gltf => {
        if (!gltf?.scene?.traverse || !Array.isArray(gltf.animations)) {
          throw new TypeError('Invalid glTF load result');
        }
        record.gltf = gltf;
        return gltf;
      }).catch(err => { if (entries.get(url) === record) entries.delete(url); throw err; });
      entries.set(url, record);
    }
    const gltf = await record.promise;
    if (closed) { clearIfIdle(url, record); throw new Error('Asset store closed during load'); }
    let root;
    try {
      root = clone(gltf.scene);
      if (!root?.traverse) throw new TypeError('clone must return Object3D-like root');
    } catch (error) {
      clearIfIdle(url, record);
      throw error;
    }
    record.leases++;
    let released = false;
    return {
      root,
      animations: gltf.animations,
      release() {
        if (released) return false;
        released = true;
        root.parent?.remove(root);
        // SkeletonUtils.clone creates independent skeletons per instance.
        const privateSkeletons = resourceSet(root).skeletons;
        // A custom clone implementation must provide distinct skeleton objects.
        for (const skel of privateSkeletons) if (!resourceSet(gltf.scene).skeletons.has(skel)) skel.dispose();
        record.leases--;
        clearIfIdle(url, record);
        return true;
      }
    };
  }
  return {
    acquire,
    status() { return [...entries].map(([url, record]) => ({ url, leases: record.leases, loaded: !!record.gltf })); },
    async close() {
      if (closed) return;
      closed = true;
      await Promise.allSettled([...entries.values()].map(r => r.promise));
      if ([...entries.values()].some(r => r.leases > 0)) {
        throw new Error('Release all active instances before closing asset store');
      }
      for (const [url, r] of [...entries]) clearIfIdle(url, r);
    }
  };
}
