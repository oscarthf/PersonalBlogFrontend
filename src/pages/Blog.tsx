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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const backendUrl = `${import.meta.env.VITE_API_BASE_URL}/posts`
        fetch(backendUrl)
        .then(res => res.json())
        .then(data => {
            setPosts(data)
            setLoading(false)
        })
        .catch(err => {
            console.error(err)
            setLoading(false)
        })
    }, [])

    return (
        <div className="container">
            <h1 className="page-title">Blog Posts</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                posts.map(p => (
                <div key={p.id} className="post-card">
                    <h2 className="post-title">{p.title}</h2>
                    <p className="post-meta">{p.date} • {p.slug}</p>
                    <p className="post-content">{p.content}</p>
                </div>
                ))
            )}
        </div>
    )      
  
}
