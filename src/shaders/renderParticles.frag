#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_particleColor;
out vec4 outColor;

uniform sampler2D u_sprite;

void main() {
  vec4 color = texture(u_sprite, v_uv);
  float v = color.r;
  if (v > 0.5) {
    outColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    outColor = vec4(v_particleColor, 1.0);
  }
}
