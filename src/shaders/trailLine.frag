#version 300 es
precision highp float;

in vec4 v_animationOffsets;
in vec2 v_uv;
in float v_animationLength;
out vec4 outColor;

void main() {
  float red = 0.333;
  float green = 0.667;
  float blue = 1.0;
  float v_fade = 1.0 - v_uv.y;

  if (v_animationLength < 0.5) {
    discard;
  }

  // v_uv.x is betwween frameIndex and frameIndex + 1
  float frameNumber = floor(v_uv.x);

  float x = (v_uv.x - frameNumber) * 2.0 - 1.0; // x is between -1 and 1
  float original_y = v_uv.y;// y is between 0 and 1

  float y_offset = frameNumber / v_animationLength + v_animationOffsets.x;
  float y = original_y - y_offset;

  float tao = 3.14159 * 2.0;

  float ripple_width = 0.7;
  float ripple_magnitude = 0.3;
  float left_phase_offset = 3.4321;

  float ripple_left = sin(y * tao + left_phase_offset) * ripple_magnitude - ripple_width; // left side of the ripple
  float ripple_right = sin(y * tao) * ripple_magnitude + ripple_width; // right side of the ripple

  float diminishment = (1.0 - original_y);

  ripple_left *= diminishment;
  ripple_right *= diminishment;

  if (x < ripple_left || x > ripple_right) {
    discard;
  }

  if (v_fade < 0.5) {
    red = 1.0;
    green = 0.0;
    blue = 0.0;
    v_fade = 1.0;
  }

  outColor = vec4(red, green, blue, v_fade);
}
