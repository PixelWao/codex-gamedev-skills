// Browser-side EXAMPLE, requires npm `three` of a matching version and bundler/import map.
// Integrate this into existing renderer; do not start a second render loop.
import * as THREE from 'three/webgpu';
import { color, sin, time, vec3 } from 'three/tsl';

export function createPulseNodeMaterial() {
  const material = new THREE.MeshBasicNodeMaterial();
  const pulse = sin(time.mul(2.0)).mul(0.20).add(0.60);
  material.colorNode = color(0x33aaff).mul(pulse);
  return material;
}

export async function createRenderer(canvas) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  // If using the host app's requestAnimationFrame loop, init must complete before rendering.
  await renderer.init();
  return renderer;
}
