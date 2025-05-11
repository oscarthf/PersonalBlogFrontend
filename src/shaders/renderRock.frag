#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_rockColor;
uniform sampler2D u_mask;

out vec4 outColor;

void main() {
  // float v = texture(u_mask, v_uv);
  // if (v > 0.5) {
  //   outColor = vec4(0.0, 0.0, 0.0, 0.0);
  // } else {
  //   outColor = vec4(v_rockColor, 1.0);
  // }
  outColor = texture(u_mask, v_uv);
}
