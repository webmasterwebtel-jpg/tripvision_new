/* Effets complémentaires du site public :
   - écrans de chargement des recherches (voiture qui roule, avion qui vole, hôtel qui s'illumine)
   - bouton « Choisir pour moi » de l'accueil (destination au hasard)
   - « Voir plus » sur les grandes grilles de destinations. */
(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const css = document.createElement('style');
  css.textContent = `
  .rsl-host > *:not(.rsl){display:none!important}
  .rsl{display:grid;gap:26px;padding:8px 0 34px;animation:rslIn .3s ease both}
  .rsl.out{animation:rslOut .24s ease both}
  @keyframes rslIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes rslOut{to{opacity:0}}
  .rsl-head{display:grid;gap:8px;justify-items:center;text-align:center;padding-top:6px}
  .rsl-msg{margin:0;display:grid;gap:3px}
  .rsl-msg b{font:600 1.3rem/1.2 'Cormorant Garamond',Georgia,serif;color:#0f3b2e}
  .rsl-msg span{color:#7b857f;font-size:.88rem}
  .rsl-line{position:relative;width:min(380px,72%);height:2px;margin-top:22px;border-radius:2px;background:#e6e0d2}
  .rsl-line i{position:absolute;top:0;bottom:0;left:0;width:34%;border-radius:2px;background:linear-gradient(90deg,transparent,#0f3b2e,transparent);animation:rslSweep 1.5s ease-in-out infinite}
  @keyframes rslSweep{from{left:-34%}to{left:100%}}
  .rsl-ico{position:absolute;top:-23px;left:0;width:20px;height:20px;color:#0f3b2e;animation:rslTravel 2.4s ease-in-out infinite}
  .rsl-ico svg{width:20px;height:20px;fill:currentColor;stroke:none}
  .rsl-flight .rsl-ico svg{transform:rotate(45deg)}
  .rsl-car .rsl-ico svg,.rsl-pack .rsl-ico svg{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  @keyframes rslTravel{0%{left:0;opacity:0}12%{opacity:1}88%{opacity:1}100%{left:calc(100% - 20px);opacity:0}}
  .rsl-skel{display:grid;gap:16px}
  .rsl-skel.cols{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
  .sk{position:relative;overflow:hidden;border-radius:10px;background:#f1ede2}
  .sk::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:translateX(-100%);animation:skShine 1.5s ease-in-out infinite}
  @keyframes skShine{to{transform:translateX(100%)}}
  .sk-card{display:grid;grid-template-columns:210px 1fr 180px;gap:20px;padding:14px;border:1px solid #ece6d8;border-radius:16px;background:#fff}
  .sk-card .sk-img{aspect-ratio:4/3;border-radius:12px}
  .sk-body{display:grid;align-content:center;gap:12px}
  .sk-body .sk{height:13px}
  .sk-buy{display:grid;align-content:center;justify-items:end;gap:12px}
  .sk-buy .sk{height:14px;width:60%}.sk-buy .sk.big{height:30px;width:80%}.sk-buy .sk.btn{height:40px;width:100%;border-radius:10px}
  .sk-pack{display:grid;gap:12px;padding:12px;border:1px solid #ece6d8;border-radius:16px;background:#fff}
  .sk-pack .sk-img{aspect-ratio:4/3;border-radius:12px}.sk-pack .sk{height:13px}
  @media(max-width:860px){.sk-card{grid-template-columns:110px 1fr}.sk-buy{display:none}.rsl-skel.cols{grid-template-columns:1fr}.rsl-skel.cols .sk-pack:nth-child(n+2){display:none}}

  /* ---- Choisir pour moi ---- */
  .hh-search-btns{display:flex;gap:10px;flex-wrap:wrap}
  .hh-surprise{display:inline-flex;align-items:center;gap:8px}
  .hh-surprise .tv-icon{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8}
  .sur-ov{position:fixed;inset:0;z-index:100002;display:grid;place-items:center;background:rgba(5,18,14,.82);backdrop-filter:blur(6px);animation:rslIn .3s ease both}
  .sur-card{position:relative;width:min(480px,92vw);aspect-ratio:4/3;border-radius:26px;overflow:hidden;box-shadow:0 40px 90px -20px rgba(0,0,0,.7);background:#08271f}
  .sur-card .sur-img{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity .12s}
  .sur-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,24,19,.1) 30%,rgba(6,24,19,.88))}
  .sur-txt{position:absolute;left:24px;right:24px;bottom:22px;z-index:2;color:#fff}
  .sur-txt small{display:block;font:700 11px/1 'Inter',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#f6d98a;margin-bottom:8px}
  .sur-txt b{display:block;font:600 clamp(2rem,6vw,2.8rem)/1.05 'Cormorant Garamond',Georgia,serif}
  .sur-txt span{display:block;margin-top:4px;opacity:.85}
  .sur-card.land{animation:surLand .5s cubic-bezier(.2,1.4,.4,1) both}
  @keyframes surLand{from{transform:scale(.92)}to{transform:scale(1)}}
  .sur-card.land .sur-txt b{color:#f6d98a}

  /* ---- Destinations : deux rangées qui défilent, sans trou ---- */
  .dg-mq{display:grid;gap:16px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent);mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}
  .dg-row{container-type:inline-size;overflow:hidden}
  .dg-track{--per:5;display:flex;gap:16px;width:max-content;animation:dgMove var(--dur,70s) linear infinite;will-change:transform}
  .dg-row.rev .dg-track{animation-direction:reverse}
  .dg-mq:hover .dg-track{animation-play-state:paused}
  @keyframes dgMove{to{transform:translateX(calc(-50% - 8px))}}
  .dg-track>.dest-card{flex:0 0 calc((100cqw - (var(--per) - 1) * 16px) / var(--per));aspect-ratio:4/5;min-width:0;opacity:1!important;transform:none}
  .dg-track>.dest-card:hover{transform:translateY(-4px)!important}
  .dg-track .dest-info{left:14px;right:14px;bottom:14px}
  .dg-track .dest-info b{font-size:clamp(19px,1.8vw,25px)}
  .dg-track .dest-go{display:none}
  @media(max-width:1000px){.dg-track{--per:3.4}}
  @media(max-width:600px){.dg-track{--per:2.15}}
  @media(prefers-reduced-motion:reduce){.dg-track{animation:none}.dg-row{overflow-x:auto}}
  /* ---- Voir plus ---- */
  .dg-more{display:flex;justify-content:center;margin:22px 0 4px}
  .dg-more .btn small{opacity:.7;margin-left:6px}
  .dest-grid:not(.dg-open)>.dg-extra{display:none!important}
  .dest-grid.dg-open>.dg-extra{animation:rslIn .4s ease both}
  .geo-list li.geo-more{justify-content:center;cursor:pointer;color:#075f4b;font-weight:600;border-top:1px solid #efebe3;margin-top:4px;border-radius:0 0 8px 8px}
  .geo-list li.geo-more:hover{background:#eef6f2}
  @media (prefers-reduced-motion: reduce){.rsl *{animation:none!important}}`;
  document.head.appendChild(css);

  /* ---------- Chargement sobre : un trait qui avance et les résultats qui se préparent ---------- */
  const card = `<div class="sk-card"><div class="sk sk-img"></div><div class="sk-body"><div class="sk" style="width:46%"></div><div class="sk" style="width:84%"></div><div class="sk" style="width:70%"></div><div class="sk" style="width:38%"></div></div><div class="sk-buy"><div class="sk"></div><div class="sk big"></div><div class="sk btn"></div></div></div>`;
  const pack = `<div class="sk-pack"><div class="sk sk-img"></div><div class="sk" style="width:60%"></div><div class="sk" style="width:90%"></div><div class="sk" style="width:40%"></div></div>`;
  const SCENES = {
    car: { icon: 'car', msg: 'Recherche des véhicules', sub: 'Un instant, nous préparons les offres disponibles.', min: 1100, skel: `<div class="rsl-skel">${card.repeat(3)}</div>` },
    flight: { icon: 'airplane', msg: 'Recherche des vols', sub: 'Un instant, nous rassemblons les offres de votre trajet.', min: 1100, skel: `<div class="rsl-skel">${card.repeat(3)}</div>` },
    pack: { icon: 'bed', msg: 'Recherche des séjours', sub: 'Un instant, nous préparons les escapades disponibles.', min: 1100, skel: `<div class="rsl-skel cols">${pack.repeat(3)}</div>` },
  };
  const HOSTS = { car: '.car-results-premium > .wrap', flight: '#flights .flight-results-premium > .wrap', pack: '#packs .service-results > .wrap, #packs .weekend-results > .wrap' };

  /* Lance une recherche avec un écran de chargement à la place de la page de résultats. */
  async function searching(kind, fn) {
    const scene = SCENES[kind];
    const host = scene && document.querySelector(HOSTS[kind]);
    if (!host || reduce) { await fn(); return; }
    const panel = document.createElement('div');
    panel.className = `rsl rsl-${kind}`;
    panel.setAttribute('role', 'status');
    panel.innerHTML = `<div class="rsl-head"><p class="rsl-msg"><b>${scene.msg}…</b><span>${scene.sub}</span></p><div class="rsl-line"><span class="rsl-ico"><svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-${scene.icon}"></use></svg></span><i></i></div></div>${scene.skel}`;
    host.querySelector(':scope > .rsl')?.remove();
    host.classList.add('rsl-host');
    host.prepend(panel);
    const top = host.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    const t0 = performance.now();
    try { await fn(); } finally {
      await sleep(Math.max(0, scene.min - (performance.now() - t0)));
      panel.classList.add('out');
      await sleep(260);
      panel.remove();
      host.classList.remove('rsl-host');
    }
  }

  /* ---------- Choisir pour moi : une destination au hasard ---------- */
  async function surprise() {
    const list = window.TV_DEST || [];
    if (!list.length) return;
    let last = '';
    try { last = sessionStorage.getItem('tvSurprise') || ''; } catch { /* rien */ }
    const pool = list.filter((d) => d.slug !== last);
    const pick = pool[Math.floor(Math.random() * pool.length)] || list[0];
    try { sessionStorage.setItem('tvSurprise', pick.slug); } catch { /* rien */ }
    const go = () => { page(`destination/${pick.slug}`); location.hash = `destination/${pick.slug}`; };
    if (reduce) { go(); return; }
    const ov = document.createElement('div');
    ov.className = 'sur-ov';
    ov.innerHTML = '<div class="sur-card"><div class="sur-img"></div><div class="sur-txt"><small>Votre prochaine destination</small><b>…</b><span></span></div></div>';
    document.body.appendChild(ov);
    const card = ov.querySelector('.sur-card'), img = ov.querySelector('.sur-img'), name = ov.querySelector('b'), sub = ov.querySelector('span');
    const show = (d) => { img.style.backgroundImage = `url('/assets/dest/${d.slug}.jpg')`; name.textContent = d.name; sub.textContent = d.country; };
    // Le défilement ralentit puis s'arrête sur la destination tirée au sort.
    let delay = 70;
    for (let i = 0; i < 16; i++) { show(list[(Math.random() * list.length) | 0]); await sleep(delay); delay = Math.round(delay * 1.13); }
    show(pick);
    card.classList.add('land');
    sub.textContent = `${pick.country} · ${pick.tag || ''}`.replace(/ · $/, '');
    await sleep(1100);
    ov.remove();
    go();
  }
  document.addEventListener('click', (e) => { if (e.target.closest('#hhSurprise')) { e.preventDefault(); surprise(); } });

  /* ---------- Voir plus : on ne montre que les premières destinations ---------- */
  // Cinq cartes en haut, cinq en bas, qui défilent doucement en sens inverse : aucune place vide.
  function marquee(g, kids) {
    const wrap = document.createElement('div');
    wrap.className = 'dg-mq';
    wrap.dataset.more = '1';
    const rows = [[], []];
    kids.forEach((k, i) => rows[i % 2].push(k));
    rows.forEach((list, r) => {
      const row = document.createElement('div');
      row.className = `dg-row${r ? ' rev' : ''}`;
      const track = document.createElement('div');
      track.className = 'dg-track';
      track.style.setProperty('--dur', `${Math.max(36, list.length * 6.5)}s`);
      const copies = list.map((k) => { const c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; c.removeAttribute('data-page-link'); c.classList.remove('rv', 'in'); c.dataset.rv = '1'; return c; });
      list.forEach((k) => { k.classList.remove('rv', 'in'); k.dataset.rv = '1'; track.appendChild(k); });
      copies.forEach((c) => track.appendChild(c));
      row.appendChild(track);
      wrap.appendChild(row);
    });
    g.replaceWith(wrap);
  }
  const LIMIT = (g) => (g.classList.contains('dg7') ? 7 : 8);
  function seeMore(root = document) {
    root.querySelectorAll?.('.dest-grid:not([data-more])').forEach((g) => {
      const kids = [...g.children];
      const limit = LIMIT(g);
      if (g.id === 'carCatIntro') return;
      if (kids.length >= 10 && !g.classList.contains('dg7')) { marquee(g, kids); return; }
      if (kids.length <= limit + 1) return;
      g.dataset.more = '1';
      kids.slice(limit).forEach((k) => k.classList.add('dg-extra'));
      const wrap = document.createElement('div');
      wrap.className = 'dg-more';
      wrap.innerHTML = `<button type="button" class="btn ghost" data-dg-more>Voir plus de destinations <small>+${kids.length - limit}</small></button>`;
      g.after(wrap);
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dg-more]');
    if (!b) return;
    const g = b.parentElement.previousElementSibling;
    const open = g.classList.toggle('dg-open');
    const n = g.querySelectorAll(':scope > .dg-extra').length;
    b.innerHTML = open ? 'Voir moins' : `Voir plus de destinations <small>+${n}</small>`;
    if (!open) g.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  let pending = 0;
  new MutationObserver(() => { if (pending) return; pending = requestAnimationFrame(() => { pending = 0; seeMore(); }); }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => seeMore()); else seeMore();

  window.TVFX = Object.assign(window.TVFX || {}, { searching, surprise });
})();
