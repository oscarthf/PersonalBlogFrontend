import SimWithDistanceField from "../components/webgl/SimWithDistanceField";
import GeneralTextContainer from "../components/notion/GeneralTextContainer";

export default function About() {
    return (
        <div id="container">
            <SimWithDistanceField
                animationType={2}
                trailHistoryLength={2}
                trailHistoryStepSize={2}
                particleRadius={0.01}
                repulseParticleRadius={100.0}
                particleSpawnXMargin={0.0}
                particleSpawnYMargin={0.3}
                repulse_force={-0.001}
                friction={1.0}
                gravity={0.0}
                particleCount={81}
                particleImageSource="/sprites/star.png"
                rockColor={[1.0, 1.0, 0.0]} // yellow
                rockImageSources={["/sprites/moon.png"]}
                rockXPositions={[0.4]}
                rockYPositions={[0.4]}
                rockWidths={[0.2]}
                rockHeights={[0.2]}
                backgroundColor={[0.0, 0.0, 0.0]} 
                particleColor={[1.0, 1.0, 0.0]} // yellow
                trailLineColor={[1.0, 1.0, 0.0]} // yellow
            />
            <div className="main_text_container">
                <GeneralTextContainer section={"about"} />
            </div>
        </div>
    );
}
