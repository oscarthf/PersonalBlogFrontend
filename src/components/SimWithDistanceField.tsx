import { useEffect, useRef, useState } from "react";
import ImageDistanceField from "./ImageDistanceField";
import WebGLCanvas from "./WebGLCanvas";

export default function SimWithDistanceField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);
  const [maskTex, setMaskTex] = useState<WebGLTexture | null>(null);
  const [textures, setTextures] = useState<{
    distance?: WebGLTexture;
    dirX?: WebGLTexture;
    dirY?: WebGLTexture;
  }>({});

  useEffect(() => {
    if (canvasRef.current && !gl) {
      const context = canvasRef.current.getContext("webgl2") as WebGL2RenderingContext;
      if (context) setGL(context);
    }
  }, [canvasRef]);

  return (
    <>
      <canvas ref={canvasRef} width={512} height={512} style={{ display: "block" }} />
      {gl && (
        <>
            <ImageDistanceField
                gl={gl}
                src="/bw_mask.png"
                onResult={({ distance, dirX, dirY, mask }) => {
                    setTextures({ distance, dirX, dirY });
                    setMaskTex(mask);
                }}
            />
            <WebGLCanvas
                gl={gl}
                distanceMap={textures.distance}
                dirXMap={textures.dirX}
                dirYMap={textures.dirY}
                maskMap={maskTex}
            />
        </>
      )}
    </>
  );
}
