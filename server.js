const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const marked = require('marked');
const frontMatter = require('front-matter');

const app = express();
const PORT = process.env.PORT || 3000;

// Add this at the top of server.js to help debug
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Update the static file serving
app.use(express.static('public'));
app.use(express.static('.'));  // This will allow serving files from the root directory

// Add a route for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Remove the /api/content route since we're now using static files

// Add this new route to list content
app.get('/api/content/:type/list', async (req, res) => {
    try {
        const { type } = req.params;
        const dirPath = path.join(__dirname, 'content', type);
        const files = await fs.readdir(dirPath);
        
        const contentList = await Promise.all(
            files.map(async (file) => {
                const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
                const { attributes } = frontMatter(content);
                return {
                    ...attributes,
                    slug: file.replace('.md', '')
                };
            })
        );
        
        res.json(contentList);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error loading content list' });
    }
});

// Add specific routes for each content type
app.get('/:type/:slug', (req, res) => {
    const { type, slug } = req.params;
    res.sendFile(path.join(__dirname, 'public', type, `${slug}.html`));
});

// Add error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Replace the existing server start code with this:
function startServer(port) {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy. Trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

// Start the server with initial port
startServer(PORT); 