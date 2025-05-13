import { useEffect, useState } from "react";

type Section = "home" | "blog" | "about" | string;

export default function GeneralTextContainer({ section }: { section: Section }) {
    
    // const [htmlContent, setHtmlContent] = useState<string>("");
    const [textBlockName, setTextBlockName] = useState<string>("");
    const [textBlockHeader, setTextBlockHeader] = useState<string>("");
    const [textBlockContent, setTextBlockContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // textBlockName = "Home";// not rendered here
    // textBlockHeader = "Welcome to my blog!";
    // textBlockContent = "This is a sample blog post. \nStay tuned for more updates! [click here to go to github](https://github.com/oscarthf)";
    
    function parseLinksAndBreaks(text: string): JSX.Element[] {
        const parts = text.split(/(\n|\[.*?\]\(.*?\))/g);

        return parts.map((part, index) => {
            if (part === "\n") {
                return <br key={index} />;
            } else if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
                const match = /\[(.*?)\]\((.*?)\)/.exec(part);
                if (match) {
                    const [, linkText, url] = match;
                    return (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                            {linkText}
                        </a>
                    );
                }
            }
            return <span key={index}>{part}</span>;
        });
    }


    const loadContent = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/section?name=${section}`);
            if (!res.ok) throw new Error(`Failed to fetch section: ${section}`);
            const data = await res.json();
            // setHtmlContent(data.html || "");
            setTextBlockName(data.name || "");
            setTextBlockHeader(data.header || "");
            setTextBlockContent(data.content || "");
        } catch (error) {
            console.error("Error loading content:", error);
            // setHtmlContent("<p>Error loading content.</p>");
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
        <div className="general_text_inner">
            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <h2>{parseLinksAndBreaks(textBlockHeader)}</h2>
                    <p>{parseLinksAndBreaks(textBlockContent)}</p>
                </>
            )}
        </div>
    );
}
