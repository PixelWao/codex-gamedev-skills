// MIT — Copyright (c) 2026 Waldemar Soroka
// Requires project dependency `three`; integrate into existing renderer/loop.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { createAssetStore } from './asset-store.mjs';

export function createProjectModelStore(renderer, {
  dracoDecoderPath = '/vendor/three/draco/',
  ktx2TranscoderPath = '/vendor/three/basis/'
} = {}) {
  // Decoder paths must exist and match project's pinned three version.
  const draco = new DRACOLoader().setDecoderPath(dracoDecoderPath);
  const ktx2 = new KTX2Loader().setTranscoderPath(ktx2TranscoderPath);
  ktx2.detectSupport(renderer); // detect renderer backend before loading
  const loader = new GLTFLoader()
    .setDRACOLoader(draco)
    .setKTX2Loader(ktx2)
    .setMeshoptDecoder(MeshoptDecoder);
  const store = createAssetStore({ loader, clone: cloneSkinned });
  return {
    acquire: url => store.acquire(url),
    status: () => store.status(),
    async close() {
      await store.close(); // release active instances first
      draco.dispose();
      ktx2.dispose();
    }
  };
}
// Usage in an existing game lifecycle:
// const models = createProjectModelStore(renderer);
// const car = await models.acquire('/models/car.glb'); scene.add(car.root);
// ... remove entity: car.release(); ... shut down: await models.close();
