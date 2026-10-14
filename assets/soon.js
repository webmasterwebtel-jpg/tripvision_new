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

  /* ---------- Week-ends : la valise qui se remplit, le calendrier ven-sam-dim, des monuments du monde au coucher du soleil ---------- */
  const rn = (n) => Math.round(n * 10) / 10;
  const lights = (x, y, w, h, seed) => { let out = ''; for (let r = 0; r < Math.floor(h / 16); r++) for (let c = 0; c < Math.floor(w / 13); c++) if (((r * 7 + c * 13 + seed) % 5) < 2) out += `<rect class="lt" style="--l:${((r + c + seed) % 7) * .45}s" x="${rn(x + 5 + c * 13)}" y="${rn(y + 6 + r * 16)}" width="5" height="7" rx="1"/>`; return out; };
  const tile = (far) => {
    const base = far ? '#2a6f78' : '#0b3b3a';
    return `<svg viewBox="0 0 1200 260" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><g fill="${base}">
      <path d="M96 260 L120 190 L126 150 L130 110 L134 50 L136 14 L138 50 L142 110 L146 150 L152 190 L176 260 L158 260 Q136 205 114 260Z"/><rect x="116" y="146" width="40" height="6"/><rect x="125" y="104" width="22" height="5"/>
      <rect x="190" y="170" width="70" height="90"/><rect x="262" y="150" width="54" height="110"/><path d="M262 150 L289 128 L316 150Z"/>
      <rect x="420" y="96" width="38" height="164"/><rect x="428" y="72" width="22" height="26"/><circle cx="439" cy="66" r="7"/><rect x="438" y="44" width="2" height="18"/>
      <rect x="486" y="190" width="90" height="70"/><rect x="590" y="178" width="46" height="82"/>
      <rect x="660" y="190" width="120" height="70"/><path d="M676 190 A34 36 0 0 1 744 190Z" fill="${far ? '#3d86a8' : '#1c5f8e'}"/><rect x="709" y="146" width="2" height="12" fill="${far ? '#cfe9e0' : '#e7f3ef'}"/><rect x="756" y="150" width="16" height="40"/>
      <path d="M850 260 L856 120 L862 52 L868 8 L874 52 L880 120 L888 260Z"/><rect x="900" y="150" width="46" height="110"/><rect x="950" y="176" width="60" height="84"/>
      <path d="M1066 260 Q1058 215 1072 168" stroke="${far ? '#2a6f78' : '#0b3b3a'}" stroke-width="7" fill="none"/><g transform="translate(1072 168)">${[-80, -40, 0, 40, 80, 120, -120].map((a) => `<path d="M0 0 Q26 -22 56 -3 Q26 -9 0 0Z" transform="rotate(${a})"/>`).join('')}</g>
      <rect x="1100" y="200" width="100" height="60"/></g>
      ${far ? '' : `<g fill="#ffd978">${lights(190, 170, 70, 90, 1)}${lights(262, 150, 54, 110, 2)}${lights(486, 190, 90, 70, 3)}${lights(590, 178, 46, 82, 4)}${lights(660, 190, 120, 70, 5)}${lights(900, 150, 46, 110, 6)}${lights(950, 176, 60, 84, 7)}${lights(1100, 200, 100, 60, 8)}</g>`}
    </svg>`;
  };
  const cloud = `<svg viewBox="0 0 260 90" aria-hidden="true"><g fill="#fff"><ellipse cx="80" cy="60" rx="70" ry="24"/><ellipse cx="140" cy="44" rx="52" ry="34"/><ellipse cx="190" cy="62" rx="62" ry="22"/></g></svg>`;

  const suitcase = `
  <svg class="case" viewBox="0 0 360 330" aria-hidden="true">
    <defs>
      <linearGradient id="scBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a8168"/><stop offset=".55" stop-color="#14574a"/><stop offset="1" stop-color="#0a3027"/></linearGradient>
      <linearGradient id="scGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4dc9a"/><stop offset="1" stop-color="#b98a35"/></linearGradient>
    </defs>
    <ellipse cx="180" cy="318" rx="140" ry="10" fill="rgba(0,0,0,.35)"/>
    <g class="lid"><rect x="34" y="4" width="292" height="116" rx="22" fill="#0f4a3b"/><rect x="46" y="16" width="268" height="92" rx="14" fill="#f1e6c9"/><rect x="58" y="28" width="244" height="68" rx="10" fill="none" stroke="#c8a24a" stroke-width="2" stroke-dasharray="6 6"/><rect x="74" y="44" width="92" height="40" rx="8" fill="#e4d4aa"/><circle cx="238" cy="64" r="22" fill="#e4d4aa"/></g>
    <g class="items">
      <g transform="translate(86 62)"><g class="it" style="--k:0;--r:-14deg"><rect width="86" height="40" rx="6" fill="#fffdf8" stroke="#c8a24a"/><line x1="58" y1="4" x2="58" y2="36" stroke="#c8a24a" stroke-dasharray="3 3"/><path d="M14 24 L30 20 L38 10 L42 10 L38 21 L50 22 L48 25 L38 26 L42 34 L38 34 L30 27 L14 27Z" fill="#0f5a46"/></g></g>
      <g transform="translate(186 50)"><g class="it" style="--k:1;--r:10deg"><rect width="64" height="42" rx="8" fill="#1b2a26"/><rect x="6" y="-8" width="22" height="10" rx="3" fill="#1b2a26"/><circle cx="32" cy="22" r="14" fill="#0e1715" stroke="#9fd9cb" stroke-width="3"/><circle cx="32" cy="22" r="6" fill="#3d6f8e"/><circle cx="54" cy="10" r="3" fill="#e6c47e"/></g></g>
      <g transform="translate(120 56)"><g class="it" style="--k:2;--r:-8deg"><rect width="42" height="56" rx="5" fill="#0f5a46"/><circle cx="21" cy="26" r="11" fill="none" stroke="#e6c47e" stroke-width="3"/><rect x="9" y="44" width="24" height="3" rx="1.5" fill="#e6c47e"/></g></g>
      <g transform="translate(236 66)"><g class="it" style="--k:3;--r:16deg"><circle cx="14" cy="14" r="14" fill="#10231c" stroke="#e6c47e" stroke-width="3"/><circle cx="56" cy="14" r="14" fill="#10231c" stroke="#e6c47e" stroke-width="3"/><path d="M28 12 Q35 6 42 12" stroke="#e6c47e" stroke-width="3" fill="none"/></g></g>
    </g>
    <g class="body">
      <rect x="20" y="112" width="320" height="196" rx="28" fill="url(#scBody)" stroke="#6fd0b5" stroke-opacity=".35"/>
      <rect x="76" y="112" width="18" height="196" fill="url(#scGold)" opacity=".92"/><rect x="266" y="112" width="18" height="196" fill="url(#scGold)" opacity=".92"/>
      <path d="M85 120 V300 M275 120 V300" stroke="#8c6a22" stroke-width="2" stroke-dasharray="5 6" opacity=".7"/>
      <path d="M20 280 Q20 308 48 308 L66 308 L66 286 Q40 286 20 262Z M340 280 Q340 308 312 308 L294 308 L294 286 Q320 286 340 262Z" fill="url(#scGold)"/>
      <rect x="156" y="124" width="48" height="28" rx="8" fill="url(#scGold)"/><circle cx="180" cy="136" r="5" fill="#0a3027"/><rect x="178" y="136" width="4" height="10" rx="2" fill="#0a3027"/>
      <circle cx="180" cy="214" r="42" fill="#f6ecd0" stroke="#c8a24a" stroke-width="3"/>
      <path d="M156 220 L176 215 L186 198 L192 198 L186 214 L202 216 L199 221 L186 223 L192 236 L186 236 L176 224 L156 224Z" fill="#0f5a46"/>
      <text x="180" y="278" text-anchor="middle" font-family="Inter, sans-serif" font-size="21" font-weight="800" letter-spacing="3.5" fill="#f6ecd0">WEEK-END</text>
    </g>
    <g class="closed"><rect x="20" y="96" width="320" height="30" rx="14" fill="#1a6b57" stroke="#6fd0b5" stroke-opacity=".35"/><path d="M128 98 Q128 56 180 56 Q232 56 232 98" fill="none" stroke="url(#scGold)" stroke-width="12" stroke-linecap="round"/><rect x="156" y="106" width="48" height="26" rx="8" fill="url(#scGold)"/></g>
    <g class="tag" transform="translate(262 100)"><g class="swing"><path d="M0 0 Q14 30 4 52" stroke="#c8a24a" stroke-width="3" fill="none"/><rect x="-22" y="50" width="52" height="68" rx="9" fill="#fffdf8" stroke="#c8a24a" stroke-width="2.5"/><circle cx="4" cy="62" r="4" fill="#c8a24a"/><text x="4" y="92" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="800" fill="#0f5a46">2 NUITS</text><text x="4" y="108" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#b98a35">TRIPVISION</text></g></g>
  </svg>`;

  const ico = {
    plane: '<svg viewBox="0 0 24 24"><path d="M2 14 L10 11 L14 3 L16 3 L14 11 L21 12 Q22 12.5 21 13 L14 14 L16 21 L14 21 L10 15 L2 15Z" fill="currentColor"/></svg>',
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18 V7 M3 14 H21 V18 M21 14 V11 Q21 9 19 9 H11 V14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="11" r="2" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10 V7.5 A4 4 0 0 1 16 7.5 V10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  };

  const packsScene = `
  <div class="so-sky pk"><span class="so-sun"></span><i class="so-stars pk-stars"></i></div>
  <div class="so-layer so-clouds"><div class="so-track">${[0, 1].map(() => `<div class="cl-row"><i style="left:8%;top:12%;transform:scale(1.1)">${cloud}</i><i style="left:42%;top:34%;transform:scale(.7)">${cloud}</i><i style="left:72%;top:8%;transform:scale(.95)">${cloud}</i></div>`).join('')}</div></div>
  <div class="so-layer so-sk-far"><div class="so-track">${tile(true).repeat(2)}</div></div>
  <div class="so-layer so-sk-near"><div class="so-track">${tile(false).repeat(2)}</div></div>
  <div class="so-ground"></div>
  <div class="so-chips"><span class="chip c1">${ico.plane}Transport</span><span class="chip c2">${ico.bed}Hôtel</span><span class="chip c3">${ico.lock}Paiement sécurisé</span></div>
  <div class="so-cal" aria-hidden="true"><div class="cal-h">Votre week-end</div><div class="cal-days"><div class="d d1"><b>Ven</b><span>Départ</span></div><div class="d d2"><b>Sam</b><span>Découverte</span></div><div class="d d3"><b>Dim</b><span>Retour</span></div></div><div class="cal-bar"><i></i></div></div>
  <div class="so-case">${suitcase}</div>`;

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
    fit();
  }

  /* La scène remplit exactement l'écran sous l'en-tête (rien à faire défiler) ; l'avion rejoint toujours l'île, quelle que soit la taille. */
  function fit() {
    document.querySelectorAll('.soon').forEach((s) => {
      const page = s.parentElement;
      if (!page || !page.classList.contains('active')) return;
      const top = s.getBoundingClientRect().top + window.scrollY;
      s.style.height = `${Math.max(520, window.innerHeight - top)}px`;
    });
  }
  let t; const later = () => { clearTimeout(t); t = setTimeout(fit, 60); };
  window.addEventListener('resize', later); window.addEventListener('hashchange', later); window.addEventListener('load', later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(document.documentElement);
  mount(); // les sections existent déjà dans la page : montage immédiat (pas de flash du contenu d'origine)
  document.addEventListener('DOMContentLoaded', () => { mount(); later(); });
})();
