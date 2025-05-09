#version 300 es
precision highp float;

in float v_fade;
out vec4 outColor;

void main() {
  float red = 1.0;
  float green = 1.0;
  float blue = 1.0;
  outColor = vec4(red, green, blue, v_fade);
}
