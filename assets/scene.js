/* Scène animée des pages de connexion : ciel, nuages, avions en vol, ville et hôtel illuminés, voitures sur la route, palmiers.
   TVScene.mount(élément, { variant: 'dusk' | 'night' | 'dawn' }) — l'élément doit être en position relative (elle est ajoutée par le script).
   Tout est en CSS/SVG (aucune image), léger, avec un effet de profondeur qui suit la souris ; figé si l'utilisateur préfère moins d'animations. */
(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const css = `
  .tvs{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;--mx:0;--my:0;
    --sky1:#05221b;--sky2:#0c4a3b;--sky3:#17795f;--glow:#f1c96e;--bld:#06211a;--bld2:#0a3026;--win:#ffd98a}
  .tvs.v-night{--sky1:#04141f;--sky2:#0a2f43;--sky3:#16607a;--glow:#9fd8ff;--bld:#05151d;--bld2:#0a2531;--win:#bfe6ff}
  .tvs.v-dawn{--sky1:#1a2a2c;--sky2:#2d5f55;--sky3:#e8b46a;--glow:#ffd9a0;--bld:#10262a;--bld2:#193a38;--win:#ffe3a6}
  .tvs .sky{position:absolute;inset:0;background:radial-gradient(90% 70% at 80% 6%,color-mix(in srgb,var(--glow) 55%,transparent) 0,rgba(0,0,0,0) 34%),linear-gradient(180deg,var(--sky1) 0%,var(--sky2) 50%,var(--sky3) 100%)}
  .tvs .sun{position:absolute;right:14%;top:8%;width:min(11vw,110px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff6d6 0,var(--glow) 38%,rgba(255,200,110,0) 70%);filter:blur(2px);opacity:.9;animation:tvsPulse 7s ease-in-out infinite alternate}
  .tvs .stars{position:absolute;inset:0 0 45% 0;background-image:radial-gradient(1.4px 1.4px at 12% 20%,#fff,transparent),radial-gradient(1.2px 1.2px at 28% 8%,#fff,transparent),radial-gradient(1.6px 1.6px at 44% 26%,#fff,transparent),radial-gradient(1.2px 1.2px at 63% 12%,#fff,transparent),radial-gradient(1.4px 1.4px at 78% 30%,#fff,transparent),radial-gradient(1.2px 1.2px at 90% 16%,#fff,transparent),radial-gradient(1px 1px at 20% 38%,#fff,transparent),radial-gradient(1px 1px at 52% 40%,#fff,transparent),radial-gradient(1px 1px at 84% 44%,#fff,transparent);opacity:.7;animation:tvsTwinkle 5s ease-in-out infinite alternate}
  .tvs .lay{position:absolute;inset:0;transform:translate3d(calc(var(--mx) * var(--d,10) * -1px),calc(var(--my) * var(--d,10) * -.55px),0);will-change:transform}
  /* nuages */
  .tvs .cloud{position:absolute;left:-30%;height:var(--h,34px);width:var(--w,180px);border-radius:999px;background:rgba(255,255,255,var(--o,.2));filter:blur(var(--b,6px));animation:tvsDrift var(--t,90s) linear infinite;animation-delay:var(--dl,0s)}
  .tvs .cloud::before,.tvs .cloud::after{content:"";position:absolute;bottom:40%;border-radius:50%;background:inherit}
  .tvs .cloud::before{left:18%;width:38%;height:140%}.tvs .cloud::after{left:48%;width:30%;height:110%}
  /* avions */
  .tvs .plane{position:absolute;left:-18%;top:var(--y,20%);width:var(--s,90px);color:#fff;animation:tvsFly var(--t,30s) linear infinite;animation-delay:var(--dl,0s);opacity:var(--o,.95)}
  .tvs .plane.rev{left:auto;right:-18%;animation-name:tvsFlyRev}
  .tvs .plane .bob{display:block;animation:tvsBob 4.5s ease-in-out infinite alternate}
  .tvs .plane.rev .bob{transform:scaleX(-1)}
  .tvs .plane svg{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}
  .tvs .plane i{position:absolute;right:92%;top:46%;width:var(--tr,160px);height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65))}
  .tvs .plane.rev i{right:auto;left:92%;background:linear-gradient(270deg,transparent,rgba(255,255,255,.65))}
  /* ville */
  .tvs svg.city{position:absolute;left:0;bottom:11%;width:100%;height:46%}
  .tvs svg.city.far{bottom:12%;height:40%;opacity:.9}
  .tvs .w{fill:var(--win);opacity:.12;animation:tvsWin 5s ease-in-out infinite alternate}
  .tvs .w.on{opacity:.85}
  .tvs .sign{filter:drop-shadow(0 0 8px var(--win));animation:tvsPulse 3s ease-in-out infinite alternate}
  /* route en perspective + voitures */
  .tvs .ground{position:absolute;left:0;right:0;bottom:0;height:16%;background:linear-gradient(180deg,#07211d 0,#031210 100%);box-shadow:0 -30px 60px -10px rgba(0,0,0,.45)}
  .tvs .road{position:absolute;left:0;right:0;bottom:0;height:15.5%;background:linear-gradient(180deg,#154040 0,#0b2627 40%,#041211 100%);border-top:3px solid rgba(180,255,235,.28);box-shadow:0 -10px 30px rgba(110,230,205,.12)}
  .tvs .road i{position:absolute;left:-340px;right:0;background-repeat:repeat-x;animation:tvsRoad var(--sp,2.4s) linear infinite}
  .tvs .road i.a{top:24%;height:2px;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 36px,transparent 36px 96px);background-size:96px 100%;--sp:3.4s}
  .tvs .road i.b{top:52%;height:4px;background-image:repeating-linear-gradient(90deg,#f3d37a 0 66px,transparent 66px 176px);background-size:176px 100%;--sp:2.2s}
  .tvs .road i.c{top:84%;height:7px;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.7) 0 120px,transparent 120px 300px);background-size:300px 100%;--sp:1.5s}
  .tvs .car{position:absolute;left:-12%;bottom:var(--y,8%);width:var(--s,78px);color:var(--c,#fff);animation:tvsDrive var(--t,14s) linear infinite;animation-delay:var(--dl,0s)}
  .tvs .car.rev{left:auto;right:-12%;animation-name:tvsDriveRev}
  .tvs .car svg{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))}
  .tvs .car .body{animation:tvsBumpy .5s ease-in-out infinite alternate}
  .tvs .car .wh{animation:tvsSpin .45s linear infinite;transform-box:fill-box;transform-origin:center}
  .tvs .car::after{content:"";position:absolute;left:92%;top:44%;width:120%;height:46%;border-radius:0 80% 80% 0;background:linear-gradient(90deg,rgba(255,236,170,.5),transparent);opacity:.8}
  .tvs .car.rev::after{left:auto;right:92%;border-radius:80% 0 0 80%;background:linear-gradient(270deg,rgba(255,236,170,.5),transparent)}
  .tvs .car.rev svg{transform:scaleX(-1)}
  /* montgolfière */
  .tvs .balloon{position:absolute;right:20%;top:34%;width:min(8vw,74px);animation:tvsFloat 10s ease-in-out infinite alternate}
  .tvs .balloon svg{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 12px rgba(0,0,0,.4))}
  .tvs .mist{position:absolute;left:0;right:0;bottom:17%;height:22%;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(150,230,210,.1));filter:blur(3px)}
  /* palmiers */
  .tvs .palm{position:absolute;bottom:6%;width:var(--s,150px);color:#031a14;transform-origin:50% 100%;animation:tvsSway 6s ease-in-out infinite alternate}
  .tvs .palm svg{display:block;width:100%;height:auto}
  .tvs::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,18,15,.55) 0%,rgba(3,18,15,.25) 45%,rgba(3,18,15,0) 75%);pointer-events:none}
  .tvs.compact::after{background:linear-gradient(180deg,rgba(3,18,15,.18) 0%,rgba(3,18,15,.62) 38%,rgba(3,18,15,.7) 62%,rgba(3,18,15,.1) 100%)}
  .tvs.compact svg.city{height:34%}.tvs.compact svg.city.far{height:28%}.tvs.compact .balloon{top:20%;right:8%}.tvs.compact .palm{opacity:.9}
  @keyframes tvsFloat{from{transform:translate(-12px,10px) rotate(-3deg)}to{transform:translate(18px,-16px) rotate(3deg)}}
  @keyframes tvsDrift{from{transform:translateX(0)}to{transform:translateX(190vw)}}
  @keyframes tvsFly{from{transform:translateX(0)}to{transform:translateX(calc(100vw + 100% + 360px))}}
  @keyframes tvsFlyRev{from{transform:translateX(0)}to{transform:translateX(calc(-100vw - 100% - 360px))}}
  @keyframes tvsBob{from{transform:translateY(-6px) rotate(-2.5deg)}to{transform:translateY(6px) rotate(1.5deg)}}
  .tvs .plane.rev .bob{animation-name:tvsBobRev}
  @keyframes tvsBobRev{from{transform:scaleX(-1) translateY(-6px) rotate(-2.5deg)}to{transform:scaleX(-1) translateY(6px) rotate(1.5deg)}}
  @keyframes tvsDrive{from{transform:translateX(0)}to{transform:translateX(calc(100vw + 100% + 140px))}}
  @keyframes tvsDriveRev{from{transform:translateX(0)}to{transform:translateX(calc(-100vw - 100% - 140px))}}
  @keyframes tvsRoad{to{transform:translateX(340px)}}
  @keyframes tvsBumpy{from{transform:translateY(0)}to{transform:translateY(-1.5px)}}
  @keyframes tvsSpin{to{transform:rotate(360deg)}}
  @keyframes tvsSway{from{transform:rotate(-1.6deg)}to{transform:rotate(2.2deg)}}
  @keyframes tvsWin{from{opacity:.1}to{opacity:.75}}
  .tvs .w.on{animation-duration:7s}
  @keyframes tvsTwinkle{from{opacity:.35}to{opacity:.85}}
  @keyframes tvsPulse{from{opacity:.75;transform:scale(.97)}to{opacity:1;transform:scale(1.04)}}
  @media(prefers-reduced-motion:reduce){.tvs *{animation:none!important}.tvs .plane{left:30%}.tvs .car{left:30%}}
  `;

  const JET = '<svg viewBox="0 0 64 28" aria-hidden="true"><path d="M29 12.6 21 3.6h5.2L43 11.4z" fill="currentColor" fill-opacity=".62"/><path d="M6.5 14.2c0-1.6 1.2-2.7 2.9-2.9L46 8.9c6.6-.4 13.2 1.4 16 4.1.6.6.6 1.3 0 1.9-2.8 2.7-9.4 4.5-16 4.1L9.4 17c-1.7-.2-2.9-1.2-2.9-2.8z" fill="currentColor"/><path d="M8 12.2 2.2 2.8h5.6l8.6 8.8z" fill="currentColor"/><path d="M10 15.4 5 20.4h4.2l6.2-3.6z" fill="currentColor" fill-opacity=".85"/><path d="M29 15.8 16.5 26h6.2L45 16.8z" fill="currentColor"/><rect x="29.5" y="19.2" width="9" height="4.2" rx="2.1" fill="currentColor" fill-opacity=".9"/><path d="M53.5 11.2c2.4.1 5.4 1.1 7 2.4l-6.8.5z" fill="#0a2a22" fill-opacity=".55"/><g fill="#0a2a22" fill-opacity=".3"><circle cx="24" cy="13.4" r=".95"/><circle cx="28" cy="13.4" r=".95"/><circle cx="32" cy="13.4" r=".95"/><circle cx="36" cy="13.4" r=".95"/><circle cx="40" cy="13.4" r=".95"/><circle cx="44" cy="13.4" r=".95"/><circle cx="48" cy="13.4" r=".95"/></g></svg>';
  const CAR = '<svg viewBox="0 0 48 26" aria-hidden="true"><g class="body"><path d="M3 18v-4.4c0-1 .6-1.8 1.6-2l6.2-1.6 4.6-5.3c.5-.6 1.2-.9 2-.9h11.2c.8 0 1.5.3 2 .9l4.2 5 5.6 1.2c1 .2 1.6 1 1.6 2V18c0 .8-.6 1.4-1.4 1.4H4.4C3.6 19.4 3 18.8 3 18Z" fill="currentColor"/><path d="M17.4 7.3h5v4.5h-9zM25 7.3h4.4l3.4 4.5H25z" fill="#06211a" fill-opacity=".55"/><rect x="42.5" y="13" width="3" height="2" rx="1" fill="#ffe9a8"/></g><g class="wh"><circle cx="13" cy="20.4" r="4.3" fill="#05110e"/><circle cx="13" cy="20.4" r="1.8" fill="#8b9a97"/><circle cx="13" cy="17.6" r=".7" fill="#8b9a97"/></g><g class="wh"><circle cx="35.4" cy="20.4" r="4.3" fill="#05110e"/><circle cx="35.4" cy="20.4" r="1.8" fill="#8b9a97"/><circle cx="35.4" cy="17.6" r=".7" fill="#8b9a97"/></g></svg>';
  const BALLOON = '<svg viewBox="0 0 60 90" aria-hidden="true"><path d="M30 2C13 2 2 15 2 30c0 14 11 26 20 34h16c9-8 20-20 20-34C58 15 47 2 30 2z" fill="#e4573d"/><path d="M30 2c-9 6-14 18-14 32 0 12 3 22 6 30h16c3-8 6-18 6-30 0-14-5-26-14-32z" fill="#f4d67a"/><path d="M30 2c-4 8-6 20-6 32 0 12 2 22 3 30h6c1-8 3-18 3-30 0-12-2-24-6-32z" fill="#e4573d"/><path d="M22 64l4 14M38 64l-4 14" stroke="#3a2a20" stroke-width="1.2"/><rect x="24" y="78" width="12" height="9" rx="1.5" fill="#7a5230"/></svg>';
  const PALM = '<svg viewBox="0 0 120 200" aria-hidden="true"><path d="M58 200c1-40 2-80 8-120" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/><g fill="currentColor"><path d="M66 80c-14-24-40-30-62-22 24-2 40 6 62 22z"/><path d="M66 80c-2-30-22-52-46-58 22 10 34 30 46 58z"/><path d="M66 80c10-28 32-44 56-46-22 6-38 22-56 46z"/><path d="M66 80c20-14 42-14 54 2-16-8-34-4-54-2z"/><path d="M66 80c-24-4-42 4-52 20 14-12 30-16 52-20z"/></g></svg>';

  // petit générateur pseudo-aléatoire : la ville est toujours la même
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  function skyline(seed, { far = false } = {}) {
    const r = rng(seed);
    let x = -20, out = '';
    const parts = [];
    while (x < 1220) {
      const w = far ? 46 + r() * 50 : 40 + r() * 64;
      const h = far ? 70 + r() * 110 : 90 + r() * 170;
      parts.push({ x, w, h });
      x += w + (far ? 4 : 6);
    }
    for (const b of parts) {
      const y = 300 - b.h;
      out += `<rect x="${b.x.toFixed(1)}" y="${y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" fill="${far ? 'rgba(255,255,255,.075)' : 'var(--bld)'}"/>`;
      if (!far) {
        if (r() > 0.55) out += `<rect x="${(b.x + b.w * 0.4).toFixed(1)}" y="${(y - 18).toFixed(1)}" width="2" height="18" fill="var(--bld)"/>`;
        const cols = Math.max(2, Math.floor(b.w / 13)), rows = Math.floor(b.h / 17);
        for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
          if (r() > 0.62) continue;
          const lit = r() > 0.6;
          out += `<rect class="w${lit ? ' on' : ''}" style="animation-delay:${(r() * 6).toFixed(1)}s" x="${(b.x + 6 + c * ((b.w - 12) / cols)).toFixed(1)}" y="${(y + 8 + rr * 17).toFixed(1)}" width="5" height="8" rx="1"/>`;
        }
      }
    }
    return out;
  }

  // l'hôtel : bloc haut avec balcons, enseigne lumineuse, étoiles et auvent d'entrée
  function hotel() {
    const x = 640, w = 150, h = 236, y = 300 - h;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--bld2)"/><rect x="${x - 10}" y="${y + 14}" width="${w + 20}" height="10" fill="var(--bld)"/>`;
    for (let r = 0; r < 9; r++) {
      s += `<rect x="${x}" y="${y + 46 + r * 19}" width="${w}" height="2" fill="rgba(255,255,255,.06)"/>`;
      for (let c = 0; c < 6; c++) s += `<rect class="w${(r * 7 + c * 3) % 5 < 2 ? ' on' : ''}" style="animation-delay:${((r * 5 + c) % 9) * 0.7}s" x="${x + 12 + c * 23}" y="${y + 52 + r * 19}" width="13" height="10" rx="1.5"/>`;
    }
    s += `<g class="sign"><rect x="${x + 22}" y="${y - 30}" width="${w - 44}" height="30" rx="5" fill="#0c2f25" stroke="var(--win)" stroke-width="1.6"/>
      <text x="${x + w / 2}" y="${y - 9.5}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="800" letter-spacing="3" fill="var(--win)">HÔTEL</text>
      <text x="${x + w / 2}" y="${y - 36}" text-anchor="middle" font-size="11" letter-spacing="3" fill="var(--win)">★★★★★</text></g>`;
    s += `<rect x="${x + 44}" y="${300 - 34}" width="${w - 88}" height="34" fill="#031812"/><rect x="${x + 36}" y="${300 - 40}" width="${w - 72}" height="7" rx="3" fill="var(--win)" opacity=".85"/><rect x="${x + 52}" y="${300 - 30}" width="${w - 104}" height="30" fill="var(--win)" opacity=".28"/>`;
    s += `<ellipse cx="${x + w + 36}" cy="298" rx="46" ry="6" fill="#42d6c4" opacity=".28"/>`;
    return s;
  }

  const planeHtml = (cls, y, s, t, dl, o, tr) => `<div class="plane ${cls}" style="--y:${y}%;--s:${s}px;--t:${t}s;--dl:${dl}s;--o:${o};--tr:${tr}px"><i></i><span class="bob">${JET}</span></div>`;
  const carHtml = (cls, y, s, t, dl, color) => `<div class="car ${cls}" style="--y:${y}%;--s:${s}px;--t:${t}s;--dl:${dl}s;--c:${color}">${CAR}</div>`;
  const cloudHtml = (y, w, h, o, t, dl, b = 6) => `<i class="cloud" style="top:${y}%;--w:${w}px;--h:${h}px;--o:${o};--t:${t}s;--dl:${dl}s;--b:${b}px"></i>`;

  function build(variant, compact) {
    const el = document.createElement('div');
    el.className = `tvs v-${variant}${compact ? ' compact' : ''}`;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="sky"></div><div class="stars"></div><div class="sun"></div>
      <div class="lay" style="--d:8">${cloudHtml(14, 220, 36, .13, 120, -40, 8)}${cloudHtml(30, 160, 28, .1, 90, -10, 6)}${cloudHtml(8, 280, 40, .09, 150, -90, 10)}</div>
      <div class="lay" style="--d:30">${planeHtml('', 14, 58, 46, -6, .75, 110)}${planeHtml('rev', 26, 44, 58, -30, .55, 90)}${planeHtml('', 36, 118, 30, -14, .95, 220)}</div>
      <div class="lay" style="--d:16"><div class="balloon">${BALLOON}</div></div>
      <div class="lay" style="--d:12"><svg class="city far" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">${skyline(11, { far: true })}</svg></div>
      <div class="lay" style="--d:22"><svg class="city" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">${skyline(7)}${hotel()}</svg></div>
      <div class="mist"></div><div class="ground"></div><div class="road"><i class="a"></i><i class="b"></i><i class="c"></i></div>
      <div class="lay" style="--d:36">${carHtml('', 1.2, 118, 13, -3, '#f4f1e8')}${carHtml('rev', 0.6, 104, 17, -11, '#e4573d')}${carHtml('', 6.2, 84, 21, -8, '#e8b04a')}${carHtml('rev', 7.4, 72, 25, -16, '#46c1a8')}${carHtml('', 10.6, 56, 29, -22, '#9ad0ff')}</div>
      <div class="lay" style="--d:44"><div class="palm" style="left:-1%;--s:170px">${PALM}</div><div class="palm" style="left:7%;--s:110px;animation-delay:-2s">${PALM}</div><div class="palm" style="right:-2%;--s:190px;animation-delay:-3s">${PALM}</div></div>`;
    return el;
  }

  let styled = false;
  function mount(host, { variant = 'dusk' } = {}) {
    if (!host || host.querySelector(':scope > .tvs')) return;
    if (!styled) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styled = true; }
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.overflow = 'hidden';
    const scene = build(variant, host.clientWidth < 760);
    host.prepend(scene);
    // le contenu de la zone passe au-dessus de la scène
    [...host.children].forEach((c) => { if (c !== scene && getComputedStyle(c).position === 'static') c.style.position = 'relative'; if (c !== scene) c.style.zIndex = '1'; });
    if (reduce) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, on = false;
    const loop = () => {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      scene.style.setProperty('--mx', cx.toFixed(3)); scene.style.setProperty('--my', cy.toFixed(3));
      raf = on ? requestAnimationFrame(loop) : 0;
    };
    host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; if (!raf && on) raf = requestAnimationFrame(loop); });
    host.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    new IntersectionObserver((es) => { on = es.some((e) => e.isIntersecting); scene.style.animationPlayState = on ? 'running' : 'paused'; scene.querySelectorAll('.plane,.car,.cloud,.road::before').forEach((n) => { n.style.animationPlayState = on ? 'running' : 'paused'; }); if (on && !raf) raf = requestAnimationFrame(loop); }, { threshold: 0.05 }).observe(host);
  }
  window.TVScene = { mount };
})();
