import { useEffect, useState } from "react";
import { parseLinksAndBreaks } from "../../util/notion/general";

type Section = "home" | "blog" | "about" | string;

export default function GeneralTextContainer({ section }: { section: Section }) {
    
    const [textBlockName, setTextBlockName] = useState<string>("");
    const [textBlockHeader, setTextBlockHeader] = useState<string>("");
    const [textBlockContent, setTextBlockContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const loadContent = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/section?name=${section}`);
            if (!res.ok) throw new Error(`Failed to fetch section: ${section}`);
            const data = await res.json();
            setTextBlockName(data.name || "");
            setTextBlockHeader(data.header || "");
            setTextBlockContent(data.content || "");
        } catch (error) {
            console.error("Error loading content:", error);
            setTextBlockName("Error loading content.");
            setTextBlockHeader("Error loading content.");
            setTextBlockContent("Error loading content.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, [section]);

    return (
        <div className="general-text-inner">
            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <h2 className="general-text-header">
                        {parseLinksAndBreaks(textBlockHeader)}
                    </h2>
                    <p className="general-text-content">
                        {parseLinksAndBreaks(textBlockContent)}
                    </p>
                </>
            )}
        </div>
    );
}
