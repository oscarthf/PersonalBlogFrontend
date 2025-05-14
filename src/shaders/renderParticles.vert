#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quadPos;   // [-0.01, 0.01]
layout(location = 1) in vec2 a_index;     // particle tex coords

uniform sampler2D u_data;
uniform sampler2D u_animationOffsets;
uniform float u_size;
uniform float u_particle_radius; // 0.01
uniform float u_height_over_width;
uniform int u_frameNumber;
uniform int u_numFrames;
uniform vec3 u_particleColor;

out vec2 v_uv;

float atantwo(float y, float x) {
  if (x > 0.0) return atan(y, x);
  if (x < 0.0 && y >= 0.0) return atan(y, x) + 3.14159265358979323846;
  if (x < 0.0 && y < 0.0) return atan(y, x) - 3.14159265358979323846;
  if (x == 0.0 && y > 0.0) return 1.57079632679489661923;
  if (x == 0.0 && y < 0.0) return -1.57079632679489661923;
  return 0.0;// undefined
}

void main() {
  vec2 uv = (a_index + 0.5) / u_size;
  vec4 data = texture(u_data, uv);
  vec2 pos = data.xy;
  vec2 vel = data.zw;

  // Compute angle from velocity
  float angle = -atantwo(vel.y, vel.x) + 3.14159265358979323846 / 2.0;
  float c = cos(angle);
  float s = sin(angle);

  // Rotation matrix
  mat2 rotation = mat2(c, -s, s, c);
  vec2 rotatedQuad = rotation * a_quadPos;

  pos.y /= u_height_over_width;
  
  v_uv = ((a_quadPos / u_particle_radius) + 1.0) * 0.5;

  gl_Position = vec4(pos * 2.0 - 1.0 + rotatedQuad, 0.0, 1.0);
}
