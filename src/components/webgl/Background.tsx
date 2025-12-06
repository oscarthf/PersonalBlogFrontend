import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [navBarHeight, setNavBarHeight] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasKey, setCanvasKey] = useState(0);
  const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);

  const handleResize = () => {
    const nav = document.querySelector("nav");
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    setNavBarHeight(navHeight);
    setCanvasHeight(window.innerHeight - navHeight);
    setCanvasWidth(window.innerWidth);
    setCanvasKey(prev => prev + 1);
    setGL(null);
  };

  useLayoutEffect(() => {
    handleResize(); // Ensure initial measurement before paint
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current && !gl) {
      const context = canvasRef.current.getContext("webgl2") as WebGL2RenderingContext;
      if (context) setGL(context);
    }
  }, [canvasKey]);

  return (
    <div id="background_container">
      <canvas
        ref={canvasRef}
        width={canvasWidth || 512}
        height={canvasHeight || 512}
        style={{ display: "block" }}
      />
      {gl && (
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
      )}
    </div>
  );
}
