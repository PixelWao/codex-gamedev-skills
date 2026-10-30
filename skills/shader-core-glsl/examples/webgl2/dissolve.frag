#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D uColor;
uniform sampler2D uNoise;
uniform float uThreshold;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;
out vec4 outColor;
void main() {
  vec4 base = texture(uColor, v_uv);
  float noiseValue = texture(uNoise, v_uv).r;
  if (noiseValue < clamp(uThreshold, 0.0, 1.0)) discard;
  float width = max(uEdgeWidth, 0.0001);
  float inner = smoothstep(uThreshold, uThreshold + width, noiseValue);
  outColor = vec4(mix(uEdgeColor, base.rgb, inner), base.a);
}
