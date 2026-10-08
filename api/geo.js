// Recherche de pays et de villes du monde entier (données locales, sans appel externe).
import cities from 'all-the-cities';
import airportData from 'airport-data-js';


const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });
const countryName = (code) => { try { return regionNames.of(code) || code; } catch { return code; } };

// Noms français usuels -> nom présent dans la base.
const ALIASES = [
  ['Londres', 'London', 'GB'], ['Moscou', 'Moscow', 'RU'], ['Le Caire', 'Cairo', 'EG'], ['Pékin', 'Beijing', 'CN'], ['Venise', 'Venice', 'IT'], ['Gênes', 'Genoa', 'IT'],
  ['Bruxelles', 'Brussels', 'BE'], ['Anvers', 'Antwerp', 'BE'], ['Genève', 'Geneva', 'CH'], ['Vienne', 'Vienna', 'AT'], ['Varsovie', 'Warsaw', 'PL'], ['Cracovie', 'Krakow', 'PL'],
  ['Athènes', 'Athens', 'GR'], ['Copenhague', 'Copenhagen', 'DK'], ['Saint-Pétersbourg', 'Saint Petersburg', 'RU'], ['Kiev', 'Kyiv', 'UA'], ['Bucarest', 'Bucharest', 'RO'],
  ['Le Cap', 'Cape Town', 'ZA'], ['Alger', 'Algiers', 'DZ'], ['Tanger', 'Tangier', 'MA'], ['La Nouvelle-Orléans', 'New Orleans', 'US'], ['Canton', 'Guangzhou', 'CN'],
  ['Bombay', 'Mumbai', 'IN'], ['Katmandou', 'Kathmandu', 'NP'], ['Singapour', 'Singapore', 'SG'], ['Séoul', 'Seoul', 'KR'], ['Jérusalem', 'Jerusalem', 'IL'], ['Damas', 'Damascus', 'SY'],
  ['Bagdad', 'Baghdad', 'IQ'], ['Téhéran', 'Tehran', 'IR'], ['Francfort', 'Frankfurt', 'DE'], ['Hambourg', 'Hamburg', 'DE'], ['Édimbourg', 'Edinburgh', 'GB'],
  ['Lisbonne', 'Lisbon', 'PT'], ['Bâle', 'Basel', 'CH'], ['Berne', 'Bern', 'CH'], ['Saint-Domingue', 'Santo Domingo', 'DO'], ['La Havane', 'Havana', 'CU'],
  ['Nouméa', 'Noumea', 'NC'], ['Majorque', 'Palma', 'ES'], ['Munich', 'Munich', 'DE'], ['Cologne', 'Cologne', 'DE'], ['Rome', 'Rome', 'IT'], ['Milan', 'Milan', 'IT'], ['Naples', 'Naples', 'IT'],
  ['Florence', 'Florence', 'IT'], ['Turin', 'Turin', 'IT'], ['Marseille', 'Marseille', 'FR'], ['Lyon', 'Lyon', 'FR'], ['Nice', 'Nice', 'FR'], ['Paris', 'Paris', 'FR'],
];

// Pays d'Afrique (codes ISO) : les vols relient la France et l'Afrique.
export const AFRICA = new Set(['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW']);
// La France comprend l'outre-mer : ses aéroports et villes apparaissent sous « France ».
const FR_GROUP = new Set(['FR', 'RE', 'GP', 'MQ', 'GF', 'YT', 'PM', 'BL', 'MF', 'NC', 'PF', 'WF', 'TF']);
const sameCountry = (rowCc, wanted) => !wanted || rowCc === wanted || (wanted === 'FR' && FR_GROUP.has(rowCc));
const shownCc = (cc) => (FR_GROUP.has(cc) ? 'FR' : cc);
const inRegion = (cc, region) => !region || (region === 'africa' && AFRICA.has(cc));

let index = null;
const build = () => {
  const countries = new Map();
  const list = [];
  for (const c of cities) {
    if (!c.name || !c.country) continue;
    list.push({ name: c.name, n: norm(c.name), cc: c.country, pop: c.population || 0, lon: c.loc?.coordinates?.[0], lat: c.loc?.coordinates?.[1] });
    if (!countries.has(c.country)) countries.set(c.country, countryName(c.country));
  }
  list.sort((a, b) => b.pop - a.pop);
  const countryList = [...countries].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const byName = new Map();
  for (const e of list) { const k = `${e.n}|${e.cc}`; if (!byName.has(k)) byName.set(k, e); }
  index = { list, countryList, byName };
  return index;
};

export const listCountries = (region = '') => (index || build()).countryList.filter(c => inRegion(c.code, region));
export const countryCodeByName = (name) => { const n = norm(name); return (index || build()).countryList.find(c => norm(c.name) === n)?.code || null; };

export function searchCities(q, countryCode = '', limit = 10, region = '') {
  const { list, byName } = index || build();
  const needle = norm(q);
  const cc = String(countryCode || '').toUpperCase();
  if (needle.length < 2) {
    if (needle.length) return [];
    const popular = [];
    for (const e of list) {
      if (popular.length >= limit) break;
      if (sameCountry(e.cc, cc) && inRegion(e.cc, region)) popular.push({ name: e.name, country: shownCc(e.cc), countryName: countryName(shownCc(e.cc)), label: `${e.name}, ${countryName(shownCc(e.cc))}` });
    }
    return popular;
  }
  const out = [];
  const seen = new Set();
  const push = (name, e, display = name) => {
    const key = `${norm(display)}|${e.cc}`;
    if (seen.has(key)) return;
    seen.add(key);
    const cn = countryName(shownCc(e.cc));
    out.push({ name: display, country: shownCc(e.cc), countryName: cn, label: `${display}, ${cn}` });
  };
  for (const [fr, en, aliasCc] of ALIASES) {
    if (out.length >= limit) break;
    if (norm(fr).startsWith(needle)) {
      const e = byName.get(`${norm(en)}|${aliasCc}`);
      if (e && sameCountry(e.cc, cc) && inRegion(e.cc, region)) { push(en, e, fr); seen.add(`${norm(en)}|${e.cc}`); }
    }
  }
  for (const e of list) {
    if (out.length >= limit) break;
    if (!sameCountry(e.cc, cc) || !inRegion(e.cc, region)) continue;
    if (e.n.startsWith(needle)) push(e.name, e);
  }
  if (out.length < limit && needle.length >= 3) {
    for (const e of list) {
      if (out.length >= limit) break;
      if (!sameCountry(e.cc, cc) || !inRegion(e.cc, region)) continue;
      if (!e.n.startsWith(needle) && e.n.includes(needle)) push(e.name, e);
    }
  }
  return out;
}

const airportOut = (a) => ({ iata: a.iata, name: a.name, city: a.city, country: shownCc(a.cc), countryName: countryName(shownCc(a.cc)) });

const dist2 = (lat1, lon1, lat2, lon2) => { const dx = (lon1 - lon2) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180); const dy = lat1 - lat2; return dx * dx + dy * dy; };
const TYPE_RANK = { large_airport: 0, medium_airport: 1, small_airport: 2, seaplane_base: 3 };

// Tous les aéroports ayant un code IATA (internationaux comme nationaux), la ville étant déduite du lieu le plus proche.
let airportsPromise = null;
function loadAirports() {
  airportsPromise ||= (async () => {
    const { list, countryList } = index || build();
    const byCountry = new Map();
    for (const c of list) { if (c.lat == null) continue; (byCountry.get(c.cc) || byCountry.set(c.cc, []).get(c.cc)).push(c); }
    const out = [];
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
        // la ville citée dans le nom de l'aéroport (Grenoble Alpes Isère), sinon la plus grande ville à ~65 km (Dakar pour Diass), sinon le lieu le plus proche
        const city = named || big || best;
        const cityName = city?.name || a.airport;
        out.push({ iata: a.iata, name: a.airport, city: cityName, cc: code, nc: norm(cityName), n: norm(`${a.iata} ${a.airport} ${cityName}`), pop: city?.pop || 0, rank: (TYPE_RANK[a.type] ?? 4) });
      }
    }
    out.sort((x, y) => x.rank - y.rank || y.pop - x.pop);
    return out;
  })();
  return airportsPromise;
}

export async function searchAirports(q, { countryCode = '', city = '', limit = 10, region = '' } = {}) {
  const airports = await loadAirports();
  const needle = norm(q);
  const cc = String(countryCode || '').toUpperCase();
  const cityN = norm(city);
  const out = [];
  const add = (a) => { if (out.length < limit && !out.includes(a)) out.push(a); };
  if (!needle) {
    if (cityN) airports.filter(a => a.nc === cityN && sameCountry(a.cc, cc) && inRegion(a.cc, region)).forEach(add);
    airports.filter(a => sameCountry(a.cc, cc) && inRegion(a.cc, region)).forEach(add);
    return out.map(airportOut);
  }
  const upper = String(q).trim().toUpperCase();
  if (upper.length === 3) airports.filter(a => a.iata === upper && sameCountry(a.cc, cc) && inRegion(a.cc, region)).forEach(add);
  for (const a of airports) { if (!sameCountry(a.cc, cc) || !inRegion(a.cc, region)) continue; if (a.iata.toLowerCase().startsWith(needle) || a.nc.startsWith(needle)) add(a); }
  for (const a of airports) { if (!sameCountry(a.cc, cc) || !inRegion(a.cc, region)) continue; if (a.n.includes(needle)) add(a); }
  return out.map(airportOut);
}

// Recherche mélangée (aéroports + villes) pour les formulaires de voyage.
export async function searchPlaces(q, limit = 12, countryCode = '') {
  const needle = norm(q);
  const cc = String(countryCode || '').toUpperCase();
  if (!needle) {
    // pays imposé (ex. France) : tous les aéroports du pays puis ses villes les plus peuplées
    if (cc) return { airports: await searchAirports('', { countryCode: cc, limit: 600 }), cities: searchCities('', cc, 300) };
    return { airports: [], cities: searchCities('', '', limit) };
  }
  const airports = await searchAirports(q, { countryCode: cc, limit: 5 });
  const cities = searchCities(q, cc, limit - airports.length);
  return { airports, cities };
}

loadAirports().catch(() => {});
