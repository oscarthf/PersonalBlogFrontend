import SimWithDistanceField from "../components/webgl/SimWithDistanceField";
import GeneralTextContainer from "../components/notion/GeneralTextContainer";
import BlogPosts from "../components/notion/BlogPosts";

export default function Blog() {
    return (
        <div id="container">
            <SimWithDistanceField 
                animationType={1}
                trailHistoryLength={4}
                trailHistoryStepSize={32}
                particleRadius={0.08}
                repulseParticleRadius={100.0}
                particleSpawnXMargin={0.3}
                particleSpawnYMargin={0.5}
                repulse_force={0.01}
                friction={0.9}
                gravity={-0.2}
                particleCount={16}
                particleImageSource="/sprites/cloud.png"
                rockColor={[1.0, 1.0, 0.0]}
                rockImageSources={["/sprites/sun.png"]}
                rockXPositions={[0.4]}
                rockYPositions={[0.4]}
                rockWidths={[0.2]}
                rockHeights={[0.2]}
                particleColor={[1.0, 1.0, 1.0]}
                backgroundColor={[0.6, 0.8, 1.0]}
                trailLineColor={[1.0, 1.0, 1.0]}
            />
            <div className="main_text_container">
                <GeneralTextContainer section={"blog"} />
                <BlogPosts />
            </div>
        </div>
    );
}
