import SimWithDistanceField from "../components/SimWithDistanceField";

export default function About() {
    return (
        <div id="container">
            <SimWithDistanceField 
                backgroundColor={[0.6, 0.8, 1.0]}
                trailLineColor={[1.0, 1.0, 1.0]} 
            />
            <h1>About</h1>
            <p>Oscar's Blog</p>
        </div>
    )
}
