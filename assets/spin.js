/* Visionneuse à 360° — pas une vidéo : on tourne autour du véhicule en bougeant la souris (ou le doigt).
   • Une photo panoramique 360° (une seule image, format 2:1) s'ouvre en sphère (Pannellum, hébergé sur le site).
   • Une série de photos prises autour du véhicule tourne avec inertie ; entre deux photos, un fondu rend le mouvement continu.
   TVSpin.open(frames, title)  — frames : liste d'URL dans l'ordre du tour du véhicule. */
(() => {
  let box = null, st = null, pano = null, panoLib = null, raf = 0, lastFocus = null;
  const loadPano = () => (panoLib ||= new Promise((ok, ko) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/vendor/pannellum.css'; document.head.appendChild(css);
    const js = document.createElement('script'); js.src = '/assets/vendor/pannellum.js'; js.onload = ok; js.onerror = ko; document.head.appendChild(js);
  }));
  const wrap = (v, n) => ((v % n) + n) % n;

  function build() {
    box = document.createElement('div');
    box.className = 'tv-spin';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Vue à 360 degrés');
    box.innerHTML = `
      <div class="tv-spin-top"><span class="tv-spin-badge">360°</span><span class="tv-spin-title"></span><button type="button" data-sp="close" aria-label="Fermer">✕</button></div>
      <div class="tv-spin-stage">
        <div class="tv-spin-frames"></div>
        <div class="tv-spin-cue" aria-hidden="true"><span>‹</span><b>360°</b><span>›</span><em>Bougez la souris de gauche à droite</em></div>
        <div class="tv-spin-load"><i></i><span></span></div>
      </div>
      <div class="tv-spin-bar"><input type="range" min="0" max="0" step="0.01" value="0" data-sp="range" aria-label="Faire tourner le véhicule"><span class="tv-spin-hint">Souris, doigt ou flèches du clavier</span></div>`;
    document.body.appendChild(box);
    const stage = box.querySelector('.tv-spin-stage');
    st = { frames: [], els: [], pos: 0, vel: 0, stage, holder: box.querySelector('.tv-spin-frames'), cue: box.querySelector('.tv-spin-cue'), range: box.querySelector('[data-sp=range]'), lastX: null, drag: null, moved: false };

    box.addEventListener('click', (e) => { if (e.target.closest('[data-sp=close]')) close(); });
    st.range.addEventListener('input', () => { st.vel = 0; st.pos = Number(st.range.value); render(); touched(); });

    const per = () => Math.max(40, stage.clientWidth * 0.8 / Math.max(2, Math.min(st.frames.length, 12)));   // pixels pour passer d'une photo à la suivante
    const nudge = (dx) => { const d = dx / per(); st.pos += d; st.vel = st.vel * 0.6 + d * 0.4; render(); touched(); };
    // Souris : le simple déplacement fait tourner. Doigt / stylet : on glisse.
    stage.addEventListener('pointerleave', () => { st.lastX = null; kick(); });
    stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') stage.setPointerCapture(e.pointerId); st.drag = { x: e.clientX }; st.lastX = e.clientX; st.vel = 0; stage.classList.add('grab'); });
    stage.addEventListener('pointermove', (e) => {
      if (st.lastX != null) { nudge(e.clientX - st.lastX); }
      if (e.pointerType === 'mouse' || st.drag) st.lastX = e.clientX;
    });
    const up = () => { st.drag = null; stage.classList.remove('grab'); if (st.lastX != null && !stage.matches(':hover')) st.lastX = null; kick(); };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    document.addEventListener('keydown', (e) => {
      if (!box || box.hidden || pano) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') { st.vel = 0; st.pos -= 1; render(); touched(); }
      else if (e.key === 'ArrowRight') { st.vel = 0; st.pos += 1; render(); touched(); }
    });
    document.addEventListener('keydown', (e) => { if (box && !box.hidden && pano && e.key === 'Escape') close(); });
  }

  const touched = () => st.cue?.classList.add('gone');
  // Inertie : la rotation continue un instant après le geste, puis s'arrête en douceur.
  function kick() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!st || box.hidden || st.lastX != null || Math.abs(st.vel) < 0.002) return;
      st.pos += st.vel; st.vel *= 0.93; render();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function render() {
    const n = st.els.length;
    if (!n) return;
    const p = wrap(st.pos, n), i0 = Math.floor(p), i1 = (i0 + 1) % n;
    // série dense : on change de photo franchement ; série courte : fondu entre deux photos pour un mouvement continu
    const t = n >= 14 ? 0 : p - i0;
    st.els.forEach((el, i) => { el.style.opacity = i === i0 ? '1' : i === i1 && t > 0 ? String(t) : '0'; });
    st.range.value = p;
  }

  function showSpin(frames) {
    st.frames = frames;
    st.holder.innerHTML = '';
    st.els = frames.map((u) => { const im = new Image(); im.alt = ''; im.draggable = false; im.decoding = 'async'; st.holder.appendChild(im); return im; });
    st.pos = 0; st.vel = 0; st.lastX = null;
    st.range.max = frames.length; st.range.value = 0;
    st.cue.classList.remove('gone');
    const load = box.querySelector('.tv-spin-load');
    load.hidden = false;
    let done = 0;
    const bar = load.querySelector('i'), txt = load.querySelector('span');
    st.els.forEach((im, i) => {
      im.onload = im.onerror = () => {
        done++;
        bar.style.setProperty('--p', `${Math.round((done / frames.length) * 100)}%`);
        txt.textContent = `Chargement ${done}/${frames.length}`;
        if (done === frames.length) { load.hidden = true; render(); }
      };
      im.src = frames[i];
    });
    render();
  }

  function killPano() {
    try { pano?.destroy(); } catch { /* rien */ }
    pano = null;
    box?.querySelector('.tv-pano')?.remove();
    if (box) { box.querySelector('.tv-spin-stage').classList.remove('is-pano'); box.querySelector('.tv-spin-bar').hidden = false; }
  }
  async function startPano(url) {
    try { await loadPano(); } catch { return; }
    if (box.hidden) return;
    killPano();
    const stage = box.querySelector('.tv-spin-stage');
    const el = document.createElement('div');
    el.className = 'tv-pano';
    stage.appendChild(el);
    stage.classList.add('is-pano');
    box.querySelector('.tv-spin-bar').hidden = true;
    box.querySelector('.tv-spin-load').hidden = true;
    pano = window.pannellum.viewer(el, { type: 'equirectangular', panorama: url, autoLoad: true, showControls: true, showFullscreenCtrl: false, mouseZoom: true, hfov: 100, minHfov: 50, maxHfov: 120, compass: false, draggable: true });
    // La souris suffit : en la déplaçant sans cliquer, on tourne autour du véhicule.
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.buttons || !pano) return;
      if (st.panoX != null) pano.setYaw(pano.getYaw() - (e.clientX - st.panoX) * 0.25, false);
      st.panoX = e.clientX;
    });
    el.addEventListener('pointerleave', () => { st.panoX = null; });
  }

  function open(frames, title) {
    if (!frames?.length) return;
    if (!box) build();
    lastFocus = document.activeElement;
    killPano();
    box.querySelector('.tv-spin-title').textContent = title || '';
    box.hidden = false;
    document.body.classList.add('tv-lb-open');
    box.querySelector('[data-sp=close]').focus({ preventScroll: true });
    // Un vrai panorama 360° est une image équirectangulaire : exactement 2:1 et de grande taille.
    const probe = new Image();
    probe.onload = () => {
      const r = probe.naturalWidth / probe.naturalHeight;
      const isPano = probe.naturalWidth >= 1800 && r > 1.97 && r < 2.03;
      if (box.hidden) return;
      if (isPano && (frames.length === 1 || frames.length > 1)) startPano(frames[0]); else showSpin(frames);
    };
    probe.onerror = () => { if (!box.hidden) showSpin(frames); };
    probe.src = frames[0];
    box.querySelector('.tv-spin-stage .tv-spin-load').hidden = false;
  }
  function close() {
    if (!box || box.hidden) return;
    cancelAnimationFrame(raf);
    killPano();
    box.hidden = true;
    document.body.classList.remove('tv-lb-open');
    lastFocus?.focus?.({ preventScroll: true });
  }

  window.TVSpin = { open, close };
})();
