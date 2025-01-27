async function loadMarkdownContent(type, slug) {
    try {
        const response = await fetch(`/api/content/${type}/${slug}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        return {
            metadata: data.metadata,
            content: data.content
        };
    } catch (error) {
        console.error('Error loading content:', error);
        return {
            metadata: {},
            content: '<p>Error loading content</p>'
        };
    }
}

// Example usage for blog posts
async function loadBlogPost(slug) {
    const { metadata, content } = await loadMarkdownContent('blog', slug);
    document.getElementById('post-title').textContent = metadata.title;
    document.getElementById('post-date').textContent = new Date(metadata.date).toLocaleDateString();
    document.getElementById('post-content').innerHTML = content;
} 