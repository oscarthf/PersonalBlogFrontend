import { useEffect } from "react";

import fullscreenVS from "../shaders/fullscreen.vert?raw";
import physicsFS from "../shaders/physics.frag?raw";
import renderVS from "../shaders/renderParticles.vert?raw";
import renderFS from "../shaders/renderParticles.frag?raw";
import renderRockVS from "../shaders/renderRock.vert?raw";
import renderRockFS from "../shaders/renderRock.frag?raw";
import preProcessParticlesFS from "../shaders/preProcessParticles.frag?raw";
import trailLineVS from "../shaders/trailLine.vert?raw";
import trailLineFS from "../shaders/trailLine.frag?raw";
import trailDisplayVS from "../shaders/trailDisplay.vert?raw";
import trailDisplayFS from "../shaders/trailDisplay.frag?raw";
import { 
  getMousePos,
  getTouchPos,
  createProgram, 
  createFramebuffer, 
  createInitialParticleData, 
  createAnimationOffsetsData,
  loadSpriteImage, 
  createTrailIndicesAndCorners, 
  createParticleIndices, 
  createParticleVertices 
} from "../web_gl_util/general";

const MAX_WINDOW_DIMENSION = 640;

const PARTICLE_QUAD_SIZE = 0.04; // size of the quad in normalized coordinates (0-1)

const NUM_PARTICLE_FRAMES = 8;

const MAX_FRAME_CYCLE_LENGTH = 60 * 60 * 60 * 24; // 6 hours at 60 FPS
const MAX_TRAIL_BEZIER_SEGMENT_LENGTH = 0.9;

const TRAIL_HISTORY_LENGTH = 8;
const TRAIL_HISTORY_STEP_SIZE = 8;
const REAL_TRAIL_HISTORY_LENGTH = (TRAIL_HISTORY_LENGTH + 1) * TRAIL_HISTORY_STEP_SIZE;

const BEZIER_CURVE_RESOLUTION = 4;

interface WebGLCanvasProps {
  gl: WebGL2RenderingContext;
  rockDistanceFields: WebGLTexture[];
  windowWidth: number;
  windowHeight: number;
  particleSpawnYMargin: number;
  repulse_force: number;
  friction: number;
  gravity: number;
  particleCount: number;
  particleImageSource: string;
  backgroundColor: number[];
  rockColor: number[];
  rockImageSources: string[];
  rockXPositions: number[];
  rockYPositions: number[];
  rockWidths: number[];
  rockHeights: number[];
  rockDirXMaps: WebGLTexture[];
  rockDirYMaps: WebGLTexture[];
  rockImageTextures: WebGLTexture[];
  particleColor: number[];
  trailLineColor: number[];
  particle_radius: number;
  repulse_particle_radius: number;
}

export default function WebGLCanvas({
  gl,
  rockDistanceFields,
  windowWidth,
  windowHeight,
  particleSpawnYMargin,
  repulse_force,
  friction,
  gravity,
  particleCount,
  particleImageSource,
  backgroundColor,
  rockColor,
  rockImageSources,
  rockXPositions,
  rockYPositions,
  rockWidths,
  rockHeights,
  rockDirXMaps,
  rockDirYMaps,
  rockImageTextures,
  particleColor,
  trailLineColor,
  particle_radius,
  repulse_particle_radius,
}: WebGLCanvasProps) {
  useEffect(() => {

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

    let CANVAS_HEIGHT_OVER_WIDTH = canvasSizeHeight / canvasSizeWidth;

    let lastTime = performance.now();
    let frames = 0;
    let frameNumber = 0;
    let fps = 0;

    let currentReadIndex = 0;
    let currentWriteIndex = 1;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.width = windowWidth;
    canvas.height = windowHeight;

    // const INITIAL_ROCK_X = 0.4;
    // const INITIAL_ROCK_Y = CANVAS_HEIGHT_OVER_WIDTH - 0.4;
    // const ROCK_WIDTH = 0.2;
    // const ROCK_HEIGHT = 0.2;

    // let rock_x = INITIAL_ROCK_X;
    // let rock_y = INITIAL_ROCK_Y;

    // === Mouse Dragging ===

    // const dragging = {
    //   current: false
    // };
    // const offset = {
    //   x: 0, 
    //   y: 0
    // };

    const rockDraggings = []
    for (let i = 0; i < rockImageTextures.length; i++) {
      rockDraggings.push({ current: false });
    }

    const rockOffsets = []
    for (let i = 0; i < rockImageTextures.length; i++) {
      rockOffsets.push({ x: 0, y: 0 });
    }
    
    function clearRockDraggings() {
      for (let i = 0; i < rockDraggings.length; i++) {
        rockDraggings[i].current = false;
      }
    }

    function onMouseDown(evt: MouseEvent) {
      const { x, y } = getMousePos(canvas, evt, CANVAS_HEIGHT_OVER_WIDTH);
      for (let i = 0; i < rockImageTextures.length; i++) {
        const rock_x = rockXPositions[i];
        const rock_y = rockYPositions[i];
        const rock_width = rockWidths[i];
        const rock_height = rockHeights[i];
        if (
          // x >= rock_x && x <= rock_x + ROCK_WIDTH &&
          // y >= rock_y && y <= rock_y + ROCK_HEIGHT
          x >= rock_x && x <= rock_x + rock_width &&
          y >= rock_y && y <= rock_y + rock_height
        ) {
          clearRockDraggings();
          // dragging.current = true;
          // offset.x = x - rock_x;
          // offset.y = y - rock_y;
          rockDraggings[i].current = true;
          rockOffsets[i].x = x - rock_x;
          rockOffsets[i].y = y - rock_y;
          break;
        }
      }
    }

    function onMouseMove(evt: MouseEvent) {
      // if (dragging.current) {
      //   const { x, y } = getMousePos(evt);
      //   rock_x = x - offset.x;
      //   rock_y = y - offset.y;
      // }
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (rockDraggings[i].current) {
          const { x, y } = getMousePos(canvas, evt, CANVAS_HEIGHT_OVER_WIDTH);
          rockXPositions[i] = x - rockOffsets[i].x;
          rockYPositions[i] = y - rockOffsets[i].y;
        }
      }
    }

    function onMouseUp() {
      // dragging.current = false;
      clearRockDraggings();
    }

    function onTouchStart(evt: TouchEvent) {
      evt.preventDefault(); // Prevent scrolling
      const { x, y } = getTouchPos(canvas, evt, CANVAS_HEIGHT_OVER_WIDTH);
      for (let i = 0; i < rockImageTextures.length; i++) {
        const rock_x = rockXPositions[i];
        const rock_y = rockYPositions[i];
        const rock_width = rockWidths[i];
        const rock_height = rockHeights[i];
        if (
          // x >= rock_x && x <= rock_x + ROCK_WIDTH &&
          // y >= rock_y && y <= rock_y + ROCK_HEIGHT
          x >= rock_x && x <= rock_x + rock_width &&
          y >= rock_y && y <= rock_y + rock_height
        ) {
          // dragging.current = true;
          // offset.x = x - rock_x;
          // offset.y = y - rock_y;
          clearRockDraggings();
          rockDraggings[i].current = true;
          rockOffsets[i].x = x - rock_x;
          rockOffsets[i].y = y - rock_y;
          break;
        }
      }
    }

    function onTouchMove(evt: TouchEvent) {
      // if (dragging.current) {
      //   evt.preventDefault();
      //   const { x, y } = getTouchPos(canvas, evt, CANVAS_HEIGHT_OVER_WIDTH);
      //   rock_x = x - offset.x;
      //   rock_y = y - offset.y;
      // }
      evt.preventDefault();
      for (let i = 0; i < rockImageTextures.length; i++) {
        if (rockDraggings[i].current) {
          const { x, y } = getTouchPos(canvas, evt, CANVAS_HEIGHT_OVER_WIDTH);
          rockXPositions[i] = x - rockOffsets[i].x;
          rockYPositions[i] = y - rockOffsets[i].y;
        }
      }
    }

    function onTouchEnd() {
      // dragging.current = false;
      clearRockDraggings();
    }


    // === WebGL Setup ===

    function preProcessParticles() {
      
      gl.useProgram(preProcessParticlesProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, preparedParticleCellDataFB);
      gl.viewport(0, 0, particleTextureSize, particleTextureSize);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentReadIndex]);
      gl.uniform1i(gl.getUniformLocation(preProcessParticlesProgram, "u_data"), 0);
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_repulse_particle_radius"), parseFloat(repulse_particle_radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_particleTextureSize"), particleTextureSize);
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_canvasSizeWidth"), canvasSizeWidth);
      gl.uniform1f(gl.getUniformLocation(preProcessParticlesProgram, "u_canvasSizeHeight"), canvasSizeHeight);

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

        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_x_${rock_i}`), rockXPositions[rock_i] * canvasSizeWidth);
        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_y_${rock_i}`), rockYPositions[rock_i] * canvasSizeWidth);
        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_width_${rock_i}`), rockWidths[rock_i] * canvasSizeWidth);
        gl.uniform1f(gl.getUniformLocation(physicsProgram, `u_rock_height_${rock_i}`), rockHeights[rock_i] * canvasSizeWidth);

      }

      // gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_rock_x"), rock_x * canvasSizeWidth);
      // gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_rock_y"), rock_y * canvasSizeWidth);
      // gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_rock_width"), ROCK_WIDTH * canvasSizeWidth);
      // gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_rock_height"), ROCK_HEIGHT * canvasSizeWidth);

      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_repulse_particle_radius"), parseFloat(repulse_particle_radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_spawnYMargin"), particleSpawnYMargin);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_canvasSizeWidth"), canvasSizeWidth);
      gl.uniform1f(gl.getUniformLocation(physicsProgram, "u_canvasSizeHeight"), canvasSizeHeight);
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

      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_maxDistance"), MAX_TRAIL_BEZIER_SEGMENT_LENGTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_frameNumber"), frameNumber % MAX_FRAME_CYCLE_LENGTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_trailHistoryLength"), TRAIL_HISTORY_LENGTH);
      gl.uniform3f(gl.getUniformLocation(trailLineProgram, "u_trailLineColor"), trailLineColor[0], trailLineColor[1], trailLineColor[2]);
      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_bezier_remainder"), (currentWriteIndex % TRAIL_HISTORY_STEP_SIZE) / TRAIL_HISTORY_STEP_SIZE);
      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_height_over_width"), CANVAS_HEIGHT_OVER_WIDTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_bezierResolution"), BEZIER_CURVE_RESOLUTION);
      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_halfWidth"), PARTICLE_QUAD_SIZE * 0.5);
      
      ///////////

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, animationOffsetsTex);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_animationOffsets"), 0);

      // Just wrote onto currentWriteIndex
      for (let i = 0; i < TRAIL_HISTORY_LENGTH; i++) {
        // TODO: reduce step size at low FPS!!!
        let texIndex = currentWriteIndex;

        if (0) {
          texIndex = (currentWriteIndex - i * TRAIL_HISTORY_STEP_SIZE + REAL_TRAIL_HISTORY_LENGTH) % REAL_TRAIL_HISTORY_LENGTH;
        } else {
          if (i == TRAIL_HISTORY_LENGTH - 1) {
            texIndex = (currentWriteIndex - i * TRAIL_HISTORY_STEP_SIZE + REAL_TRAIL_HISTORY_LENGTH) % REAL_TRAIL_HISTORY_LENGTH;
          } else if (i != 0) {
            const texIndexRemainder = currentWriteIndex % TRAIL_HISTORY_STEP_SIZE;
            const realWriteStartIndex = currentWriteIndex - texIndexRemainder + TRAIL_HISTORY_STEP_SIZE;
            texIndex = (realWriteStartIndex - i * TRAIL_HISTORY_STEP_SIZE + REAL_TRAIL_HISTORY_LENGTH) % REAL_TRAIL_HISTORY_LENGTH;
          }
        
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
      
      gl.drawArrays(gl.TRIANGLES, 0, particleCount * (TRAIL_HISTORY_LENGTH - 1) * 6 * (BEZIER_CURVE_RESOLUTION - 1));

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
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, rockImageTexture);
        gl.uniform1i(gl.getUniformLocation(renderRockProgram, "u_mask"), 4);
        // gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_x"), rock_x);
        // gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_y"), rock_y);
        // gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_width"), ROCK_WIDTH);
        // gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_height"), ROCK_HEIGHT);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_x"), rockXPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_y"), rockYPositions[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_width"), rockWidths[rock_i]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_rock_height"), rockHeights[rock_i]);
        gl.uniform3f(gl.getUniformLocation(renderRockProgram, "u_rockColor"), rockColor[0], rockColor[1], rockColor[2]);
        gl.uniform1f(gl.getUniformLocation(renderRockProgram, "u_height_over_width"), CANVAS_HEIGHT_OVER_WIDTH);
      
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
      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_particle_radius"), PARTICLE_QUAD_SIZE);
      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_height_over_width"), CANVAS_HEIGHT_OVER_WIDTH);
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
        console.log("FPS:", fps); // or use this value in a state update
      }

    }

    function setupTrails() {

      const { 
        trailIndices, 
        trailCorners,
        trailSegments
       } = createTrailIndicesAndCorners(particleCount, 
                                        particleTextureSize,
                                        TRAIL_HISTORY_LENGTH,
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

      const trailVAO = setupTrailVertices(trailIndexBuffer, 
                                          trailCornerBuffer,
                                          trailSegmentBuffer);

      // === Framebuffer for trails ===
      const trailTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, trailTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasSizeWidth, canvasSizeHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
      const trailFB = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, trailFB);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, trailTex, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer incomplete:", status.toString(16));
      }

      return { 
        trailVAO, 
        trailTex, 
        trailFB 
      };
  
    }

    function setupPreparedParticleCellData() {

      const preparedParticleCellDataTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, preparedParticleCellDataTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, particleTextureSize, particleTextureSize, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      
      const preparedParticleCellDataFB = createFramebuffer(gl, preparedParticleCellDataTex);
      
      return { preparedParticleCellDataTex, preparedParticleCellDataFB };

    }

    function setupParticleIndices() {

      const indices = createParticleIndices(particleCount, particleTextureSize);

      const indexBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      const aIndex = gl.getAttribLocation(renderParticlesProgram, "a_index");
      gl.enableVertexAttribArray(aIndex);
      gl.vertexAttribPointer(aIndex, 2, gl.FLOAT, false, 0, 0);

      return indexBuffer;

    }

    function setupParticleVertices(size: number) {
      
      const quadVerts = createParticleVertices(PARTICLE_QUAD_SIZE);

      const quadVBO = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

      const spriteVAO = gl.createVertexArray()!;
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

      return {
        quadVBO,
        spriteVAO,
      };

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
                                                     CANVAS_HEIGHT_OVER_WIDTH,
                                                     particleSpawnYMargin);

      const texList = [];
      const fbList = [];

      for (let i = 0; i < REAL_TRAIL_HISTORY_LENGTH; i++) {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, particleTextureSize, particleTextureSize, 0, gl.RGBA, gl.FLOAT, particleData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const fb = createFramebuffer(gl, tex);
        texList.push(tex);
        fbList.push(fb);
      }

      const offsetsData = createAnimationOffsetsData(particleTextureSize);
      const offsetsTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, offsetsTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, particleTextureSize, particleTextureSize, 0, gl.RGBA, gl.FLOAT, offsetsData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      
      return {
        offsetsTex,
        texList,
        fbList
      };

    }

    function setupFullscreenQuad() {

      const fullscreenVerts = new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1,
      ]);

      const fullscreenVBO = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVBO);
      gl.bufferData(gl.ARRAY_BUFFER, fullscreenVerts, gl.STATIC_DRAW);

      const fullscreenVAO = gl.createVertexArray()!;
      gl.bindVertexArray(fullscreenVAO);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      return fullscreenVAO;

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

    function createPrograms() {
      
      const physicsProgram = createProgram(gl, fullscreenVS, physicsFS);
      const renderParticlesProgram = createProgram(gl, renderVS, renderFS);
      const renderRockProgram = createProgram(gl, renderRockVS, renderRockFS);
      const preProcessParticlesProgram = createProgram(gl, fullscreenVS, preProcessParticlesFS);
      const trailLineProgram = createProgram(gl, trailLineVS, trailLineFS);
      const trailDisplayProgram = createProgram(gl, trailDisplayVS, trailDisplayFS);

      return {
        physicsProgram,
        renderParticlesProgram,
        renderRockProgram,
        preProcessParticlesProgram,
        trailLineProgram,
        trailDisplayProgram,
      };

    }

    // === Programs ===

    const { physicsProgram,
            renderParticlesProgram, 
            renderRockProgram, 
            preProcessParticlesProgram, 
            trailLineProgram, 
            trailDisplayProgram } = createPrograms();

    // === Textures ===
    
    const spriteImage = new Image();
    let spriteTex: WebGLTexture;
    spriteImage.src = particleImageSource;
    let spriteReady = false;

    spriteImage.onload = () => {
      spriteTex = loadSpriteImage(gl, spriteImage);
      spriteReady = true;
    };

    //

    const { 
      trailVAO, 
      trailTex, 
      trailFB 
    } = setupTrails();
    const { 
      preparedParticleCellDataTex, 
      preparedParticleCellDataFB 
    } = setupPreparedParticleCellData();
    const indexBuffer = setupParticleIndices();
    const { 
      quadVBO, 
      spriteVAO
    } = setupParticleVertices(PARTICLE_QUAD_SIZE);
    let { 
      offsetsTex: animationOffsetsTex,
      texList: readWriteTexList,
      fbList: readWriteFBList
    } = setupSimulationTextures();
    const fullscreenVAO = setupFullscreenQuad();

    setupSpriteQuad();

    function renderPass() {

      // Pre-render pass

      preProcessParticles();
      stepSimulation();
      drawTrailsToBuffer();

      // Real render starts

      clearScreen();

      drawRock();
      drawTrailsOnScreen();
      drawParticles();

    }

    function flipReadWriteParticleTextures() {

      // [readTex, writeTex] = [writeTex, readTex];
      // [readFB, writeFB] = [writeFB, readFB];

      const numberOfTextures = readWriteTexList.length;
      currentReadIndex = (currentReadIndex + 1) % numberOfTextures;
      currentWriteIndex = (currentReadIndex + 1) % numberOfTextures;

    }

    function renderLoopInner() {

      flipReadWriteParticleTextures();
      
      renderPass();

      const err = gl.getError();
      if (err !== gl.NO_ERROR) console.warn("GL Error:", err);

      trackFPS();
    }
    
    function renderLoop(now: number) {

      if (!spriteReady) {
        requestAnimationFrame(renderLoop);
        return;
      }
      
      if (now - lastFrameTime >= frameDuration) {
        lastFrameTime = now;
        // Your render logic here
        renderLoopInner();
      }

      requestAnimationFrame(renderLoop);

    }

    renderLoop(performance.now());
    
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    
    // 👇 Cleanup when component unmounts or gl changes
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);

      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };

  }, [gl, rockDistanceFields, rockDirXMaps, rockDirYMaps, rockImageTextures]);

  return null; // no canvas here — it's passed in from parent
}
