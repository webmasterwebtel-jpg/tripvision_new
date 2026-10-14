/* Pages « Voitures » et « Week-ends » : « Bientôt disponible », avec une scène animée propre à chaque page.
   Le contenu d'origine de ces pages reste dans le code (masqué par CSS) : il suffit de retirer ce script pour les rouvrir. */
(function () {
  'use strict';

  const letters = (txt) => [...txt].map((c, i) => c === ' ' ? '<span class="sp"> </span>' : `<span class="ch" style="--i:${i}">${c}</span>`).join('');

  /* ---------- Voitures : route de nuit, SUV en mouvement, phares, lampadaires ---------- */
  const car = `
  <svg class="car" viewBox="0 0 900 220" aria-hidden="true">
    <defs>
      <linearGradient id="soBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c6f5b"/><stop offset=".55" stop-color="#14473a"/><stop offset="1" stop-color="#0a2a22"/></linearGradient>
      <linearGradient id="soGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fd9cb"/><stop offset=".6" stop-color="#2b6f68"/><stop offset="1" stop-color="#143c3a"/></linearGradient>
      <linearGradient id="soBeam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6d6" stop-opacity=".85"/><stop offset=".5" stop-color="#ffe9a6" stop-opacity=".25"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></linearGradient>
      <radialGradient id="soGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></radialGradient>
    </defs>
    <path class="beam" d="M628 126 L900 52 L900 196 Z" fill="url(#soBeam)"/>
    <ellipse cx="450" cy="206" rx="300" ry="9" fill="rgba(0,0,0,.45)"/>
    <g class="body">
      <path d="M222 156 Q222 132 246 128 L300 120 Q322 84 372 76 L492 76 Q540 80 566 118 L616 126 Q652 132 652 158 L652 174 Q652 182 642 182 L232 182 Q222 182 222 174 Z" fill="url(#soBody)" stroke="#6fd0b5" stroke-opacity=".35"/>
      <path d="M326 118 Q344 90 380 84 L436 84 L436 118 Z" fill="url(#soGlass)"/>
      <path d="M446 84 L494 84 Q530 88 548 118 L446 118 Z" fill="url(#soGlass)"/>
      <path d="M250 150 L630 150" stroke="#8be3c9" stroke-opacity=".35" stroke-width="2"/>
      <rect x="590" y="140" width="38" height="9" rx="4.5" fill="#fff6d6"/>
      <circle cx="624" cy="145" r="22" fill="url(#soGlow)" class="halo"/>
      <rect x="228" y="140" width="22" height="8" rx="4" fill="#ff5a52"/>
      <path d="M392 122 L392 150" stroke="#0a2a22" stroke-opacity=".5" stroke-width="2"/>
      <path d="M520 122 L520 150" stroke="#0a2a22" stroke-opacity=".5" stroke-width="2"/>
    </g>
    ${[330, 560].map((x) => `
    <g class="wheel" transform="translate(${x} 182)">
      <circle r="31" fill="#07100d"/>
      <g class="spin"><circle r="21" fill="#cfe9e0"/><circle r="17" fill="#0d3a2f"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M0 0 L0 -17" stroke="#cfe9e0" stroke-width="4" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}
        <circle r="5" fill="#e6c47e"/></g>
    </g>`).join('')}
  </svg>`;

  const lamps = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
    <defs><radialGradient id="soLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a6" stop-opacity=".75"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></radialGradient></defs>
    <g><rect x="196" y="70" width="6" height="230" fill="#0b1f19"/><path d="M199 76 Q220 70 236 78" stroke="#0b1f19" stroke-width="6" fill="none"/><ellipse cx="238" cy="82" rx="14" ry="6" fill="#ffe9a6"/><ellipse cx="238" cy="100" rx="42" ry="40" fill="url(#soLamp)"/></g>
  </svg>`;
  const trees = `<svg viewBox="0 0 400 200" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
    <g fill="#0a2a22"><path d="M40 200 L70 90 L100 200Z"/><path d="M60 200 L90 120 L120 200Z"/><path d="M230 200 L262 70 L294 200Z"/><path d="M262 200 L292 110 L322 200Z"/><path d="M340 200 L360 130 L380 200Z"/></g>
  </svg>`;
  const hills = (fill, d) => `<svg viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="${fill}"/></svg>`;

  const carsScene = `
  <div class="so-sky"><span class="so-moon"></span><i class="so-stars"></i></div>
  <div class="so-layer so-far"><div class="so-track">${hills('#0d3a2f', 'M0 300 L0 190 Q90 120 180 170 T360 150 T540 180 T720 120 T900 170 T1080 140 T1200 190 L1200 300Z').repeat(2)}</div></div>
  <div class="so-layer so-mid"><div class="so-track">${hills('#0a2e25', 'M0 300 L0 220 Q100 150 200 205 T400 190 T600 215 T800 170 T1000 210 T1200 200 L1200 300Z').repeat(2)}</div></div>
  <div class="so-layer so-trees"><div class="so-track">${trees.repeat(6)}</div></div>
  <div class="so-road"><i class="so-line"></i></div>
  <div class="so-layer so-lamps"><div class="so-track">${lamps.repeat(5)}</div></div>
  <div class="so-car">${car}</div>
  <div class="so-streaks"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;

  /* ---------- Week-ends : ciel de fin de journée, avion, île, palmiers, vagues ---------- */
  const plane = `<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M8 30 L46 24 L72 4 L84 4 L70 25 L108 27 Q116 28 116 31 Q116 34 108 35 L70 37 L84 56 L72 56 L46 38 L8 32 Z" fill="#fff" stroke="#0f3b2e" stroke-width="2" stroke-linejoin="round"/><path d="M92 28 L106 28" stroke="#9fd9cb" stroke-width="3" stroke-linecap="round"/></svg>`;
  const palm = (x, h, d) => `<g class="palm" style="--d:${d}s" transform="translate(${x} 0)"><path d="M0 300 Q-8 ${300 - h / 2} 6 ${300 - h}" stroke="#4b3a2a" stroke-width="9" fill="none" stroke-linecap="round"/><g transform="translate(6 ${300 - h})"><g class="crown">${[-70, -35, 0, 35, 70, 105, -105].map((a) => `<path d="M0 0 Q40 -34 84 -4 Q42 -14 0 0Z" fill="#1c7a5c" transform="rotate(${a})"/>`).join('')}</g></g></g>`;
  const wave = (fill, o) => `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 Q75 ${20 + o} 150 60 T300 60 T450 60 T600 60 T750 60 T900 60 T1050 60 T1200 60 L1200 120 L0 120Z" fill="${fill}"/></svg>`;
  const cloud = `<svg viewBox="0 0 260 90" aria-hidden="true"><g fill="#fff"><ellipse cx="80" cy="60" rx="70" ry="24"/><ellipse cx="140" cy="44" rx="52" ry="34"/><ellipse cx="190" cy="62" rx="62" ry="22"/></g></svg>`;

  const packsScene = `
  <div class="so-sky pk"><span class="so-sun"></span></div>
  <div class="so-layer so-clouds"><div class="so-track">${[0, 1].map(() => `<div class="cl-row"><i style="left:6%;top:14%;transform:scale(1.1)">${cloud}</i><i style="left:38%;top:30%;transform:scale(.7)">${cloud}</i><i style="left:66%;top:10%;transform:scale(1)">${cloud}</i><i style="left:86%;top:36%;transform:scale(.6)">${cloud}</i></div>`).join('')}</div></div>
  <svg class="so-route" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path id="soRoute" d="M-40 470 C 260 150, 700 90, 930 392" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 14" class="rt"/>
  </svg>
  <div class="so-plane">${plane}</div>
  <div class="so-island">
    <svg viewBox="0 0 700 340" aria-hidden="true">
      <defs><linearGradient id="soSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dfae"/><stop offset="1" stop-color="#d6b777"/></linearGradient></defs>
      <path d="M30 330 Q120 236 270 236 Q360 190 470 232 Q600 232 676 330Z" fill="url(#soSand)"/>
      <g class="hotel"><rect x="318" y="150" width="120" height="86" rx="6" fill="#fffdf8"/><rect x="306" y="140" width="144" height="14" rx="4" fill="#0f5a46"/>${[0, 1, 2, 3].map((i) => `<rect class="win" style="--w:${i * .35}s" x="${332 + i * 26}" y="170" width="14" height="22" rx="3" fill="#ffd978"/>`).join('')}<rect x="366" y="206" width="24" height="30" rx="3" fill="#0f5a46"/></g>
      ${palm(170, 150, 0)}${palm(236, 120, 1.1)}${palm(520, 140, 0.6)}${palm(590, 110, 1.6)}
    </svg>
    <div class="so-pin"><i></i><b></b></div>
  </div>
  <div class="so-sea"><div class="so-track s1">${wave('rgba(48,170,150,.9)', 0).repeat(2)}</div><div class="so-track s2">${wave('rgba(14,100,100,.95)', 14).repeat(2)}</div><div class="so-track s3">${wave('#0a4c4a', 28).repeat(2)}</div></div>`;

  const block = (kind, headline, sub, scene) => {
    const d = document.createElement('div');
    d.className = `soon soon-${kind}`;
    d.setAttribute('role', 'region');
    d.setAttribute('aria-label', 'Bientôt disponible');
    d.innerHTML = `<div class="soon-scene" aria-hidden="true">${scene}</div>
      <div class="soon-copy">
        <div class="soon-kicker"><span class="soon-dot"></span>${headline}</div>
        <h1 class="soon-title" aria-label="Bientôt disponible"><span class="soon-line">${letters('Bientôt')}</span> <span class="soon-line gold">${letters('disponible')}</span></h1>
        <p class="soon-sub">${sub}</p>
        <form class="soon-form" novalidate data-kind="${kind === 'cars' ? 'car' : 'pack'}">
          <div class="soon-field">
            <input type="email" name="email" placeholder="Votre adresse e-mail" autocomplete="email" aria-label="Votre adresse e-mail" required maxlength="160">
            <button type="submit" class="btn gold"><span class="lbl">Me prévenir</span></button>
          </div>
          <p class="soon-msg" role="status" aria-live="polite">Laissez votre e-mail : nous vous prévenons dès l’ouverture, une seule fois.</p>
          <div class="soon-ok" hidden><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27 L23 35 L38 18"/></svg><div><b>C’est noté, merci !</b><span>Vous serez prévenu(e) par e-mail dès que ${kind === 'cars' ? 'les locations de voiture sont' : 'les week-ends sont'} disponibles.</span></div></div>
        </form>
        <div class="soon-cta"><a class="btn gold" href="#flights" data-page-link="flights">Voir les vols</a><a class="btn ghost-light" href="#home" data-page-link="home">Retour à l’accueil</a></div>
      </div>`;
    return d;
  };

  const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('.soon-form'); if (!f) return;
    e.preventDefault();
    const input = f.elements.email, msg = f.querySelector('.soon-msg'), btn = f.querySelector('button'), lbl = btn.querySelector('.lbl');
    const email = input.value.trim();
    f.classList.remove('bad');
    if (!MAIL.test(email)) { f.classList.add('bad'); msg.textContent = 'Indiquez une adresse e-mail valide.'; input.focus(); return; }
    btn.disabled = true; lbl.textContent = 'Envoi…';
    try {
      const base = window.TV_API_BASE || '/api';
      const r = await fetch(`${base}/public/notify-me`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, kind: f.dataset.kind }) });
      if (r.status === 429) throw new Error('Trop de tentatives : réessayez dans quelques minutes.');
      if (!r.ok) throw new Error('Envoi impossible pour le moment : réessayez dans un instant.');
      f.classList.add('done');
      f.querySelector('.soon-ok').hidden = false; f.querySelector('.soon-field').hidden = true; msg.hidden = true;
    } catch (err) {
      f.classList.add('bad'); msg.textContent = err.message || 'Envoi impossible pour le moment.'; btn.disabled = false; lbl.textContent = 'Me prévenir';
    }
  });

  function mount() {
    const defs = [
      ['cars', block('cars', 'Locations de voiture', 'Citadine, SUV ou utilitaire : les enseignes vérifiées arrivent, avec un prix total affiché d’avance. Les vols, eux, sont déjà en ligne.', carsScene)],
      ['packs', block('packs', 'Week-ends tout organisés', 'Transport et hôtel réservés ensemble, payés en ligne en toute sécurité : nos premiers séjours arrivent très bientôt.', packsScene)],
    ];
    defs.forEach(([id, node]) => { const sec = document.getElementById(id); if (sec && !sec.querySelector('.soon')) { sec.classList.add('is-soon'); sec.prepend(node); } });
  }
  mount(); // les sections existent déjà dans la page : montage immédiat (pas de flash du contenu d'origine)
  document.addEventListener('DOMContentLoaded', mount);
})();
