// Prépare le dossier « dist » à déployer sur Netlify : site public, back-office et espace client/partenaire.
// L'API (Node + Postgres) reste hébergée ailleurs ; Netlify la relaie via /api, /uploads et /unsubscribe,
// ce qui garde un seul domaine (pas de CORS, les liens des e-mails et le retour Stripe pointent vers Netlify).
//
// Variable d'environnement : API_URL = adresse de l'API, par exemple https://tripvision-api.onrender.com
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const api = String(process.env.API_URL || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\//.test(api)) {
  console.error('API_URL manquante : indiquez l\'adresse publique de l\'API, ex. API_URL=https://tripvision-api.onrender.com');
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const skip = /(\.bak\d*|\.map|\.log|^_tmp|^_pdftest)$/i;
function copy(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    if (skip.test(path.basename(src))) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) copy(path.join(src, name), path.join(dest, name));
  } else if (!skip.test(path.basename(src))) {
    fs.copyFileSync(src, dest);
  }
}
for (const f of ['index.html', 'styles.css', 'premium.css', 'script.js']) copy(path.join(root, f), path.join(dist, f));
for (const d of ['assets', 'backoffice', 'espace']) copy(path.join(root, d), path.join(dist, d));

fs.writeFileSync(path.join(dist, '_redirects'), [
  `/api/*          ${api}/api/:splat      200`,
  `/uploads/*      ${api}/uploads/:splat  200`,
  `/unsubscribe    ${api}/unsubscribe     200`,
  '',
].join('\n'));

fs.writeFileSync(path.join(dist, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
/backoffice/*
  X-Robots-Tag: noindex
/espace/*
  X-Robots-Tag: noindex
/assets/*
  Cache-Control: public, max-age=86400
`);

let n = 0, bytes = 0;
(function count(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) count(p); else { n++; bytes += fs.statSync(p).size; } } })(dist);
console.log(`dist prêt : ${n} fichiers, ${(bytes / 1048576).toFixed(1)} Mo — API relayée vers ${api}`);
