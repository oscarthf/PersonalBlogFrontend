
export const parseLinksAndBreaks = (text: string): JSX.Element[] => {
    
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
