// Prépare les données géographiques pour la version PHP (villes, aéroports, pays) : à lancer une fois, en local.
//   node php/tools/build-geo.mjs
// Sortie : php/src/data/{cities,airports,countries}.json  (les mêmes résultats que api/geo.js, sans dépendance Node en production).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cities from 'all-the-cities';
import airportData from 'airport-data-js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'src', 'data');
fs.mkdirSync(out, { recursive: true });

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });
const countryName = (code) => { try { return regionNames.of(code) || code; } catch { return code; } };

// Villes : toutes celles de 5 000 habitants et plus (+ les villes citées dans les alias et les destinations du site).
const keep = new Set(['London|GB', 'Moscow|RU', 'Cairo|EG']);
const list = [];
const countries = new Map();
for (const c of cities) {
  if (!c.name || !c.country) continue;
  if (!countries.has(c.country)) countries.set(c.country, countryName(c.country));
  if ((c.population || 0) < 5000) continue;
  list.push([c.name, c.country, c.population || 0, c.loc?.coordinates?.[1] ?? null, c.loc?.coordinates?.[0] ?? null]);
}
list.sort((a, b) => b[2] - a[2]);
fs.writeFileSync(path.join(out, 'cities.json'), JSON.stringify(list.map(([n, cc, pop]) => [n, norm(n), cc, pop])));

const countryList = [...countries].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
fs.writeFileSync(path.join(out, 'countries.json'), JSON.stringify(countryList));

// Aéroports : même calcul de ville que dans api/geo.js.
const dist2 = (lat1, lon1, lat2, lon2) => { const dx = (lon1 - lon2) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180); const dy = lat1 - lat2; return dx * dx + dy * dy; };
const TYPE_RANK = { large_airport: 0, medium_airport: 1, small_airport: 2, seaplane_base: 3 };
const all = [];
for (const c of cities) { if (c.loc?.coordinates?.[1] == null) continue; all.push({ name: c.name, n: norm(c.name), cc: c.country, pop: c.population || 0, lon: c.loc.coordinates[0], lat: c.loc.coordinates[1] }); }
const byCountry = new Map();
for (const c of all) (byCountry.get(c.cc) || byCountry.set(c.cc, []).get(c.cc)).push(c);
const airports = [];
for (const { code } of countryList) {
  let rows = [];
  try { rows = await airportData.getAirportByCountryCode(code); } catch { continue; }
  const places = byCountry.get(code) || [];
  for (const a of rows) {
    if (!/^[A-Z]{3}$/.test(a.iata || '') || a.type === 'heliport' || a.type === 'closed') continue;
    let best = null, bestD = Infinity, big = null, named = null;
    const nameN = norm(a.airport);
    for (const c of places) {
      const d = dist2(a.latitude, a.longitude, c.lat, c.lon);
      if (d < bestD) { bestD = d; best = c; }
      if (d >= 0.6 * 0.6) continue;
      if (c.n.length >= 4 && nameN.includes(c.n) && (!named || c.pop > named.pop)) named = c;
      if (c.pop >= 50000 && (!big || c.pop > big.pop)) big = c;
    }
    const city = named || big || best;
    const cityName = city?.name || a.airport;
    airports.push({ iata: a.iata, name: a.airport, city: cityName, cc: code, nc: norm(cityName), n: norm(`${a.iata} ${a.airport} ${cityName}`), pop: city?.pop || 0, rank: TYPE_RANK[a.type] ?? 4 });
  }
}
airports.sort((x, y) => x.rank - y.rank || y.pop - x.pop);
fs.writeFileSync(path.join(out, 'airports.json'), JSON.stringify(airports.map((a) => [a.iata, a.name, a.city, a.cc, a.nc, a.n])));
console.log('villes', list.length, '· pays', countryList.length, '· aéroports', airports.length);
