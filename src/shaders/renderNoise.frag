#version 300 es
precision highp float;

// float snoise(vec3 v) has been inserted here

in vec2 v_uv;

out vec4 outColor;

uniform vec3 u_backgroundColor;
uniform float u_height_over_width;
uniform int u_frameNumber;
uniform float u_gravity;

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

float lengthSquared(vec2 v) {
  return dot(v, v);
}

void main() {

    vec2 rock_offset = vec2(0.0, 0.0);

    vec2 adjusted_uv = vec2(
        v_uv.x, 
        v_uv.y * u_height_over_width
    );

    for (int i = 0; i < 4; i++) {

        float rock_x = 0.0;
        float rock_y = 0.0;
        float rock_width = 0.0;
        float rock_height = 0.0;

        float rockFloatingOffset = 0.0;

        if (i == 0) {
            rock_x = u_rock_x_0;
            rock_y = u_rock_y_0;
            rock_width = u_rock_width_0;
            rock_height = u_rock_height_0;
            rockFloatingOffset = u_rockFloatingOffset_0;
        } else if (i == 1) {
            rock_x = u_rock_x_1;
            rock_y = u_rock_y_1;
            rock_width = u_rock_width_1;
            rock_height = u_rock_height_1;
            rockFloatingOffset = u_rockFloatingOffset_1;
        } else if (i == 2) {
            rock_x = u_rock_x_2;
            rock_y = u_rock_y_2;
            rock_width = u_rock_width_2;
            rock_height = u_rock_height_2;
            rockFloatingOffset = u_rockFloatingOffset_2;
        } else if (i == 3) {
            rock_x = u_rock_x_3;
            rock_y = u_rock_y_3;
            rock_width = u_rock_width_3;
            rock_height = u_rock_height_3;
            rockFloatingOffset = u_rockFloatingOffset_3;
        }

        if (rock_width == 0.0 || rock_height == 0.0 || rockFloatingOffset == 1.0) {
            continue;
        }

        vec2 rock_size = vec2(rock_width, rock_height);
        vec2 rock_size_half = rock_size * 0.5;
        vec2 rock_position = vec2(rock_x, rock_y) + rock_size_half;

        vec2 rock_delta = adjusted_uv - rock_position;

        float distance2 = lengthSquared(rock_delta);
        float distance = sqrt(distance2);
        float force_amount = 1.0 / distance2;

        vec2 rock_delta_normalized = rock_delta / distance;

        rock_offset += rock_delta_normalized * force_amount * 0.001 * (1.0 - rockFloatingOffset);
        
    }

    adjusted_uv += rock_offset;

    //

    float frameNumber = float(u_frameNumber);

    float zPosition = frameNumber * 0.002;

    frameNumber = frameNumber * u_gravity * 0.001;

    float resoultion = 10.0;
    vec2 p_xy = (adjusted_uv / resoultion) * 2.0 - 1.0;
    vec3 p = vec3(p_xy, 0.0);

    vec3 samplePoint_0 = p;
    samplePoint_0.y += frameNumber;
    samplePoint_0.z += zPosition;
    float noiseAmount_0 = snoise(samplePoint_0 * 4.0);
    noiseAmount_0 = 0.3 * noiseAmount_0 + 0.7;

    vec3 samplePoint_1 = p * 2.0 + 4023.0;
    samplePoint_1.y += frameNumber;
    samplePoint_0.z += zPosition;
    float noiseAmount_1 = snoise(samplePoint_1 * 4.0);
    noiseAmount_1 = 0.3 * noiseAmount_1 + 0.7;

    vec3 samplePoint_2 = p * 4.0 + 9471.0;
    samplePoint_2.y += frameNumber;
    samplePoint_0.z += zPosition;
    float noiseAmount_2 = snoise(samplePoint_2 * 4.0);
    noiseAmount_2 = 0.3 * noiseAmount_2 + 0.7;

    float noiseAmount = noiseAmount_2 * 0.2 + noiseAmount_1 * 0.3 + noiseAmount_0 * 0.5;

    outColor = vec4(u_backgroundColor * noiseAmount, 1.0);

}
