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
  float minDist = 1e10;
  vec2 bestOffset = vec2(0.0);

  float center = texture(u_source, v_uv).a;
  bool centerPixelWasTransparent = center < 0.5;

  float min_x_float = -u_radius * texelSize.x + v_uv.x;
  float min_y_float = -u_radius * texelSize.y + v_uv.y;
  float max_x_float = u_radius * texelSize.x + v_uv.x;
  float max_y_float = u_radius * texelSize.y + v_uv.y;
  if (min_x_float < 0.0) {
    min_x_float = 0.0;
  }
  if (min_y_float < 0.0) {
    min_y_float = 0.0;
  }
  if (max_x_float > 1.0) {
    max_x_float = 1.0;
  }
  if (max_y_float > 1.0) {
    max_y_float = 1.0;
  }
  int min_x = int((min_x_float - v_uv.x) * u_resolution.x);
  int min_y = int((min_y_float - v_uv.y) * u_resolution.y);
  int max_x = int((max_x_float - v_uv.x) * u_resolution.x);
  int max_y = int((max_y_float - v_uv.y) * u_resolution.y);

  for (int dy = min_y; dy < max_y; dy++) {
    for (int dx = min_x; dx < max_x; dx++) {
      if (dx == 0 && dy == 0) {
        continue;// Skip the center pixel
      }
      vec2 offsetPixels = vec2(float(dx), float(dy));

      float currentDistance = length(offsetPixels);
      if (currentDistance > u_radius) {
        continue; // Skip pixels outside the force radius
      }

      vec2 offset = offsetPixels * texelSize;

      vec2 sampleUV = v_uv + offset;

      float pixel = texture(u_source, sampleUV).a;

      bool samplePixelIsTransparent = pixel < 0.5;

      if ((centerPixelWasTransparent && !samplePixelIsTransparent) || 
          (!centerPixelWasTransparent && samplePixelIsTransparent)) {

        float dist = length(offset);// assume square pixels
        if (dist < minDist) {
          minDist = dist;
          bestOffset = offset;
        }

      }
    }
  }

  if (centerPixelWasTransparent) {
    minDist = -minDist;
  }

  minDist = (minDist + 1.0) / 2.0;
  if (minDist > 1.0) {
    minDist = 1.0;
  } else if (minDist < 0.0) {
    minDist = 0.0;
  }

  bestOffset = normalize(bestOffset);
  bestOffset.x = (bestOffset.x + 1.0) / 2.0;
  bestOffset.y = (bestOffset.y + 1.0) / 2.0;
  
  outDistance = minDist;
  outDirX = bestOffset.x;
  outDirY = bestOffset.y;

}
