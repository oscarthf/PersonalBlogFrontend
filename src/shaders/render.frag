#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

void main() {
  float d = length(v_uv - 0.5);
  float alpha = smoothstep(0.5, 0.45, d);
  outColor = vec4(1.0, 1.0, 1.0, alpha); // white glow
}
