/* Sélecteur de période : un seul champ « du … au … » qui ouvre un calendrier sur deux mois.
   Il remplit les deux champs date d'origine (cachés) et déclenche leurs événements : le reste du site ne change pas. */
(() => {
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const DAYS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? new Date(`${s}T12:00:00`) : null);
  const short = (s) => { const d = parse(s); return d ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''; };
  const nights = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>';

  function attach(start, end, opts = {}) {
    if (!start || !end || start.dataset.rp) return;
    start.dataset.rp = end.dataset.rp = '1';
    const unit = opts.unit || 'jour';
    const field = document.createElement('div');
    field.className = 'rp-field';
    field.innerHTML = `<span class="rp-lbl">${opts.label || 'Dates'}</span><button type="button" class="rp-btn" aria-haspopup="dialog">${ICON}<span class="rp-val"></span></button>`;
    const sLab = start.closest('label'), eLab = end.closest('label');
    sLab.parentNode.insertBefore(field, sLab);
    sLab.classList.add('rp-hidden'); eLab.classList.add('rp-hidden');
    const val = field.querySelector('.rp-val'), btn = field.querySelector('.rp-btn');
    const count = (a, b) => { const n = nights(a, b); return unit === 'nuit' ? `${n} nuit${n > 1 ? 's' : ''}` : `${Math.max(1, n)} jour${Math.max(1, n) > 1 ? 's' : ''}`; };
    const paint = () => {
      const a = start.value, b = end.value;
      val.innerHTML = a && b ? `<b>${short(a)}</b><i>→</i><b>${short(b)}</b><em>${count(a, b)}</em>` : a ? `<b>${short(a)}</b><i>→</i><span class="rp-ph">Date de retour</span>` : `<span class="rp-ph">${opts.placeholder || 'Choisissez vos dates'}</span>`;
    };
    paint();
    // Dates remplies par le site sans événement (recherche restaurée) : l'affichage suit.
    setInterval(() => { if (!pop && !document.hidden && field.isConnected) paint(); }, 1200);
    ['change', 'input'].forEach((t) => { start.addEventListener(t, paint); end.addEventListener(t, paint); });
    const set = (inp, v) => { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };

    let pop = null, view = null, a = null, b = null, hover = null;
    const minDay = () => (opts.min ? parse(typeof opts.min === 'function' ? opts.min() : opts.min) : parse(iso(new Date())));
    const place = () => {
      if (!pop || window.innerWidth <= 700) return;
      const r = btn.getBoundingClientRect(), h = pop.offsetHeight, w = pop.offsetWidth;
      const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
      const top = below >= h || below >= above ? r.bottom + 8 : Math.max(8, r.top - h - 8);
      pop.style.top = `${Math.max(8, Math.min(top, window.innerHeight - h - 8))}px`;
      pop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
    };
    window.addEventListener('resize', () => place());
    window.addEventListener('scroll', () => place(), { passive: true });
    const close = () => { pop?.remove(); pop = null; document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); btn.setAttribute('aria-expanded', 'false'); };
    const outside = (e) => { if (pop && !pop.contains(e.target) && !field.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); btn.focus(); } };
    const month = (y, m) => {
      const first = new Date(y, m, 1, 12), lead = (first.getDay() + 6) % 7, len = new Date(y, m + 1, 0).getDate();
      const min = minDay(), maxS = a && opts.maxSpan && !b ? iso(new Date(parse(a).getTime() + opts.maxSpan * 864e5)) : null;
      let cells = '';
      for (let i = 0; i < lead; i++) cells += '<span></span>';
      for (let d = 1; d <= len; d++) {
        const s = iso(new Date(y, m, d, 12)), off = s < iso(min) || (maxS && s > maxS) || (a && !b && s < a && false);
        const end2 = b || (a && hover && hover > a ? hover : null);
        const cls = [s === a && 'from', s === end2 && 'to', a && end2 && s > a && s < end2 && 'in', s === iso(new Date()) && 'today', off && 'off'].filter(Boolean).join(' ');
        cells += `<button type="button" class="${cls}" data-day="${s}" ${off ? 'disabled' : ''}>${d}</button>`;
      }
      return `<div class="rp-month"><h4>${MONTHS[m]} ${y}</h4><div class="rp-dow">${DAYS.map((x) => `<span>${x}</span>`).join('')}</div><div class="rp-days">${cells}</div></div>`;
    };
    const hint = () => (!a ? 'Choisissez la date de départ' : !b ? 'Choisissez la date de retour' : `Du ${short(a)} au ${short(b)} · ${count(a, b)}`);
    const draw = () => {
      if (!pop) return;
      const y = view.getFullYear(), m = view.getMonth();
      const prevOk = new Date(y, m, 1) > new Date(minDay().getFullYear(), minDay().getMonth(), 1);
      pop.querySelector('.rp-cal').innerHTML = `<button type="button" class="rp-nav prev" data-nav="-1" ${prevOk ? '' : 'disabled'} aria-label="Mois précédent">‹</button>${month(y, m)}${month(m === 11 ? y + 1 : y, (m + 1) % 12)}<button type="button" class="rp-nav next" data-nav="1" aria-label="Mois suivant">›</button>`;
      pop.querySelector('.rp-hint').textContent = hint();
      pop.querySelector('.rp-ok').disabled = !(a && b);
      place();
    };
    const quick = (from, n) => { a = iso(from); b = iso(new Date(from.getTime() + n * 864e5)); view = new Date(from.getFullYear(), from.getMonth(), 1, 12); draw(); };
    const open = () => {
      if (pop) return close();
      a = start.value || null; b = end.value || null; hover = null;
      const base = parse(a) || minDay();
      view = new Date(base.getFullYear(), base.getMonth(), 1, 12);
      pop = document.createElement('div');
      pop.className = 'rp-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Choisir les dates');
      const fri = new Date(minDay()); while (fri.getDay() !== 5) fri.setDate(fri.getDate() + 1);
      const shortcuts = (opts.shortcuts || [['Ce week-end', () => quick(fri, 2)], ['3 jours', () => quick(new Date(Math.max(minDay(), Date.now() + 864e5)), 3)], ['1 semaine', () => quick(new Date(Math.max(minDay(), Date.now() + 864e5)), 7)]]);
      pop.innerHTML = `<div class="rp-head"><b>${opts.title || 'Vos dates'}</b><button type="button" class="rp-x" aria-label="Fermer">×</button></div><div class="rp-quick">${shortcuts.map(([t], i) => `<button type="button" data-q="${i}">${t}</button>`).join('')}</div><div class="rp-cal"></div><div class="rp-foot"><span class="rp-hint"></span><button type="button" class="rp-clear">Effacer</button><button type="button" class="btn rp-ok">Valider</button></div>`;
      // Posé sur la page (et non dans le formulaire) pour ne jamais être coupé par la bannière.
      document.body.appendChild(pop);
      draw();
      // Pas assez de place sous le champ : on fait défiler la page pour que tout le calendrier soit visible.
      if (window.innerWidth > 700) { const need = btn.getBoundingClientRect().bottom + pop.offsetHeight + 16 - window.innerHeight; if (need > 0) window.scrollBy({ top: need, behavior: 'instant' }); }
      place();
      btn.setAttribute('aria-expanded', 'true');
      pop.addEventListener('click', (e) => {
        const day = e.target.closest('[data-day]');
        if (day) { const s = day.dataset.day; if (!a || b || s <= a) { a = s; b = null; } else { b = s; } draw(); if (a && b && opts.autoClose !== false && window.innerWidth > 700) setTimeout(apply, 180); return; }
        const nav = e.target.closest('[data-nav]');
        if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1, 12); draw(); return; }
        const q = e.target.closest('[data-q]');
        if (q) { shortcuts[Number(q.dataset.q)][1](); return; }
        if (e.target.closest('.rp-x')) return close();
        if (e.target.closest('.rp-clear')) { a = b = null; draw(); return; }
        if (e.target.closest('.rp-ok')) apply();
      });
      pop.addEventListener('mouseover', (e) => { const d = e.target.closest('[data-day]'); if (a && !b && d && d.dataset.day !== hover) { hover = d.dataset.day; draw(); } });
      setTimeout(() => { document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true); });
    };
    const apply = () => { if (!(a && b)) return; set(start, a); set(end, b); paint(); close(); };
    btn.addEventListener('click', open);
  }

  // Formulaires du site : location de voiture et week-ends.
  const mount = () => {
    const car = document.getElementById('carSearchForm');
    if (car) attach(car.elements.startDate, car.elements.endDate, { label: 'Dates de location', title: 'Dates de location', placeholder: 'Départ → retour', maxSpan: 30 });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.TVRange = { attach };
})();
