// Largeurs des polices Helvetica / Helvetica-Bold (pour écrire les PDF en PHP) : node php/tools/build-fonts.mjs
// Sortie : php/src/data/helvetica.json  { regular: [256 largeurs], bold: [256 largeurs] }  (indexées par code Windows-1252, en 1/1000 d'em)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const here = path.dirname(fileURLToPath(import.meta.url));
const WIN = { 131: 402, 150: 8211, 151: 8212, 145: 8216, 146: 8217, 130: 8218, 147: 8220, 148: 8221, 132: 8222, 134: 8224, 135: 8225, 149: 8226, 133: 8230, 128: 8364, 137: 8240, 139: 8249, 155: 8250, 136: 710, 153: 8482, 140: 338, 156: 339, 152: 732, 138: 352, 154: 353, 159: 376, 142: 381, 158: 382 };
const doc = new PDFDocument();
const out = {};
for (const [key, font] of [['regular', 'Helvetica'], ['bold', 'Helvetica-Bold']]) {
  doc.font(font);
  const w = [];
  for (let c = 0; c < 256; c++) {
    if (c < 32 || (c >= 127 && c < 160 && !WIN[c])) { w.push(0); continue; }
    const ch = String.fromCharCode(WIN[c] || c);
    w.push(Math.round(doc.widthOfString(ch, { kerning: false }) / doc._fontSize * 1000));
  }
  out[key] = w;
}
fs.mkdirSync(path.join(here, '..', 'src', 'data'), { recursive: true });
fs.writeFileSync(path.join(here, '..', 'src', 'data', 'helvetica.json'), JSON.stringify(out));
console.log('ok', out.regular[65], out.bold[65], out.regular[32]);
