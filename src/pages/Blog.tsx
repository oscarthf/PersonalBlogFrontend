import Background from "../components/webgl/Background";
import GeneralTextContainer from "../components/notion/GeneralTextContainer";
import BlogPosts from "../components/notion/BlogPosts";

export default function Blog() {
    return (
        <div id="page_container">
            <Background 
                animationType={1}
                trailHistoryLength={4}
                trailHistoryStepSize={32}
                particleRadius={0.08}
                repulseParticleRadius={100.0 / 640.0}
                particleSpawnXMargin={0.3}
                particleSpawnYMargin={0.5}
                repulse_force={0.01}
                friction={0.9}
                gravity={-0.2 / 640.0}
                particleCount={16}
                particleImageSource="/sprites/cloud.png"
                rockColor={[1.0, 1.0, 0.0]}
                rockImageSources={["/sprites/sun.png"]}
                rockXPositions={[0.5]}
                rockYPositions={[0.2]}
                rockWidths={[0.2]}
                rockHeights={[0.2]}
                particleColor={[1.0, 1.0, 1.0]}
                backgroundColor={[0.6, 0.8, 1.0]}
                trailLineColor={[1.0, 1.0, 1.0]}
            />
            <div className="main_text_container_wrapper">
                <div className="main_text_container">
                    <GeneralTextContainer section={"blog"} />
                    <BlogPosts />
                </div>
            </div>
        </div>
    );
}
