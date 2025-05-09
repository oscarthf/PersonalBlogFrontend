#version 300 es
precision highp float;

layout(location = 0) in vec2 a_index;
layout(location = 1) in float a_corner; // -1.0 or +1.0
layout(location = 2) in float a_segment; // 0.0 = prev, 1.0 = curr

uniform float u_maxDistance;
uniform float u_halfWidth;
uniform sampler2D u_prevData;
uniform sampler2D u_currData;
uniform float u_size;

out float v_visible;
out float v_fade;

void main() {
  vec2 texCoord = (a_index + 0.5) / u_size;
  vec2 prev = texture(u_prevData, texCoord).xy;
  vec2 curr = texture(u_currData, texCoord).xy;

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

  // Fade based on distance (0 = bright, maxLen = faint)
  float fade = clamp(length(dir) / u_maxDistance, 0.0, 1.0);
  v_fade = 1.0 - fade;

  vec2 center = mix(prev, curr, a_segment);
  vec2 normal = normalize(vec2(-dir.y, dir.x));
  vec2 offset = normal * a_corner * u_halfWidth;

  vec2 pos = center + offset;
  
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
