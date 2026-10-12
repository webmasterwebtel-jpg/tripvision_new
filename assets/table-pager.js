/* Pagination « 10 par 10 » des listes du back-office et des espaces client / partenaire.
   S'applique seule aux tableaux (id « tbl… »), à la liste des réservations du client (#orderList) et aux notifications (#notifList).
   Elle respecte la recherche et les filtres : seules les lignes visibles sont réparties en pages 1, 2, 3… */
(() => {
  const PER = 10;
  const SEL = 'table[id^="tbl"], #orderList, #notifList';
  const states = new Map();

  const rowsOf = (el) => (el.tagName === 'TABLE'
    ? [...(el.tBodies[0]?.rows || [])].filter((tr) => !tr.cells[0]?.hasAttribute('colspan'))
    : [...el.children].filter((c) => !c.classList.contains('empty')));

  const pagesFor = (page, pages) => {
    const set = new Set([1, pages, page - 1, page, page + 1]);
    const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
    return list.map((p, i) => `${i && p - list[i - 1] > 1 ? '<span class="tvpg-gap">…</span>' : ''}<button type="button" class="tvpg-btn${p === page ? ' on' : ''}" data-pg="${p}" ${p === page ? 'aria-current="page"' : ''} aria-label="Page ${p}">${p}</button>`).join('');
  };

  function attach(el) {
    let st = states.get(el);
    if (st) return st;
    const nav = document.createElement('nav');
    nav.className = 'tvpg';
    nav.setAttribute('aria-label', 'Pagination');
    nav.hidden = true;
    const anchor = el.tagName === 'TABLE' ? (el.closest('.table-wrap') || el) : el;
    anchor.insertAdjacentElement('afterend', nav);
    st = { el, nav, page: 1, sig: '', html: '' };
    nav._state = st;
    states.set(el, st);
    return st;
  }

  function refresh(st) {
    const items = rowsOf(st.el);
    const visible = items.filter((x) => !x.hidden);
    const sig = items.map((x, i) => (x.hidden ? '' : i)).join(',');
    if (sig !== st.sig) { st.sig = sig; st.page = 1; }
    const pages = Math.max(1, Math.ceil(visible.length / PER));
    if (st.page > pages) st.page = pages;
    visible.forEach((x, i) => x.classList.toggle('pg-off', Math.floor(i / PER) + 1 !== st.page));
    items.filter((x) => x.hidden).forEach((x) => x.classList.remove('pg-off'));
    const show = visible.length > PER;
    const from = (st.page - 1) * PER + 1, to = Math.min(visible.length, st.page * PER);
    const html = show
      ? `<button type="button" class="tvpg-btn tvpg-prev" data-pg="${st.page - 1}" ${st.page === 1 ? 'disabled' : ''} aria-label="Page précédente">‹</button>${pagesFor(st.page, pages)}<button type="button" class="tvpg-btn tvpg-next" data-pg="${st.page + 1}" ${st.page === pages ? 'disabled' : ''} aria-label="Page suivante">›</button><span class="tvpg-info">${from}–${to} sur ${visible.length}</span>`
      : '';
    if (html !== st.html) { st.html = html; st.nav.innerHTML = html; }
    st.nav.hidden = !show;
  }

  function scan() {
    document.querySelectorAll(SEL).forEach((el) => { refresh(attach(el)); });
    for (const [el, st] of states) if (!el.isConnected) { st.nav.remove(); states.delete(el); }
  }

  let queued = 0;
  const later = () => { if (queued) return; queued = requestAnimationFrame(() => { queued = 0; scan(); }); };

  // Une nouvelle page du back-office / de l'espace s'affiche, ou une liste est rechargée.
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  // Recherche, filtres, boutons de tri : on recalcule juste après.
  ['input', 'change', 'click'].forEach((t) => document.addEventListener(t, () => setTimeout(later, 0), true));

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.tvpg-btn');
    if (!b || b.disabled) return;
    const nav = b.closest('.tvpg'), st = nav?._state;
    if (!st) return;
    e.preventDefault();
    const before = nav.getBoundingClientRect().top;
    st.page = Number(b.dataset.pg);
    refresh(st);
    // La page reste à la même hauteur : on ne remonte pas en haut.
    const delta = nav.getBoundingClientRect().top - before;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
  });

  window.TVPager = { refresh: later };
  later();
})();
