import { useEffect, useRef } from "react";
import distanceShaderSrc from "../../shaders/createDistanceField.frag?raw";
import fullscreenVS from "../../shaders/fullscreen.vert?raw";
import { 
  createProgram, 
  createTextureFromImageOrSize,
  createFramebufferForSingleChannelTextures
} from "../../util/webgl/general";

interface Props {
  gl: WebGL2RenderingContext;
  src: string;
  onResult?: (result: {
    distance: WebGLTexture;
    dirX: WebGLTexture;
    dirY: WebGLTexture;
    mask: WebGLTexture;
  }) => void;
}

export default function ImageDistanceField({ 
  gl, 
  src, 
  onResult 
}: Props) {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!gl) return;

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

    const program = createProgram(gl, fullscreenVS, distanceShaderSrc);
    let texDist: WebGLTexture | null = null;
    let texDirX: WebGLTexture | null = null;
    let texDirY: WebGLTexture | null = null;
    let fbo: WebGLFramebuffer | null = null;
    let imageTexture: WebGLTexture | null = null;
    let did_cancel = false;

    loadImage(src).then((image) => {

      if (did_cancel) return;

      const width = image.width;
      const height = image.height;
      // should be a square image padded on all sides with 25% image width
      const radius = image.width / 4;
      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.width = width;
      canvas.height = height;

      imageTexture = createTextureFromImageOrSize(gl,
                                                  image,
                                                  image.width,
                                                  image.height,
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

      texDist = writeTextures[0];
      texDirX = writeTextures[1];
      texDirY = writeTextures[2];

      fbo = createFramebufferForSingleChannelTextures(gl, writeTextures);

      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
      ]);

      gl.useProgram(program);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(gl.getUniformLocation(program, "u_source"), 0);
      gl.uniform1i(gl.getUniformLocation(program, "u_radius"), radius);
      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Done — pass textures back
      onResult?.({
        distance: texDist,
        dirX: texDirX,
        dirY: texDirY,
        mask: imageTexture
      });
    });

    return () => {
      did_cancel = true;
      gl.deleteProgram(program);
    };
  }, [gl, src]);

  return null; // don't return a canvas, it already exists in the parent
}
