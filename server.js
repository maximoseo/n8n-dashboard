const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const N8N_BASE = 'https://websiseo.app.n8n.cloud/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try index.html for SPA routing
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function proxyN8n(req, res, apiPath) {
  const url = `${N8N_BASE}${apiPath}`;
  
  const options = {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: req.method,
  };

  const proxyReq = https.request(url, options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
  });

  if (req.method === 'POST' || req.method === 'PUT') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API proxy routes
  if (url.startsWith('/api/n8n/')) {
    const apiPath = url.replace('/api/n8n/', '/');
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const fullPath = queryString ? `${apiPath}?${queryString}` : apiPath;
    proxyN8n(req, res, fullPath);
    return;
  }

  // Health check
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Static files
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from ${DIST_DIR}`);
  console.log(`N8N API proxy: /api/n8n/* -> ${N8N_BASE}`);
});
