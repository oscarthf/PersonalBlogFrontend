#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 outColor;

uniform sampler2D u_data;
uniform sampler2D u_preparedParticleCellData;

// up to 4 "rocks"

uniform sampler2D u_rockDistanceField_0;
uniform sampler2D u_rockDirXMap_0;
uniform sampler2D u_rockDirYMap_0;

uniform sampler2D u_rockDistanceField_1;
uniform sampler2D u_rockDirXMap_1;
uniform sampler2D u_rockDirYMap_1;

uniform sampler2D u_rockDistanceField_2;
uniform sampler2D u_rockDirXMap_2;
uniform sampler2D u_rockDirYMap_2;

uniform sampler2D u_rockDistanceField_3;
uniform sampler2D u_rockDirXMap_3;
uniform sampler2D u_rockDirYMap_3;

//

uniform float u_gravity;
uniform float u_friction;
uniform float u_repulse_force;
uniform float u_particleTextureSize;
// uniform float u_canvasSizeWidth;
// uniform float u_canvasSizeHeight;
uniform float u_height_over_width;
uniform float u_spawnXMargin;
uniform float u_spawnYMargin;
uniform float u_repulse_particle_radius;

// up to 4 "rocks"

uniform float u_rock_x_0;
uniform float u_rock_y_0;
uniform float u_rock_width_0;
uniform float u_rock_height_0;
uniform float u_rockFloatingOffset_0;

uniform float u_rock_x_1;
uniform float u_rock_y_1;
uniform float u_rock_width_1;
uniform float u_rock_height_1;
uniform float u_rockFloatingOffset_1;


uniform float u_rock_x_2;
uniform float u_rock_y_2;
uniform float u_rock_width_2;
uniform float u_rock_height_2;
uniform float u_rockFloatingOffset_2;

uniform float u_rock_x_3;
uniform float u_rock_y_3;
uniform float u_rock_width_3;
uniform float u_rock_height_3;
uniform float u_rockFloatingOffset_3;

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

vec4 getPreparedParticleCellData(ivec2 index) {
  vec2 uv = (vec2(index) + 0.5) / u_particleTextureSize;
  return texture(u_preparedParticleCellData, uv);
}

void main() {

  float repulse_force = u_repulse_force;

  ivec2 fragIndex = ivec2(floor(v_uv * u_particleTextureSize));
  vec4 self = readParticle(fragIndex);

  vec2 pos = self.xy;
  vec2 vel = self.zw;

  // === SCALE TO IMAGE SIZE

  // pos.x *= u_canvasSizeWidth;
  // pos.y *= u_canvasSizeWidth;
  // vel.x *= u_canvasSizeWidth;
  // vel.y *= u_canvasSizeWidth;

  // === GRAVITY ===

  vec2 gravity = vec2(0.0, -u_gravity);
  vel += gravity;

  float maxSpeed = 20.0;
  if (length(vel) > maxSpeed) {
    vel = normalize(vel) * maxSpeed;
  }

  // === ROCK BOUNDING BOX ===

  for (int rock_i = 0; rock_i < 4; rock_i++) {

    float dist = 0.0;
    vec2 normal = vec2(0.0);

    float rock_x = 0.0;
    float rock_y = 0.0;
    float rock_width = 0.0;
    float rock_height = 0.0;
    float rock_floating_offset = 0.0;

    if (rock_i == 0) {
      rock_x = u_rock_x_0;
      rock_y = u_rock_y_0;
      rock_width = u_rock_width_0;
      rock_height = u_rock_height_0;
      rock_floating_offset = u_rockFloatingOffset_0;
    } else if (rock_i == 1) {
      rock_x = u_rock_x_1;
      rock_y = u_rock_y_1;
      rock_width = u_rock_width_1;
      rock_height = u_rock_height_1;
      rock_floating_offset = u_rockFloatingOffset_1;
    } else if (rock_i == 2) {
      rock_x = u_rock_x_2;
      rock_y = u_rock_y_2;
      rock_width = u_rock_width_2;
      rock_height = u_rock_height_2;
      rock_floating_offset = u_rockFloatingOffset_2;
    } else if (rock_i == 3) {
      rock_x = u_rock_x_3;
      rock_y = u_rock_y_3;
      rock_width = u_rock_width_3;
      rock_height = u_rock_height_3;
      rock_floating_offset = u_rockFloatingOffset_3;
    }

    if (rock_width == 0.0 || rock_height == 0.0 || rock_floating_offset == 1.0) {
      continue;
    }

    vec2 scaled_rock_pos = vec2(
      (pos.x - rock_x) / rock_width,
      (pos.y - rock_y) / rock_height
    );

    bool isInsideRock = (scaled_rock_pos.x >= 0.25 && scaled_rock_pos.x <= 0.75// assume padding is 25%, image is square
                        && scaled_rock_pos.y >= 0.25 && scaled_rock_pos.y <= 0.75);
    
    // bool isInsideRock = (scaled_rock_pos.x >= 0.0 && scaled_rock_pos.x <= 1.0// assume padding is 25%, image is square
    //                     && scaled_rock_pos.y >= 0.0 && scaled_rock_pos.y <= 1.0);
    
    if (isInsideRock) {

      if (rock_i == 0) {
        dist = texture(u_rockDistanceField_0, scaled_rock_pos).r;
        normal.x = texture(u_rockDirXMap_0, scaled_rock_pos).r;
        normal.y = texture(u_rockDirYMap_0, scaled_rock_pos).r;
      } else if (rock_i == 1) {
        dist = texture(u_rockDistanceField_1, scaled_rock_pos).r;
        normal.x = texture(u_rockDirXMap_1, scaled_rock_pos).r;
        normal.y = texture(u_rockDirYMap_1, scaled_rock_pos).r;
      } else if (rock_i == 2) {
        dist = texture(u_rockDistanceField_2, scaled_rock_pos).r;
        normal.x = texture(u_rockDirXMap_2, scaled_rock_pos).r;
        normal.y = texture(u_rockDirYMap_2, scaled_rock_pos).r;
      } else if (rock_i == 3) {
        dist = texture(u_rockDistanceField_3, scaled_rock_pos).r;
        normal.x = texture(u_rockDirXMap_3, scaled_rock_pos).r;
        normal.y = texture(u_rockDirYMap_3, scaled_rock_pos).r;
      }

      // === COLLISION WITH ROCK ===

      dist = dist * 2.0 - 1.0;
      normal = normal * 2.0 - 1.0;
      dist *= rock_width;

      // if (dist < particle_radius && dist != 0.0) {
      if (dist > 0.0) {

        vel = reflect(vel, normal);
        pos += normal * dist;
        break;

      }

    }

  }

  // === COLLISION AVOIDANCE ===

  float repulse_particle_radius = u_repulse_particle_radius;
  float repulse_particle_radius_squared = repulse_particle_radius * repulse_particle_radius;
  vec2 repulse = vec2(0.0);

  vec4 preparedParticleCellData = getPreparedParticleCellData(fragIndex);
  
  float cell_x = preparedParticleCellData.r;
  float cell_y = preparedParticleCellData.g;
  float left_right_mark = preparedParticleCellData.b;
  float up_down_mark = preparedParticleCellData.a;

  bool isOnLeftSide = left_right_mark < 0.25;
  bool isOnRightSide = left_right_mark > 0.75;
  bool isOnTopSide = up_down_mark < 0.25;
  bool isOnBottomSide = up_down_mark > 0.75;

  // int grid_width = (int(u_canvasSizeWidth) / int(repulse_particle_radius));
  // int grid_height = (int(u_canvasSizeHeight) / int(repulse_particle_radius));

  int grid_width = int(1.0 / repulse_particle_radius);
  int grid_height = int(u_height_over_width / repulse_particle_radius);

  for (int y = 0; y < int(u_particleTextureSize); y++) {
    for (int x = 0; x < int(u_particleTextureSize); x++) {

      if (x == fragIndex.x && y == fragIndex.y) continue;

      vec4 other = readParticle(ivec2(x, y));

      vec2 other_pos = other.xy;

      // other_pos.x *= u_canvasSizeWidth;
      // other_pos.y *= u_canvasSizeWidth;

      vec4 otherPreparedParticleCellData = getPreparedParticleCellData(ivec2(x, y));

      float other_cell_x = otherPreparedParticleCellData.r;
      float other_cell_y = otherPreparedParticleCellData.g;

      float cell_dist_x = abs(cell_x - other_cell_x);
      float cell_dist_y = abs(cell_y - other_cell_y);
      
      if (cell_dist_x > 2.5 && cell_dist_x < float(grid_width) - 2.5) {
        continue;
      }
      if (cell_dist_y > 2.5 && cell_dist_y < float(grid_height) - 2.5) {
        continue;
      }

      float other_left_right_mark = otherPreparedParticleCellData.b;
      float other_up_down_mark = otherPreparedParticleCellData.a;

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
        // vec2 wrapped_pos = other_pos + vec2(u_canvasSizeWidth, 0.0);
        vec2 wrapped_pos = other_pos + vec2(1.0, 0.0);
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
        // vec2 wrapped_pos = other_pos - vec2(u_canvasSizeWidth, 0.0);
        vec2 wrapped_pos = other_pos - vec2(1.0, 0.0);
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

      if (u_gravity == 0.0) {
        // check if is on the top side of the screen
        if (other_isOnTopSide && isOnBottomSide) {
          // check for wrapped particles on the bottom side of the screen
          // vec2 wrapped_pos = other_pos - vec2(0.0, u_canvasSizeHeight);
          vec2 wrapped_pos = other_pos - vec2(0.0, u_height_over_width);
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
        
        // check if is on the bottom side of the screen
        if (other_isOnBottomSide && isOnTopSide) {
          // check for wrapped particles on the top side of the screen
          // vec2 wrapped_pos = other_pos + vec2(0.0, u_canvasSizeHeight);
          vec2 wrapped_pos = other_pos + vec2(0.0, u_height_over_width);
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
      }
    }
  }

  vel += repulse;

  // === DAMPING ===

  vel *= u_friction;

  // === POSITION INTEGRATION ===

  pos += vel;

  // // === SCALE BACK TO 0 - 1

  // pos.x /= u_canvasSizeWidth;
  // pos.y /= u_canvasSizeWidth;
  // vel.x /= u_canvasSizeWidth;
  // vel.y /= u_canvasSizeWidth;

  // === BOUNDING BOX ===

  if (pos.x < -u_spawnXMargin) {
    pos.x = (1.0 + u_spawnXMargin);
    if (u_gravity != 0.0) {
      pos.y = rand(vec2(pos.x, pos.y));
    }
  } else if (pos.x > (1.0 + u_spawnXMargin)) {
    pos.x = -u_spawnXMargin;
    if (u_gravity != 0.0) {
      pos.y = rand(vec2(pos.x, pos.y));
    }
  }

  if (pos.y < -u_spawnYMargin) {
    pos.y = (u_height_over_width + u_spawnYMargin);
    if (u_gravity != 0.0) {
      pos.x = rand(vec2(pos.x, pos.y));
    }
  } else if (pos.y > (u_height_over_width + u_spawnYMargin)) {
    pos.y = -u_spawnYMargin;
    if (u_gravity != 0.0) {
      pos.x = rand(vec2(pos.x, pos.y));
    }
  }

  outColor = vec4(pos, vel);
  
}
