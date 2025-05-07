#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quadPos;   // [-0.01, 0.01]
layout(location = 1) in vec2 a_index;     // particle tex coords

uniform sampler2D u_data;
uniform float u_size;

out vec2 v_uv;

void main() {
  
  vec2 uv = (a_index + 0.5) / u_size;
  vec4 data = texture(u_data, uv);
  vec2 pos = data.xy;

  v_uv = a_quadPos * 0.5 + 0.5; // for circular mask
  gl_Position = vec4(pos * 2.0 - 1.0 + a_quadPos, 0.0, 1.0);
}
