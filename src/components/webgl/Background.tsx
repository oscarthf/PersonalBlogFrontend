import { useEffect, useRef, useState } from "react";
import BackgroundAnimationWrapper from "./BackgroundAnimationWrapper";

interface BackgroundProps {
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

export default function Background({
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
}: BackgroundProps) {
  
  const nav = document.querySelector("nav");
  const originalNavHeight = nav ? nav.getBoundingClientRect().height : 0;
  const originalCanvasHeight = window.innerHeight - originalNavHeight;
  const originalCanvasWidth = window.innerWidth;

  const [navBarHeight, setNavBarHeight] = useState(originalNavHeight);
  const [canvasHeight, setCanvasHeight] = useState(originalCanvasHeight);
  const [canvasWidth, setCanvasWidth] = useState(originalCanvasWidth);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);

  const handleResizeOrLoad = () => {
      console.log("Window resized or loaded");

      const nav = document.querySelector("nav");
          
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;
      setNavBarHeight(navHeight);

      const newCanvasHeight = window.innerHeight - navHeight;
      setCanvasHeight(newCanvasHeight);

      const newCanvasWidth = window.innerWidth;
      setCanvasWidth(newCanvasWidth);
      
      setCanvasKey(prev => prev + 1); // force BackgroundAnimation to unmount and remount
      setGL(null); // force new context creation

  };

  useEffect(() => {
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
  }, [canvasKey]);

  return (
    <>
      <div id="background_container">
        <canvas ref={canvasRef} width={512} height={512} style={{ display: "block" }} />
        
        {gl && (
          <>
              <BackgroundAnimationWrapper
                key={canvasKey}
                gl={gl}
                windowWidth={canvasWidth}
                windowHeight={canvasHeight}
                animationType={animationType}
                trailHistoryLength={trailHistoryLength}
                trailHistoryStepSize={trailHistoryStepSize}
                particleRadius={particleRadius}
                repulseParticleRadius={repulseParticleRadius}
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
                particleColor={particleColor}
                trailLineColor={trailLineColor}
              />
          </>
        )}
      </div>
    </>
  );
}
