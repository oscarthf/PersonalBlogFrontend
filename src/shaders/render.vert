#version 300 es
precision highp float;
in vec2 a_index;
uniform sampler2D u_data;
uniform float u_size;

void main() {
  vec4 data = texture(u_data, a_index / u_size);
  vec2 pos = data.xy * 2.0 - 1.0;
  gl_Position = vec4(pos, 0, 1);
  gl_PointSize = 4.0;
}
