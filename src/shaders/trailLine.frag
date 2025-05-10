#version 300 es
precision highp float;

in vec2 v_uv;
in float v_numFrames;
in float v_trailHistoryStepSize;
out vec4 outColor;


void main() {
  float red = 1.0;
  float green = 1.0;
  float blue = 1.0;
  float v_fade = 1.0 - v_uv.y;

  // v_uv.x is betwween frameIndex and frameIndex + 1
  float frameIndex = floor(v_uv.x);

  float x = (v_uv.x - frameIndex) * 2.0 - 1.0; // x is between -1 and 1
  float y = v_uv.y * 2.0 - 1.0; // y is between -1 and 1

  float y_offset = frameIndex / v_numFrames / 16.0;
  // float y_offset = frameIndex;
  // float y_offset = frameIndex / v_numFrames;
  y += y_offset;

  float ripple_left = sin(y * 3.14159 + 4.531) * 0.3 - 0.7; // left side of the ripple
  float ripple_right = sin(y * 3.14159) * 0.3 + 0.7; // right side of the ripple

  if (x < ripple_left || x > ripple_right) {
    v_fade = 0.0; // if outside the ripple, fade out
  }

  outColor = vec4(red, green, blue, v_fade);
}
