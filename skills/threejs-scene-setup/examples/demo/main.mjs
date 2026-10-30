/** Optional real browser demo; import map pins three@0.180.0. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFrameCoordinator, installOwnedAnimationLoop } from '../../scripts/frame-coordinator.mjs';
import { createViewportController } from '../../scripts/viewport-controller.mjs';
import { createResourceRegistry, createLifecycleScope } from '../../scripts/resource-scope.mjs';

const canvas = document.getElementById('scene-canvas');
const container = document.getElementById('viewport');
const status = document.getElementById('status');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x152339);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(3, 2, 5);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

const registry = createResourceRegistry();
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const material = new THREE.MeshNormalMaterial();
const releaseGeometry = registry.lease(geometry);
const releaseMaterial = registry.lease(material);
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const scope = createLifecycleScope();
const viewport = createViewportController({ renderer, camera, container,
  getDpr: () => window.devicePixelRatio || 1,
  maxDpr: 2, maxPixels: 2_000_000 });
const coordinator = createFrameCoordinator({
  update: (dt) => {
    cube.rotation.y += dt * 0.5;
    controls.update();
  },
  draw: () => renderer.render(scene, camera),
});
// This is a STANDALONE demo with an audited, exclusive renderer owner.
const stop = installOwnedAnimationLoop({ renderer, coordinator, confirmExclusiveOwnership: true });
status.textContent = `Three.js r${THREE.REVISION} — one loop, container resize`;
scope.listen(document.getElementById('pause'), 'click', () => coordinator.pause());
scope.listen(document.getElementById('resume'), 'click', () => coordinator.resume());
let disposed = false;
function teardown() {
  if (disposed) return;
  disposed = true;
  stop(); coordinator.dispose(); viewport.dispose(); controls.dispose();
  cube.removeFromParent(); releaseGeometry(); releaseMaterial();
  renderer.dispose(); scope.dispose();
}
scope.listen(window, 'pagehide', teardown);
