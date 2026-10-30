# Technical sources (checked 2026-10-22)

Primary documentation is normative for architecture and API claims; project-installed version is normative for actual available methods.

- Three.js WebGLRenderer API: https://threejs.org/docs/pages/WebGLRenderer
- Three.js Object3D API (attach world transform limitations): https://threejs.org/docs/pages/Object3D.html
- Three.js OrbitControls (damping/update/dispose): https://threejs.org/docs/pages/OrbitControls.html
- Three.js rendering on demand: https://threejs.org/manual/pages/rendering-on-demand.html
- Three.js responsive canvas sizing and pixel budget: https://threejs.org/manual/pages/responsive.html
- Three.js resource cleanup: https://threejs.org/manual/pages/how-to-dispose-of-objects.html
- Three.js migration guide (r182→r183 Clock deprecation): https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Three.js Timer docs (r183+): https://threejs.org/docs/pages/Timer
- Three.js WebGPURenderer architecture / fallback: https://threejs.org/manual/pages/webgpurenderer

Not copied: documentation patterns were studied; the implementation and descriptions in this skill are new. The original upstream work has a separate attribution package under `attribution/upstream/` and was used for the audit of past pitfalls.
