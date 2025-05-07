#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D u_data;
in vec2 v_uv;

void main() {
  vec4 data = texture(u_data, v_uv);
  vec2 pos = data.xy;
  vec2 vel = data.zw;

  pos += vel;

  if (pos.x < 0.0 || pos.x > 1.0) vel.x *= -1.0;
  if (pos.y < 0.0 || pos.y > 1.0) vel.y *= -1.0;
  pos = clamp(pos, 0.0, 1.0);

  outColor = vec4(pos, vel);
}
