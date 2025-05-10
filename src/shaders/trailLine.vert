#version 300 es
precision highp float;

layout(location = 0) in vec2 a_index;
layout(location = 1) in float a_corner; // -1.0 or +1.0
layout(location = 2) in float a_segment; // 0.0 = prev, 1.0 = curr

uniform float u_maxDistance;
uniform int u_bezierResolution;
uniform float u_halfWidth;
uniform int u_frameNumber;
uniform int u_trailHistoryStepSize;
uniform int u_trailHistoryLength;

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
uniform sampler2D u_data_14;// Max for most graphics cards --- minus 1 for animation offsets

uniform sampler2D u_animationOffsets;

uniform float u_size;

out vec2 v_uv;
out vec4 v_animationOffsets;
out float v_animationLength;

vec2 bezier(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
  float u = 1.0 - t;
  return u * u * u * p0 + 3.0 * u * u * t * p1 + 3.0 * u * t * t * p2 + t * t * t * p3;
}

vec2 bezierDerivative(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
  float u = 1.0 - t;
  return -3.0 * u * u * p0 + 3.0 * (3.0 * u * u - 2.0 * u) * p1 + 3.0 * (2.0 * t - 3.0 * t * t) * p2 + 3.0 * t * t * p3;
}

void main() {

  vec2 texCoord = (a_index + 0.5) / u_size;

  v_animationOffsets = texture(u_animationOffsets, texCoord);

  int segment_i = int(a_segment);

  int segment_index_pre = int(a_segment) / 2;// 0, 1, 2, 3 (0 is current and bottom if particle is moving down)
  
  int bezierCurveLength = (u_bezierResolution - 1);
  int animationLength = u_trailHistoryLength * u_trailHistoryStepSize * bezierCurveLength;
  float animationLength_f = float(animationLength);
  v_animationLength = animationLength_f;

  int bezier_curve_index = segment_index_pre % bezierCurveLength;

  int segment_index = int(segment_index_pre / bezierCurveLength);

  bool top_or_bottom = segment_i % 2 == 1;// false if curr (bottom), true if prev (top)

  if (top_or_bottom) {
    bezier_curve_index = bezier_curve_index + 1;
  }

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

  if (len2 > maxLen2 || len2 == 0.0) {
    v_animationLength = 0.0;
    gl_Position = vec4(2.0, 2.0, 0.0, 0.0);
    return;
  }

  vec2 normalized_curr_dir = normalize(curr_dir);
  vec2 normalized_prev_dir = normalize(prev_dir);

  vec2 p0 = curr;
  vec2 p1 = curr - normalized_curr_dir * u_halfWidth;
  vec2 p2 = prev + normalized_prev_dir * u_halfWidth;
  vec2 p3 = prev;

  float t = float(bezier_curve_index) / float(bezierCurveLength);

  vec2 center = bezier(t, p0, p1, p2, p3);
  vec2 normal_dir = bezierDerivative(t, p0, p1, p2, p3);
  vec2 normal = normalize(vec2(-normal_dir.y, normal_dir.x));
  vec2 offset = normal * a_corner * u_halfWidth;

  vec2 pos = center + offset;

  int frameNumber = u_frameNumber % animationLength;

  v_uv.x = (((a_corner + 1.0) * 0.5) + float(frameNumber));
  float pre_y = top_or_bottom ? (float(segment_index) + 1.0) : float(segment_index);
  pre_y = pre_y * float(bezierCurveLength) + float(bezier_curve_index);
  v_uv.y = pre_y / animationLength_f;

  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
