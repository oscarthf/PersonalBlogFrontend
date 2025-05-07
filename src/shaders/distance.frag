#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_source;
uniform float u_radius;
uniform vec2 u_resolution;

layout(location = 0) out float outDistance;
layout(location = 1) out float outDirX;
layout(location = 2) out float outDirY;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec2 origin = v_uv;
  float minDist = 1e10;
  vec2 bestOffset = vec2(0.0);

  float center = texture(u_source, origin).r;
  if (center < 0.5) {
    outDistance = 0.0;
    outDirX = 0.0;
    outDirY = 0.0;
    return;
  }

  for (int dy = -30; dy <= 30; dy++) {
    for (int dx = -30; dx <= 30; dx++) {
      vec2 offset = vec2(float(dx), float(dy)) * texelSize;
      vec2 sampleUV = origin + offset;
      if (any(lessThan(sampleUV, vec2(0.0))) || any(greaterThan(sampleUV, vec2(1.0)))) continue;
      float pixel = texture(u_source, sampleUV).r;
      if (pixel < 0.5) {
        float dist = length(offset);
        if (dist < minDist) {
          minDist = dist;
          bestOffset = offset;
        }
      }
    }
  }

  outDistance = minDist;
  outDirX = bestOffset.x;
  outDirY = bestOffset.y;
}
