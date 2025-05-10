import SimWithDistanceField from "../components/SimWithDistanceField";

function Home() {
    return (
    <div id="container">
        <SimWithDistanceField 
            backgroundColor={[0.2, 0.4, 0.6]} 
            trailLineColor={[1.0/3.0, 2.0/3.0, 1.0]} // light blue
        />
        <h1>Welcome to My Blog</h1>
    </div>
    );
}

export default Home;
