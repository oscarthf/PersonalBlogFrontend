#version 300 es

precision highp float;

out vec2 v_uv;

uniform float u_rock_x;
uniform float u_rock_y;
uniform float u_rock_w;
uniform float u_rock_h;
uniform float u_height_over_width;

vec2 getPos(int id) {
  if (id == 0) return vec2(0.0, 0.0);
  if (id == 1) return vec2(1.0, 0.0);
  if (id == 2) return vec2(0.0, 1.0);
  if (id == 3) return vec2(1.0, 0.0);
  if (id == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

void main() {
  vec2 pos = getPos(gl_VertexID);
  v_uv = pos;

  pos.x = u_rock_x + u_rock_w * pos.x;
  pos.y = (u_rock_y + u_rock_h * pos.y) / u_height_over_width;
  
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
