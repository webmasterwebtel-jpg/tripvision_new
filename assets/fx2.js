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
  .rsl-line{position:relative;width:min(260px,60%);height:2px;margin-top:6px;border-radius:2px;background:#e6e0d2;overflow:hidden}
  .rsl-line i{position:absolute;top:0;bottom:0;left:0;width:34%;border-radius:2px;background:linear-gradient(90deg,transparent,#0f3b2e,transparent);animation:rslSweep 1.5s ease-in-out infinite}
  @keyframes rslSweep{from{left:-34%}to{left:100%}}
  /* Scène : voiture qui roule, avion qui vole, hôtel qui s'allume. Trait fin, deux couleurs, mouvement lent. */
  .rsl-art{width:min(520px,94%);height:auto;overflow:hidden;margin-bottom:2px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
  .rsl-art .ink{fill:none;stroke:#0f3b2e;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .rsl-art .body{fill:#fff;stroke:#0f3b2e;stroke-width:1.8;stroke-linejoin:round}
  .rsl-art .glass{fill:#0f3b2e;opacity:.88}
  .rsl-art .gold{fill:#c6a76b}
  .rsl-art .soft{fill:none;stroke:#d9d1bf;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
  .rsl-art .faint{fill:none;stroke:#e7e1d3;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}
  .rsl-art .spin{transform-box:fill-box;transform-origin:center;animation:rslSpin .55s linear infinite}
  @keyframes rslSpin{to{transform:rotate(360deg)}}
  .rsl-art .bob{animation:rslBob .9s ease-in-out infinite}
  @keyframes rslBob{50%{transform:translateY(-1px)}}
  .rsl-art .lane{stroke-dasharray:22 16;animation:rslLane .5s linear infinite}
  @keyframes rslLane{to{stroke-dashoffset:38}}
  .rsl-art .far{animation:rslFar 9s linear infinite}
  .rsl-art .near{animation:rslFar 4.5s linear infinite}
  @keyframes rslFar{to{transform:translateX(-360px)}}
  .rsl-art .wind{stroke-dasharray:26 300;animation:rslWind 1.1s linear infinite}
  .rsl-art .wind.w2{animation-delay:-.45s}
  @keyframes rslWind{from{stroke-dashoffset:0}to{stroke-dashoffset:-326}}
  .rsl-art .fly{transform-origin:190px 68px;animation:rslFly 3.2s ease-in-out infinite}
  @keyframes rslFly{0%,100%{transform:translateY(2px) rotate(-1.5deg)}50%{transform:translateY(-3px) rotate(.8deg)}}
  .rsl-art .trail{stroke-dasharray:4 7;animation:rslTrail .6s linear infinite}
  @keyframes rslTrail{to{stroke-dashoffset:11}}
  .rsl-art .win{fill:#efe9dc;animation:rslWin 3.6s ease-in-out infinite;animation-delay:var(--d)}
  @keyframes rslWin{0%,18%{fill:#efe9dc}32%,72%{fill:#e3c27e}88%,100%{fill:#efe9dc}}
  .rsl-art .twk{animation:rslTwk 2.4s ease-in-out infinite;animation-delay:var(--d)}
  @keyframes rslTwk{0%,100%{opacity:.25}50%{opacity:1}}
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
  .sk-pack .sk-img{aspect-ratio:4/3;border-radius:12px}.sk-pack .sk:not(.sk-img){height:13px}
  @media(max-width:600px){.rsl-art{width:100%}.rsl-msg b{font-size:1.15rem}}
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

  /* ---------- Chargement : une scène sobre (voiture, avion, hôtel) et les résultats qui se préparent ---------- */
  const card = `<div class="sk-card"><div class="sk sk-img"></div><div class="sk-body"><div class="sk" style="width:46%"></div><div class="sk" style="width:84%"></div><div class="sk" style="width:70%"></div><div class="sk" style="width:38%"></div></div><div class="sk-buy"><div class="sk"></div><div class="sk big"></div><div class="sk btn"></div></div></div>`;
  const pack = `<div class="sk-pack"><div class="sk sk-img"></div><div class="sk" style="width:60%"></div><div class="sk" style="width:90%"></div><div class="sk" style="width:40%"></div></div>`;
  // Voiture vue de profil (ligne fine, vitrage sombre, feux dorés), route qui défile, ville au loin.
  const skyline = (y, cls) => `<g class="${cls}"><path class="faint" d="M0 ${y}h28v-16h14v10h18v-22h12v22h20v-12h16v12h24v-26h10v8h12v18h22v-14h18v14h30v-20h14v20h26v-10h20v10h28v-18h12v18h26M360 ${y}h28v-16h14v10h18v-22h12v22h20v-12h16v12h24v-26h10v8h12v18h22v-14h18v14h30v-20h14v20h26v-10h20v10h28v-18h12v18h26"/></g>`;
  const wheel = (cx) => `<g><circle cx="${cx}" cy="96" r="11.5" fill="#0f3b2e"/><circle cx="${cx}" cy="96" r="6.4" fill="#fff"/><g class="spin"><circle cx="${cx}" cy="96" r="6.4" fill="none"/><path d="M${cx} 90.4v11.2M${cx - 5.6} 96h11.2M${cx - 4} 92l8 8M${cx + 4} 92l-8 8" stroke="#0f3b2e" stroke-width="1.3" stroke-linecap="round"/></g><circle cx="${cx}" cy="96" r="1.6" fill="#0f3b2e"/></g>`;
  const ART = {
    car: `<svg class="rsl-art" viewBox="0 0 360 124" aria-hidden="true">
      ${skyline(84, 'far')}
      <path class="soft" d="M0 108h360"/>
      <path class="soft lane" d="M0 116h360"/>
      <path class="ink wind" d="M96 70h-60"/><path class="ink wind w2" d="M98 84h-74"/>
      <g class="bob">
        <path class="body" d="M112 96c-4 0-6.5-3-6.5-8.5l1-11c.6-5 4-8 10-8.6l21-15c3.6-2.6 7.6-3.9 13-3.9h40c6 0 10.4 1.5 14.6 4.6l17.4 13.4 21 3.6c6.6 1.2 10.6 4.6 11.4 10.6l.8 7.2c.4 4.6-2.2 7.6-6.6 7.6h-8.6a13 13 0 0 0-26 0h-68a13 13 0 0 0-26 0z"/>
        <path class="glass" d="M124 68.6l17.6-12.6c2.6-1.8 5.4-2.6 9-2.6h17.2v15.2zM171.8 53.4h17c4.6 0 8 1.2 11.4 3.8l13.6 11.4h-42z"/>
        <path class="ink" d="M170 69v25M117 71l104-1.6M186 78h8M147 78h8"/>
        <path class="gold" d="M248 75.5l7 1.2-.6 4.2-7.4-.6z"/><path d="M107.4 74.5l5.4-.6v6.6l-5.8.4z" fill="#b8473a"/>
        ${wheel(134)}${wheel(229)}
      </g>
      <path class="soft" d="M110 108h150" stroke="#cfc6b1" stroke-width="3" opacity=".35"/>
    </svg>`,
    flight: `<svg class="rsl-art" viewBox="0 0 360 124" aria-hidden="true">
      <g class="far"><path class="faint" d="M40 34c4-8 16-9 21-2 6-5 16-2 16 6H34c0-2 2-4 6-4zM230 22c3-6 12-7 16-2 5-4 12-1 12 5h-31c0-2 1-3 3-3zM300 92c4-8 16-9 21-2 6-5 16-2 16 6h-43c0-2 2-4 6-4zM400 34c4-8 16-9 21-2 6-5 16-2 16 6h-43c0-2 2-4 6-4zM590 22c3-6 12-7 16-2 5-4 12-1 12 5h-31c0-2 1-3 3-3zM660 92c4-8 16-9 21-2 6-5 16-2 16 6h-43c0-2 2-4 6-4z"/></g>
      <path class="soft trail" d="M8 104C70 104 90 78 128 72"/>
      <g class="fly">
        <path class="faint" d="M188 60l-16-16h8l24 15z" stroke="#0f3b2e" stroke-opacity=".35" fill="#f4f0e6"/>
        <path class="body" d="M128 70.5c0-5 6.5-8.2 16-8.6l94-.6c12 0 21 2.4 27.6 6.8 2 1.4 2 3.4 0 4.8-6.6 4.4-15.6 6.6-27.6 6.6h-94c-9.6-.4-16-3.8-16-9z"/>
        <path class="body" d="M140 63l-14-24h10.4l24.6 23.4z"/>
        <path class="body" d="M184 74l-24 22h11.6l36-22z"/>
        <ellipse cx="181" cy="80" rx="10" ry="4.2" fill="#0f3b2e"/>
        <path d="M156 67.6h82" stroke="#0f3b2e" stroke-width="2.2" stroke-linecap="round" stroke-dasharray=".1 6.2"/>
        <path d="M253 65.8c3.6.6 6.6 1.8 9 3.4h-9.6z" fill="#0f3b2e"/>
        <path d="M134 72.2h118" stroke="#c6a76b" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <path class="ink wind" d="M120 56h-70" stroke-opacity=".5"/><path class="ink wind w2" d="M124 88h-84" stroke-opacity=".5"/>
    </svg>`,
    pack: `<svg class="rsl-art" viewBox="0 0 360 124" aria-hidden="true">
      <path class="soft" d="M20 110h320"/>
      <path d="M286 26a11 11 0 1 0 9 17 9 9 0 1 1-9-17z" fill="#c6a76b"/>
      <g class="gold"><circle class="twk" style="--d:0s" cx="70" cy="22" r="1.6"/><circle class="twk" style="--d:.8s" cx="104" cy="40" r="1.2"/><circle class="twk" style="--d:1.5s" cx="262" cy="52" r="1.3"/><circle class="twk" style="--d:.4s" cx="318" cy="64" r="1.1"/></g>
      <path class="body" d="M126 110V34h108v76"/>
      <path class="ink" d="M120 34h120M122 28h116v6H122zM166 22h28v6h-28z"/>
      <text x="180" y="26.6" text-anchor="middle" font-size="5.6" font-weight="700" letter-spacing="1.6" fill="#0f3b2e" font-family="Inter,Arial,sans-serif">HÔTEL</text>
      ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect class="win" style="--d:${((r * 5 + c) * 0.37) % 3.6}s" x="${136 + c * 18.6}" y="${42 + r * 15}" width="9.6" height="10" rx="1.2"/>`).join('')).join('')}
      <path class="ink" d="M166 110V96h28v14M160 96h40l-4-6h-32z"/>
      <path class="gold" d="M178 102h4v1.4h-4z"/>
      <path class="ink" d="M104 110v-14M104 98c-10-2-12-12-4-16 2-8 14-8 16 0 8 4 6 14-4 16zM256 110v-14M256 98c-10-2-12-12-4-16 2-8 14-8 16 0 8 4 6 14-4 16z" stroke-width="1.4"/>
    </svg>`,
  };
  const SCENES = {
    car: { icon: 'car', msg: 'Recherche des véhicules', sub: 'Un instant, nous préparons les offres disponibles.', min: 1600, skel: `<div class="rsl-skel">${card.repeat(3)}</div>` },
    flight: { icon: 'airplane', msg: 'Recherche des vols', sub: 'Un instant, nous rassemblons les offres de votre trajet.', min: 1600, skel: `<div class="rsl-skel">${card.repeat(3)}</div>` },
    pack: { icon: 'bed', msg: 'Recherche des séjours', sub: 'Un instant, nous préparons les escapades disponibles.', min: 1600, skel: `<div class="rsl-skel cols">${pack.repeat(3)}</div>` },
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
    panel.innerHTML = `<div class="rsl-head">${ART[kind]}<p class="rsl-msg"><b>${scene.msg}…</b><span>${scene.sub}</span></p><div class="rsl-line"><i></i></div></div>${scene.skel}`;
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
