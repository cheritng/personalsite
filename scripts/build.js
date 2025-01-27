const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Enhanced template with better styling for content
const createHtmlTemplate = (title, metadata, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/css/styles.css">
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
                ${metadata.tags ? `
                    <div class="tags">
                        ${metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                ${metadata.author ? `<div class="content-author">By ${metadata.author}</div>` : ''}
            </header>
            <div class="content-body">
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

async function buildMarkdownFiles() {
    const contentTypes = ['blog', 'projects', 'reading'];
    
    for (const type of contentTypes) {
        try {
            // Create public directory if it doesn't exist
            const publicDir = path.join(__dirname, '..', 'public');
            await fs.mkdir(publicDir, { recursive: true });

            // Create type-specific directory
            const outputDir = path.join(publicDir, type);
            await fs.mkdir(outputDir, { recursive: true });

            // Read markdown files
            const contentDir = path.join(__dirname, '..', 'content', type);
            const files = await fs.readdir(contentDir);

            for (const file of files) {
                if (path.extname(file) === '.md') {
                    const filePath = path.join(contentDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    
                    // Parse front matter and markdown
                    const { attributes, body } = frontMatter(content);
                    const htmlContent = marked.parse(body);
                    
                    // Create HTML file
                    const htmlFileName = path.basename(file, '.md') + '.html';
                    const htmlPath = path.join(outputDir, htmlFileName);
                    
                    const fullHtml = createHtmlTemplate(
                        attributes.title || 'Untitled',
                        attributes,
                        htmlContent
                    );

                    await fs.writeFile(htmlPath, fullHtml);
                    console.log(`Built ${htmlPath}`);
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`No ${type} directory found, skipping...`);
            } else {
                console.error(`Error processing ${type}:`, error);
            }
        }
    }
}

// Run the build
buildMarkdownFiles(); 