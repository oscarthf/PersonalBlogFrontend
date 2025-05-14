#version 300 es
precision highp float;

// float snoise(vec2 v) has been inserted here

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

void main() {

    float frameNumber = float(u_frameNumber);

    frameNumber = frameNumber * u_gravity * 0.01;

    vec2 resoultion = vec2(10.0, 10.0 / u_height_over_width);
    vec2 p = (v_uv.xy / resoultion) * 2.0 - 1.0;

    vec3 samplePoint_0 = vec3(p, 0);
    samplePoint_0.y += frameNumber;
    float noiseAmount_0 = snoise(samplePoint_0.xy * 4.0);
    noiseAmount_0 = 0.3 * noiseAmount_0 + 0.7;

    vec3 samplePoint_1 = vec3(p, 0) * 2.0 + 4023.0;
    samplePoint_1.y += frameNumber;
    float noiseAmount_1 = snoise(samplePoint_1.xy * 4.0);
    noiseAmount_1 = 0.3 * noiseAmount_1 + 0.7;

    vec3 samplePoint_2 = vec3(p, 0) * 4.0 + 9471.0;
    samplePoint_2.y += frameNumber;
    float noiseAmount_2 = snoise(samplePoint_2.xy * 4.0);
    noiseAmount_2 = 0.3 * noiseAmount_2 + 0.7;

    float noiseAmount = noiseAmount_2 * 0.2 + noiseAmount_1 * 0.3 + noiseAmount_0 * 0.5;

    outColor = vec4(u_backgroundColor * noiseAmount, 1.0);

}
