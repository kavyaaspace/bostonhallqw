import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

              const googleSheetUrl =
                process.env.GOOGLE_SHEETS_URL ||
                process.env.VITE_GOOGLE_SHEETS_URL ||
                'https://script.google.com/macros/s/AKfycbxICym8qazY2Ddo5x3q_owHDGbmmWqCwL16jon8vdb91yUKk23LYgXYhgXdE76mW8GG/exec';

              if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/')) {
                try {
                  await fetch(googleSheetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail }),
                    redirect: 'follow'
                  });
                } catch (sheetErr) {
                  console.warn('[Vite Dev Google Sheets Sync] Notice:', sheetErr.message);
                }
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
