/* Effets du site public : vidéos d'ambiance des bannières, apparition au défilement, compteurs
   et animations de chargement (voiture, avion, valise) sur les boutons de recherche.
   Tout est discret et désactivé si l'utilisateur préfère moins d'animations. */
(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const saver = Boolean(navigator.connection?.saveData);
  const small = () => window.innerWidth < 760;
  const root = document.documentElement;
  const BASE = '/assets/video';

  /* ---------- Bannières vidéo ---------- */
  const HEROES = [
    ['.flight-premium-hero', 'flights', ['boarding', 'takeoff', 'clouds', 'window', 'gate', 'cockpit', 'wing-night', 'sunset-landing']],
    ['.car-premium-hero', 'cars', ['mountain-road-1', 'night-highway', 'mountain-road-2', 'mountain-road-3']],
    ['.weekend-editorial-hero', 'weekend', ['beach-1', 'oia', 'beach-2', 'beach-sunset']],
  ];
  function mountHero([sel, dir, names]) {
    const hero = document.querySelector(sel);
    if (!hero || hero.querySelector(':scope > .hero-vid')) return;
    const box = document.createElement('div');
    box.className = `hero-vid hv-${dir}`;
    box.setAttribute('aria-hidden', 'true');
    hero.prepend(box);
    const url = (n, ext) => `${BASE}/${dir}/${n}.${ext}`;
    // Téléphone, économie de données ou préférence « moins d'animations » : une seule image, pas de vidéo.
    if (reduce || saver || small()) {
      const img = new Image();
      img.alt = '';
      img.decoding = 'async';
      img.src = url(names[0], 'jpg');
      img.onload = () => box.classList.add('still');
      box.appendChild(img);
      return;
    }
    const vids = [0, 1].map(() => {
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = false; v.preload = 'auto'; v.disablePictureInPicture = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      box.appendChild(v);
      return v;
    });
    let idx = 0, cur = 0, timer = 0, active = false, dead = false;
    const setClip = (v, i) => { v.dataset.clip = String(i); v.poster = url(names[i % names.length], 'jpg'); v.src = url(names[i % names.length], 'mp4'); v.load(); };
    const swap = () => {
      if (!active || dead) return;
      const a = vids[cur], b = vids[1 - cur];
      const go = () => {
        b.currentTime = 0;
        b.play().then(() => {
          b.classList.add('on'); a.classList.remove('on');
          cur = 1 - cur;
          schedule(b);
          // Le calque masqué charge déjà le clip suivant.
          idx = (idx + 1) % names.length;
          setTimeout(() => { if (!dead) { a.pause(); setClip(a, (idx + 1) % names.length); } }, 1800);
        }).catch(() => {});
      };
      if (b.readyState >= 3) go(); else b.addEventListener('canplay', go, { once: true });
    };
    const schedule = (v) => {
      clearTimeout(timer);
      const left = Number.isFinite(v.duration) && v.duration > 0 ? Math.max(1200, (v.duration - v.currentTime - 0.9) * 1000) : 4500;
      timer = setTimeout(swap, left);
    };
    const start = () => {
      if (dead || active) return;
      active = true;
      const v = vids[cur];
      if (!v.src) { setClip(v, 0); setClip(vids[1 - cur], 1); }
      v.play().then(() => { v.classList.add('on'); schedule(v); }).catch(() => { box.classList.add('still'); });
    };
    const stop = () => { active = false; clearTimeout(timer); vids.forEach((v) => v.pause()); };
    vids.forEach((v) => v.addEventListener('error', () => {
      // Clip manquant : on saute au suivant, ou on garde l'image fixe s'il n'y en a plus.
      if (!v.src) return;
      names.splice(Number(v.dataset.clip) % names.length, 1);
      if (!names.length) { dead = true; box.classList.add('still'); return; }
      setClip(v, Number(v.dataset.clip) % names.length);
    }));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !document.hidden) start(); else stop(); }), { threshold: 0.12 });
    io.observe(hero);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (hero.getBoundingClientRect().height && hero.offsetParent) start(); });
  }

  /* ---------- Apparition au défilement ---------- */
  const SEL = ['.dest-card', '.deal-card', '.bento', '.hh-panel', '.pack-card', '.flight-card', '.rent-card', '.cat-tile', '.tips-grid article',
    '.car-intro-steps>div', '.dp-places article', '.dp-tips li', '.pd-block', '.pd-glance li', '.hh-trust-grid>div', '.trust-grid>div', '.dest-head', '.dp-section>h2',
    '.car-faq details', '.pr-sec', '.pr-card', '.hh-stats .wrap>div'].join(',');
  let reveal;
  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('fx');
    reveal = new IntersectionObserver((entries) => {
      const shown = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      shown.forEach((e, i) => {
        const el = e.target;
        reveal.unobserve(el);
        el.style.setProperty('--rvd', `${Math.min(i, 7) * 70}ms`);
        requestAnimationFrame(() => {
          el.classList.add('in');
          // Une fois l'animation faite, on rend la main au style d'origine (survols, transitions).
          setTimeout(() => { el.classList.remove('rv', 'in'); el.style.removeProperty('--rvd'); }, 1100 + Math.min(i, 7) * 70);
        });
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  }
  function scan(node) {
    if (!reveal || node.nodeType !== 1) return;
    const list = node.matches?.(SEL) ? [node] : [];
    node.querySelectorAll?.(SEL).forEach((el) => list.push(el));
    list.forEach((el) => {
      if (el.dataset.rv || el.closest('.modal,.tvga,.lightbox')) return;
      el.dataset.rv = '1';
      el.classList.add('rv');
      reveal.observe(el);
    });
  }
  let pending = [], raf = 0;
  const flush = () => { raf = 0; const batch = pending; pending = []; batch.forEach(scan); };
  if (reveal) {
    new MutationObserver((ms) => {
      ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) pending.push(n); }));
      if (!raf && pending.length) raf = requestAnimationFrame(flush);
    }).observe(document.body, { childList: true, subtree: true });
    scan(document.body);
  }

  /* ---------- Compteurs ---------- */
  function countTo(el, to) {
    const end = Number(to) || 0;
    if (el.dataset.to === String(end)) return;
    el.dataset.to = String(end);
    if (reduce || !end) { el.textContent = end; return; }
    const from = Number(el.textContent.replace(/\D/g, '')) || 0, t0 = performance.now(), dur = 1100;
    cancelAnimationFrame(Number(el.dataset.raf || 0));
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (end - from) * k);
      if (p < 1) el.dataset.raf = String(requestAnimationFrame(step));
    };
    el.dataset.raf = String(requestAnimationFrame(step));
  }

  /* ---------- Tendances : suivi anonyme des pages vues, clics et recherches ---------- */
  function track(kind, key, city, country, label) {
    if (!key) return;
    try {
      const url = `${typeof API_BASE !== 'undefined' ? API_BASE : '/api'}/public/track`;
      const body = JSON.stringify({ kind, key: String(key).slice(0, 120), city: city || undefined, country: country || undefined, label: label || undefined });
      if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      else fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch { /* rien */ }
  }
  const countryOf = (city) => window.TV_DEST?.find((d) => plainName(d.name) === plainName(city))?.country || '';
  const plainName = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\([a-z]{3}\)\s*$/i, '').trim().toLowerCase();
  const cityOnly = (v) => String(v || '').replace(/\s*\([A-Za-z]{3}\)\s*$/, '').trim();
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.flight-buy a.btn');
    if (!a || typeof state === 'undefined') return;
    const o = state.flights.find((x) => String(x.id) === a.closest('[data-offer-id]')?.dataset.offerId);
    if (o) track('flight_click', o.id, o.to_city, o.country, `${o.from_city || ''} → ${o.to_city || ''}${o.flight?.airline ? ` · ${o.flight.airline}` : ''}`);
  });
  function trackSearch(f) {
    if (f.id === 'flightSimulator') { const c = cityOnly(val(f, 'toCity')); track('search_flight', c, c, countryOf(c), `Vols vers ${c}`); }
    else if (f.id === 'packSimulator') { const c = cityOnly(val(f, 'toCity')); track('search_pack', c, c, countryOf(c), `Week-ends à ${c}`); }
    else if (f.id === 'carSearchForm') { const c = cityOnly(val(f, 'pickup')); track('search_car', c, c, countryOf(c), `Voitures à ${c}`); }
  }

  /* ---------- Chargement sur les boutons ---------- */
  const CAR = '<svg class="fx-veh fx-car" viewBox="0 0 48 26"><g class="fx-bob"><path d="M3 18v-4.4c0-1 .6-1.8 1.6-2l6.2-1.6 4.6-5.3c.5-.6 1.2-.9 2-.9h11.2c.8 0 1.5.3 2 .9l4.2 5 5.6 1.2c1 .2 1.6 1 1.6 2V18c0 .8-.6 1.4-1.4 1.4H4.4C3.6 19.4 3 18.8 3 18Z" fill="currentColor"/><path d="M17.4 7.3h5v4.5h-9zM25 7.3h4.4l3.4 4.5H25z" fill="#000" fill-opacity=".34"/></g><g class="fx-wheel" style="transform-origin:13px 20.4px"><circle cx="13" cy="20.4" r="4.3" fill="#0d1f19" stroke="currentColor" stroke-width="1.3"/><path d="M13 17.4v6M10 20.4h6" stroke="currentColor" stroke-width="1"/></g><g class="fx-wheel" style="transform-origin:35.4px 20.4px"><circle cx="35.4" cy="20.4" r="4.3" fill="#0d1f19" stroke="currentColor" stroke-width="1.3"/><path d="M35.4 17.4v6M32.4 20.4h6" stroke="currentColor" stroke-width="1"/></g></svg>';
  const JET = '<svg class="fx-jet" viewBox="0 0 64 28"><path d="M29 12.6 21 3.6h5.2L43 11.4z" fill="currentColor" fill-opacity=".62"/><path d="M6.5 14.2c0-1.6 1.2-2.7 2.9-2.9L46 8.9c6.6-.4 13.2 1.4 16 4.1.6.6.6 1.3 0 1.9-2.8 2.7-9.4 4.5-16 4.1L9.4 17c-1.7-.2-2.9-1.2-2.9-2.8z" fill="currentColor"/><path d="M8 12.2 2.2 2.8h5.6l8.6 8.8z" fill="currentColor"/><path d="M10 15.4 5 20.4h4.2l6.2-3.6z" fill="currentColor" fill-opacity=".85"/><path d="M29 15.8 16.5 26h6.2L45 16.8z" fill="currentColor"/><rect x="29.5" y="19.2" width="9" height="4.2" rx="2.1" fill="currentColor" fill-opacity=".9"/><path d="M53.5 11.2c2.4.1 5.4 1.1 7 2.4l-6.8.5z" fill="#000" fill-opacity=".38"/><g fill="#000" fill-opacity=".3"><circle cx="24" cy="13.4" r=".95"/><circle cx="28" cy="13.4" r=".95"/><circle cx="32" cy="13.4" r=".95"/><circle cx="36" cy="13.4" r=".95"/><circle cx="40" cy="13.4" r=".95"/><circle cx="44" cy="13.4" r=".95"/><circle cx="48" cy="13.4" r=".95"/></g></svg>';
  const SCENES = {
    car: `<span class="fx-lines"><i></i><i></i><i></i></span>${CAR}<span class="fx-ground"></span>`,
    plane: '<span class="fx-cloud c1"></span><span class="fx-cloud c2"></span><span class="fx-cloud c3"></span><span class="fx-cloud c4"></span><span class="fx-trail"></span>' + JET,
    bag: '<svg class="tv-icon fx-hop" aria-hidden="true"><use href="#i-suitcase"></use></svg><span class="fx-ground"></span>',
    card: '<span class="fx-card"><i></i></span><span class="fx-ground"></span>',
  };
  function busy(btn, kind, text) {
    if (!btn || btn.classList.contains('fx-busy')) return () => {};
    const html = btn.innerHTML, w = btn.offsetWidth;
    btn.style.minWidth = `${w}px`;
    btn.classList.add('fx-busy');
    btn.disabled = true;
    btn.innerHTML = `<span class="fx-scene fx-${kind}" aria-hidden="true">${SCENES[kind] || SCENES.car}</span><span class="fx-txt">${text}</span>`;
    return () => { btn.classList.remove('fx-busy'); btn.disabled = false; btn.innerHTML = html; btn.style.minWidth = ''; };
  }
  /* Une recherche ne part que si les lieux et les dates sont choisis. */
  const val = (f, n) => String(f.elements[n]?.value || '').trim();
  const plain = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\([a-z]{3}\)\s*$/i, '').trim().toLowerCase();
  const RULES = {
    flightSimulator(f) {
      if (!val(f, 'fromCity')) return ['Choisissez votre aéroport de départ.', 'fromCity'];
      if (!val(f, 'toCity')) return ['Choisissez votre aéroport d’arrivée.', 'toCity'];
      if (plain(val(f, 'fromCity')) === plain(val(f, 'toCity'))) return ['Le départ et l’arrivée doivent être différents.', 'toCity'];
      if (!val(f, 'departDate')) return ['Choisissez votre date de départ.', 'departDate'];
      const oneway = f.elements.tripType?.value === 'oneway';
      if (!oneway && !val(f, 'returnDate')) return ['Choisissez votre date de retour.', 'returnDate'];
      if (!oneway && val(f, 'returnDate') < val(f, 'departDate')) return ['La date de retour doit être postérieure à la date de départ.', 'returnDate'];
      return null;
    },
    packSimulator(f) {
      if (!val(f, 'fromCity')) return ['Choisissez votre ville de départ.', 'fromCity'];
      if (!val(f, 'toCity')) return ['Choisissez votre destination.', 'toCity'];
      if (plain(val(f, 'fromCity')) === plain(val(f, 'toCity'))) return ['Le départ et la destination doivent être différents.', 'toCity'];
      if (!val(f, 'startDate')) return ['Choisissez votre date aller.', 'startDate'];
      if (!val(f, 'endDate')) return ['Choisissez votre date retour.', 'endDate'];
      if (val(f, 'endDate') < val(f, 'startDate')) return ['La date de retour doit être postérieure à la date aller.', 'endDate'];
      return null;
    },
    carSearchForm(f) {
      if (!val(f, 'pickup')) return ['Choisissez le lieu de prise en charge.', 'pickup'];
      if (!val(f, 'startDate')) return ['Choisissez votre date de départ.', 'startDate'];
      if (!val(f, 'endDate')) return ['Choisissez votre date de retour.', 'endDate'];
      if (`${val(f, 'endDate')}T${val(f, 'endTime') || '00:00'}` <= `${val(f, 'startDate')}T${val(f, 'startTime') || '00:00'}`) return ['Le retour doit être après le départ.', 'endDate'];
      return null;
    },
  };
  function flag(f, name, msg) {
    const el = f.elements[name];
    const box = el?.closest?.('label') || el?.parentElement;
    box?.classList.add('fx-bad');
    setTimeout(() => box?.classList.remove('fx-bad'), 2600);
    try { el?.focus(); } catch { /* rien */ }
    if (typeof toast === 'function') toast(msg, 'error', 'Complétez votre recherche');
  }
  const FORMS = { carSearchForm: ['car', 'Recherche des véhicules…'], flightSimulator: ['plane', 'Recherche des vols…'], packSimulator: ['bag', 'Recherche des séjours…'] };
  document.addEventListener('submit', (e) => {
    const f = e.target;
    const cfg = f && FORMS[f.id];
    if (!cfg) return;
    if (f.dataset.fxGo) { delete f.dataset.fxGo; return; }
    const bad = RULES[f.id]?.(f);
    if (bad) { e.preventDefault(); e.stopImmediatePropagation(); flag(f, bad[1], bad[0]); return; }
    trackSearch(f);
    if (reduce) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const btn = e.submitter || f.querySelector('button[type="submit"],button:not([type])');
    const done = busy(btn, cfg[0], cfg[1]);
    setTimeout(() => {
      done();
      f.dataset.fxGo = '1';
      try { f.requestSubmit(btn || undefined); } catch { f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
      setTimeout(() => { delete f.dataset.fxGo; }, 50);
    }, 1050);
  }, true);


  /* ---------- Catégories de voitures de l'accueil : défilement lent en boucle + flèches ---------- */
  function initCatCarousel() {
    const wrap = document.querySelector('.hh-cat-wrap');
    const strip = wrap?.querySelector('.hh-cat-strip');
    if (!strip || strip.dataset.ready) return;
    strip.dataset.ready = '1';
    const items = [...strip.children];
    items.forEach((el) => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; c.removeAttribute('data-page-link'); strip.appendChild(c); });
    const half = () => (strip.children[items.length].offsetLeft - strip.children[0].offsetLeft) || 0;
    let pos = 0, last = 0, paused = false, visible = false, anim = null, resumeAt = 0;
    const SPEED = 26; // pixels par seconde : lent
    const wrapPos = () => { const h = half(); if (h > 0) pos = ((pos % h) + h) % h; };
    const apply = () => { wrapPos(); strip.scrollLeft = pos; last = strip.scrollLeft; };
    strip.addEventListener('scroll', () => { if (Math.abs(strip.scrollLeft - last) > 1.5) { pos = strip.scrollLeft; last = strip.scrollLeft; } }, { passive: true });
    const hold = (ms = 1800) => { resumeAt = performance.now() + ms; };
    ['pointerenter', 'focusin'].forEach((ev) => wrap.addEventListener(ev, () => { paused = true; }));
    ['pointerleave', 'focusout'].forEach((ev) => wrap.addEventListener(ev, () => { paused = false; hold(900); }));
    ['touchstart', 'wheel', 'pointerdown'].forEach((ev) => strip.addEventListener(ev, () => hold(3500), { passive: true }));
    new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); }, { threshold: 0.05 }).observe(wrap);
    const slide = (dir) => {
      const step = (strip.children[0].offsetWidth + 16) * 2 * dir, from = pos, t0 = performance.now(), dur = 550;
      cancelAnimationFrame(anim);
      hold(4000);
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        pos = from + step * k; apply();
        if (p < 1) anim = requestAnimationFrame(tick); else { anim = null; hold(2500); }
      };
      anim = requestAnimationFrame(tick);
    };
    wrap.querySelectorAll('[data-cat-nav]').forEach((b) => b.addEventListener('click', () => slide(Number(b.dataset.catNav))));
    if (reduce) return;
    let prev = performance.now();
    const loop = (t) => {
      const dt = Math.min(64, t - prev) / 1000;
      prev = t;
      if (visible && !paused && !document.hidden && t > resumeAt && !anim) { pos += SPEED * dt; apply(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  window.TVFX = { busy, countTo, mountHero, track };
  // Scènes animées des écrans de connexion (client et partenaire).
  function mountScenes() {
    window.TVScene?.mount(document.querySelector('#login .auth-brand-panel'), { variant: 'dusk' });
    const pa = document.querySelector('#partnerAccess');
    if (pa) { pa.classList.add('has-scene'); window.TVScene?.mount(pa, { variant: 'dawn' }); }
  }
  const init = () => { mountScenes(); Object.keys(FORMS).forEach((id) => { const f = document.getElementById(id); if (f) f.noValidate = true; }); HEROES.forEach(mountHero); initCatCarousel(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
