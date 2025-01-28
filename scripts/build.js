const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const chokidar = require('chokidar');

// Add this at the top with other constants
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const baseUrl = isGitHubPages ? '/your-repo-name' : '';

// Enhanced template with better styling for content
const createHtmlTemplate = (title, metadata, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Cheri Tng</title>
    <link rel="icon" type="image/x-icon" href="${baseUrl}/favicon.ico">
    <link rel="stylesheet" href="${baseUrl}/css/styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">Your Name</div>
        <ul class="nav-links">
            <li><a href="${baseUrl}/index.html">Home</a></li>
            <li><a href="${baseUrl}/projects.html">Projects</a></li>
            <li><a href="${baseUrl}/blog.html">Blog</a></li>
            <li><a href="${baseUrl}/reading.html">Reading</a></li>
        </ul>
    </nav>

    <main class="container">
        <article class="content-article">
            <header class="content-header">
                <h1>${title}</h1>
                ${metadata.date ? `<div class="content-date">${new Date(metadata.date).toLocaleDateString()}</div>` : ''}
                ${metadata.author ? `<div class="content-author">By ${metadata.author}</div>` : ''}
                ${metadata.rating ? `<div class="book-rating">Rating: ${metadata.rating}/5</div>` : ''}
                ${metadata.tags ? `
                    <div class="tags">
                        ${metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
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

// Add this function to copy static assets
async function copyStaticAssets() {
    const staticDirs = ['css', 'js', 'images'];
    const publicDir = path.join(__dirname, '..', 'public');

    for (const dir of staticDirs) {
        try {
            const sourceDir = path.join(__dirname, '..', dir);
            const targetDir = path.join(publicDir, dir);
            
            // Create target directory
            await fs.mkdir(targetDir, { recursive: true });
            
            // Copy files
            const files = await fs.readdir(sourceDir);
            for (const file of files) {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);
                await fs.copyFile(sourcePath, targetPath);
            }
            
            console.log(`Copied ${dir} assets`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Error copying ${dir} assets:`, error);
            }
        }
    }
}

async function buildAllContent() {
    try {
        const publicDir = path.join(__dirname, '..', 'public');
        await fs.mkdir(publicDir, { recursive: true });

        // Copy static assets first
        await copyStaticAssets();

        // Create index.html with the hero section
        const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cheri Tng</title>
    <link rel="icon" type="image/x-icon" href="${baseUrl}/favicon.ico">
    <link rel="stylesheet" href="${baseUrl}/css/styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">Your Name</div>
        <ul class="nav-links">
            <li><a href="${baseUrl}/index.html">Home</a></li>
            <li><a href="${baseUrl}/projects.html">Projects</a></li>
            <li><a href="${baseUrl}/blog.html">Blog</a></li>
            <li><a href="${baseUrl}/reading.html">Reading</a></li>
        </ul>
    </nav>

    <main class="container">
        <section class="hero">
            <div class="hero-content">
                <div class="hero-text">
                    <h1 class="main-heading">
                        Hey there, I'm <span class="highlight">Cheri</span> <span class="wave">👋🏼</span>
                    </h1>
                    
                    <div class="intro-content">
                        <p class="intro-text">
                            Welcome to this space - one where I <span class="highlight">explore</span>, 
                            <span class="highlight">create</span> and share <span class="highlight">ideas</span>.
                        </p>
                        
                        <p class="intro-text">
                            These days, I spend my time learning at <span class="highlight">HBS</span> and working on a number of 
                            fun side projects. In my free time, I enjoy <span class="highlight">coffee</span>, 
                            <span class="highlight">pottery wheel throwing</span>, and being <span class="highlight">outdoors</span>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 Your Name. All rights reserved.</p>
    </footer>
</body>
</html>`;

        await fs.writeFile(path.join(publicDir, 'index.html'), indexHtml);
        console.log('Built index.html');

        // Build blog index
        await buildBlogIndex();

        // Continue with building other content...

        // Create a 404 page
        const notFoundHtml = createHtmlTemplate(
            '404 - Page Not Found',
            {},
            '<h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p>'
        );
        await fs.writeFile(path.join(publicDir, '404.html'), notFoundHtml);

        // Build content for each type (blog, projects, reading)
        const contentTypes = ['blog', 'projects', 'reading'];
        
        for (const type of contentTypes) {
            const typeDir = path.join(__dirname, '..', 'content', type);
            const outputDir = path.join(publicDir, type);
            
            try {
                // Create output directory
                await fs.mkdir(outputDir, { recursive: true });
                
                // Read all markdown files in the type directory
                const files = await fs.readdir(typeDir);
                const markdownFiles = files.filter(file => file.endsWith('.md'));
                
                // Build each markdown file
                for (const file of markdownFiles) {
                    const filePath = path.join(typeDir, file);
                    await buildMarkdownFile(filePath);
                }
                
                console.log(`Built all ${type} content`);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(`Error processing ${type} content:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error in build process:', error);
    }
}

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

// Add this function after buildMarkdownFile()
async function buildBlogIndex() {
    const publicDir = path.join(__dirname, '..', 'public');
    const blogDir = path.join(publicDir, 'blog');
    
    // Create blog directory if it doesn't exist
    await fs.mkdir(blogDir, { recursive: true });
    
    // Copy blog.html to public directory
    const blogHtml = path.join(__dirname, '..', 'blog.html');
    const blogHtmlDest = path.join(publicDir, 'blog.html');
    await fs.copyFile(blogHtml, blogHtmlDest);
}

// If running directly (npm run build), build all content
if (require.main === module) {
    buildAllContent().then(() => {
        console.log('Build complete');
        process.exit(0);
    }).catch(error => {
        console.error('Build failed:', error);
        process.exit(1);
    });
}

// Watch mode (npm run watch)
if (process.env.WATCH === 'true') {
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
} 