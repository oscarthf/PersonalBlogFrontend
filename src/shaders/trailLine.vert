#version 300 es
precision highp float;

layout(location = 0) in vec2 a_index;
layout(location = 1) in float a_corner; // -1.0 or +1.0
layout(location = 2) in float a_segment; // 0.0 = prev, 1.0 = curr

uniform float u_maxDistance;
uniform float u_halfWidth;

uniform sampler2D u_data_0;
uniform sampler2D u_data_1;
uniform sampler2D u_data_2;
uniform sampler2D u_data_3;
uniform sampler2D u_data_4;


uniform float u_size;

out float v_visible;
out float v_fade;

void main() {
  vec2 texCoord = (a_index + 0.5) / u_size;
  int segment_i = int(a_segment);

  int segment_index = int(a_segment) / 2;// 0, 1, 2, 3 (0 is current and bottom if particle is moving down)
  bool top_or_bottom = segment_i % 2 == 0;// 0 if curr (bottom), 1 if prev (top)

  vec2 prev = vec2(0.0);// xy position of the previous segment
  vec2 curr = vec2(0.0);// xy position of the current segment

  if (segment_index == 0) {
    curr = texture(u_data_0, texCoord).xy;
    prev = texture(u_data_1, texCoord).xy;
  } else if (segment_index == 1) {
    curr = texture(u_data_1, texCoord).xy;
    prev = texture(u_data_2, texCoord).xy;
  } else if (segment_index == 2) {
    curr = texture(u_data_2, texCoord).xy;
    prev = texture(u_data_3, texCoord).xy;
  } else if (segment_index == 3) {
    curr = texture(u_data_3, texCoord).xy;
    prev = texture(u_data_4, texCoord).xy;
  }

  vec2 dir = curr - prev;

  float len2 = dot(dir, dir);

  float maxLen2 = u_maxDistance * u_maxDistance;

  v_visible = 1.0;
  if (len2 > maxLen2 || len2 == 0.0) {
    v_fade = 1.0;
    v_visible = 0.0;
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }

  // // Fade based on distance (0 = bright, maxLen = faint)
  // float fade = clamp(length(dir) / u_maxDistance, 0.0, 1.0);
  // v_fade = 1.0 - fade;
  v_fade = 1.0;// try fade later

  vec2 center = top_or_bottom ? curr : prev;
  vec2 normal = normalize(vec2(-dir.y, dir.x));
  vec2 offset = normal * a_corner * u_halfWidth;

  vec2 pos = center + offset;
  
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
