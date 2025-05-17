import Background from "../components/webgl/Background";
import GeneralTextContainer from "../components/notion/GeneralTextContainer";

function Home() {
    return (
    <div id="page_container">
        <Background 
            animationType={0}
            trailHistoryLength={8}
            trailHistoryStepSize={8}
            particleRadius={0.02}
            repulseParticleRadius={30.0 / 640.0}
            particleSpawnXMargin={0.0}
            particleSpawnYMargin={1.0}
            repulse_force={0.5}
            friction={0.9}
            gravity={0.8 / 640.0}
            particleCount={49}
            particleImageSource="/sprites/wave.png"
            rockColor={[165/256, 42/256, 42/256]} // brown
            rockImageSources={["/sprites/opal_0.png", "/sprites/opal_1.png", "/sprites/opal_2.png", "/sprites/opal_3.png"]}
            rockXPositions={[0.4, 0.6, 0.3, 0.8]}
            rockYPositions={[0.4, 0.35, 0.5, 0.13]}
            rockWidths={[0.3, 0.22, 0.28, 0.15]}
            rockHeights={[0.3, 0.22, 0.28, 0.15]}
            particleColor={[1.0, 1.0, 1.0]} // white
            backgroundColor={[0.2, 0.4, 0.6]} 
            trailLineColor={[1.0/3.0, 2.0/3.0, 1.0]} // light blue
        />
        <div className="main_text_container_wrapper">
            <div className="main_text_container">
                <GeneralTextContainer section={"home"} />
            </div>
        </div>
    </div>
    );
}

export default Home;
