#version 300 es
precision highp float;

in vec2 v_uv;
in float v_animationFrame;

uniform sampler2D u_imageTexture;
uniform sampler2D u_distanceField;

out vec4 outColor;

uniform vec3 u_rockColor;
uniform int u_animationType;
uniform float u_rockFloatingOffset;

void main() {
  // float v = texture(u_imageTexture, v_uv);
  // if (v > 0.5) {
  //   outColor = vec4(0.0, 0.0, 0.0, 0.0);
  // } else {
  //   outColor = vec4(u, 1.0);
  // }
  
  vec4 color = texture(u_imageTexture, v_uv);
  
  if (u_animationType == 0) {

    float distance = texture(u_distanceField, v_uv).r;

    distance = distance * 2.0 - 1.0;
    // distance *= 256.0;

    if (distance < u_animationFrame + u_rockFloatingOffset) {
    // if (distance < 0.5) {
      color = vec4(0.0, 0.0, 0.0, 0.0);
    }

  }

  outColor = color;

}
