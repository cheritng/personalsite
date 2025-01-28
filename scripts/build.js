const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const chokidar = require('chokidar');

// Enhanced template with better styling for content
const createHtmlTemplate = (title, metadata, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Cheri Tng</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">Your Name</div>
        <ul class="nav-links">
            <li><a href="/index.html">Home</a></li>
            <li><a href="/projects.html">Projects</a></li>
            <li><a href="/blog.html">Blog</a></li>
            <li><a href="/reading.html">Reading</a></li>
        </ul>
    </nav>

    <main class="container">
        <article class="content-article">
            <header class="content-header">
                <h1>${title}</h1>
                ${metadata.date ? `<div class="content-date">${new Date(metadata.date).toLocaleDateString()}</div>` : ''}
                ${metadata.author ? `<div class="content-author">By ${metadata.author}</div>` : ''}
                ${metadata.rating ? `<div class="book-rating">Rating: ${metadata.rating}/5</div>` : ''}
                ${metadata.category ? `
                    <div class="tags">
                        ${metadata.category.map(cat => `<span class="tag">${cat}</span>`).join('')}
                    </div>
                ` : ''}
                ${metadata.tags ? `
                    <div class="tags">
                        ${metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </header>
            <div class="content-body book-content">
                ${content}
            </div>
        </article>
    </main>

    <footer>
        <p>&copy; 2024 Your Name. All rights reserved.</p>
    </footer>
</body>
</html>
`;

async function buildMarkdownFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { attributes, body } = frontMatter(content);
        const htmlContent = marked.parse(body);
        
        // Determine the content type from the file path
        const contentType = path.dirname(filePath).split(path.sep).pop();
        
        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '..', 'public', contentType);
        await fs.mkdir(outputDir, { recursive: true });
        
        // Create HTML file
        const htmlFileName = path.basename(filePath, '.md') + '.html';
        const htmlPath = path.join(outputDir, htmlFileName);
        
        const fullHtml = createHtmlTemplate(
            attributes.title || 'Untitled',
            attributes,
            htmlContent
        );

        await fs.writeFile(htmlPath, fullHtml);
        console.log(`Built ${htmlPath}`);
    } catch (error) {
        console.error('Error building markdown file:', error);
    }
}

// Watch for changes in markdown files
const watcher = chokidar.watch('content/**/*.md', {
    persistent: true,
    ignoreInitial: false
});

watcher
    .on('add', buildMarkdownFile)
    .on('change', buildMarkdownFile)
    .on('unlink', async (filePath) => {
        const htmlPath = filePath.replace('content', 'public').replace('.md', '.html');
        try {
            await fs.unlink(htmlPath);
            console.log(`Removed ${htmlPath}`);
        } catch (error) {
            console.error('Error removing HTML file:', error);
        }
    });

console.log('Watching for markdown file changes...'); 