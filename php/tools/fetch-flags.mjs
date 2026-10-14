// Drapeaux des pays de toutes les destinations : télécharge les SVG (paquet « flag-icons », licence MIT) dans assets/flags/ et écrit assets/flags.js.
//   node php/tools/fetch-flags.mjs     (à relancer quand on ajoute un pays)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dest = JSON.parse(fs.readFileSync(path.join(root, 'php', 'src', 'data', 'destinations.json'), 'utf8'));
const countries = JSON.parse(fs.readFileSync(path.join(root, 'php', 'src', 'data', 'countries.json'), 'utf8'));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const byName = new Map(countries.map((c) => [norm(c.name), c.code.toLowerCase()]));
const manual = { congo: 'cg', 'rd congo': 'cd' };
const map = {};
for (const d of dest) {
  const code = manual[norm(d.country)] || byName.get(norm(d.country));
  if (!code) throw new Error(`pays inconnu : ${d.country}`);
  map[d.country] = code;
}
const dir = path.join(root, 'assets', 'flags');
fs.mkdirSync(dir, { recursive: true });
for (const code of new Set(Object.values(map))) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${code}.svg`);
  if (!res.ok) throw new Error(`drapeau ${code} : ${res.status}`);
  fs.writeFileSync(path.join(dir, `${code}.svg`), Buffer.from(await res.arrayBuffer()));
}
fs.writeFileSync(path.join(root, 'assets', 'flags.js'), `/* Pays des destinations → drapeau (généré par php/tools/fetch-flags.mjs). */\nwindow.TV_FLAGS = ${JSON.stringify(map)};\n`);
console.log(`${Object.keys(map).length} pays, ${new Set(Object.values(map)).size} drapeaux`);
