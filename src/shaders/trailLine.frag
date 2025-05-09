#version 300 es
precision highp float;
out vec4 outColor;

void main() {
  // vec2 uv = gl_FragCoord.xy / vec2(512.0); // normalize to canvas
  // outColor = vec4(uv, 0.0, 1.0);
  outColor = vec4(1.0, 1.0, 0.0, 1.0);
}
