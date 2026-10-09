import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import path from 'path';

function subscribersApiPlugin() {
  return {
    name: 'subscribers-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/subscribe' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { email } = JSON.parse(body || '{}');
              if (!email || typeof email !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Valid email required' }));
              }

              const cleanEmail = email.trim().toLowerCase();
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(cleanEmail)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Invalid email format' }));
              }

              const csvPath = path.resolve(process.cwd(), 'data/subscribers.csv');
              const now = new Date().toISOString();

              let existing = '';
              try {
                existing = await fs.readFile(csvPath, 'utf-8');
              } catch {
                existing = '';
              }

              if (!existing || existing.trim().length === 0) {
                await fs.writeFile(csvPath, 'Email,SubscribedAt,Source\n', 'utf-8');
                existing = 'Email,SubscribedAt,Source\n';
              }

              const isDuplicate = existing.toLowerCase().includes(`"${cleanEmail}"`) || existing.toLowerCase().includes(`${cleanEmail},`);
              if (!isDuplicate) {
                await fs.appendFile(csvPath, `"${cleanEmail}","${now}","website_subscriber"\n`, 'utf-8');
              }

              // Forward to Google Sheets if configured
              const googleSheetUrl = process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL;
              if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/')) {
                fetch(googleSheetUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: cleanEmail,
                    timestamp: now,
                    source: 'boston_halloween_website'
                  })
                }).catch(() => {});
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                message: 'Thanks for subscribing!'
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), subscribersApiPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
});
