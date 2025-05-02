import { useEffect, useState } from 'react'

type Post = {
  id: string
  title: string
  content: string
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const backendUrl = import.meta.env.DEV ? 'http://localhost:5000/posts' : 'http://backend:5000/posts';
    // const backendUrl = 'http://backend:5000/posts';
    fetch(backendUrl)
      .then(res => res.json())
      .then(setPosts)
  }, [])

  return (
    <div>
      <h1>My Blog</h1>
      {posts.map(p => (
        <div key={p.id}>
          <h2>{p.title}</h2>
          <p>{p.content}</p>
        </div>
      ))}
    </div>
  )
}
