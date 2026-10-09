/* Pages dynamiques du site : guide de destination (#destination/xxx), fiche d'un pack (#pack/ID) et animations de l'accueil. */
(() => {
  const E = (v) => (typeof escapeHtml === 'function' ? escapeHtml(v) : String(v ?? ''));
  const D = () => window.TV_DEST || [];
  const img = (slug) => `/assets/dest/${slug}.jpg`;
  const norm = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const matches = (o, d) => { const n = norm(d.name); return norm(o.to_city).includes(n) || norm(o.from_city).includes(n); };
  const eur = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
  const day = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const ICON = { cal: '📅', globe: '🗣', money: '💶', plane: '✈', sun: '☀' };
  const loaded = () => typeof state !== 'undefined' && (state.flights.length || state.packs.length || state.vehicles.length || window.__tvLoaded);

  /* ---------- Guide d'une destination ---------- */
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
          <div class="dp-cta"><button class="btn gold" type="button" data-scroll="dpDeals">Voir les offres pour ${E(d.name)}</button></div>
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
        <div class="dp-places">${d.places.map(([t, x], i) => `<article><b>${String(i + 1).padStart(2, '0')}</b><h3>${E(t)}</h3><p>${E(x)}</p></article>`).join('')}</div>
      </div></section>
      <section class="dp-section wrap dp-tips"><span class="eyebrow">Avant de partir</span><h2>Conseils <em>pratiques</em></h2>
        <ul>${d.tips.map((t) => `<li>${E(t)}</li>`).join('')}</ul></section>
      <section class="dp-section dp-deals" id="dpDeals"><div class="wrap">
        <span class="eyebrow">Offres</span><h2>Vols et séjours pour <em>${E(d.name)}</em></h2>
        ${flights.length ? `<h3 class="dp-sub">Vols disponibles</h3><div class="grid service-grid flight-list">${flights.map((o) => flightCard(o)).join('')}</div>` : ''}
        ${packs.length ? `<h3 class="dp-sub">Séjours (vol + hôtel)</h3><div class="pack-grid">${packs.map((o) => packCard(o)).join('')}</div>` : ''}
        ${!flights.length && !packs.length ? `<div class="dp-none"><p>Aucune offre n’est publiée pour ${E(d.name)} en ce moment. De nouvelles offres arrivent régulièrement.</p><a class="btn" href="#flights" data-page-link="flights">Voir tous les vols</a> <a class="btn ghost" href="#packs" data-page-link="packs">Voir les week-ends</a></div>` : ''}
      </div></section>
      <section class="dp-section dp-others"><div class="wrap">
        <span class="eyebrow">Continuer l’exploration</span><h2>Autres <em>destinations</em></h2>
        <div class="dest-grid">${D().filter((x) => x.slug !== d.slug).map((x) => `<a class="dest-card" href="#destination/${x.slug}" data-page-link="destination/${x.slug}"><img src="${img(x.slug)}" alt="${E(x.name)}" loading="lazy" decoding="async"><span class="dest-info"><b>${E(x.name)}</b><small>${E(x.country)}</small></span><i class="dest-go">→</i></a>`).join('')}</div>
      </div></section>`;
    if (typeof bindLinks === 'function') bindLinks(root);
  }

  /* ---------- Fiche d'un pack ---------- */
  function packPage(id) {
    const root = document.getElementById('packRoot');
    if (!root) return;
    const o = typeof state !== 'undefined' ? state.packs.find((x) => String(x.id) === String(id)) : null;
    if (!o) {
      root.innerHTML = loaded()
        ? '<div class="wrap dp-missing"><h1>Offre indisponible</h1><p>Ce séjour n’est plus disponible ou n’est pas encore publié.</p><a class="btn" href="#packs" data-page-link="packs">Voir les week-ends</a></div>'
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
    const incl = [
      o.from_city ? `Vols aller-retour au départ de ${o.from_city}` : 'Vols aller-retour',
      nights ? `Hébergement ${nights} nuit${nights > 1 ? 's' : ''} à ${o.hotel_name || 'l’hôtel'}` : (o.hotel_name ? `Hébergement à ${o.hotel_name}` : ''),
      o.hotel_board ? `Formule : ${o.hotel_board}` : '',
    ].filter(Boolean);
    root.innerHTML = `
      <div class="wrap pd">
        <nav class="dp-crumb dark" aria-label="Fil d’Ariane"><a href="#home" data-page-link="home">Accueil</a><i>›</i><a href="#packs" data-page-link="packs">Week-ends</a><i>›</i><span>${E(o.to_city || title)}</span></nav>
        <div class="pd-grid">
          <div class="pd-main">
            <header class="pd-head">
              <span class="pd-badge">${E(o.badge || 'Vol + hôtel')}</span>${old && pct > 0 ? `<span class="pd-promo">−${pct}%</span>` : ''}
              <h1>${E(title)} <span class="pack-stars">${stars}</span></h1>
              <p class="pd-loc">📍 ${E([o.to_city, o.country].filter(Boolean).join(', '))}</p>
            </header>
            <div class="pd-gallery">${TVGallery.html(images, title)}</div>
            <section class="pd-block"><h2>Le séjour en un coup d’œil</h2>
              <ul class="pd-glance">${o.start_date ? `<li><span>📅</span><div><b>Départ</b>${E(day(o.start_date))}</div></li>` : ''}${o.end_date ? `<li><span>📅</span><div><b>Retour</b>${E(day(o.end_date))}</div></li>` : ''}${nights ? `<li><span>🌙</span><div><b>Durée</b>${nights + 1} jours / ${nights} nuit${nights > 1 ? 's' : ''}</div></li>` : ''}${o.from_city ? `<li><span>✈</span><div><b>Départ de</b>${E(o.from_city)}</div></li>` : ''}${o.hotel_board ? `<li><span>🍽</span><div><b>Formule</b>${E(o.hotel_board)}</div></li>` : ''}${o.hotel_stars ? `<li><span>★</span><div><b>Hôtel</b>${o.hotel_stars} étoile${Number(o.hotel_stars) > 1 ? 's' : ''}</div></li>` : ''}</ul>
            </section>
            ${o.description ? `<section class="pd-block"><h2>À propos de ce séjour</h2><p class="pd-desc">${E(o.description)}</p></section>` : ''}
            <section class="pd-block"><h2>Ce voyage comprend</h2><ul class="pd-incl">${incl.map((t) => `<li>${E(t)}</li>`).join('')}</ul>
              <p class="pd-note">Les services non listés (excursions, transferts, repas hors formule…) ne sont pas inclus. Le détail et les conditions vous sont confirmés par TripVision avant tout engagement.</p></section>
            ${dest ? `<section class="pd-block pd-guide" style="background-image:linear-gradient(90deg,rgba(6,24,19,.88),rgba(6,24,19,.35)),url('${img(dest.slug)}')"><div><span class="eyebrow">La destination</span><h2>${E(dest.name)}, ${E(dest.country)}</h2><p>${E(dest.intro[0])}</p><a class="btn gold" href="#destination/${dest.slug}" data-page-link="destination/${dest.slug}">Découvrir ${E(dest.name)} →</a></div></section>` : ''}
            <section class="pd-block"><h2>Pourquoi réserver avec TripVision</h2>
              <div class="pd-why"><div><b>Prix clair</b><p>Le prix par personne est affiché, sans frais cachés.</p></div><div><b>Accompagnement</b><p>Une équipe vous répond avant, pendant et après le séjour.</p></div><div><b>Compte client</b><p>Suivez votre réservation et téléchargez-la en PDF depuis votre espace.</p></div></div></section>
          </div>
          <aside class="pd-book" id="pdBook"><div class="pd-box">
            <small>par personne, dès</small>${old ? `<s>${eur(o.old_price)}</s>` : ''}<strong>${eur(o.price)}</strong>
            <div class="pd-rows">${o.start_date ? `<div><span>Dates</span><b>${E(day(o.start_date))}${o.end_date ? ' → ' + E(day(o.end_date)) : ''}</b></div>` : ''}${nights ? `<div><span>Durée</span><b>${nights + 1} jours / ${nights} nuits</b></div>` : ''}${o.hotel_board ? `<div><span>Formule</span><b>${E(o.hotel_board)}</b></div>` : ''}</div>
            <label class="pd-trav">Voyageurs<select id="pdTrav">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} voyageur${n > 1 ? 's' : ''}</option>`).join('')}</select></label>
            <div class="pd-total"><span>Total estimé</span><b id="pdTotal" data-price="${Number(o.price)}">${eur(Number(o.price) * 2)}</b></div>
            <button class="btn pd-cta" type="button" data-offer-book="${o.id}">Réserver ce séjour</button>
            <p class="pd-fine">Un compte TripVision est nécessaire. Aucun paiement n’est demandé à cette étape : la disponibilité et le prix vous sont confirmés ensuite.</p>
          </div></aside>
        </div>
        <section class="pd-more"><h2>D’autres séjours <em>qui pourraient vous plaire</em></h2>
          <div class="pack-grid">${state.packs.filter((x) => String(x.id) !== String(o.id)).slice(0, 3).map((x) => packCard(x)).join('') || '<p class="muted">D’autres séjours arrivent bientôt.</p>'}</div></section>
      </div>`;
    if (typeof bindLinks === 'function') bindLinks(root);
  }
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'pdTrav') return;
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
        slides[i].classList.remove('on');
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
  function renderHomeDeals() {
    const box = document.getElementById('homeDeals');
    if (!box || typeof state === 'undefined') return;
    const rows = [...state.flights].filter((o) => o.flight?.bookingUrl).sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 4);
    box.parentElement.hidden = !rows.length;
    box.innerHTML = rows.map((o) => {
      const ph = (typeof offerImages === 'function' ? offerImages(o)[0] : o.image) || '';
      return `<a class="deal-card" href="#flights" data-page-link="flights"><span class="deal-img"><img src="${E(ph)}" alt="" loading="lazy" decoding="async"></span><span class="deal-body"><small>${E(o.flight?.airline || 'Vol')}</small><b>${E(o.from_city || '')} → ${E(o.to_city || '')}</b><em>${o.start_date ? E(day(o.start_date)) : ''}</em></span><span class="deal-price"><small>dès</small><strong>${eur(o.price)}</strong></span></a>`;
    }).join('');
    if (typeof bindLinks === 'function') bindLinks(box);
  }
  function renderHomeStats() {
    const s = document.getElementById('hhStats');
    if (!s || typeof state === 'undefined') return;
    const n = (id, v) => { const el = s.querySelector(`[data-stat="${id}"]`); if (el) el.textContent = v; };
    n('dest', D().length); n('flights', state.flights.length); n('cars', state.vehicles.length); n('packs', state.packs.length);
  }

  /* ---------- Routage ---------- */
  function route(hash) {
    const [kind, arg] = String(hash || '').split('/');
    if (kind === 'destination') destination(arg);
    else if (kind === 'pack') packPage(arg);
  }
  window.TVPages = {
    route,
    refresh() { route(location.hash.slice(1)); renderHomeDeals(); renderHomeStats(); },
    init() { initHome(); renderHomeDeals(); renderHomeStats(); },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.TVPages.init()); else window.TVPages.init();
})();
