import SimWithDistanceField from "../components/SimWithDistanceField";
import GeneralTextContainer from "../components/GeneralTextContainer";

function Home() {
    return (
    <div id="container">
        <SimWithDistanceField 
            animationType={0}
            repulseParticleRadius={30.0}
            particleSpawnXMargin={0.0}
            particleSpawnYMargin={1.0}
            repulse_force={0.5}
            friction={0.9}
            gravity={0.8}
            particleCount={49}
            particleImageSource="/wave.png"
            rockColor={[165/256, 42/256, 42/256]} // brown
            rockImageSources={["/opal_0.png", "/opal_1.png", "/opal_2.png", "/opal_3.png"]}
            rockXPositions={[0.4, 0.3, 0.6, 0.8]}
            rockYPositions={[1.0, 0.5, 0.7, 0.33]}
            rockWidths={[0.3, 0.22, 0.28, 0.15]}
            rockHeights={[0.3, 0.22, 0.28, 0.15]}
            particleColor={[1.0, 1.0, 1.0]} // white
            backgroundColor={[0.2, 0.4, 0.6]} 
            trailLineColor={[1.0/3.0, 2.0/3.0, 1.0]} // light blue
        />
        <div className="main_text_container">
            <GeneralTextContainer section={"home"} />
        </div>
    </div>
    );
}

export default Home;
