/* Pages dynamiques du site : guide de destination (#destination/xxx), fiche d'un pack (#pack/ID) et animations de l'accueil. */
(() => {
  const E = (v) => (typeof escapeHtml === 'function' ? escapeHtml(v) : String(v ?? ''));
  const D = () => window.TV_DEST || [];
  const img = (slug) => `/assets/dest/${slug}.jpg`;
  const norm = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const matches = (o, d) => { const n = norm(d.name); return norm(o.to_city).includes(n) || norm(o.from_city).includes(n); };
  // Prix « à partir de » par jour : le palier le moins cher de la grille de l'annonce.
  const fromDay = (v) => (window.TVPricing ? window.TVPricing.fromPrice(v) : Number(v.priceDay));
  const eur = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
  const day = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const I = (n) => `<svg class="tv-icon" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const ICON = { cal: I('calendar'), globe: I('globe'), money: I('wallet'), plane: I('plane'), sun: I('sun'), sparkle: I('sparkle') };
  // Le paiement en ligne est-il actif ? (sinon le séjour se réserve par simple demande)
  let payOn = null;
  const payConfig = () => (typeof api === 'function' ? api('/public/config').then((c) => { payOn = Boolean(c?.payments); return payOn; }).catch(() => { payOn = false; return false; }) : Promise.resolve(false));
  const loaded = () => typeof state !== 'undefined' && (state.flights.length || state.packs.length || state.vehicles.length || window.__tvLoaded);

  /* ---------- Guide d'une destination ---------- */
  // Arrivé ici par « Choisir pour moi » : on propose de relancer le tirage.
  const surprised = (slug) => { try { return sessionStorage.getItem('tvSurpriseOn') === slug; } catch { return false; } };
  function destination(slug) {
    const root = document.getElementById('destRoot');
    if (!root) return;
    const d = window.TV_DEST?.bySlug?.[slug];
    if (!d) { root.innerHTML = '<div class="wrap dp-missing"><h1>Destination introuvable</h1><p>Cette destination n’existe pas encore.</p><a class="btn" href="#flights" data-page-link="flights">Voir les vols</a></div>'; return; }
    const flights = typeof state !== 'undefined' ? state.flights.filter((o) => matches(o, d)) : [];
    const packs = typeof state !== 'undefined' ? state.packs.filter((o) => matches(o, d)) : [];
    document.title = `${d.name}, ${d.country} — vols, séjours et conseils | TripVision`;
    root.innerHTML = `
      <header class="dp-hero" style="background-image:linear-gradient(180deg,rgba(6,24,19,.55) 0%,rgba(6,24,19,.25) 40%,rgba(6,24,19,.86) 100%),url('${img(d.slug)}')">
        <div class="wrap dp-hero-in">
          <nav class="dp-crumb" aria-label="Fil d’Ariane"><a href="#home" data-page-link="home">Accueil</a><i>›</i><a href="#flights" data-page-link="flights">Vols</a><i>›</i><span>${E(d.name)}</span></nav>
          <span class="dp-country">${E(d.country)}</span>
          <h1>${E(d.name)}</h1>
          <p class="dp-tag">${E(d.tag)}</p>
          <div class="dp-chips"><span>${ICON.plane} ${E(d.flight)}</span><span>${ICON.sun} ${E(d.best)}</span></div>
          <div class="dp-cta"><button class="btn gold" type="button" data-scroll="dpDeals">Voir les offres pour ${E(d.name)}</button>${surprised(d.slug) ? `<button class="btn dp-again" type="button" data-surprise-again>${ICON.sparkle || ''} Choisir encore pour moi</button>` : ''}</div>
        </div>
      </header>
      <section class="dp-section wrap dp-presentation">
        <div class="dp-text"><span class="eyebrow">Présentation</span><h2>Découvrir <em>${E(d.name)}</em></h2>${d.intro.map((p) => `<p>${E(p)}</p>`).join('')}</div>
        <aside class="dp-facts"><h3>En un coup d’œil</h3>
          <dl><div><dt>${ICON.cal} Meilleure période</dt><dd>${E(d.best)}</dd></div><div><dt>${ICON.globe} Langues</dt><dd>${E(d.lang)}</dd></div><div><dt>${ICON.money} Monnaie</dt><dd>${E(d.money)}</dd></div><div><dt>${ICON.plane} Vol</dt><dd>${E(d.flight)}</dd></div></dl>
        </aside>
      </section>
      <section class="dp-section dp-places-wrap"><div class="wrap">
        <span class="eyebrow">À voir, à faire</span><h2>Les lieux <em>à ne pas manquer</em></h2>
        <div class="dp-places">${d.places.map(([t, x], i) => `<article><figure class="dp-pic"><img src="/assets/dest/places/${E(d.slug)}-${i}.jpg?v=3" alt="${E(t)}" loading="lazy" decoding="async"></figure><div class="dp-ptxt"><b>${String(i + 1).padStart(2, '0')}</b><h3>${E(t)}</h3><p>${E(x)}</p></div></article>`).join('')}</div>
      </div></section>
      <section class="dp-section wrap dp-tips"><span class="eyebrow">Avant de partir</span><h2>Conseils <em>pratiques</em></h2>
        <ul>${d.tips.map((t) => `<li>${E(t)}</li>`).join('')}</ul></section>
      <section class="dp-section dp-deals" id="dpDeals"><div class="wrap">
        <span class="eyebrow">Offres</span><h2>${/^france$/i.test(d.country || '') ? 'Vols, week-ends et voitures à' : 'Les vols pour'} <em>${E(d.name)}</em></h2>
        ${flights.length ? `<h3 class="dp-sub">Vols disponibles</h3>${limited(flights.map((o) => flightCard(o)), 3, 'vols', 'grid service-grid flight-list')}` : ''}
        ${packs.length ? `<h3 class="dp-sub">Week-ends (transport + hôtel)</h3>${limited(packs.map((o) => packCard(o)), 3, 'séjours', 'pack-grid')}` : ''}
        <div id="dpCars"></div>
        <div class="dp-none" id="dpNone" ${flights.length || packs.length ? 'hidden' : ''}><p>Aucune offre n’est publiée pour ${E(d.name)} en ce moment. De nouvelles offres arrivent régulièrement.</p><a class="btn" href="#flights" data-page-link="flights">Voir tous les vols</a> <a class="btn ghost" href="#packs" data-page-link="packs">Voir les week-ends</a> <a class="btn ghost" href="#cars" data-page-link="cars" data-dest-cars="${E(d.name)}">Voir les voitures</a></div>
      </div></section>
      <section class="dp-section dp-others"><div class="wrap">
        <span class="eyebrow">Continuer l’exploration</span><h2>Autres <em>destinations</em></h2>
        <div class="dest-grid">${D().filter((x) => x.slug !== d.slug).map((x) => `<a class="dest-card" href="#destination/${x.slug}" data-page-link="destination/${x.slug}"><img src="${img(x.slug)}" alt="${E(x.name)}" loading="lazy" decoding="async"><span class="dest-info"><b>${E(x.name)}</b><small>${E(x.country)}</small></span><i class="dest-go">→</i></a>`).join('')}</div>
      </div></section>`;
    if (typeof bindLinks === 'function') bindLinks(root);
    window.TVFX?.track('dest_view', d.slug, d.name, d.country, d.name);
    mountCars(d, !flights.length && !packs.length);
  }

  /* ---------- Quelques éléments à la fois, puis « Voir plus » ---------- */
  function limited(items, n, label, cls) {
    const more = items.length - n;
    return `<div class="${cls} dp-limited">${items.map((h, i) => (i < n ? h : `<div class="dp-extra" hidden>${h}</div>`)).join('')}</div>${more > 0 ? `<div class="dg-more"><button type="button" class="btn ghost" data-dp-more>Voir plus de ${label} <small>+${more}</small></button></div>` : ''}`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dp-more]');
    if (!b) return;
    const grid = b.parentElement.previousElementSibling;
    if (!b.dataset.label) b.dataset.label = b.innerHTML;
    const open = b.dataset.open !== '1';
    b.dataset.open = open ? '1' : '';
    grid.querySelectorAll(':scope > .dp-extra').forEach((x) => { x.hidden = !open; });
    b.innerHTML = open ? 'Voir moins' : b.dataset.label;
  });

  /* ---------- Voitures à louer dans la ville ---------- */
  const carMini = (v) => `<article class="car-mini">
      <div class="cm-img"><img src="${E(v.image || '')}" alt="" loading="lazy" decoding="async"><span>${E(v.category || '')}</span></div>
      <div class="cm-body"><h4>${E(String(v.name || v.model || '').replace(/\s+ou similaire\s*$/i, ''))} <small>ou similaire</small></h4>
        <p class="cm-lessor">${I('pin')} ${E([v.partner_company || 'TripVision', v.city].filter(Boolean).join(' · '))}</p>
        <ul class="cm-specs">${[v.passengers && `${v.passengers} places`, v.transmission, v.bags != null && `${v.bags} bagage${v.bags > 1 ? 's' : ''}`, v.airConditioning && 'Clim.'].filter(Boolean).map((t) => `<li>${E(t)}</li>`).join('')}</ul></div>
      <div class="cm-price"><small>à partir de</small><b>${eur(fromDay(v))}</b><em>/ jour</em><button class="btn small" type="button" data-dest-car="${E(v.id)}">Voir l’offre →</button></div>
    </article>`;
  async function mountCars(d, onlyCars) {
    const box = document.getElementById('dpCars'), none = document.getElementById('dpNone');
    if (!box || typeof api !== 'function') return;
    // Les locations de voitures sont proposées en France uniquement.
    if (!/^france$/i.test(d.country || '')) { if (none) none.hidden = !onlyCars; return; }
    let list = [];
    try { list = await api(`/public/vehicles?city=${encodeURIComponent(d.name)}`); } catch { list = []; }
    if (document.getElementById('dpCars') !== box) return;
    list = Array.isArray(list) ? list : [];
    window.__destCars = new Map(list.map((v) => [String(v.id), v]));
    if (list.length) box.innerHTML = `<h3 class="dp-sub">Locations de voitures à ${E(d.name)}</h3>${limited(list.map(carMini), 3, 'voitures', 'dp-cars')}`;
    else if (!onlyCars) box.innerHTML = `<div class="dp-nocars"><div><b>Louer une voiture</b><span>Aucune voiture n’est publiée pour ${E(d.name)} en ce moment.</span></div><a class="btn ghost" href="#cars" data-page-link="cars" data-dest-cars="${E(d.name)}">Voir les voitures</a></div>`;
    if (typeof bindLinks === 'function') bindLinks(document.getElementById('destRoot') || document);
    if (none) none.hidden = !(onlyCars && !list.length);
  }
  // « Voir les voitures » : la page des voitures s'ouvre avec la ville déjà saisie quand elle est en France.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dest-cars]');
    if (!b) return;
    const d = D().find((x) => x.name === b.dataset.destCars);
    const input = document.querySelector('#carSearchForm [name=pickup]');
    if (input && d && /^france$/i.test(d.country)) input.value = d.name;
  }, true);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dest-car]');
    if (!b) return;
    const v = window.__destCars?.get(b.dataset.destCar);
    if (v && typeof window.carsOpenVehicle === 'function') window.carsOpenVehicle(v);
  });

  /* ---------- Aperçu d'une destination : 2 photos et 2 vidéos ---------- */
  let mediaManifest = null;
  const loadManifest = () => (mediaManifest ? Promise.resolve(mediaManifest) : fetch('/assets/dest/media/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => (mediaManifest = m)));
  const mediaIO = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && e.intersectionRatio >= 0.5) { if (!v.dataset.manual) v.play().catch(() => {}); } else { v.pause(); }
  }), { threshold: [0, 0.5, 0.9] }) : null;
  // Photo d'un lieu absente : la carte reste, sans image.
  document.addEventListener('error', (e) => { if (e.target.matches?.('.dp-pic img')) e.target.closest('.dp-pic').classList.add('off'); }, true);
  async function mountMedia(d) {
    const sec = document.getElementById('dpMedia'), grid = document.getElementById('dmGrid');
    if (!sec || !grid) return;
    const m = (await loadManifest())[d.slug];
    if (!m || (!m.images?.length && !m.videos?.length)) return;
    if (document.getElementById('dpMedia') !== sec) return;
    const photo = (i) => `<button type="button" class="dm-tile photo" data-dm-photo="/assets/dest/media/${E(i.file)}" data-dm-credit="${E([i.artist, i.license].filter(Boolean).join(' · '))}" data-dm-cap="${E(i.caption || d.name)}" aria-label="Agrandir : ${E(i.caption || d.name)}"><img src="/assets/dest/media/${E(i.file)}" alt="${E(i.caption || d.name)}" loading="lazy" decoding="async"><span class="dm-cap">${E(i.caption || d.name)}</span><span class="dm-zoom">${I('search')}</span></button>`;
    const video = (v, k) => `<figure class="dm-tile video"><video muted loop playsinline preload="none" poster="/assets/dest/media/${E(v.poster)}" aria-label="Vidéo : ${E(d.name)}"><source src="/assets/dest/media/${E(v.file)}" type="video/mp4"></video><button type="button" class="dm-play" aria-label="Lire ou mettre en pause la vidéo">${I('plane')}</button><figcaption class="dm-cap">Ambiance à ${E(d.name)}</figcaption></figure>`;
    const imgs = m.images || [], vids = m.videos || [];
    // photo | vidéo / vidéo | photo
    const order = [imgs[0] && photo(imgs[0]), vids[0] && video(vids[0], 0), vids[1] && video(vids[1], 1), imgs[1] && photo(imgs[1])].filter(Boolean);
    grid.innerHTML = order.join('');
    grid.dataset.count = String(order.length);
    sec.hidden = false;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
    grid.querySelectorAll('video').forEach((v) => { if (!still) mediaIO?.observe(v); });
  }
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-dm-photo]');
    if (p) {
      const lb = document.createElement('div');
      lb.className = 'dm-lb';
      lb.innerHTML = `<figure><img src="${p.dataset.dmPhoto}" alt="${p.dataset.dmCap || ''}"><figcaption><b>${p.dataset.dmCap || ''}</b>${p.dataset.dmCredit ? `<small>Photo : ${p.dataset.dmCredit}</small>` : ''}</figcaption></figure><button type="button" aria-label="Fermer">×</button>`;
      lb.addEventListener('click', () => lb.remove());
      document.addEventListener('keydown', function esc(ev) { if (ev.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); } });
      document.body.appendChild(lb);
      return;
    }
    const b = e.target.closest('.dm-play');
    if (b) { const v = b.closest('.dm-tile').querySelector('video'); v.dataset.manual = '1'; v.paused ? v.play().catch(() => {}) : v.pause(); b.closest('.dm-tile').classList.toggle('paused', v.paused); }
  });

  /* ---------- Fiche d'un pack ---------- */
  // Un pack se réserve au plus tard la veille du départ.
  const closeInfo = (o) => {
    if (!o.start_date) return '';
    const dep = new Date(`${String(o.start_date).slice(0, 10)}T00:00:00`), last = new Date(dep.getTime() - 864e5);
    const left = Math.ceil((last.getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5);
    const when = last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return `<p class="pd-closing ${left <= 3 ? 'soon' : ''}">${I('clock')}<span>${left <= 0 ? `Dernier jour pour réserver : aujourd’hui` : left <= 3 ? `Plus que ${left} jour${left > 1 ? 's' : ''} pour réserver (jusqu’au ${when})` : `Réservation possible jusqu’au ${when}`}</span></p>`;
  };
  function packPage(id) {
    const root = document.getElementById('packRoot');
    if (!root) return;
    const o = typeof state !== 'undefined' ? state.packs.find((x) => String(x.id) === String(id)) : null;
    if (!o) {
      root.innerHTML = loaded()
        ? '<div class="wrap dp-missing"><h1>Offre indisponible</h1><p>Ce séjour n’est plus réservable (les réservations ferment la veille du départ) ou n’est pas encore publié.</p><a class="btn" href="#packs" data-page-link="packs">Voir les week-ends</a></div>'
        : '<div class="wrap dp-missing"><span class="spinner-lg"></span><p>Chargement de l’offre…</p></div>';
      if (typeof bindLinks === 'function') bindLinks(root);
      return;
    }
    const nights = Number(o.hotel_nights) || 0, old = o.old_price && Number(o.old_price) > Number(o.price), pct = old ? Math.round((1 - Number(o.price) / Number(o.old_price)) * 100) : 0;
    const stars = o.hotel_stars ? '★'.repeat(Number(o.hotel_stars)) : '';
    const title = o.hotel_name || o.title || `${o.from_city || ''} → ${o.to_city || ''}`;
    const dest = D().find((x) => matches(o, x) && norm(o.to_city).includes(norm(x.name)));
    const images = typeof offerImages === 'function' ? offerImages(o) : [o.image];
    document.title = `${title} — ${o.to_city || ''} | TripVision`;
    window.TVFX?.track('pack_view', o.id, o.to_city, o.country, title);
    const tp = typeof transportText === 'function' ? transportText(o) : '';
    const incl = [
      tp ? `Transport aller-retour : ${tp}${o.transport?.details ? ` (${o.transport.details})` : ''}` : 'Transport aller-retour',
      nights ? `Hébergement ${nights} nuit${nights > 1 ? 's' : ''} à ${o.hotel_name || 'l’hôtel'}` : (o.hotel_name ? `Hébergement à ${o.hotel_name}` : ''),
      o.hotel_board ? `Formule : ${o.hotel_board}` : '',
    ].filter(Boolean);
    root.innerHTML = `
      <div class="wrap pd">
        <nav class="dp-crumb dark" aria-label="Fil d’Ariane"><a href="#home" data-page-link="home">Accueil</a><i>›</i><a href="#packs" data-page-link="packs">Week-ends</a><i>›</i><span>${E(o.to_city || title)}</span></nav>
        <div class="pd-grid">
          <div class="pd-main">
            <header class="pd-head">
              <div class="pd-tags"><span class="pd-badge">${E(o.badge || (typeof packFormula === 'function' ? packFormula(o) : 'Week-end'))}</span>${old && pct > 0 ? `<span class="pd-promo">−${pct}%</span>` : ''}</div>
              <h1>${E(title)} <span class="pack-stars">${stars}</span></h1>
              <p class="pd-loc">${I('pin')} ${E([o.to_city, o.country].filter(Boolean).join(', '))}</p>
              ${typeof ratingsHtml === 'function' ? ratingsHtml(o, 'pk-rates big') : ''}
            </header>
            <div class="pd-gallery">${TVGallery.html(images, title)}</div>
            <ul class="pd-glance">${o.start_date ? `<li><span>${I('calendar')}</span><div><b>Départ</b>${E(day(o.start_date))}</div></li>` : ''}${o.end_date ? `<li><span>${I('calendar')}</span><div><b>Retour</b>${E(day(o.end_date))}</div></li>` : ''}${nights ? `<li><span>${I('moon')}</span><div><b>Durée</b>${nights + 1} jours / ${nights} nuit${nights > 1 ? 's' : ''}</div></li>` : ''}${tp ? `<li><span>${typeof tpIcon === 'function' ? tpIcon(o) : I('plane')}</span><div><b>Transport</b>${E(tp)}</div></li>` : ''}${o.hotel_board ? `<li><span>${I('utensils')}</span><div><b>Formule</b>${E(o.hotel_board)}</div></li>` : ''}${o.hotel_stars ? `<li><span>${I('star')}</span><div><b>Hôtel</b>${o.hotel_stars} étoile${Number(o.hotel_stars) > 1 ? 's' : ''}</div></li>` : ''}</ul>
            <section class="pd-block pd-card pd-cols${o.description ? ' two' : ''}">
              ${o.description ? `<div><h2>À propos de ce séjour</h2><p class="pd-desc">${E(o.description)}</p></div>` : ''}
              <div><h2>Ce voyage comprend</h2><ul class="pd-incl">${incl.map((t) => `<li>${E(t)}</li>`).join('')}</ul>
              <p class="pd-note">Excursions, transferts et repas hors formule non inclus. Le détail vous est confirmé avant tout engagement.</p></div>
            </section>
            <div id="pdCars"></div>
            ${dest ? `<section class="pd-block pd-guide" style="background-image:linear-gradient(90deg,rgba(6,24,19,.88),rgba(6,24,19,.3)),url('${img(dest.slug)}')"><div><span class="eyebrow">Pourquoi ${E(dest.name)} ?</span><h2>${E(dest.name)}, ${E(dest.country)}</h2><p>${E(dest.intro[0])}</p><h3 class="pd-todo-h">Que faire sur place</h3><ul class="pd-todo">${dest.places.slice(0, 4).map(([t]) => `<li>${E(t)}</li>`).join('')}</ul><a class="btn gold" href="#destination/${dest.slug}" data-page-link="destination/${dest.slug}">Tout savoir sur ${E(dest.name)} →</a></div></section>` : ''}
          </div>
          <aside class="pd-book" id="pdBook"><div class="pd-box">
            <small>par personne, dès</small>${old ? `<s>${eur(o.old_price)}</s>` : ''}<strong>${eur(o.price)}</strong>
            <div class="pd-rows">${o.start_date ? `<div><span>Dates</span><b>${E(day(o.start_date))}${o.end_date ? ' → ' + E(day(o.end_date)) : ''}</b></div>` : ''}${nights ? `<div><span>Durée</span><b>${nights + 1} jours / ${nights} nuits</b></div>` : ''}${o.hotel_board ? `<div><span>Formule</span><b>${E(o.hotel_board)}</b></div>` : ''}</div>
            <label class="pd-trav">Voyageurs<select id="pdTrav">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option value="${n}" ${n === (window.__pdTrav || 2) ? 'selected' : ''}>${n} voyageur${n > 1 ? 's' : ''}</option>`).join('')}</select></label>
            <div class="pd-total"><span>Total estimé</span><b id="pdTotal" data-price="${Number(o.price)}">${eur(Number(o.price) * (window.__pdTrav || 2))}</b></div>
            ${closeInfo(o)}
            <button class="btn pd-cta" type="button" data-offer-book="${o.id}">${payOn === false ? 'Réserver ce séjour' : 'Réserver et payer'}</button>
            <p class="pd-fine">${I('lock')} ${payOn === false ? 'Aucun paiement à cette étape : disponibilité et prix vous sont confirmés ensuite.' : 'Paiement sécurisé par carte (Stripe) : votre séjour est confirmé aussitôt.'}</p>
          </div>
          <div class="pd-why"><div>${I('wallet')}<b>Prix clair</b><p>Prix par personne, sans frais cachés.</p></div><div>${I('headphones')}<b>Accompagnement</b><p>Une équipe avant, pendant et après le séjour.</p></div><div>${I('booking')}<b>Compte client</b><p>Suivi et PDF de votre réservation.</p></div></div></aside>
        </div>
        ${state.packs.some((x) => String(x.id) !== String(o.id)) ? `<section class="pd-more"><h2>D’autres séjours <em>qui pourraient vous plaire</em></h2>
          <div class="pack-grid">${state.packs.filter((x) => String(x.id) !== String(o.id)).slice(0, 3).map((x) => packCard(x)).join('')}</div></section>` : ''}
      </div>`;
    if (typeof bindLinks === 'function') bindLinks(root);
    mountPackCars(o);
  }
  // Vente croisée : une voiture sur place pour compléter le week-end.
  async function mountPackCars(o) {
    const box = document.getElementById('pdCars');
    if (!box || !o.to_city || typeof api !== 'function') return;
    let list = [];
    try { list = await api(`/public/vehicles?city=${encodeURIComponent(o.to_city)}`); } catch { list = []; }
    if (document.getElementById('pdCars') !== box || !Array.isArray(list) || !list.length) return;
    window.__destCars = new Map(list.map((v) => [String(v.id), v]));
    box.innerHTML = `<section class="pd-block xsell"><div class="xsell-head"><span class="eyebrow">Sur place</span><h2>Une voiture pour profiter de <em>${E(o.to_city)}</em></h2><p>Récupérez une voiture en arrivant : vous êtes libre de vos mouvements tout le week-end.</p></div>${limited(list.slice(0, 6).map(carMini), 2, 'voitures', 'dp-cars')}</section>`;
    if (typeof bindLinks === 'function') bindLinks(box);
  }

  /* ---------- Page de réservation d'un pack ---------- */
  function packReserve(id, soft) {
    const root = document.getElementById('prRoot');
    if (!root || id === 'done') return;
    if (soft && root.dataset.id === String(id) && root.querySelector('#prForm, .pr-done')) return;
    const o = typeof state !== 'undefined' ? state.packs.find((x) => String(x.id) === String(id)) : null;
    if (!o) {
      root.dataset.id = '';
      root.innerHTML = loaded()
        ? '<div class="wrap dp-missing"><h1>Offre indisponible</h1><p>Ce séjour n’est plus réservable (les réservations ferment la veille du départ) ou n’est pas encore publié.</p><a class="btn" href="#packs" data-page-link="packs">Voir les week-ends</a></div>'
        : '<div class="wrap dp-missing"><span class="spinner-lg"></span><p>Chargement de l’offre…</p></div>';
      if (typeof bindLinks === 'function') bindLinks(root);
      return;
    }
    root.dataset.id = String(id);
    const nights = Number(o.hotel_nights) || 0;
    const title = o.hotel_name || o.title || `${o.from_city || ''} → ${o.to_city || ''}`;
    const stars = o.hotel_stars ? '★'.repeat(Number(o.hotel_stars)) : '';
    const photo = (typeof offerImages === 'function' ? offerImages(o)[0] : o.image) || '';
    const unit = Number(o.price) || 0;
    const start = Math.min(9, Math.max(1, Number(window.__pdTrav) || (typeof serviceFilters !== 'undefined' ? Number(serviceFilters.pack?.travelers) : 0) || 2));
    document.title = `Réserver ${title} | TripVision`;
    root.innerHTML = `
      <div class="wrap pr">
        <nav class="dp-crumb dark" aria-label="Fil d’Ariane"><a href="#home" data-page-link="home">Accueil</a><i>›</i><a href="#packs" data-page-link="packs">Week-ends</a><i>›</i><a href="#pack/${E(o.id)}" data-page-link="pack/${E(o.id)}">${E(o.to_city || title)}</a><i>›</i><span>Réservation</span></nav>
        <ol class="pr-steps" aria-label="Étapes"><li class="done"><b>${I('check')}</b>Séjour choisi</li><li class="on" id="prStep2"><b>2</b>Vos informations</li><li id="prStep3"><b>3</b>Confirmation</li></ol>
        <div class="pr-grid">
          <div class="pr-main" id="prMain">
            <form class="pr-form" id="prForm" novalidate>
              <header><h1>Réserver ce séjour</h1><p>${payOn === false ? 'Deux minutes suffisent. <b>Aucun paiement</b> n’est demandé maintenant : nous vérifions la disponibilité et le prix, puis nous vous confirmons la réservation.' : 'Deux minutes suffisent. Vous réglez en ligne par carte bancaire (<b>paiement sécurisé Stripe</b>) et votre réservation est <b>confirmée aussitôt</b>.'}</p></header>
              <section class="pr-sec"><h2><b>1</b>Voyageurs</h2>
                <div class="pr-count"><button type="button" data-step="-1" aria-label="Retirer un voyageur">${I('minus')}</button><output id="prN" aria-live="polite">${start}</output><button type="button" data-step="1" aria-label="Ajouter un voyageur">${I('plus')}</button><span id="prNLabel">voyageur${start > 1 ? 's' : ''} · 9 maximum</span></div>
              </section>
              <section class="pr-sec"><h2><b>2</b>Vos coordonnées</h2>
                <div class="pr-acct" id="prAcct"></div>
                <div class="pr-fields">
                  <label><span>Nom complet <i class="req">*</i></span><input name="name" autocomplete="name" maxlength="100" required placeholder="Prénom et nom"></label>
                  <label><span>Téléphone <i class="req">*</i></span><input name="phone" type="tel" autocomplete="tel" maxlength="40" required placeholder="+33 6 12 34 56 78"></label>
                </div>
                <label><span>Un message ? <small>(facultatif)</small></span><textarea name="message" rows="3" maxlength="2000" placeholder="Dates flexibles, enfants, besoin particulier…"></textarea></label>
              </section>
              <p class="pr-err" id="prErr" role="alert" hidden></p>
              <button class="btn pr-submit" type="submit"></button>
              <p class="pr-fine">${I('lock')} ${payOn === false ? 'Vos informations ne servent qu’à traiter cette demande.' : 'Paiement 100 % sécurisé : vos données bancaires sont saisies sur la page de Stripe et ne passent jamais par TripVision.'}</p>
            </form>
          </div>
          <aside class="pr-sum"><div class="pr-card">
            <div class="pr-photo">${photo ? `<img src="${E(photo)}" alt="" decoding="async">` : ''}<span>${E(o.badge || 'Vol + hôtel')}</span></div>
            <div class="pr-body">
              <h3>${E(title)} <em>${stars}</em></h3>
              <p class="pr-where">${I('pin')} ${E([o.to_city, o.country].filter(Boolean).join(', '))}</p>
              <ul class="pr-facts">${o.start_date ? `<li>${I('calendar')}<span>${E(day(o.start_date))}${o.end_date ? ' → ' + E(day(o.end_date)) : ''}</span></li>` : ''}${nights ? `<li>${I('moon')}<span>${nights + 1} jours / ${nights} nuit${nights > 1 ? 's' : ''}</span></li>` : ''}${o.from_city ? `<li>${I('plane')}<span>Vols de ${E(o.from_city)}</span></li>` : ''}${o.hotel_board ? `<li>${I('utensils')}<span>${E(o.hotel_board)}</span></li>` : ''}</ul>
              <div class="pr-price"><span id="prCalc">${start} × ${eur(unit)}</span><strong id="prTotal">${eur(unit * start)}</strong></div>
              <small>Total estimé, par voyageur : ${eur(unit)}</small>
              ${closeInfo(o)}
              <a class="pr-edit" href="#pack/${E(o.id)}" data-page-link="pack/${E(o.id)}">← Revoir le séjour</a>
            </div>
          </div></aside>
        </div>
      </div>`;
    if (typeof bindLinks === 'function') bindLinks(root);
    const form = root.querySelector('#prForm'), acct = root.querySelector('#prAcct'), err = root.querySelector('#prErr');
    let n = start;
    const paint = () => {
      root.querySelector('#prN').textContent = n;
      root.querySelector('#prNLabel').textContent = `voyageur${n > 1 ? 's' : ''} · 9 maximum`;
      root.querySelector('#prCalc').textContent = `${n} × ${eur(unit)}`;
      root.querySelector('#prTotal').textContent = eur(unit * n);
      form.querySelector('.pr-submit').textContent = payOn === false ? 'Envoyer ma demande de réservation' : `Payer ${eur(unit * n)} et réserver`;
      form.querySelector('[data-step="-1"]').disabled = n <= 1;
      form.querySelector('[data-step="1"]').disabled = n >= 9;
    };
    paint();
    form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { n = Math.min(9, Math.max(1, n + Number(b.dataset.step))); window.__pdTrav = n; paint(); }));
    const who = () => window.TVAuth?.session?.user;
    const drawAcct = () => {
      const u = who();
      acct.innerHTML = u
        ? `<div class="pr-ok">${I('check-circle')}<div><b>Connecté en tant que ${E(u.name || u.email)}</b><small>${E(u.email)}</small></div><button type="button" class="pr-link" data-out>Changer</button></div>`
        : `<div class="pr-need">${I('user')}<div><b>Un compte TripVision est nécessaire</b><small>Il vous permet de suivre votre réservation et de télécharger votre justificatif.</small></div><button type="button" class="btn small" data-login>Me connecter ou créer un compte</button></div>`;
      if (u) { if (!form.elements.name.value) form.elements.name.value = u.name || ''; if (!form.elements.phone.value && u.phone) form.elements.phone.value = u.phone; }
    };
    drawAcct();
    const login = async () => {
      try { await window.TVAuth.require({ reason: 'Pour réserver un séjour, connectez-vous ou créez votre compte TripVision. Vos informations saisies sont conservées.' }); } catch { return false; }
      drawAcct(); return true;
    };
    acct.addEventListener('click', async (e) => {
      if (e.target.closest('[data-login]')) await login();
      if (e.target.closest('[data-out]')) { window.TVAuth.reset(); drawAcct(); }
    });
    form.addEventListener('input', () => { err.hidden = true; form.querySelectorAll('.bad').forEach((x) => x.classList.remove('bad')); });
    const fail = (msg, el) => { err.textContent = msg; err.hidden = false; (el || err).scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus?.(); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      form.querySelectorAll('.bad').forEach((x) => x.classList.remove('bad'));
      const f = form.elements;
      const name = f.name.value.trim(), phone = f.phone.value.trim();
      if (!name) { f.name.classList.add('bad'); return fail('Indiquez votre nom complet.', f.name); }
      if (phone.replace(/[^\d]/g, '').length < 6) { f.phone.classList.add('bad'); return fail('Indiquez un numéro de téléphone valide.', f.phone); }
      const btn = form.querySelector('.pr-submit');
      const done = window.TVFX?.busy(btn, payOn === false ? 'plane' : 'card', payOn === false ? 'Envoi en cours…' : 'Ouverture du paiement…');
      try {
        if (!who() && !(await login())) { done?.(); return; }
        const s = window.TVAuth.session;
        const r = await api('/pack-bookings', { method: 'POST', headers: window.TVAuth.headers(), body: JSON.stringify({ offerId: o.id, name, phone, travelers: n, message: f.message.value.trim() || undefined }) });
        if (r?.checkoutUrl) { location.href = r.checkoutUrl; return; }
        await new Promise((res) => setTimeout(res, 500));
        root.querySelector('#prStep2').classList.replace('on', 'done');
        root.querySelector('#prStep2 b').innerHTML = I('check');
        root.querySelector('#prStep3').classList.add('on');
        root.querySelector('#prMain').innerHTML = `
          <div class="pr-done">
            <span class="pr-done-ic">${I('check')}</span>
            <h1>Demande envoyée</h1>
            <p>Merci ${E(name.split(' ')[0])} ! Nous vérifions la disponibilité de <b>${E(title)}</b> pour ${n} voyageur${n > 1 ? 's' : ''} et vous répondons très vite par e-mail à <b>${E(s.user.email)}</b>.</p>
            <ol class="pr-next"><li><b>1</b><span>Nous vérifions la disponibilité et le prix</span></li><li><b>2</b><span>Vous recevez la confirmation par e-mail</span></li><li><b>3</b><span>Vous suivez votre réservation dans votre espace client</span></li></ol>
            <div class="pr-done-btns"><a class="btn" href="#packs" data-page-link="packs">Voir d’autres week-ends</a><a class="btn ghost" href="#home" data-page-link="home">Retour à l’accueil</a></div>
          </div>`;
        if (typeof bindLinks === 'function') bindLinks(root);
        scrollTo({ top: 0, behavior: 'smooth' });
      } catch (ex) {
        done?.();
        if (ex?.message === 'CANCELLED') return;
        fail(ex?.message === 'TOO_MANY_ATTEMPTS' ? 'Trop de demandes pour le moment, réessayez dans quelques minutes.' : ex?.message === 'PAYMENT_UNAVAILABLE' ? 'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants.' : ex?.message === 'ACCOUNT_REQUIRED' ? 'Un compte est nécessaire pour réserver un séjour.' : 'Impossible de continuer. Vérifiez vos informations et réessayez.');
      }
    });
  }
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'pdTrav') return;
    window.__pdTrav = Number(e.target.value);
    const t = document.getElementById('pdTotal');
    if (t) t.textContent = eur(Number(t.dataset.price) * Number(e.target.value));
  });
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-scroll]');
    if (s) document.getElementById(s.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- Accueil : diaporama, recherche, offres du moment ---------- */
  let slideTimer = 0;
  function initHome() {
    const slides = [...document.querySelectorAll('#homeHero .hh-slide')];
    if (slides.length && !slideTimer) {
      let i = 0;
      slideTimer = setInterval(() => {
        if (document.hidden) return;
        const gone = slides[i];
        gone.classList.remove('on'); gone.classList.add('prev'); setTimeout(() => gone.classList.remove('prev'), 2000);
        i = (i + 1) % slides.length;
        slides[i].classList.add('on');
        document.querySelectorAll('#homeHero .hh-dot').forEach((d, k) => d.classList.toggle('on', k === i));
        const cap = document.getElementById('hhCaption');
        if (cap) cap.textContent = slides[i].dataset.cap || '';
      }, 6000);
    }
    const list = document.getElementById('hhDestList');
    if (list && !list.children.length) list.innerHTML = D().map((d) => `<option value="${E(d.name)}"></option>`).join('');
  }
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('#hhSearch');
    if (!f) return;
    e.preventDefault();
    const q = norm(f.elements.q.value.trim());
    if (!q) { page('flights'); location.hash = 'flights'; return; }
    const d = D().find((x) => norm(x.name) === q) || D().find((x) => norm(x.name).includes(q) || q.includes(norm(x.name)));
    const target = d ? `destination/${d.slug}` : 'flights';
    page(target); location.hash = target;
  });
  // Bons plans dénichés par TripVision : le meilleur prix par trajet (vols), par ville (voitures) et par séjour.
  const destOf = (city) => D().find((x) => norm(x.name) === norm(city));
  const bpCard = ({ href, link, attrs, pic, kicker, title, sub, price, unit }) => `<a class="bp-card" href="${href}" data-page-link="${link}" ${attrs}><span class="bp-img"><img src="${E(pic)}" alt="" loading="lazy" decoding="async"></span><span class="bp-body"><small>${kicker}</small><b>${title}</b>${sub ? `<em>${sub}</em>` : ''}</span><span class="bp-price"><small>à partir de</small><strong>${eur(price)}</strong>${unit ? `<i>${unit}</i>` : ''}</span></a>`;
  function renderHomeDeals() {
    const box = document.getElementById('homeDeals');
    if (!box || typeof state === 'undefined') return;
    const best = (list, key, price) => { const m = new Map(); for (const o of list) { const k = key(o); if (!k) continue; const c = m.get(k); if (!c || price(o) < price(c)) m.set(k, o); } return [...m.values()].sort((a, b) => price(a) - price(b)); };
    const flights = best(state.flights.filter((o) => o.flight?.bookingUrl), (o) => `${norm(o.from_city)}>${norm(o.to_city)}`, (o) => Number(o.price)).slice(0, 6);
    const cars = best(state.vehicles || [], (v) => norm(v.city || ''), fromDay).slice(0, 4);
    const packs = best(state.packs || [], (o) => norm(o.to_city || ''), (o) => Number(o.price)).slice(0, 4);
    const group = (title, icon, items, cls) => (items.length ? `<div class="bp-group ${cls}"><h3>${I(icon)} ${title}</h3><div class="bp-grid">${items.join('')}</div></div>` : '');
    box.innerHTML = group('Vols', 'plane', flights.map((o) => {
      const d = destOf(o.to_city), round = o.flight?.tripType !== 'oneway';
      return bpCard({ href: '#flights', link: 'flights', attrs: `data-route-from="${E(o.from_city || '')}" data-route-to="${E(o.to_city || '')}"`, pic: d ? img(d.slug) : (typeof offerImages === 'function' ? offerImages(o)[0] : o.image) || '', kicker: `${round ? 'Aller-retour' : 'Aller simple'} · ${E(o.flight?.airline || 'Vol')}`, title: `${E(o.from_city || '')} <i>→</i> ${E(o.to_city || '')}`, sub: '', price: o.price });
    }), 'bp-flights')
      + group('Voitures', 'car', cars.map((v) => bpCard({ href: '#cars', link: 'cars', attrs: `data-car-research="${E(v.city || '')}"`, pic: v.image || '', kicker: 'Location de voiture', title: `Voitures à ${E(v.city || '')}`, sub: `${E(v.category || '')} · ${E(v.partner_company || '')}`, price: fromDay(v), unit: '/ jour' })), 'bp-cars')
      + group('Week-ends', 'suitcase', packs.map((o) => { const d = destOf(o.to_city); return bpCard({ href: `#pack/${E(o.id)}`, link: `pack/${E(o.id)}`, attrs: '', pic: d ? img(d.slug) : (typeof offerImages === 'function' ? offerImages(o)[0] : o.image) || '', kicker: `Transport + hôtel · ${Number(o.hotel_nights) || 2} nuit${Number(o.hotel_nights) > 1 ? 's' : ''}`, title: `Week-end à ${E(o.to_city || '')}`, sub: E(o.hotel_name || ''), price: o.price, unit: '/ pers.' }); }), 'bp-packs');
    box.closest('section').hidden = !(flights.length || cars.length || packs.length);
    if (typeof bindLinks === 'function') bindLinks(box);
  }
  // Un bon plan de vol ouvre la page des vols avec ce trajet déjà recherché.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-route-from]');
    if (!a || typeof serviceFilters === 'undefined') return;
    serviceFilters.flight = { fromCity: a.dataset.routeFrom, toCity: a.dataset.routeTo, fromCode: '', toCode: '', departDate: '', returnDate: '', cabin: 'all', tripType: 'roundtrip', travelers: 1 };
    const f = document.getElementById('flightSimulator');
    if (f) { f.elements.fromCity.value = a.dataset.routeFrom; f.elements.toCity.value = a.dataset.routeTo; }
    setTimeout(() => { if (typeof renderFlights === 'function') renderFlights(); document.querySelector('#flights .service-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  });
  // Un bon plan de voiture lance la recherche dans la ville, du lendemain pour trois jours si aucune date n'est choisie.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.bp-card[data-car-research]');
    if (!a) return;
    const f = document.getElementById('carSearchForm')?.elements;
    if (!f) return;
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const t = new Date(); t.setDate(t.getDate() + 1);
    const r = new Date(t); r.setDate(r.getDate() + 3);
    if (!f.startDate.value || f.startDate.value < iso(new Date())) f.startDate.value = iso(t);
    if (!f.endDate.value || f.endDate.value <= f.startDate.value) f.endDate.value = iso(r);
    f.startDate.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);
  function renderHomeStats() {
    const s = document.getElementById('hhStats');
    if (!s || typeof state === 'undefined') return;
    const n = (id, v) => { const el = s.querySelector(`[data-stat="${id}"]`); if (!el) return; if (window.TVFX) window.TVFX.countTo(el, v); else el.textContent = v; };
    n('dest', D().length); n('flights', state.flights.length); n('cars', state.vehicles.length); n('packs', state.packs.length);
  }

  /* ---------- Explorer : chaque destination avec son vol le moins cher ---------- */
  const AFRICA = /Sénégal|Côte d’Ivoire|Cameroun|Maroc|Gabon|Congo|Tunisie|Algérie|Bénin|Togo|Mali|Guinée|Burkina/i;
  const AMERICAS = /États-Unis|Canada|Mexique|dominicaine|Guadeloupe|Martinique|Brésil|Cuba/i, ASIA = /Émirats|Thaïlande|Indonésie|Maldives|Japon|Vietnam|Inde|Turquie/i, INDIAN = /Maurice|Seychelles|Tanzanie|Cap-Vert|Égypte/i;
  const regionOf = (d) => (/^France$/i.test(d.country) && !/réunion|guadeloupe|martinique/i.test(d.slug) ? 'fr' : /guadeloupe|martinique/.test(d.slug) ? 'am' : /reunion/.test(d.slug) ? 'af' : AFRICA.test(d.country) || INDIAN.test(d.country) ? 'af' : AMERICAS.test(d.country) ? 'am' : ASIA.test(d.country) && !/Turquie/.test(d.country) ? 'asia' : 'eu');
  const inRegion = (d, r) => r === 'all' || (r === 'beach' ? Boolean(d.beach) : regionOf(d) === r);
  const REGIONS = [['all', 'Toutes'], ['beach', 'Plages et îles'], ['af', 'Afrique et océan Indien'], ['eu', 'Europe'], ['fr', 'France'], ['am', 'Amériques et Caraïbes'], ['asia', 'Asie et Moyen-Orient']];
  // Vol le moins cher vers une destination (offres publiées uniquement).
  function cheapestTo(d) {
    if (typeof state === 'undefined') return null;
    const list = state.flights.filter((o) => norm(o.to_city) === norm(d.name));
    return list.sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
  }
  const XP = { region: 'all', open: false };
  function renderExplore() {
    const sec = document.getElementById('flightExplore');
    if (!sec) return;
    const tabs = sec.querySelector('.xp-tabs'), grid = sec.querySelector('.xp-grid'), more = sec.querySelector('[data-xp-more]');
    const rows = D().map((d) => ({ d, o: cheapestTo(d) })).filter(({ d }) => inRegion(d, XP.region))
      .sort((a, b) => (a.o ? 0 : 1) - (b.o ? 0 : 1) || (a.o && b.o ? Number(a.o.price) - Number(b.o.price) : 0));
    tabs.innerHTML = REGIONS.map(([k, t]) => `<button type="button" class="xp-tab ${XP.region === k ? 'on' : ''}" data-xp-region="${k}">${t}</button>`).join('');
    const limit = XP.open ? rows.length : 9;
    grid.innerHTML = rows.slice(0, limit).map(({ d, o }, i) => {
      const f = o?.flight || {};
      const oldP = o?.old_price && Number(o.old_price) > Number(o.price) ? Math.round((1 - Number(o.price) / Number(o.old_price)) * 100) : 0;
      return `<a class="xp-card" href="#destination/${d.slug}" data-page-link="destination/${d.slug}" style="--i:${i % 9}">
        <span class="xp-img"><img src="${img(d.slug)}" alt="${E(d.name)}" loading="lazy" decoding="async">${o ? `<i class="xp-flag">${oldP ? `−${oldP} %` : 'Bon plan'}</i>` : ''}<span class="xp-tag">${E(d.tag)}</span></span>
        <span class="xp-body">
          <span class="xp-name"><b>${E(d.name)}</b><small>${E(d.country)}</small></span>
          ${o ? `<span class="xp-price"><small>Vols à partir de</small><strong>${eur(o.price)}</strong></span>
          <span class="xp-meta"><span>${I('plane')} ${E(o.from_city || 'Paris')} → ${E(d.name)}</span><span class="${f.stops ? 'stop' : 'direct'}">${f.stops ? `${f.stops} escale${f.stops > 1 ? 's' : ''}` : 'Direct'}</span><span>${f.tripType === 'oneway' ? 'Aller simple' : 'Aller-retour'}</span></span>`
          : `<span class="xp-soon">${I('plane')} Vols bientôt disponibles · <b>Découvrir ${E(d.name)} →</b></span>`}
        </span></a>`;
    }).join('');
    more.hidden = rows.length <= 9;
    more.textContent = XP.open ? 'Voir moins' : `Voir les ${rows.length} destinations`;
    if (typeof bindLinks === 'function') bindLinks(grid);
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-xp-region]');
    if (t) { XP.region = t.dataset.xpRegion; XP.open = false; renderExplore(); return; }
    if (e.target.closest('[data-xp-more]')) { XP.open = !XP.open; renderExplore(); }
  });
  // Sur les photos des destinations (accueil, vols) : « Paris → Dakar · à partir de … ».
  function paintFromPrices() {
    document.querySelectorAll('a.bento[href^="#destination/"], a.trend-tile[href^="#destination/"], a.dest-card[href^="#destination/"]').forEach((a) => {
      const d = D().find((x) => `#destination/${x.slug}` === a.getAttribute('href'));
      const o = d && cheapestTo(d);
      let chip = a.querySelector('.from-chip');
      if (!o) { chip?.remove(); return; }
      if (!chip) { chip = document.createElement('em'); chip.className = 'from-chip'; (a.querySelector(':scope > span:not(.tt-rank):not(.tt-flag):not(.xp-img)') || a).appendChild(chip); }
      chip.innerHTML = `${I('plane')}<i class="fc-route">${E(o.from_city || 'Paris')} → ${E(d.name)}</i><b>à partir de ${eur(o.price)}</b>`;
    });
  }

  /* ---------- Week-ends : destinations du monde entier, par envie ---------- */
  const WK = { tab: 'sun' };
  const WK_TABS = [['sun', 'Soleil et plages'], ['city', 'Grandes villes'], ['fr', 'France'], ['eu', 'Europe'], ['af', 'Afrique'], ['am', 'Amériques'], ['asia', 'Asie']];
  const packFrom = (d) => (typeof state === 'undefined' ? null : state.packs.filter((o) => norm(o.to_city) === norm(d.name)).sort((a, b) => Number(a.price) - Number(b.price))[0] || null);
  function renderWeekendDest() {
    const grid = document.getElementById('weekendDest');
    if (!grid) return;
    const tabs = grid.previousElementSibling;
    const list = D().filter((d) => (WK.tab === 'sun' ? d.beach : WK.tab === 'city' ? !d.beach && regionOf(d) !== 'af' : regionOf(d) === WK.tab));
    tabs.innerHTML = WK_TABS.map(([k, t]) => `<button type="button" class="xp-tab ${WK.tab === k ? 'on' : ''}" data-wk-tab="${k}">${t}</button>`).join('');
    grid.innerHTML = list.map((d, i) => { const o = packFrom(d); return `<a class="wk-card" href="#destination/${d.slug}" data-page-link="destination/${d.slug}" style="--i:${i % 12}"><img src="${img(d.slug)}" alt="${E(d.name)}" loading="lazy" decoding="async"><span><b>${E(d.name)}</b><small>${E(d.country)}</small>${o ? `<em>Séjours dès <strong>${eur(o.price)}</strong></em>` : ''}</span></a>`; }).join('');
    if (typeof bindLinks === 'function') bindLinks(grid);
  }
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-wk-tab]'); if (t) { WK.tab = t.dataset.wkTab; renderWeekendDest(); } });

  /* ---------- Accueil : plages de rêve ---------- */
  function renderBeaches() {
    const box = document.getElementById('beachRow');
    if (!box) return;
    const list = D().filter((d) => d.beach);
    box.innerHTML = list.map((d, i) => {
      const o = cheapestTo(d);
      return `<a class="bc-card" href="#destination/${d.slug}" data-page-link="destination/${d.slug}" style="--i:${i}">
        <img src="${img(d.slug)}" alt="${E(d.name)}" loading="lazy" decoding="async">
        <span class="bc-body"><small>${E(d.country)}</small><b>${E(d.name)}</b><em>${E(d.tag)}</em>
          <i class="bc-price">${o ? `${I('plane')} Vols dès <strong>${eur(o.price)}</strong>` : `${I('sun')} ${E(d.best)}`}</i></span></a>`;
    }).join('');
    if (typeof bindLinks === 'function') bindLinks(box);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-bc-nav]');
    if (!b) return;
    const row = document.getElementById('beachRow');
    row.scrollBy({ left: Number(b.dataset.bcNav) * row.clientWidth * 0.8, behavior: 'smooth' });
  });

  /* ---------- Tendances du mois : mise en avant automatique ---------- */
  let trendData = null, trendAt = 0;
  async function loadTrending() {
    if (trendData && Date.now() - trendAt < 600000) return trendData;
    try { trendData = await api('/public/trending'); trendAt = Date.now(); } catch { trendData = trendData || null; }
    return trendData;
  }
  async function renderTrending() {
    const sec = document.getElementById('homeTrending');
    const t = await loadTrending();
    if (t?.cities?.length) markHot(t);
    if (!sec) return;
    if (!t?.cities?.length) { sec.hidden = true; return; }
    const de = /^[aeiouyhéèêàâîôûœ]/i.test(t.monthName) ? 'd’' : 'de ';
    document.getElementById('trEyebrow').textContent = t.estimated ? 'À la une' : 'Tendances';
    document.getElementById('trTitle').innerHTML = `Les destinations <em>${de}${E(t.monthName)}</em>`;
    document.getElementById('trSub').textContent = t.estimated ? 'Notre sélection du moment : elle évolue automatiquement avec les visites, les recherches et les réservations.' : 'Les plus consultées, recherchées et réservées ce mois-ci. La sélection est mise à jour automatiquement.';
    document.getElementById('trendTiles').innerHTML = t.cities.slice(0, 5).map((c) => {
      const d = D().find((x) => norm(x.name) === norm(c.city));
      const target = d ? `destination/${d.slug}` : 'flights';
      return `<a class="trend-tile r${c.rank}" href="#${target}" data-page-link="${target}">${d ? `<img src="${img(d.slug)}" alt="" loading="lazy" decoding="async">` : ''}<span class="tt-rank">${c.rank}</span><span class="tt-name"><b>${E(c.city)}</b><small>${E(c.country || '')}</small></span><span class="tt-flag">${I('zap')} ${c.rank === 1 ? 'N° 1 ce mois-ci' : 'Tendance'}</span></a>`;
    }).join('');
    // offres les plus populaires (vols puis séjours)
    const flights = (t.flights || []).map((id) => state.flights.find((o) => String(o.id) === String(id))).filter(Boolean);
    const packs = (t.packs || []).map((id) => state.packs.find((o) => String(o.id) === String(id))).filter(Boolean);
    const cards = [...flights.slice(0, 3).map((o) => {
      const ph = (typeof offerImages === 'function' ? offerImages(o)[0] : o.image) || '';
      return `<a class="deal-card" href="#flights" data-page-link="flights"><span class="deal-img"><img src="${E(ph)}" alt="" loading="lazy" decoding="async"></span><span class="deal-body"><small>${E(o.flight?.airline || 'Vol')} · populaire</small><b>${E(o.from_city || '')} → ${E(o.to_city || '')}</b><em>${o.start_date ? E(day(o.start_date)) : ''}</em></span><span class="deal-price"><small>dès</small><strong>${eur(o.price)}</strong></span></a>`;
    }), ...packs.slice(0, 2).map((o) => {
      const ph = (typeof offerImages === 'function' ? offerImages(o)[0] : o.image) || '';
      return `<a class="deal-card" href="#pack/${E(o.id)}" data-page-link="pack/${E(o.id)}"><span class="deal-img"><img src="${E(ph)}" alt="" loading="lazy" decoding="async"></span><span class="deal-body"><small>Séjour · populaire</small><b>${E(o.hotel_name || o.title || o.to_city)}</b><em>${E(o.to_city || '')}</em></span><span class="deal-price"><small>dès</small><strong>${eur(o.price)}</strong></span></a>`;
    })].slice(0, 4);
    const box = document.getElementById('trendDeals');
    box.innerHTML = cards.join('');
    box.hidden = !cards.length;
    sec.hidden = false;
    if (typeof bindLinks === 'function') { bindLinks(document.getElementById('trendTiles')); bindLinks(box); }
  }
  // Pastille « Tendance » sur les trois destinations les plus demandées des grilles.
  function markHot(t) {
    const top = new Set((t.cities || []).slice(0, 3).map((c) => norm(c.city)));
    document.querySelectorAll('.dest-card[data-page-link^="destination/"]').forEach((a) => {
      const d = D().find((x) => `destination/${x.slug}` === a.dataset.pageLink);
      const hot = d && top.has(norm(d.name));
      a.classList.toggle('hot', Boolean(hot));
      if (hot && !a.querySelector('.dest-hot')) a.insertAdjacentHTML('beforeend', `<i class="dest-hot">${I('zap')} Tendance</i>`);
    });
  }

  /* ---------- Routage ---------- */
  function route(hash, soft) {
    const [kind, arg] = String(hash || '').split('/');
    if (kind === 'destination') destination(arg);
    else if (kind === 'pack') packPage(arg);
    else if (kind === 'pack-reserve') packReserve(arg, soft);
  }
  /* Retour de la page de paiement Stripe : on vérifie le règlement auprès du serveur puis on confirme. */
  window.packPaymentReturn = async (q) => {
    const root = document.getElementById('prRoot');
    if (!root) return;
    history.replaceState(null, '', `${location.pathname}#pack-reserve/done`);
    page('pack-reserve/done');
    const shell = (status, body) => `<div class="wrap pr"><ol class="pr-steps"><li class="done"><b>${I('check')}</b>Séjour choisi</li><li class="${status === 'paid' ? 'done' : 'on'}"><b>${status === 'paid' ? I('check') : 2}</b>Paiement</li><li class="${status === 'paid' ? 'on' : ''}"><b>3</b>Confirmation</li></ol><div class="pr-grid pr-single"><div class="pr-main">${body}</div></div></div>`;
    root.dataset.id = 'done';
    root.innerHTML = shell('wait', '<div class="pr-done"><span class="spinner-lg"></span><h1>Vérification du paiement…</h1><p>Merci de patienter quelques secondes.</p></div>');
    let d = null, kind = 'failed';
    try {
      if (q.get('payment') === 'success') {
        d = await api(`/payments/pack-session/${encodeURIComponent(q.get('session_id') || '')}`);
        kind = d.status === 'paid' ? 'paid' : d.status === 'awaiting' ? 'pending' : 'failed';
      } else {
        await api('/payments/pack-cancel', { method: 'POST', body: JSON.stringify({ requestId: q.get('r'), token: q.get('t') }) });
        d = { offerId: q.get('o') };
      }
    } catch (e) { console.error(e); }
    const again = d?.offerId ? `<a class="btn" href="#pack/${E(d.offerId)}" data-page-link="pack/${E(d.offerId)}">Revoir le séjour</a>` : '<a class="btn" href="#packs" data-page-link="packs">Voir les week-ends</a>';
    root.innerHTML = shell(kind, kind === 'paid'
      ? `<div class="pr-done"><span class="pr-done-ic">${I('check')}</span><h1>Merci, votre séjour est confirmé !</h1><p>Votre paiement est bien enregistré. Un e-mail récapitulatif arrive dans votre boîte de réception, et vous retrouvez votre réservation et son justificatif dans votre espace client.</p>
          <div class="pr-recap"><div><small>Référence</small><b>${E(d.reference)}</b></div><div><small>Séjour</small><b>${E(d.title)}</b></div><div><small>Voyageurs</small><b>${E(d.travelers)}</b></div><div><small>Payé en ligne</small><b>${eur(d.paid ?? d.total)}</b></div></div>
          <div class="pr-done-btns"><a class="btn" href="#login" data-page-link="login">Suivre ma réservation</a><a class="btn ghost" href="#home" data-page-link="home">Retour à l’accueil</a></div></div>`
      : kind === 'pending'
        ? `<div class="pr-done"><span class="pr-done-ic warn">!</span><h1>Paiement en cours de vérification</h1><p>Votre paiement n’est pas encore confirmé. Actualisez cette page dans un instant : vous recevrez un e-mail dès qu’il sera validé.</p><div class="pr-done-btns"><button class="btn" type="button" onclick="location.reload()">Actualiser</button></div></div>`
        : `<div class="pr-done"><span class="pr-done-ic fail">!</span><h1>Paiement non abouti</h1><p>Aucun montant n’a été débité et la réservation n’a pas été enregistrée. Vous pouvez réessayer quand vous le souhaitez.</p><div class="pr-done-btns">${again}<a class="btn ghost" href="#packs" data-page-link="packs">Voir les week-ends</a></div></div>`);
    if (typeof bindLinks === 'function') bindLinks(root);
    scrollTo(0, 0);
  };
  window.TVPages = {
    route,
    refresh() { route(location.hash.slice(1), true); renderHomeDeals(); renderHomeStats(); renderTrending().then(paintFromPrices); renderExplore(); renderBeaches(); renderWeekendDest(); paintFromPrices(); },
    init() { initHome(); renderHomeDeals(); renderHomeStats(); renderTrending(); payConfig().then(() => { const h = location.hash.slice(1); if (/^pack(-reserve)?\//.test(h) && !h.endsWith('/done')) route(h); }); },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.TVPages.init()); else window.TVPages.init();
})();
