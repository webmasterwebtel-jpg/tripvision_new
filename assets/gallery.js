/* Galerie d'images TripVision : carrousel animé + visionneuse plein écran avec zoom.
   TVGallery.html(images, alt)  → balisage d'un carrousel (les clics sont gérés globalement). */
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function html(images, alt = '', opts = {}) {
    const list = (images || []).filter(Boolean);
    if (!list.length) return '';
    const many = list.length > 1;
    return `<div class="tv-gal" data-tv-gal data-i="0" data-images="${esc(JSON.stringify(list))}" data-alt="${esc(alt)}">
      <div class="tv-gal-track">${list.map((u, i) => `<div class="tv-gal-slide"><img src="${esc(u)}" alt="${esc(alt)}${many ? ` — photo ${i + 1}` : ''}" draggable="false" data-tv-open="${i}"></div>`).join('')}</div>
      ${opts.spin && opts.spin.length >= 1 ? `<button type="button" class="tv-spin-btn" data-tv-spin data-frames="${esc(JSON.stringify(opts.spin))}" data-title="${esc(alt)}" aria-label="Voir le véhicule à 360 degrés"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 4 0 1 1-8-4M12 4l-3 4 4 1"/></svg>360°</button>` : ''}
      <span class="tv-gal-zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 8.5v5M8.5 11h5"/></svg></span>
      ${many ? `<button type="button" class="tv-gal-nav prev" data-tv-nav="-1" aria-label="Photo précédente">‹</button><button type="button" class="tv-gal-nav next" data-tv-nav="1" aria-label="Photo suivante">›</button>
      <div class="tv-gal-dots">${list.map((_, i) => `<button type="button" class="${i ? '' : 'on'}" data-tv-dot="${i}" aria-label="Photo ${i + 1}"></button>`).join('')}</div>
      <span class="tv-gal-count">1 / ${list.length}</span>` : ''}
    </div>`;
  }

  const imagesOf = (g) => { try { return JSON.parse(g.dataset.images); } catch { return []; } };

  function goTo(g, i) {
    const n = imagesOf(g).length;
    if (!n) return;
    i = (i + n) % n;
    g.dataset.i = i;
    g.querySelector('.tv-gal-track').style.transform = `translateX(-${i * 100}%)`;
    g.querySelectorAll('.tv-gal-slide').forEach((s, k) => s.classList.toggle('on', k === i));
    g.querySelectorAll('[data-tv-dot]').forEach((d, k) => d.classList.toggle('on', k === i));
    const c = g.querySelector('.tv-gal-count');
    if (c) c.textContent = `${i + 1} / ${n}`;
  }

  /* ---------- Visionneuse plein écran avec zoom ---------- */
  let box = null, lb = null;
  const MAX = 5, MIN = 1;

  function build() {
    box = document.createElement('div');
    box.className = 'tv-lb';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Visionneuse de photos');
    box.innerHTML = `
      <div class="tv-lb-top"><span class="tv-lb-title"></span><span class="tv-lb-count"></span>
        <div class="tv-lb-tools"><button type="button" data-lb="out" aria-label="Dézoomer">−</button><button type="button" data-lb="in" aria-label="Zoomer">+</button><button type="button" data-lb="reset" aria-label="Taille d’origine">1:1</button><button type="button" data-lb="close" aria-label="Fermer">✕</button></div></div>
      <div class="tv-lb-stage"><img class="tv-lb-img" alt="" draggable="false"></div>
      <button type="button" class="tv-lb-nav prev" data-lb="prev" aria-label="Photo précédente">‹</button>
      <button type="button" class="tv-lb-nav next" data-lb="next" aria-label="Photo suivante">›</button>
      <div class="tv-lb-thumbs"></div>
      <p class="tv-lb-hint">Molette ou double-clic pour zoomer · glissez pour déplacer · ← → pour changer de photo</p>`;
    document.body.appendChild(box);
    const stage = box.querySelector('.tv-lb-stage'), img = box.querySelector('.tv-lb-img');
    lb = { box, stage, img, list: [], i: 0, alt: '', s: 1, x: 0, y: 0, drag: null, pointers: new Map(), pinch: 0 };

    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (b) {
        const a = b.dataset.lb;
        if (a === 'close') close();
        else if (a === 'prev') step(-1);
        else if (a === 'next') step(1);
        else if (a === 'in') zoomAt(lb.s * 1.5);
        else if (a === 'out') zoomAt(lb.s / 1.5);
        else if (a === 'reset') reset();
        return;
      }
      const t = e.target.closest('[data-lb-thumb]');
      if (t) { show(Number(t.dataset.lbThumb)); return; }
      if (e.target === stage && lb.s === 1) close();
    });
    stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(lb.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); }, { passive: false });
    img.addEventListener('dblclick', (e) => { lb.s > 1 ? reset() : zoomAt(2.5, e.clientX, e.clientY); });
    stage.addEventListener('pointerdown', (e) => {
      stage.setPointerCapture(e.pointerId);
      lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (lb.pointers.size === 2) lb.pinch = dist();
      else lb.drag = { x: e.clientX, y: e.clientY, ox: lb.x, oy: lb.y, moved: false };
    });
    stage.addEventListener('pointermove', (e) => {
      if (!lb.pointers.has(e.pointerId)) return;
      lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (lb.pointers.size === 2) {
        const d = dist();
        if (lb.pinch) { const c = center(); zoomAt(lb.s * (d / lb.pinch), c.x, c.y); }
        lb.pinch = d;
        return;
      }
      if (lb.drag && lb.s > 1) {
        const dx = e.clientX - lb.drag.x, dy = e.clientY - lb.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) lb.drag.moved = true;
        lb.x = lb.drag.ox + dx;
        lb.y = lb.drag.oy + dy;
        apply(false);
      }
    });
    const up = (e) => {
      lb.pointers.delete(e.pointerId);
      lb.pinch = 0;
      if (lb.drag && lb.s === 1 && lb.pointers.size === 0 && e.pointerType === 'touch') {
        const dx = e.clientX - lb.drag.x;
        if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
      }
      if (lb.pointers.size === 0) lb.drag = null;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === '+' || e.key === '=') zoomAt(lb.s * 1.5);
      else if (e.key === '-') zoomAt(lb.s / 1.5);
      else if (e.key === '0') reset();
    });
  }

  const dist = () => { const [a, b] = [...lb.pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const center = () => { const [a, b] = [...lb.pointers.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };

  function apply(animate = true) {
    lb.img.style.transition = animate && !reduceMotion ? 'transform .22s ease' : 'none';
    lb.img.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.s})`;
    lb.stage.classList.toggle('zoomed', lb.s > 1);
  }
  function reset() { lb.s = 1; lb.x = 0; lb.y = 0; apply(); }
  function zoomAt(next, cx, cy) {
    next = Math.min(MAX, Math.max(MIN, next));
    if (next === lb.s) return;
    const r = lb.stage.getBoundingClientRect();
    const px = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2);
    const py = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
    const k = next / lb.s;
    lb.x = px - (px - lb.x) * k;
    lb.y = py - (py - lb.y) * k;
    lb.s = next;
    if (next === 1) { lb.x = 0; lb.y = 0; }
    apply(cx === undefined);
  }
  function show(i) {
    const n = lb.list.length;
    lb.i = (i + n) % n;
    lb.s = 1; lb.x = 0; lb.y = 0;
    lb.img.style.transition = 'none';
    lb.img.classList.remove('in');
    lb.img.src = lb.list[lb.i];
    lb.img.alt = lb.alt;
    apply(false);
    requestAnimationFrame(() => lb.img.classList.add('in'));
    box.querySelector('.tv-lb-count').textContent = n > 1 ? `${lb.i + 1} / ${n}` : '';
    box.querySelectorAll('[data-lb-thumb]').forEach((t, k) => t.classList.toggle('on', k === lb.i));
    box.querySelectorAll('.tv-lb-nav').forEach((b) => { b.hidden = n < 2; });
  }
  const step = (d) => { if (lb.list.length > 1) show(lb.i + d); };

  let lastFocus = null;
  function open(list, i, alt) {
    if (!box) build();
    lb.list = list;
    lb.alt = alt || '';
    box.querySelector('.tv-lb-title').textContent = alt || '';
    box.querySelector('.tv-lb-thumbs').innerHTML = list.length > 1 ? list.map((u, k) => `<button type="button" data-lb-thumb="${k}" aria-label="Photo ${k + 1}"><img src="${esc(u)}" alt="" draggable="false"></button>`).join('') : '';
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.classList.add('tv-lb-open');
    show(i);
    box.querySelector('[data-lb="close"]').focus({ preventScroll: true });
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.body.classList.remove('tv-lb-open');
    lastFocus?.focus?.({ preventScroll: true });
  }

  /* ---------- Événements globaux sur les carrousels ---------- */
  let swipe = null, swiped = false;
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-tv-gal]');
    if (!g) return;
    const spin = e.target.closest('[data-tv-spin]');
    if (spin) { e.preventDefault(); e.stopPropagation(); try { window.TVSpin?.open(JSON.parse(spin.dataset.frames), spin.dataset.title); } catch { /* données invalides */ } return; }
    const nav = e.target.closest('[data-tv-nav]');
    if (nav) { e.preventDefault(); e.stopPropagation(); goTo(g, Number(g.dataset.i) + Number(nav.dataset.tvNav)); return; }
    const dot = e.target.closest('[data-tv-dot]');
    if (dot) { e.preventDefault(); e.stopPropagation(); goTo(g, Number(dot.dataset.tvDot)); return; }
    if (swiped) { swiped = false; return; }
    const imgEl = e.target.closest('[data-tv-open]');
    if (imgEl) { e.preventDefault(); open(imagesOf(g), Number(imgEl.dataset.tvOpen), g.dataset.alt); }
  });
  document.addEventListener('pointerdown', (e) => {
    const g = e.target.closest?.('[data-tv-gal]');
    swipe = g && e.pointerType === 'touch' ? { g, x: e.clientX } : null;
  });
  document.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    if (Math.abs(dx) > 40) { swiped = true; goTo(swipe.g, Number(swipe.g.dataset.i) + (dx < 0 ? 1 : -1)); setTimeout(() => { swiped = false; }, 350); }
    swipe = null;
  });

  // Défilement automatique doux, uniquement pour les carrousels visibles, non survolés.
  if (!reduceMotion) {
    setInterval(() => {
      if (document.hidden || (box && !box.hidden)) return;
      document.querySelectorAll('[data-tv-gal]').forEach((g) => {
        if (imagesOf(g).length < 2 || g.matches(':hover, :focus-within')) return;
        const r = g.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight && r.width > 0) goTo(g, Number(g.dataset.i) + 1);
      });
    }, 4200);
  }

  window.TVGallery = { html, open };
})();
