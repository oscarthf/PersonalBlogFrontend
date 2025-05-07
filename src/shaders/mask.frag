#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_mask;

out vec4 outColor;

void main() {
  float v = texture(u_mask, v_uv).r;
  if (v > 0.5) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    outColor = vec4(0.3, 0.6, 0.9, 1.0);
  }
}
