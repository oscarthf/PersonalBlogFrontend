#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_data;
uniform float u_repulse_particle_radius;
uniform float u_particleTextureSize;
// uniform float u_canvasSizeWidth;
// uniform float u_canvasSizeHeight;
uniform float u_height_over_width;

void main() {
  
  ivec2 fragIndex = ivec2(v_uv * u_particleTextureSize);
  vec2 fragUV = (vec2(fragIndex) + 0.5) / u_particleTextureSize;

  vec4 data = texture(u_data, fragUV);
  vec2 pos = data.xy;

  float cell_x = floor(pos.x / u_repulse_particle_radius);
  float cell_y = floor(pos.y / u_repulse_particle_radius);

  float left_right_mark = 0.5;
  if (pos.x < u_repulse_particle_radius) {
    left_right_mark = 0.0;
  } else if (pos.x > 1.0 - u_repulse_particle_radius) {
    left_right_mark = 1.0;
  }
  float up_down_mark = 0.5;
  if (pos.y < u_repulse_particle_radius) {
    up_down_mark = 0.0;
  } else if (pos.y > u_height_over_width - u_repulse_particle_radius) {
    up_down_mark = 1.0;
  }

  outColor = vec4(cell_x, cell_y, left_right_mark, up_down_mark);

}
