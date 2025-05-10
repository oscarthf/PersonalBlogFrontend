import { useEffect, useRef, useState } from "react";
import ImageDistanceField from "./ImageDistanceField";
import WebGLCanvas from "./WebGLCanvas";

const repulseParticleRadius = 50;
const particleRadius = 30;
const maskRadius = 30;

interface SimWithDistanceFieldProps {
  particleCount: number;
  spriteImageSrc: string;
  backgroundColor: number[];
  trailLineColor: number[];
}

export default function SimWithDistanceField({
  particleCount,
  spriteImageSrc,
  backgroundColor,
  trailLineColor,
}: SimWithDistanceFieldProps) {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);
  const [maskTex, setMaskTex] = useState<WebGLTexture | null>(null);
  const [textures, setTextures] = useState<{
    distance?: WebGLTexture;
    dirX?: WebGLTexture;
    dirY?: WebGLTexture;
  }>({});

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // const handleResizeOrLoad = () => {
  //     console.log("Window resized or loaded");
  //     // Your resize/load logic here (e.g., update canvas size)
  // };

  // useEffect(() => {
  //     // Call once on mount (load)
  //     handleResizeOrLoad();

  //     // Add event listeners
  //     window.addEventListener("resize", handleResizeOrLoad);
  //     window.addEventListener("load", handleResizeOrLoad);

  //     // Cleanup on unmount
  //     return () => {
  //         window.removeEventListener("resize", handleResizeOrLoad);
  //         window.removeEventListener("load", handleResizeOrLoad);
  //     };
  // }, []);

  useEffect(() => {
    if (canvasRef.current && !gl) {
      const context = canvasRef.current.getContext("webgl2") as WebGL2RenderingContext;
      if (context) setGL(context);
    }
  }, [canvasRef]);

  return (
    <>
      <div id="sim_container">
        <canvas ref={canvasRef} width={512} height={512} style={{ display: "block" }} />
        {gl && (
          <>
              <ImageDistanceField
                  gl={gl}
                  src="/bw_mask.png"
                  radius={maskRadius}
                  onResult={({ distance, dirX, dirY, mask }) => {
                      setTextures({ distance, dirX, dirY });
                      setMaskTex(mask);
                  }}
              />
              <WebGLCanvas
                  gl={gl}
                  distanceMap={textures.distance}
                  windowWidth={windowWidth}
                  windowHeight={(windowHeight - windowWidth * 0.07)}
                  dirXMap={textures.dirX}
                  dirYMap={textures.dirY}
                  maskMap={maskTex}
                  mask_radius={maskRadius}
                  particleCount={particleCount}
                  spriteImageSrc={spriteImageSrc}
                  backgroundColor={backgroundColor}
                  trailLineColor={trailLineColor}
                  particle_radius={particleRadius}
                  repulse_particle_radius={repulseParticleRadius}
              />
          </>
        )}
      </div>
    </>
  );
}
