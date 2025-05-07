#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 outColor;

uniform sampler2D u_data;
uniform sampler2D u_distanceMap;
uniform sampler2D u_dirXMap;
uniform sampler2D u_dirYMap;

uniform float u_textureSize;

vec4 readParticle(ivec2 index) {
  vec2 uv = (vec2(index) + 0.5) / u_textureSize;
  return texture(u_data, uv);
}

void main() {
  // Compute own index from UV
  ivec2 fragIndex = ivec2(v_uv * u_textureSize);
  vec2 fragUV = (vec2(fragIndex) + 0.5) / u_textureSize;

  vec4 self = texture(u_data, fragUV);
  vec2 pos = self.xy;
  vec2 vel = self.zw;

  float maxSpeed = 0.05;
  if (length(vel) > maxSpeed) {
    vel = normalize(vel) * maxSpeed;
  }

  // === FIELD FORCE ===
  float dist = texture(u_distanceMap, pos).r;
  bool isBlack = false;
  if (dist < 0.0) {
    isBlack = true;
  }

  vec2 dir = vec2(
    texture(u_dirXMap, pos).r,
    texture(u_dirYMap, pos).r
  );

  // Pull toward/away from black area
  vec2 force = vec2(0.0);
  if (length(dir) > 0.0 && dist != 0.0) {
    if (isBlack) {
      force = normalize(dir) * exp(dist * 20.0);
    } else {
      force = -normalize(dir) * exp(-dist * 20.0);
    }
  }

  vel += force * 0.01;

  // === COLLISION AVOIDANCE ===
  float repulse_force = 0.1;
  float radius = 0.2;
  vec2 repulse = vec2(0.0);

  for (int y = 0; y < int(u_textureSize); y++) {
    for (int x = 0; x < int(u_textureSize); x++) {
      if (x == fragIndex.x && y == fragIndex.y) continue;

      vec4 other = readParticle(ivec2(x, y));
      vec2 delta = pos - other.xy;
      float d = length(delta);
      if (d > 0.0 && d < radius) {
        repulse += normalize(delta) * (radius - d) * repulse_force;
      }
    }
  }

  vel += repulse * 0.01;

  // === VELOCITY LIMIT / DAMPING ===
  float speed = length(vel);
  if (speed > 0.02) {
    // vel *= 0.98;
    vel *= 0.1;
  }

  // === POSITION INTEGRATION ===
  pos += vel;

  // Bounce off canvas borders
  if (pos.x < 0.0 || pos.x > 1.0) {
    vel.x *= -1.0;
    pos.x = clamp(pos.x, 0.0, 1.0);
  }

  if (pos.y < 0.0 || pos.y > 1.0) {
    vel.y *= -1.0;
    pos.y = clamp(pos.y, 0.0, 1.0);
  }

  if (!all(lessThan(abs(pos), vec2(1000.0))) || !all(lessThan(abs(vel), vec2(1000.0)))) {
    pos = vec2(0.5);
    vel = vec2(0.0);
  }

  outColor = vec4(pos, vel);
}
