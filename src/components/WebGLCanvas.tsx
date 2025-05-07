import { useEffect } from "react";

import fullscreenVS from "../shaders/fullscreen.vert?raw";
import computeFS from "../shaders/compute.frag?raw";
import renderVS from "../shaders/render.vert?raw";
import renderFS from "../shaders/render.frag?raw";
import maskVS from "../shaders/mask.vert?raw";
import maskFS from "../shaders/mask.frag?raw";
import sidemaskFS from "../shaders/sidemask.frag?raw";

// const PARTICLE_COUNT = 1024;
const PARTICLE_COUNT = 324;
const PARTICLE_TEXTURE_SIZE = Math.sqrt(PARTICLE_COUNT);
const CANVAS_SIZE = 512;
const INITIAL_ROCK_X = 0.4;
const INITIAL_ROCK_Y = 0.4;
const INITIAL_ROCK_W = 0.2;
const INITIAL_ROCK_H = 0.2;

interface WebGLCanvasProps {
  gl: WebGL2RenderingContext;
  distanceMap?: WebGLTexture;
  dirXMap?: WebGLTexture;
  dirYMap?: WebGLTexture;
  maskMap?: WebGLTexture;
  radius: number;
}

export default function WebGLCanvas({
  gl,
  distanceMap,
  dirXMap,
  dirYMap,
  maskMap,
  radius,
}: WebGLCanvasProps) {
  useEffect(() => {

    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    let rock_x = INITIAL_ROCK_X;
    let rock_y = INITIAL_ROCK_Y;
    const rock_w = INITIAL_ROCK_W;
    const rock_h = INITIAL_ROCK_H;

    const dragging = { current: false };
    const offset = { x: 0, y: 0 };
    
    // // Test if this helps:
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Convert canvas coordinates to normalized 0–1
    function getMousePos(evt: MouseEvent): { x: number; y: number } {
      const rect = canvas.getBoundingClientRect();
      const x = (evt.clientX - rect.left) / rect.width;
      const y = 1 - (evt.clientY - rect.top) / rect.height;
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

    // === Shader helpers ===
    const createShader = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const createProgram = (vsSrc: string, fsSrc: string): WebGLProgram => {
      const program = gl.createProgram()!;
      const vs = createShader(gl.VERTEX_SHADER, vsSrc);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Program link error: " + gl.getProgramInfoLog(program));
      }
      return program;
    };

    const createDataTexture = (size: number): WebGLTexture => {
      const data = new Float32Array(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        const x = Math.random();
        const y = Math.random();
        // const vx = (Math.random() - 0.5) * 0.01;
        // const vy = (Math.random() - 0.5) * 0.01;
        const random_angle = Math.random() * Math.PI / 8 - Math.PI / 16;
        const vx = Math.sin(random_angle) * 0.01;
        const vy = -Math.cos(random_angle) * 0.01;
        data.set([x, y, vx, vy], i * 4);
      }

      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, size, size, 0, gl.RGBA, gl.FLOAT, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return tex;
    };

    const createFramebuffer = (texture: WebGLTexture): WebGLFramebuffer => {
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return fb;
    };

    // === Programs ===
    const computeProgram = createProgram(fullscreenVS, computeFS);
    const renderProgram = createProgram(renderVS, renderFS);
    const maskProgram = createProgram(maskVS, maskFS);
    const sideMaskProgram = createProgram(fullscreenVS, sidemaskFS);

    // === Framebuffer for side mask ===
    const sideMaskTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, sideMaskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const sideMaskFB = createFramebuffer(sideMaskTex);

    // === VAOs ===

    const indices = new Float32Array(PARTICLE_COUNT * 2);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      indices[i * 2 + 0] = i % PARTICLE_TEXTURE_SIZE;
      indices[i * 2 + 1] = Math.floor(i / PARTICLE_TEXTURE_SIZE);
    }

    const indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    const aIndex = gl.getAttribLocation(renderProgram, "a_index");
    gl.enableVertexAttribArray(aIndex);
    gl.vertexAttribPointer(aIndex, 2, gl.FLOAT, false, 0, 0);

    // === Simulation Textures ===
    const texA = createDataTexture(PARTICLE_TEXTURE_SIZE);
    const texB = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const fbA = createFramebuffer(texA);
    const fbB = createFramebuffer(texB);

    let readTex = texA,
        writeTex = texB,
        readFB = fbA,
        writeFB = fbB;


    // === Fullscreen VAO (for compute/mask) ===
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


    // === Sprite Quad (used for instanced rendering) ===
    const quadVerts = new Float32Array([
      -0.01, -0.01,
      0.01, -0.01,
      -0.01,  0.01,
      -0.01,  0.01,
      0.01, -0.01,
      0.01,  0.01,
    ]);

    const quadVBO = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    
    // === Sprite VAO ===
    const spriteVAO = gl.createVertexArray()!;
    gl.bindVertexArray(spriteVAO);

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

    // === Render Loop ===
    function renderLoop() {
      
      // --- Side Mask Pass ---
      gl.useProgram(sideMaskProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sideMaskFB);
      gl.viewport(0, 0, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(gl.getUniformLocation(sideMaskProgram, "u_data"), 0);
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "radius"), parseFloat(radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "u_particleTextureSize"), PARTICLE_TEXTURE_SIZE);
      gl.uniform1f(gl.getUniformLocation(sideMaskProgram, "u_canvasSize"), CANVAS_SIZE);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // --- Compute Step ---
      gl.useProgram(computeProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFB);
      gl.viewport(0, 0, PARTICLE_TEXTURE_SIZE, PARTICLE_TEXTURE_SIZE);
      gl.bindVertexArray(fullscreenVAO);

      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, sideMaskTex);
      gl.uniform1i(gl.getUniformLocation(computeProgram, "u_sideMask"), 4);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
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

      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_x"), rock_x);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_y"), rock_y);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_w"), rock_w);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "rock_h"), rock_h);

      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_radius"), parseFloat(radius.toFixed(1)));
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_canvasSize"), CANVAS_SIZE);
      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_particleTextureSize"), PARTICLE_TEXTURE_SIZE);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      [readTex, writeTex] = [writeTex, readTex];
      [readFB, writeFB] = [writeFB, readFB];

      // --- Render Pass ---
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);


      // --- Mask Background ---
      if (maskMap) {
        gl.useProgram(maskProgram);
        gl.bindVertexArray(fullscreenVAO);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, maskMap);
        gl.uniform1i(gl.getUniformLocation(maskProgram, "u_mask"), 4);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_x"), rock_x);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_y"), rock_y);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_w"), rock_w);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_h"), rock_h);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      
      // --- Render Particles ---
      gl.useProgram(renderProgram);
      gl.bindVertexArray(spriteVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(gl.getUniformLocation(renderProgram, "u_data"), 0);
      gl.uniform1f(gl.getUniformLocation(renderProgram, "u_size"), PARTICLE_TEXTURE_SIZE);

      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, PARTICLE_COUNT);

      // --- Track FPS ---
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fps = frames;
        frames = 0;
        lastTime = now;
        console.log("FPS:", fps); // or use this value in a state update
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
