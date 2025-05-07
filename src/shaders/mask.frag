#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_mask;

out vec4 outColor;

void main() {
  float v = texture(u_mask, v_uv).r; // Sample grayscale intensity
  outColor = vec4(vec3(v), 0.2);     // Gray with alpha for blending
}
