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

  float left = pos.x < radius ? 1.0 : 0.0;
  float right = pos.x > (1.0 - radius) ? 1.0 : 0.0;
  float top = pos.y > (1.0 - radius) ? 1.0 : 0.0;
  float bottom = pos.y < radius ? 1.0 : 0.0;

  outColor = vec4(left, right, top, bottom);
}
