// Compare les liens compagnies JavaScript (assets/airline-links.js) et PHP : node php/tools/air-parity.mjs  (nécessite php dans le PATH)
import '../../assets/airline-links.js';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const A = globalThis.TVAirline;
const slash = (p) => p.split(path.sep).join('/');
const base = (airline, extra = {}, o = {}) => ({ start_date: '2026-11-06', end_date: '2026-12-09', flight: { airline, tripType: 'roundtrip', fromAirport: 'Paris-Charles de Gaulle (CDG)', toAirport: 'Dakar (DSS)', cabin: 'Économique', bookingUrl: '', ...extra }, ...o });
const cases = [];
for (const airline of ['Air France', 'KLM', 'easyJet', 'Corsair', 'Transavia', 'Air Sénégal']) {
  cases.push(base(airline));
  cases.push(base(airline, { tripType: 'oneway' }, { end_date: '' }));
  cases.push(base(airline, { toAirport: 'Londres (LHR)', cabin: 'Affaires' }));
  cases.push(base(airline, { fromAirport: 'Lyon (LYS)', toAirport: 'New York (JFK)', cabin: 'Première' }));
  cases.push(base(airline, { toAirport: 'Rome (FCO)', fromAirport: 'Milan (MXP)' }));
  cases.push(base(airline, { bookingUrl: 'https://www.corsair.fr/' }));
  cases.push(base(airline, { bookingUrl: 'https://www.corsair.fr/search?from=CDG&to=DSS&dep=2026-11-06&ret=2026-12-09' }));
  cases.push(base(airline, { bookingUrl: 'https://x.fr/results?session=abc123' }));
  cases.push(base(airline, { bookingUrl: 'https://x.fr/fr/' }));
  cases.push(base(airline, { bookingUrl: 'pas un lien' }));
}
const out = cases.map((c) => ({ c, exact: A.buildExact(c, {}) ?? null, exact2: A.buildExact(c, { adults: 3, cabin: 'Affaires' }) ?? null, an: A.analyze(c, {}), home: A.isHomepage(String(c.flight.bookingUrl || '')) }));
const f = path.join(os.tmpdir(), 'tv_air_cases.json');
fs.writeFileSync(f, JSON.stringify(out));
const php = `<?php define('TV_APP', '${slash(path.join(here, '..', 'src'))}'); require TV_APP . '/core.php'; require TV_APP . '/helpers.php';
$cases = json_decode(file_get_contents('${slash(f)}'), true); $bad = 0;
foreach ($cases as $i => $x) {
  $e = air_build_exact($x['c'], []); $e2 = air_build_exact($x['c'], ['adults' => 3, 'cabin' => 'Affaires']); $an = air_analyze($x['c'], []); $h = air_is_homepage((string)($x['c']['flight']['bookingUrl'] ?? ''));
  $ok = ($e === $x['exact']) && ($e2 === $x['exact2']) && ($an['level'] === $x['an']['level']) && ($an['url'] === $x['an']['url']) && ($an['note'] === $x['an']['note']) && ($h === $x['home']);
  if (!$ok) { $bad++; echo "DIFF #$i ", json_encode($x['c']['flight'], JSON_UNESCAPED_UNICODE), "\\n js : ", json_encode([$x['exact'], $x['exact2'], $x['an']['level'], $x['home']], JSON_UNESCAPED_SLASHES), "\\n php: ", json_encode([$e, $e2, $an['level'], $h], JSON_UNESCAPED_SLASHES), "\\n"; }
}
echo count($cases), " cas, $bad différence(s)\\n";`;
const pf = path.join(os.tmpdir(), 'tv_air_check.php');
fs.writeFileSync(pf, php);
console.log(execFileSync('php', [pf], { encoding: 'utf8' }));
fs.unlinkSync(pf); fs.unlinkSync(f);
