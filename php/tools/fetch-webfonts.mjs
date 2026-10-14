// Héberge les polices Google (Cormorant Garamond, Inter) sur le site : télécharge les fichiers woff2 dans assets/fonts/ et écrit assets/fonts.css.
//   node php/tools/fetch-webfonts.mjs     (à relancer seulement pour changer de polices ; licence SIL OFL : copie et hébergement autorisés)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.join(root, 'assets', 'fonts');
fs.mkdirSync(dir, { recursive: true });
const api = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Inter:wght@400..800&display=swap';
const css = await (await fetch(api, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' } })).text();
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)].filter((m) => ['latin', 'latin-ext'].includes(m[1]));
let out = '/* Polices hébergées sur le site (généré par php/tools/fetch-webfonts.mjs). */\n';
const names = new Map();
for (const [, subset, face] of blocks) {
  const url = face.match(/url\((https:[^)]+)\)/)[1];
  const family = face.match(/font-family:\s*'([^']+)'/)[1];
  const style = face.match(/font-style:\s*(\w+)/)[1];
  const weight = face.match(/font-weight:\s*([\d ]+)/)[1].trim();
  const key = `${family}-${style}-${weight.replace(' ', '-')}-${subset}`.toLowerCase().replace(/\s+/g, '');
  const file = `${key}.woff2`;
  if (!names.has(url)) { fs.writeFileSync(path.join(dir, file), Buffer.from(await (await fetch(url)).arrayBuffer())); names.set(url, file); }
  out += face.replace(/url\(https:[^)]+\)/, `url(/assets/fonts/${names.get(url)})`).replace(/\n\s*/g, ' ') + '\n';
}
fs.writeFileSync(path.join(root, 'assets', 'fonts.css'), out);
console.log(`${blocks.length} déclarations, ${names.size} fichiers, ${(fs.readdirSync(dir).reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0) / 1024).toFixed(0)} Ko`);
