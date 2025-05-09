#version 300 es
precision highp float;

in float v_fade;
out vec4 outColor;

void main() {
  float red = 1.0 * v_fade;
  float green = 1.0 * v_fade;
  float blue = 1.0 * v_fade;
  outColor = vec4(red, green, blue, 1.0);
}
