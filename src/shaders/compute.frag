#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 outColor;

uniform sampler2D u_data;
uniform sampler2D u_distanceMap;
uniform sampler2D u_dirXMap;
uniform sampler2D u_dirYMap;
uniform sampler2D u_sideMask;

uniform float u_particleTextureSize;
uniform float u_canvasSize;
uniform float u_spawnYMargin;
uniform float u_particle_radius;
uniform float u_repulse_particle_radius;

uniform float rock_x;
uniform float rock_y;
uniform float rock_w;
uniform float rock_h;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 readParticle(ivec2 index) {
  vec2 uv = (vec2(index) + 0.5) / u_particleTextureSize;
  return texture(u_data, uv);
}

float lengthSquared(vec2 v) {
  return dot(v, v);
}

vec4 getSideMask(ivec2 index) {
  vec2 uv = (vec2(index) + 0.5) / u_particleTextureSize;
  return texture(u_sideMask, uv);
}

void main() {

  // Compute own index from UV
  
  ivec2 fragIndex = ivec2(floor(v_uv * u_particleTextureSize));
  vec4 self = readParticle(fragIndex);

  vec2 pos = self.xy;
  vec2 vel = self.zw;
  
  // === SCALE TO IMAGE SIZE

  pos.x *= u_canvasSize;
  pos.y *= u_canvasSize;

  // === GRAVITY ===

  vec2 gravity = vec2(0.0, -0.8);
  // vec2 gravity = vec2(0.0, -0.2);
  vel += gravity;

  float maxSpeed = 20.0;
  if (length(vel) > maxSpeed) {
    vel = normalize(vel) * maxSpeed;
  }

  // === ROCK BOUNDING BOX ===

  float dist = 0.0;
  vec2 dir = vec2(0.0);

  // TODO: Add particle radius to collision detection

  vec2 scaled_rock_pos = pos;
  scaled_rock_pos.x = (scaled_rock_pos.x - rock_x) / rock_w;
  scaled_rock_pos.y = (scaled_rock_pos.y - rock_y) / rock_h;

  bool isInsideRock = (scaled_rock_pos.x >= 0.0 && scaled_rock_pos.x <= 1.0
                       && scaled_rock_pos.y >= 0.0 && scaled_rock_pos.y <= 1.0);
  
  if (isInsideRock) {
    dist = texture(u_distanceMap, scaled_rock_pos).r;
    dir.x = texture(u_dirXMap, scaled_rock_pos).r;
    dir.y = texture(u_dirYMap, scaled_rock_pos).r;

    dir.x *= rock_w;
    dir.y *= rock_h;
      
    // === COLLISION WITH BLACK SHAPE ===

    vec2 normal = normalize(dir);

    if (dist < 0.0 && length(normal) > 0.0) {
      // Reflect velocity to bounce
      vel = reflect(vel, normal);

      dist = length(dir);

      // Push particle just outside the surface to avoid sticking
      float pushOutDist = 0.002 - dist; // 0.002 is a small epsilon
      pos -= normal * pushOutDist;
    }

  }

  // === COLLISION AVOIDANCE ===

  float repulse_force = 0.5;
  float particle_radius = u_particle_radius;
  float repulse_particle_radius = u_repulse_particle_radius;
  float particle_radius_squared = particle_radius * particle_radius;
  float repulse_particle_radius_squared = repulse_particle_radius * repulse_particle_radius;
  vec2 repulse = vec2(0.0);

  vec4 sideMask = getSideMask(fragIndex);
  
  float cell_x = sideMask.r;
  float cell_y = sideMask.g;
  float left_right_mark = sideMask.b;
  float up_down_mark = sideMask.a;

  bool isOnLeftSide = left_right_mark < 0.25;
  bool isOnRightSide = left_right_mark > 0.75;
  bool isOnTopSide = up_down_mark < 0.25;
  bool isOnBottomSide = up_down_mark > 0.75;

  int grid_width = (int(u_canvasSize) / int(repulse_particle_radius));
  int grid_height = (int(u_canvasSize) / int(repulse_particle_radius));

  for (int y = 0; y < int(u_particleTextureSize); y++) {
    for (int x = 0; x < int(u_particleTextureSize); x++) {

      if (x == fragIndex.x && y == fragIndex.y) continue;

      vec4 other = readParticle(ivec2(x, y));

      vec2 other_pos = other.xy;

      other_pos.x *= u_canvasSize;
      other_pos.y *= u_canvasSize;

      vec4 otherSideMask = getSideMask(ivec2(x, y));

      float other_cell_x = otherSideMask.r;
      float other_cell_y = otherSideMask.g;

      float cell_dist_x = abs(cell_x - other_cell_x);
      float cell_dist_y = abs(cell_y - other_cell_y);
      
      if (cell_dist_x > 2.5 && cell_dist_x < float(grid_width) - 2.5) {
        continue;
      }
      if (cell_dist_y > 2.5 && cell_dist_y < float(grid_height) - 2.5) {
        continue;
      }

      float other_left_right_mark = otherSideMask.b;
      float other_up_down_mark = otherSideMask.a;

      bool other_isOnLeftSide = other_left_right_mark < 0.25;
      bool other_isOnRightSide = other_left_right_mark > 0.75;
      bool other_isOnTopSide = other_up_down_mark < 0.25;
      bool other_isOnBottomSide = other_up_down_mark > 0.75;

      vec2 delta = pos - other_pos;
      
      if (abs(delta.x) < repulse_particle_radius || abs(delta.y) < repulse_particle_radius) {
        // Check if the distance is less than the repulse_particle_radius
        float d_squared = lengthSquared(delta);
        if (d_squared > 0.0 && d_squared < repulse_particle_radius_squared) {
          float d = sqrt(d_squared);
          repulse += normalize(delta) * (repulse_particle_radius - d) * repulse_force;
        }
      }

      // check if is on the left side of the screen
      if (other_isOnLeftSide && isOnRightSide) {
        // check for wrapped particles on the right side of the screen
        vec2 wrapped_pos = other_pos + vec2(u_canvasSize, 0.0);
        vec2 delta = pos - wrapped_pos;
        if (abs(delta.x) < repulse_particle_radius || abs(delta.y) < repulse_particle_radius) {
          // Check if the distance is less than the repulse_particle_radius
          float d_squared = lengthSquared(delta);
          if (d_squared > 0.0 && d_squared < repulse_particle_radius_squared) {
            float d = sqrt(d_squared);
            repulse += normalize(delta) * (repulse_particle_radius - d) * repulse_force;
          }
        }
      }

      // check if is on the right side of the screen
      if (other_isOnRightSide && isOnLeftSide) {
        // check for wrapped particles on the left side of the screen
        vec2 wrapped_pos = other_pos - vec2(u_canvasSize, 0.0);
        vec2 delta = pos - wrapped_pos;
        if (abs(delta.x) < repulse_particle_radius || abs(delta.y) < repulse_particle_radius) {
          // Check if the distance is less than the repulse_particle_radius
          float d_squared = lengthSquared(delta);
          if (d_squared > 0.0 && d_squared < repulse_particle_radius_squared) {
            float d = sqrt(d_squared);
            repulse += normalize(delta) * (repulse_particle_radius - d) * repulse_force;
          }
        }
      }

      // // check if is on the top side of the screen
      // if (other_isOnTopSide && isOnBottomSide) {
      //   // check for wrapped particles on the bottom side of the screen
      //   vec2 wrapped_pos = other_pos - vec2(0.0, u_canvasSize);
      //   vec2 delta = pos - wrapped_pos;
      //   if (abs(delta.x) < repulse_particle_radius || abs(delta.y) < repulse_particle_radius) {
      //     // Check if the distance is less than the repulse_particle_radius
      //     float d_squared = lengthSquared(delta);
      //     if (d_squared > 0.0 && d_squared < repulse_particle_radius_squared) {
      //       float d = sqrt(d_squared);
      //       repulse += normalize(delta) * (repulse_particle_radius - d) * repulse_force;
      //     }
      //   }
      // }
      
      // // check if is on the bottom side of the screen
      // if (other_isOnBottomSide && isOnTopSide) {
      //   // check for wrapped particles on the top side of the screen
      //   vec2 wrapped_pos = other_pos + vec2(0.0, u_canvasSize);
      //   vec2 delta = pos - wrapped_pos;
      //   if (abs(delta.x) < repulse_particle_radius || abs(delta.y) < repulse_particle_radius) {
      //     // Check if the distance is less than the repulse_particle_radius
      //     float d_squared = lengthSquared(delta);
      //     if (d_squared > 0.0 && d_squared < repulse_particle_radius_squared) {
      //       float d = sqrt(d_squared);
      //       repulse += normalize(delta) * (repulse_particle_radius - d) * repulse_force;
      //     }
      //   }
      // }

    }
  }

  vel += repulse;

  // === DAMPING ===

  vel *= 0.9;

  // === POSITION INTEGRATION ===

  pos += vel;

  // === BOUNDING BOX ===
  
  pos.x = mod(mod(pos.x, u_canvasSize) + u_canvasSize, u_canvasSize);
  // pos.y = mod(mod(pos.y, u_canvasSize) + u_canvasSize, u_canvasSize);

  if (pos.y < -u_spawnYMargin * u_canvasSize) {
    pos.y = float(u_canvasSize) * 1.25;
    // set pos x to a random value between 0 and canvas size
    pos.x = rand(vec2(pos.x, pos.y)) * u_canvasSize;
  }

  // === SCALE BACK TO 0 - 1

  pos.x /= u_canvasSize;
  pos.y /= u_canvasSize;

  outColor = vec4(pos, vel);
  
}
