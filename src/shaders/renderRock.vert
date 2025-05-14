#version 300 es

precision highp float;

out vec2 v_uv;
// out float v_animationFrame;
out float v_frameNumber;
out float v_animationType;

uniform float u_rock_x;
uniform float u_rock_y;
uniform float u_rock_width;
uniform float u_rock_height;

uniform int u_animationType;
uniform int u_frameNumber;
uniform float u_height_over_width;
uniform vec3 u_rockColor;
uniform float u_rockFloatingOffset;

vec2 getPos(int id) {
  if (id == 0) return vec2(0.0, 0.0);
  if (id == 1) return vec2(1.0, 0.0);
  if (id == 2) return vec2(0.0, 1.0);
  if (id == 3) return vec2(1.0, 0.0);
  if (id == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

void main() {

  v_animationType = float(u_animationType);
  v_frameNumber = float(u_frameNumber);

  vec2 pos = getPos(gl_VertexID);
  v_uv = pos;

  pos.x = u_rock_x + u_rock_width * pos.x;
  pos.y = (u_rock_y + u_rock_height * pos.y) / u_height_over_width;
  
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
  
}
