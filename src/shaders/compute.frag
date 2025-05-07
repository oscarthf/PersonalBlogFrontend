#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 outColor;

uniform sampler2D u_data;
uniform sampler2D u_distanceMap;
uniform sampler2D u_dirXMap;
uniform sampler2D u_dirYMap;

uniform float u_textureSize;

uniform float rock_x;
uniform float rock_y;
uniform float rock_w;
uniform float rock_h;

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

  // === ROCK BOUNDING BOX ===
  
  float dist = 0.0;
  vec2 dir = vec2(0.0);

  vec2 scaled_rock_pos = pos;
  scaled_rock_pos.x = (scaled_rock_pos.x - rock_x) / rock_w;
  scaled_rock_pos.y = (scaled_rock_pos.y - rock_y) / rock_h;

  if (scaled_rock_pos.x >= 0.0 && scaled_rock_pos.x <= 1.0 && scaled_rock_pos.y >= 0.0 && scaled_rock_pos.y <= 1.0) {
    dist = texture(u_distanceMap, scaled_rock_pos).r;
    dir.x = texture(u_dirXMap, scaled_rock_pos).r;
    dir.y = texture(u_dirYMap, scaled_rock_pos).r;
  }

  // // === FIELD FORCE ===
  // bool isBlack = dist < 0.0;

  // vec2 normal = normalize(dir);

  // if (isBlack && length(normal) > 0.0) {
  //   // Reflect the velocity if inside the shape (i.e., collision)
  //   vel = reflect(vel, normal);

  //   // Optional: move it just outside to prevent sticking
  //   pos += normal * (0.002 - dist); // Small nudge out of shape
  // }

  // === COLLISION WITH BLACK SHAPE ===
  vec2 normal = normalize(dir);

  if (dist < 0.0 && length(normal) > 0.0) {
    // Reflect velocity to bounce
    vel = reflect(vel, normal);

    // Push particle just outside the surface to avoid sticking
    float pushOutDist = 0.002 - dist; // 0.002 is a small epsilon
    pos += normal * pushOutDist;
  }

  // // === COLLISION AVOIDANCE ===
  // float repulse_force = 0.1;
  // float radius = 0.2;
  // vec2 repulse = vec2(0.0);

  // for (int y = 0; y < int(u_textureSize); y++) {
  //   for (int x = 0; x < int(u_textureSize); x++) {
  //     if (x == fragIndex.x && y == fragIndex.y) continue;

  //     vec4 other = readParticle(ivec2(x, y));
  //     vec2 delta = pos - other.xy;
  //     float d = length(delta);
  //     if (d > 0.0 && d < radius) {
  //       repulse += normalize(delta) * (radius - d) * repulse_force;
  //     }
  //   }
  // }

  // vel += repulse * 0.01;

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
