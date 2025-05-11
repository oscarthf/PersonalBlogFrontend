import SimWithDistanceField from "../components/SimWithDistanceField";

export default function About() {
    return (
        <div id="container">
            <SimWithDistanceField
                repulseParticleRadius={100.0}
                particleRadius={100.0}
                particleSpawnYMargin={0.0}
                repulse_force={-0.001}
                friction={1.0}
                gravity={0.0}
                particleCount={81}
                rockImageSources={["/moon.png"]}
                particleImageSource="/star.png"
                rockColor={[1.0, 1.0, 0.0]} // yellow
                backgroundColor={[0.0, 0.0, 0.0]} 
                particleColor={[1.0, 1.0, 0.0]} // yellow
                trailLineColor={[1.0, 1.0, 0.0]} // yellow
            />
            <h1>About</h1>
            <p>Oscar's Blog</p>
        </div>
    )
}
