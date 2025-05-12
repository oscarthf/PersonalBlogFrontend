#version 300 es

precision highp float;

out vec2 v_uv;
out vec3 v_rockColor;
out float v_animationFrame;
out float v_animationType;

uniform float u_rock_x;
uniform float u_rock_y;
uniform float u_rock_width;
uniform float u_rock_height;

uniform int u_animationType;
uniform int u_frameNumber;
uniform float u_height_over_width;
uniform vec3 u_rockColor;

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

  int animationLength = 32 * 24;

  float waterHeightDelta = 0.1;
  
  float animationFrame = float(u_frameNumber % animationLength) / float(animationLength);
  v_animationFrame = sin(animationFrame * 3.14159 * 2.0) * waterHeightDelta;

  //

  v_rockColor = u_rockColor;
  vec2 pos = getPos(gl_VertexID);
  v_uv = pos;

  pos.x = u_rock_x + u_rock_width * pos.x;
  pos.y = (u_rock_y + u_rock_height * pos.y) / u_height_over_width;
  
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
