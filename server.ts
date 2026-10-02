import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoints for Cloud Run / deployment health probes
  app.get(['/healthz', '/health', '/_ah/health'], (req, res) => {
    res.status(200).send('OK');
  });

  const distPath = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    // Serve production static assets
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development fallback
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`RallyPoint production server listening on 0.0.0.0:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use, trying fallback port 3000...`);
      if (PORT !== 3000) {
        app.listen(3000, '0.0.0.0', () => {
          console.log('RallyPoint server fallback listening on port 3000');
        });
      }
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
