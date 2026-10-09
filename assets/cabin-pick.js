/* Liste déroulante « Classe » (Économique, Économique premium, Affaires, Première) — mêmes classes que dans le back-office.
   <div data-cabin-pick> contient <input type="hidden" name="cabin">. La valeur « all » = toutes les classes. */
(() => {
  const OPTIONS = [['all', 'Toutes les classes'], ['Économique', 'Économique'], ['Économique premium', 'Économique premium'], ['Affaires', 'Affaires'], ['Première', 'Première']];
  const SEAT = '<svg class="tv-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5 9 12h6.5a2.5 2.5 0 0 1 2.4 1.8L19 17.5H8.2L6.5 6.5"/><path d="M7 20.5h12"/></svg>';
  const CHEV = '<svg class="tv-icon cabin-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const CHECK = '<svg class="tv-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const label = (v) => (OPTIONS.find(([k]) => k === v) || OPTIONS[0])[1];

  function build(box) {
    if (box.dataset.ready) return;
    box.dataset.ready = '1';
    const input = box.querySelector('input[name="cabin"]');
    input.value = input.value || 'all';
    box.insertAdjacentHTML('beforeend', `<button type="button" class="cabin-btn" aria-haspopup="listbox" aria-expanded="false">${SEAT}<b></b>${CHEV}</button>
      <ul class="cabin-list" role="listbox" hidden>${OPTIONS.map(([k, l]) => `<li role="option" data-v="${k}" tabindex="-1"><span>${l}</span>${CHECK}</li>`).join('')}</ul>`);
    const btn = box.querySelector('.cabin-btn'), list = box.querySelector('.cabin-list'), text = btn.querySelector('b');
    const paint = () => {
      text.textContent = input.value === 'all' ? 'Toutes' : label(input.value);
      list.querySelectorAll('li').forEach((li) => li.setAttribute('aria-selected', String(li.dataset.v === input.value)));
    };
    const close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); box.classList.remove('open'); };
    const open = () => { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); box.classList.add('open'); };
    btn.addEventListener('click', (e) => { e.preventDefault(); list.hidden ? open() : close(); });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-v]');
      if (!li) return;
      input.value = li.dataset.v;
      paint(); close();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) close(); });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
    // le formulaire peut être remis à zéro depuis l'extérieur
    box.addEventListener('cabin:set', (e) => { input.value = e.detail || 'all'; paint(); });
    paint();
  }
  const init = () => document.querySelectorAll('[data-cabin-pick]').forEach(build);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
