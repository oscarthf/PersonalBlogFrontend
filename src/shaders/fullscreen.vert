#version 300 es

precision highp float;

out vec2 v_uv;

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
  gl_Position = vec4(pos * 2.0 - 1.0, 0, 1);
}
