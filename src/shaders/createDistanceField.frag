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
  bool centerPixelWasBlack = true;

  float center = texture(u_source, origin).a;
  if (center < 0.5) {
    centerPixelWasBlack = false;
  }

  float min_x_float = -float(u_radius) * texelSize.x + origin.x;
  float min_y_float = -float(u_radius) * texelSize.y + origin.y;
  float max_x_float = float(u_radius) * texelSize.x + origin.x;
  float max_y_float = float(u_radius) * texelSize.y + origin.y;
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
  int min_x = int(min_x_float / texelSize.x);
  int min_y = int(min_y_float / texelSize.y);
  int max_x = int(max_x_float / texelSize.x);
  int max_y = int(max_y_float / texelSize.y);

  for (int dy = min_y; dy < max_y; dy++) {
    for (int dx = min_x; dx < max_x; dx++) {
      if (dx == 0 && dy == 0) {
        continue;// Skip the center pixel
      }
      vec2 offset = vec2(float(dx), float(dy)) * texelSize;
      vec2 sampleUV = origin + offset;
      float currentDistance = length(vec2(float(dx), float(dy)));
      if (currentDistance > float(u_radius)) {
        continue; // Skip pixels outside the force radius
      }
      float pixel = texture(u_source, sampleUV).a;
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
