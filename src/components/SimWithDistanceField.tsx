import { useEffect, useRef, useState } from "react";
import ImageDistanceField from "./ImageDistanceField";
import WebGLCanvas from "./WebGLCanvas";

interface SimWithDistanceFieldProps {
  repulseParticleRadius: number;
  particleRadius: number;
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
  repulseParticleRadius,
  particleRadius,
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
{/*         
        
        
        
        {gl && (
          <>
              <ImageDistanceField
                  gl={gl}
                  src={rockImageSources}
                  radius={maskRadius}
                  onResult={({ distance, dirX, dirY, mask }) => {
                      setDistanceFieldTextures({ distance, dirX, dirY });
                      setRockImageTextures(mask);
                  }}
              /> */}
              <WebGLCanvas
                  gl={gl}
                  rockDistanceFields={textures.distanceFields}
                  windowWidth={windowWidth}
                  windowHeight={(windowHeight - windowWidth * 0.07)}
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
                  particle_radius={particleRadius}
                  repulse_particle_radius={repulseParticleRadius}
              />
          </>
        )}
      </div>
    </>
  );
}
