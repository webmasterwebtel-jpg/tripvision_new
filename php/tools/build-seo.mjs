// Données pour le référencement : liste des destinations (nom, pays, accroche) tirée de assets/destinations.js.
//   node php/tools/build-seo.mjs     → php/src/data/destinations.json
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const code = fs.readFileSync(path.join(root, 'assets', 'destinations.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(code, sandbox);
const list = (sandbox.window.TV_DEST || []).map((d) => ({ slug: d.slug, name: d.name, country: d.country, tag: d.tag || '' })).filter((d) => d.slug && d.name);
fs.mkdirSync(path.join(here, '..', 'src', 'data'), { recursive: true });
fs.writeFileSync(path.join(here, '..', 'src', 'data', 'destinations.json'), JSON.stringify(list));
console.log(`${list.length} destinations`);
