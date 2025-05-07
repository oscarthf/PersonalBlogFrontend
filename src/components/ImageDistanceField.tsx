import { useEffect, useRef } from "react";
import distanceShaderSrc from "../shaders/distance.frag?raw";

interface Props {
  src: string;
  onResult?: (result: {
    distance: WebGLTexture;
    dirX: WebGLTexture;
    dirY: WebGLTexture;
  }) => void;
}

export default function ImageDistanceField({ src, onResult }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }

    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.error("EXT_color_buffer_float not supported");
      return;
    }

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = src;
      });

    const createTexture = (width: number, height: number): WebGLTexture => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, width, height, 0, gl.RED, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return tex;
    };

    const createShader = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader error: " + gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const createProgram = (vs: string, fs: string): WebGLProgram => {
      const program = gl.createProgram()!;
      gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs));
      gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Link error: " + gl.getProgramInfoLog(program));
      }
      return program;
    };

    const fullscreenVS = `#version 300 es
      precision highp float;
      out vec2 v_uv;
      void main() {
        vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
        v_uv = pos;
        gl_Position = vec4(pos * 2.0 - 1.0, 0, 1);
      }`;

    loadImage(src).then((image) => {
      const width = image.width;
      const height = image.height;
      canvas.width = width;
      canvas.height = height;

      // Upload source image to texture
      const sourceTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, sourceTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Output textures
      const texDist = createTexture(width, height);
      const texDirX = createTexture(width, height);
      const texDirY = createTexture(width, height);

      // Framebuffer with multiple render targets
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texDist, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, texDirX, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, texDirY, 0);
      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
      ]);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error("Framebuffer not complete");
      }

      // Compile and run shader
      const program = createProgram(fullscreenVS, distanceShaderSrc);
      gl.useProgram(program);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sourceTex);
      gl.uniform1i(gl.getUniformLocation(program, "u_source"), 0);
      gl.uniform1f(gl.getUniformLocation(program, "u_radius"), 30.0);
      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Done — pass textures back
      onResult?.({
        distance: texDist,
        dirX: texDirX,
        dirY: texDirY,
      });
    });
  }, [src]);

  return <canvas ref={canvasRef} style={{ display: "none" }} />;
}
