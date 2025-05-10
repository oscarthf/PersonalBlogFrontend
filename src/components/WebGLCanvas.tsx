import { useEffect } from "react";

import fullscreenVS from "../shaders/fullscreen.vert?raw";
import computeFS from "../shaders/compute.frag?raw";
import renderVS from "../shaders/renderParticles.vert?raw";
import renderFS from "../shaders/renderParticles.frag?raw";
import maskVS from "../shaders/mask.vert?raw";
import maskFS from "../shaders/mask.frag?raw";
import sidemaskFS from "../shaders/sidemask.frag?raw";
import trailLineVS from "../shaders/trailLine.vert?raw";
import trailLineFS from "../shaders/trailLine.frag?raw";
import trailDisplayVS from "../shaders/trailDisplay.vert?raw";
import trailDisplayFS from "../shaders/trailDisplay.frag?raw";
import { createProgram, createFramebuffer, createInitialParticleData, createAnimationOffsetsData } from "../web_gl_util/general";
import { loadSpriteImage, createTrailIndicesAndCorners, createParticleIndices, createParticleVertices } from "../waterfall/setup";

const MAX_WINDOW_DIMENSION = 640;

// const PARTICLE_COUNT = 1024;
// const PARTICLE_COUNT = 324;
// const PARTICLE_COUNT = 81;
const PARTICLE_COUNT = 49;
// const PARTICLE_SPAWN_Y_MARGIN = 0.25;
const PARTICLE_SPAWN_Y_MARGIN = 1.0;
const PARTICLE_TEXTURE_SIZE = Math.sqrt(PARTICLE_COUNT);
const PARTICLE_QUAD_SIZE = 0.04; // size of the quad in normalized coordinates (0-1)

const NUM_PARTICLE_FRAMES = 8;

const MAX_FRAME_CYCLE_LENGTH = 60 * 60 * 60 * 24; // 6 hours at 60 FPS
const MAX_TRAIL_BEZIER_SEGMENT_LENGTH = 0.5;

const TRAIL_HISTORY_LENGTH = 8;
const TRAIL_HISTORY_STEP_SIZE = 8;
const REAL_TRAIL_HISTORY_LENGTH = TRAIL_HISTORY_LENGTH * TRAIL_HISTORY_STEP_SIZE;

const BEZIER_CURVE_RESOLUTION = 4;

interface WebGLCanvasProps {
  gl: WebGL2RenderingContext;
  distanceMap?: WebGLTexture;
  windowWidth: number;
  windowHeight: number;
  dirXMap?: WebGLTexture;
  dirYMap?: WebGLTexture;
  maskMap?: WebGLTexture;
  mask_radius: number;
  particle_radius: number;
  repulse_particle_radius: number;
}

export default function WebGLCanvas({
  gl,
  distanceMap,
  windowWidth,
  windowHeight,
  dirXMap,
  dirYMap,
  maskMap,
  mask_radius,
  particle_radius,
  repulse_particle_radius,
}: WebGLCanvasProps) {
  useEffect(() => {

    // const BACKGROUND_COLOR = [0.0, 0.0, 0.0, 1.0];
    const BACKGROUND_COLOR = [0.2, 0.4, 0.6, 1.0];

    let CANVAS_SIZE_WIDTH = windowWidth;
    let CANVAS_SIZE_HEIGHT = windowHeight;

    if (windowWidth > windowHeight) {
      const resizeFactor = MAX_WINDOW_DIMENSION / windowWidth;
      CANVAS_SIZE_WIDTH = MAX_WINDOW_DIMENSION;
      CANVAS_SIZE_HEIGHT = windowHeight * resizeFactor;
    } else {
      const resizeFactor = MAX_WINDOW_DIMENSION / windowHeight;
      CANVAS_SIZE_WIDTH = windowWidth * resizeFactor;
      CANVAS_SIZE_HEIGHT = MAX_WINDOW_DIMENSION;
    }

    let CANVAS_HEIGHT_OVER_WIDTH = CANVAS_SIZE_HEIGHT / CANVAS_SIZE_WIDTH;

    const INITIAL_ROCK_X = 0.4;
    const INITIAL_ROCK_Y = 0.4;
    const INITIAL_ROCK_W = 0.2;
    const INITIAL_ROCK_H = 0.2;

    let lastTime = performance.now();
    let frames = 0;
    let frameNumber = 0;
    let fps = 0;

    let currentReadIndex = 0;
    let currentWriteIndex = 1;

    const canvas = gl.canvas as HTMLCanvasElement;
    // canvas.width = CANVAS_SIZE_WIDTH;
    // canvas.height = CANVAS_SIZE_HEIGHT;
    canvas.width = windowWidth;
    canvas.height = windowHeight;

    let rock_x = INITIAL_ROCK_X;
    let rock_y = INITIAL_ROCK_Y;
    const rock_w = INITIAL_ROCK_W;
    const rock_h = INITIAL_ROCK_H;

    // === Mouse Dragging ===

    const dragging = { current: false };
    const offset = { x: 0, y: 0 };
    
    function getMousePos(evt: MouseEvent): { x: number; y: number } {
      const rect = canvas.getBoundingClientRect();
      const x = (evt.clientX - rect.left) / rect.width;
      const y_pre = 1 - (evt.clientY - rect.top) / rect.height;
      const y = y_pre * CANVAS_HEIGHT_OVER_WIDTH;
      return { x, y };
    }

    function onMouseDown(evt: MouseEvent) {
      const { x, y } = getMousePos(evt);
      if (
        x >= rock_x && x <= rock_x + rock_w &&
        y >= rock_y && y <= rock_y + rock_h
      ) {
        dragging.current = true;
        offset.x = x - rock_x;
        offset.y = y - rock_y;
      }
    }

    function onMouseMove(evt: MouseEvent) {
      if (dragging.current) {
        const { x, y } = getMousePos(evt);
        rock_x = x - offset.x;
        rock_y = y - offset.y;
      }
    }

    function onMouseUp() {
      dragging.current = false;
    }

    // === WebGL Setup ===

    function preProcessParticles() {
      
      gl.useProgram(sideMaskProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sideMaskFB);
      gl.viewport(0, 0, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentReadIndex]);
      gl.uniform1i(gl.getUniformLocation(sideMaskProgram, "u_data"), 0);
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "u_repulse_particle_radius"), parseFloat(repulse_particle_radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "u_particleTextureSize"), PARTICLE_TEXTURE_SIZE);
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "u_canvasSizeWidth"), CANVAS_SIZE_WIDTH);
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "u_canvasSizeHeight"), CANVAS_SIZE_HEIGHT);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    function stepSimulation() {

      gl.useProgram(computeProgram);
      // gl.bindFramebuffer(gl.FRAMEBUFFER, writeFB);
      gl.bindFramebuffer(gl.FRAMEBUFFER, readWriteFBList[currentWriteIndex]);
      gl.viewport(0, 0, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, sideMaskTex);
      gl.uniform1i(gl.getUniformLocation(computeProgram, "u_sideMask"), 4);

      gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[currentReadIndex]);
      gl.uniform1i(gl.getUniformLocation(computeProgram, "u_data"), 0);

      if (distanceMap && dirXMap && dirYMap) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, distanceMap);
        gl.uniform1i(gl.getUniformLocation(computeProgram, "u_distanceMap"), 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, dirXMap);
        gl.uniform1i(gl.getUniformLocation(computeProgram, "u_dirXMap"), 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, dirYMap);
        gl.uniform1i(gl.getUniformLocation(computeProgram, "u_dirYMap"), 3);
      }

      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_x"), rock_x * CANVAS_SIZE_WIDTH);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_y"), rock_y * CANVAS_SIZE_WIDTH);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_w"), rock_w * CANVAS_SIZE_WIDTH);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_h"), rock_h * CANVAS_SIZE_WIDTH);

      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_particle_radius"), parseFloat(particle_radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_repulse_particle_radius"), parseFloat(repulse_particle_radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_spawnYMargin"), PARTICLE_SPAWN_Y_MARGIN);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_canvasSizeWidth"), CANVAS_SIZE_WIDTH);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_canvasSizeHeight"), CANVAS_SIZE_HEIGHT);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_particleTextureSize"), PARTICLE_TEXTURE_SIZE);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    function drawTrailsToBuffer() {

      gl.useProgram(trailLineProgram);

      gl.bindFramebuffer(gl.FRAMEBUFFER, trailFB);

      gl.viewport(0, 0, CANVAS_SIZE_WIDTH, CANVAS_SIZE_HEIGHT);

      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_maxDistance"), MAX_TRAIL_BEZIER_SEGMENT_LENGTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_frameNumber"), frameNumber % MAX_FRAME_CYCLE_LENGTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_trailHistoryLength"), TRAIL_HISTORY_LENGTH);
      gl.uniform1i(gl.getUniformLocation(trailLineProgram, "u_bezier_remainder"), (TRAIL_HISTORY_STEP_SIZE - currentWriteIndex % TRAIL_HISTORY_STEP_SIZE));
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
        const texIndex = (currentWriteIndex - i * TRAIL_HISTORY_STEP_SIZE + REAL_TRAIL_HISTORY_LENGTH) % REAL_TRAIL_HISTORY_LENGTH;

        // let texIndex = currentWriteIndex;
        // if (i == TRAIL_HISTORY_LENGTH - 1) {
        //   texIndex = (currentWriteIndex - i * TRAIL_HISTORY_STEP_SIZE + REAL_TRAIL_HISTORY_LENGTH) % REAL_TRAIL_HISTORY_LENGTH;
        // } else if (i != 0) {
        //   const texIndexRemainder = currentWriteIndex % TRAIL_HISTORY_STEP_SIZE;
        //   const realWriteStartIndex = currentWriteIndex - texIndexRemainder + TRAIL_HISTORY_STEP_SIZE;
        //   texIndex = (realWriteStartIndex - i * TRAIL_HISTORY_STEP_SIZE + REAL_TRAIL_HISTORY_LENGTH) % REAL_TRAIL_HISTORY_LENGTH;
        // }

        gl.activeTexture(gl.TEXTURE1 + i);
        gl.bindTexture(gl.TEXTURE_2D, readWriteTexList[texIndex]);
        gl.uniform1i(gl.getUniformLocation(trailLineProgram, `u_data_${i}`), i + 1);
      }

      ///////////

      gl.uniform1f(gl.getUniformLocation(trailLineProgram, "u_size"), PARTICLE_TEXTURE_SIZE);

      gl.bindVertexArray(trailVAO);
      
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.disable(gl.CULL_FACE);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.drawArrays(gl.TRIANGLES, 0, PARTICLE_COUNT * (TRAIL_HISTORY_LENGTH - 1) * 6 * (BEZIER_CURVE_RESOLUTION - 1));

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      gl.enable(gl.CULL_FACE);

    }

    function drawRock() {

      if (maskMap) {
        gl.useProgram(maskProgram);

        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


        gl.bindVertexArray(fullscreenVAO);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, maskMap);
        gl.uniform1i(gl.getUniformLocation(maskProgram, "u_mask"), 4);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "u_rock_x"), rock_x);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "u_rock_y"), rock_y);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "u_rock_w"), rock_w);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "u_rock_h"), rock_h);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "u_height_over_width"), CANVAS_HEIGHT_OVER_WIDTH);
      
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        gl.disable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        
      }
      
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

      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_size"), PARTICLE_TEXTURE_SIZE);
      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_particle_radius"), PARTICLE_QUAD_SIZE);
      gl.uniform1f(gl.getUniformLocation(renderParticlesProgram, "u_height_over_width"), CANVAS_HEIGHT_OVER_WIDTH);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_frameNumber"), frameNumber % MAX_FRAME_CYCLE_LENGTH);
      gl.uniform1i(gl.getUniformLocation(renderParticlesProgram, "u_numFrames"), NUM_PARTICLE_FRAMES);
      
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, PARTICLE_COUNT);

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
       } = createTrailIndicesAndCorners(PARTICLE_COUNT, 
                                        PARTICLE_TEXTURE_SIZE,
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_SIZE_WIDTH, CANVAS_SIZE_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
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

    function setupSideMask() {

      const sideMaskTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, sideMaskTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      
      const sideMaskFB = createFramebuffer(gl, sideMaskTex);
      
      return { sideMaskTex, sideMaskFB };

    }

    function setupParticleIndices() {

      const indices = createParticleIndices(PARTICLE_COUNT, PARTICLE_TEXTURE_SIZE);

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

      const particleData = createInitialParticleData(PARTICLE_TEXTURE_SIZE,
                                                     CANVAS_HEIGHT_OVER_WIDTH,
                                                     PARTICLE_SPAWN_Y_MARGIN);

      const texList = [];
      const fbList = [];

      for (let i = 0; i < REAL_TRAIL_HISTORY_LENGTH; i++) {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE, 0, gl.RGBA, gl.FLOAT, particleData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const fb = createFramebuffer(gl, tex);
        texList.push(tex);
        fbList.push(fb);
      }

      const offsetsData = createAnimationOffsetsData(PARTICLE_TEXTURE_SIZE);
      const offsetsTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, offsetsTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE, 0, gl.RGBA, gl.FLOAT, offsetsData);
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
      // gl.clearColor(0, 0, 0, 1);
      gl.clearColor(BACKGROUND_COLOR[0], 
                    BACKGROUND_COLOR[1], 
                    BACKGROUND_COLOR[2], 
                    BACKGROUND_COLOR[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function createPrograms() {
      
      const computeProgram = createProgram(gl, fullscreenVS, computeFS);
      const renderParticlesProgram = createProgram(gl, renderVS, renderFS);
      const maskProgram = createProgram(gl, maskVS, maskFS);
      const sideMaskProgram = createProgram(gl, fullscreenVS, sidemaskFS);
      const trailLineProgram = createProgram(gl, trailLineVS, trailLineFS);
      const trailDisplayProgram = createProgram(gl, trailDisplayVS, trailDisplayFS);

      return {
        computeProgram,
        renderParticlesProgram,
        maskProgram,
        sideMaskProgram,
        trailLineProgram,
        trailDisplayProgram,
      };

    }

    // === Programs ===

    const { computeProgram,
            renderParticlesProgram, 
            maskProgram, 
            sideMaskProgram, 
            trailLineProgram, 
            trailDisplayProgram } = createPrograms();

    // === Textures ===
    
    const spriteImage = new Image();
    let spriteTex: WebGLTexture;
    spriteImage.src = "/particle.png";
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
      sideMaskTex, 
      sideMaskFB 
    } = setupSideMask();
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

    let lastFrameTime = 0;
    const targetFPS = 10;
    const frameDuration = 1000 / targetFPS;

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

    renderLoop();
    
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    
    // 👇 Cleanup when component unmounts or gl changes
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
    };

  }, [gl, distanceMap, dirXMap, dirYMap, maskMap]);

  return null; // no canvas here — it's passed in from parent
}
