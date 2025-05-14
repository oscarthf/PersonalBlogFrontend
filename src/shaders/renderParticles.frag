#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_sprite;

uniform vec3 u_particleColor;

void main() {
  vec4 color = texture(u_sprite, v_uv);
  float v = color.r;
  if (v > 0.5) {
    outColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    outColor = vec4(u_particleColor, 1.0);
  }
}
