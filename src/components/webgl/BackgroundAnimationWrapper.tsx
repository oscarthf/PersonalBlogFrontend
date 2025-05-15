import { useState } from "react";
import DistanceFieldGenerator from "./DistanceFieldGenerator";
import BackgroundAnimation from "./BackgroundAnimation";

interface BackgroundAnimationWrapperProps {
  gl: WebGL2RenderingContext | null;
  windowWidth: number;
  windowHeight: number;
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

export default function BackgroundAnimationWrapper({
  gl,
  windowWidth,
  windowHeight,
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
}: BackgroundAnimationWrapperProps) {
  
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

  return (
    <>
      <div id="sim_container">
        {gl && (
          <>
            {[...Array(rockImageSources.length)].map((_, index) => (
              <DistanceFieldGenerator
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

              <BackgroundAnimation
                  gl={gl}
                  animationType={animationType}
                  trailHistoryLength={trailHistoryLength}
                  trailHistoryStepSize={trailHistoryStepSize}
                  particleRadius={particleRadius}
                  rockDistanceFields={textures.distanceFields}
                  windowWidth={windowWidth}
                  windowHeight={windowHeight}
                  particleSpawnXMargin={particleSpawnXMargin}
                  particleSpawnYMargin={particleSpawnYMargin}
                  repulse_force={repulse_force}
                  friction={friction}
                  gravity={gravity}
                  particleCount={particleCount}
                  particleImageSource={particleImageSource}
                  backgroundColor={backgroundColor}
                  rockColor={rockColor}
                  rockXPositionsPre={rockXPositions}
                  rockYPositionsPre={rockYPositions}
                  rockWidthsPre={rockWidths}
                  rockHeightsPre={rockHeights}
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
