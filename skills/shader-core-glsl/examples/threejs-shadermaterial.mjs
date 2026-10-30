// Copy-adapt in a Three.js WebGLRenderer application. Requires npm package `three`.
// THREE.ShaderMaterial injects built-in attributes/uniforms; do not duplicate them.
import * as THREE from 'three';
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(vUv, 0.25, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
export function makeUVPreviewMaterial(){
  return new THREE.ShaderMaterial({vertexShader, fragmentShader});
}
