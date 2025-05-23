import { useEffect, useRef } from "react";

import distanceFieldFS from "../../shaders/createDistanceField.frag?raw";
import noiseShaderFunctions from "../../shaders/noise.frag?raw";
import renderNoiseFS from "../../shaders/renderNoise.frag?raw";
import fullscreenVS from "../../shaders/fullscreen.vert?raw";
import physicsFS from "../../shaders/physics.frag?raw";
import renderParticlesVS from "../../shaders/renderParticles.vert?raw";
import renderParticlesFS from "../../shaders/renderParticles.frag?raw";
import renderRockVS from "../../shaders/renderRock.vert?raw";
import renderRockFS from "../../shaders/renderRock.frag?raw";
import preProcessParticlesFS from "../../shaders/preProcessParticles.frag?raw";
import trailLineVS from "../../shaders/trailLine.vert?raw";
import trailLineFS from "../../shaders/trailLine.frag?raw";
import trailDisplayVS from "../../shaders/trailDisplay.vert?raw";
import trailDisplayFS from "../../shaders/trailDisplay.frag?raw";
import { 
  getMousePos,
  getTouchPos,
  createProgram, 
  createTextureFromImageOrSize,
  createFramebufferForSingleChannelTextures, 
  createInitialParticleData, 
  createAnimationOffsetsData,
  loadSpriteImage, 
  createTrailIndicesAndCorners, 
  createParticleIndices, 
  createParticleVertices 
} from "../../util/webgl/general";

// const MAX_WINDOW_DIMENSION = 640;
const MAX_WINDOW_DIMENSION = 320;
// const MAX_WINDOW_DIMENSION = 128;
// const MAX_WINDOW_DIMENSION = 64;

const NUM_PARTICLE_FRAMES = 8;

const MAX_FRAME_CYCLE_LENGTH = 60 * 60 * 60 * 24; // 6 hours at 60 FPS

const BEZIER_CURVE_RESOLUTION = 4;

const loadImage = (src: string) => new Promise<HTMLImageElement> ((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.src = src;
});

interface BackgroundAnimationProps {
  gl: WebGL2RenderingContext;
  animationType: number;
  trailHistoryLength: number;
  trailHistoryStepSize: number;
  particleRadius: number;
  rockImageSources: string[];
  // rockDistanceFields: WebGLTexture[];
  windowWidth: number;
  windowHeight: number;
  particleSpawnXMargin: number;
  particleSpawnYMargin: number;
  repulse_force: number;
  friction: number;
  gravity: number;
  particleCount: number;
  particleImageSource: string;
  backgroundColor: number[];
  rockColor: number[];
  rockXPositionsPre: number[];
  rockYPositionsPre: number[];
  rockWidthsPre: number[];
  rockHeightsPre: number[];
  // rockDirXMaps: WebGLTexture[];
  // rockDirYMaps: WebGLTexture[];
  // rockImageTextures: WebGLTexture[];
  particleColor: number[];
  trailLineColor: number[];
  repulse_particle_radius: number;
}

export default function BackgroundAnimation({
  gl,
  animationType,
  trailHistoryLength,
  trailHistoryStepSize,
  particleRadius,
  rockImageSources,
  // rockDistanceFields,
  windowWidth,
  windowHeight,
  particleSpawnXMargin,
  particleSpawnYMargin,
  repulse_force,
  friction,
  gravity,
  particleCount,
  particleImageSource,
  backgroundColor,
  rockColor,
  rockXPositionsPre,
  rockYPositionsPre,
  rockWidthsPre,
  rockHeightsPre,
  // rockDirXMaps,
  // rockDirYMaps,
  // rockImageTextures,
  particleColor,
  trailLineColor,
  repulse_particle_radius,
}: BackgroundAnimationProps) {

  let didCreatePrograms = false;
  let spriteReady = false;
  const rockSpritesReady = [];

  let distanceFieldProgram: WebGLProgram | null = null;
  let physicsProgram: WebGLProgram | null = null;
  let renderParticlesProgram: WebGLProgram | null = null;
  let renderRockProgram: WebGLProgram | null = null;
  let preProcessParticlesProgram: WebGLProgram | null = null;
  let trailLineProgram: WebGLProgram | null = null;
  let trailDisplayProgram: WebGLProgram | null = null;
  let renderNoiseProgram: WebGLProgram | null = null;

  let trailVAO: WebGLVertexArrayObject | null = null;
  let trailTex: WebGLTexture | null = null;
  let trailFB: WebGLFramebuffer | null = null;

  let preparedParticleCellDataTex: WebGLTexture | null = null;
  let preparedParticleCellDataFB: WebGLFramebuffer | null = null;

  let indexBuffer: WebGLBuffer | null = null;

  let quadVBO: WebGLBuffer | null = null;
  let spriteVAO: WebGLVertexArrayObject | null = null;

  let animationOffsetsTex: WebGLTexture | null = null;
  let readWriteTexList: WebGLTexture[] = [];
  let readWriteFBList: WebGLFramebuffer[] = [];

  let fullscreenVAO: WebGLVertexArrayObject | null = null;
  let fullscreenVBO: WebGLBuffer | null = null;

  let spriteTex: WebGLTexture | null = null;

  /////////////////////

  // rock positions and heights are entered as if height and width are 1.0
  // resize so that they are in the range of 1.0 and (height / width)

  const rockXPositions = [];
  const rockYPositions = [];
  const rockWidths = [];
  const rockHeights = [];

  const rockDraggings = []
  const rockOffsets = []

  const rockAnimationOffsets = [];
  const rockFloatingOffsets = [];
  const rockIsFloatings = [];
  
  const rockImageTextures = [];
  const rockDistanceFields = [];
  const rockDirXMaps = [];
  const rockDirYMaps = [];

  /////////

  let lastTime = performance.now();
  let frames = 0;
  let frameNumber = 0;
  let fps = 0;

  let currentReadIndex = 0;
  let currentWriteIndex = 1;

  ////////////////////////////////

  const canvas = gl.canvas as HTMLCanvasElement;

  canvas.style.width = `${windowWidth}px`;
  canvas.style.height = `${windowHeight}px`;

  const realTrailHistoryLength = (trailHistoryLength + 1) * trailHistoryStepSize;

  const particleTextureSize = Math.sqrt(particleCount);

  let lastFrameTime = 0;
  const targetFPS = 60;
  const frameDuration = 1000 / targetFPS;

  let canvasSizeWidth = windowWidth;
  let canvasSizeHeight = windowHeight;

  if (windowWidth > windowHeight) {
    const resizeFactor = MAX_WINDOW_DIMENSION / windowWidth;
    canvasSizeWidth = MAX_WINDOW_DIMENSION;
    canvasSizeHeight = windowHeight * resizeFactor;
  } else {
    const resizeFactor = MAX_WINDOW_DIMENSION / windowHeight;
    canvasSizeWidth = windowWidth * resizeFactor;
    canvasSizeHeight = MAX_WINDOW_DIMENSION;
  }

  let heightOverWidth = canvasSizeHeight / canvasSizeWidth;

  let animationFrameId: number;

  const isRunningRef = useRef(true);

  for (let rock_i = 0; rock_i < rockImageSources.length; rock_i++) {

    rockSpritesReady.push(false);
    rockImageTextures.push(null);
    rockDistanceFields.push(null);
    rockDirXMaps.push(null);
    rockDirYMaps.push(null);
    const animationOffset = Math.floor(Math.random() * MAX_FRAME_CYCLE_LENGTH);
    rockAnimationOffsets.push(animationOffset);
    rockFloatingOffsets.push(0);
    rockIsFloatings.push(true);

    let rockWidth = rockWidthsPre[rock_i];
    let rockHeight = rockHeightsPre[rock_i];

    if (windowWidth > windowHeight) {
      // make them smaller because they are scaled with the width of the canvas
      rockWidth *= 0.5;
      rockHeight *= 0.5;
    }

    const rockX = rockXPositionsPre[rock_i] - (rockWidth / 2.0);
    const rockY = (rockYPositionsPre[rock_i] - (rockHeight / 2.0)) * heightOverWidth;

    rockXPositions.push(rockX);
    rockYPositions.push(rockY);
    rockWidths.push(rockWidth);
    rockHeights.push(rockHeight);

    rockDraggings.push({ 
      current: false,
      hasMoved: false,
      clickX: 0,
      clickY: 0,
    });

    rockOffsets.push({ x: 0, y: 0 });

  }


  useEffect(() => {

    if (!gl) return;

    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.error("EXT_color_buffer_float not supported");
      return;
    }



    ////

    isRunningRef.current = false;

    function clearRockDraggings() {
      for (let i = 0; i < rockDraggings.length; i++) {
        rockDraggings[i].current = false;
        rockDraggings[i].hasMoved = false;
        rockDraggings[i].clickX = 0;
        rockDraggings[i].clickY = 0;
        rockOffsets[i].x = 0;
        rockOffsets[i].y = 0;
      }
    }

    function getRandomRockIndex() {
      // Check all isFloating
      let allRocksAreFloating = true;
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (!rockIsFloatings[i]) {
          allRocksAreFloating = false;
          break;
        }
      }

      if (allRocksAreFloating) {
        return -1;
      }

      // Check all which are not floating
      const notFloatingRocks = [];
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (!rockIsFloatings[i]) {
          notFloatingRocks.push(i);
        }
      }
      const randomInnerIndex = Math.floor(Math.random() * notFloatingRocks.length);

      const randomIndex = notFloatingRocks[randomInnerIndex];
      return randomIndex;
    }

    function checkRockClick(clickX: number, clickY: number) {

      console.log("checkRockClick");

      let clickedRockIndex = -1;
      for (let i = 0; i < rockImageTextures.length; i++) {
        const rock_x = rockXPositions[i];
        const rock_y = rockYPositions[i];
        const rock_width = rockWidths[i];
        const rock_height = rockHeights[i];
        const rock_center_x = rock_x + rock_width / 2;
        const rock_center_y = rock_y + rock_height / 2;
        const rock_radius = Math.max(rock_width, rock_height) / 4;
        const dx = clickX - rock_center_x;
        const dy = clickY - rock_center_y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (
          distance < rock_radius
        ) {
          clickedRockIndex = i;
          break;
        }
      }

      const rockIsFloating = rockIsFloatings[clickedRockIndex];

      if (!rockIsFloating) {
        // user doesnt see it
        clickedRockIndex = -1;
      }
      
      if (clickedRockIndex !== -1) {
        console.log("clicked rock", clickedRockIndex);
        // clicked a rock (which is floating)
        if (rockDraggings[clickedRockIndex].hasMoved) {
          // user moved the rock
          console.log("user moved the rock");
          return;
        }
        rockIsFloatings[clickedRockIndex] = false;
      } else {
        console.log("clicked empty space");
        // did not click a rock
        const randomRockIndex = getRandomRockIndex();// Tries to find a rock which is not floating, if none is found, it will return -1
        if (randomRockIndex === -1) {
          console.log("No rocks available to click");
          return;
        }
        const newRockX = clickX - rockWidths[randomRockIndex] / 2;
        const newRockY = clickY - rockHeights[randomRockIndex] / 2;
        rockXPositions[randomRockIndex] = newRockX;
        rockYPositions[randomRockIndex] = newRockY;
        rockIsFloatings[randomRockIndex] = true;
      }

    }

    function applyRockCollisions(rockIndex: number) {

      // Rock is a square image, centered at 0.5 * rock_width, 0.5 * rock_height
      // Rock radius is rock_width / 4

      let num_tries = 0;

      while (num_tries < 10) {
        num_tries++;

        let has_made_changes = false;

        for (let j = 0; j < rockImageTextures.length; j++) {

          const rock_width = rockWidths[j];
          const rock_height = rockHeights[j];
          const rock_x = rockXPositions[j] + rock_width / 2;
          const rock_y = rockYPositions[j] + rock_height / 2;

          const rock_radius = Math.max(rock_width, rock_height) / 4;

          for (let i = 0; i < rockImageTextures.length; i++) {
            if (i === j) continue;
            if (i === rockIndex) continue;

            const other_rock_width = rockWidths[i];
            const other_rock_height = rockHeights[i];
            const other_rock_x = rockXPositions[i] + other_rock_width / 2;
            const other_rock_y = rockYPositions[i] + other_rock_height / 2;

            const other_rock_radius = Math.max(other_rock_width, other_rock_height) / 4;
            
            const dx = other_rock_x - rock_x;
            const dy = other_rock_y - rock_y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const min_distance = rock_radius + other_rock_radius;

            if (distance < min_distance) {
              const overlap = min_distance - distance;
              const angle = Math.atan2(dy, dx);
              const offsetX = Math.cos(angle) * overlap * 1.1;
              const offsetY = Math.sin(angle) * overlap * 1.1;

              rockXPositions[i] += offsetX;
              rockYPositions[i] += offsetY;

              has_made_changes = true;
            }

          }
        
        }

        if (!has_made_changes) {
          break;
        }

      }

      console.log(`Rock ${rockIndex} collisions applied: ${num_tries}`);

    }

    function onMouseDown(evt: MouseEvent) {
      const { x, y } = getMousePos(canvas, evt, heightOverWidth);
      for (let i = 0; i < rockImageTextures.length; i++) {
        const rock_x = rockXPositions[i];
        const rock_y = rockYPositions[i];
        const rock_width = rockWidths[i];
        const rock_height = rockHeights[i];
        const rock_center_x = rock_x + rock_width / 2;
        const rock_center_y = rock_y + rock_height / 2;
        const rock_radius = Math.max(rock_width, rock_height) / 4;
        const dx = x - rock_center_x;
        const dy = y - rock_center_y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (
          distance < rock_radius
        ) {
          clearRockDraggings();
          rockDraggings[i].current = true;
          console.log("rockDraggings[i].current", rockDraggings[i].current);
          rockOffsets[i].x = x - rock_x;
          rockOffsets[i].y = y - rock_y;
          rockDraggings[i].clickX = x;
          rockDraggings[i].clickY = y;
          break;
        }
      }
    }

    function onMouseMove(evt: MouseEvent) {
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (rockDraggings[i].current) {
          rockDraggings[i].hasMoved = true;
          const { x, y } = getMousePos(canvas, evt, heightOverWidth);
          rockXPositions[i] = x - rockOffsets[i].x;
          rockYPositions[i] = y - rockOffsets[i].y;
          applyRockCollisions(i);
        }
      }
    }

    function onMouseUp(evt: MouseEvent) {
      const { x, y } = getMousePos(canvas, evt, heightOverWidth);
      checkRockClick(x, y);
      clearRockDraggings();
    }

    function onTouchStart(evt: TouchEvent) {
      evt.preventDefault(); // Prevent scrolling
      const { x, y } = getTouchPos(canvas, evt, heightOverWidth);
      for (let i = 0; i < rockImageTextures.length; i++) {
        const rock_x = rockXPositions[i];
        const rock_y = rockYPositions[i];
        const rock_width = rockWidths[i];
        const rock_height = rockHeights[i];
        const rock_center_x = rock_x + rock_width / 2;
        const rock_center_y = rock_y + rock_height / 2;
        const rock_radius = Math.max(rock_width, rock_height) / 4;
        const dx = x - rock_center_x;
        const dy = y - rock_center_y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (
          distance < rock_radius
        ) {
          clearRockDraggings();
          rockDraggings[i].current = true;
          console.log("rockDraggings[i].current", rockDraggings[i].current);
          rockOffsets[i].x = x - rock_x;
          rockOffsets[i].y = y - rock_y;
          rockDraggings[i].clickX = x;
          rockDraggings[i].clickY = y;
          break;
        }
      }
    }

    function onTouchMove(evt: TouchEvent) {
      evt.preventDefault();
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (rockDraggings[i].current) {
          rockDraggings[i].hasMoved = true;
          const { x, y } = getTouchPos(canvas, evt, heightOverWidth);
          rockXPositions[i] = x - rockOffsets[i].x;
          rockYPositions[i] = y - rockOffsets[i].y;
          applyRockCollisions(i);
        }
      }
    }

    function onTouchEnd(evt: TouchEvent) {
      const { x, y } = getTouchPos(canvas, evt, heightOverWidth);
      checkRockClick(x, y);
      clearRockDraggings();
    }

    // === WebGL Setup ===

    function preProcessParticles() {
      
      gl.useProgram(preProcessParticlesProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, preparedParticleCellDataFB);
      gl.viewport(0, 0, particleTextureSize, particleTextureSize);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentReadIndex]);
      gl.uniform1i(gl.getUniformLocation(preProcessParticlesProgram, "u_data"), 0);
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_repulse_particle_radius"), repulse_particle_radius);
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_particleTextureSize"), particleTextureSize);
      // gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_canvasSizeWidth"), canvasSizeWidth);
      // gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_canvasSizeHeight"), canvasSizeHeight);
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_height_over_width"), heightOverWidth);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    function stepRocksFloating() {
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (rockIsFloatings[i] && rockFloatingOffsets[i] > 0.0) {
          rockFloatingOffsets[i] -= 1 / 60;
          console.log(`turning on rockFloatingOffsets['${i}']: `, rockFloatingOffsets[i]);
          if (rockFloatingOffsets[i] < 0.0) {
            rockFloatingOffsets[i] = 0.0;
          }
        } else if (!rockIsFloatings[i] && rockFloatingOffsets[i] < 1.0) {
          rockFloatingOffsets[i] += 1 / 60;
          console.log(`turning off rockFloatingOffsets['${i}']: `, rockFloatingOffsets[i]);
          if (rockFloatingOffsets[i] > 1.0) {
            rockFloatingOffsets[i] = 1.0;
          }
        }
      }
    }

    function renderNoise() {

      gl.useProgram(renderNoiseProgram);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentReadIndex]);
      gl.uniform1i(gl.getUniformLocation(renderNoiseProgram, "u_data"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, preparedParticleCellDataTex);
      gl.uniform1i(gl.getUniformLocation(renderNoiseProgram, "u_preparedParticleCellData"), 1);

      for (let rock_i = 0; rock_i < rockImageTextures.length; rock_i++) {

        gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, `u_rock_x_${rock_i}`), rockXPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, `u_rock_y_${rock_i}`), rockYPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, `u_rock_width_${rock_i}`), rockWidths[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, `u_rock_height_${rock_i}`), rockHeights[rock_i]);

        gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, `u_rockFloatingOffset_${rock_i}`), rockFloatingOffsets[rock_i]);

      }

      gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, "u_repulse_particle_radius"), repulse_particle_radius);
      gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, "u_particleTextureSize"), particleTextureSize);
      gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, "u_gravity"), gravity);
      gl.uniform1i(gl.getUniformLocation(renderNoiseProgram, "u_frameNumber"), frameNumber % MAX_FRAME_CYCLE_LENGTH);
      gl.uniform1f(gl.getUniformLocation(renderNoiseProgram, "u_height_over_width"), heightOverWidth);
      gl.uniform3f(gl.getUniformLocation(renderNoiseProgram, "u_backgroundColor"), backgroundColor[0], backgroundColor[1], backgroundColor[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    function stepSimulation() {

      gl.useProgram(physicsProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, readWriteFBList[currentWriteIndex]);
      gl.viewport(0, 0, particleTextureSize, particleTextureSize);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentReadIndex]);
      gl.uniform1i(gl.getUniformLocation(physicsProgram, "u_data"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, preparedParticleCellDataTex);
      gl.uniform1i(gl.getUniformLocation(physicsProgram, "u_preparedParticleCellData"), 1);

      for (let rock_i = 0; rock_i < rockImageTextures.length; rock_i++) {

        const rockDistanceField = rockDistanceFields[rock_i];
        const rockDirXMap = rockDirXMaps[rock_i];
        const rockDirYMap = rockDirYMaps[rock_i];
        const rockImageTexture = rockImageTextures[rock_i];

        if (rockDistanceField == null || rockDirXMap == null || rockDirYMap == null || rockImageTexture == null) {
          continue;
        }
      
        gl.activeTexture(gl.TEXTURE2 + rock_i * 3);
        gl.bindTexture(gl.TEXTURE_2D, rockDistanceField);
        gl.uniform1i(gl.getUniformLocation(physicsProgram, `u_rockDistanceField_${rock_i}`), 2 + rock_i * 3);

        gl.activeTexture(gl.TEXTURE2 + rock_i * 3 + 1);
        gl.bindTexture(gl.TEXTURE_2D, rockDirXMap);
        gl.uniform1i(gl.getUniformLocation(physicsProgram, `u_rockDirXMap_${rock_i}`), 2 + rock_i * 3 + 1);

        gl.activeTexture(gl.TEXTURE2 + rock_i * 3 + 2);
        gl.bindTexture(gl.TEXTURE_2D, rockDirYMap);
        gl.uniform1i(gl.getUniformLocation(physicsProgram, `u_rockDirYMap_${rock_i}`), 2 + rock_i * 3 + 2);

        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_x_${rock_i}`), rockXPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_y_${rock_i}`), rockYPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_width_${rock_i}`), rockWidths[rock_i]);
        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_height_${rock_i}`), rockHeights[rock_i]);

        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rockFloatingOffset_${rock_i}`), rockFloatingOffsets[rock_i]);

      }

      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_repulse_particle_radius"), repulse_particle_radius);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_height_over_width"), heightOverWidth);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_spawnXMargin"), particleSpawnXMargin);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_spawnYMargin"), particleSpawnYMargin);
      // gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_canvasSizeWidth"), canvasSizeWidth);
      // gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_canvasSizeHeight"), canvasSizeHeight);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_particleTextureSize"), particleTextureSize);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_repulse_force"), repulse_force);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_friction"), friction);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_gravity"), gravity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    function drawTrailsToBuffer() {

      gl.useProgram(trailLineProgram);

      gl.bindFramebuffer(gl.FRAMEBUFFER, trailFB);

      gl.viewport(0, 0, canvasSizeWidth, canvasSizeHeight);

      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_frameNumber"), frameNumber % MAX_FRAME_CYCLE_LENGTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_trailHistoryLength"), trailHistoryLength);
      gl.uniform3f(gl.getUniformLocation(trailLineProgram, "u_trailLineColor"), trailLineColor[0], trailLineColor[1], trailLineColor[2]);
      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_bezier_remainder"), (currentWriteIndex % trailHistoryStepSize) / trailHistoryStepSize);
      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_height_over_width"), heightOverWidth);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_bezierResolution"), BEZIER_CURVE_RESOLUTION);
      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_particleRadius"), particleRadius / 2.0);
      
      ///////////

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, animationOffsetsTex);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_animationOffsets"), 0);

      // Just wrote onto currentWriteIndex, realWriteStartIndex makes sure intermediate control points stay in the same place
      const texIndexRemainder = currentWriteIndex % trailHistoryStepSize;
      const realWriteStartIndex = currentWriteIndex - texIndexRemainder + trailHistoryStepSize;
      for (let i = 0; i < trailHistoryLength; i++) {
        // TODO: reduce step size at low FPS!!!
        let texIndex = 0;
        if (i == 0) {
          texIndex = (currentWriteIndex + realTrailHistoryLength) % realTrailHistoryLength;
        } else if (i == trailHistoryLength - 1) {
          texIndex = (currentWriteIndex - i * trailHistoryStepSize + realTrailHistoryLength) % realTrailHistoryLength;
        } else {
          texIndex = (realWriteStartIndex - i * trailHistoryStepSize + realTrailHistoryLength) % realTrailHistoryLength;
        }

        gl.activeTexture(gl.TEXTURE1 + i);
        gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[texIndex]);
        gl.uniform1i(gl.getUniformLocation(trailLineProgram, `u_data_${i}`), i + 1);
      }

      ///////////

      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_size"), particleTextureSize);

      gl.bindVertexArray(trailVAO);
      
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.disable(gl.CULL_FACE);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.drawArrays(gl.TRIANGLES, 0, particleCount * (trailHistoryLength - 1) * 6 * (BEZIER_CURVE_RESOLUTION - 1));

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      gl.enable(gl.CULL_FACE);

    }

    function drawRock() {

      gl.useProgram(renderRockProgram);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      for (let rock_i = 0; rock_i < rockImageTextures.length; rock_i++) {

        const rockImageTexture = rockImageTextures[rock_i];
        const rockDirXMap = rockDirXMaps[rock_i];
        const rockDirYMap = rockDirYMaps[rock_i];
        const rockDistanceField = rockDistanceFields[rock_i];

        if (rockImageTexture == null || rockDirXMap == null || rockDirYMap == null || rockDistanceField == null) {
          continue;
        }
  
        gl.bindVertexArray(fullscreenVAO);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rockImageTexture);
        gl.uniform1i(gl.getUniformLocation(renderRockProgram, "u_imageTexture"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, rockDistanceField);
        gl.uniform1i(gl.getUniformLocation(renderRockProgram, "u_distanceField"), 1);

        // let frameNumberAdjusted = (frameNumber + rockAnimationOffsets[rock_i]) % MAX_FRAME_CYCLE_LENGTH;
        // let frameNumberAdjusted = (frameNumber + (rockYPositions[rock_i] / heightOverWidth)) % MAX_FRAME_CYCLE_LENGTH;
        let frameNumberAdjusted = (frameNumber + (rockYPositions[rock_i])) % MAX_FRAME_CYCLE_LENGTH;

        gl.uniform1i(gl.getUniformLocation(renderRockProgram, "u_frameNumber"), frameNumberAdjusted);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rockFloatingOffset"), rockFloatingOffsets[rock_i]);
        gl.uniform1i(gl.getUniformLocation(renderRockProgram, "u_animationType"), animationType);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_x"), rockXPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_y"), rockYPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_width"), rockWidths[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_height"), rockHeights[rock_i]);
        gl.uniform3f(gl.getUniformLocation(renderRockProgram, "u_rockColor"), rockColor[0], rockColor[1], rockColor[2]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_height_over_width"), heightOverWidth);
      
        gl.drawArrays(gl.TRIANGLES, 0, 6);
          
      }

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        
    }

    function drawParticles() {
      
      gl.useProgram(renderParticlesProgram);
    
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.bindVertexArray(spriteVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, animationOffsetsTex);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_animationOffsets"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentWriteIndex]);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_data"), 1);
      
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, spriteTex);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_sprite"), 2);

      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_size"), particleTextureSize);
      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_particle_radius"), particleRadius);
      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_height_over_width"), heightOverWidth);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_frameNumber"), frameNumber % MAX_FRAME_CYCLE_LENGTH);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_numFrames"), NUM_PARTICLE_FRAMES);
      gl.uniform3f(gl.getUniformLocation(renderParticlesProgram, "u_particleColor"), particleColor[0], particleColor[1], particleColor[2]);
      
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, particleCount);

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    }

    function drawTrailsOnScreen() {

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(trailDisplayProgram);
      gl.bindVertexArray(fullscreenVAO);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trailTex);
      gl.uniform1i(gl.getUniformLocation(trailDisplayProgram, "u_texture"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    }

    function trackFPS() {

      frameNumber++;
      if (frameNumber >= MAX_FRAME_CYCLE_LENGTH) {
        frameNumber = 0;
      }

      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fps = frames;
        frames = 0;
        lastTime = now;
        if (frameNumber % 60 === 0) {
          console.log("FPS:", fps); // or use this value in a state update
        }
      }

    }

    function setupTrails() {

      const { 
        trailIndices, 
        trailCorners,
        trailSegments
       } = createTrailIndicesAndCorners(particleCount, 
                                        particleTextureSize,
                                        trailHistoryLength,
                                        BEZIER_CURVE_RESOLUTION);

      const trailIndexBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, trailIndexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, trailIndices, gl.STATIC_DRAW);
  
      const trailCornerBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, trailCornerBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, trailCorners, gl.STATIC_DRAW);

      const trailSegmentBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, trailSegmentBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, trailSegments, gl.STATIC_DRAW);

      trailVAO = setupTrailVertices(trailIndexBuffer, 
                                          trailCornerBuffer,
                                    trailSegmentBuffer);

      // === Framebuffer for trails ===
      trailTex = createTextureFromImageOrSize(gl,
                                              null,
                                              canvasSizeWidth,
                                              canvasSizeHeight,
                                              gl.RGBA,
                                              gl.RGBA,
                                              gl.UNSIGNED_BYTE,
                                              gl.LINEAR,
                                              gl.CLAMP_TO_EDGE);
        
      trailFB = createFramebufferForSingleChannelTextures(gl, [trailTex]);
  
    }

    function setupPreparedParticleCellData() {

      preparedParticleCellDataTex = createTextureFromImageOrSize(gl,
                                                                  null,
                                                                  particleTextureSize,
                                                                  particleTextureSize,
                                                                  gl.RGBA32F,
                                                                  gl.RGBA,
                                                                  gl.FLOAT,
                                                                  gl.NEAREST,
                                                                  gl.CLAMP_TO_EDGE);
      
      preparedParticleCellDataFB = createFramebufferForSingleChannelTextures(gl, [preparedParticleCellDataTex]);

    }

    function setupParticleIndices() {

      const indices = createParticleIndices(particleCount, particleTextureSize);

      indexBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      const aIndex = gl.getAttribLocation(renderParticlesProgram, "a_index");
      gl.enableVertexAttribArray(aIndex);
      gl.vertexAttribPointer(aIndex, 2, gl.FLOAT, false, 0, 0);

    }

    function setupParticleVertices(size: number) {
      
      const quadVerts = createParticleVertices(particleRadius);

      quadVBO = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

      spriteVAO = gl.createVertexArray()!;
      gl.bindVertexArray(spriteVAO);

      // layout(location = 0) - quad vertex positions
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(0, 0); // per-vertex

      // layout(location = 1) - texture index lookup
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(1, 1); // per-instance

      gl.bindVertexArray(null);

    }

    function setupTrailVertices(trailIndexBuffer: WebGLBuffer, 
                                trailCornerBuffer: WebGLBuffer,
                                trailSegmentBuffer: WebGLBuffer) {

      const trailVAO = gl.createVertexArray()!;
      gl.bindVertexArray(trailVAO);

      // a_index (vec2)
      gl.bindBuffer(gl.ARRAY_BUFFER, trailIndexBuffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  
      // a_corner (float)
      gl.bindBuffer(gl.ARRAY_BUFFER, trailCornerBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

      // a_segment (vec2)
      gl.bindBuffer(gl.ARRAY_BUFFER, trailSegmentBuffer);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
  
      gl.bindVertexArray(null);

      return trailVAO;

    }
  
    function setupSimulationTextures() {

      const particleData = createInitialParticleData(particleTextureSize,
                                                     heightOverWidth,
                                                     particleSpawnXMargin,
                                                     particleSpawnYMargin);

      for (let i = 0; i < realTrailHistoryLength; i++) {
        const tex = createTextureFromImageOrSize(gl,
                                                 particleData,
                                                 particleTextureSize,
                                                 particleTextureSize,
                                                 gl.RGBA32F,
                                                 gl.RGBA,
                                                 gl.FLOAT,
                                                 gl.NEAREST,
                                                 gl.CLAMP_TO_EDGE);
        const fb = createFramebufferForSingleChannelTextures(gl, [tex]);
        readWriteTexList.push(tex);
        readWriteFBList.push(fb);
      }

      const offsetsData = createAnimationOffsetsData(particleTextureSize);
      animationOffsetsTex = createTextureFromImageOrSize(gl,
                                                      offsetsData,
                                                      particleTextureSize,
                                                      particleTextureSize,
                                                      gl.RGBA32F,
                                                      gl.RGBA,
                                                      gl.FLOAT,
                                                      gl.NEAREST,
                                                      gl.CLAMP_TO_EDGE);
      
    }

    function setupFullscreenQuad() {

      const fullscreenVerts = new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1,
      ]);

      fullscreenVBO = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVBO);
      gl.bufferData(gl.ARRAY_BUFFER, fullscreenVerts, gl.STATIC_DRAW);

      fullscreenVAO = gl.createVertexArray()!;
      gl.bindVertexArray(fullscreenVAO);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    }

    function setupSpriteQuad() {

      // a_quadPos: per-vertex quad position
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); // layout(location = 0)
      gl.vertexAttribDivisor(0, 0); // per-vertex

      // a_index: per-instance texture index
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer); // already contains particle indices
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); // layout(location = 1)
      gl.vertexAttribDivisor(1, 1); // per-instance

      gl.bindVertexArray(null); // unbind when done

    }

    function clearScreen() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(backgroundColor[0], 
                    backgroundColor[1], 
                    backgroundColor[2], 
                    1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function insertShaderFunctions(shaderCode: string, functions: string) {
      const lines = shaderCode.split('\n');
      const precisionLineIndex = lines.findIndex(line => line.startsWith('precision'));
      if (precisionLineIndex !== -1) {
        lines.splice(precisionLineIndex + 1, 0, functions);
      }
      return lines.join('\n');
    }
    
    function createPrograms() {
      
      distanceFieldProgram = createProgram(gl, fullscreenVS, distanceFieldFS);
      physicsProgram = createProgram(gl, fullscreenVS, physicsFS);
      renderParticlesProgram = createProgram(gl, renderParticlesVS, renderParticlesFS);
      renderRockProgram = createProgram(gl, renderRockVS, renderRockFS);
      preProcessParticlesProgram = createProgram(gl, fullscreenVS, preProcessParticlesFS);
      trailLineProgram = createProgram(gl, trailLineVS, trailLineFS);
      trailDisplayProgram = createProgram(gl, trailDisplayVS, trailDisplayFS);

      // insert noiseShaderFunctions after first line starting with "precision..."
      const fullRenderNoiseFS = insertShaderFunctions(renderNoiseFS, noiseShaderFunctions);
      renderNoiseProgram = createProgram(gl, fullscreenVS, fullRenderNoiseFS);

      didCreatePrograms = true;

    }

    function renderPass() {

      // Pre-render pass

      preProcessParticles();
      stepSimulation();
      drawTrailsToBuffer();
      stepRocksFloating();

      // Real render starts

      clearScreen();
      renderNoise();
      drawRock();
      drawTrailsOnScreen();
      drawParticles();

    }

    function flipReadWriteParticleTextures() {

      const numberOfTextures = readWriteTexList.length;
      currentReadIndex = (currentReadIndex + 1) % numberOfTextures;
      currentWriteIndex = (currentReadIndex + 1) % numberOfTextures;

    }

    function renderLoopInner() {

      flipReadWriteParticleTextures();
      
      renderPass();

      const err = gl.getError();
      if (err !== gl.NO_ERROR) {
        console.warn("GL Error:", err);
        console.log("isRunningRef.current", isRunningRef.current);
        console.log("spriteReady", spriteReady);
        console.log("rockSpritesReady", rockSpritesReady);
      }

      trackFPS();
    }
    
    function renderLoop(now: number) {

      if (!isRunningRef.current) return;

      if (!spriteReady || !rockSpritesReady.every(ready => ready)) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }
      
      if (now - lastFrameTime >= frameDuration) {
        lastFrameTime = now;
        renderLoopInner();
      }

      animationFrameId = requestAnimationFrame(renderLoop);

    }

    function generateRockDistanceField(image: HTMLImageElement,
                                       index: number) {

        const width = image.width;
        const height = image.height;
        const radius = Math.max(width, height) / 4.0;

        const imageTexture = createTextureFromImageOrSize(gl,
                                                          image,
                                                          width,
                                                          height,
                                                          gl.RGBA,
                                                          gl.RGBA,
                                                          gl.UNSIGNED_BYTE,
                                                          gl.NEAREST,
                                                          gl.CLAMP_TO_EDGE);

        const writeTextures = [];
        for (let i = 0; i < 3; i++) {
          const tex = createTextureFromImageOrSize(gl, 
                                                  null, 
                                                  width, 
                                                  height, 
                                                  gl.R32F,
                                                  gl.RED,
                                                  gl.FLOAT,
                                                  gl.NEAREST,
                                                  gl.CLAMP_TO_EDGE);
          writeTextures.push(tex);
        }

        const texDist = writeTextures[0];
        const texDirX = writeTextures[1];
        const texDirY = writeTextures[2];

        const fbo = createFramebufferForSingleChannelTextures(gl, writeTextures);


        gl.drawBuffers([
          gl.COLOR_ATTACHMENT0,
          gl.COLOR_ATTACHMENT1,
          gl.COLOR_ATTACHMENT2,
        ]);

        gl.useProgram(distanceFieldProgram);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.uniform1i(gl.getUniformLocation(distanceFieldProgram, "u_source"), 0);
        gl.uniform1f(gl.getUniformLocation(distanceFieldProgram, "u_radius"), radius);
        gl.uniform2f(gl.getUniformLocation(distanceFieldProgram, "u_resolution"), width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // set the distance field texture
        rockDistanceFields[index] = texDist;
        rockDirXMaps[index] = texDirX;
        rockDirYMaps[index] = texDirY;
        rockImageTextures[index] = imageTexture;

    }

    const cleanUp = async () => {

      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);

      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);

      // Clean up Programs
      gl.deleteProgram(distanceFieldProgram);
      gl.deleteProgram(physicsProgram);
      gl.deleteProgram(renderParticlesProgram);
      gl.deleteProgram(renderRockProgram);
      gl.deleteProgram(preProcessParticlesProgram);
      gl.deleteProgram(trailLineProgram);
      gl.deleteProgram(trailDisplayProgram);
      gl.deleteProgram(renderNoiseProgram);

      gl.deleteVertexArray(trailVAO);
      gl.deleteTexture(trailTex);
      gl.deleteFramebuffer(trailFB);

      gl.deleteTexture(preparedParticleCellDataTex);
      gl.deleteFramebuffer(preparedParticleCellDataFB);

      gl.deleteBuffer(indexBuffer);

      gl.deleteBuffer(quadVBO);
      gl.deleteVertexArray(spriteVAO);

      gl.deleteTexture(animationOffsetsTex);
      readWriteTexList.forEach(tex => gl.deleteTexture(tex));
      readWriteFBList.forEach(fb => gl.deleteFramebuffer(fb));

      gl.deleteVertexArray(fullscreenVAO);
      gl.deleteBuffer(fullscreenVBO);

      gl.deleteTexture(spriteTex);

      rockImageTextures.forEach(tex => tex && gl.deleteTexture(tex));
      rockDistanceFields.forEach(tex => tex && gl.deleteTexture(tex));
      rockDirXMaps.forEach(tex => tex && gl.deleteTexture(tex));
      rockDirYMaps.forEach(tex => tex && gl.deleteTexture(tex));

    }

    const startUp = () => {

      createPrograms();

      const loadRockImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.src = src;
        });

      for (let i = 0; i < rockImageSources.length; i++) {

        const src = rockImageSources[i];

        loadRockImage(src).then((image) => {
          if (!isRunningRef.current) return;
          generateRockDistanceField(image, i);
          rockSpritesReady[i] = true;
          checkForRealStart();
        });
      }

      ////////////////////////

      const spriteImage = new Image();
      spriteImage.src = particleImageSource;

      spriteImage.onload = () => {
        if (!isRunningRef.current) return;
        spriteTex = loadSpriteImage(gl, spriteImage);
        spriteReady = true;
        checkForRealStart();
      };

      //////////////////////////////

      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("mouseleave", onMouseUp);
      
      canvas.addEventListener("touchstart", onTouchStart);
      canvas.addEventListener("touchmove", onTouchMove);
      canvas.addEventListener("touchend", onTouchEnd);
      canvas.addEventListener("touchcancel", onTouchEnd);

    }

    function checkForRealStart() {
      if (spriteReady && rockSpritesReady.every(ready => ready)) {
        clearTimeout(timeout);
        realStart();
      }
    }

    function realStart() {

      canvas.width = canvasSizeWidth;
      canvas.height = canvasSizeHeight;
      
      setupTrails();
      setupPreparedParticleCellData();
      setupParticleIndices();
      setupParticleVertices(particleRadius);
      setupSimulationTextures();
      setupFullscreenQuad();

      setupSpriteQuad();
      
      renderLoop(performance.now());
          
    }
  
    const timeout = setTimeout(() => {
      isRunningRef.current = true;
      // renderLoop(performance.now());
      startUp();
    }, 50);

    return () => {
      isRunningRef.current = false;
      clearTimeout(timeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      cleanUp();
    };

  }, [gl]);

  return null;
}
