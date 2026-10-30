# GLSL language contracts and porting

| Target | Source version | Vertex input | Vertex-to-fragment | Fragment output | Texture lookup |
|---|---|---|---|---|---|
| WebGL 1 | GLSL ES 1.00, implicit | `attribute` | `varying` | `gl_FragColor` | `texture2D` |
| WebGL 2 | GLSL ES 3.00, `#version 300 es` | `in` | vertex `out` / fragment `in` | explicit `out vec4` | `texture` |

A WebGL 2 context can accept GLSL ES 1.00 shader sources; the selected source version determines syntax. `gl_FragColor` must not be used in GLSL ES 3.00. `gl_FragColor` in GLSL 1.00 does not imply an HDR-capable output.

## Port GLSL ↔ HLSL carefully

- GLSL: `vec3`, `mix`, `fract`, `dFdx`, `texture(sampler,uv)`; HLSL: `float3`, `lerp`, `frac`, `ddx`, `Texture.Sample(Sampler,uv)`.
- Matrix memory layout and multiplication order depend on declarations and compiler conventions, not only the shader language; explicitly verify world/view/projection transform under a rotating camera.
- Clip depth, UV Y orientation, derivatives, handedness and normalized device coordinates differ by graphics API / engine pipeline. Do not mechanically swap names and declare parity.
- Confirm texture format, filtering, sampling, alpha mode, rendering pass, macro definitions, and HLSL shader model.
- A fragment shader snippet cannot compile independently if its varyings, uniforms, layout and stages are missing; always build a full pipeline example and link it.

## GLSL ES reference compile

`examples/webgl1/basic.vert`, `basic.frag` and `examples/webgl2/basic.vert`, `basic.frag` contain standalone paired shaders. Run `tests/browser_compile.html` to compile/link both WebGL profiles in a browser that provides contexts.

Sources: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices and https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language
