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
  .rsl{position:relative;display:grid;gap:18px;justify-items:center;padding:8px 0 28px;animation:rslIn .35s ease both}
  .rsl.out{animation:rslOut .26s ease both}
  @keyframes rslIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes rslOut{to{opacity:0;transform:translateY(-6px)}}
  .rsl-stage{position:relative;width:min(860px,100%);height:clamp(210px,34vw,300px);border-radius:22px;overflow:hidden;box-shadow:0 26px 60px -28px rgba(8,39,31,.55);isolation:isolate}
  .rsl-stage>*{position:absolute}
  .rsl-msg{display:grid;gap:4px;text-align:center;margin:0}
  .rsl-msg b{font:600 1.35rem/1.2 'Cormorant Garamond',Georgia,serif;color:#08271f}
  .rsl-msg span{color:#6b7570;font-size:.92rem}
  .rsl-dots i{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#c6a76b;animation:rslDot 1.1s ease-in-out infinite}
  .rsl-dots i:nth-child(2){animation-delay:.15s}.rsl-dots i:nth-child(3){animation-delay:.3s}
  @keyframes rslDot{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1.25)}}

  /* ---- voiture ---- */
  .rsl-car .rsl-sky{inset:0;background:linear-gradient(180deg,#f6c98a 0%,#fbe6c2 46%,#dff0ea 100%)}
  .rsl-car .rsl-sun{width:84px;height:84px;right:14%;top:14%;border-radius:50%;background:radial-gradient(circle,#fff6d8 0 38%,#ffd98a 70%,rgba(255,217,138,0) 72%);animation:rslSun 6s ease-in-out infinite}
  @keyframes rslSun{50%{transform:scale(1.07)}}
  .rsl-car .rsl-far,.rsl-car .rsl-near{left:0;right:0;background-repeat:repeat-x;background-position:0 100%}
  .rsl-car .rsl-far{bottom:62px;height:92px;opacity:.55;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='92' viewBox='0 0 700 92'%3E%3Cpath fill='%2386b9a6' d='M0 92V58c60-26 110-30 170-8s100 16 150-14 120-30 170 4 120 24 210-8v60z'/%3E%3C/svg%3E");background-size:700px 92px;animation:rslScroll 24s linear infinite}
  .rsl-car .rsl-near{bottom:62px;height:78px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='78' viewBox='0 0 520 78'%3E%3Cg fill='%230f4a3b'%3E%3Crect x='6' y='34' width='34' height='44'/%3E%3Crect x='46' y='14' width='30' height='64'/%3E%3Crect x='82' y='42' width='42' height='36'/%3E%3Crect x='130' y='24' width='28' height='54'/%3E%3Crect x='164' y='48' width='46' height='30'/%3E%3Crect x='216' y='6' width='34' height='72'/%3E%3Crect x='256' y='36' width='38' height='42'/%3E%3Crect x='300' y='20' width='30' height='58'/%3E%3Crect x='336' y='46' width='44' height='32'/%3E%3Crect x='386' y='28' width='32' height='50'/%3E%3Crect x='424' y='10' width='28' height='68'/%3E%3Crect x='458' y='40' width='48' height='38'/%3E%3C/g%3E%3Cg fill='%23f6d98a' fill-opacity='.8'%3E%3Crect x='12' y='42' width='5' height='5'/%3E%3Crect x='24' y='54' width='5' height='5'/%3E%3Crect x='54' y='24' width='5' height='5'/%3E%3Crect x='54' y='40' width='5' height='5'/%3E%3Crect x='224' y='16' width='5' height='5'/%3E%3Crect x='224' y='34' width='5' height='5'/%3E%3Crect x='232' y='52' width='5' height='5'/%3E%3Crect x='308' y='30' width='5' height='5'/%3E%3Crect x='432' y='22' width='5' height='5'/%3E%3Crect x='432' y='42' width='5' height='5'/%3E%3C/g%3E%3C/svg%3E");background-size:520px 78px;animation:rslScroll 11s linear infinite}
  @keyframes rslScroll{to{background-position-x:-700px}}
  .rsl-car .rsl-near{animation-name:rslScroll2}
  @keyframes rslScroll2{to{background-position-x:-520px}}
  .rsl-car .rsl-road{left:0;right:0;bottom:0;height:62px;background:linear-gradient(#3a423e,#262c29)}
  .rsl-car .rsl-road::before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:#d8d2c4}
  .rsl-car .rsl-lane{left:0;right:0;bottom:24px;height:5px;background-image:repeating-linear-gradient(90deg,#f1ead7 0 46px,transparent 46px 92px);animation:rslLane .5s linear infinite}
  @keyframes rslLane{to{background-position-x:-92px}}
  .rsl-car .rsl-veh{left:50%;bottom:12px;width:min(250px,44%);margin-left:calc(min(250px,44%) / -2);animation:rslBounce .42s ease-in-out infinite;filter:drop-shadow(0 8px 6px rgba(0,0,0,.28))}
  @keyframes rslBounce{50%{transform:translateY(-3px)}}
  .rsl-car .rsl-whl{transform-box:fill-box;transform-origin:center;animation:rslSpin .5s linear infinite}
  @keyframes rslSpin{to{transform:rotate(360deg)}}
  .rsl-car .rsl-wind{left:0;right:0;bottom:36px;height:30px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.0) 0 40px,rgba(255,255,255,.35) 40px 44px,rgba(255,255,255,0) 44px 90px);animation:rslLane .35s linear infinite;opacity:.6}

  /* ---- avion ---- */
  .rsl-flight .rsl-sky{inset:0;background:linear-gradient(180deg,#1f6fb2 0%,#5db2e8 48%,#d8f0ff 100%)}
  .rsl-flight .rsl-cl{height:34px;border-radius:40px;background:#fff;opacity:.92;filter:drop-shadow(0 6px 4px rgba(20,70,120,.15));animation:rslCloud linear infinite}
  .rsl-flight .rsl-cl::before,.rsl-flight .rsl-cl::after{content:"";position:absolute;background:#fff;border-radius:50%}
  .rsl-flight .rsl-cl::before{width:44%;height:150%;left:14%;top:-70%}.rsl-flight .rsl-cl::after{width:34%;height:120%;left:50%;top:-45%}
  .rsl-flight .rsl-cl.a{width:150px;top:16%;animation-duration:6s;animation-delay:-1s}
  .rsl-flight .rsl-cl.b{width:110px;top:62%;animation-duration:4.4s;animation-delay:-3s;opacity:.8}
  .rsl-flight .rsl-cl.c{width:190px;top:38%;animation-duration:8s;animation-delay:-5s;opacity:.55}
  .rsl-flight .rsl-cl.d{width:90px;top:82%;animation-duration:3.8s;animation-delay:-2s;opacity:.7}
  @keyframes rslCloud{from{left:112%}to{left:-40%}}
  .rsl-flight .rsl-fly{left:50%;top:50%;width:min(300px,52%);margin:calc(min(300px,52%) * -.22) 0 0 calc(min(300px,52%) / -2);animation:rslFly 3.2s ease-in-out infinite;filter:drop-shadow(0 14px 8px rgba(8,39,80,.28))}
  @keyframes rslFly{0%,100%{transform:translateY(8px) rotate(-3deg)}50%{transform:translateY(-12px) rotate(2deg)}}
  .rsl-flight .rsl-trail{left:-6%;top:50%;width:46%;height:3px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9));border-radius:3px;animation:rslTrail 1.4s linear infinite}
  .rsl-flight .rsl-trail.t2{top:calc(50% + 18px);width:34%;animation-delay:-.7s;opacity:.7}
  @keyframes rslTrail{from{transform:translateX(-30%);opacity:0}30%{opacity:1}to{transform:translateX(30%);opacity:0}}
  .rsl-flight .rsl-route{left:6%;right:6%;bottom:14px;height:0;border-top:2px dashed rgba(255,255,255,.7)}
  .rsl-flight .rsl-pin{bottom:8px;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #c6a76b}
  .rsl-flight .rsl-pin.a{left:calc(6% - 7px)}.rsl-flight .rsl-pin.b{right:calc(6% - 7px)}
  .rsl-flight .rsl-dot{bottom:9px;left:6%;width:12px;height:12px;border-radius:50%;background:#c6a76b;box-shadow:0 0 0 6px rgba(198,167,107,.35);animation:rslGo 2.6s ease-in-out infinite}
  @keyframes rslGo{from{left:6%}to{left:calc(94% - 12px)}}

  /* ---- hôtel ---- */
  .rsl-pack .rsl-sky{inset:0;background:linear-gradient(180deg,#14213d 0%,#2b3a67 52%,#e08b5c 100%)}
  .rsl-pack .rsl-moon{width:46px;height:46px;left:12%;top:12%;border-radius:50%;background:radial-gradient(circle at 36% 36%,#fffbe8,#f2e6b8);box-shadow:0 0 28px 6px rgba(255,244,200,.35)}
  .rsl-pack .rsl-star{width:3px;height:3px;border-radius:50%;background:#fff;animation:rslTw 2s ease-in-out infinite}
  @keyframes rslTw{50%{opacity:.2;transform:scale(.6)}}
  .rsl-pack .rsl-ground{left:0;right:0;bottom:0;height:34px;background:linear-gradient(#2c2a35,#1b1a22)}
  .rsl-pack .rsl-bld{left:50%;bottom:34px;width:min(250px,48%);height:78%;margin-left:calc(min(250px,48%) / -2);background:linear-gradient(90deg,#efe6d4,#fff8ea 40%,#e6dcc6);border-radius:6px 6px 0 0;box-shadow:0 0 0 3px #cbbd9c inset}
  .rsl-pack .rsl-sign{left:50%;top:calc(22% - 8px);transform:translateX(-50%);padding:3px 16px;border-radius:6px;background:#08271f;color:#f6d98a;font:700 15px/1.4 'Cormorant Garamond',Georgia,serif;letter-spacing:.34em;text-shadow:0 0 8px rgba(246,217,138,.9);border:2px solid #c6a76b;animation:rslNeon 2.2s ease-in-out infinite}
  @keyframes rslNeon{0%,100%{opacity:1}45%{opacity:.78}50%{opacity:1}}
  .rsl-pack .rsl-win{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;left:50%;top:calc(22% + 28px);width:min(190px,36%);margin-left:calc(min(190px,36%) / -2)}
  .rsl-pack .rsl-win i{display:block;aspect-ratio:3/4;border-radius:3px 3px 1px 1px;background:#46506f;animation:rslWin 3.6s ease-in-out infinite}
  @keyframes rslWin{0%,18%{background:#46506f;box-shadow:none}30%,76%{background:#ffd877;box-shadow:0 0 10px 1px rgba(255,216,119,.65)}90%,100%{background:#46506f;box-shadow:none}}
  .rsl-pack .rsl-door{left:50%;bottom:34px;width:34px;height:46px;margin-left:-17px;background:#5a3b2a;border-radius:17px 17px 0 0;box-shadow:0 0 0 3px #c6a76b}
  .rsl-pack .rsl-door::after{content:"";position:absolute;inset:6px 6px 0;border-radius:11px 11px 0 0;background:#ffd877;opacity:.9;animation:rslNeon 3s ease-in-out infinite}
  .rsl-pack .rsl-awn{left:50%;bottom:78px;width:64px;height:14px;margin-left:-32px;background:repeating-linear-gradient(90deg,#b8362f 0 10px,#f4efe3 10px 20px);border-radius:3px 3px 8px 8px}
  .rsl-pack .rsl-palm{bottom:34px;width:60px;height:96px;transform-origin:50% 100%;animation:rslSway 3.4s ease-in-out infinite}
  .rsl-pack .rsl-palm.l{left:12%}.rsl-pack .rsl-palm.r{right:12%;animation-delay:-1.6s;transform:scaleX(-1)}
  @keyframes rslSway{50%{transform:rotate(3deg)}}
  .rsl-pack .rsl-palm.r{animation-name:rslSwayR}@keyframes rslSwayR{0%,100%{transform:scaleX(-1) rotate(0)}50%{transform:scaleX(-1) rotate(3deg)}}
  .rsl-pack .rsl-bag{bottom:34px;width:30px;height:36px;animation:rslBag 3.4s ease-in-out infinite}
  @keyframes rslBag{0%{left:-8%;opacity:0}10%{opacity:1}78%{left:47%;opacity:1}88%,100%{left:48%;opacity:0}}
  .rsl-pack .rsl-bag svg{width:100%;height:100%;animation:rslBagB .45s ease-in-out infinite}
  @keyframes rslBagB{50%{transform:translateY(-3px)}}

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

  /* ---- Voir plus ---- */
  .dg-more{display:flex;justify-content:center;margin:22px 0 4px}
  .dg-more .btn small{opacity:.7;margin-left:6px}
  .dest-grid:not(.dg-open)>.dg-extra{display:none!important}
  .dest-grid.dg-open>.dg-extra{animation:rslIn .4s ease both}
  .geo-list li.geo-more{justify-content:center;cursor:pointer;color:#075f4b;font-weight:600;border-top:1px solid #efebe3;margin-top:4px;border-radius:0 0 8px 8px}
  .geo-list li.geo-more:hover{background:#eef6f2}
  @media (prefers-reduced-motion: reduce){.rsl *{animation:none!important}}`;
  document.head.appendChild(css);

  /* ---------- Scènes ---------- */
  const CAR_SVG = `<svg class="rsl-veh" viewBox="0 0 220 96" aria-hidden="true">
    <ellipse cx="110" cy="90" rx="92" ry="5" fill="rgba(0,0,0,.28)"/>
    <path d="M12 70V54c0-5 3-8 8-9l30-6 22-24c3-3 7-5 12-5h50c5 0 9 2 12 5l20 22 30 6c5 1 8 4 8 9v18c0 3-2 5-5 5H17c-3 0-5-2-5-5Z" fill="#075f4b"/>
    <path d="M12 58h196v10H12z" fill="#0b352b" opacity=".55"/>
    <path d="M74 27h30v21H59zM112 27h24c3 0 5 1 7 3l14 18h-45z" fill="#cfe9f5"/><path d="M104 27h8v21h-8z" fill="#075f4b"/>
    <path d="M74 27h30v6H66zM112 27h24l5 6h-29z" fill="#fff" opacity=".35"/>
    <rect x="196" y="52" width="14" height="9" rx="3" fill="#ffe9a8"/><rect x="10" y="54" width="9" height="8" rx="2" fill="#ff6b5f"/>
    <path d="M196 56h24" stroke="rgba(255,233,168,.55)" stroke-width="9" stroke-linecap="round"/>
    <g class="rsl-whl-g"><circle cx="58" cy="74" r="15" fill="#171a19"/><g class="rsl-whl"><circle cx="58" cy="74" r="9" fill="#c8cfcb"/><path d="M58 65v18M49 74h18M51.6 67.6l12.8 12.8M64.4 67.6 51.6 80.4" stroke="#6b7570" stroke-width="2"/></g></g>
    <g><circle cx="164" cy="74" r="15" fill="#171a19"/><g class="rsl-whl"><circle cx="164" cy="74" r="9" fill="#c8cfcb"/><path d="M164 65v18M155 74h18M157.6 67.6l12.8 12.8M170.4 67.6l-12.8 12.8" stroke="#6b7570" stroke-width="2"/></g></g>
  </svg>`;
  const JET_SVG = `<svg class="rsl-fly" viewBox="0 0 300 120" aria-hidden="true">
    <path d="M128 56 92 12h26l78 40z" fill="#c9d6df"/><path d="M128 70 92 108h26l78-38z" fill="#dce6ed"/>
    <path d="M24 62c0-8 5-13 13-14l160-10c28-2 56 6 70 18 3 3 3 6 0 8-14 12-42 20-70 18L37 72c-8-1-13-5-13-10Z" fill="#fff"/>
    <path d="M24 62c0-8 5-13 13-14l8-.5V73l-8-.5c-8-1-13-5-13-10Z" fill="#e8eef2"/>
    <path d="M36 50 14 8h24l26 38z" fill="#075f4b"/><path d="M36 74 16 100h20l24-24z" fill="#c9d6df"/>
    <path d="M150 53h96c7 3 13 6 18 10-8 7-18 10-26 10h-88z" fill="#075f4b" opacity=".9"/>
    <path d="M254 52c8 2 18 6 24 10l-26 2z" fill="#0b352b"/>
    <g fill="#8fb3c9"><circle cx="86" cy="58" r="3.4"/><circle cx="104" cy="57" r="3.4"/><circle cx="122" cy="56" r="3.4"/><circle cx="140" cy="55" r="3.4"/><circle cx="158" cy="54" r="3.4"/><circle cx="176" cy="53" r="3.4"/><circle cx="194" cy="52" r="3.4"/></g>
    <rect x="118" y="76" width="34" height="14" rx="7" fill="#9fb2bf"/><rect x="124" y="79" width="20" height="8" rx="4" fill="#5d7183"/>
  </svg>`;
  const PALM = `<svg class="rsl-palm" viewBox="0 0 60 96" aria-hidden="true"><path d="M30 96c1-30 2-52-2-72" stroke="#5a3b2a" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#2f8a62"><path d="M28 26C14 20 6 24 2 34c10-6 18-6 26-8z"/><path d="M28 26C18 12 8 12 4 16c10 0 18 4 24 10z"/><path d="M28 26C32 12 42 6 54 10c-10 2-18 8-26 16z"/><path d="M28 26c14-4 24 0 30 10-10-4-20-6-30-10z"/><path d="M28 26c-2-10 2-20 10-24-2 10-6 18-10 24z"/></g></svg>`;
  const BAG = `<svg class="rsl-bag-svg" viewBox="0 0 30 36" aria-hidden="true"><rect x="4" y="9" width="22" height="22" rx="4" fill="#c6a76b"/><path d="M11 9V5a4 4 0 0 1 8 0v4" stroke="#8a6d3a" stroke-width="2.4" fill="none"/><path d="M9 14v13M21 14v13" stroke="#8a6d3a" stroke-width="1.6"/><circle cx="9" cy="33" r="2.4" fill="#2a2a2a"/><circle cx="21" cy="33" r="2.4" fill="#2a2a2a"/></svg>`;
  const stars = () => Array.from({ length: 16 }, (_, i) => `<i class="rsl-star" style="left:${(i * 37 + 11) % 97}%;top:${(i * 23 + 7) % 46}%;animation-delay:${(i % 6) * 0.35}s"></i>`).join('');
  const SCENES = {
    car: { msg: 'Recherche des véhicules', sub: 'Nous cherchons les voitures disponibles pour vos dates.', min: 1700,
      html: `<div class="rsl-stage"><div class="rsl-sky"></div><div class="rsl-sun"></div><div class="rsl-far"></div><div class="rsl-near"></div><div class="rsl-road"></div><div class="rsl-lane"></div><div class="rsl-wind"></div>${CAR_SVG}</div>` },
    flight: { msg: 'Recherche des vols', sub: 'Nous comparons les offres des compagnies sur votre trajet.', min: 1600,
      html: `<div class="rsl-stage"><div class="rsl-sky"></div><div class="rsl-cl a"></div><div class="rsl-cl b"></div><div class="rsl-cl c"></div><div class="rsl-cl d"></div><div class="rsl-trail"></div><div class="rsl-trail t2"></div>${JET_SVG}<div class="rsl-route"></div><div class="rsl-pin a"></div><div class="rsl-pin b"></div><div class="rsl-dot"></div></div>` },
    pack: { msg: 'Recherche des séjours', sub: 'Nous préparons les escapades vol + hôtel qui vous correspondent.', min: 1700,
      html: `<div class="rsl-stage"><div class="rsl-sky"></div><div class="rsl-moon"></div>${stars()}<div class="rsl-ground"></div><div class="rsl-bld"></div><div class="rsl-sign">HÔTEL</div><div class="rsl-win">${Array.from({ length: 15 }, (_, i) => `<i style="animation-delay:${((i * 7) % 15) * 0.22}s"></i>`).join('')}</div><div class="rsl-awn"></div><div class="rsl-door"></div>${PALM.replace('rsl-palm', 'rsl-palm l')}${PALM.replace('rsl-palm', 'rsl-palm r')}<div class="rsl-bag">${BAG}</div></div>` },
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
    panel.innerHTML = `${scene.html}<p class="rsl-msg"><b>${scene.msg}…</b><span>${scene.sub}</span><span class="rsl-dots"><i></i><i></i><i></i></span></p>`;
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
  const LIMIT = (g) => (g.classList.contains('dg7') ? 7 : 8);
  function seeMore(root = document) {
    root.querySelectorAll?.('.dest-grid:not([data-more])').forEach((g) => {
      const kids = [...g.children];
      const limit = LIMIT(g);
      if (kids.length <= limit + 1 || g.id === 'carCatIntro') return;
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
