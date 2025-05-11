import { useEffect, useState } from 'react'
import SimWithDistanceField from "../components/SimWithDistanceField";

type Post = {
    id: string
    title: string
    content: string
    date: string
    slug: string
}

export default function Blog() {
    const [posts, setPosts] = useState<Post[]>([])
    const [start, setStart] = useState(0)
    const [loading, setLoading] = useState(true)

    const loadPosts = async (startIndex: number, limit: number) => {
        setLoading(true)
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts?start=${startIndex}&limit=${limit}`)
        const newPosts = await res.json()
        setPosts(prev => {
            const seen = new Set(prev.map(p => p.id))
            const filtered = newPosts.filter(p => !seen.has(p.id))
            return [...prev, ...filtered]
        })
        setStart(startIndex + newPosts.length)
        setLoading(false)
        console.log('Fetching from index', startIndex, 'limit', limit)
        console.log('New posts:', newPosts)
    }

    useEffect(() => {
        loadPosts(0, 3) // load first 3, start will be 3 after this
    }, [])

    const loadMore = () => {
        loadPosts(start, 1)
    }

    return (
        <div id="container">
            <SimWithDistanceField 
                repulseParticleRadius={100.0}
                particleRadius={100.0}
                particleSpawnYMargin={0.5}
                repulse_force={0.01}
                friction={0.9}
                gravity={-0.2}
                particleCount={25}
                particleImageSource="/cloud.png"
                rockColor={[1.0, 1.0, 0.0]} // yellow
                rockImageSources={["/sun.png"]}
                rockXPositions={[0.4]}
                rockYPositions={[0.4]}
                rockWidths={[0.2]}
                rockHeights={[0.2]}
                particleColor={[1.0, 1.0, 1.0]} // white
                backgroundColor={[0.6, 0.8, 1.0]}
                trailLineColor={[1.0, 1.0, 1.0]} 
            />
            <h1 className="page-title">Blog Posts</h1>
        
            {posts.map(p => (
                <div key={p.id} className="post-card">
                <h2 className="post-title">{p.title}</h2>
                <p className="post-meta">{p.date} • {p.slug}</p>
                <p className="post-content">{p.content}</p>
                </div>
            ))}
        
            {loading && <p>Loading...</p>}
        
            {!loading && (
                <button onClick={loadMore} className="load-more-button">
                Load More
                </button>
            )}
        </div>
    )
       
  
}
