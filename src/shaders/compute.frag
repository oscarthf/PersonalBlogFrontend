#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 outColor;

uniform sampler2D u_data;
uniform sampler2D u_distanceMap;
uniform sampler2D u_dirXMap;
uniform sampler2D u_dirYMap;
uniform sampler2D u_sideMask;

uniform float u_textureSize;

uniform float rock_x;
uniform float rock_y;
uniform float rock_w;
uniform float rock_h;

vec4 readParticle(ivec2 index) {
  vec2 uv = (vec2(index) + 0.5) / u_textureSize;
  return texture(u_data, uv);
}

float lengthSquared(vec2 v) {
  return dot(v, v);
}

vec4 getSideMask(ivec2 index) {
  vec2 uv = (vec2(index) + 0.5) / u_textureSize;
  return texture(u_sideMask, uv);
}

void main() {

  // Compute own index from UV
  
  ivec2 fragIndex = ivec2(v_uv * u_textureSize);
  vec2 fragUV = (vec2(fragIndex) + 0.5) / u_textureSize;

  vec4 self = texture(u_data, fragUV);
  vec2 pos = self.xy;
  vec2 vel = self.zw;

  // === GRAVITY ===

  vec2 gravity = vec2(0.0, -0.001);
  vel += gravity;

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

  bool isInsideRock = (scaled_rock_pos.x >= 0.0 && scaled_rock_pos.x <= 1.0
                       && scaled_rock_pos.y >= 0.0 && scaled_rock_pos.y <= 1.0);
  
  if (isInsideRock) {
    dist = texture(u_distanceMap, scaled_rock_pos).r;
    dir.x = texture(u_dirXMap, scaled_rock_pos).r;
    dir.y = texture(u_dirYMap, scaled_rock_pos).r;
      
    // === COLLISION WITH BLACK SHAPE ===

    vec2 normal = normalize(dir);

    if (dist < 0.0 && length(normal) > 0.0) {
      // Reflect velocity to bounce
      vel = reflect(vel, normal);

      // Push particle just outside the surface to avoid sticking
      float pushOutDist = 0.002 - dist; // 0.002 is a small epsilon
      pos += normal * pushOutDist;
    }

  }

  // === COLLISION AVOIDANCE ===

  float repulse_force = 0.01;
  float radius = 0.2;
  float radius_squared = radius * radius;
  vec2 repulse = vec2(0.0);

  vec4 sideMask = texture(u_sideMask, fragUV);
  bool isOnLeftSide = sideMask.r > 0.5;
  bool isOnRightSide = sideMask.g > 0.5;
  bool isOnTopSide = sideMask.b > 0.5;
  bool isOnBottomSide = sideMask.a > 0.5;

  for (int y = 0; y < int(u_textureSize); y++) {
    for (int x = 0; x < int(u_textureSize); x++) {

      if (x == fragIndex.x && y == fragIndex.y) continue;

      vec4 other = readParticle(ivec2(x, y));

      vec2 other_pos = other.xy;

      vec4 otherSideMask = getSideMask(ivec2(x, y));
      bool other_isOnLeftSide = otherSideMask.r > 0.5;
      bool other_isOnRightSide = otherSideMask.g > 0.5;
      bool other_isOnTopSide = otherSideMask.b > 0.5;
      bool other_isOnBottomSide = otherSideMask.a > 0.5;

      vec2 delta = pos - other_pos;
      
      if (abs(delta.x) < radius || abs(delta.y) < radius) {
        // Check if the distance is less than the radius
        float d_squared = lengthSquared(delta);
        if (d_squared > 0.0 && d_squared < radius_squared) {
          float d = sqrt(d_squared);
          repulse += normalize(delta) * (radius - d) * repulse_force;
        }
      }

      // check if is on the left side of the screen
      if (other_isOnLeftSide && isOnRightSide) {
        // check for wrapped particles on the right side of the screen
        vec2 wrapped_pos = other_pos + vec2(1.0, 0.0);
        vec2 delta = pos - wrapped_pos;
        if (abs(delta.x) < radius || abs(delta.y) < radius) {
          // Check if the distance is less than the radius
          float d_squared = lengthSquared(delta);
          if (d_squared > 0.0 && d_squared < radius_squared) {
            float d = sqrt(d_squared);
            repulse += normalize(delta) * (radius - d) * repulse_force;
          }
        }
      }

      // check if is on the right side of the screen
      if (other_isOnRightSide && isOnLeftSide) {
        // check for wrapped particles on the left side of the screen
        vec2 wrapped_pos = other_pos - vec2(1.0, 0.0);
        vec2 delta = pos - wrapped_pos;
        if (abs(delta.x) < radius || abs(delta.y) < radius) {
          // Check if the distance is less than the radius
          float d_squared = lengthSquared(delta);
          if (d_squared > 0.0 && d_squared < radius_squared) {
            float d = sqrt(d_squared);
            repulse += normalize(delta) * (radius - d) * repulse_force;
          }
        }
      }

      // check if is on the top side of the screen
      if (other_isOnTopSide && isOnBottomSide) {
        // check for wrapped particles on the bottom side of the screen
        vec2 wrapped_pos = other_pos - vec2(0.0, 1.0);
        vec2 delta = pos - wrapped_pos;
        if (abs(delta.x) < radius || abs(delta.y) < radius) {
          // Check if the distance is less than the radius
          float d_squared = lengthSquared(delta);
          if (d_squared > 0.0 && d_squared < radius_squared) {
            float d = sqrt(d_squared);
            repulse += normalize(delta) * (radius - d) * repulse_force;
          }
        }
      }
      
      // check if is on the bottom side of the screen
      if (other_isOnBottomSide && isOnTopSide) {
        // check for wrapped particles on the top side of the screen
        vec2 wrapped_pos = other_pos + vec2(0.0, 1.0);
        vec2 delta = pos - wrapped_pos;
        if (abs(delta.x) < radius || abs(delta.y) < radius) {
          // Check if the distance is less than the radius
          float d_squared = lengthSquared(delta);
          if (d_squared > 0.0 && d_squared < radius_squared) {
            float d = sqrt(d_squared);
            repulse += normalize(delta) * (radius - d) * repulse_force;
          }
        }
      }

    }
  }

  vel += repulse * 0.01;

  // === DAMPING ===

  vel *= 0.95;

  // === POSITION INTEGRATION ===

  pos += vel;

  // === BOUNDING BOX ===

  // Wrap around the screen

  if (pos.x < 0.0) {
    pos.x += 1.0;
  }

  if (pos.x > 1.0) {
    pos.x -= 1.0;
  }

  if (pos.y < 0.0) {
    pos.y += 1.0;
  }

  if (pos.y > 1.0) {
    pos.y -= 1.0;
  }

  if (!all(lessThan(abs(pos), vec2(1000.0))) || !all(lessThan(abs(vel), vec2(1000.0)))) {
    pos = vec2(0.5);
    vel = vec2(0.0);
  }

  outColor = vec4(pos, vel);
}
