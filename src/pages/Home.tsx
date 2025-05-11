import SimWithDistanceField from "../components/SimWithDistanceField";

function Home() {
    return (
    <div id="container">
        <SimWithDistanceField 
            repulseParticleRadius={30.0}
            particleRadius={30.0}
            maskRadius={30.0}
            particleSpawnYMargin={1.0}
            repulse_force={0.5}
            friction={0.9}
            gravity={0.8}
            particleCount={49}
            rockImageSrc="/opal_0.png"
            particleImageSrc="/wave.png"
            rockColor={[165/256, 42/256, 42/256]} // brown
            particleColor={[1.0, 1.0, 1.0]} // white
            backgroundColor={[0.2, 0.4, 0.6]} 
            trailLineColor={[1.0/3.0, 2.0/3.0, 1.0]} // light blue
        />
        <h1>Welcome to My Blog</h1>
    </div>
    );
}

export default Home;
