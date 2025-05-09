#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_sprite;

void main() {
  vec4 color = texture(u_sprite, v_uv);

  // // Discard transparent pixels (for soft edges)
  // if (color.a < 0.1) discard;

  outColor = color;
}
