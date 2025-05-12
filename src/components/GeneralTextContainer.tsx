import { useEffect, useState } from "react";

type Section = "home" | "blog" | "about" | string;

export default function GeneralTextContainer({ section }: { section: Section }) {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const loadContent = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/section?name=${section}`);
            if (!res.ok) throw new Error(`Failed to fetch section: ${section}`);
            const data = await res.json();
            setHtmlContent(data.html || "");
        } catch (error) {
            console.error("Error loading content:", error);
            setHtmlContent("<p>Error loading content.</p>");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, [section]);

    return (
        <div className="general_text_inner">
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            )}
        </div>
    );
}
