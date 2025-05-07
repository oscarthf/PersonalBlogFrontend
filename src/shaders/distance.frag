#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_source;
uniform int u_radius;
uniform vec2 u_resolution;

layout(location = 0) out float outDistance;
layout(location = 1) out float outDirX;
layout(location = 2) out float outDirY;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec2 origin = v_uv;
  float minDist = 1e10;
  vec2 bestOffset = vec2(0.0);
  bool centerPixelWasBlack = false;

  float center = texture(u_source, origin).r;
  if (center < 0.5) {
    centerPixelWasBlack = true;
  }

  for (int dy = -u_radius; dy <= u_radius; dy++) {
    for (int dx = -u_radius; dx <= u_radius; dx++) {
      if (dx == 0 && dy == 0) {
        continue; // Skip the center pixel
      }
      // Sample the texture at the offset position
      vec2 offset = vec2(float(dx), float(dy)) * texelSize;
      vec2 sampleUV = origin + offset;
      if (any(lessThan(sampleUV, vec2(0.0))) || 
          any(greaterThan(sampleUV, vec2(1.0)))) {
        continue; // Skip pixels outside the texture bounds
      }
      float currentDistance = length(vec2(float(dx), float(dy)));
      if (currentDistance > float(u_radius)) {
        continue; // Skip pixels outside the force radius
      }
      float pixel = texture(u_source, sampleUV).r;
      bool samplePixelIsBlack = pixel < 0.5;
      if ((centerPixelWasBlack && !samplePixelIsBlack) || 
          (!centerPixelWasBlack && samplePixelIsBlack)) {
        float dist = length(offset);
        if (dist < minDist) {
          minDist = dist;
          bestOffset = offset;
        }
      }
    }
  }

  if (centerPixelWasBlack) {
    minDist = -minDist;
  }

  outDistance = minDist;
  outDirX = bestOffset.x;
  outDirY = bestOffset.y;
}
