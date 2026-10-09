/* Formulaire d'annonce de véhicule partagé (back-office et espace partenaire).
   TVVehicleForm.html(v, { gallery })  → balisage des sections
   TVVehicleForm.read(form)            → objet prêt à être envoyé à l'API
   Tout ce qui s'affiche sur le site (inclus dans le prix, protection, options, conditions de location) est saisi ici
   par le loueur ou le back-office : TripVision n'écrit aucune condition à leur place. */
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
  // L'image de l'annonce est l'image type de la catégorie choisie : ni le loueur ni le back-office ne téléversent de photo par véhicule.
  const paintCatPreview = (box) => {
    const sel = box.closest('form')?.elements.namedItem('category');
    const name = sel?.value || '';
    const url = CAT_IMAGE[name];
    box.innerHTML = url ? `<img src="${esc(url)}" alt=""><span><b>Image de l’annonce</b>Image type de la catégorie « ${esc(name)} » : elle s’affiche automatiquement sur le site.</span>` : `<span><b>Image de l’annonce</b>L’image type de la catégorie s’affichera automatiquement sur le site.</span>`;
  };
  document.addEventListener('change', (e) => { if (e.target.matches?.('select[name=category]')) e.target.form?.querySelectorAll('[data-cat-preview]').forEach(paintCatPreview); });
  const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
  const MIN_AGES = [['', 'Pas d’âge minimum (18 ans, majorité)'], ...[19, 20, 21, 22, 23, 24, 25, 26, 27, 30].map((n) => [n, `${n} ans minimum`])];
  const YOUNG_AGES = [['', 'Aucun supplément jeune conducteur'], ...[21, 22, 23, 24, 25, 26, 27, 28, 30].map((n) => [n, `Pour les moins de ${n} ans`])];
  const FUEL_POLICIES = [['', 'Non précisée'], 'Plein / plein', 'Même niveau au retour', 'Plein prépayé', 'Plein-vide'];
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
  const select = (label, name, list, current, { required = false, full = false } = {}) => `<label class="${full ? 'full' : ''}">${esc(label)}<select name="${name}" ${required ? 'required' : ''}>${list.map((x) => { const [val, text] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${String(val) === String(current ?? '') ? 'selected' : ''}>${esc(text)}</option>`; }).join('')}</select></label>`;
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
  const blockRow = (b = {}) => `
    <div class="blk-row">
      <label>Indisponible du<input data-bf="start" type="datetime-local" required value="${esc(b.start || '')}"></label>
      <label>Jusqu’au<input data-bf="end" type="datetime-local" required value="${esc(b.end || '')}"></label>
      <label>Motif (facultatif)<input data-bf="reason" maxlength="120" value="${esc(b.reason || '')}" placeholder="Ex. Entretien, loué hors du site"></label>
      <button type="button" class="btn small danger" data-blk-remove>Retirer</button>
    </div>`;

  function html(v = null, { lessor = false, availability = null } = {}) {
    const x = v || {};
    const fuelPolicies = !x.fuelPolicy || FUEL_POLICIES.some((f) => (Array.isArray(f) ? f[0] : f) === x.fuelPolicy) ? FUEL_POLICIES : [...FUEL_POLICIES, x.fuelPolicy];
    const unlimited = Boolean(x.unlimitedKm);
    return `
      ${section('Le véhicule')}
      ${lessor ? input('Nom du loueur (affiché sur le site)', `name="lessorName" maxlength="120" placeholder="Ex. Sixt Paris Gare de Lyon (annonce sans partenaire)" value="${esc(x.lessorName || '')}"`, true) : ''}
      ${input('Modèle', `name="model" required minlength="2" placeholder="Ex. Peugeot 208 ou similaire" value="${esc(String(x.model || '').replace(/ ou similaire$/i, ''))}"`)}
      ${select('Catégorie', 'category', x.category && !CATEGORIES.includes(x.category) ? [...CATEGORIES, x.category] : CATEGORIES, x.category, { required: true })}
      ${input('Places', `name="passengers" type="number" min="1" required placeholder="5" value="${esc(num(x.passengers))}"`)}
      ${input('Portes', `name="doors" type="number" min="1" required placeholder="5" value="${esc(num(x.doors))}"`)}
      ${input('Bagages (valises)', `name="bags" type="number" min="0" max="30" required placeholder="2" value="${esc(num(x.bags))}"`)}
      ${select('Boîte de vitesses', 'transmission', ['Manuelle', 'Automatique'], x.transmission)}
      ${select('Carburant', 'fuelType', FUEL_TYPES, x.fuelType)}
      ${input('Volume utile (m³, utilitaires)', `name="volumeM3" type="number" min="0" step="0.1" placeholder="Ex. 6" value="${esc(num(x.volumeM3))}"`)}
      ${input('Charge utile (kg, utilitaires)', `name="payloadKg" type="number" min="0" placeholder="Ex. 1000" value="${esc(num(x.payloadKg))}"`)}
      <div class="perm-grid full">${toggle('airConditioning', 'Climatisation', x.airConditioning !== false)}</div>
      <div class="full cat-preview" data-cat-preview></div>
      ${availability ? `${section('Disponibilité')}
      ${hint('Dès qu’un client réserve, l’annonce disparaît du site jusqu’à la fin de la location, puis passe en brouillon : vous la republiez quand le véhicule est prêt. Vous pouvez aussi bloquer des périodes à la main.')}
      <div class="full extras-box" data-blocks>
        <div class="extras-rows" data-blk-rows>${(availability.blocks || []).map(blockRow).join('')}</div>
        <div class="extras-add"><button type="button" class="chip-btn" data-blk-add>+ Ajouter une période d’indisponibilité</button></div>
        ${(availability.rentals || []).length ? `<div class="rentals-list"><span class="dz-label">Réservations (remplies automatiquement)</span>${availability.rentals.map((r) => `<div class="rental"><b>${esc(r.reference)}</b> ${esc(r.customer)}<span>${esc(r.start)} → ${esc(r.end)}</span><em class="${r.status === 'confirmed' ? 'ok' : ''}">${r.status === 'confirmed' ? 'Confirmée' : 'Réservée, à confirmer'}</em></div>`).join('')}</div>` : ''}
      </div>` : ''}
      ${section('Période de location')}
      ${hint('Indiquez les dates entre lesquelles votre véhicule peut être loué. Il n’apparaît sur le site que pour des locations comprises dans cette période.')}
      ${input('Louable à partir du', `name="availableFrom" type="date" required value="${esc(x.availableFrom || '')}"`)}
      ${input('Louable jusqu’au', `name="availableUntil" type="date" required value="${esc(x.availableUntil || '')}"`)}
      ${section('Tarifs')}
      ${hint('Les prix par jour, par semaine et par mois sont obligatoires. Le site retient automatiquement la formule la moins chère pour la durée choisie. Chaque tranche de 24 h entamée est comptée : 24 h 01 = 2 jours.')}
      ${hint('Ces prix sont ceux que le client paie au total. À la réservation, il règle en ligne un acompte de 10 % du total de sa location (options comprises) ; le solde vous est payé à l’agence lors du retrait du véhicule.')}
      ${input('Prix par jour (€)', `name="priceDay" type="number" min="1" step="0.01" required value="${esc(num(x.priceDay))}"`)}
      ${input('Prix par semaine (€)', `name="priceWeek" type="number" min="1" step="0.01" required value="${esc(num(x.priceWeek))}"`)}
      ${input('Prix par mois (€)', `name="priceMonth" type="number" min="1" step="0.01" required value="${esc(num(x.priceMonth))}"`)}
      ${input('Ancien prix par jour barré (€, facultatif)', `name="oldPriceDay" type="number" min="1" step="0.01" placeholder="Affiche une remise sur le site" value="${esc(num(x.oldPriceDay))}"`)}
      ${input('Dépôt de garantie (€, facultatif)', `name="deposit" type="number" min="0" step="1" placeholder="500" value="${esc(num(x.deposit))}"`)}
      ${input('Franchise (€, facultatif)', `name="excess" type="number" min="0" step="1" placeholder="1200" value="${esc(num(x.excess))}"`)}
      ${section('Lieu de retrait')}
      ${input('Ville', `name="city" required data-geo="city" data-geo-country="country" placeholder="Rechercher une ville…" value="${esc(x.city && x.city !== x.pickupAddress ? x.city : '')}"`)}
      ${input('Pays', `name="country" required readonly data-code="FR" value="France" title="Les locations sont pour l’instant disponibles uniquement en France"`)}
      ${input('Adresse de retrait', `name="pickupAddress" required minlength="2" placeholder="Adresse de l’agence" value="${esc(x.pickupAddress || '')}"`, true)}
      <span class="dz-label full">Horaires d’ouverture de l’agence (obligatoire) <em>cliquez sur un jour pour l’ouvrir ou le fermer, puis choisissez l’heure</em></span>
      ${hoursHtml(x.officeHoursWeek || defaultWeek())}
      ${input('Comment retrouver l’agence', `name="pickupInstructions" maxlength="500" placeholder="Ex. Navette gratuite devant le terminal 2" value="${esc(x.pickupInstructions || '')}"`)}
      ${section('Inclus dans le prix')}
      ${hint('Cochez uniquement ce qui est réellement inclus : cela s’affiche sur le site sous « Inclus dans le prix ».')}
      <div class="perm-grid full">${toggle('freeModification', 'Modifications gratuites', x.freeModification)}${toggle('theftProtection', 'Protection contre le vol', x.theftProtection)}${toggle('fullInsurance', 'Assurance tous risques', x.fullInsurance)}${toggle('taxesIncluded', 'Taxes locales incluses', x.taxesIncluded !== false)}</div>
      <div class="full extras-box" data-incl>
        <span class="dz-label">Autres éléments inclus dans le prix <em>écrits par vous : ils s’affichent avec une coche sur le site</em></span>
        <div class="extras-rows" data-incl-rows>${(x.includedCustom || []).map(inclRow).join('')}</div>
        <div class="extras-add"><button type="button" class="chip-btn" data-incl-add>+ Ajouter un élément inclus</button></div>
      </div>
      ${select('Annulation', 'freeCancelHours', CANCEL, x.freeCancelHours ?? 0)}
      ${input('Assurance incluse (facultatif)', `name="insuranceType" maxlength="120" placeholder="Ex. CDW et TP avec une franchise de 1 200 €" value="${esc(x.insuranceType || '')}"`)}
      <div class="perm-grid full">${toggle('unlimitedKm', 'Kilométrage illimité', unlimited)}</div>
      ${input('Kilométrage inclus (km / jour)', `name="kmPerDay" type="number" min="1" placeholder="250" ${unlimited ? 'disabled' : ''} value="${esc(num(x.kmPerDay))}"`)}
      ${input('Supplément par km en plus (€)', `name="extraKmPrice" type="number" min="0" step="0.01" placeholder="0.20" value="${esc(num(x.extraKmPrice))}"`)}
      ${select('Politique carburant', 'fuelPolicy', fuelPolicies, x.fuelPolicy)}
      ${section('Âge du conducteur')}
      ${hint('Indiquez à partir de quel âge votre véhicule est loué, et si les conducteurs plus jeunes paient un supplément.')}
      ${select('Âge minimum du conducteur', 'minAge', MIN_AGES, x.minAge ?? '', {})}
      ${select('Conducteur jeune : supplément', 'youngDriverAge', YOUNG_AGES, x.youngDriverFee > 0 ? (x.youngDriverAge ?? '') : '', {})}
      ${input('Montant du supplément (€)', `name="youngDriverFee" type="number" min="0" step="0.01" placeholder="Ex. 25" ${x.youngDriverFee > 0 ? '' : 'disabled'} value="${esc(x.youngDriverFee > 0 ? x.youngDriverFee : '')}"`)}
      ${select('Facturation du supplément', 'youngDriverPricing', [['day', 'Par jour de location'], ['once', 'Forfait unique']], x.youngDriverPricing || 'day', {})}
      ${section('Restitution dans un autre lieu')}
      ${hint('Le client peut-il rendre le véhicule ailleurs qu’à l’agence où il l’a retiré ? Ces frais sont ajoutés au total de la location.')}
      ${select('Restitution dans un autre lieu', 'returnPolicy', [['none', 'Non : retour à l’agence de retrait uniquement'], ['free', 'Oui, sans frais supplémentaires'], ['fee', 'Oui, avec des frais supplémentaires']], x.returnPolicy || (x.returnLocations?.length ? (x.returnLocations.some((l) => Number(l.fee) > 0) ? 'fee' : 'free') : 'none'), {})}
      ${input('Montant des frais (€)', `name="returnFee" type="number" min="0.01" step="0.01" placeholder="Ex. 50" value="${esc(x.returnFee > 0 ? x.returnFee : (x.returnLocations || []).reduce((n, l) => Math.max(n, Number(l.fee) || 0), 0) || '')}"`)}
      <div class="full extras-box" data-rlocs>
        <span class="dz-label">Lieux où le véhicule peut être rendu <em>en plus de l’agence de retrait ; le client en choisit un à la réservation</em></span>
        <div class="extras-rows" data-rloc-rows>${(x.returnLocations || (x.returnLocation ? [{ name: x.returnLocation }] : [])).map(locRow).join('')}</div>
        <div class="extras-add"><button type="button" class="chip-btn" data-rloc-add>+ Ajouter un lieu</button></div>
      </div>
      ${section('Protection de la franchise')}
      ${hint('Fixée par TripVision, au même prix pour toutes les voitures : le client peut l’ajouter à sa réservation. Rien à saisir ici.')}
      ${section('Options payantes (facultatif)')}
      ${hint('Ajoutez les options proposées avec ce véhicule : nom, description, prix, quantité maximale. Le client les choisit pendant sa réservation.')}
      <div class="full extras-box" data-extras>
        <div class="extras-rows" data-extras-rows>${(x.extras || []).map(rowHtml).join('')}</div>
        <div class="extras-add"><span>Ajouter :</span>${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip-btn" data-extra-preset="${k}" ${(x.extras || []).some((e) => e.key === k) ? 'hidden' : ''}>+ ${esc(p.name)}</button>`).join('')}<button type="button" class="chip-btn" data-extra-new>+ Autre option</button></div>
      </div>
      ${section('Conditions de location')}
      ${hint('Ce texte est celui du loueur : il s’affiche tel quel sous « Conditions de location » sur le site.')}
      <label class="full">Conditions de location du loueur<textarea name="rentalConditions" rows="4" placeholder="Conditions générales de location du loueur…">${esc(x.rentalConditions || '')}</textarea></label>
      <label class="full">Conseils au voyageur (facultatif)<textarea name="tips" rows="2" maxlength="600" placeholder="Ex. Prévoyez un document d’identité et votre permis de conduire.">${esc(x.tips || '')}</textarea></label>`;
  }

  function read(f) {
    const g = (n) => f.elements.namedItem(n);
    const val = (n) => (g(n)?.value ?? '').trim();
    const n = (name) => (val(name) === '' ? undefined : Number(val(name)));
    const unlimited = g('unlimitedKm').checked;
    const policy = val('returnPolicy') || 'none';
    const checkRows = [...f.querySelectorAll('.rloc-row')].filter((row) => row.querySelector('[data-lf=name]').value.trim());
    if (policy !== 'none' && !checkRows.length) throw new Error('Indiquez au moins un lieu où le véhicule peut être rendu.');
    if (policy === 'fee' && !(n('returnFee') > 0)) throw new Error('Indiquez le montant des frais de restitution dans un autre lieu.');
    if (n('youngDriverAge') && !(n('youngDriverFee') > 0)) throw new Error('Indiquez le montant du supplément jeune conducteur.');
    if (!DAYS.some(([k]) => f.querySelector(`[data-hd=${k}]`).checked)) throw new Error('Indiquez les horaires d’ouverture de l’agence (au moins un jour).');
    if (val('availableUntil') < val('availableFrom')) throw new Error('La fin de la période de location doit suivre son début.');
    const extras = [...f.querySelectorAll('.extra-row')].map((row) => {
      const v = (k) => row.querySelector(`[data-ef=${k}]`).value.trim();
      return { key: row.dataset.extraKey, name: v('name'), description: v('desc') || undefined, pricePerDay: Number(v('price')), pricing: v('pricing') || 'day', maxQty: Number(v('max')) || 1 };
    }).filter((e) => e.name && e.pricePerDay > 0);
    return {
      model: val('model'), category: val('category'), passengers: n('passengers'), doors: n('doors'), bags: n('bags') ?? 0, transmission: val('transmission'), fuelType: val('fuelType') || undefined,
      volumeM3: n('volumeM3'), payloadKg: n('payloadKg'), airConditioning: g('airConditioning').checked,
      availableFrom: val('availableFrom'), availableUntil: val('availableUntil'), priceDay: n('priceDay'), priceWeek: n('priceWeek'), priceMonth: n('priceMonth'), oldPriceDay: n('oldPriceDay'), deposit: n('deposit'), excess: n('excess'),
      city: val('city'), country: 'France', pickupAddress: val('pickupAddress'),
      officeHoursWeek: Object.fromEntries(DAYS.map(([k]) => [k, f.querySelector(`[data-hd=${k}]`).checked ? { open: f.querySelector(`[data-ho=${k}]`).value || '08:00', close: f.querySelector(`[data-hc=${k}]`).value || '18:00' } : null])),
      includedCustom: [...f.querySelectorAll('[data-if]')].map((i) => i.value.trim()).filter(Boolean),
      returnPolicy: policy, returnFee: policy === 'fee' ? n('returnFee') : undefined,
      returnLocations: policy === 'none' ? [] : [...f.querySelectorAll('.rloc-row')].map((row) => { const v = (k) => row.querySelector(`[data-lf=${k}]`).value.trim(); return { key: row.dataset.key, name: v('name'), address: v('address') || undefined }; }).filter((l) => l.name),
      lessorName: g('lessorName') ? val('lessorName') || undefined : undefined,
      blocks: f.querySelector('[data-blocks]') ? [...f.querySelectorAll('.blk-row')].map((row) => { const v = (k) => row.querySelector(`[data-bf=${k}]`).value; return { start: v('start'), end: v('end'), reason: v('reason').trim() || undefined }; }) : undefined, pickupInstructions: val('pickupInstructions') || undefined,
      freeModification: g('freeModification').checked, theftProtection: g('theftProtection').checked, fullInsurance: g('fullInsurance').checked, taxesIncluded: g('taxesIncluded').checked,
      freeCancelHours: n('freeCancelHours') ?? 0, insuranceType: val('insuranceType') || undefined,
      unlimitedKm: unlimited, kmPerDay: unlimited ? undefined : n('kmPerDay'), extraKmPrice: n('extraKmPrice'), fuelPolicy: val('fuelPolicy') || undefined,
      minAge: n('minAge'), youngDriverAge: n('youngDriverAge'), youngDriverFee: n('youngDriverAge') ? n('youngDriverFee') : undefined, youngDriverPricing: val('youngDriverPricing') || 'day',
      rentalConditions: val('rentalConditions') || undefined, tips: val('tips') || undefined, extras,
    };
  }

  // Champs qui n'ont de sens que selon un choix : frais de restitution, supplément jeune conducteur.
  const syncConditional = (f) => {
    if (!f?.elements) return;
    const policy = f.elements.namedItem('returnPolicy')?.value;
    const fee = f.elements.namedItem('returnFee');
    if (fee) { fee.closest('label').hidden = policy !== 'fee'; fee.disabled = policy !== 'fee'; }
    const box = f.querySelector('[data-rlocs]');
    if (box) box.hidden = policy === 'none';
    const young = f.elements.namedItem('youngDriverAge'), yfee = f.elements.namedItem('youngDriverFee'), ypr = f.elements.namedItem('youngDriverPricing');
    if (young && yfee) { const on = Boolean(young.value); yfee.disabled = !on; yfee.closest('label').hidden = !on; ypr.closest('label').hidden = !on; }
  };
  document.addEventListener('change', (e) => { if (e.target.matches?.('select[name=returnPolicy], select[name=youngDriverAge]')) syncConditional(e.target.form); });
  new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) { const f = n.matches?.('form') ? n : n.querySelector?.('form'); if (f) { syncConditional(f); f.querySelectorAll('[data-cat-preview]').forEach(paintCatPreview); } } }).observe(document.body, { childList: true, subtree: true });

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
