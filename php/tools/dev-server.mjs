// Serveur de test local « comme l'hébergeur » : fichiers statiques + php-cgi (une exécution PHP par requête, comme sur Apache).
//   node php/tools/dev-server.mjs [dossier=dist-php] [port=8770]
// Reproduit les règles du .htaccess (/api, /uploads, /unsubscribe → api.php ; /app interdit). Variables d'environnement transmises à PHP.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || path.join(here, '..', '..', 'dist-php'));
const port = Number(process.argv[3] || 8770);
const phpCgi = process.env.PHP_CGI || 'php-cgi';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };

function runPhp(req, res, body) {
  const url = new URL(req.url, 'http://x');
  const env = {
    ...process.env, GATEWAY_INTERFACE: 'CGI/1.1', REDIRECT_STATUS: '1', SERVER_PROTOCOL: 'HTTP/1.1', SERVER_SOFTWARE: 'tv-dev',
    SCRIPT_FILENAME: path.join(root, 'api.php'), SCRIPT_NAME: '/api.php', DOCUMENT_ROOT: root, REQUEST_METHOD: req.method, REQUEST_URI: req.url, QUERY_STRING: url.search.slice(1),
    CONTENT_TYPE: req.headers['content-type'] || '', CONTENT_LENGTH: String(body.length), REMOTE_ADDR: req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1', SERVER_NAME: 'localhost', SERVER_PORT: String(port),
  };
  for (const [k, v] of Object.entries(req.headers)) env['HTTP_' + k.toUpperCase().replace(/-/g, '_')] = String(v);
  const p = spawn(phpCgi, ['-d', 'display_errors=0'], { env, cwd: root });
  const chunks = [];
  p.stdout.on('data', (c) => chunks.push(c));
  p.stderr.on('data', (c) => process.stderr.write(c));
  p.on('close', () => {
    const out = Buffer.concat(chunks);
    const sep = out.indexOf('\r\n\r\n');
    const head = out.subarray(0, sep < 0 ? 0 : sep).toString('latin1');
    const payload = sep < 0 ? out : out.subarray(sep + 4);
    let status = 200; const headers = {};
    for (const line of head.split('\r\n')) {
      const i = line.indexOf(':'); if (i < 0) continue;
      const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
      if (k.toLowerCase() === 'status') status = parseInt(v, 10);
      else if (headers[k.toLowerCase()]) headers[k.toLowerCase()] = [].concat(headers[k.toLowerCase()], v);
      else headers[k.toLowerCase()] = v;
    }
    headers['content-length'] = String(payload.length);
    res.writeHead(status, headers); res.end(payload);
  });
  p.stdin.end(body);
}

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (/^\/(api(\/|$)|uploads\/|unsubscribe\/?$)/.test(p)) return runPhp(req, res, body);
    if (/^\/app(\/|$)/.test(p) || /(^|\/)\.(env|ht)/.test(p)) { res.writeHead(403); return res.end('Forbidden'); }
    let file = path.join(root, p === '/' ? 'index.html' : p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}  (racine : ${root})`));
