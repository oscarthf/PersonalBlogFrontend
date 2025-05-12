import { useEffect, useRef, useState } from "react";
import ImageDistanceField from "./ImageDistanceField";
import WebGLCanvas from "./WebGLCanvas";

interface SimWithDistanceFieldProps {
  animationType: number;
  trailHistoryLength: number;
  trailHistoryStepSize: number;
  particleRadius: number;
  repulseParticleRadius: number;
  particleSpawnXMargin: number;
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
  particleColor: number[];
  trailLineColor: number[];
}

export default function SimWithDistanceField({
  animationType,
  trailHistoryLength,
  trailHistoryStepSize,
  particleRadius,
  repulseParticleRadius,
  particleSpawnXMargin,
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
  particleColor,
  trailLineColor,
}: SimWithDistanceFieldProps) {
  
  const [navBarHeight, setNavBarHeight] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight); // Initialize to full height

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);
  const [rockImageTextures, setRockImageTextures] = useState<WebGLTexture[]>([]);
  const [textures, setDistanceFieldTextures] = useState<{
    distanceFields: WebGLTexture[];
    dirX: WebGLTexture[];
    dirY: WebGLTexture[];
  }>({
    distanceFields: [],
    dirX: [],
    dirY: [],
  });

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const handleResizeOrLoad = () => {
      console.log("Window resized or loaded");
          
      const nav = document.querySelector("nav");
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;
      setNavBarHeight(navHeight);

      const newCanvasHeight = window.innerHeight - navHeight;
      setCanvasHeight(newCanvasHeight);
      
      setCanvasKey(prev => prev + 1); // This will force WebGLCanvas to unmount and remount
  };

  useEffect(() => {
      handleResizeOrLoad(); // Call once on mount

      window.addEventListener("resize", handleResizeOrLoad);
      window.addEventListener("load", handleResizeOrLoad);

      return () => {
          window.removeEventListener("resize", handleResizeOrLoad);
          window.removeEventListener("load", handleResizeOrLoad);
      };
  }, []);

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
            {[...Array(rockImageSources.length)].map((_, index) => (
              <ImageDistanceField
                key={index}
                gl={gl}
                src={rockImageSources[index]}
                onResult={({ distance, dirX, dirY, mask }) => {
                  setDistanceFieldTextures(prev => {
                    const distanceFields = [...prev.distanceFields];
                    const dirXArr = [...prev.dirX];
                    const dirYArr = [...prev.dirY];

                    distanceFields[index] = distance;
                    dirXArr[index] = dirX;
                    dirYArr[index] = dirY;

                    return { distanceFields, dirX: dirXArr, dirY: dirYArr };
                  });

                  setRockImageTextures(prev => {
                    const masks = [...prev];
                    masks[index] = mask;
                    return masks;
                  });
                }}

              />
            ))}

              <WebGLCanvas
                  key={canvasKey}
                  gl={gl}
                  animationType={animationType}
                  trailHistoryLength={trailHistoryLength}
                  trailHistoryStepSize={trailHistoryStepSize}
                  particleRadius={particleRadius}
                  rockDistanceFields={textures.distanceFields}
                  windowWidth={windowWidth}
                  // windowHeight={(windowHeight - windowWidth * 0.07)}
                  windowHeight={canvasHeight}
                  particleSpawnXMargin={particleSpawnXMargin}
                  particleSpawnYMargin={particleSpawnYMargin}
                  repulse_force={repulse_force}
                  friction={friction}
                  gravity={gravity}
                  particleCount={particleCount}
                  particleImageSource={particleImageSource}
                  backgroundColor={backgroundColor}
                  rockColor={rockColor}
                  rockImageSources={rockImageSources}
                  rockXPositions={rockXPositions}
                  rockYPositions={rockYPositions}
                  rockWidths={rockWidths}
                  rockHeights={rockHeights}
                  rockDirXMaps={textures.dirX}
                  rockDirYMaps={textures.dirY}
                  rockImageTextures={rockImageTextures}
                  particleColor={particleColor}
                  trailLineColor={trailLineColor}
                  repulse_particle_radius={repulseParticleRadius}
              />
          </>
        )}
      </div>
    </>
  );
}
