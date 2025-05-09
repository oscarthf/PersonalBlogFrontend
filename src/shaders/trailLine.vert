#version 300 es
precision highp float;

layout(location = 0) in vec2 a_index;
layout(location = 1) in float a_corner; // -1.0 or +1.0
layout(location = 2) in float a_segment; // 0.0 = prev, 1.0 = curr

uniform float u_maxDistance;
uniform float u_fadeDistance;
uniform float u_halfWidth;

uniform sampler2D u_data_0;
uniform sampler2D u_data_1;
uniform sampler2D u_data_2;
uniform sampler2D u_data_3;
uniform sampler2D u_data_4;
uniform sampler2D u_data_5;
uniform sampler2D u_data_6;
uniform sampler2D u_data_7;
uniform sampler2D u_data_8;
uniform sampler2D u_data_9;
uniform sampler2D u_data_10;
uniform sampler2D u_data_11;
uniform sampler2D u_data_12;
uniform sampler2D u_data_13;
uniform sampler2D u_data_14;
uniform sampler2D u_data_15;

uniform float u_size;

out float v_visible;
out float v_fade;

void main() {
  vec2 texCoord = (a_index + 0.5) / u_size;
  int segment_i = int(a_segment);

  int segment_index = int(a_segment) / 2;// 0, 1, 2, 3 (0 is current and bottom if particle is moving down)
  bool top_or_bottom = segment_i % 2 == 0;// 0 if curr (bottom), 1 if prev (top)

  // vec2 prev = vec2(0.0);// xy position of the previous segment
  // vec2 curr = vec2(0.0);// xy position of the current segment

  vec4 prev_full = vec4(0.0);// xy position of the previous segment
  vec4 curr_full = vec4(0.0);// xy position of the current segment

  if (segment_index == 0) {
    curr_full = texture(u_data_0, texCoord);
    prev_full = texture(u_data_1, texCoord);
  } else if (segment_index == 1) {
    curr_full = texture(u_data_1, texCoord);
    prev_full = texture(u_data_2, texCoord);
  } else if (segment_index == 2) {
    curr_full = texture(u_data_2, texCoord);
    prev_full = texture(u_data_3, texCoord);
  } else if (segment_index == 3) {
    curr_full = texture(u_data_3, texCoord);
    prev_full = texture(u_data_4, texCoord);
  } else if (segment_index == 4) {
    curr_full = texture(u_data_4, texCoord);
    prev_full = texture(u_data_5, texCoord);
  } else if (segment_index == 5) {
    curr_full = texture(u_data_5, texCoord);
    prev_full = texture(u_data_6, texCoord);
  } else if (segment_index == 6) {
    curr_full = texture(u_data_6, texCoord);
    prev_full = texture(u_data_7, texCoord);
  } else if (segment_index == 7) {
    curr_full = texture(u_data_7, texCoord);
    prev_full = texture(u_data_8, texCoord);
  } else if (segment_index == 8) {
    curr_full = texture(u_data_8, texCoord);
    prev_full = texture(u_data_9, texCoord);
  } else if (segment_index == 9) {
    curr_full = texture(u_data_9, texCoord);
    prev_full = texture(u_data_10, texCoord);
  } else if (segment_index == 10) {
    curr_full = texture(u_data_10, texCoord);
    prev_full = texture(u_data_11, texCoord);
  } else if (segment_index == 11) {
    curr_full = texture(u_data_11, texCoord);
    prev_full = texture(u_data_12, texCoord);
  } else if (segment_index == 12) {
    curr_full = texture(u_data_12, texCoord);
    prev_full = texture(u_data_13, texCoord);
  } else if (segment_index == 13) {
    curr_full = texture(u_data_13, texCoord);
    prev_full = texture(u_data_14, texCoord);
  } else if (segment_index == 14) {
    curr_full = texture(u_data_14, texCoord);
    prev_full = texture(u_data_15, texCoord);
  } else {
    //
  }

  vec2 curr = curr_full.xy;
  vec2 prev = prev_full.xy;

  vec2 delta = curr - prev;
  // vec2 prev_dir = curr - prev;
  float delta_mag = length(delta);

  vec2 curr_dir = curr_full.zw * delta_mag;
  vec2 prev_dir = prev_full.zw * delta_mag;

  float len2 = dot(curr_dir, curr_dir);

  float maxLen2 = u_maxDistance * u_maxDistance;

  v_visible = 1.0;
  if (len2 > maxLen2 || len2 == 0.0) {
    v_fade = 1.0;
    v_visible = 0.0;
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }

  // float fade = a_segment / 32.0;
  // v_fade = 1.0 - fade;
  v_fade = 1.0;

  vec2 center = top_or_bottom ? prev : curr;
  vec2 normal_dir = top_or_bottom ? prev_dir : curr_dir;
  vec2 normal = normalize(vec2(-normal_dir.y, normal_dir.x));
  vec2 offset = normal * a_corner * u_halfWidth;

  vec2 pos = center + offset;
  
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
