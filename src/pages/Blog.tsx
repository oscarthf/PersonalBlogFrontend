import { useEffect, useState } from 'react'

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
        <div className="container">
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
