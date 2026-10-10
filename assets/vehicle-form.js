/* Formulaire d'annonce de véhicule partagé (back-office et espace partenaire).
   TVVehicleForm.html(v, { gallery })  → balisage des sections
   TVVehicleForm.read(form)            → objet prêt à être envoyé à l'API
   Tout ce qui s'affiche sur le site (inclus dans le prix, protection, options, conditions de location) est saisi ici
   par l’enseigne ou le back-office : TripVision n'écrit aucune condition à leur place. */
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATEGORIES = ['Mini (A)', 'Économique (B)', 'Compacte (C)', 'Intermédiaire (D)', 'Routière (E)', 'SUV et Break', 'Monospace ou Minibus', 'Utilitaire / Van'];
  // Catégories gérées par l'IT et les managers (page « Catégories » du back-office) ; la liste ci-dessus sert de secours.
  const CAT_IMAGE = {};
  fetch('/api/public/categories').then((r) => r.json()).then((l) => {
    if (!Array.isArray(l) || !l.length) return;
    CATEGORIES.splice(0, CATEGORIES.length, ...l.map((c) => c.name));
    l.forEach((c) => { CAT_IMAGE[c.name] = c.image || ''; });
    document.querySelectorAll('[data-cat-preview]').forEach((box) => paintCatPreview(box));
  }).catch(() => {});
  // L'image de l'annonce est l'image type de la catégorie choisie : ni l’enseigne ni le back-office ne téléversent de photo par véhicule.
  const paintCatPreview = (box) => {
    const sel = box.closest('form')?.elements.namedItem('category');
    const name = sel?.value || '';
    const url = CAT_IMAGE[name];
    box.innerHTML = url ? `<img src="${esc(url)}" alt=""><span><b>Image de l’annonce</b>Image type de la catégorie « ${esc(name)} » : elle s’affiche automatiquement sur le site.</span>` : `<span><b>Image de l’annonce</b>L’image type de la catégorie s’affichera automatiquement sur le site.</span>`;
  };
  document.addEventListener('change', (e) => { if (e.target.matches?.('select[name=category]')) e.target.form?.querySelectorAll('[data-cat-preview]').forEach(paintCatPreview); });
  const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
  const MIN_AGES = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30].map((n) => [n, n === 18 ? '18 ans (majorité)' : `${n} ans minimum`]);
  const YOUNG_AGES = [['none', 'Aucun supplément jeune conducteur'], ...[21, 22, 23, 24, 25, 26, 27, 28, 30].map((n) => [n, `Supplément pour les moins de ${n} ans`])];
  const FUEL_POLICIES = ['Plein / plein', 'Même niveau au retour', 'Plein prépayé', 'Plein-vide'];
  const CANCEL = [[0, 'Pas d’annulation gratuite'], [24, 'Gratuite jusqu’à 24 h avant'], [48, 'Gratuite jusqu’à 48 h avant'], [72, 'Gratuite jusqu’à 72 h avant'], [168, 'Gratuite jusqu’à 7 jours avant'], [336, 'Gratuite jusqu’à 14 jours avant']];
  const PRESETS = {
    child_seat: { name: 'Siège enfant', description: '', maxQty: 3 },
    booster: { name: 'Rehausseur', description: '', maxQty: 3 },
    gps: { name: 'GPS', description: '', maxQty: 1 },
    wifi: { name: 'Wi-Fi embarqué', description: '', maxQty: 1 },
    extra_driver: { name: 'Conducteur supplémentaire', description: '', maxQty: 1 },
    roof_rack: { name: 'Porte-bagages', description: '', maxQty: 1, pricing: 'once' },
  };
  const rowHtml = (e = {}) => `
    <div class="extra-row" data-extra-key="${esc(e.key || `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`)}">
      <label>Nom de l’option<input data-ef="name" required maxlength="60" value="${esc(e.name || '')}" placeholder="Ex. Porte-vélos"></label>
      <label>Prix (€)<input data-ef="price" type="number" required min="0.01" step="0.01" value="${esc(num(e.pricePerDay))}"></label>
      <label>Tarification<select data-ef="pricing"><option value="day" ${e.pricing === 'once' ? '' : 'selected'}>Par jour</option><option value="once" ${e.pricing === 'once' ? 'selected' : ''}>Forfait unique</option></select></label>
      <label>Quantité maximale<input data-ef="max" type="number" min="1" max="10" value="${esc(e.maxQty || 1)}"></label>
      <label class="full">Description affichée au client<input data-ef="desc" maxlength="300" value="${esc(e.description || '')}" placeholder="Ex. Recommandé pour les enfants de 1 à 3 ans"></label>
      <button type="button" class="btn small danger" data-extra-remove>Retirer cette option</button>
    </div>`;

  const num = (x) => (x === null || x === undefined ? '' : x);
  const input = (label, attrs, full = false) => `<label class="${full ? 'full' : ''}">${esc(label)}<input ${attrs}></label>`;
  // Une liste obligatoire commence par « Choisir… » : l’enseigne doit faire un choix explicite.
  const select = (label, name, list, current, { required = false, full = false, choose = false } = {}) => `<label class="${full ? 'full' : ''}">${esc(label)}<select name="${name}" ${required ? 'required' : ''}>${choose ? `<option value="" disabled ${String(current ?? '') === '' ? 'selected' : ''}>Choisir…</option>` : ''}${list.map((x) => { const [val, text] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${String(val) === String(current ?? '') ? 'selected' : ''}>${esc(text)}</option>`; }).join('')}</select></label>`;
  const toggle = (name, label, checked) => `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}</span></label>`;
  const section = (title) => `<h4 class="form-section full">${esc(title)}</h4>`;
  const hint = (t) => `<p class="muted full">${esc(t)}</p>`;

  const DAYS = [['mon', 'Lundi'], ['tue', 'Mardi'], ['wed', 'Mercredi'], ['thu', 'Jeudi'], ['fri', 'Vendredi'], ['sat', 'Samedi'], ['sun', 'Dimanche']];
  const defaultWeek = () => Object.fromEntries(DAYS.map(([k]) => [k, k === 'sun' ? null : { open: '08:00', close: '18:00' }]));
  const hoursHtml = (week) => `<div class="full hours-box" data-hours>
    ${DAYS.map(([k, label]) => { const d = week[k]; return `<div class="hrs-row ${d ? '' : 'off'}"><label class="hrs-day"><input type="checkbox" data-hd="${k}" ${d ? 'checked' : ''}><span>${label}</span></label><input type="time" data-ho="${k}" value="${esc(d?.open || '08:00')}" ${d ? '' : 'disabled'} aria-label="Ouverture ${label}"><span class="hrs-to">à</span><input type="time" data-hc="${k}" value="${esc(d?.close || '18:00')}" ${d ? '' : 'disabled'} aria-label="Fermeture ${label}"><em>${d ? '' : 'Fermé'}</em></div>`; }).join('')}
    <button type="button" class="chip-btn" data-hours-copy>Appliquer les horaires du lundi à tous les jours ouverts</button>
  </div>`;
  const inclRow = (t = '') => `<div class="incl-row"><input data-if maxlength="120" value="${esc(t)}" placeholder="Ex. Siège bébé offert, deuxième conducteur gratuit…"><button type="button" class="btn small danger" data-incl-remove>Retirer</button></div>`;
  const locRow = (l = {}) => `
    <div class="rloc-row" data-key="${esc(l.key || `loc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`)}">
      <label>Lieu de restitution<input data-lf="name" required maxlength="120" value="${esc(l.name || '')}" placeholder="Ex. Aéroport CDG - Terminal 2"></label>
      <label>Adresse précise (facultatif)<input data-lf="address" maxlength="200" value="${esc(l.address || '')}" placeholder="Ex. Niveau -1, parking P2"></label>
      <button type="button" class="btn small danger" data-rloc-remove>Retirer</button>
    </div>`;
  const nowLocal = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const todayIso = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  const blockRow = (b = {}) => `
    <div class="blk-row">
      <label>Indisponible du<input data-bf="start" type="datetime-local" required ${b.start ? '' : `min="${nowLocal()}"`} value="${esc(b.start || '')}"></label>
      <label>Jusqu’au<input data-bf="end" type="datetime-local" required ${b.end ? '' : `min="${nowLocal()}"`} value="${esc(b.end || '')}"></label>
      <label>Motif (facultatif)<input data-bf="reason" maxlength="120" value="${esc(b.reason || '')}" placeholder="Ex. Entretien, loué hors du site"></label>
      <button type="button" class="btn small danger" data-blk-remove>Retirer</button>
    </div>`;

  /* ---------- Tarifs : grille par durée, saisons, règles, simulateur ---------- */
  const P = () => window.TVPricing;
  const ddmm = (mmdd) => (mmdd ? `${mmdd.slice(3, 5)}/${mmdd.slice(0, 2)}` : '');
  const mmdd = (txt) => { const m = String(txt || '').trim().match(/^(\d{1,2})\/(\d{1,2})$/); if (!m) return null; const d = Number(m[1]), mo = Number(m[2]); return d >= 1 && d <= 31 && mo >= 1 && mo <= 12 ? `${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null; };
  const seasonRow = (z = {}) => `<div class="rt-season" data-season>
      <label>Nom de la saison<input data-sf="name" maxlength="40" required value="${esc(z.name || '')}" placeholder="Ex. Haute saison"></label>
      <label>Du (jj/mm)<input data-sf="from" required pattern="\\d{1,2}/\\d{1,2}" placeholder="01/07" value="${esc(ddmm(z.from))}"></label>
      <label>Au (jj/mm)<input data-sf="to" required pattern="\\d{1,2}/\\d{1,2}" placeholder="31/08" value="${esc(ddmm(z.to))}"></label>
      <label>Coefficient<input data-sf="coef" type="number" min="0.5" max="3" step="0.05" required value="${esc(z.coef ?? 1.3)}"></label>
      <button type="button" class="btn small danger" data-season-remove>Retirer</button>
    </div>`;
  function ratesHtml(x) {
    const r = P().ratesOf(x.rates || x.priceDay ? x : { rates: { tiers: ['', '', '', '', ''] } });
    const tiers = x.rates || x.priceDay ? r.tiers : ['', '', '', '', ''];
    const now = new Date(Date.now() + 864e5), back = new Date(now.getTime() + 10 * 864e5), loc = (d) => `${d.toISOString().slice(0, 10)}T10:00`;
    return `${section('Tarifs')}
      ${hint('Saisissez votre grille une seule fois : le prix se calcule automatiquement à chaque réservation. Tous les prix sont TTC, c’est ce que paie le client.')}
      <div class="full rates" data-rates>
        <div class="rt-card">
          <h5>1. Prix par jour selon la durée</h5>
          <p class="muted">Le palier est choisi selon la durée totale de la location, puis appliqué à chaque jour.</p>
          <div class="rt-gen"><label>Prix de base par jour (€)<input data-rt-base type="number" min="1" step="1" placeholder="45" value="${esc(tiers[0] || '')}"></label><label>Baisse par palier (%)<input data-rt-pct type="number" min="0" max="20" step="1" value="10"></label><button type="button" class="btn small" data-rt-generate>Générer la grille</button></div>
          <div class="rt-grid"><span>Durée de location</span><span>Prix par jour (TTC)</span><span>Exemple de total</span>
            ${P().PALIERS.map((pl, i) => `<b>${esc(P().label(pl))}</b><span class="rt-in"><input data-tier="${i}" type="number" min="1" step="0.01" required aria-label="Prix par jour, ${esc(P().label(pl))}" value="${esc(tiers[i] ?? '')}"><em>€</em></span><span data-tier-ex="${i}"></span>`).join('')}
          </div>
          <p class="rt-warn" data-rt-warn hidden></p>
        </div>
        <div class="rt-card">
          <h5>2. Saisons <small>(facultatif)</small></h5>
          <p class="muted">Chaque jour de la location prend le coefficient de sa saison, chaque année aux mêmes dates. Ex. × 1,30 = 30 % plus cher.</p>
          <div data-season-rows>${r.seasons.map(seasonRow).join('')}</div>
          <button type="button" class="chip-btn" data-season-add>+ Ajouter une saison</button>
        </div>
        <div class="rt-card">
          <h5>3. Règles de location</h5>
          <div class="rt-rules">
            <label>Durée minimale (jours)<input name="rtMin" type="number" min="1" max="30" step="1" required value="${esc(r.minDays)}"></label>
            <label>Durée maximale (jours)<input name="rtMax" type="number" min="1" max="30" step="1" required value="${esc(r.maxDays)}"></label>
            <label>Retard toléré (minutes)<input name="rtGrace" type="number" min="0" max="180" step="1" required value="${esc(r.grace)}"></label>
            <label>Dépôt de garantie (€)<input name="deposit" type="number" min="0" step="1" placeholder="800" value="${esc(num(x.deposit))}"></label>
            <label>Ancien prix par jour barré (€, facultatif)<input name="oldPriceDay" type="number" min="1" step="0.01" placeholder="Affiche une remise" value="${esc(num(x.oldPriceDay))}"></label>
          </div>
          <label class="rt-check"><input type="checkbox" name="rtSmooth" ${r.smoothing ? 'checked' : ''}><span>Ne jamais facturer plus cher qu’un palier supérieur (lissage des seuils)</span></label>
          <p class="muted">Les options (siège enfant, conducteur supplémentaire…), la restitution dans un autre lieu et le supplément jeune conducteur se règlent plus bas.</p>
        </div>
        <div class="rt-card rt-sim">
          <h5>Simulateur de réservation <small>ce que le client verra</small></h5>
          <div class="rt-sim-dates"><label>Prise du véhicule<input type="datetime-local" data-sim-from value="${loc(now)}"></label><label>Retour<input type="datetime-local" data-sim-to value="${loc(back)}"></label></div>
          <div data-sim-out></div>
        </div>
      </div>`;
  }
  const fmtE = (n) => `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
  function readRates(f) {
    const tiers = [...f.querySelectorAll('[data-tier]')].map((i) => Number(i.value));
    const seasons = [...f.querySelectorAll('[data-season]')].map((row) => { const v = (k) => row.querySelector(`[data-sf=${k}]`).value.trim(); return { name: v('name'), from: mmdd(v('from')), to: mmdd(v('to')), coef: Number(v('coef')) }; });
    const g = (n) => Number(f.elements.namedItem(n)?.value);
    return { tiers, seasons, minDays: g('rtMin') || 1, maxDays: Math.min(30, g('rtMax') || 30), grace: Number.isFinite(g('rtGrace')) ? g('rtGrace') : 59, smoothing: Boolean(f.elements.namedItem('rtSmooth')?.checked) };
  }
  // Exemples de la grille, alerte de seuil et simulateur, recalculés à chaque saisie.
  function paintRates(f) {
    const box = f?.querySelector?.('[data-rates]');
    if (!box || !P()) return;
    const rates = readRates(f), ok = rates.tiers.every((t) => t > 0);
    P().PALIERS.forEach((pl, i) => { const el = box.querySelector(`[data-tier-ex="${i}"]`); const n = i < 2 ? pl.max : pl.min; el.textContent = rates.tiers[i] > 0 ? `${n} j = ${fmtE(rates.tiers[i] * n)}` : '—'; });
    const warn = box.querySelector('[data-rt-warn]');
    const bad = ok ? P().PALIERS.slice(0, -1).map((pl, i) => [pl.max, rates.tiers[i] * pl.max, P().PALIERS[i + 1].min, rates.tiers[i + 1] * P().PALIERS[i + 1].min]).find(([, a, , b]) => a > b) : null;
    warn.hidden = !bad;
    if (bad) warn.textContent = `Attention : ${bad[0]} jours (${fmtE(bad[1])}) coûtent plus cher que ${bad[2]} jours (${fmtE(bad[3])}).${rates.smoothing ? ` Le lissage des seuils facturera ${fmtE(bad[3])} au client.` : ' Cochez le lissage des seuils pour que le client ne paie jamais plus.'}`;
    const out = box.querySelector('[data-sim-out]');
    const from = box.querySelector('[data-sim-from]').value, to = box.querySelector('[data-sim-to]').value;
    if (!ok) { out.innerHTML = '<p class="muted">Complétez la grille pour voir le prix.</p>'; return; }
    if (!from || !to || to <= from) { out.innerHTML = '<p class="muted">Choisissez une date de retour après la prise du véhicule.</p>'; return; }
    const q = P().quote({ rates }, from, to);
    const deposit = Number(f.elements.namedItem('deposit')?.value) || 0;
    const online = Math.round(q.base * 10) / 100;
    out.innerHTML = q.error ? `<p class="rt-warn">${esc(q.error)}</p>` : `
      <div class="rt-line"><span>Location ${q.days} jour${q.days > 1 ? 's' : ''}${q.applied ? ` (tarif ${q.applied} jours appliqué)` : ` × ${fmtE(q.perDay)}`}${q.seasonal ? ' · saison comprise' : ''}</span><b>${fmtE(q.base)}</b></div>
      <div class="rt-line total"><span>Total TTC</span><b>${fmtE(q.base)}</b></div>
      <div class="rt-line"><span>Payé en ligne par le client à la réservation (10 %)</span><b>${fmtE(online)}</b></div>
      <div class="rt-line strong"><span>À encaisser à l’agence au retrait</span><b>${fmtE(Math.round((q.base - online) * 100) / 100)}</b></div>
      ${deposit ? `<div class="rt-line muted"><span>Dépôt de garantie (non facturé)</span><b>${fmtE(deposit)}</b></div>` : ''}
      <p class="muted rt-note">Hors options choisies par le client (elles s’ajoutent au total).</p>`;
  }
  document.addEventListener('input', (e) => { const f = e.target.closest?.('form'); if (f?.querySelector('[data-rates]') && (e.target.closest('[data-rates]') || e.target.name === 'deposit')) paintRates(f); });
  document.addEventListener('change', (e) => { const f = e.target.closest?.('form'); if (f?.querySelector('[data-rates]') && e.target.closest('[data-rates]')) paintRates(f); });
  document.addEventListener('click', (e) => {
    const f = e.target.closest?.('form');
    if (!f) return;
    if (e.target.closest('[data-rt-generate]')) {
      const base = Number(f.querySelector('[data-rt-base]').value), pct = Number(f.querySelector('[data-rt-pct]').value) || 0;
      if (!(base > 0)) { f.querySelector('[data-rt-base]').focus(); return; }
      P().generate(base, pct).forEach((v, i) => { f.querySelector(`[data-tier="${i}"]`).value = v; });
      paintRates(f);
    } else if (e.target.closest('[data-season-add]')) {
      f.querySelector('[data-season-rows]').insertAdjacentHTML('beforeend', seasonRow({ coef: 1.3 }));
      f.querySelector('[data-season-rows] [data-season]:last-child [data-sf=name]').focus();
    } else if (e.target.closest('[data-season-remove]')) {
      e.target.closest('[data-season]').remove();
      paintRates(f);
    }
  });

  function html(v = null, { lessor = false, availability = null } = {}) {
    const x = v || {};
    const unlimited = Boolean(x.unlimitedKm);
    const utility = /utilit/i.test(x.category || '');
    const ret = x.returnPolicy || (x.returnLocations?.length ? (x.returnLocations.some((l) => Number(l.fee) > 0) ? 'fee' : 'free') : '');
    const policyList = x.fuelPolicy && !FUEL_POLICIES.includes(x.fuelPolicy) ? [...FUEL_POLICIES, x.fuelPolicy] : FUEL_POLICIES;
    const fromMin = x.availableFrom && x.availableFrom < todayIso() ? '' : `min="${todayIso()}"`;
    return `
      ${section('Le véhicule')}
      ${lessor ? input('Nom de l’enseigne (affiché sur le site)', `name="lessorName" maxlength="120" placeholder="Ex. Sixt Paris Gare de Lyon (annonce sans partenaire)" value="${esc(x.lessorName || '')}"`, true) : ''}
      ${input('Modèle', `name="model" required minlength="2" placeholder="Ex. Peugeot 208 ou similaire" value="${esc(String(x.model || '').replace(/ ou similaire$/i, ''))}"`)}
      ${select('Catégorie', 'category', x.category && !CATEGORIES.includes(x.category) ? [...CATEGORIES, x.category] : CATEGORIES, x.category, { required: true })}
      ${input('Places', `name="passengers" type="number" min="1" required placeholder="5" value="${esc(num(x.passengers))}"`)}
      ${input('Portes', `name="doors" type="number" min="1" required placeholder="5" value="${esc(num(x.doors))}"`)}
      ${input('Bagages (valises)', `name="bags" type="number" min="0" max="30" required placeholder="2" value="${esc(num(x.bags))}"`)}
      ${select('Boîte de vitesses', 'transmission', ['Manuelle', 'Automatique'], x.transmission, { required: true, choose: true })}
      ${select('Carburant', 'fuelType', FUEL_TYPES, x.fuelType, { required: true, choose: true })}
      <label data-util ${utility ? '' : 'hidden'}>Volume utile (m³)<input name="volumeM3" type="number" min="0.1" step="0.1" placeholder="Ex. 6" ${utility ? 'required' : 'disabled'} value="${esc(num(x.volumeM3))}"></label>
      <label data-util ${utility ? '' : 'hidden'}>Charge utile (kg)<input name="payloadKg" type="number" min="1" placeholder="Ex. 1000" ${utility ? 'required' : 'disabled'} value="${esc(num(x.payloadKg))}"></label>
      <div class="perm-grid full">${toggle('airConditioning', 'Climatisation', x.airConditioning !== false)}</div>
      <div class="full cat-preview" data-cat-preview></div>
      ${availability ? `${section('Disponibilité')}
      ${hint('Dès qu’un client réserve, l’annonce disparaît du site jusqu’à la fin de la location, puis passe en brouillon : vous la republiez quand le véhicule est prêt. Vous pouvez aussi bloquer des périodes à la main (pas de date passée).')}
      <div class="full extras-box" data-blocks>
        <div class="extras-rows" data-blk-rows>${(availability.blocks || []).map(blockRow).join('')}</div>
        <div class="extras-add"><button type="button" class="chip-btn" data-blk-add>+ Ajouter une période d’indisponibilité</button></div>
        ${(availability.rentals || []).length ? `<div class="rentals-list"><span class="dz-label">Réservations (remplies automatiquement)</span>${availability.rentals.map((r) => `<div class="rental"><b>${esc(r.reference)}</b> ${esc(r.customer)}<span>${esc(r.start)} → ${esc(r.end)}</span><em class="${r.status === 'confirmed' ? 'ok' : ''}">${r.status === 'confirmed' ? 'Confirmée' : 'Réservée, à confirmer'}</em></div>`).join('')}</div>` : ''}
      </div>` : ''}
      ${section('Période de location')}
      ${hint('Indiquez les dates entre lesquelles votre véhicule peut être loué : 30 jours au maximum, à partir d’aujourd’hui. Il n’apparaît sur le site que pour des locations comprises dans cette période, et vous pourrez la prolonger ensuite.')}
      ${input('Disponible à partir du', `name="availableFrom" type="date" required ${fromMin} value="${esc(x.availableFrom || '')}"`)}
      ${input('Disponible jusqu’au (30 jours maximum)', `name="availableUntil" type="date" required min="${esc(x.availableFrom && x.availableFrom > todayIso() ? x.availableFrom : todayIso())}" value="${esc(x.availableUntil || '')}"`)}
      ${ratesHtml(x)}
      ${section('Lieu de retrait')}
      ${input('Ville', `name="city" required data-geo="city" data-geo-country="country" placeholder="Rechercher une ville…" value="${esc(x.city && x.city !== x.pickupAddress ? x.city : '')}"`)}
      ${input('Pays', `name="country" required readonly data-code="FR" value="France" title="Les locations sont pour l’instant disponibles uniquement en France"`)}
      ${input('Adresse de retrait', `name="pickupAddress" required minlength="2" placeholder="Adresse de l’agence" value="${esc(x.pickupAddress || '')}"`, true)}
      <span class="dz-label full">Horaires d’ouverture de l’agence (obligatoire) <em>cliquez sur un jour pour l’ouvrir ou le fermer, puis choisissez l’heure</em></span>
      ${hoursHtml(x.officeHoursWeek || defaultWeek())}
      ${input('Comment retrouver l’agence', `name="pickupInstructions" maxlength="500" placeholder="Ex. Navette gratuite devant le terminal 2" value="${esc(x.pickupInstructions || '')}"`)}
      ${section('Restitution dans un autre lieu')}
      ${hint('Le client peut-il rendre le véhicule ailleurs qu’à l’agence où il l’a retiré ? Les frais éventuels sont ajoutés au total de la location.')}
      ${select('Restitution dans un autre lieu', 'returnPolicy', [['none', 'Non : retour à l’agence de retrait uniquement'], ['free', 'Oui, sans frais supplémentaires'], ['fee', 'Oui, avec des frais supplémentaires']], ret, { required: true, choose: true })}
      ${input('Montant des frais (€)', `name="returnFee" type="number" min="0.01" step="0.01" placeholder="Ex. 50" value="${esc(x.returnFee > 0 ? x.returnFee : (x.returnLocations || []).reduce((n, l) => Math.max(n, Number(l.fee) || 0), 0) || '')}"`)}
      <div class="full extras-box" data-rlocs>
        <span class="dz-label">Lieux où le véhicule peut être rendu <em>en plus de l’agence de retrait ; le client en choisit un à la réservation</em></span>
        <div class="extras-rows" data-rloc-rows>${(x.returnLocations || (x.returnLocation ? [{ name: x.returnLocation }] : [])).map(locRow).join('')}</div>
        <div class="extras-add"><button type="button" class="chip-btn" data-rloc-add>+ Ajouter un lieu</button></div>
      </div>
      ${section('Inclus dans le prix (obligatoire)')}
      ${hint('Cochez ce qui est réellement inclus : cela s’affiche sur le site sous « Inclus dans le prix ». Au moins un élément est nécessaire.')}
      <div class="perm-grid full" data-incl-toggles>${toggle('freeModification', 'Modifications gratuites', x.freeModification)}${toggle('theftProtection', 'Protection contre le vol', x.theftProtection)}${toggle('fullInsurance', 'Assurance tous risques', x.fullInsurance)}${toggle('taxesIncluded', 'Taxes locales incluses', x.taxesIncluded !== false)}</div>
      <div class="full extras-box" data-incl>
        <span class="dz-label">Autres éléments inclus dans le prix <em>écrits par vous : ils s’affichent avec une coche sur le site</em></span>
        <div class="extras-rows" data-incl-rows>${(x.includedCustom || []).map(inclRow).join('')}</div>
        <div class="extras-add"><button type="button" class="chip-btn" data-incl-add>+ Ajouter un élément inclus</button></div>
      </div>
      ${section('Annulation, kilométrage et carburant')}
      ${hint('Si le client annule en dehors de la période gratuite, il paie les frais d’annulation que vous fixez (ils sont déduits de ce qu’il a déjà réglé en ligne).')}
      ${select('Annulation', 'freeCancelHours', CANCEL, x.freeCancelHours ?? '', { required: true, choose: true })}
      ${input('Frais d’annulation (€)', `name="cancelFee" type="number" min="0.01" step="0.01" required placeholder="Ex. 30" value="${esc(x.cancelFee > 0 ? x.cancelFee : '')}"`)}
      ${input('Assurance incluse (facultatif)', `name="insuranceType" maxlength="120" placeholder="Ex. CDW et TP avec une franchise de 1 200 €" value="${esc(x.insuranceType || '')}"`)}
      <div class="perm-grid full">${toggle('unlimitedKm', 'Kilométrage illimité', unlimited)}</div>
      ${input('Kilométrage inclus (km / jour)', `name="kmPerDay" type="number" min="1" required placeholder="250" ${unlimited ? 'disabled' : ''} value="${esc(num(x.kmPerDay))}"`)}
      ${input('Supplément par km en plus (€)', `name="extraKmPrice" type="number" min="0" step="0.01" required placeholder="0.20" ${unlimited ? 'disabled' : ''} value="${esc(num(x.extraKmPrice))}"`)}
      ${select('Politique carburant', 'fuelPolicy', policyList, x.fuelPolicy, { required: true, choose: true })}
      ${section('Âge du conducteur')}
      ${hint('Indiquez à partir de quel âge votre véhicule est loué, et si les conducteurs plus jeunes paient un supplément.')}
      ${select('Âge minimum du conducteur', 'minAge', MIN_AGES, x.minAge ?? '', { required: true, choose: true })}
      ${select('Conducteur jeune : supplément', 'youngDriverAge', YOUNG_AGES, x.youngDriverFee > 0 ? (x.youngDriverAge ?? '') : (x.id || x.model ? 'none' : ''), { required: true, choose: true })}
      ${input('Montant du supplément jeune conducteur (€)', `name="youngDriverFee" type="number" min="0.01" step="0.01" placeholder="Ex. 25" ${x.youngDriverFee > 0 ? 'required' : 'disabled'} value="${esc(x.youngDriverFee > 0 ? x.youngDriverFee : '')}"`)}
      ${select('Facturation du supplément', 'youngDriverPricing', [['day', 'Par jour de location'], ['once', 'Forfait unique']], x.youngDriverPricing || 'day', {})}
      ${lessor ? `${section('Franchise et protection')}${hint('Fixées par TripVision, identiques pour toutes les voitures : la franchise et le prix de sa protection se règlent avec le bouton « Franchise » de la page Annonces véhicules. Rien à saisir ici.')}` : ''}
      ${section('Options payantes (facultatif)')}
      ${hint('Ajoutez les options proposées avec ce véhicule : nom, description, prix, quantité maximale. Le client les choisit pendant sa réservation.')}
      <div class="full extras-box" data-extras>
        <div class="extras-rows" data-extras-rows>${(x.extras || []).map(rowHtml).join('')}</div>
        <div class="extras-add"><span>Ajouter :</span>${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip-btn" data-extra-preset="${k}" ${(x.extras || []).some((e) => e.key === k) ? 'hidden' : ''}>+ ${esc(p.name)}</button>`).join('')}<button type="button" class="chip-btn" data-extra-new>+ Autre option</button></div>
      </div>
      ${section('Conditions de location')}
      ${hint('Ce texte est celui de l’enseigne : il s’affiche tel quel sous « Conditions de location » sur le site.')}
      <label class="full">Conditions de location de l’enseigne<textarea name="rentalConditions" rows="4" required minlength="10" placeholder="Conditions générales de location de l’enseigne…">${esc(x.rentalConditions || '')}</textarea></label>
      <label class="full">Conseils au voyageur (facultatif)<textarea name="tips" rows="2" maxlength="600" placeholder="Ex. Prévoyez un document d’identité et votre permis de conduire.">${esc(x.tips || '')}</textarea></label>`;
  }

  function read(f) {
    const g = (n) => f.elements.namedItem(n);
    const val = (n) => (g(n)?.value ?? '').trim();
    const n = (name) => (val(name) === '' ? undefined : Number(val(name)));
    const unlimited = g('unlimitedKm').checked;
    const policy = val('returnPolicy');
    if (!policy) throw new Error('Indiquez si le véhicule peut être rendu dans un autre lieu.');
    const checkRows = [...f.querySelectorAll('.rloc-row')].filter((row) => row.querySelector('[data-lf=name]').value.trim());
    if (policy !== 'none' && !checkRows.length) throw new Error('Indiquez au moins un lieu où le véhicule peut être rendu.');
    if (policy === 'fee' && !(n('returnFee') > 0)) throw new Error('Indiquez le montant des frais de restitution dans un autre lieu.');
    const youngRaw = val('youngDriverAge');
    if (!youngRaw) throw new Error('Indiquez si un supplément jeune conducteur s’applique.');
    if (youngRaw !== 'none' && !(n('youngDriverFee') > 0)) throw new Error('Indiquez le montant du supplément jeune conducteur.');
    if (!DAYS.some(([k]) => f.querySelector(`[data-hd=${k}]`).checked)) throw new Error('Indiquez les horaires d’ouverture de l’agence (au moins un jour).');
    const customIncl = [...f.querySelectorAll('[data-if]')].map((i) => i.value.trim()).filter(Boolean);
    if (!['freeModification', 'theftProtection', 'fullInsurance', 'taxesIncluded'].some((k) => g(k).checked) && !customIncl.length) throw new Error('Indiquez au moins un élément inclus dans le prix.');
    if (!(n('cancelFee') > 0)) throw new Error('Indiquez les frais d’annulation.');
    if (/utilit/i.test(val('category')) && !(n('volumeM3') > 0 && n('payloadKg') > 0)) throw new Error('Indiquez le volume utile et la charge utile du véhicule utilitaire.');
    if (val('availableFrom') < todayIso() && !f.dataset.pastOk) { /* période déjà commencée : permise seulement si elle l'était à l'enregistrement initial */ }
    if (val('availableUntil') < val('availableFrom')) throw new Error('La fin de la période de location doit suivre son début.');
    if (val('availableUntil') < todayIso()) throw new Error('La période de location ne peut pas se terminer dans le passé.');
    if (new Date(`${val('availableUntil')}T00:00:00Z`) - new Date(`${val('availableFrom')}T00:00:00Z`) > 30 * 864e5) throw new Error('Un véhicule peut être mis en ligne pour 30 jours au maximum.');
    const rates = readRates(f);
    if (!rates.tiers.every((t) => t > 0)) throw new Error('Indiquez un prix par jour pour chaque palier de la grille de tarifs.');
    if (rates.seasons.some((z) => !z.name || !z.from || !z.to || !(z.coef >= 0.5 && z.coef <= 3))) throw new Error('Vérifiez vos saisons : un nom, des dates au format jj/mm et un coefficient entre 0,5 et 3.');
    if (rates.minDays > rates.maxDays) throw new Error('La durée minimale doit être inférieure à la durée maximale.');
    const extras = [...f.querySelectorAll('.extra-row')].map((row) => {
      const v = (k) => row.querySelector(`[data-ef=${k}]`).value.trim();
      return { key: row.dataset.extraKey, name: v('name'), description: v('desc') || undefined, pricePerDay: Number(v('price')), pricing: v('pricing') || 'day', maxQty: Number(v('max')) || 1 };
    }).filter((e) => e.name && e.pricePerDay > 0);
    const util = /utilit/i.test(val('category'));
    return {
      model: val('model'), category: val('category'), passengers: n('passengers'), doors: n('doors'), bags: n('bags') ?? 0, transmission: val('transmission'), fuelType: val('fuelType') || undefined,
      volumeM3: util ? n('volumeM3') : undefined, payloadKg: util ? n('payloadKg') : undefined, airConditioning: g('airConditioning').checked,
      availableFrom: val('availableFrom'), availableUntil: val('availableUntil'), rates, oldPriceDay: n('oldPriceDay'), deposit: n('deposit'), excess: g('excess') ? n('excess') : undefined,
      city: val('city'), country: 'France', pickupAddress: val('pickupAddress'),
      officeHoursWeek: Object.fromEntries(DAYS.map(([k]) => [k, f.querySelector(`[data-hd=${k}]`).checked ? { open: f.querySelector(`[data-ho=${k}]`).value || '08:00', close: f.querySelector(`[data-hc=${k}]`).value || '18:00' } : null])),
      includedCustom: customIncl,
      returnPolicy: policy, returnFee: policy === 'fee' ? n('returnFee') : undefined,
      returnLocations: policy === 'none' ? [] : [...f.querySelectorAll('.rloc-row')].map((row) => { const v = (k) => row.querySelector(`[data-lf=${k}]`).value.trim(); return { key: row.dataset.key, name: v('name'), address: v('address') || undefined }; }).filter((l) => l.name),
      lessorName: g('lessorName') ? val('lessorName') || undefined : undefined,
      blocks: f.querySelector('[data-blocks]') ? [...f.querySelectorAll('.blk-row')].map((row) => { const v = (k) => row.querySelector(`[data-bf=${k}]`).value; return { start: v('start'), end: v('end'), reason: v('reason').trim() || undefined }; }) : undefined, pickupInstructions: val('pickupInstructions') || undefined,
      freeModification: g('freeModification').checked, theftProtection: g('theftProtection').checked, fullInsurance: g('fullInsurance').checked, taxesIncluded: g('taxesIncluded').checked,
      freeCancelHours: n('freeCancelHours') ?? 0, cancelFee: n('cancelFee'), insuranceType: val('insuranceType') || undefined,
      unlimitedKm: unlimited, kmPerDay: unlimited ? undefined : n('kmPerDay'), extraKmPrice: unlimited ? undefined : n('extraKmPrice'), fuelPolicy: val('fuelPolicy') || undefined,
      minAge: n('minAge'), youngDriverAge: youngRaw === 'none' ? undefined : n('youngDriverAge'), youngDriverFee: youngRaw === 'none' ? undefined : n('youngDriverFee'), youngDriverPricing: val('youngDriverPricing') || 'day',
      rentalConditions: val('rentalConditions') || undefined, tips: val('tips') || undefined, extras,
    };
  }

  // Période de location : pas de date passée, 30 jours au maximum à partir du début.
  const capPeriod = (f) => {
    const a = f?.elements?.namedItem('availableFrom'), b = f?.elements?.namedItem('availableUntil');
    if (!a || !b) return;
    const add = (d, k) => new Date(new Date(`${d}T00:00:00Z`).getTime() + k * 864e5).toISOString().slice(0, 10);
    const today = todayIso();
    if (!a.value || a.value >= today) a.min = today;
    const from = a.value && a.value > today ? a.value : today;
    b.min = from;
    if (a.value) { b.max = add(a.value, 30); if (b.value && b.value > b.max) b.value = b.max; }
  };
  document.addEventListener('change', (e) => { if (e.target.matches?.('input[name=availableFrom], input[name=availableUntil]')) capPeriod(e.target.form); });
  // Champs qui n'ont de sens que selon un choix : frais de restitution, supplément jeune conducteur, volume et charge des utilitaires, kilométrage.
  const syncConditional = (f) => {
    if (!f?.elements) return;
    const policy = f.elements.namedItem('returnPolicy')?.value;
    const fee = f.elements.namedItem('returnFee');
    if (fee) { fee.closest('label').hidden = policy !== 'fee'; fee.disabled = policy !== 'fee'; fee.required = policy === 'fee'; }
    const box = f.querySelector('[data-rlocs]');
    if (box) { box.hidden = !policy || policy === 'none'; box.querySelectorAll('input').forEach((i) => { i.disabled = !policy || policy === 'none'; }); }
    const young = f.elements.namedItem('youngDriverAge'), yfee = f.elements.namedItem('youngDriverFee'), ypr = f.elements.namedItem('youngDriverPricing');
    if (young && yfee) { const on = Boolean(young.value) && young.value !== 'none'; yfee.disabled = !on; yfee.required = on; yfee.closest('label').hidden = !on; ypr.closest('label').hidden = !on; }
    const cat = f.elements.namedItem('category')?.value || '';
    const util = /utilit/i.test(cat);
    f.querySelectorAll('[data-util]').forEach((l) => { l.hidden = !util; const i = l.querySelector('input'); i.disabled = !util; i.required = util; });
    const unl = f.elements.namedItem('unlimitedKm')?.checked;
    for (const name of ['kmPerDay', 'extraKmPrice']) { const i = f.elements.namedItem(name); if (i) { i.disabled = Boolean(unl); i.required = !unl; } }
    if (f.querySelector('[data-util]')) syncStars(f);
  };
  // L'astérisque rouge suit le caractère obligatoire du champ (ex. volume et charge dès qu'on choisit « Utilitaire / Van »).
  const syncStars = (f) => f.querySelectorAll('label').forEach((label) => {
    const control = label.querySelector(':scope > input:not([type=hidden]):not([type=checkbox]):not([type=radio]), :scope > select, :scope > textarea');
    if (!control) return;
    let star = label.querySelector(':scope > .lbl > .req, :scope > .req');
    if (!star && control.required) {
      star = document.createElement('span');
      star.className = 'req'; star.setAttribute('aria-hidden', 'true'); star.textContent = '*';
      const text = [...label.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (text) { const name = document.createElement('span'); name.className = 'lbl'; text.replaceWith(name); name.append(text, star); } else label.prepend(star);
      label.dataset.req = '1';
    }
    if (star) star.hidden = !control.required;
  });
  document.addEventListener('change', (e) => { if (e.target.matches?.('select[name=returnPolicy], select[name=youngDriverAge], select[name=category], input[name=unlimitedKm]')) syncConditional(e.target.form); });
  new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) { const f = n.matches?.('form') ? n : n.querySelector?.('form'); if (f) { syncConditional(f); capPeriod(f); f.querySelectorAll('[data-cat-preview]').forEach(paintCatPreview); paintRates(f); } } }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('change', (e) => {
    if (!e.target.matches?.('input[name=unlimitedKm]')) return;
    const km = e.target.form.elements.namedItem('kmPerDay');
    km.disabled = e.target.checked;
    if (e.target.checked) km.value = '';
  });

  document.addEventListener('click', (e) => {
    const box = e.target.closest?.('[data-extras]');
    if (!box) return;
    const rows = box.querySelector('[data-extras-rows]');
    const add = (data) => { rows.insertAdjacentHTML('beforeend', rowHtml(data)); rows.lastElementChild.querySelector('[data-ef=price]').focus({ preventScroll: false }); };
    const preset = e.target.closest('[data-extra-preset]');
    if (preset) { const k = preset.dataset.extraPreset; add({ key: k, ...PRESETS[k] }); preset.hidden = true; return; }
    if (e.target.closest('[data-extra-new]')) { add({}); return; }
    const rm = e.target.closest('[data-extra-remove]');
    if (rm) {
      const row = rm.closest('.extra-row');
      const key = row.dataset.extraKey;
      row.remove();
      const chip = box.querySelector(`[data-extra-preset="${key}"]`);
      if (chip) chip.hidden = false;
    }
  });

  document.addEventListener('click', (e) => {
    const rl = e.target.closest?.('[data-rlocs]');
    if (rl) {
      const rows = rl.querySelector('[data-rloc-rows]');
      if (e.target.closest('[data-rloc-add]')) { rows.insertAdjacentHTML('beforeend', locRow()); rows.lastElementChild.querySelector('input').focus(); }
      else if (e.target.closest('[data-rloc-remove]')) e.target.closest('.rloc-row').remove();
    }
    const bl = e.target.closest?.('[data-blocks]');
    if (bl) {
      const rows = bl.querySelector('[data-blk-rows]');
      if (e.target.closest('[data-blk-add]')) { rows.insertAdjacentHTML('beforeend', blockRow()); rows.lastElementChild.querySelector('input').focus(); }
      else if (e.target.closest('[data-blk-remove]')) e.target.closest('.blk-row').remove();
    }
  });

  document.addEventListener('change', (e) => {
    const d = e.target.dataset?.hd;
    if (!d) return;
    const row = e.target.closest('.hrs-row');
    const on = e.target.checked;
    row.classList.toggle('off', !on);
    row.querySelectorAll('input[type=time]').forEach((t) => { t.disabled = !on; });
    row.querySelector('em').textContent = on ? '' : 'Fermé';
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-hours-copy]')) {
      const box = e.target.closest('[data-hours]');
      const open = box.querySelector('[data-ho=mon]').value, close = box.querySelector('[data-hc=mon]').value;
      box.querySelectorAll('.hrs-row').forEach((row) => { if (row.querySelector('[data-hd]').checked) { row.querySelector('[data-ho]').value = open; row.querySelector('[data-hc]').value = close; } });
      return;
    }
    const inc = e.target.closest?.('[data-incl]');
    if (inc) {
      const rows = inc.querySelector('[data-incl-rows]');
      if (e.target.closest('[data-incl-add]')) { rows.insertAdjacentHTML('beforeend', inclRow()); rows.lastElementChild.querySelector('input').focus(); }
      else if (e.target.closest('[data-incl-remove]')) e.target.closest('.incl-row').remove();
    }
  });

  window.TVVehicleForm = { html, read, CATEGORIES };
})();
