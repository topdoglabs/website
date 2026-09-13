import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

// Preview the generated files and explicit deployment rewrites, including 404s.
const root = path.resolve('dist');
const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
const portIndex = process.argv.indexOf('--port');
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Local preview does not send email. Use a deployment to test delivery.' }));
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const rewrite = config.rewrites.find((item) => item.source === pathname);
    const target = rewrite?.destination || pathname;
    const filePath = path.resolve(root, `.${target}`);
    if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root) throw new Error('Invalid path');
    let file = filePath;
    try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch { file = path.join(root, '404.html'); res.statusCode = 404; }
    const data = await fs.readFile(file);
    res.setHeader('Content-Type', types[path.extname(file)] || (target.includes('apple-app-site-association') ? 'application/json' : 'application/octet-stream'));
    res.setHeader('Cache-Control', 'no-store');
    for (const rule of config.headers) if (rule.source === pathname) for (const header of rule.headers) res.setHeader(header.key, header.value);
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}`));
