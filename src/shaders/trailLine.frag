#version 300 es
precision highp float;

in float v_visible;
in float v_fade;
out vec4 outColor;

void main() {
  if (v_visible < 0.5) discard;
  outColor = vec4(1.0, 1.0, 1.0, v_fade); // White, but faded
}
