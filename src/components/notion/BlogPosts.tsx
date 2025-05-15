import { useEffect, useState } from "react";
import { parseLinksAndBreaks } from "../../util/notion/general";

type Post = {
    id: string;
    title: string;
    content: string;
    date: string;
    slug: string;
};

export default function BlogPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [start, setStart] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadPosts = async (startIndex: number, limit: number) => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts?start=${startIndex}&limit=${limit}`);
            const newPosts = await res.json();
            setPosts(prev => {
                const seen = new Set(prev.map(p => p.id));
                const filtered = newPosts.filter((p: Post) => !seen.has(p.id));
                return [...prev, ...filtered];
            });
            setStart(startIndex + newPosts.length);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts(0, 3);
    }, []);

    const loadMore = () => {
        loadPosts(start, 1);
    };

    return (
        <>
            {posts.map(p => (
                <div key={p.id} className="post-card">
                    <h2 className="post-title">{parseLinksAndBreaks(p.title)}</h2>
                    <p className="post-meta">{p.date} • {p.slug}</p>
                    <p className="post-content">{parseLinksAndBreaks(p.content)}</p>
                </div>
            ))}

            {loading && <p>Loading...</p>}

            {!loading && (
                <button onClick={loadMore} className="load-more-button">
                    Load More
                </button>
            )}
            <br />
            <br />
        </>
    );
}
