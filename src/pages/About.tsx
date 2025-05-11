import SimWithDistanceField from "../components/SimWithDistanceField";

export default function About() {
    return (
        <div id="container">
            <SimWithDistanceField
                repulseParticleRadius={100.0}
                particleRadius={100.0}
                maskRadius={100.0}
                particleSpawnYMargin={0.0}
                repulse_force={-0.001}
                friction={1.0}
                gravity={0.0}
                particleCount={81}
                spriteImageSrc="/particle.png"
                backgroundColor={[0.0, 0.0, 0.0]} 
                trailLineColor={[1.0, 1.0, 0.0]} // yellow
            />
            <h1>About</h1>
            <p>Oscar's Blog</p>
        </div>
    )
}
