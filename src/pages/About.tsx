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
                particleImageSource="/star.png"
                rockColor={[1.0, 1.0, 0.0]} // yellow
                rockImageSources={["/moon.png"]}
                rockXPositions={[0.4]}
                rockYPositions={[0.4]}
                rockWidths={[0.2]}
                rockHeights={[0.2]}
                backgroundColor={[0.0, 0.0, 0.0]} 
                particleColor={[1.0, 1.0, 0.0]} // yellow
                trailLineColor={[1.0, 1.0, 0.0]} // yellow
            />
            <h1>About</h1>
            <p>Oscar's Blog</p>
        </div>
    )
}
