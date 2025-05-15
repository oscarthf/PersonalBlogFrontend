import { useState } from "react";
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
  
  return (
    <>
      <div id="sim_container">
        {gl && (
          <>

              <BackgroundAnimation
                  gl={gl}
                  animationType={animationType}
                  trailHistoryLength={trailHistoryLength}
                  trailHistoryStepSize={trailHistoryStepSize}
                  particleRadius={particleRadius}
                  rockImageSources={rockImageSources}
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
