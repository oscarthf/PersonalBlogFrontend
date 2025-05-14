#version 300 es
precision highp float;

in vec2 v_uv;
// in float v_animationFrame;
in float v_frameNumber;
in float v_animationType;

uniform sampler2D u_imageTexture;
uniform sampler2D u_distanceField;

out vec4 outColor;

uniform vec3 u_rockColor;
uniform float u_rockFloatingOffset;

float lengthSquared(vec2 v) {
  return dot(v, v);
}

void main() {
  
  vec4 color = texture(u_imageTexture, v_uv);

  int animationType = int(v_animationType);
  
  if (animationType == 0) {// water

    int animationLength = 32 * 24;

    float waterHeightDelta = 0.1;
    
    float animationFrame = mod(float(v_frameNumber), float(animationLength)) / float(animationLength);
    animationFrame = sin(animationFrame * 3.14159 * 2.0) * waterHeightDelta;

    float distance = texture(u_distanceField, v_uv).r;

    distance = distance * 2.0 - 1.0;

    if (distance < animationFrame + u_rockFloatingOffset) {
      color = vec4(0.0, 0.0, 0.0, 0.0);
    }

  } else if (animationType == 1) {// sun

  } else if (animationType == 2) { // moon

      int animationLength = 1024;
      float phase = mod(v_frameNumber, float(animationLength)) / float(animationLength);

      // Moon bounding box is from (0.25, 0.25) to (0.75, 0.75)
      vec2 moonCenter = vec2(0.5, 0.5);
      vec2 distanceFromCenter = v_uv - moonCenter;
      float radius = 0.25;

      float distanceFromCenterLengthSquared = lengthSquared(distanceFromCenter);
      if (distanceFromCenterLengthSquared > radius * radius) {
          discard; // Outside of moon
      }

      float z = sqrt(radius * radius - distanceFromCenterLengthSquared);
      vec3 normal = normalize(vec3(distanceFromCenter, z));

      float lightAngle = phase * 3.14159 * 2.0;
      vec3 lightDir = normalize(vec3(cos(lightAngle), 0.0, sin(lightAngle)));

      float lighting = dot(normal, lightDir);

      if (lighting < 0.0) {
          discard;
      }

  }


  outColor = color;

}
