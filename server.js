import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// THIS CODE AND FILE STRUCTURES ARE DUE TO MIGRATION FROM VERCEL

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '5mb' }));

const serverConfigPath = path.join(__dirname, 'server-config.json');
let cleanUrlsEnabled = false;

if (fs.existsSync(serverConfigPath)) {
    const serverConfig = JSON.parse(fs.readFileSync(serverConfigPath, 'utf8'));

    // Handle Trailing Slashes (trailingSlash: false)
    if (serverConfig.trailingSlash === false) {
        app.use((req, res, next) => {
            // If the URL ends with '/' and isn't just the root '/', redirect to the version without it
            if (req.path.endsWith('/') && req.path.length > 1) {
                const query = req.url.slice(req.path.length);
                res.redirect(301, req.path.slice(0, -1) + query);
            } else {
                next();
            }
        });
    }

    // Handle Redirects
    if (serverConfig.redirects) {
        serverConfig.redirects.forEach(rule => {
            app.get(rule.source, (req, res) => {
                const status = rule.permanent ? 301 : 302;
                res.redirect(status, rule.destination);
            });
        });
    }

    cleanUrlsEnabled = serverConfig.cleanUrls === true;
}

app.use(express.static(__dirname, { 
    extensions: cleanUrlsEnabled ? ['html'] : [] 
}));

// API ROUTING (Mimic Vercel serverless functions)
const apiDir = path.join(__dirname, 'api');

if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));

    for (const file of apiFiles) {
        const routeName = `/api/${file.replace('.js', '')}`;
        
        import(`file://${path.join(apiDir, file)}`).then(module => {
            app.all(routeName, async (req, res) => {
                try {
                    await module.default(req, res);
                } catch (err) {
                    console.error(`Error in ${routeName}:`, err);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Internal Server Error' });
                    }
                }
            });
            console.log(`Loaded API Route: ${routeName}`);
        }).catch(err => console.error(`Failed to load ${file}:`, err));
    }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running locally on http://localhost:${PORT}`);
});