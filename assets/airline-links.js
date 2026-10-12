/* Liens vers le site des compagnies : le même trajet, les mêmes dates, les mêmes voyageurs que l'offre affichée.
   Partagé par le site public, le back-office et le serveur (window.TVAirline / globalThis.TVAirline).

   resolve(offer, { adults, cabin, oneway }) → { url, mode }
     mode « exact »  : lien fabriqué à partir de l'offre (compagnies dont le format est vérifié : Air France, KLM, easyJet)
     mode « saved »  : lien enregistré par l'agent (il a fait la recherche sur le site de la compagnie)
   analyze(offer)    → { level, checks[], url, mode }
     level : exact · ok (aéroports et dates retrouvés dans le lien) · partial · unverified · weak (page d'accueil) · none */
(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const iataOf = (s) => (String(s || '').match(/\b([A-Z]{3})\b/) || [])[1] || '';
  const day = (d) => (!d ? '' : d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : String(d).slice(0, 10));
  const compact = (d) => day(d).replace(/-/g, '');

  // Villes qui ont un code « ville » distinct de celui de leurs aéroports (format Air France / KLM).
  const CITY = { CDG: 'PAR', ORY: 'PAR', BVA: 'PAR', LHR: 'LON', LGW: 'LON', STN: 'LON', LTN: 'LON', LCY: 'LON', SEN: 'LON', JFK: 'NYC', EWR: 'NYC', LGA: 'NYC', FCO: 'ROM', CIA: 'ROM', MXP: 'MIL', LIN: 'MIL', BGY: 'MIL', IAD: 'WAS', DCA: 'WAS', BWI: 'WAS', ORD: 'CHI', MDW: 'CHI', NRT: 'TYO', HND: 'TYO', GRU: 'SAO', CGH: 'SAO', GIG: 'RIO', SDU: 'RIO', EZE: 'BUE', AEP: 'BUE', ARN: 'STO', BMA: 'STO', YUL: 'YMQ', YYZ: 'YTO', IST: 'IST', SAW: 'IST' };
  const CABIN = { 'economique': 'ECONOMY', 'economique premium': 'PREMIUM', 'premium': 'PREMIUM', 'affaires': 'BUSINESS', 'business': 'BUSINESS', 'premiere': 'FIRST', 'first': 'FIRST' };
  const cabinCode = (c) => CABIN[norm(c)] || 'ECONOMY';

  const afKlm = (host) => (p) => {
    const place = (code) => (CITY[code] && code !== 'IST' ? `${CITY[code]}:C` : `${code}:A`);
    const a = place(p.from), b = place(p.to);
    const out = `${a}:${compact(p.depart)}>${b.split(':')[0]}:${b.split(':')[1]}`;
    const conn = p.oneway || !p.ret ? out : `${out}-${b}:${compact(p.ret)}>${a}`;
    return `https://${host}/search/offers?pax=${p.adults}:0:0:0:0:0:0:0&cabinClass=${cabinCode(p.cabin)}&activeConnection=0&connections=${conn.replace(/>/g, '%3E')}&bookingFlow=LEISURE`;
  };
  const BUILDERS = {
    'air france': afKlm('wwws.airfrance.fr'),
    'klm': afKlm('www.klm.fr'),
    'klm royal dutch airlines': afKlm('www.klm.fr'),
    'easyjet': (p) => `https://www.easyjet.com/deeplink?lang=FR&dep=${p.from}&dest=${p.to}&dd=${day(p.depart)}${p.oneway || !p.ret ? '' : `&rd=${day(p.ret)}`}&apax=${p.adults}&cpax=0&ipax=0&isOneWay=${p.oneway || !p.ret ? 'on' : 'off'}`,
  };
  const hasBuilder = (airline) => Boolean(BUILDERS[norm(airline)]);

  // Paramètres de l'offre (aéroports, dates, aller simple ou retour).
  const paramsOf = (o, opts = {}) => {
    const f = o?.flight || o?.details?.flight || {};
    const from = iataOf(f.fromAirport), to = iataOf(f.toAirport);
    const oneway = opts.oneway != null ? Boolean(opts.oneway) : f.tripType === 'oneway';
    return {
      from, to, depart: day(o?.start_date), ret: oneway ? '' : day(o?.end_date), oneway,
      adults: Math.max(1, Math.min(9, Number(opts.adults) || 1)), cabin: opts.cabin && opts.cabin !== 'all' ? opts.cabin : (f.cabin || 'Économique'),
    };
  };
  const buildExact = (o, opts) => {
    const f = o?.flight || o?.details?.flight || {};
    const b = BUILDERS[norm(f.airline)];
    const p = paramsOf(o, opts);
    if (!b || !p.from || !p.to || !p.depart) return null;
    if (!p.oneway && !p.ret) return null;
    return b(p);
  };

  const safeUrl = (u) => { try { const x = new URL(String(u || '').trim()); return /^https?:$/.test(x.protocol) ? x : null; } catch { return null; } };
  // Une page d'accueil (ou presque) ne mène pas à l'offre.
  const isHomepage = (u) => {
    const x = safeUrl(u); if (!x) return true;
    if ([...x.searchParams.keys()].length) return false;
    const parts = x.pathname.split('/').filter(Boolean).filter((s) => !/^([a-z]{2}([-_][a-z]{2})?)$/i.test(s));
    return parts.length === 0 || (parts.length === 1 && /^(accueil|home|index|homepage|flights|vols)$/i.test(parts[0]));
  };

  function resolve(o, opts = {}) {
    const exact = buildExact(o, opts);
    if (exact) return { url: exact, mode: 'exact' };
    const saved = (o?.flight || o?.details?.flight || {}).bookingUrl;
    return { url: saved || '', mode: 'saved' };
  }

  // Dates sous les formes les plus courantes dans les adresses des compagnies.
  const dateForms = (d) => {
    const s = day(d); if (!s) return [];
    const [y, m, dd] = s.split('-'); const yy = y.slice(2);
    const mon = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][Number(m) - 1];
    return [s, `${y}${m}${dd}`, `${dd}-${m}-${y}`, `${dd}/${m}/${y}`, `${dd}.${m}.${y}`, `${y}/${m}/${dd}`, `${dd}${m}${yy}`, `${yy}${m}${dd}`, `${dd}${mon}${y}`, `${dd}${mon}${yy}`, `${Number(dd)}${mon}${y}`];
  };

  function analyze(o, opts = {}) {
    const f = o?.flight || o?.details?.flight || {};
    const p = paramsOf(o, opts);
    const exact = buildExact(o, opts);
    const label = (v) => (v || '—');
    if (exact) {
      return { level: 'exact', url: exact, mode: 'exact', checks: [
        { ok: true, label: 'Trajet', detail: `${p.from} → ${p.to}` },
        { ok: true, label: 'Date aller', detail: p.depart },
        ...(p.oneway ? [] : [{ ok: true, label: 'Date retour', detail: p.ret }]),
        { ok: true, label: 'Voyageurs', detail: `${p.adults} adulte${p.adults > 1 ? 's' : ''} · ${f.cabin || 'Économique'}` },
      ], note: 'Lien fabriqué automatiquement à partir de l’offre : il ouvre la recherche de la compagnie avec exactement ce trajet.' };
    }
    const url = String(f.bookingUrl || '').trim();
    if (!safeUrl(url)) return { level: 'none', url: '', mode: 'saved', checks: [], note: 'Aucun lien de réservation.' };
    if (isHomepage(url)) return { level: 'weak', url, mode: 'saved', checks: [], note: 'Ce lien mène à la page d’accueil de la compagnie, pas à l’offre. Faites la recherche sur son site (même trajet, mêmes dates), puis collez l’adresse de la page de résultats.' };
    const hay = decodeURIComponent(url).toLowerCase().replace(/\s+/g, '');
    const has = (code) => code && hay.includes(String(code).toLowerCase());
    const hasDate = (d) => dateForms(d).some((x) => hay.includes(x.toLowerCase()));
    const checks = [
      { ok: has(p.from), label: 'Départ', detail: label(p.from) },
      { ok: has(p.to), label: 'Arrivée', detail: label(p.to) },
      { ok: hasDate(p.depart), label: 'Date aller', detail: label(p.depart) },
      ...(p.oneway || !p.ret ? [] : [{ ok: hasDate(p.ret), label: 'Date retour', detail: p.ret }]),
    ];
    const good = checks.filter((c) => c.ok).length;
    if (good === checks.length) return { level: 'ok', url, mode: 'saved', checks, note: 'Les aéroports et les dates de l’offre sont bien dans le lien.' };
    if (good > 0) return { level: 'partial', url, mode: 'saved', checks, note: 'Certains éléments de l’offre ne figurent pas dans le lien : ouvrez-le pour vérifier le trajet et les dates.' };
    return { level: 'unverified', url, mode: 'saved', checks, note: 'Le lien ne contient pas le trajet ni les dates en clair (adresse de session) : ouvrez-le et comparez avec l’offre.' };
  }

  root.TVAirline = { resolve, analyze, hasBuilder, isHomepage, buildExact, paramsOf };
})();
