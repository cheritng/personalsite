async function loadMarkdownContent(filePath) {
    try {
        const response = await fetch(filePath);
        const markdown = await response.text();
        return marked.parse(markdown);
    } catch (error) {
        console.error('Error loading markdown:', error);
        return '<p>Error loading content</p>';
    }
} 