import { useEffect, useState } from 'react'

type Post = {
  id: string
  title: string
  content: string
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const backendUrl = `${import.meta.env.VITE_API_BASE_URL}/posts`;
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
          <p>{p.id}</p>
          <p>{p.date}</p>
          <p>{p.slug}</p>
          <p>{p.content}</p>
        </div>
      ))}
    </div>
  )
}
