/* Location de voitures (site public) : catégories, résultats, filtres, détail et parcours de réservation.
   Tout ce qui est affiché (inclus dans le prix, protection, options, conditions de location) est saisi par le loueur ou le back-office. */
(() => {
  const E = (v) => escapeHtml(v);
  const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const I = {
    seat: svg('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
    bag: svg('<rect x="5" y="8" width="14" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    door: svg('<path d="M6 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14M6 20h12M14 12h2"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'),
    snow: svg('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>'),
    fuel: svg('<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>'),
    box: svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4m0 10V11m9-4-9 4"/>'),
    pin: svg('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    shield: svg('<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
    cal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    arrow: svg('<path d="M5 12h14m-5-5 5 5-5 5"/>'),
    back: svg('<path d="M19 12H5m5-5-5 5 5 5"/>'),
    child: svg('<circle cx="12" cy="6.5" r="2.5"/><path d="M8 20v-5a4 4 0 0 1 8 0v5M6 20h12M9.5 12.5 7 10M14.5 12.5 17 10"/>'),
    booster: svg('<path d="M4 17h16v3H4zM6 17v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 13H4v-3h3"/>'),
    gps: svg('<path d="m4 11 16-7-7 16-2-7z"/>'),
    wifi: svg('<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>'),
    driver: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3.2 3.2 0 0 1 0 6M18 14.5a6 6 0 0 1 3 5.5"/>'),
    rack: svg('<path d="M3 11h18M6 11V8h12v3M5 14l2 3h10l2-3"/>'),
    doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>'),
  };

  const optIcon = (x) => {
    const k = `${x.key} ${x.name}`.toLowerCase();
    return k.includes('rehauss') || k.includes('booster') ? I.booster : k.includes('enfant') || k.includes('child') ? I.child : k.includes('gps') ? I.gps : k.includes('wi-fi') || k.includes('wifi') ? I.wifi
      : k.includes('conducteur') || k.includes('driver') ? I.driver : k.includes('bagage') || k.includes('rack') || k.includes('coffre') ? I.rack : I.plus;
  };
  // Requête des véhicules disponibles sur la période choisie (dates et heures du formulaire).
  function carsPath() {
    const s = S();
    const f = document.getElementById('carSearchForm')?.elements;
    const params = new URLSearchParams({ city: cleanPlace(search.pickup || f?.pickup?.value || ''), category: search.category || 'all' });
    if (s.startDate && s.endDate) { params.set('start', `${s.startDate}T${s.startTime}`); params.set('end', `${s.endDate}T${s.endTime}`); }
    return `/public/vehicles?${params}`;
  }
  /* ---------- Catégories (gérées dans le back-office) ---------- */
  let CATS = [];
  const catImage = (name) => CATS.find((c) => c.name === name)?.image || '';
  window.addEventListener('load', () => {
    api('/public/categories').then((l) => {
      CATS = Array.isArray(l) ? l : [];
      const sel = document.querySelector('#carSearchForm select[name=category]');
      if (sel && CATS.length) sel.innerHTML = '<option value="all">Toutes</option>' + CATS.map((c) => `<option>${E(c.name)}</option>`).join('');
      renderCatIntro();
      renderCars();
    }).catch(() => {});
  });
  /* ---------- Après 10 minutes d'inactivité, la page Voitures redevient vierge ---------- */
  const IDLE_MS = 15 * 60 * 1000;
  let lastActivity = Date.now();
  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true }));
  function resetCars() {
    searched = false;
    try { sessionStorage.removeItem('tvCarSearch'); } catch { /* rien */ }
    Object.assign(F, FRESH());
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const t = new Date(), n = new Date(t.getTime() + 864e5);
    const f = document.getElementById('carSearchForm')?.elements;
    if (f) { f.pickup.value = ''; f.startDate.value = iso(t); f.endDate.value = iso(n); if (f.category) f.category.value = 'all'; }
    search = { ...search, pickup: '', startDate: '', endDate: '', category: 'all' };
    renderCars();
  }
  const checkIdle = () => {
    if (!searched || Date.now() - lastActivity < IDLE_MS) return;
    const inReserve = document.getElementById('reserve')?.classList.contains('active');
    if (!inReserve) { resetCars(); if (document.getElementById('cars')?.classList.contains('active')) scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  setInterval(checkIdle, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkIdle(); });

  /* ---------- Catégories de véhicules, en page d'accueil des voitures ---------- */
  const CAT_DESC = [[/monospace|minibus/i, 'Familles · 7 places et plus'], [/^mini \(|^mini$/i, 'Citadines · 2 à 4 places'], [/conom/i, 'Petit budget, trajets courts'], [/compact/i, 'Polyvalentes · 5 places'], [/interm/i, 'Confort et grand coffre'], [/routi/i, 'Longs trajets, confort'], [/suv|break/i, 'Espace et position haute'], [/utilit|van/i, 'Charges et déménagement']];
  function renderCatIntro() {
    const box = document.getElementById('carCatIntro');
    if (!box) return;
    const list = CATS.length ? CATS : [];
    box.parentElement.hidden = !list.length;
    box.innerHTML = list.map((c) => {
      const desc = CAT_DESC.find(([re]) => re.test(c.name))?.[1] || '';
      return `<button type="button" class="dest-card cat-intro-card" data-cat-pick="${E(c.name)}"><img src="${E(c.image || '')}" alt="" loading="lazy" decoding="async"><span class="dest-info"><b>${E(c.name)}</b><small>${E(desc)}</small></span><i class="dest-go">→</i></button>`;
    }).join('');
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat-pick]');
    if (!t) return;
    const f = document.getElementById('carSearchForm');
    if (f?.elements.category) f.elements.category.value = t.dataset.catPick;
    f?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  let fetchTimer = 0;
  // Les voitures ne s'affichent qu'une fois la ville et les dates choisies puis la recherche lancée.
  let searched = false;
  window.carsSearched = () => { searched = true; saveSearch(); };
  function saveSearch() { try { sessionStorage.setItem('tvCarSearch', JSON.stringify(S())); } catch { /* rien */ } }
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-car-city]');
    if (!c) return;
    const f = document.getElementById('carSearchForm');
    f.elements.pickup.value = c.dataset.carCity;
    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    f.elements.pickup.dispatchEvent(new Event('change', { bubbles: true }));
  });
  async function fetchCars() {
    try { state.vehicles = await api(carsPath()); } catch (e) { console.error(e); warnApi(); }
    renderCars();
  }
  document.getElementById('carSearchForm')?.addEventListener('change', (e) => {
    if (!['startDate', 'startTime', 'endDate', 'endTime'].includes(e.target.name) || !searched) return;
    clearTimeout(fetchTimer);
    saveSearch();
    fetchTimer = setTimeout(fetchCars, 250);
  });
  const F = { cats: new Set(), gear: '', seats: 0, maxPrice: 0, freeCancel: false, unlimited: false, deposit: '', lessors: new Set(), fuels: new Set(), ac: false, freeMod: false, fullIns: false, bags: 0, minAge: '', sort: 'price' };
  const FRESH = () => ({ priceTouched: false, cats: new Set(), gear: '', seats: 0, maxPrice: 0, freeCancel: false, unlimited: false, deposit: '', lessors: new Set(), fuels: new Set(), ac: false, freeMod: false, fullIns: false, bags: 0, minAge: '' });

  /* ---------- Durée et prix ---------- */
  // Dates de la recherche : celles validées, sinon celles du formulaire (valeurs par défaut comprises).
  function S() {
    const f = document.getElementById('carSearchForm')?.elements;
    const pick = (k) => f?.[k]?.value || search[k] || '';
    return { startDate: pick('startDate'), startTime: pick('startTime') || '10:00', endDate: pick('endDate'), endTime: pick('endTime') || '10:00', pickup: pick('pickup'), age: Number(pick('age')) || 30 };
  }
  function searchMinutes() {
    const s = S();
    if (!s.startDate || !s.endDate) return 1440;
    const a = new Date(`${s.startDate}T${s.startTime}:00`), z = new Date(`${s.endDate}T${s.endTime}:00`);
    const m = Math.round((z - a) / 60000);
    return m > 0 ? m : 1440;
  }
  // Chaque tranche de 24 h entamée est facturée : 24 h 01 = 2 jours.
  const searchDays = () => Math.max(1, Math.ceil(searchMinutes() / 1440));
  function durationText() {
    const m = searchMinutes(), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    return [d ? `${d} j` : '', h ? `${h} h` : '', mi ? `${String(mi).padStart(2, '0')} min` : ''].filter(Boolean).join(' ') || '24 h';
  }
  // Paliers facultatifs (semaine, mois, an) : on retient la formule la moins chère (même règle que le serveur).
  function rentalTotal(v, d) {
    const pd = Number(v.priceDay);
    const tiers = [[30, Number(v.priceMonth)], [7, Number(v.priceWeek)]].filter(([, p]) => p > 0);
    let rest = d, greedy = 0;
    for (const [len, p] of tiers) { const n = Math.floor(rest / len); greedy += n * p; rest -= n * len; }
    greedy += rest * pd;
    return Math.min(d * pd, greedy, ...tiers.map(([len, p]) => Math.ceil(d / len) * p));
  }
  const euro = (n) => `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
  const dayLabel = (d) => `${d} jour${d > 1 ? 's' : ''}`;
  const cancelText = (h) => (h >= 168 ? `${Math.round(h / 24)} jours` : `${h} h`);
  const lessorOf = (v) => v.partner_company || 'TripVision';
  const initialsOf = (t) => String(t).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const dayFmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const find = (id) => state.vehicles.find((x) => String(x.id) === String(id));

  /* ---------- Éléments d'affichage ---------- */
  const specs = (v) => [
    v.passengers && ['seat', `${v.passengers} place${v.passengers > 1 ? 's' : ''}`], v.bags != null && ['bag', `${v.bags} bagage${v.bags > 1 ? 's' : ''}`], v.doors && ['door', `${v.doors} porte${v.doors > 1 ? 's' : ''}`],
    v.transmission && ['gear', v.transmission], v.airConditioning && ['snow', 'Climatisation'], v.fuelType && ['fuel', v.fuelType], v.volumeM3 && ['box', `${v.volumeM3} m³`],
  ].filter(Boolean).map(([k, t]) => `<li>${I[k]}<span>${E(t)}</span></li>`).join('');

  // Supplément jeune conducteur : s'applique si l'âge saisi à la recherche est sous le seuil fixé par le loueur.
  const youngFeeOf = (v, age = S().age) => (Number(v.youngDriverFee) > 0 && v.youngDriverAge && age && age < Number(v.youngDriverAge) ? Number(v.youngDriverFee) : 0);
  // Ce que le loueur a coché comme « inclus dans le prix »
  function includedList(v) {
    const out = [];
    if (v.freeCancelHours > 0) out.push(`Annulation gratuite jusqu’à ${cancelText(v.freeCancelHours)} avant`);
    if (v.freeModification) out.push('Modifications gratuites');
    if (v.theftProtection) out.push('Protection contre le vol');
    if (v.fullInsurance) out.push('Assurance tous risques');
    if (v.insuranceType) out.push(v.insuranceType);
    if (v.taxesIncluded === true) out.push('Taxes locales incluses');
    if (v.unlimitedKm) out.push('Kilométrage illimité');
    else if (v.includedKm) out.push(`Kilométrage inclus : ${v.includedKm}${v.extraKmPrice ? ` (puis ${euro(v.extraKmPrice)} / km)` : ''}`);
    if (v.fuelPolicy) out.push(`Politique carburant : ${v.fuelPolicy}`);
    for (const t of v.includedCustom || []) out.push(t);
    if (v.returnPolicy === 'free') out.push('Restitution dans un autre lieu possible, sans frais');
    return out;
  }
  const checkList = (list) => list.map((t) => `<li>${I.check}<span>${E(t)}</span></li>`).join('');

  function chips(v) {
    const c = [];
    if (v.deposit != null) c.push(v.deposit > 0 ? `Dépôt de garantie ${euro(v.deposit)}` : 'Sans dépôt de garantie');
    if (v.excess) c.push(`Franchise ${euro(v.excess)}`);
    if (v.minAge) c.push(`Conducteur ${v.minAge} ans min.`);
    if (youngFeeOf(v)) c.push(`Moins de ${v.youngDriverAge} ans : + ${euro(v.youngDriverFee)}${v.youngDriverPricing === 'once' ? '' : ' / jour'}`);
    if (v.returnPolicy === 'fee') c.push(`Autre lieu de retour : + ${euro(v.returnFee)}`);
    return c.map((t) => `<li>${E(t)}</li>`).join('');
  }

  /* ---------- Catégories (tuiles) ---------- */
  function renderTiles() {
    const box = document.getElementById('carTiles');
    if (!box) return;
    const d = searchDays();
    const byCat = new Map();
    for (const v of state.vehicles) {
      const t = rentalTotal(v, d);
      const cur = byCat.get(v.category);
      if (!cur || t < cur.total) byCat.set(v.category, { total: t, vimg: (v.images?.[0] || v.image) });
    }
    // Toutes les catégories du back-office, dans leur ordre ; celles sans offre sur cette recherche sont grisées.
    const names = [...CATS.map((c) => c.name), ...[...byCat.keys()].filter((n) => !CATS.some((c) => c.name === n))];
    const ph = '<svg class="cat-ph" viewBox="0 0 80 36" aria-hidden="true"><path d="M8 26v-6l6-2 8-9h26l10 9 12 2v6" fill="none" stroke="#c9c3b6" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24" cy="27" r="5" fill="#fff" stroke="#c9c3b6" stroke-width="2.5"/><circle cx="58" cy="27" r="5" fill="#fff" stroke="#c9c3b6" stroke-width="2.5"/></svg>';
    box.innerHTML = names.map((name) => {
      const hit = byCat.get(name);
      const img = catImage(name) || hit?.vimg || '';
      const on = F.cats.has(name);
      return `<button type="button" class="cat-tile ${on ? 'on' : ''} ${hit ? '' : 'off'}" ${hit ? `data-cat="${E(name)}"` : 'disabled'}>
        <span class="cat-name">${E(name)}</span><span class="cat-img">${img ? `<img src="${E(img)}" alt="" loading="lazy">` : ph}</span>
        <span class="cat-from"><span><small>${hit ? 'À partir de' : 'Aucune offre'}</small><b>${hit ? euro(hit.total) : '—'}</b></span><i class="cat-go">→</i></span>${on ? '<i class="cat-check">✓</i>' : ''}</button>`;
    }).join('');
    box.hidden = !names.length;
  }

  /* ---------- Cartes de résultats ---------- */
  function card(v) {
    const d = searchDays(), total = rentalTotal(v, d), per = total / d;
    const old = v.oldPriceDay && Number(v.oldPriceDay) > Number(v.priceDay) ? Number(v.oldPriceDay) * d : null;
    const lessor = lessorOf(v);
    const place = [v.city && v.city !== v.pickupAddress ? v.city : '', v.country].filter(Boolean).join(', ') || v.pickupAddress;
    const inc = includedList(v).slice(0, 5);
    return `<article class="rent-card" data-vehicle-id="${v.id}">
      <div class="rent-media">${TVGallery.html(v.images?.length ? v.images : [v.image], v.name || v.model, { spin: v.spin })}<span class="rent-cat">${E(v.category)}</span>${old ? `<span class="rent-flag deal">-${Math.round((1 - total / old) * 100)} %</span>` : ''}</div>
      <div class="rent-body">
        <header><h3>${E(v.name || v.model)} <small>ou similaire</small></h3><p class="rent-lessor"><span class="lessor-av">${E(initialsOf(lessor))}</span><span>Proposé par <b>${E(lessor)}</b></span><span class="dot">·</span>${I.pin}${E(place)}</p></header>
        <ul class="rent-specs">${specs(v)}</ul>
        ${inc.length ? `<ul class="rent-inc">${checkList(inc)}</ul>` : ''}
        <ul class="rent-chips">${chips(v)}</ul>
        <div class="rent-links">${v.rentalConditions ? `<button class="rent-link" type="button" data-car-terms="${v.id}">Conditions de location</button>` : ''}</div>
      </div>
      <aside class="rent-price"><small>Prix pour ${dayLabel(d)}</small>${old ? `<s>${euro(old)}</s>` : ''}<strong>${euro(total)}</strong><span>soit ${euro(per)} / jour</span><button class="btn" type="button" data-book="${v.id}">Réserver ${I.arrow}</button></aside>
    </article>`;
  }

  /* ---------- Filtres et tri ---------- */
  const fuelOf = (v) => String(v.fuelType || '').trim() || 'Non précisé';
  function filtered() {
    const rows = state.vehicles.filter((v) => {
      if (F.cats.size && !F.cats.has(v.category)) return false;
      if (F.gear && v.transmission !== F.gear) return false;
      if (F.seats && Number(v.passengers || 0) < F.seats) return false;
      if (F.maxPrice && Number(v.priceDay) > F.maxPrice) return false;
      if (F.freeCancel && !(v.freeCancelHours > 0)) return false;
      if (F.unlimited && !v.unlimitedKm) return false;
      if (F.deposit === '0' && !(v.deposit === 0)) return false;
      if (F.deposit && F.deposit !== '0' && !(v.deposit != null && v.deposit <= Number(F.deposit))) return false;
      if (F.lessors.size && !F.lessors.has(lessorOf(v))) return false;
      if (F.fuels.size && !F.fuels.has(fuelOf(v))) return false;
      if (F.ac && !v.airConditioning) return false;
      if (F.freeMod && !v.freeModification) return false;
      if (F.fullIns && !v.fullInsurance) return false;
      if (F.bags && Number(v.bags || 0) < F.bags) return false;
      if (F.minAge && v.minAge && Number(v.minAge) > Number(F.minAge)) return false;
      return true;
    });
    const d = searchDays();
    const by = { price: (a, b) => rentalTotal(a, d) - rentalTotal(b, d), priceDesc: (a, b) => rentalTotal(b, d) - rentalTotal(a, d), seats: (a, b) => (b.passengers || 0) - (a.passengers || 0), cancel: (a, b) => (b.freeCancelHours || 0) - (a.freeCancelHours || 0) || rentalTotal(a, d) - rentalTotal(b, d) };
    return rows.sort(by[F.sort] || by.price);
  }

  function renderFilters() {
    const box = document.getElementById('rentFilters');
    if (!box) return;
    const all = state.vehicles;
    // Toutes les catégories du back-office (même sans offre sur cette recherche), puis celles que seuls les véhicules déclarent.
    const cats = [...CATS.map((c) => c.name), ...[...new Set(all.map((v) => v.category))].filter((n) => !CATS.some((c) => c.name === n)).sort()];
    const nCat = (n) => all.filter((v) => v.category === n).length;
    const fuels = [...new Set(['Essence', 'Diesel', 'Hybride', 'Électrique', ...all.map(fuelOf).filter((x) => x !== 'Non précisé')])];
    const nFuel = (n) => all.filter((v) => fuelOf(v) === n).length;
    const lessors = [...new Set(all.map(lessorOf))].sort();
    const maxPrice = Math.max(90, Math.ceil(Math.max(0, ...all.map((v) => Number(v.priceDay) || 0)) / 10) * 10);
    if (!F.priceTouched || F.maxPrice > maxPrice) F.maxPrice = maxPrice;
    const check = (name, val, label, on, n, off) => `<label class="rf-check ${off ? 'off' : ''}"><input type="checkbox" data-rf="${name}" value="${E(val)}" ${on ? 'checked' : ''} ${off ? 'disabled' : ''}><span>${E(label)}</span>${n != null ? `<em>${n}</em>` : ''}</label>`;
    const sel = (key, label, opts, cur) => `<label class="rf-sel">${label}<select data-rf="${key}">${opts.map(([v, l]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    box.innerHTML = `
      <div class="rf-head"><strong>Affiner</strong><button type="button" class="rf-reset" data-rf-reset>Réinitialiser</button></div>
      <fieldset><legend>Type de véhicule</legend>${cats.map((c) => check('cat', c, c, F.cats.has(c), nCat(c), !nCat(c) && !F.cats.has(c))).join('') || '<p class="muted">—</p>'}</fieldset>
      <fieldset><legend>Boîte de vitesses</legend>
        ${[['', 'Toutes'], ['Manuelle', 'Manuelle'], ['Automatique', 'Automatique']].map(([v, l]) => `<label class="rf-radio"><input type="radio" name="rfGear" data-rf="gear" value="${v}" ${F.gear === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</fieldset>
      <fieldset><legend>Places minimum</legend><select data-rf="seats">${[[0, 'Indifférent'], [4, '4 et plus'], [5, '5 et plus'], [7, '7 et plus'], [9, '9 et plus']].map(([v, l]) => `<option value="${v}" ${F.seats === v ? 'selected' : ''}>${l}</option>`).join('')}</select></fieldset>
      <fieldset><legend>Bagages minimum</legend><select data-rf="bags">${[[0, 'Indifférent'], [1, '1 et plus'], [2, '2 et plus'], [3, '3 et plus'], [4, '4 et plus']].map(([v, l]) => `<option value="${v}" ${F.bags === v ? 'selected' : ''}>${l}</option>`).join('')}</select></fieldset>
      <fieldset><legend>Carburant</legend>${fuels.map((f) => check('fuel', f, f, F.fuels.has(f), nFuel(f), !nFuel(f) && !F.fuels.has(f))).join('')}</fieldset>
      <fieldset><legend>Équipements</legend>${check('ac', '1', 'Climatisation', F.ac, all.filter((v) => v.airConditioning).length)}</fieldset>
      <fieldset><legend>Prix par jour : <b id="rfPriceLabel">${F.maxPrice} €</b> max</legend><input type="range" data-rf="price" min="5" max="${maxPrice}" step="5" value="${F.maxPrice}"></fieldset>
      <fieldset><legend>Inclus</legend>${check('freeCancel', '1', 'Annulation gratuite', F.freeCancel)}${check('freeMod', '1', 'Modifications gratuites', F.freeMod)}${check('unlimited', '1', 'Kilométrage illimité', F.unlimited)}${check('fullIns', '1', 'Assurance tous risques', F.fullIns)}
        <label class="rf-sel">Dépôt de garantie<select data-rf="deposit">${[['', 'Indifférent'], ['0', 'Sans dépôt'], ['500', '500 € maximum'], ['1000', '1 000 € maximum'], ['2000', '2 000 € maximum']].map(([v, l]) => `<option value="${v}" ${F.deposit === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></fieldset>
      <fieldset><legend>Conducteur</legend>${sel('minAge', 'Âge du conducteur', [['', 'Indifférent'], ['21', '21 ans ou moins exigé'], ['23', '23 ans ou moins exigé'], ['25', '25 ans ou moins exigé']], F.minAge)}</fieldset>
      ${lessors.length > 1 ? `<fieldset><legend>Loueur</legend>${lessors.map((l) => check('lessor', l, l, F.lessors.has(l))).join('')}</fieldset>` : ''}`;
  }

  function renderCars() {
    const ready = searched;
    document.querySelectorAll('#cars .service-results-head, .car-results-premium .rent-layout, .car-results-premium .service-info-strip, #carTiles').forEach((el) => { el.hidden = !ready; el.style.display = ready ? '' : 'none'; });
    const prompt = document.getElementById('carPrompt');
    if (prompt) prompt.style.display = ready ? 'none' : 'block';
    if (!ready) { renderCatIntro(); return; }
    renderFilters(); paintCars();
  }
  /* Aucun résultat : on propose de quoi repartir (filtres, nouvelle recherche, villes où des voitures sont publiées). */
  let cityList = null;
  async function paintEmptyActions() {
    const box = document.getElementById('carEmptyActions');
    if (!box) return;
    const filtersOn = F.cats.size || F.gear || F.seats || F.freeCancel || F.unlimited || F.deposit || F.lessors.size || F.priceTouched || F.fuels.size || F.ac || F.freeMod || F.fullIns || F.bags || F.minAge;
    const draw = () => {
      const cities = (cityList || []).slice(0, 6);
      box.innerHTML = `${filtersOn ? '<button type="button" class="btn ghost" data-rf-reset>Réinitialiser les filtres</button>' : ''}<button type="button" class="btn" data-car-newsearch>Modifier ma recherche</button>${cities.length ? `<div class="empty-cities"><span>Voitures disponibles à :</span>${cities.map(([c, n]) => `<button type="button" class="chip" data-car-research="${E(c)}">${E(c)} <small>${n}</small></button>`).join('')}</div>` : ''}`;
    };
    draw();
    if (cityList === null) {
      try {
        const all = await api('/public/vehicles');
        const m = new Map();
        (Array.isArray(all) ? all : []).forEach((v) => { if (v.city) m.set(v.city, (m.get(v.city) || 0) + 1); });
        cityList = [...m.entries()].sort((a, b) => b[1] - a[1]);
      } catch { cityList = []; }
      draw();
    }
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-car-newsearch]')) { resetCars(); document.getElementById('carSearchForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const c = e.target.closest('[data-car-research]');
    if (!c) return;
    const f = document.getElementById('carSearchForm');
    if (!f) return;
    f.elements.pickup.value = c.dataset.carResearch;
    if (f.elements.category) f.elements.category.value = 'all';
    f.requestSubmit();
  });
  function paintCars() {
    renderTiles();
    const rows = filtered(), d = searchDays();
    const grid = document.getElementById('carGrid');
    if (grid) grid.innerHTML = rows.map(card).join('');
    const empty = document.getElementById('carEmpty');
    if (empty) { empty.style.display = rows.length ? 'none' : 'grid'; if (!rows.length) paintEmptyActions(); }
    const n = document.getElementById('carResultCount');
    if (n) n.textContent = `${rows.length} véhicule${rows.length > 1 ? 's' : ''}`;
    const sum = document.getElementById('carSearchSummary');
    if (sum) sum.textContent = state.vehicles.length ? `Prix pour ${dayLabel(d)}` : 'Aucune voiture publiée';
  }

  document.addEventListener('change', (e) => {
    const el = e.target.closest?.('[data-rf]');
    if (el) {
      const k = el.dataset.rf;
      if (k === 'cat' || k === 'lessor' || k === 'fuel') { const set = k === 'cat' ? F.cats : k === 'fuel' ? F.fuels : F.lessors; el.checked ? set.add(el.value) : set.delete(el.value); }
      else if (k === 'ac') F.ac = el.checked;
      else if (k === 'freeMod') F.freeMod = el.checked;
      else if (k === 'fullIns') F.fullIns = el.checked;
      else if (k === 'bags') F.bags = Number(el.value);
      else if (k === 'minAge') F.minAge = el.value;
      else if (k === 'gear') F.gear = el.value;
      else if (k === 'seats') F.seats = Number(el.value);
      else if (k === 'deposit') F.deposit = el.value;
      else if (k === 'freeCancel') F.freeCancel = el.checked;
      else if (k === 'unlimited') F.unlimited = el.checked;
      paintCars();
      if (k === 'cat') renderFilters();
    }
    if (e.target.id === 'carSort') { F.sort = e.target.value; paintCars(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.matches?.('[data-rf="price"]')) { F.maxPrice = Number(e.target.value); F.priceTouched = true; document.getElementById('rfPriceLabel').textContent = `${F.maxPrice} €`; paintCars(); }
  });
  document.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-cat]');
    if (tile) { const c = tile.dataset.cat; F.cats.has(c) ? F.cats.delete(c) : F.cats.add(c); renderFilters(); paintCars(); return; }
    if (e.target.closest('[data-rf-reset]')) { Object.assign(F, FRESH()); renderCars(); return; }
    if (e.target.closest('[data-rf-toggle]')) document.getElementById('rentFilters')?.classList.toggle('open');
    const terms = e.target.closest('[data-car-terms]');
    if (terms) { openTerms(terms.dataset.carTerms); return; }
    const book = e.target.closest('[data-book]');
    if (book) { e.preventDefault(); closeModals(); openReserve(book.dataset.book); }
  });

  /* ---------- Fenêtres : détail du véhicule et conditions de location du loueur ---------- */
  const modal = () => document.getElementById('carDetailModal');
  function closeModals() { modal()?.classList.remove('open'); }
  document.getElementById('closeCarDetail')?.addEventListener('click', closeModals);
  modal()?.addEventListener('click', (e) => { if (e.target.id === 'carDetailModal') closeModals(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

  function openTerms(id) {
    const v = find(id);
    if (!v) return;
    modal().querySelector('.cd-body').innerHTML = `<div class="cd-terms"><span class="badge">Conditions de location</span><h2>${E(v.name || v.model)}</h2><p class="rent-lessor"><span class="lessor-av">${E(initialsOf(lessorOf(v)))}</span><span>Conditions fixées par <b>${E(lessorOf(v))}</b></span></p><p class="cd-extra">${E(v.rentalConditions || '')}</p></div>`;
    modal().classList.add('open');
  }

  /* =====================================================================
     Parcours de réservation : 1 Votre location · 2 Protection & options · 3 Vos informations · 4 Confirmation
     ===================================================================== */
  const REQ = '<i class="req">*</i>';
  let R = null;
  let PAY = { payments: false, testMode: false };
  let payLoaded = false;
  const loadPay = () => api('/public/config').then((c) => { PAY = c; payLoaded = true; if (R && !R.done) renderReserve(); }).catch(() => {});
  window.addEventListener('load', loadPay);
  const LABELS = { loc: 'Votre location', opt: 'Protection & options', info: 'Vos informations' };
  // L'étape « Protection & options » n'existe que si le loueur propose une protection ou des options.
  const flow = () => { const v = find(R.id); return v.protectionPricePerDay > 0 || (v.extras || []).length ? ['loc', 'opt', 'info'] : ['loc', 'info']; };

  function pricing() {
    const v = find(R.id), d = searchDays();
    const base = rentalTotal(v, d);
    const old = v.oldPriceDay && Number(v.oldPriceDay) > Number(v.priceDay) ? Number(v.oldPriceDay) * d : null;
    const lines = [{ label: `Location · ${dayLabel(d)}`, amount: base }];
    for (const x of v.extras || []) {
      const q = R.extras.get(x.key) || 0;
      if (q > 0) lines.push({ label: `${q > 1 ? `${q} × ` : ''}${x.name} · ${x.pricing === 'once' ? 'forfait' : dayLabel(d)}`, amount: Number(x.pricePerDay) * q * (x.pricing === 'once' ? 1 : d) });
    }
    const loc = (v.returnOptions || []).find((l) => l.key === R.returnKey);
    if (loc && loc.fee > 0) lines.push({ label: `Restitution dans un autre lieu : ${loc.name}`, amount: Number(loc.fee) });
    const age = Number(R.data?.driverAge) || S().age, young = youngFeeOf(v, age);
    if (young) lines.push({ label: `Conducteur de moins de ${v.youngDriverAge} ans${v.youngDriverPricing === 'once' ? ' · forfait' : ` · ${dayLabel(d)}`}`, amount: v.youngDriverPricing === 'once' ? young : young * d });
    if (R.protection && v.protectionPricePerDay > 0) lines.push({ label: `Protection de la franchise · ${dayLabel(d)}`, amount: Number(v.protectionPricePerDay) * d });
    const total = lines.reduce((n, l) => n + l.amount, 0);
    // Une partie du total se règle en ligne à la réservation (options et frais compris) ; le solde se paie au loueur au retrait.
    const online = PAY.payments ? Math.round(total * (Number(v.commissionPct) || 10)) / 100 : 0;
    return { v, d, base, old, lines, total, online, onSite: Math.max(0, Math.round((total - online) * 100) / 100) };
  }

  function tween(el, to) {
    if (!el) return;
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = euro(to); return; }
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 420); el.textContent = euro(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  const returnLabel = (v) => { const l = (v.returnOptions || []).find((x) => x.key === R.returnKey); return l ? l.name : 'Lieu indiqué par le loueur'; };
  // Le client rend la voiture à l'agence de retrait ou, si le loueur l'autorise, dans un autre lieu (avec ou sans frais).
  function returnHtml(v) {
    const list = v.returnOptions || [];
    if (!list.length) return `<p>${I.pin}Lieu indiqué par le loueur</p>`;
    if (list.length === 1) return `<p>${I.pin}${E(list[0].name)}</p><p class="muted">Ce loueur ne propose pas la restitution dans un autre lieu.</p>`;
    return `<div class="ret-list" role="radiogroup" aria-label="Lieu de restitution">${list.map((l) => `<label class="ret-opt ${l.key === R.returnKey ? 'on' : ''}"><input type="radio" name="rsvReturn" value="${E(l.key)}" ${l.key === R.returnKey ? 'checked' : ''}><span class="ret-dot"></span><span class="ret-main"><b>${E(l.name)}</b>${l.address ? `<small>${E(l.address)}</small>` : ''}</span><em>${l.fee > 0 ? `+ ${euro(l.fee)}` : l.same ? 'Inclus' : 'Sans frais'}</em></label>`).join('')}</div>`;
  }
  const depositBox = (v) => v.deposit == null ? '' : v.deposit > 0
    ? `<div class="rsv-deposit"><span>Dépôt de garantie</span><strong>${euro(v.deposit)}</strong><small>Demandé par le loueur à l’agence au retrait du véhicule, restitué à la fin de la location selon ses conditions.</small></div>`
    : `<div class="rsv-deposit free"><span>Dépôt de garantie</span><strong>Aucun</strong><small>Le loueur ne demande pas de dépôt de garantie.</small></div>`;
  function priceCardHtml() {
    const { v, d, total, online, onSite } = pricing();
    return `<section class="rsv-card rsv-pricecard"><h3>${I.shield}Prix de votre location</h3>
      <div class="rsv-bigprice"><span>Prix total · ${dayLabel(d)}</span><strong>${euro(total)}</strong></div>
      ${PAY.payments ? `<div class="rsv-split2"><div><small>À payer en ligne maintenant</small><b>${euro(online)}</b></div><div><small>À payer au loueur à l’arrivée</small><b>${euro(onSite)}</b></div></div>` : ''}
      ${depositBox(v)}</section>`;
  }
  function sideHtml() {
    const { v, d, old, lines, total, online, onSite } = pricing();
    const pick = S().pickup || [v.city, v.country].filter(Boolean).join(', ') || v.pickupAddress;
    const back = returnLabel(v);
    return `
      <div class="rsv-car">${TVGallery.html(v.images?.length ? v.images : [v.image], v.name || v.model, { spin: v.spin })}
        <div class="rsv-car-body"><h3>${E(v.name || v.model)} <small>ou similaire</small></h3><ul class="rent-specs">${specs(v)}</ul>
          <p class="rent-lessor"><span class="lessor-av">${E(initialsOf(lessorOf(v)))}</span><span>Proposé par <b>${E(lessorOf(v))}</b></span></p></div></div>
      <div class="rsv-block"><h4>Votre location</h4>
        <div class="rsv-tl"><span class="tl-dot"></span><div><b>${E(dayFmt(S().startDate))}</b><span>${E(S().startTime)} · ${E(pick)}</span></div></div>
        <div class="rsv-dur">${dayLabel(d)} facturé${d > 1 ? 's' : ''} <small>(durée réelle : ${durationText()})</small></div>
        <div class="rsv-tl"><span class="tl-dot end"></span><div><b>${E(dayFmt(S().endDate))}</b><span>${E(S().endTime)} · ${E(back)}</span></div></div></div>
      ${R.step === 1 && !R.done ? `<div class="rsv-block rsv-teaser"><h4>Prix</h4><p>Le détail du prix s’affiche en bas de l’offre.</p><a href="#rsvPriceAnchor" data-rsv-jump>Voir le prix ↓</a></div>` : `<div class="rsv-block"><h4>Prix</h4>
        ${lines.map((l) => `<div class="rsv-line"><span>${E(l.label)}</span><b>${euro(l.amount)}</b></div>`).join('')}
        ${old ? `<div class="rsv-save">Vous économisez ${euro(old - lines[0].amount)}</div>` : ''}
        <div class="rsv-total"><span>Total</span><strong data-v="${total}" id="rsvTotal">${euro(total)}</strong></div>
        ${PAY.payments ? `<div class="rsv-line split"><span>À payer au loueur à l’arrivée</span><b>${euro(onSite)}</b></div><div class="rsv-online"><span>Payez en ligne maintenant</span><strong>${euro(online)}</strong></div>` : ''}
        ${depositBox(v)}
      </div>`}`;
  }

  function stepperHtml() {
    const steps = [...flow().map((k) => LABELS[k]), 'Confirmation'];
    return `<ol class="rsv-steps" style="--n:${steps.length}">${steps.map((t, i) => `<li class="${i + 1 === R.step ? 'on' : ''} ${i + 1 < R.step || R.done ? 'done' : ''}"><span>${i + 1 < R.step || R.done ? '✓' : i + 1}</span><b>${t}</b></li>`).join('')}</ol>`;
  }

  // Quelques lignes pour présenter l'offre avant de parler du prix.
  function offerIntro(v) {
    const place = [v.city && v.city !== v.pickupAddress ? v.city : '', v.country].filter(Boolean).join(', ') || v.pickupAddress;
    const bits = [v.passengers && `${v.passengers} places`, v.bags != null && `${v.bags} valise${v.bags > 1 ? 's' : ''}`, v.transmission && v.transmission.toLowerCase(), v.fuelType && v.fuelType.toLowerCase(), v.airConditioning && 'climatisée'].filter(Boolean);
    return `Une ${E(String(v.category || 'voiture').toLowerCase())} proposée par <b>${E(lessorOf(v))}</b>, à retirer à <b>${E(place)}</b> : ${E(bits.join(', '))}. Voici tout ce que comprend l’offre, avant de voir le prix.`;
  }
  function highlights(v) {
    const km = v.unlimitedKm ? ['Kilométrage', 'Illimité'] : v.includedKm ? ['Kilométrage', `${v.includedKm}${v.extraKmPrice ? ` · puis ${euro(v.extraKmPrice)} / km` : ''}`] : null;
    const cancel = v.freeCancelHours > 0 ? ['Annulation', `Gratuite jusqu’à ${cancelText(v.freeCancelHours)} avant le départ`] : ['Annulation', 'Selon les conditions du loueur'];
    const cover = v.fullInsurance ? ['Assurance', 'Tous risques incluse'] : v.theftProtection ? ['Assurance', 'Protection contre le vol incluse'] : v.insuranceType ? ['Assurance', v.insuranceType] : null;
    const age = ['Conducteur', v.minAge ? `${v.minAge} ans minimum` : '18 ans minimum', ...(Number(v.youngDriverFee) > 0 && v.youngDriverAge ? [`Moins de ${v.youngDriverAge} ans : + ${euro(v.youngDriverFee)}${v.youngDriverPricing === 'once' ? ' (forfait)' : ' / jour'}`] : [])];
    const ret = v.returnPolicy === 'free' ? ['Restitution', 'Possible dans un autre lieu, sans frais'] : v.returnPolicy === 'fee' ? ['Restitution', `Possible dans un autre lieu : + ${euro(v.returnFee)}`] : ['Restitution', 'À l’agence de retrait'];
    const dep = v.deposit == null ? null : ['Dépôt de garantie', v.deposit > 0 ? `${euro(v.deposit)}, demandé par le loueur au retrait` : 'Aucun dépôt demandé'];
    const exc = v.excess ? ['Franchise', `${euro(v.excess)} en cas de dommage ou de vol${v.protectionPricePerDay > 0 ? ', réductible avec la protection (étape suivante)' : ''}`] : null;
    const fuel = v.fuelPolicy ? ['Carburant', v.fuelPolicy] : null;
    return [km, cancel, cover, age, ret, dep, exc, fuel].filter(Boolean).map(([t, ...d]) => `<li><b>${E(t)}</b><span>${d.map(E).join('<br>')}</span></li>`).join('');
  }
  function step1() {
    const { v } = pricing();
    const pick = S().pickup || [v.city, v.country].filter(Boolean).join(', ') || v.pickupAddress;
    const inc = includedList(v);
    const addons = [...(v.protectionPricePerDay > 0 ? [`Protection de la franchise · ${euro(v.protectionPricePerDay)} / jour`] : []), ...(v.extras || []).map((x) => `${x.name} · ${euro(x.pricePerDay)}${x.pricing === 'once' ? ' (forfait)' : ' / jour'}`)];
    return `
      <section class="rsv-card rsv-offer"><span class="eyebrow">Votre offre</span><h3>${E(v.name || v.model)} <small>ou similaire</small></h3><p class="rsv-lead">${offerIntro(v)}</p>
        <ul class="rsv-hl">${highlights(v)}</ul></section>
      <section class="rsv-card"><h3>${I.cal}Retrait et restitution</h3>
        <div class="rsv-two">
          <div><small>Récupérer la voiture</small><b>${E(dayFmt(S().startDate))}</b><span>${E(S().startTime)}</span><p>${I.pin}${E(pick)}</p><p class="muted">${E(v.pickupAddress || '')}</p>${v.officeHours ? `<p>${I.clock}${E(v.officeHours)}</p>` : ''}${v.pickupInstructions ? `<p class="muted">${E(v.pickupInstructions)}</p>` : ''}</div>
          <div><small>Rendre la voiture</small><b>${E(dayFmt(S().endDate))}</b><span>${E(S().endTime)}</span>${returnHtml(v)}</div>
        </div></section>
      ${inc.length ? `<section class="rsv-card"><h3>${I.shield}Inclus dans le prix</h3><ul class="rent-inc big cols">${checkList(inc)}</ul></section>` : ''}
      ${addons.length ? `<section class="rsv-card"><h3>${I.plus}À ajouter si vous le souhaitez</h3><p class="muted">Vous les choisirez à l’étape suivante.</p><ul class="rent-inc big cols">${checkList(addons)}</ul></section>` : ''}
      ${v.tips ? `<section class="rsv-card tips"><h3>Conseils du voyageur</h3><p>${E(v.tips)}</p></section>` : ''}
      ${v.rentalConditions ? `<section class="rsv-card"><h3>${I.doc}Conditions de location</h3><p class="muted">Rédigées par ${E(lessorOf(v))}.</p><button type="button" class="rent-link" data-car-terms="${v.id}">Lire les conditions de location</button></section>` : ''}
      <span id="rsvPriceAnchor"></span>
      ${priceCardHtml()}
      <div class="rsv-nav"><span></span><button class="btn" type="button" data-rsv-next>Continuer ${I.arrow}</button></div>`;
  }

  function step2() {
    const { v, d } = pricing();
    const prot = v.protectionPricePerDay > 0;
    const protTotal = prot ? Number(v.protectionPricePerDay) * d : 0;
    const extras = (v.extras || []).map((x) => {
      const q = R.extras.get(x.key) || 0, max = Number(x.maxQty || 1), once = x.pricing === 'once';
      return `<div class="opt-row ${q ? 'on' : ''}" data-opt="${E(x.key)}"><span class="opt-pic">${optIcon(x)}</span>
        <label class="opt-qty"><span>Qté</span><select data-rsv-qty="${E(x.key)}">${Array.from({ length: max + 1 }, (_, n) => `<option value="${n}" ${n === q ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="opt-main"><b>${E(x.name)}</b>${x.description ? `<p>${E(x.description)}</p>` : ''}<small>${euro(x.pricePerDay)} ${once ? 'en forfait unique' : 'par jour'}${max > 1 ? ` · ${max} maximum` : ''}</small></div>
        <span class="opt-price">${q ? `+ ${euro(Number(x.pricePerDay) * q * (once ? 1 : d))}` : ''}</span></div>`;
    }).join('');
    return `
      ${prot ? `<section class="rsv-card protect"><h3>${I.shield}Protégez votre franchise</h3>
        <p class="muted">${v.excess ? `En cas de dommage ou de vol, la franchise de <b>${euro(v.excess)}</b> reste à votre charge.` : 'Option proposée par le loueur pour limiter votre responsabilité en cas de dommage.'}</p>
        <div class="prot-grid">
          <label class="prot ${R.protection ? '' : 'on'}"><input type="radio" name="rsvProt" value="0" ${R.protection ? '' : 'checked'}><b>Sans protection</b><span>${v.excess ? `Franchise : ${euro(v.excess)}` : 'Selon le contrat du loueur'}</span><em>Inclus</em></label>
          <label class="prot best ${R.protection ? 'on' : ''}"><input type="radio" name="rsvProt" value="1" ${R.protection ? 'checked' : ''}><i class="prot-badge">Recommandé</i><b>Avec la protection de la franchise</b><span>Proposée par ${E(lessorOf(v))}</span><em>+ ${euro(protTotal)} <small>(${euro(v.protectionPricePerDay)} / jour)</small></em></label>
        </div></section>` : ''}
      <section class="rsv-card"><h3>${I.plus}Options</h3>${extras ? `<div class="opt-list">${extras}</div>` : '<p class="muted">Aucune option n’est proposée pour ce véhicule.</p>'}</section>
      <div class="rsv-nav"><button class="btn ghost" type="button" data-rsv-prev>${I.back} Retour</button><button class="btn" type="button" data-rsv-next>Continuer ${I.arrow}</button></div>`;
  }

  const ageNote = (v, age) => {
    const bits = [];
    if (v.minAge) bits.push(`Le loueur demande ${v.minAge} ans minimum.`);
    if (Number(v.youngDriverFee) > 0 && v.youngDriverAge) bits.push(age && age < Number(v.youngDriverAge) ? `Supplément jeune conducteur appliqué : + ${euro(v.youngDriverFee)}${v.youngDriverPricing === 'once' ? ' (forfait)' : ' / jour'}.` : `Supplément de ${euro(v.youngDriverFee)}${v.youngDriverPricing === 'once' ? '' : ' / jour'} pour les moins de ${v.youngDriverAge} ans.`);
    return bits.join(' ');
  };
  function step3() {
    const { v } = pricing();
    const x = R.data;
    return `
      <form class="rsv-card rsv-form" id="rsvForm" novalidate><h3>${I.seat}Conducteur principal</h3>
        <div class="rsv-civ"><label><input type="radio" name="title" value="M." ${x.title === 'M.' ? 'checked' : ''}><span>M.</span></label><label><input type="radio" name="title" value="Mme" ${x.title === 'Mme' ? 'checked' : ''}><span>Mme</span></label></div>
        <div class="rsv-grid">
          <label>Prénom ${REQ}<input name="firstName" required autocomplete="given-name" value="${E(x.firstName || '')}"></label>
          <label>Nom ${REQ}<input name="lastName" required autocomplete="family-name" value="${E(x.lastName || '')}"></label>
          <label>E-mail ${REQ}<input name="email" type="email" required autocomplete="email" value="${E(TVAuth.session?.user.email || x.email || '')}" ${TVAuth.session ? 'readonly' : ''}><small>Votre réservation sera rattachée à votre compte TripVision.</small></label>
          <label>Téléphone ${REQ}<input name="phone" type="tel" required autocomplete="tel" placeholder="+33 6 00 00 00 00" value="${E(x.phone || '')}"></label>
          <label>Âge du conducteur ${REQ}<input name="driverAge" type="number" required min="${v.minAge || 18}" max="99" value="${E(x.driverAge || S().age || '')}"><small data-age-note>${ageNote(v, Number(x.driverAge || S().age))}</small></label>
          <label class="wide">Une précision pour le loueur ? (facultatif)<textarea name="message" rows="3" placeholder="Heure d’arrivée du vol, siège bébé…">${E(x.message || '')}</textarea></label>
        </div>
        ${PAY.payments
          ? `<p class="rsv-pay big">${I.shield}<span>Vous allez être redirigé vers la page de paiement sécurisée de <b>Stripe</b>.</span></p>${PAY.testMode ? '<p class="rsv-test"><b>Mode test</b> : utilisez la carte 4242 4242 4242 4242, une date d’expiration future et un code à 3 chiffres. Aucun débit réel.</p>' : ''}`
          : ''}
        <p class="rsv-reqnote"><i class="req">*</i> Champs obligatoires</p>
        <div class="rsv-nav"><button class="btn ghost" type="button" data-rsv-prev>${I.back} Retour</button><button class="btn" type="submit" id="rsvSubmit">${PAY.payments ? `Payer ${euro(pricing().online)}` : 'Suivant'} ${I.arrow}</button></div></form>`;
  }

  function step4() {
    const { v, lines, total } = pricing();
    const b = R.done;
    return `
      <section class="rsv-card rsv-done"><div class="done-mark"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="m15 27 8 8 15-17"/></svg></div>
        <h2>Demande envoyée !</h2><p class="done-ref">Référence <b>${E(b.reference)}</b></p>
        <p class="muted">Un e-mail de confirmation de réception vient de vous être envoyé. ${E(lessorOf(v))} vérifie la disponibilité et vous répond très vite ; vous serez prévenu par e-mail et dans votre espace.</p>
        <div class="done-sum"><div><small>Véhicule</small><b>${E(v.name || v.model)}</b></div><div><small>Du</small><b>${E(dayFmt(S().startDate))} · ${E(S().startTime)}</b></div><div><small>Au</small><b>${E(dayFmt(S().endDate))} · ${E(S().endTime)}</b></div><div><small>Total estimé</small><b>${euro(total)}</b></div></div>
        <div class="rsv-nav center"><a class="btn" href="#login" data-page-link="login">Suivre ma réservation</a><a class="btn ghost" href="#cars" data-page-link="cars">Voir d’autres voitures</a></div></section>`;
  }

  /* ---------- Le parcours survit à l'actualisation de la page (le temps de l'onglet) ---------- */
  const KEY = 'tvReserve';
  function persist() {
    try {
      if (!R || R.done) { sessionStorage.removeItem(KEY); return; }
      sessionStorage.setItem(KEY, JSON.stringify({ R: { id: R.id, step: R.step, protection: R.protection, extras: [...R.extras], data: R.data, returnKey: R.returnKey }, search: S() }));
    } catch { /* stockage indisponible */ }
  }
  const saved = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
  let paymentReturn = false; // vrai quand la page de confirmation de paiement est affichée
  const wantsRestore = () => location.hash === '#reserve' && !paymentReturn && !new URLSearchParams(location.search).get('payment') && saved();
  // Avant le chargement des véhicules : remet la recherche (lieu, dates) pour que l'annonce soit retrouvée.
  window.carsPrepareRestore = () => {
    const s = wantsRestore();
    if (!s) {
      // Retour sur la page Voitures (ou actualisation) : on retrouve la dernière recherche.
      let last = null;
      try { last = JSON.parse(sessionStorage.getItem('tvCarSearch') || 'null'); } catch { /* rien */ }
      if (last && last.pickup && last.startDate && last.endDate) {
        search = { ...search, ...last };
        const f = document.getElementById('carSearchForm')?.elements;
        if (f) for (const [k, v] of Object.entries(last)) if (f[k] && v) f[k].value = v;
        searched = true;
      }
      return;
    }
    search = { ...search, ...s.search };
    const f = document.getElementById('carSearchForm')?.elements;
    if (f) for (const [k, v] of Object.entries(s.search)) if (f[k] && v) f[k].value = v;
    searched = true;
    const root = document.getElementById('reserveRoot');
    if (root) root.innerHTML = '<section class="rsv-card rsv-done"><span class="spinner-lg"></span><h2>Reprise de votre réservation…</h2></section>';
  };
  // Après le chargement : rouvre l'étape où le client s'était arrêté.
  window.carsRestore = () => {
    const leave = () => { if (location.hash === '#reserve' && !paymentReturn && !new URLSearchParams(location.search).get('payment')) location.hash = 'cars'; };
    const s = wantsRestore();
    if (!s) { leave(); return; }
    const v = find(s.R.id);
    if (!v) { try { sessionStorage.removeItem(KEY); } catch { /* rien */ } leave(); return; }
    R = { ...s.R, extras: new Map(s.R.extras), done: null };
    if (R.step > flow().length) R.step = flow().length;
    renderReserve();
    page('reserve');
  };

  function renderReserve() {
    const root = document.getElementById('reserveRoot');
    if (!root || !R) return;
    R.lastTotal = pricing().total;
    persist();
    const content = R.done ? step4() : { loc: step1, opt: step2, info: step3 }[flow()[R.step - 1]]();
    root.innerHTML = `
      <div class="rsv-top"><button type="button" class="rsv-back" data-rsv-exit>${I.back} Retour aux résultats</button>${stepperHtml()}</div>
      <div class="rsv-layout"><div class="rsv-main"><div class="rsv-step" key="${R.step}">${content}</div></div><aside class="rsv-side">${sideHtml()}</aside></div>`;
    root.querySelectorAll('[data-page-link]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); const p = a.dataset.pageLink; page(p); location.hash = p; }; });
  }
  function paintSide() {
    const side = document.querySelector('#reserveRoot .rsv-side');
    if (!side) return;
    const gal = side.querySelector('.rsv-car');
    const { total } = pricing();
    const html = sideHtml();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // on remplace tout sauf la galerie (évite de relancer le carrousel) puis on anime le total
    [...side.children].forEach((c, i) => { if (i > 0) c.remove(); });
    [...tmp.children].forEach((c, i) => { if (i > 0) side.appendChild(c); });
    const t = side.querySelector('#rsvTotal');
    if (t) { t.dataset.v = R.lastTotal ?? total; tween(t, total); }
    R.lastTotal = total;
    void gal;
  }
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lien « Voir l'annonce » : ouvre directement la réservation de cette voiture (dates du jour par défaut).
  window.carsOpenVehicle = async (v) => {
    if (!state.vehicles.some((x) => x.id === v.id)) state.vehicles.push(v);
    const f = document.getElementById('carSearchForm')?.elements;
    if (f && !f.pickup.value) f.pickup.value = v.city || v.pickupAddress || '';
    search = { ...search, pickup: f?.pickup.value || v.city || '' };
    searched = true;
    saveSearch();
    openReserve(v.id);
  };
  function openReserve(id) {
    const v = find(id);
    if (!v) return;
    window.TVFX?.track('car_view', v.id, v.city, v.country, v.name || v.model);
    if (!payLoaded) loadPay();
    R = { id, step: 1, protection: false, extras: new Map(), data: {}, done: null, returnKey: v.returnOptions?.[0]?.key || 'same' };
    renderReserve();
    page('reserve');
    location.hash = 'reserve';
    scrollTop();
  }
  window.addEventListener('hashchange', () => { if (location.hash === '#reserve' && !R) { location.hash = 'cars'; } });

  document.addEventListener('click', (e) => {
    if (!R) return;
    if (e.target.closest('[data-rsv-exit]')) { try { sessionStorage.removeItem(KEY); } catch { /* rien */ } page('cars'); location.hash = 'cars'; return; }
    if (e.target.closest('[data-rsv-prev]')) { saveForm(); R.step = Math.max(1, R.step - 1); renderReserve(); scrollTop(); return; }
    if (e.target.closest('[data-rsv-next]')) { R.step = Math.min(flow().length, R.step + 1); renderReserve(); scrollTop(); }
  });
  // Le prix suit l'âge saisi (supplément jeune conducteur).
  document.addEventListener('input', (e) => {
    if (!R || e.target.name !== 'driverAge' || !e.target.form?.matches('#rsvForm')) return;
    R.data = { ...R.data, driverAge: e.target.value };
    const v = find(R.id);
    const note = e.target.closest('label')?.querySelector('[data-age-note]');
    if (note) note.textContent = ageNote(v, Number(e.target.value));
    paintSide();
    const btn = document.getElementById('rsvSubmit');
    if (btn && PAY.payments) btn.innerHTML = `Payer ${euro(pricing().online)} ${I.arrow}`;
  });
  document.addEventListener('click', (e) => {
    const j = e.target.closest?.('[data-rsv-jump]');
    if (!j) return;
    e.preventDefault();
    document.getElementById('rsvPriceAnchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.addEventListener('change', (e) => {
    if (!R) return;
    if (e.target.name === 'rsvReturn') { R.returnKey = e.target.value; document.querySelectorAll('.ret-opt').forEach((o) => o.classList.toggle('on', o.querySelector('input').checked)); paintSide(); return; }
    if (e.target.name === 'rsvProt') { R.protection = e.target.value === '1'; document.querySelectorAll('.prot').forEach((p) => p.classList.toggle('on', p.querySelector('input').checked)); paintSide(); }
    const qty = e.target.closest?.('[data-rsv-qty]');
    if (qty) {
      const n = Number(qty.value);
      n > 0 ? R.extras.set(qty.dataset.rsvQty, n) : R.extras.delete(qty.dataset.rsvQty);
      const row = qty.closest('.opt-row');
      const x = find(R.id).extras.find((y) => y.key === qty.dataset.rsvQty);
      row.classList.toggle('on', n > 0);
      row.querySelector('.opt-price').textContent = n ? `+ ${euro(Number(x.pricePerDay) * n * (x.pricing === 'once' ? 1 : searchDays()))}` : '';
      paintSide();
    }
  });
  function saveForm() {
    const f = document.getElementById('rsvForm');
    if (!f) return;
    R.data = Object.fromEntries(new FormData(f));
    persist();
  }
  document.addEventListener('submit', async (e) => {
    if (e.target.id !== 'rsvForm' || !R) return;
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    saveForm();
    const d = R.data, v = find(R.id);
    let acct;
    try { acct = await TVAuth.require({ reason: 'Pour réserver une voiture, connectez-vous ou créez votre compte TripVision. Vos informations saisies sont conservées.' }); } catch { return; }
    d.email = acct.user.email;
    const stop = busy(document.getElementById('rsvSubmit'), 'Envoi en cours…');
    const body = {
      vehicleId: R.id, startDate: S().startDate, startTime: S().startTime, endDate: S().endDate, endTime: S().endTime, name: `${d.firstName} ${d.lastName}`.trim(), title: d.title || undefined,
      email: d.email, phone: d.phone, driverAge: Number(d.driverAge), message: d.message || undefined, pickupAddress: S().pickup || undefined,
      returnKey: R.returnKey || undefined, extras: [...R.extras].map(([key, qty]) => ({ key, qty })), protection: R.protection && v.protectionPricePerDay > 0,
    };
    try {
      const created = await api('/bookings', { method: 'POST', headers: TVAuth.headers(), body: JSON.stringify(body) });
      if (created.checkoutUrl) { document.getElementById('rsvSubmit').textContent = 'Redirection vers le paiement sécurisé…'; location.href = created.checkoutUrl; return; }
      R.done = created;
      persist();
      R.step = flow().length + 1;
      renderReserve();
      scrollTop();
    } catch (err) {
      console.error(err);
      if (err.message === 'UNAUTHORIZED' || /401/.test(err.message)) TVAuth.reset();
      toast(err.detail || 'Impossible d’envoyer la demande. Vérifiez vos informations.', 'error', 'Erreur');
      stop();
    }
  });

  /* ---------- Retour de la page de paiement Stripe ---------- */
  const resultCard = (kind, d) => {
    const ok = kind === 'paid';
    return `<div class="rsv-top"><button type="button" class="rsv-back" data-pay-exit>${I.back} Voir les voitures</button></div>
      <section class="rsv-card rsv-done ${ok ? '' : 'failed'}">${ok ? '<div class="done-mark"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="m15 27 8 8 15-17"/></svg></div>' : '<div class="fail-mark">!</div>'}
        <h2>${ok ? 'Merci, votre réservation est confirmée !' : kind === 'pending' ? 'Paiement en cours de vérification' : 'Paiement non abouti'}</h2>
        ${d?.reference ? `<p class="done-ref">Référence <b>${E(d.reference)}</b></p>` : ''}
        <p class="muted">${ok ? 'Votre paiement est bien enregistré et le loueur est prévenu. Un e-mail récapitulatif arrive dans votre boîte de réception, et vous retrouvez tous les détails dans votre espace client.' : kind === 'pending' ? 'Votre paiement n’est pas encore confirmé. Actualisez cette page dans un instant.' : 'Aucun montant n’a été débité et la réservation n’a pas été enregistrée. Le véhicule est de nouveau disponible : vous pouvez réessayer.'}</p>
        ${ok && d ? `<div class="done-sum"><div><small>Véhicule</small><b>${E(d.vehicle)}</b></div><div><small>Du</small><b>${E(dayFmt(d.startDate))} · ${E(d.startTime || '')}</b></div><div><small>Au</small><b>${E(dayFmt(d.endDate))} · ${E(d.endTime || '')}</b></div><div><small>Payé en ligne</small><b>${euro(d.paid ?? d.total)}</b></div><div><small>À régler au loueur au retrait</small><b>${euro(Math.max(0, (d.total || 0) - (d.paid || 0)))}</b></div></div>` : ''}
        <div class="rsv-nav center">${ok ? '<a class="btn" href="#login" data-page-link="login">Suivre ma réservation</a>' : '<button class="btn" type="button" data-pay-exit>Revenir aux voitures</button>'}</div></section>`;
  };
  async function handlePaymentReturn() {
    const q = new URLSearchParams(location.search);
    const kind = q.get('payment');
    if (!kind) return;
    if (q.get('kind') === 'pack') { window.packPaymentReturn?.(q); return; }
    paymentReturn = true;
    try { sessionStorage.removeItem('tvReserve'); } catch { /* rien */ }
    const root = document.getElementById('reserveRoot');
    history.replaceState(null, '', `${location.pathname}#reserve`);
    page('reserve');
    root.innerHTML = '<section class="rsv-card rsv-done"><span class="spinner-lg"></span><h2>Vérification du paiement…</h2></section>';
    try {
      if (kind === 'success') {
        const d = await api(`/payments/session/${encodeURIComponent(q.get('session_id') || '')}`);
        root.innerHTML = resultCard(d.status === 'paid' ? 'paid' : d.status === 'awaiting' ? 'pending' : 'failed', d);
      } else {
        await api('/payments/cancel', { method: 'POST', body: JSON.stringify({ bookingId: q.get('b'), token: q.get('t') }) });
        root.innerHTML = resultCard('failed');
      }
    } catch (e) { console.error(e); root.innerHTML = resultCard('failed'); }
    root.querySelectorAll('[data-page-link]').forEach((a) => { a.onclick = (ev) => { ev.preventDefault(); const t = a.dataset.pageLink; page(t); location.hash = t; }; });
    root.querySelectorAll('[data-pay-exit]').forEach((b) => { b.onclick = () => { page('cars'); location.hash = 'cars'; fetchCars(); }; });
  }
  // Lancé par script.js une fois la page prête (sinon la page de confirmation pouvait ne pas s'afficher).
  window.carsPaymentReturn = handlePaymentReturn;

  window.carsPath = carsPath;
  window.fetchCars = fetchCars;
  window.renderCars = renderCars;
  window.openBooking = openReserve;
})();
