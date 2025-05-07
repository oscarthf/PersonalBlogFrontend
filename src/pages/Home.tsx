import WebGLCanvas from "../components/WebGLCanvas";
import ImageDistanceField from "../components/ImageDistanceField";

function Home() {
    return (
    <div>
        <h1>Welcome to My Blog</h1>
        <WebGLCanvas />
        <ImageDistanceField
            src="/bw_mask.png"
            onResult={({ distance, dirX, dirY }) => {
            console.log("Distance field textures:", { distance, dirX, dirY });
            // Pass to simulation next
            }}
        />
    </div>
    );
}

export default Home;