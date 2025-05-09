#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

void main() {
  float red = 1.0;
  float green = 1.0;
  float blue = 1.0;
  float v_fade = 1.0 - v_uv.y;
  outColor = vec4(red, green, blue, v_fade);
}
