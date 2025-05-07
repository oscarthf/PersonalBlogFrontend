import { useEffect } from "react";

import fullscreenVS from "../shaders/fullscreen.vert?raw";
import computeFS from "../shaders/compute.frag?raw";
import renderVS from "../shaders/render.vert?raw";
import renderFS from "../shaders/render.frag?raw";
import maskVS from "../shaders/mask.vert?raw";
import maskFS from "../shaders/mask.frag?raw";

const PARTICLE_COUNT = 1024;
const TEXTURE_SIZE = Math.sqrt(PARTICLE_COUNT);

interface WebGLCanvasProps {
  gl: WebGL2RenderingContext;
  distanceMap?: WebGLTexture;
  dirXMap?: WebGLTexture;
  dirYMap?: WebGLTexture;
  maskMap?: WebGLTexture;
}

export default function WebGLCanvas({
  gl,
  distanceMap,
  dirXMap,
  dirYMap,
  maskMap
}: WebGLCanvasProps) {
  useEffect(() => {

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.width = 512;
    canvas.height = 512;

    const rock_x = 0.4;
    const rock_y = 0.4;
    const rock_w = 0.2;
    const rock_h = 0.2;

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
        const vx = (Math.random() - 0.5) * 0.01;
        const vy = (Math.random() - 0.5) * 0.01;
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

    // === VAOs ===
    const quadVAO = gl.createVertexArray()!;
    gl.bindVertexArray(quadVAO);

    const particleVAO = gl.createVertexArray()!;
    gl.bindVertexArray(particleVAO);

    const indices = new Float32Array(PARTICLE_COUNT * 2);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      indices[i * 2 + 0] = i % TEXTURE_SIZE;
      indices[i * 2 + 1] = Math.floor(i / TEXTURE_SIZE);
    }

    const indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    const aIndex = gl.getAttribLocation(renderProgram, "a_index");
    gl.enableVertexAttribArray(aIndex);
    gl.vertexAttribPointer(aIndex, 2, gl.FLOAT, false, 0, 0);

    // === Simulation Textures ===
    const texA = createDataTexture(TEXTURE_SIZE);
    const texB = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEXTURE_SIZE, TEXTURE_SIZE, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const fbA = createFramebuffer(texA);
    const fbB = createFramebuffer(texB);

    let readTex = texA,
        writeTex = texB,
        readFB = fbA,
        writeFB = fbB;

    // === Render Loop ===
    function renderLoop() {
      // --- Compute Step ---
      gl.useProgram(computeProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFB);
      gl.viewport(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      gl.bindVertexArray(quadVAO);

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

      gl.uniform1f(gl.getUniformLocation(computeProgram, "u_textureSize"), TEXTURE_SIZE);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

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
        gl.bindVertexArray(quadVAO);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, maskMap);
        gl.uniform1i(gl.getUniformLocation(maskProgram, "u_mask"), 4);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_x"), rock_x);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_y"), rock_y);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_w"), rock_w);
        gl.uniform1f(gl.getUniformLocation(maskProgram, "rock_h"), rock_h);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // --- Particle Draw ---
      gl.useProgram(renderProgram);
      gl.bindVertexArray(particleVAO);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(gl.getUniformLocation(renderProgram, "u_data"), 0);
      gl.uniform1f(gl.getUniformLocation(renderProgram, "u_size"), TEXTURE_SIZE);
      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);

      requestAnimationFrame(renderLoop);
    }

    renderLoop();
  }, [gl, distanceMap, dirXMap, dirYMap, maskMap]);

  return null; // no canvas here — it's passed in from parent
}
