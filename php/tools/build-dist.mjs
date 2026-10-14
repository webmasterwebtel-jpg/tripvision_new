// Prépare le dossier « dist-php » à envoyer par FTP sur l'hébergement PHP : node php/tools/build-dist.mjs
// Contenu : site public, back-office, espace client, activation (fichiers statiques) + api.php + app/ (serveur PHP, données) + .htaccess.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const php = path.join(here, '..');
const dist = path.join(root, 'dist-php');
const skip = /(\.bak\d*|\.map|\.log|^_tmp|^_pdftest|^_air_.*)$/i;

function copy(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    if (skip.test(path.basename(src))) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) copy(path.join(src, name), path.join(dest, name));
  } else if (!skip.test(path.basename(src))) fs.copyFileSync(src, dest);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'app'), { recursive: true });
for (const f of ['index.html', 'styles.css', 'premium.css', 'script.js']) copy(path.join(root, f), path.join(dist, f));
for (const d of ['assets', 'backoffice', 'espace', 'activation']) copy(path.join(root, d), path.join(dist, d));
for (const f of fs.readdirSync(path.join(php, 'src'))) {
  const full = path.join(php, 'src', f);
  if (fs.statSync(full).isDirectory()) copy(full, path.join(dist, 'app', f));
  else if (f.endsWith('.php')) fs.copyFileSync(full, path.join(dist, 'app', f));
}
// Voitures et espace partenaire : pas encore proposés (décision de lancement) — masqués ici sans toucher au code source.
const bo = path.join(dist, 'backoffice', 'backoffice.js');
let boSrc = fs.readFileSync(bo, 'utf8');
for (const id of ['vehicles', 'categories', 'partners', 'applications']) boSrc = boSrc.replace(new RegExp(`(\\{ id: '${id}',[^\\n]*?allow: )\\(\\) => [^\\n]*?(\\s*\\},?\\s*\\n)`), '$1() => false$2');
fs.writeFileSync(bo, boSrc);
fs.writeFileSync(path.join(dist, 'assets', 'lancement.css'), `/* Lancement : vols et week-ends uniquement. */
a[data-page-link="partner"], .premium-discover { display: none !important; }
`);
const idx = path.join(dist, 'index.html');
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replace('</head>', '  <link rel="stylesheet" href="/assets/lancement.css" />\n</head>'));
fs.copyFileSync(path.join(php, 'deploy', 'htaccess'), path.join(dist, '.htaccess'));
fs.copyFileSync(path.join(php, 'deploy', 'app-htaccess'), path.join(dist, 'app', '.htaccess'));
fs.copyFileSync(path.join(php, 'deploy', 'api.php'), path.join(dist, 'api.php'));
fs.copyFileSync(path.join(php, 'deploy', 'env.example'), path.join(dist, 'app', 'env.example'));

let files = 0, bytes = 0;
(function count(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); const s = fs.statSync(p); if (s.isDirectory()) count(p); else { files++; bytes += s.size; } } })(dist);
console.log(`dist-php prêt : ${files} fichiers, ${(bytes / 1048576).toFixed(1)} Mo`);
