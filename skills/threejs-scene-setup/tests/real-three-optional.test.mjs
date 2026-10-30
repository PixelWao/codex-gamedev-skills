import test from 'node:test';
import assert from 'node:assert/strict';
let THREE;
try { THREE = await import('three'); } catch { /* optional integration dep */ }
test('real Three.js object graph when dependency is available', { skip: !THREE && 'three dependency not installed in QA environment' }, () => {
  const scene = new THREE.Scene();
  const a = new THREE.Group(); const b = new THREE.Group(); const mesh = new THREE.Object3D();
  scene.add(a,b); a.add(mesh); a.position.set(3,0,0); b.position.set(-2,0,0);
  scene.updateMatrixWorld(true);
  const before = mesh.getWorldPosition(new THREE.Vector3()).clone();
  b.attach(mesh); scene.updateMatrixWorld(true);
  const after = mesh.getWorldPosition(new THREE.Vector3());
  assert.ok(before.distanceTo(after) < 1e-9);
});
