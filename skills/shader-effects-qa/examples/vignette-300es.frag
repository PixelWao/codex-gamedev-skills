#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uScene;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uStrength;
uniform float uAspect;
out vec4 outColor;
void main() {
  vec4 scene = texture(uScene, v_uv);
  vec2 p = (v_uv - vec2(0.5)) * vec2(max(uAspect, 0.001), 1.0);
  float d = length(p);
  float inner = max(0.0, uInnerRadius);
  float outer = max(inner + 0.0001, uOuterRadius);
  float falloff = smoothstep(inner, outer, d);
  vec3 rgb = scene.rgb * (1.0 - clamp(uStrength, 0.0, 1.0) * falloff);
  outColor = vec4(rgb, scene.a);
}
