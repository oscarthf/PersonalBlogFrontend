#version 300 es
precision highp float;

layout(location = 0) in vec2 a_index;

uniform sampler2D u_prevData;
uniform sampler2D u_currData;
uniform float u_size;
uniform float u_maxDistance;

out float v_visible;

void main() {
  // One line per particle = 2 vertices
  int lineIndex = gl_VertexID / 2;
  bool isStart = (gl_VertexID % 2 == 0);

  // Reconstruct texcoord
  vec2 texCoord = (a_index + 0.5) / u_size;

  vec2 prev = texture(u_prevData, texCoord).xy;
  vec2 curr = texture(u_currData, texCoord).xy;

  vec2 d = curr - prev;
  float dist2 = dot(d, d);
  float maxDist2 = u_maxDistance * u_maxDistance;

  // default to visible
  v_visible = 1.0;

  if (d.y > 0.0 || dist2 > maxDist2) {
    v_visible = 0.0; // pass to fragment
  }

  vec2 pos = isStart ? prev : curr;
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
