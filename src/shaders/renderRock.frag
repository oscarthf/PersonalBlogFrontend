#version 300 es
precision highp float;

in vec2 v_uv;
in float v_animationFrame;
in float v_animationType;

uniform sampler2D u_imageTexture;
uniform sampler2D u_distanceField;

out vec4 outColor;

uniform vec3 u_rockColor;
uniform float u_rockFloatingOffset;

void main() {
  
  vec4 color = texture(u_imageTexture, v_uv);
  
  if (v_animationType == 0) {

    float distance = texture(u_distanceField, v_uv).r;

    distance = distance * 2.0 - 1.0;

    if (distance < v_animationFrame + u_rockFloatingOffset) {
      color = vec4(0.0, 0.0, 0.0, 0.0);
    }

  }

  outColor = color;

}
