#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_rockColor;
in float v_animationFrame;
in float v_animationType;
in float v_rockFloatingOffset;

uniform sampler2D u_imageTexture;
uniform sampler2D u_distanceField;

out vec4 outColor;

void main() {
  // float v = texture(u_imageTexture, v_uv);
  // if (v > 0.5) {
  //   outColor = vec4(0.0, 0.0, 0.0, 0.0);
  // } else {
  //   outColor = vec4(v_rockColor, 1.0);
  // }
  
  vec4 color = texture(u_imageTexture, v_uv);
  
  if (v_animationType == 0.0) {

    float distance = texture(u_distanceField, v_uv).r;

    distance = distance * 2.0 - 1.0;
    // distance *= 256.0;

    if (distance < v_animationFrame + v_rockFloatingOffset) {
    // if (distance < 0.5) {
      color = vec4(0.0, 0.0, 0.0, 0.0);
    }

  }

  outColor = color;

}
