# Shader effect patterns and caveats

## Dissolve

Compare noise value to a clamped 0..1 threshold. Compute an edge band using `smoothstep(threshold, threshold + max(width,eps), noise)`. Decide whether the boundary is emissive or simply tinted. Source noise is data texture, not automatically sRGB. `discard` produces a cutout and changes transparency semantics; analyze overdraw and early depth behavior. Test amount=0, 0.5 and 1 plus noise exactly on boundary.

## Fresnel rim

Normalize surface normal and camera direction in the same coordinate system. `rim = pow(1.0 - clamp(dot(N,V),0.0,1.0), max(power,epsilon))`. Add or blend rim into **existing** material lighting rather than returning only a rim mask. Backfaces and physically based reflection behavior need separate decisions.

## Vignette

Use normalized screen UV, correct aspect ratio and width: `p=(uv-0.5)*vec2(aspect,1.0); d=length(p); falloff=smoothstep(inner,outer,d)` where outer>inner; `c*=1.0-strength*falloff`. Distinguish color in linear vs encoded space. A fullscreen postpass needs a real color input and correct screen rect.

## Outline

Sprite: alpha-neighborhood sampling only draws inside rasterized quad. Reserve transparent pixels / enlarge quad, or use external layer. Atlas border padding avoids neighbor tile bleed; measure the cost of 4/8/16 samples per pixel. 3D outlines: geometry hull expansion or normal/depth edge detection each have failure cases (thin geometry, occlusion, instancing, normals).

## Steam, fire, shockwaves and destruction

Visual parameters may read physical states (heat/pressure/impact), but must not write simulation data or change collision outcomes. Use reproducible noise seed, deterministic timestamp or reference frame when testing. Respect particle and post-effect budgets. Motion vector availability determines some distortion/temporal methods.

## Pixel art and Canvas 2D

Use pixel-perfect scale, stable nearest-neighbor sampling when required; avoid unwanted subpixel shimmer and texture filtering. If the renderer is Canvas2D-only, don't introduce WebGL without explicit agreement. GPU shader effects should be an optional separate rendering layer with well-defined fallback.

References: https://threejs.org/manual/pages/color-management.html ; https://threejs.org/docs/pages/OutputPass.html ; https://threejs.org/tsl/
