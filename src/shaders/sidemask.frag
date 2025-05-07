#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_data;
uniform float radius;
uniform float u_textureSize;

void main() {
  ivec2 fragIndex = ivec2(v_uv * u_textureSize);
  vec2 fragUV = (vec2(fragIndex) + 0.5) / u_textureSize;

  vec4 data = texture(u_data, fragUV);
  vec2 pos = data.xy;

  float cell_x = floor(pos.x / radius);
  float cell_y = floor(pos.y / radius);

  float left_right_mark = 0.5;
  if (pos.x < radius) {
    left_right_mark = 0.0;
  } else if (pos.x > u_textureSize - radius) {
    left_right_mark = 1.0;
  }
  float up_down_mark = 0.5;
  if (pos.y < radius) {
    up_down_mark = 0.0;
  } else if (pos.y > u_textureSize - radius) {
    up_down_mark = 1.0;
  }

  outColor = vec4(cell_x, cell_y, left_right_mark, up_down_mark);

}
