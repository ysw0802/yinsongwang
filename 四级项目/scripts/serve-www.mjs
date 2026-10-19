/* ============================================================
   www/ 本地静态预览服务（仅用于兼容性测试，不属于交付运行链路）
   作者：24001010802 ysw
   用法：node scripts/serve-www.mjs [port]
   ============================================================ */
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.resolve(__dirname, '..', 'www');
const PORT = Number(process.argv[2] || 8765);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = path.join(WWW, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(WWW)) { res.writeHead(403).end('Forbidden'); return; }
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`[serve-www] www/ 预览服务已启动：http://localhost:${PORT}`);
});
