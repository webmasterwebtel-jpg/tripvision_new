/* Listes déroulantes avec recherche : pays, villes et aéroports du monde entier.
   <input data-geo="city" data-geo-country="country">   villes (remplit le champ pays du même formulaire)
   <input data-geo="country">                            pays
   <input data-geo="airport" data-geo-city="fromCity">   aéroports (ceux de la ville liée en premier)
   <input data-geo="place">                              aéroports + villes (recherche de voyage)
   La liste s'ouvre au clic ou au focus, sans rien taper ; taper filtre la liste.
   window.GEO_API fixe la base de l'API (défaut : /api). */
(() => {
  const base = () => window.GEO_API || '/api';
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237b857f' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

  const style = document.createElement('style');
  style.textContent = `
  input[data-geo]{background-image:${CHEVRON};background-repeat:no-repeat;background-position:right 12px center;background-size:15px;padding-right:36px!important;cursor:pointer}
  input[data-geo]:focus{cursor:text}
  .geo-list{position:fixed;z-index:100001;margin:0;padding:6px;list-style:none;overflow-y:auto;background:#fff;border:1px solid #ddd6c9;border-radius:12px;box-shadow:0 18px 44px -14px rgba(0,0,0,.35);text-align:left;font-family:inherit}
  .geo-list[hidden]{display:none}
  .geo-list li{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:14px;line-height:1.3;color:#1f2a24;font-weight:500;text-transform:none;letter-spacing:0}
  .geo-list li strong{font-weight:600}
  .geo-list li span{font-size:12px;color:#7b857f;text-align:right}
  .geo-list li.on,.geo-list li[data-i]:hover{background:#eef2f6}
  .geo-list li.geo-head{cursor:default;padding:8px 12px 4px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7b857f;background:none!important}
  .geo-list .geo-empty{cursor:default;justify-content:center;color:#7b857f}
  .geo-list li.geo-more{justify-content:center;gap:6px;color:#075f4b;font-weight:600;border-top:1px solid #efebe3;margin-top:4px;border-radius:0 0 8px 8px}.geo-list li.geo-more:hover{background:#eef6f2}.geo-list li.geo-more span{color:#7b857f;font-weight:500}
  .geo-list .geo-code{display:inline-block;min-width:34px;margin-right:8px;padding:1px 6px;border-radius:5px;background:#eef2f6;font-size:11.5px;font-weight:700;letter-spacing:.04em;color:#44505a}`;
  document.head.appendChild(style);

  const countryCache = {};
  const getCountries = (region = '') => (countryCache[region] ||= fetch(`${base()}/geo/countries${region ? `?region=${region}` : ''}`).then((r) => r.json()).catch(() => []));
  const getJson = (path) => fetch(`${base()}${path}`).then((r) => (r.ok ? r.json() : []));

  let list = null, active = null, items = [], idx = -1, timer = 0, seq = 0;

  function ensureList() {
    if (list) return list;
    list = document.createElement('ul');
    list.className = 'geo-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    document.body.appendChild(list);
    list.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const more = e.target.closest('li.geo-more');
      if (more) { expanded.set(more.dataset.more, (expanded.get(more.dataset.more) || 0) + 10); show(lastRows); return; }
      const li = e.target.closest('li[data-i]');
      if (li) choose(Number(li.dataset.i));
    });
    return list;
  }

  const sibling = (input, attr) => {
    const name = input.dataset[attr];
    return name ? input.form?.elements.namedItem(name) || null : null;
  };

  function place() {
    if (!active || !list || list.hidden) return;
    const r = active.getBoundingClientRect();
    list.style.left = `${r.left}px`;
    list.style.top = `${r.bottom + 4}px`;
    list.style.width = `${Math.max(r.width, 300)}px`;
    list.style.maxHeight = `${Math.max(160, Math.min(340, window.innerHeight - r.bottom - 16))}px`;
  }

  /* rows : { kind:'row'|'head', ... }
     Chaque rubrique ne montre que quelques lignes ; « Voir plus » déroule le reste. */
  const SHOWN = 6;
  let lastRows = [], expanded = new Map(), lastText = null;
  function show(rows) {
    lastRows = rows;
    const out = [];
    let section = { key: '', rows: [] };
    const flush = () => {
      const shown = SHOWN + (expanded.get(section.key) || 0);
      const list = section.rows;
      // « Voir plus » ajoute 10 lignes à la fois (inutile de dérouler des centaines de villes d'un coup).
      if (list.length > shown + 1) { out.push(...list.slice(0, shown), { kind: 'more', key: section.key, count: list.length - shown }); } else out.push(...list);
    };
    for (const r of rows) {
      if (r.kind === 'head') { flush(); out.push(r); section = { key: r.label, rows: [] }; } else section.rows.push(r);
    }
    flush();
    items = out.filter((r) => r.kind === 'row');
    idx = -1;
    const l = ensureList();
    let n = 0;
    l.innerHTML = out.length
      ? out.map((r) => (r.kind === 'head' ? `<li class="geo-head">${esc(r.label)}</li>` : r.kind === 'more' ? `<li class="geo-more" data-more="${esc(r.key)}">Voir plus <span>+${r.count}</span></li>` : `<li role="option" data-i="${n++}">${r.html}</li>`)).join('')
      : '<li class="geo-empty">Aucun résultat</li>';
    l.hidden = false;
    place();
  }

  function hide() {
    if (list) list.hidden = true;
    items = [];
    idx = -1;
  }

  function choose(i) {
    const r = items[i];
    if (!r || !active) return;
    const input = active;
    input.value = r.value;
    if (r.code !== undefined) input.dataset.code = r.code;
    if (r.country && input.dataset.geoCountry) {
      const link = sibling(input, 'geoCountry');
      if (link) { link.value = r.countryName; link.dataset.code = r.country; }
    }
    if (r.city && input.dataset.geo === 'airport') {
      const link = sibling(input, 'geoCity');
      if (link && !link.value) { link.value = r.city; link.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    hide();
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function move(delta) {
    if (!items.length) return;
    idx = (idx + delta + items.length) % items.length;
    [...list.querySelectorAll('li[data-i]')].forEach((li, n) => {
      li.classList.toggle('on', n === idx);
      if (n === idx) li.scrollIntoView({ block: 'nearest' });
    });
  }

  // Aéroports proposés sans saisie (France, Afrique, grandes escapades) quand la recherche est limitée aux aéroports.
  const POPULAR_AIRPORTS = [['CDG', 'Paris-Charles de Gaulle', 'Paris', 'France'], ['ORY', 'Paris-Orly', 'Paris', 'France'], ['LYS', 'Lyon-Saint-Exupéry', 'Lyon', 'France'], ['MRS', 'Marseille-Provence', 'Marseille', 'France'], ['NCE', 'Nice-Côte d’Azur', 'Nice', 'France'], ['TLS', 'Toulouse-Blagnac', 'Toulouse', 'France'], ['BOD', 'Bordeaux-Mérignac', 'Bordeaux', 'France'], ['NTE', 'Nantes-Atlantique', 'Nantes', 'France'], ['LIL', 'Lille-Lesquin', 'Lille', 'France'],
    ['DSS', 'Blaise Diagne', 'Dakar', 'Sénégal'], ['ABJ', 'Félix Houphouët-Boigny', 'Abidjan', 'Côte d’Ivoire'], ['DLA', 'Douala', 'Douala', 'Cameroun'], ['CMN', 'Mohammed V', 'Casablanca', 'Maroc'], ['RAK', 'Marrakech-Ménara', 'Marrakech', 'Maroc'], ['TUN', 'Tunis-Carthage', 'Tunis', 'Tunisie'], ['ALG', 'Houari Boumediene', 'Alger', 'Algérie'], ['LBV', 'Léon-Mba', 'Libreville', 'Gabon'], ['BZV', 'Maya-Maya', 'Brazzaville', 'Congo'], ['COO', 'Cadjehoun', 'Cotonou', 'Bénin'],
    ['BCN', 'Barcelone-El Prat', 'Barcelone', 'Espagne'], ['MAD', 'Madrid-Barajas', 'Madrid', 'Espagne'], ['LIS', 'Lisbonne', 'Lisbonne', 'Portugal'], ['FCO', 'Rome-Fiumicino', 'Rome', 'Italie'], ['AMS', 'Amsterdam-Schiphol', 'Amsterdam', 'Pays-Bas'], ['IST', 'Istanbul', 'Istanbul', 'Turquie'], ['LHR', 'Londres-Heathrow', 'Londres', 'Royaume-Uni'], ['ATH', 'Athènes', 'Athènes', 'Grèce']]
    .map(([iata, name, city, countryName]) => ({ iata, name, city, countryName, country: '' }));
  const cityRow = (c) => ({ kind: 'row', value: c.name, country: c.country, countryName: c.countryName, html: `<strong>${esc(c.name)}</strong><span>${esc(c.countryName)}</span>` });
  const airportRow = (a, mode) => ({
    kind: 'row', value: mode === 'place' ? `${a.city} (${a.iata})` : `${a.iata} – ${a.name}`, city: a.city, country: a.country, countryName: a.countryName,
    html: `<strong><span class="geo-code">${esc(a.iata)}</span>${esc(a.name)}</strong><span>${esc(a.city)}, ${esc(a.countryName)}</span>`,
  });

  async function search(input) {
    const mine = ++seq;
    const type = input.dataset.geo;
    const text = input.value.trim();
    const needle = norm(text);
    if (text !== lastText) { expanded.clear(); lastText = text; }
    try {
      // Vols : seulement les aéroports de nos offres, filtrés en tapant (aucune autre destination n'est cherchée).
      if (type === 'place' && input.dataset.geoOnly === 'offers') {
        const side = /^from/i.test(input.name) ? 'from' : 'to';
        const all = window.TV_OFFER_PLACES?.[`${side}Air`] || [];
        const rows = all.filter((c) => !needle || norm(c.name).includes(needle));
        if (mine !== seq || active !== input) return;
        const code = (n) => (String(n).match(/\(([A-Z]{3})\)\s*$/) || [])[1] || '';
        show(rows.length
          ? [{ kind: 'head', label: side === 'from' ? 'Aéroports de départ de nos offres' : 'Aéroports d’arrivée de nos offres' }, ...rows.map((c) => ({ kind: 'row', value: c.name, html: `<strong><span class="geo-code">${esc(code(c.name))}</span>${esc(String(c.name).replace(/\s*\([A-Z]{3}\)\s*$/, ''))}</strong><span>Aéroport</span>` }))]
          : [{ kind: 'head', label: all.length ? 'Aucun aéroport ne correspond' : 'Aucun vol publié pour le moment' }]);
        return;
      }
      if (type === 'country') {
        const all = await getCountries(input.dataset.geoRegion || '');
        if (mine !== seq) return;
        const starts = all.filter((c) => norm(c.name).startsWith(needle));
        const rows = needle ? starts.concat(all.filter((c) => !starts.includes(c) && norm(c.name).includes(needle))) : all;
        show([...(needle ? [] : [{ kind: 'head', label: `${all.length} pays` }]), ...rows.map((c) => ({ kind: 'row', value: c.name, code: c.code, html: `<strong>${esc(c.name)}</strong><span>${esc(c.code)}</span>` }))]);
        return;
      }
      const link = sibling(input, 'geoCountry');
      const cc = link && link.value && link.dataset.code ? link.dataset.code : '';
      const region = input.dataset.geoRegion ? `&region=${input.dataset.geoRegion}` : '';
      if (type === 'city') {
        const rows = await getJson(`/geo/cities?q=${encodeURIComponent(text)}${cc ? `&country=${cc}` : ''}${region}`);
        if (mine !== seq || active !== input) return;
        show([...(needle ? [] : [{ kind: 'head', label: 'Villes les plus peuplées · tapez pour rechercher' }]), ...rows.map(cityRow)]);
      } else if (type === 'airport') {
        const city = sibling(input, 'geoCity')?.value || '';
        const rows = await getJson(`/geo/airports?q=${encodeURIComponent(text)}${city ? `&city=${encodeURIComponent(city)}` : ''}${input.dataset.geoRegion ? `&region=${input.dataset.geoRegion}` : ''}${cc ? `&country=${cc}` : ''}`);
        if (mine !== seq || active !== input) return;
        show([...(needle ? [] : [{ kind: 'head', label: cc ? `${rows.length} aéroports${city ? ` · ${city} en premier` : ''} · tapez pour rechercher` : (city ? `Aéroports · ${city} en premier` : 'Principaux aéroports · tapez pour rechercher') }]), ...rows.map((a) => airportRow(a, 'airport'))]);
      } else if (type === 'place') {
        const d = await getJson(`/geo/places?q=${encodeURIComponent(text)}${input.dataset.geoFixed ? `&country=${input.dataset.geoFixed}` : ''}`);
        if (mine !== seq || active !== input) return;
        const cities = d.cities || [];
        let airports = d.airports || [];
        if (input.dataset.geoOnly === 'airports' && !needle && !airports.length) airports = POPULAR_AIRPORTS;
        const side = /^from/i.test(input.name) ? 'from' : /^to/i.test(input.name) ? 'to' : '';
        // Sans saisie : nos destinations (France, Afrique, grandes escapades) plutôt que les villes les plus peuplées du monde.
        const taken = new Set((window.TV_OFFER_PLACES?.[side] || []).map((c) => norm(c.name)));
        const curated = !needle && !input.dataset.geoOnly && !input.dataset.geoFixed && Array.isArray(window.TV_DEST) ? window.TV_DEST.filter((d) => !taken.has(norm(d.name))).map((d) => ({ kind: 'row', value: d.name, country: '', html: `<strong>${esc(d.name)}</strong><span>${esc(d.country)}</span>` })) : [];
        const airportsOnly = input.dataset.geoOnly === 'airports';
        const ours = !needle && side && window.TV_OFFER_PLACES?.[airportsOnly ? `${side}Air` : side]?.length ? window.TV_OFFER_PLACES[airportsOnly ? `${side}Air` : side] : [];
        show([
          ...(ours.length ? [{ kind: 'head', label: side === 'from' ? 'Départs proposés par nos offres' : 'Destinations de nos offres' }, ...ours.map((c) => ({ kind: 'row', value: c.name, html: `<strong>${esc(c.name)}</strong><span>${esc(c.country || 'Offres disponibles')}</span>` }))] : []),
          ...(airports.length ? [{ kind: 'head', label: input.dataset.geoFixed && !needle ? `${airports.length} aéroports en France` : (needle ? 'Aéroports' : 'Principaux aéroports · tapez une ville ou un code') }, ...airports.map((a) => airportRow(a, 'place'))] : []),
          ...(input.dataset.geoOnly === 'airports' ? [] : [{ kind: 'head', label: needle ? 'Villes' : (input.dataset.geoFixed ? 'Villes de France les plus peuplées · tapez pour rechercher' : 'Destinations populaires · tapez pour rechercher') }, ...(curated.length ? curated : cities.map(cityRow))]),
        ]);
      }
    } catch { hide(); }
  }

  const isGeo = (el) => el && el.matches && el.matches('input[data-geo]');
  const open = (input) => {
    active = input;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('role', 'combobox');
    if (input.dataset.geo === 'country') delete input.dataset.codeStale;
    search(input);
  };

  document.addEventListener('focusin', (e) => { if (isGeo(e.target)) open(e.target); });
  document.addEventListener('click', (e) => { if (isGeo(e.target) && (!list || list.hidden || active !== e.target)) open(e.target); });

  document.addEventListener('input', (e) => {
    if (!isGeo(e.target)) return;
    active = e.target;
    if (active.dataset.geo === 'country') delete active.dataset.code;
    clearTimeout(timer);
    timer = setTimeout(() => search(active), active.dataset.geo === 'country' ? 0 : 150);
  });

  document.addEventListener('focusout', (e) => {
    if (!isGeo(e.target)) return;
    hide();
    seq++;
    if (e.target.dataset.geo === 'country' && !e.target.dataset.code && e.target.value) {
      getCountries().then((all) => {
        const hit = all.find((c) => norm(c.name) === norm(e.target.value));
        if (hit) { e.target.value = hit.name; e.target.dataset.code = hit.code; }
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!isGeo(e.target)) return;
    if (e.key === 'ArrowDown' && (!list || list.hidden)) { e.preventDefault(); open(e.target); return; }
    if (!list || list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); e.stopPropagation(); choose(idx); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(); }
  }, true);

  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
})();
