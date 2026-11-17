// Bloomkeeper — a tiny local server for play-testing.
//   node serve.ts   then open http://localhost:8080
// It serves game/ as plain static files, exactly as the game is handed in.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const port = Number(process.env.PORT ?? 8080);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const path = normalize(join(root, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!path.startsWith(root)) throw new Error('outside the garden');
    const body = await readFile(path);
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('not found');
  }
}).listen(port, () => {
  console.log(`Bloomkeeper is growing at http://localhost:${port}`);
});
