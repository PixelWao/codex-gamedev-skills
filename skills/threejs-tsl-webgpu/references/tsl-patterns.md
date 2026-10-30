# Three.js TSL material design

- Lock the exact Three.js dependency version; TSL evolves and exports can change. Consult the local `node_modules/three` and current https://threejs.org/tsl/.
- Typical imports: `import * as THREE from 'three/webgpu'` and TSL primitives from `three/tsl`. Use the installed version's actual API declarations, not remembered examples from other releases.
- Create materials with `new THREE.MeshBasicNodeMaterial()` or an appropriate lit node material. Assign a graph to `material.colorNode`, `material.positionNode`, `material.normalNode` or stage-specific nodes as documented.
- Distinguish constant `color(...)` nodes, uniforms `uniform(...)`, UV `uv()`, functions and time inputs. Reuse immutable graph nodes when possible; update uniforms rather than rebuilding shaders per frame.
- Do not replace physically based materials with `MeshBasicNodeMaterial` if the appearance depends on lights, shadows or normal maps.
- Do not assume `texture(...)` represents sRGB unless color space is annotated correctly and passes convert appropriately.
- Treat backend switches as separate tests: `WebGPURenderer({forceWebGL:true})` is useful for WebGL2 fallback, but not every effect or compute pattern is portable.
- `examples/tsl-color-material.mjs` is an embeddable snippet and is not runnable without the installed `three` dependency and a browser GPU context. It illustrates only a basic unlit node material.

Docs: https://threejs.org/tsl/ ; https://threejs.org/manual/pages/webgpurenderer ; https://threejs.org/docs/pages/MeshBasicNodeMaterial.html
