/* Mon espace TripVision : espace partenaire et espace client (même socle visuel que le back-office). */
const ICONS = {
  send: '<path d="M21.5 2.5 10.6 13.4"/><path d="M21.5 2.5 14.6 21.5l-4-8.1-8.1-4z"/>',
  paperclip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  fleet: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6v4h-2M3 13v4h2M3 13h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
  bookings: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  orders: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9zM10 20a2 2 0 0 0 4 0"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5A8 8 0 1 1 21 12z"/>',
  company: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M12 10h.01M15 10h.01"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>',
  empty: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4m0 10V11m9-4-9 4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.1 1.1 6.4 3.6-3.3 3.3-2.7-.5L3 14.8l3.2 1.4 1.4 3.2 1.1-1.1-.5-2.7 3.3-3.3 3.6 6.4z"/>',
  car: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6v4h-2M3 13v4h2M3 13h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  pack: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2M4 13h16"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const ERRORS = {
  SESSION_EXPIRED: 'Session expirée. Reconnectez-vous.',
  INVALID_IMAGE: 'Image invalide : utilisez un fichier JPG, PNG ou WebP de 5 Mo maximum.',
  VALIDATION_ERROR: 'Certains champs sont invalides.',
  WRONG_PASSWORD: 'Le mot de passe actuel est incorrect.',
  WEAK_PASSWORD: 'Mot de passe trop faible.',
  NOT_FOUND: 'Élément introuvable ou déjà supprimé.',
  NOT_CANCELLABLE: 'Cette demande ne peut plus être annulée.',
  HIDDEN_BY_TRIPVISION: 'Cette annonce a été suspendue par TripVision. Contactez-nous pour la republier.',
  NOT_PUBLISHED: 'Seule une annonce en ligne peut être masquée.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives. Réessayez dans quelques minutes.',
};
const KEY = { token: 'tripvisionToken', user: 'tripvisionUser' };
// La session vit uniquement dans cet onglet (sessionStorage) : fermer l'onglet la termine.
// Le site la transmet une seule fois à l'onglet qu'il vient d'ouvrir ; aucune session n'est conservée sur le site public.
try {
  const handoff = window.opener && window.opener.TV_HANDOFF;
  if (handoff && handoff.token) {
    sessionStorage.setItem(KEY.token, handoff.token);
    sessionStorage.setItem(KEY.user, JSON.stringify(handoff.user));
    window.opener.TV_HANDOFF = null;
  }
} catch { /* onglet d'origine inaccessible */ }
localStorage.removeItem(KEY.token);
localStorage.removeItem(KEY.user);
let token = sessionStorage.getItem(KEY.token) || '';
let user = null;
try { user = JSON.parse(sessionStorage.getItem(KEY.user) || 'null'); } catch { user = null; }
const DATA = { partner: null, vehicles: [], bookings: [], requests: [] };

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v) => v == null || v === '' ? '—' : Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const fmtDate = (v) => v ? new Date(v).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDay = (v) => v ? new Date(String(v).slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const fv = (x) => esc(x ?? '');
const options = (list, current) => list.map(x => `<option ${x === current ? 'selected' : ''}>${esc(x)}</option>`).join('');
const refOf = (id) => `TV-${String(id).slice(0, 8).toUpperCase()}`;

class ApiError extends Error {}

/* ---------- Retours visuels ---------- */
let inflight = 0;
const progress = (d) => { inflight = Math.max(0, inflight + d); $('#progress').classList.toggle('on', inflight > 0); };
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3800);
}
function setLoading(btn, text) {
  if (!btn) return () => {};
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('is-loading');
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${esc(text)}</span>`;
  return () => { btn.disabled = false; btn.classList.remove('is-loading'); btn.innerHTML = original; };
}

/* ---------- Session ---------- */
function loginUrl(role = user?.role) { return role === 'partner' ? '/#partner' : '/#login'; }
function signOut(message) {
  const target = loginUrl();
  sessionStorage.removeItem(KEY.token);
  sessionStorage.removeItem(KEY.user);
  if (message) { try { sessionStorage.setItem('tv_flash', message); } catch { /* indisponible */ } }
  location.replace(target);
}

async function api(path, options = {}) {
  progress(1);
  try {
    const res = await fetch('/api' + path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && data.error !== 'INVALID_CREDENTIALS') { signOut(); throw new ApiError(ERRORS.SESSION_EXPIRED); }
    if (data.error === 'PASSWORD_CHANGE_REQUIRED') { location.replace('/backoffice/'); throw new ApiError('Changement de mot de passe requis.'); }
    if (!res.ok) throw new ApiError(data.message || ERRORS[data.error] || `Erreur ${res.status}`);
    return data;
  } finally { progress(-1); }
}

/* ---------- Gabarits ---------- */
const pageHead = (eyebrow, title, subtitle = '', actions = '') => `
  <header class="page-head"><div>
    <span class="eyebrow">${esc(eyebrow)}</span><h2>${title}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  </div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
const emptyRow = (cols, message, hint = 'Les éléments apparaîtront ici.') => `<tr><td colspan="${cols}"><div class="empty">${icon('empty')}<strong>${esc(message)}</strong><span>${esc(hint)}</span></div></td></tr>`;
const field = (label, attrs, full = false) => `<label class="${full ? 'full' : ''}">${esc(label)}<input ${attrs}></label>`;
const toggle = (name, label, checked = false) => `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}</span></label>`;
const actionBtn = (action, id, label, cls = '') => `<button class="btn small ${cls}" type="button" data-action="${action}" data-id="${esc(id)}">${label}</button>`;
const fa = (attrs) => Object.entries(attrs).map(([k, v]) => ` data-f-${k}="${esc(v)}"`).join('');
const newTag = (on) => (on ? ' <span class="new-tag">Nouveau</span>' : '');
const badge = (tone, label) => `<span class="badge ${tone}">${esc(label)}</span>`;

function tableCard({ id, title, count, head, rows, empty, hint, cols, filters = [] }) {
  const selects = filters.map(f => `<select class="filter-select" data-col-filter="${id}" data-key="${f.key}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)} : tous</option>${f.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`).join('');
  return `
    <section class="card">
      <div class="card-head">
        <div><h3>${esc(title)}</h3><p>${esc(count)}</p></div>
        <div class="card-tools">${selects}
          <label class="search">${icon('search')}<input type="search" placeholder="Rechercher…" data-filter="${id}" aria-label="Rechercher"></label>
          <button class="btn small" type="button" data-action="reload" title="Actualiser les données">${icon('refresh')} Actualiser</button>
        </div>
      </div>
      <div class="table-wrap"><table id="${id}">
        <thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows || emptyRow(cols, empty, hint)}</tbody>
      </table></div>
      <div class="empty no-results" data-none="${id}" hidden>${icon('search')}<strong>Aucun résultat</strong><span>Modifiez la recherche ou les filtres.</span></div>
    </section>`;
}

function applyTableFilters(id) {
  const table = document.getElementById(id);
  if (!table) return;
  const q = ($(`[data-filter="${id}"]`)?.value || '').toLowerCase().trim();
  const selects = [...document.querySelectorAll(`[data-col-filter="${id}"]`)].filter(s => s.value);
  let shown = 0;
  table.querySelectorAll('tbody tr[data-f-search], tbody tr.clickable').forEach(tr => {
    const okText = !q || tr.textContent.toLowerCase().includes(q);
    const okSel = selects.every(s => (tr.dataset[`f${s.dataset.key[0].toUpperCase()}${s.dataset.key.slice(1)}`] || '') === s.value);
    tr.hidden = !(okText && okSel);
    if (!tr.hidden) shown++;
  });
  const none = $(`[data-none="${id}"]`);
  if (none) none.hidden = shown > 0 || !table.querySelector('tbody tr.clickable');
}
document.addEventListener('input', (e) => { const i = e.target.closest('[data-filter]'); if (i) applyTableFilters(i.dataset.filter); });
document.addEventListener('change', (e) => { const s = e.target.closest('[data-col-filter]'); if (s) applyTableFilters(s.dataset.colFilter); });

/* Astérisque rouge collé au nom des champs obligatoires */
function markRequired(root = document) {
  root.querySelectorAll('label').forEach(label => {
    if (label.dataset.req) return;
    const control = label.querySelector(':scope > input[required]:not([type=hidden]):not([type=radio]):not([type=checkbox]), :scope > select[required], :scope > textarea[required], :scope > .tvpw > input[required]');
    if (!control) return;
    label.dataset.req = '1';
    const star = document.createElement('span');
    star.className = 'req';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '*';
    const text = [...label.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (text) { const name = document.createElement('span'); name.className = 'lbl'; text.replaceWith(name); name.append(text, star); } else label.prepend(star);
  });
  root.querySelectorAll('.modal-body, form.card > .form-grid').forEach(box => {
    if (box.querySelector('.req') && !box.querySelector(':scope > .req-note')) box.insertAdjacentHTML('beforeend', '<p class="req-note"><span class="req">*</span> Champs obligatoires</p>');
  });
}

/* ---------- Fenêtres : formulaire → en cours → résultat ---------- */
let modalState = null;
function closeModalNow() { $('#modalRoot').innerHTML = ''; document.body.classList.remove('modal-open'); modalState = null; }

function openModal({ eyebrow = '', title, bodyHtml = '', confirmLabel = 'Confirmer', tone = 'primary', loadingText = 'Action en cours…', wide = false, run, noFooter = false, cancelLabel = 'Annuler' }) {
  const root = $('#modalRoot');
  root.innerHTML = `
    <div class="overlay modal-overlay"><form class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle" novalidate>
      <div class="modal-pane" data-pane="form">
        <header class="modal-head"><span class="eyebrow">${esc(eyebrow)}</span><h3 id="modalTitle">${esc(title)}</h3></header>
        <div class="modal-body">${bodyHtml}</div>
        <p class="form-error" role="alert" hidden></p>
        <footer class="modal-foot"><button class="btn" type="button" data-modal-cancel>${esc(cancelLabel)}</button>${noFooter ? '' : `<button class="btn ${tone}" type="submit">${esc(confirmLabel)}</button>`}</footer>
      </div>
      <div class="modal-pane center" data-pane="loading" hidden><span class="spinner big" aria-hidden="true"></span><strong>${esc(loadingText)}</strong><span class="muted">Merci de patienter, ne fermez pas cette fenêtre.</span></div>
      <div class="modal-pane center" data-pane="done" hidden></div>
    </form></div>`;
  document.body.classList.add('modal-open');
  TVPassword.enhance(root);
  markRequired(root);
  const form = root.querySelector('form');
  const pane = (name) => form.querySelector(`[data-pane="${name}"]`);
  const err = form.querySelector('.form-error');
  const showPane = (name) => form.querySelectorAll('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== name; });
  modalState = { busy: false, form };
  const close = () => { if (modalState?.busy) return; closeModalNow(); };
  form.querySelector('[data-modal-cancel]').addEventListener('click', close);
  root.querySelector('.modal-overlay').addEventListener('mousedown', (e) => { if (e.target.classList.contains('modal-overlay')) close(); });
  form.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  form.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea')?.focus({ preventScroll: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (modalState.busy || !run) return;
    if (form.querySelector('[data-gallery][data-busy]')) { toast('Patientez : les images sont en cours de téléversement.'); return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }
    err.hidden = true;
    modalState.busy = true;
    showPane('loading');
    try {
      const result = (await run(form)) || {};
      showPane('done');
      pane('done').innerHTML = `<span class="done-icon">${icon('check')}</span><strong>${esc(result.title || 'Terminé')}</strong>${result.text ? `<span class="muted">${esc(result.text)}</span>` : ''}<button class="btn primary" type="button" data-modal-close>Fermer</button>`;
      if (modalState) modalState.busy = false;
      render();
      pane('done').querySelector('[data-modal-close]').addEventListener('click', closeModalNow);
      pane('done').querySelector('[data-modal-close]').focus();
      setTimeout(() => { if (modalState?.form === form) closeModalNow(); }, 1500);
    } catch (error) {
      if (modalState) modalState.busy = false;
      if (!(error instanceof ApiError)) console.error(error);
      showPane('form');
      err.textContent = error.message;
      err.hidden = false;
    }
  });
}

const confirmCall = ({ eyebrow, title, message, confirmLabel, tone = 'primary', loading, success, method = 'POST', url, body }) =>
  openModal({ eyebrow, title, confirmLabel, tone, loadingText: loading, bodyHtml: `<p class="modal-text">${message}</p>`,
    run: async () => { await api(url, { method, ...(body ? { body: JSON.stringify(body) } : {}) }); return { title: success }; } });

/* ---------- Galerie d'images (sélection multiple ou glisser-déposer) ---------- */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const GALLERY_MAX = 10;
const galItems = (images, cover = true) => images.map((u, i) => `
  <figure class="gal-item" draggable="true" data-gal-index="${i}">
    <img src="${esc(u)}" alt="" loading="lazy" draggable="false">
    ${i === 0 && cover ? '<span class="gal-cover">Couverture</span>' : ''}
    <div class="gal-tools">
      <button type="button" data-gal-move="-1" aria-label="Avancer" ${i === 0 ? 'disabled' : ''}>‹</button>
      <button type="button" data-gal-move="1" aria-label="Reculer" ${i === images.length - 1 ? 'disabled' : ''}>›</button>
      <button type="button" data-gal-del aria-label="Retirer cette image">${icon('close')}</button>
    </div>
  </figure>`).join('');

function galleryField(label, images = [], { name = 'images', max = GALLERY_MAX, hint = 'la première sert de couverture · glissez pour réordonner', cover = true } = {}) {
  const list = (images || []).filter(Boolean);
  return `
    <div class="full dz-field" data-gallery data-max="${max}" data-cover="${cover ? 1 : 0}">
      <span class="dz-label">${esc(label)} <em>jusqu’à ${max} photos · ${esc(hint)}</em></span>
      <input type="hidden" name="${esc(name)}" value="${esc(JSON.stringify(list))}">
      <div class="gal-grid" data-gal-grid ${list.length ? '' : 'hidden'}>${galItems(list, cover)}</div>
      <div class="dropzone gal-drop" data-gal-drop tabindex="0" role="button" aria-label="Ajouter des images">
        <input type="file" accept="${IMAGE_TYPES.join(',')}" multiple hidden data-gal-file>
        <div class="dz-state" data-state="empty">${icon('upload')}<strong>Glissez vos images ici</strong><span>ou <u>cliquez pour parcourir</u> · JPG, PNG ou WebP · 5 Mo max chacune</span></div>
        <div class="dz-state" data-state="loading" hidden><span class="spinner big" aria-hidden="true"></span><strong data-gal-msg>Téléversement…</strong></div>
      </div>
    </div>`;
}

const galInput = (g) => g.querySelector('input[type=hidden]');
const galImages = (g) => { try { return JSON.parse(galInput(g).value || '[]'); } catch { return []; } };
function galSet(g, images) {
  galInput(g).value = JSON.stringify(images);
  const grid = g.querySelector('[data-gal-grid]');
  grid.innerHTML = galItems(images, g.dataset.cover !== '0');
  grid.hidden = !images.length;
}
const setZone = (zone, state) => zone.querySelectorAll('[data-state]').forEach(el => { el.hidden = el.dataset.state !== state; });

async function uploadFile(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new ApiError(`« ${file.name} » : format non pris en charge (JPG, PNG ou WebP).`);
  if (file.size > MAX_IMAGE_BYTES) throw new ApiError(`« ${file.name} » : image trop lourde (5 Mo maximum).`);
  const res = await fetch('/api/partner/uploads', { method: 'POST', headers: { 'Content-Type': file.type, Authorization: `Bearer ${token}` }, body: file });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { signOut(); throw new ApiError('Session expirée.'); }
  if (!res.ok) throw new ApiError(ERRORS[data.error] || `Erreur ${res.status}`);
  return data.url;
}

async function galUpload(g, files) {
  if (g.dataset.busy) return;
  const maxPhotos = Number(g.dataset.max || GALLERY_MAX);
  const room = maxPhotos - galImages(g).length;
  if (room <= 0) return toast(`Maximum ${maxPhotos} photos.`);
  const queue = [...files].filter(f => f.type.startsWith('image/'));
  if (!queue.length) return toast('Format non pris en charge : utilisez JPG, PNG ou WebP.');
  if (queue.length > room) toast(`Seules ${room} photo(s) supplémentaire(s) sont acceptées.`);
  const zone = g.querySelector('[data-gal-drop]');
  g.dataset.busy = '1';
  setZone(zone, 'loading');
  progress(1);
  const todo = queue.slice(0, room);
  try {
    for (let i = 0; i < todo.length; i++) {
      zone.querySelector('[data-gal-msg]').textContent = `Téléversement ${i + 1}/${todo.length}…`;
      try { galSet(g, [...galImages(g), await uploadFile(todo[i])]); } catch (err) { toast(err.message || 'Téléversement impossible.'); }
    }
  } finally { delete g.dataset.busy; setZone(zone, 'empty'); progress(-1); }
}

let galDrag = null;
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-gallery]');
  if (!g) return;
  const item = e.target.closest('[data-gal-index]');
  if (item && e.target.closest('[data-gal-del]')) { const imgs = galImages(g); imgs.splice(Number(item.dataset.galIndex), 1); galSet(g, imgs); return; }
  const mv = e.target.closest('[data-gal-move]');
  if (item && mv) {
    const imgs = galImages(g), i = Number(item.dataset.galIndex), j = i + Number(mv.dataset.galMove);
    if (j >= 0 && j < imgs.length) { [imgs[i], imgs[j]] = [imgs[j], imgs[i]]; galSet(g, imgs); }
    return;
  }
  if (e.target.closest('[data-gal-drop]') && !e.target.matches('[data-gal-file]')) g.querySelector('[data-gal-file]').click();
});
document.addEventListener('keydown', (e) => {
  const zone = e.target.closest?.('[data-gal-drop]');
  if (zone && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); zone.querySelector('[data-gal-file]').click(); }
});
document.addEventListener('change', (e) => {
  if (!e.target.matches('[data-gal-file]')) return;
  const files = [...e.target.files];
  e.target.value = '';
  galUpload(e.target.closest('[data-gallery]'), files);
});
document.addEventListener('dragstart', (e) => {
  const item = e.target.closest?.('[data-gal-index]');
  if (item) { galDrag = Number(item.dataset.galIndex); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'gal'); }
});
document.addEventListener('dragend', () => { galDrag = null; document.querySelectorAll('.gal-over').forEach(x => x.classList.remove('gal-over')); });
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.querySelectorAll('.gal-over, [data-gal-drop].drag').forEach(x => { if (!x.contains(e.target)) x.classList.remove('gal-over', 'drag'); });
  if (galDrag !== null) e.target.closest?.('[data-gal-index]')?.classList.add('gal-over');
  else e.target.closest?.('[data-gal-drop]')?.classList.add('drag');
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
  document.querySelectorAll('.gal-over, [data-gal-drop].drag').forEach(x => x.classList.remove('gal-over', 'drag'));
  const g = e.target.closest?.('[data-gallery]');
  if (!g) return;
  if (galDrag !== null) {
    const target = e.target.closest('[data-gal-index]');
    if (target) {
      const imgs = galImages(g), to = Number(target.dataset.galIndex);
      if (to !== galDrag) { const [m] = imgs.splice(galDrag, 1); imgs.splice(to, 0, m); galSet(g, imgs); }
    }
    galDrag = null;
  } else if (e.dataTransfer.files.length && e.target.closest('[data-gal-drop]')) galUpload(g, e.dataTransfer.files);
});

/* ---------- Données ---------- */
async function loadPartner() {
  const d = await api('/partner/dashboard');
  DATA.partner = d.partner;
  if (user?.role === 'partner' && d.partner?.tradeName && user.name !== d.partner.tradeName) { user = { ...user, name: d.partner.tradeName }; try { sessionStorage.setItem(KEY.user, JSON.stringify(user)); } catch { /* indisponible */ } if (typeof renderNav === 'function' && $('#whoName')) renderNav(); }
  DATA.vehicles = d.vehicles || [];
  DATA.bookings = d.bookings || [];
}
async function loadClient() {
  const d = await api('/client/dashboard');
  DATA.bookings = d.bookings || [];
  DATA.requests = d.requests || [];
}

/* ---------- Statuts ---------- */
const isScheduled = (v) => v.status === 'approved' && v.publish_at && new Date(v.publish_at) > new Date();
function vehicleState(v) {
  if (v.rentedUntil) return ['warn', `Loué jusqu’au ${fmtDate(v.rentedUntil)}`, 'rented'];
  if (v.afterRental && v.status === 'inactive') return ['plain', 'Brouillon — location terminée', 'draft'];
  if (v.status === 'approved') return isScheduled(v) ? ['warn', `Programmée · ${fmtDate(v.publish_at)}`, 'scheduled'] : ['ok', 'En ligne', 'online'];
  if (v.status === 'pending') return ['warn', 'En attente de validation', 'pending'];
  return v.hiddenByPartner ? ['plain', 'Masquée par vous', 'hidden'] : ['bad', 'Suspendue par TripVision', 'suspended'];
}
const bookingState = (s) => s === 'confirmed' ? ['ok', 'Confirmée'] : s === 'inactive' || s === 'cancelled' ? ['bad', 'Annulée'] : s === 'completed' ? ['ok', 'Terminée'] : ['warn', 'À traiter'];
const clientState = (s) => s === 'confirmed' ? ['ok', 'Confirmée'] : s === 'inactive' || s === 'cancelled' ? ['bad', 'Annulée'] : s === 'completed' ? ['ok', 'Terminée'] : ['warn', 'En attente de confirmation'];

/* ---------- Navigation ---------- */
const SECTIONS = {
  partner: [
    { id: 'overview', label: 'Tableau de bord', icon: 'overview' },
    { id: 'fleet', label: 'Ma flotte', icon: 'fleet' },
    { id: 'bookings', label: 'Réservations', icon: 'bookings' },
    { id: 'chat', label: 'Messagerie', icon: 'chat' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'company', label: 'Mon entreprise', icon: 'company' },
    { id: 'account', label: 'Mon compte', icon: 'account' },
  ],
  client: [
    { id: 'overview', label: 'Vue d’ensemble', short: 'Accueil', icon: 'overview' },
    { id: 'orders', label: 'Mes réservations', short: 'Réservations', icon: 'orders' },
    { id: 'alerts', label: 'Mes alertes', short: 'Alertes', icon: 'bell' },
    { id: 'chat', label: 'Messagerie', short: 'Messages', icon: 'chat' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', nav: false },
    { id: 'account', label: 'Mon compte', short: 'Compte', icon: 'account', nav: false, mobile: true },
    { id: 'help', label: 'Aide & contact', icon: 'help', nav: false },
  ],
};
const sections = () => SECTIONS[user.role];
const currentSection = () => { const id = location.hash.replace('#', ''); return sections().some(s => s.id === id) ? id : 'overview'; };

/* Pastilles : nouveautés non consultées. Elles baissent quand on ouvre la conversation ou le détail d'une réservation. */
let BADGES = { chat: 0, bookings: 0, notifications: 0 };
const NAV_BADGE = { bookings: 'bookings', orders: 'bookings', chat: 'chat', notifications: 'notifications' };
function paintBadges() {
  document.querySelectorAll('#nav a[data-badge], #bellLink[data-badge]').forEach(a => {
    const n = BADGES[a.dataset.badge] || 0;
    let el = a.querySelector('.nav-count');
    if (!n) { el?.remove(); return; }
    if (!el) { el = document.createElement('em'); el.className = 'nav-count'; a.appendChild(el); }
    el.textContent = n > 99 ? '99+' : n;
  });
  document.title = `${(BADGES.chat + BADGES.bookings + BADGES.notifications) ? `(${BADGES.chat + BADGES.bookings + BADGES.notifications}) ` : ''}${user?.role === 'partner' ? 'Espace partenaire' : 'Mon espace'} — TripVision`;
}
async function refreshBadges() {
  if (!token) return;
  try {
    const res = await fetch('/api/me/badges', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { BADGES = await res.json(); paintBadges(); }
  } catch { /* hors ligne */ }
}
const markSeen = async (path) => { try { await fetch(`/api${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignoré */ } refreshBadges(); };
setInterval(() => { if (!document.hidden && user) refreshBadges(); }, 25000);

function renderNav() {
  const current = currentSection();
  $('#nav').innerHTML = sections().filter(s => s.nav !== false || s.mobile).map(s => `<a href="#${s.id}" title="${esc(s.label)}" ${NAV_BADGE[s.id] ? `data-badge="${NAV_BADGE[s.id]}"` : ''} class="${s.id === current ? 'active' : ''}${s.nav === false ? ' m-only' : ''}" ${s.id === current ? 'aria-current="page"' : ''}>${icon(s.icon)}<span${s.short ? ` data-short="${esc(s.short)}"` : ''}>${esc(s.label)}</span>${BADGES[NAV_BADGE[s.id]] ? `<em class="nav-count">${BADGES[NAV_BADGE[s.id]] > 99 ? '99+' : BADGES[NAV_BADGE[s.id]]}</em>` : ''}</a>`).join('');
  const client = user.role === 'client';
  const bell = $('#bellLink');
  if (bell) { bell.hidden = !client; bell.innerHTML = icon('bell'); bell.classList.toggle('active', currentSection() === 'notifications'); }
  const menu = $('#userMenu');
  if (menu) {
    menu.hidden = true;
    menu.innerHTML = client ? `<div class="um-head"><strong>${esc(user.name || '')}</strong><span>${esc(user.email || '')}</span></div>
      <a href="#account">${icon('account')}Mon compte</a><a href="#help">${icon('help')}Aide & contact</a><a href="/" target="_blank" rel="noopener">${icon('overview')}Retour au site</a>
      <button type="button" data-um-logout>${icon('logout')}Se déconnecter</button>` : '';
  }
  $('.me')?.classList.toggle('has-menu', client);
  $('#whoName').textContent = user.name || user.email;
  $('#whoAvatar').textContent = initials(user.name || user.email);
  $('#whoRole').textContent = user.role === 'partner' ? 'Partenaire' : 'Client';
  $('#brandSub').textContent = user.role === 'partner' ? 'Espace partenaire' : 'Mon espace';
}

/* ---------- Pages partenaire ---------- */
function partnerBanner() {
  const p = DATA.partner;
  if (!p) return `<section class="banner warn">${icon('alert')}<div><strong>Complétez votre dossier entreprise</strong><span>Renseignez les informations de votre société pour pouvoir publier des véhicules.</span></div><a class="btn small" href="#company">Compléter</a></section>`;
  if (p.status === 'pending') return `<section class="banner warn">${icon('clock')}<div><strong>Compte en cours de validation</strong><span>Vos annonces seront visibles sur le site dès que TripVision aura validé votre société. Vous pouvez déjà préparer votre flotte.</span></div></section>`;
  if (p.status === 'inactive') return `<section class="banner bad">${icon('alert')}<div><strong>Compte suspendu</strong><span>Vos annonces ne sont plus visibles. Écrivez-nous depuis la messagerie pour en savoir plus.</span></div><a class="btn small" href="#chat">Nous écrire</a></section>`;
  return '';
}

const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  if (m < 1440) return `il y a ${Math.round(m / 60)} h`;
  if (m < 10080) return `il y a ${Math.round(m / 1440)} j`;
  return fmtDay(iso);
};
const NOTIF_ICON = { booking: 'bookings', request: 'orders', chat: 'chat', vehicle: 'fleet', alert: 'bell' };
async function notificationsPage() {
  const list = await api('/notifications');
  DATA.notifications = list;
  const unread = list.filter(n => !n.read_at).length;
  return pageHead('Activité', '<em>Notifications</em>', 'Les nouveautés de votre espace : réservations, réponses de TripVision, mises à jour. Ouvrez-en une pour la marquer comme lue.',
    `<button class="btn small" type="button" data-action="notif-read-all" ${unread ? '' : 'disabled'}>Tout marquer comme lu</button><button class="btn small" type="button" data-action="reload">${icon('refresh')} Actualiser</button>`)
    + `<section class="card">
      <div class="card-head"><div><h3>Fil d’activité</h3><p>${unread ? plural(unread, 'non lue', 'non lues') : 'Tout est lu'} · ${plural(list.length, 'notification', 'notifications')}</p></div>
        <div class="card-tools"><div class="pillbar"><button type="button" class="pill active" data-notif-state="all">Toutes</button><button type="button" class="pill" data-notif-state="unread">Non lues</button></div></div></div>
      <div class="notif-list" id="notifList">${list.map(n => `<button type="button" class="notif ${n.read_at ? '' : 'unread'}" data-action="notif-open" data-id="${esc(n.id)}" data-kind="${esc(n.kind)}">
        <span class="notif-icon">${icon(NOTIF_ICON[n.kind] || 'bell')}</span><span class="notif-main"><strong>${esc(n.title)}</strong>${n.body ? `<span class="muted">${esc(n.body)}</span>` : ''}</span><span class="notif-time">${ago(n.created_at)}</span></button>`).join('')}</div>
      <div class="empty no-results" id="notifNone" ${list.length ? 'hidden' : ''}>${icon('bell')}<strong>Aucune notification</strong><span>Les nouveautés apparaîtront ici.</span></div></section>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-notif-state]');
  if (!b) return;
  document.querySelectorAll('[data-notif-state]').forEach(x => x.classList.toggle('active', x === b));
  const unreadOnly = b.dataset.notifState === 'unread';
  let shown = 0;
  document.querySelectorAll('#notifList .notif').forEach(el => { el.hidden = unreadOnly && !el.classList.contains('unread'); if (!el.hidden) shown++; });
  const none = document.getElementById('notifNone');
  if (none) none.hidden = shown > 0;
});

/* ---------- Messagerie : plusieurs conversations, ouvertes ou clôturées ---------- */
const CH = { id: null, view: 'list', files: [] };
let chatSig = '';
const TOPICS = () => (user.role === 'partner'
  ? ['Une réservation', 'Mon annonce ou mes véhicules', 'Paiement', 'Mon compte', 'Autre question']
  : ['Ma réservation', 'Paiement ou remboursement', 'Un vol ou un pack', 'Mon compte', 'Autre question']);
const shortDate = (d) => { const x = new Date(d), t = new Date(); return x.toDateString() === t.toDateString() ? x.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
const chatState = (t) => t.status === 'closed' ? '<span class="badge plain">Clôturée</span>' : t.status === 'pending' ? '<span class="badge ok">Réponse reçue</span>' : '<span class="badge warn">En cours de traitement</span>';
const attHtml = (list) => (list || []).map(a => /^image\//.test(a.mime)
  ? `<a class="att img" href="${esc(a.url)}" target="_blank" rel="noopener" data-lightbox="${esc(a.url)}" data-name="${esc(a.name)}"><img src="${esc(a.url)}" alt="${esc(a.name)}"></a>`
  : `<a class="att file" href="${esc(a.url)}" target="_blank" rel="noopener">${icon('doc')}<span><b>${esc(a.name)}</b><small>PDF${a.size ? ` · ${Math.max(1, Math.round(a.size / 1024))} Ko` : ''}</small></span></a>`).join('');
// Pièces jointes acceptées : JPG/JPEG, PNG et PDF (le type est déduit de l'extension si le navigateur ne le donne pas).
const CHAT_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
const chatMime = (file) => file.type && file.type !== 'image/pjpeg' ? file.type : ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' }[String(file.name).split('.').pop().toLowerCase()] || '');
const chatChips = () => CH.files.map((f, i) => `<span class="chip-file">${esc(f.name)}<button type="button" data-chat-unfile="${i}" aria-label="Retirer">×</button></span>`).join('');
async function uploadChatFile(file) {
  if (file.size > 8 * 1024 * 1024) throw new ApiError('Fichier trop lourd (8 Mo maximum).');
  const type = chatMime(file);
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(type)) throw new ApiError(`« ${file.name} » : formats acceptés JPG, JPEG, PNG ou PDF.`);
  const res = await fetch('/api/chat/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': type, 'X-File-Name': encodeURIComponent(file.name) }, body: file });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Fichier refusé : JPG, JPEG, PNG ou PDF (8 Mo maximum).');
  return data;
}
async function chatPage() {
  const threads = await api('/chat/threads');
  if (!CH.id || !threads.some(t => t.id === CH.id)) { CH.id = threads[0]?.id || null; CH.files = []; }
  const d = CH.id ? await api(`/chat/threads/${CH.id}`) : null;
  chatCount = d ? d.messages.length : 0;
  chatSig = threads.map(t => `${t.id}${t.updated_at}${t.status}`).join('|');
  refreshBadges();
  const closed = d?.thread.status === 'closed';
  const hm = (v) => new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dayOf = (v) => { const x = new Date(v), t = new Date(); const diff = Math.round((new Date(t.toDateString()) - new Date(x.toDateString())) / 864e5); return diff === 0 ? 'Aujourd’hui' : diff === 1 ? 'Hier' : x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', ...(x.getFullYear() !== t.getFullYear() ? { year: 'numeric' } : {}) }); };
  const bubbles = (list) => { let day = '', prev = ''; return list.map((m) => {
    const dk = new Date(m.created_at).toDateString(), sep = dk !== day ? `<div class="chat-day"><span>${esc(dayOf(m.created_at))}</span></div>` : '';
    if (dk !== day) prev = '';
    day = dk;
    if (m.sender === 'system') { prev = ''; return `${sep}<div class="msg sys"><div class="bubble system">${esc(m.body)}<small>${hm(m.created_at)}</small></div></div>`; }
    const me = m.sender === 'partner', who = me ? 'me' : 'them', cont = prev === who;
    prev = who;
    return `${sep}<div class="msg ${who} ${cont ? 'cont' : ''}">${me ? '' : `<span class="msg-av" aria-hidden="true">${cont ? '' : icon('plane')}</span>`}<div class="bubble ${me ? 'admin' : 'partner'}">${!me && !cont ? `<b class="msg-who">TripVision${m.author ? ` · ${esc(String(m.author).split(' ')[0])}` : ''}</b>` : ''}${m.body ? `<span class="msg-txt">${esc(m.body)}</span>` : ''}${m.attachments?.length ? `<div class="atts">${attHtml(m.attachments)}</div>` : ''}<small>${hm(m.created_at)}${me ? ' · Vous' : ''}</small></div></div>`;
  }).join(''); };
  const list = threads.map(t => `<button type="button" class="thread ${t.id === CH.id ? 'on' : ''} ${t.status === 'closed' ? 'is-closed' : ''} ${t.unread ? 'unread' : ''}" data-action="chat-open" data-id="${esc(t.id)}">
      <span class="thread-av" aria-hidden="true">${icon(t.status === 'closed' ? 'check' : 'chat')}</span>
      <span class="thread-top"><strong>${esc(t.subject)}</strong><time>${shortDate(t.updated_at)}</time></span>
      <span class="thread-sub">${esc(String(t.last_message || '').slice(0, 70))}</span>
      <span class="thread-tags">${chatState(t)}${t.unread ? `<em class="dot">${t.unread}</em>` : ''}</span></button>`).join('');
  const rate = d && closed ? (d.thread.rating
    ? `<div class="chat-rated"><span class="stars on">${'★'.repeat(d.thread.rating)}${'☆'.repeat(5 - d.thread.rating)}</span><span>Merci pour votre avis !</span></div>`
    : `<form class="chat-rate" id="rateForm" data-thread="${esc(d.thread.id)}"><strong>Votre avis sur cette conversation</strong><div class="stars" role="radiogroup" aria-label="Note de 1 à 5">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="rating" value="${n}" required><span aria-hidden="true">★</span><i class="sr">${n} sur 5</i></label>`).join('')}</div><input name="comment" maxlength="500" placeholder="Un commentaire ? (facultatif)"><button class="btn small primary" type="submit">Envoyer mon avis</button></form>`) : '';
  const pane = d ? `
      <header class="chat-head"><button class="icon-btn chat-back" type="button" data-action="chat-back" aria-label="Retour aux conversations">${icon('back')}</button><span class="chat-av" aria-hidden="true">${icon('plane')}</span><div class="chat-title"><strong>${esc(d.thread.subject)}</strong><span class="muted">${closed ? `Clôturée${d.thread.auto_closed ? ' automatiquement (sans réponse)' : ''}${d.thread.closed_at ? ` le ${fmtDay(d.thread.closed_at)}` : ''}` : d.thread.status === 'pending' ? 'L’équipe a répondu : à vous de jouer' : `Ouverte le ${fmtDay(d.thread.created_at)} · nous vous répondons au plus vite`}</span></div></header>
      <div class="chat-body chat-scroll" id="chatBody">${bubbles(d.messages)}</div>
      ${closed
        ? `${rate}<div class="chat-closed-note"><span>Cette conversation est clôturée. Pour une nouvelle question, démarrez une autre conversation.</span><button class="btn primary small" type="button" data-action="chat-new">Nouvelle conversation</button></div>`
        : `<form id="chatForm" class="chat-form chat-composer" data-thread="${esc(d.thread.id)}"><div class="chat-files" id="chatFiles">${chatChips()}</div><div class="cmp"><label class="cmp-att" title="Joindre une image (JPG, PNG) ou un PDF" aria-label="Joindre un fichier">${icon('paperclip')}<input type="file" id="chatFile" accept="${CHAT_ACCEPT}" multiple hidden></label><textarea name="message" rows="1" maxlength="2000" placeholder="Écrivez votre message…" aria-label="Votre message"></textarea><button class="btn primary cmp-send" type="submit" aria-label="Envoyer">${icon('send')}<span>Envoyer</span></button></div><p class="cmp-hint">Entrée pour envoyer · Maj + Entrée pour aller à la ligne · JPG, PNG ou PDF (8 Mo max.)</p></form>`}`
    : `<div class="empty">${icon('chat')}<strong>Aucune conversation</strong><span>Posez votre question à l’équipe TripVision : nous répondons dès que possible.</span><button class="btn primary" type="button" data-action="chat-new">Nouvelle conversation</button></div>`;
  return pageHead('Assistance', '<em>Messagerie</em>', 'Une conversation par sujet : suivez-les toutes ici. Vous recevez un e-mail à chaque réponse, et vous pouvez joindre des images (JPG, PNG) ou des PDF.', `<button class="btn primary small" type="button" data-action="chat-new">${icon('plus')} Nouvelle conversation</button>`) + `
    <section class="card chat-card chat-layout" data-view="${CH.view}">
      <aside class="chat-list"><div class="chat-list-head"><b>Conversations</b><span>${threads.length}</span></div>${list || '<p class="muted pad">Aucune conversation pour le moment.</p>'}</aside>
      <div class="chat-pane">${pane}</div>
    </section>`;
}
document.addEventListener('keydown', (e) => {
  const ta = e.target.closest?.('#chatForm textarea');
  if (!ta || e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (ta.value.trim() || CH.files.length) ta.form.requestSubmit();
});
document.addEventListener('input', (e) => {
  const ta = e.target.closest?.('#chatForm textarea');
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'chatFile') return;
  const list = [...e.target.files];
  e.target.value = '';
  for (const f of list) {
    if (CH.files.length >= 3) { toast('3 fichiers au maximum par message.'); break; }
    try { toast(`Téléversement de ${f.name}…`); CH.files.push(await uploadChatFile(f)); const box = document.getElementById('chatFiles'); if (box) box.innerHTML = chatChips(); } catch (err) { toast(err.message); }
  }
});
document.addEventListener('click', (e) => {
  const u = e.target.closest('[data-chat-unfile]');
  if (u) { CH.files.splice(Number(u.dataset.chatUnfile), 1); const box = document.getElementById('chatFiles'); if (box) box.innerHTML = chatChips(); }
});
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'rateForm') return;
  e.preventDefault();
  const f = e.target, btn = f.querySelector('button[type=submit]');
  const done = setLoading(btn, 'Envoi…');
  try { await api(`/chat/threads/${f.dataset.thread}/rating`, { method: 'POST', body: JSON.stringify({ rating: Number(f.elements.rating.value), comment: f.elements.comment.value.trim() || undefined }) }); toast('Merci pour votre avis !'); await render(false); }
  catch (err) { if (!(err instanceof ApiError)) console.error(err); toast(err.message); done(); }
});

const PARTNER_PAGES = {
  async overview() {
    await loadPartner();
    const v = DATA.vehicles, b = DATA.bookings;
    const pendingB = b.filter(x => x.status === 'pending'), pendingV = v.filter(x => x.status === 'pending');
    const online = v.filter(x => vehicleState(x)[2] === 'online').length;
    const first = String(user.name || '').split(' ')[0] || (DATA.partner?.managerName || '').split(' ')[0] || 'vous';
    const todo = [[pendingB.length, 'demande(s) de réservation à traiter', 'bookings'], [pendingV.length, 'véhicule(s) en attente de validation par TripVision', 'fleet'], ...(v.length ? [] : [[1, 'ajoutez votre premier véhicule pour apparaître sur le site', 'fleet']])].filter(([n]) => n);
    const recent = b.slice(0, 5);
    return partnerBanner() + `
      <section class="hero">
        <div><span class="eyebrow">${esc(DATA.partner?.tradeName || 'Espace partenaire')}</span><h3>Bonjour ${esc(first)}, <em>voici votre activité.</em></h3>
          <p>${pendingB.length ? 'Des clients attendent votre réponse.' : 'Aucune demande en attente. Tout est à jour.'}</p></div>
        <div class="hero-count"><strong>${pendingB.length}</strong><span>${pendingB.length > 1 ? 'Demandes à traiter' : 'Demande à traiter'}</span></div>
      </section>
      <div class="kpis">
        <div class="kpi"><div class="kpi-icon">${icon('fleet')}</div><div><strong>${v.length}</strong><span>Véhicules</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('check')}</div><div><strong>${online}</strong><span>En ligne</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('bookings')}</div><div><strong>${b.length}</strong><span>Réservations</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('alert')}</div><div><strong>${pendingB.length}</strong><span>À traiter</span></div></div>
      </div>
      <section class="card">
        <div class="card-head"><div><h3>À faire</h3><p>Ce qui demande votre attention</p></div><button class="btn small" type="button" data-action="reload">${icon('refresh')} Actualiser</button></div>
        <div class="todo">${todo.length ? todo.map(([n, label, to]) => `<a href="#${to}"><b>${n}</b><span>${label}</span><i>→</i></a>`).join('') : `<p class="muted pad">Rien à signaler.</p>`}</div>
      </section>
      <section class="card">
        <div class="card-head"><div><h3>Dernières réservations</h3><p>${plural(recent.length, 'demande récente', 'demandes récentes')}</p></div><a class="btn small" href="#bookings">Tout voir</a></div>
        <div class="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Véhicule</th><th>Dates</th><th>Statut</th></tr></thead>
        <tbody>${recent.map(x => `<tr class="clickable" data-action="booking-open" data-id="${esc(x.id)}"><td><strong>${esc(x.reference)}</strong>${newTag(x.unseen_partner)}</td><td>${esc(x.customer_name)}</td><td>${esc(x.vehicle_name)}</td><td>${fmtDay(x.start_date)} → ${fmtDay(x.end_date)}</td><td>${badge(...bookingState(x.status))}</td></tr>`).join('') || emptyRow(5, 'Aucune réservation', 'Les demandes de vos clients apparaîtront ici.')}</tbody></table></div>
      </section>`;
  },

  async fleet() {
    await loadPartner();
    const rows = DATA.vehicles.map(v => {
      const [tone, label, key] = vehicleState(v);
      return `<tr class="clickable"${fa({ status: key, category: v.category })} data-action="vehicle-edit" data-id="${esc(v.id)}">
        <td><span class="thumb-cell"><img class="thumb" src="${esc(v.image)}" alt=""><span><strong>${esc(v.model)}</strong><small class="muted">${esc(v.city || v.pickupAddress)}</small></span></span></td>
        <td>${esc(v.category)}</td><td class="num">${money(v.priceDay)}</td><td>${badge(tone, label)}</td>
        <td class="actions"><span class="row-actions">${vehicleActions(v)}</span></td></tr>`;
    }).join('');
    return pageHead('Ma flotte', 'Mes <em>véhicules</em>', 'Ajoutez, modifiez ou masquez vos annonces. Les nouvelles annonces sont validées par TripVision avant publication.', '<button class="btn primary" type="button" data-action="vehicle-new">+ Ajouter un véhicule</button>')
      + partnerBanner()
      + tableCard({ id: 'tblFleet', title: 'Catalogue', count: plural(DATA.vehicles.length, 'véhicule', 'véhicules'), head: ['Véhicule', 'Catégorie', 'Prix / jour', 'Statut', ''], rows, empty: 'Aucun véhicule', hint: 'Cliquez sur « Ajouter un véhicule » pour créer votre première annonce.', cols: 5,
        filters: [{ key: 'status', label: 'Statut', options: [['online', 'En ligne'], ['rented', 'Louées'], ['draft', 'Brouillons'], ['pending', 'En attente'], ['hidden', 'Masquées'], ['suspended', 'Suspendues']] }, { key: 'category', label: 'Catégorie', options: [...new Set(DATA.vehicles.map(v => v.category))].sort().map(c => [c, c]) }] });
  },

  async bookings() {
    await loadPartner();
    const rows = DATA.bookings.map(b => `<tr class="clickable"${fa({ status: b.status })} data-action="booking-open" data-id="${esc(b.id)}">
      <td><strong>${esc(b.reference)}</strong>${b.payment_status === 'paid' ? ' <span class="badge ok">Payé</span>' : ''}${newTag(b.unseen_partner)}</td><td>${esc(b.customer_name)}<small class="muted block">${esc(b.customer_email)}</small></td><td>${esc(b.vehicle_name)}</td>
      <td>${fmtDay(b.start_date)} ${esc(b.start_time || '')}<small class="muted block">→ ${fmtDay(b.end_date)} ${esc(b.end_time || '')}</small></td><td>${badge(...bookingState(b.status))}</td>
      <td class="actions"><span class="row-actions">${bookingActions(b)}</span></td></tr>`).join('');
    return pageHead('Activité', '<em>Réservations</em>', 'Confirmez ou refusez les demandes reçues pour vos véhicules.')
      + tableCard({ id: 'tblBookings', title: 'Demandes reçues', count: plural(DATA.bookings.length, 'demande', 'demandes'), head: ['Référence', 'Client', 'Véhicule', 'Dates', 'Statut', ''], rows, empty: 'Aucune réservation', hint: 'Les demandes de vos clients apparaîtront ici.', cols: 6,
        filters: [{ key: 'status', label: 'Statut', options: [['pending', 'À traiter'], ['confirmed', 'Confirmées'], ['inactive', 'Annulées']] }] });
  },

  chat: chatPage,
  notifications: notificationsPage,

  async company() {
    await loadPartner();
    const p = DATA.partner || {};
    return pageHead('Mon entreprise', 'Informations de la <em>société</em>', 'Ces informations servent à valider votre dossier et à vous contacter.') + partnerBanner() + `
      <form id="companyForm" class="card">
        <div class="card-head"><div><h3>Société</h3><p>${DATA.partner ? 'Mettez à jour vos informations à tout moment.' : 'Complétez ce formulaire pour créer votre dossier.'}</p></div></div>
        <div class="form-grid">
          ${field('Raison sociale', `name="legalName" required minlength="2" value="${fv(p.legalName)}"`)}
          ${field('Nom commercial', `name="tradeName" required minlength="2" value="${fv(p.tradeName)}"`)}
          ${field('Adresse du siège', `name="headOffice" required minlength="2" value="${fv(p.headOffice)}"`, true)}
          ${field('Agence(s)', `name="agencies" required minlength="2" placeholder="Adresse de la ou des agences" value="${fv(p.agencies)}"`, true)}
          ${field('Ville', `name="city" data-geo="city" placeholder="Rechercher une ville…" value="${fv(p.city)}"`)}
          ${field('Numéro de SIRET', `name="siret" required minlength="2" value="${fv(p.siret)}"`)}
          ${field('E-mail des réservations', `name="bookingEmail" type="email" required value="${fv(p.bookingEmail)}"`)}
          ${field('E-mail de contact', `name="contactEmail" type="email" required value="${fv(p.contactEmail)}"`)}
          ${field('Responsable', `name="managerName" required minlength="2" value="${fv(p.managerName)}"`)}
          ${field('Téléphone', `name="phone" type="tel" value="${fv(p.phone)}"`)}
          ${field('Référence Kbis', `name="kbisName" value="${fv(p.kbisName)}"`)}
          <div class="form-actions"><button class="btn primary" type="submit">Enregistrer les modifications</button></div>
        </div>
      </form>`;
  },

  account: accountPage,
};

function vehicleActions(v) {
  const [, , key] = vehicleState(v);
  return [
    `<button class="btn small" type="button" data-action="vehicle-edit" data-id="${esc(v.id)}">Modifier</button>`,
    key === 'online' || key === 'scheduled' ? `<a class="btn small" href="/?annonce=${encodeURIComponent(v.id)}" target="_blank" rel="noopener">Voir ${icon('external')}</a>` : '',
    key === 'online' || key === 'scheduled' ? actionBtn('vehicle-hide', v.id, 'Masquer') : '',
    key === 'hidden' || key === 'draft' ? actionBtn('vehicle-show', v.id, 'Republier', 'primary') : '',
    actionBtn('vehicle-delete', v.id, 'Supprimer', 'danger'),
  ].join('');
}
function bookingActions(b) {
  if (b.status === 'pending') return actionBtn('booking-confirm', b.id, 'Confirmer', 'primary') + actionBtn('booking-refuse', b.id, 'Refuser', 'danger');
  if (b.status === 'confirmed') return actionBtn('booking-refuse', b.id, 'Annuler', 'danger');
  return '';
}

/* ---------- Pages client ---------- */
function clientItems() {
  return [
    ...DATA.bookings.map(b => ({ kind: 'car', id: b.id, ref: b.reference, title: b.vehicle_name, line: b.pickup_address || 'Lieu à confirmer', dates: [b.start_date, b.end_date].filter(Boolean).map(fmtDay).join(' → '), status: b.status, created: b.created_at, cancel: 'bookings', unseen: b.unseen_client, extra: b })),
    ...DATA.requests.map(r => ({ kind: r.offer_type, id: r.id, ref: refOf(r.id), title: r.offer_title, line: r.summary || '', dates: `${r.trip_type === 'oneway' ? 'Aller simple · ' : r.trip_type === 'roundtrip' ? 'Aller-retour · ' : ''}${r.travelers} voyageur${r.travelers > 1 ? 's' : ''} · ${money(r.total)}${r.payment_status === 'paid' ? ' · payé en ligne' : r.payment_status === 'refunded' ? ' · remboursé' : ''}`, status: r.status, created: r.created_at, cancel: 'requests', unseen: Boolean(r.status_changed_at && (!r.client_seen_at || new Date(r.client_seen_at) < new Date(r.status_changed_at))), extra: r })),
  ].sort((a, b) => new Date(b.created) - new Date(a.created));
}
const KIND = { car: ['car', 'Location de voiture'], flight: ['plane', 'Vol'], pack: ['pack', 'Pack week-end'] };
function orderCard(o) {
  const [tone, label] = clientState(o.status);
  const done = o.status === 'confirmed' || o.status === 'completed', cancelled = ['inactive', 'cancelled'].includes(o.status);
  const [ic, kindLabel] = KIND[o.kind] || KIND.car;
  const x = o.extra || {};
  const car = o.kind === 'car';
  const paid = car && x.payment_status === 'paid';
  const steps = car ? ['Réservation', 'Paiement', 'Confirmée'] : ['Demande envoyée', 'Confirmation'];
  const reached = cancelled ? 0 : car ? (paid || done ? 3 : 1) : (done ? 2 : 1);
  const total = car ? x.total_estimate : x.total;
  const hour = (t) => (t ? String(t).slice(0, 5) : '');
  const when = car
    ? `<div class="t-dates"><div><small>Départ</small><b>${esc(fmtDay(x.start_date))}</b><span>${esc(hour(x.start_time))}</span></div><i class="arrow"></i><div><small>Retour</small><b>${esc(fmtDay(x.end_date))}</b><span>${esc(hour(x.end_time))}</span></div></div>
       <p class="t-sub">${esc(o.line)}</p>`
    : `<p class="t-sub">${esc(o.line)}</p><p class="t-sub strong">${esc(o.dates)}</p>`;
  const note = cancelled ? 'Cette réservation n’est plus active.' : paid ? `Payé en ligne : ${money(x.paid_amount)}. Reste ${money(x.pay_on_pickup)} à régler à l’enseigne lors du retrait.` : done ? 'Réservation confirmée.' : 'En cours de traitement : vous serez prévenu dès la confirmation.';
  return `<article class="ticket kind-${esc(o.kind)} ${o.unseen ? 'is-new' : ''}" data-id="${esc(o.id)}" data-kind="${o.cancel}" data-action="order-open" tabindex="0">
    <div class="t-main">
      <div class="t-top"><span class="t-kind">${icon(ic)}${esc(kindLabel)}</span><span class="t-ref">${esc(o.ref)}${o.unseen ? ' · <b style="color:#d64541">Mis à jour</b>' : ''}</span></div>
      <h4>${esc(o.title)}</h4>
      ${when}
      ${cancelled ? '' : `<ol class="c-steps">${steps.map((t, i) => `<li class="${i < reached ? 'on' : ''}"><i></i>${esc(t)}</li>`).join('')}</ol>`}
    </div>
    <div class="t-side">
      <span class="t-state">${badge(tone, label)}</span>
      <div class="t-price"><small>${car ? 'Total de la location' : 'Total estimé'}</small><b>${total != null && total !== '' ? money(total) : '—'}</b></div>
      <p class="t-pay">${paid ? `<b>Payé en ligne</b> · ${esc(note.replace(/^Payé en ligne : [^.]*\.\s*/, ''))}` : esc(note)}</p>
      <div class="t-actions"><button class="btn small" type="button" data-action="order-pdf" data-id="${esc(o.id)}" data-kind="${o.cancel}">${icon('download')} PDF</button><button class="btn small primary" type="button" data-action="order-open" data-id="${esc(o.id)}" data-kind="${o.cancel}">Voir le détail</button>${o.status === 'pending' ? `<button class="btn small danger" type="button" data-action="order-cancel" data-id="${esc(o.id)}" data-kind="${o.cancel}">Annuler</button>` : ''}</div>
    </div></article>`;
}

const CLIENT_PAGES = {
  // Tableau de bord du voyageur : prochain voyage, suivi des réservations, idées de départ et aide.
  async overview() {
    await loadClient();
    const items = clientItems();
    const isActive = (i) => !['inactive', 'cancelled', 'completed'].includes(i.status);
    const active = items.filter(isActive), done = items.filter(i => ['confirmed', 'completed'].includes(i.status));
    const first = String(user.name || '').split(' ')[0] || 'voyageur';
    const today = new Date().toISOString().slice(0, 10);
    const DEST = window.TV_DEST || [];
    const norm = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const destFor = (txt) => DEST.find((d) => norm(txt).includes(norm(d.name)));
    const startOf = (i) => String(i.kind === 'car' ? i.extra.start_date || '' : i.extra.start_date || '').slice(0, 10);
    const next = items.filter((i) => isActive(i) && startOf(i) >= today).sort((a, b) => startOf(a).localeCompare(startOf(b)))[0] || active[0];
    let flights = [];
    try { flights = await fetch('/api/public/offers?type=flight').then((r) => (r.ok ? r.json() : [])); } catch { flights = []; }
    const fromPrice = (d) => flights.filter((o) => norm(o.to_city) === norm(d.name)).map((o) => Number(o.price)).sort((a, b) => a - b)[0];
    const inspo = DEST.filter((d) => d.beach).sort(() => Math.random() - 0.5).slice(0, 4);
    const heroDest = inspo[0] || DEST[0];
    const nd = next && destFor(`${next.title} ${next.line}`);
    const days = next && startOf(next) ? Math.round((new Date(startOf(next) + 'T12:00:00') - new Date(today + 'T12:00:00')) / 864e5) : null;
    const [kIc, kLabel] = next ? (KIND[next.kind] || KIND.car) : [];
    const nextCard = next ? `
      <article class="cd-next" ${nd ? `style="--img:url('/assets/dest/${nd.slug}.jpg')"` : ''}>
        <div class="cd-next-img">${nd ? '' : icon(kIc)}</div>
        <div class="cd-next-body">
          <span class="cd-kicker">${icon(kIc)} ${esc(kLabel)} · ${esc(next.ref)}</span>
          <h3>${esc(next.title)}</h3>
          <p>${esc(next.line)}</p>
          <div class="cd-next-row"><div class="cd-count"><b>${days == null ? '—' : days <= 0 ? 'En cours' : days === 1 ? 'Demain' : `J-${days}`}</b><small>${startOf(next) ? esc(fmtDay(startOf(next))) : esc(next.dates || '')}</small></div>${badge(...clientState(next.status))}</div>
          <div class="cd-next-act"><button class="btn primary small" type="button" data-action="order-open" data-id="${esc(next.id)}" data-kind="${next.cancel}">Voir ma réservation</button><button class="btn small" type="button" data-action="order-pdf" data-id="${esc(next.id)}" data-kind="${next.cancel}">${icon('download')} Voucher</button></div>
        </div></article>`
      : `<article class="cd-next empty"><div class="cd-next-body"><span class="cd-kicker">${icon('plane')} Prochain voyage</span><h3>Aucun départ prévu</h3><p>Choisissez une destination ci-dessous : votre prochain voyage s’affichera ici, avec son compte à rebours.</p><div class="cd-next-act"><a class="btn primary small" href="/#flights" target="_blank" rel="noopener">Trouver un vol</a></div></div></article>`;
    const unread = (BADGES.chat || 0);
    return `
      <section class="cd-hero" style="--img:url('/assets/dest/${heroDest ? heroDest.slug : 'santorin'}.jpg')">
        <div class="cd-hero-in">
          <span class="cd-kicker light">Mon espace voyageur</span>
          <h2>Bonjour ${esc(first)}.<br><em>Où partez-vous ensuite ?</em></h2>
          <div class="cd-quick">
            <a href="/#flights" target="_blank" rel="noopener">${icon('plane')}<span><b>Vols</b><small>Les meilleurs prix</small></span></a>
            <a href="/#cars" target="_blank" rel="noopener">${icon('car')}<span><b>Voitures</b><small>Prix total affiché</small></span></a>
            <a href="/#packs" target="_blank" rel="noopener">${icon('pack')}<span><b>Week-ends</b><small>Transport + hôtel</small></span></a>
          </div>
        </div>
        ${heroDest ? `<a class="cd-hero-cap" href="/#destination/${heroDest.slug}" target="_blank" rel="noopener">${esc(heroDest.name)}, ${esc(heroDest.country)} →</a>` : ''}
      </section>
      <section class="cd-stats">
        <a href="#orders"><b>${items.length}</b><span>Réservations</span></a>
        <a href="#orders"><b>${active.length}</b><span>En cours</span></a>
        <a href="#orders"><b>${done.length}</b><span>Confirmées</span></a>
        <a href="#chat"><b>${unread}</b><span>Message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}</span></a>
      </section>
      <div class="cd-grid">
        <div class="cd-col">
          <div class="cd-head"><h3>Mon prochain voyage</h3></div>
          ${nextCard}
          <div class="cd-head"><h3>Mes réservations</h3>${items.length ? '<a href="#orders">Tout voir →</a>' : ''}</div>
          <div class="cd-list">${items.slice(0, 4).map((o) => { const [ic, kl] = KIND[o.kind] || KIND.car; const [tone, label] = clientState(o.status); return `<button type="button" class="cd-row" data-action="order-open" data-id="${esc(o.id)}" data-kind="${o.cancel}"><span class="cd-row-ic">${icon(ic)}</span><span class="cd-row-main"><b>${esc(o.title)}</b><small>${esc(kl)} · ${esc(o.ref)}${o.dates ? ` · ${esc(o.dates)}` : ''}</small></span>${badge(tone, label)}</button>`; }).join('') || `<div class="cd-empty">${icon('orders')}<span>Vos réservations apparaîtront ici.</span></div>`}</div>
        </div>
        <aside class="cd-side">
          <div class="cd-help"><span class="cd-help-ic">${icon('chat')}</span><h3>Une question ?</h3><p>Notre équipe vous répond dans la messagerie et vous prévient par e-mail.</p><a class="btn primary small" href="#chat">Écrire à TripVision${unread ? ` · ${unread}` : ''}</a></div>
          <div class="cd-tips"><h4>Bon à savoir</h4><ul><li>${icon('download')} Votre voucher PDF se télécharge depuis chaque réservation.</li><li>${icon('car')} Pour une voiture : seul l’acompte se paie en ligne, le solde à l’agence.</li><li>${icon('bell')} Vous êtes prévenu à chaque étape de votre réservation.</li></ul></div>
        </aside>
      </div>
      ${inspo.length ? `<section class="cd-inspo"><div class="cd-head"><h3>Envie d’ailleurs ?</h3><a href="/#flights" target="_blank" rel="noopener">Toutes les destinations →</a></div>
        <div class="cd-inspo-grid">${inspo.map((d) => { const p = fromPrice(d); return `<a class="cd-dest" href="/#destination/${d.slug}" target="_blank" rel="noopener"><img src="/assets/dest/${d.slug}.jpg" alt="${esc(d.name)}" loading="lazy"><span><b>${esc(d.name)}</b><small>${esc(d.country)}</small>${p ? `<em>Vols dès <strong>${money(p)}</strong></em>` : ''}</span></a>`; }).join('')}</div></section>` : ''}`;
  },

  async orders() {
    await loadClient();
    const items = clientItems();
    const filters = [['all', 'Toutes'], ['car', 'Voitures'], ['flight', 'Vols'], ['pack', 'Packs']];
    return pageHead('Historique', 'Mes <em>réservations</em>', 'Voitures, vols et packs associés à votre adresse e-mail.', '<button class="btn small" type="button" data-action="reload">' + icon('refresh') + ' Actualiser</button>')
      + `<div class="pillbar" role="group" aria-label="Filtrer">${filters.map(([k, l], i) => `<button type="button" class="pill ${i ? '' : 'active'}" data-order-filter="${k}">${l}<small>${k === 'all' ? items.length : items.filter(x => x.kind === k).length}</small></button>`).join('')}</div>`
      + `<div class="order-list" id="orderList">${items.map(o => `<div data-kind="${o.kind}">${orderCard(o)}</div>`).join('') || `<div class="empty card">${icon('empty')}<strong>Aucune réservation</strong><span>Vos réservations apparaîtront ici.</span></div>`}</div>
         <div class="empty no-results" id="orderNone" hidden>${icon('search')}<strong>Aucun résultat</strong><span>Aucune réservation de ce type.</span></div>`;
  },

  account: accountPage,

  chat: chatPage,
  notifications: notificationsPage,

  // Alertes prix : le client suit un trajet, TripVision le prévient dès qu'une offre correspond.
  async alerts() {
    const list = await api('/client/alerts');
    const TRIP = { any: 'Aller-retour ou aller simple', roundtrip: 'Aller-retour', oneway: 'Aller simple' };
    const flightsUrl = (a) => `/?${new URLSearchParams({ ...(a.from_city ? { from: a.from_city } : {}), to: a.to_city }).toString()}#flights`;
    const card = (a) => `
      <article class="al-card ${a.active ? '' : 'off'}">
        <div class="al-top">
          <span class="al-ic">${icon('plane')}</span>
          <div class="al-route"><b>${a.from_city ? `${esc(a.from_city)} <i>→</i> ` : '<small>Toutes villes de départ</small> <i>→</i> '}${esc(a.to_city)}</b>
            <span class="al-tags"><span>${esc(TRIP[a.trip_type] || TRIP.any)}</span>${a.max_price ? `<span>Jusqu’à ${money(a.max_price)}</span>` : '<span>Tous les prix</span>'}${a.direct_only ? '<span>Vols directs</span>' : ''}</span></div>
          ${badge(a.active ? 'ok' : 'warn', a.active ? 'Active' : 'En pause')}
        </div>
        <div class="al-now">${a.matches ? `<div><b>${a.matches} offre${a.matches > 1 ? 's' : ''} en ce moment</b><span>dès <strong>${money(a.best)}</strong> par personne</span></div><a class="btn small primary" href="${esc(flightsUrl(a))}" target="_blank" rel="noopener">Voir les vols ${icon('external')}</a>` : `<div><b>Aucune offre pour l’instant</b><span>Nous vous prévenons par e-mail dès qu’un vol correspond.</span></div>`}</div>
        <footer class="al-foot"><small>Créée le ${esc(fmtDay(String(a.created_at).slice(0, 10)))}${a.hits ? ` · ${a.hits} offre${a.hits > 1 ? 's' : ''} signalée${a.hits > 1 ? 's' : ''}` : ''}</small>
          <span>${actionBtn('alert-price', a.id, 'Prix maximum')}${actionBtn('alert-toggle', a.id, a.active ? 'Mettre en pause' : 'Réactiver')}${actionBtn('alert-delete', a.id, 'Supprimer', 'danger')}</span></footer>
      </article>`;
    DATA.alerts = list;
    return pageHead('Alertes prix', 'Mes <em>alertes</em>', 'Suivez un trajet : dès qu’une offre correspond, vous êtes prévenu par e-mail et dans votre espace.', `<button class="btn primary small" type="button" data-action="alert-new">${icon('plus')} Créer une alerte</button>`) + `
      ${list.length ? `<div class="al-list">${list.map(card).join('')}</div>` : `
      <section class="card al-empty">${icon('bell')}<h3>Aucune alerte pour le moment</h3><p>Choisissez une destination et un prix maximum : nous surveillons les offres pour vous et vous écrivons dès qu’un vol correspond.</p>
        <div class="al-empty-act"><button class="btn primary" type="button" data-action="alert-new">${icon('plus')} Créer ma première alerte</button><a class="btn" href="/#flights" target="_blank" rel="noopener">Parcourir les vols</a></div></section>`}
      <p class="muted al-note">Jusqu’à 20 alertes. Chaque offre ne vous est signalée qu’une fois.</p>`;
  },

  async help() {
    const faq = [
      ['Comment annuler une réservation ?', 'Une demande de vol ou de pack encore « en attente » s’annule depuis « Mes réservations ». Une location de voiture s’annule depuis « Mes réservations » : gratuitement dans la période fixée par l’enseigne, sinon avec les frais d’annulation indiqués avant de confirmer.'],
      ['Quand ma réservation est-elle confirmée ?', 'Une location de voiture est confirmée dès le paiement en ligne : vous recevez un e-mail et une notification. Les vols et packs sont confirmés par TripVision après vérification de la disponibilité.'],
      ['Que paie-t-on en ligne pour une voiture ?', 'Un acompte de 10 % du total de votre location, options comprises. Le solde, ainsi que le dépôt de garantie éventuel, se règle directement à l’enseigne lors du retrait du véhicule.'],
      ['Faut-il payer pour demander un vol ou un pack ?', 'Non : la demande est gratuite et sans engagement. Le prix et les conditions vous sont confirmés avant tout paiement.'],
    ];
    return pageHead('Assistance', 'Aide & <em>contact</em>', 'Une question sur une réservation ? Écrivez-nous, indiquez la référence concernée.') + `
      <section class="card help-cta"><div><h3>Une question ? Parlons-en.</h3><p>Notre équipe répond directement dans votre messagerie, et vous prévient par e-mail.</p></div><a class="btn primary" href="#chat">Ouvrir la messagerie</a></section>
      <section class="card"><div class="card-head"><div><h3>Questions fréquentes</h3></div></div>
        <div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>`;
  },
};

/* ---------- Mon compte (partenaire et client) ---------- */
const deviceIcon = (d) => (/iPhone|Android/.test(d) ? '<path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2"/>' : '<path d="M3 5h18v11H3zM8 20h8M12 16v4"/>');
async function accountPage() {
  const me = await api('/auth/me');
  const u = me.user;
  const isPartner = user.role === 'partner';
  if (isPartner) await loadPartner();
  const co = isPartner ? DATA.partner : null;
  // Un compte partenaire est celui de l'entreprise : on affiche la société, pas une personne.
  const shown = isPartner ? (co?.tradeName || u.name) : u.name;
  user = { ...user, name: shown };
  sessionStorage.setItem(KEY.user, JSON.stringify(user));
  renderNav();
  let logins = [];
  if (isPartner) { try { logins = await api('/auth/logins'); } catch { /* facultatif */ } }
  const companyCard = isPartner ? `
    <section class="card">
      <div class="card-head"><div><h3>Ma société</h3><p>Les informations affichées à vos clients et à TripVision.</p></div><a class="btn small" href="#company">${icon('company')} ${co ? 'Modifier' : 'Compléter'}</a></div>
      ${co ? `<dl class="kv-grid">
        <div><dt>Nom commercial</dt><dd>${esc(co.tradeName)}</dd></div><div><dt>Raison sociale</dt><dd>${esc(co.legalName)}</dd></div>
        <div><dt>SIRET</dt><dd>${esc(co.siret)}</dd></div><div><dt>Siège</dt><dd>${esc(co.headOffice)}</dd></div>
        <div><dt>E-mail de réservation</dt><dd>${esc(co.bookingEmail)}</dd></div><div><dt>E-mail de contact</dt><dd>${esc(co.contactEmail)}</dd></div>
        <div><dt>Téléphone</dt><dd>${esc(co.phone || '—')}</dd></div><div><dt>Ville</dt><dd>${esc(co.city || '—')}</dd></div></dl>` : '<p class="muted">Votre dossier entreprise n’est pas encore renseigné.</p>'}
    </section>` : `
    <form id="profileForm" class="card">
      <div class="card-head"><div><h3>Informations personnelles</h3><p>Vos coordonnées de contact.</p></div></div>
      <div class="form-grid">
        ${field('Prénom', `name="firstName" required maxlength="60" autocomplete="given-name" value="${fv(u.firstName)}"`)}
        ${field('Nom', `name="lastName" required maxlength="60" autocomplete="family-name" value="${fv(u.lastName)}"`)}
        ${field('Téléphone', `name="phone" type="tel" required minlength="6" maxlength="30" autocomplete="tel" placeholder="+33 6 00 00 00 00" value="${fv(u.phone)}"`)}
        ${field('Adresse e-mail', `value="${fv(u.email)}" disabled title="L’e-mail est votre identifiant de connexion"`)}
        <div class="form-actions"><button class="btn primary" type="submit">Enregistrer les modifications</button></div>
      </div>
    </form>`;
  return pageHead('Compte', 'Mon <em>compte</em>', isPartner ? 'Les informations de votre entreprise et la sécurité de votre accès.' : 'Vos informations personnelles et votre mot de passe.') + `
    <section class="card profile-hero"><span class="avatar xl">${esc(initials(shown))}</span>
      <div><h3>${esc(shown)}</h3><div class="profile-meta"><span class="role-chip dark">${isPartner ? 'Partenaire' : 'Client'}</span><span class="muted">${esc(u.email)}</span></div>
        <p class="muted">Dernière connexion : ${fmtDate(u.lastLoginAt)} · Compte créé le ${fmtDay(u.createdAt)}</p></div></section>
    ${companyCard}
    <form id="passwordForm" class="card">
      <div class="card-head"><div><h3>Mot de passe</h3><p>Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</p></div></div>
      <div class="form-grid">
        ${field('Mot de passe actuel', 'name="currentPassword" type="password" required autocomplete="current-password"', true)}
        ${field('Nouveau mot de passe', 'name="newPassword" type="password" required autocomplete="new-password" data-pw-rules')}
        ${field('Confirmer le nouveau mot de passe', 'name="confirm" type="password" required autocomplete="new-password"')}
        <div class="form-actions"><button class="btn primary" type="submit">Changer le mot de passe</button></div>
      </div>
    </form>
    ${isPartner ? `<section class="card">
      <div class="card-head"><div><h3>Sécurité de l’accès</h3><p>Pour votre protection, la session se ferme d’elle-même après <b>15 minutes d’inactivité</b>.</p></div><button class="btn small danger" type="button" data-um-logout-account>${icon('logout')} Se déconnecter</button></div>
      <h4 class="sec-sub">Dernières connexions</h4>
      ${logins.length ? `<ul class="login-list">${logins.map((l, i) => `<li><span class="li-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${deviceIcon(l.device)}</svg></span><div><strong>${esc(l.device)}</strong><small>${esc(l.ip)}</small></div><time>${fmtDate(l.at)}</time>${i === 0 ? '<span class="badge ok">Actuelle</span>' : ''}</li>`).join('')}</ul>` : '<p class="muted">Aucune connexion enregistrée.</p>'}
      <p class="muted sec-note">Une connexion que vous ne reconnaissez pas ? Changez immédiatement votre mot de passe.</p>
    </section>` : `<section class="card logout-card"><div><h3>Se déconnecter</h3><p class="muted">Fermez votre session sur cet appareil.</p></div><button class="btn small danger" type="button" data-um-logout-account>${icon('logout')} Se déconnecter</button></section>`}`;
}

/* ---------- Mise en ligne : tout de suite ou à une date choisie ---------- */
const pad2 = (n) => String(n).padStart(2, '0');
const localInput = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
function scheduleBox(current) {
  const later = !!(current && new Date(current) > new Date());
  return `<fieldset class="schedule full">
      <legend>Mise en ligne</legend>
      <label class="choice"><input type="radio" name="when" value="now" ${later ? '' : 'checked'}><span>Tout de suite</span></label>
      <label class="choice"><input type="radio" name="when" value="later" ${later ? 'checked' : ''}><span>Programmer à une date précise</span></label>
      <input type="datetime-local" name="publishAt" min="${localInput(new Date(Date.now() + 5 * 60000))}" value="${later ? localInput(new Date(current)) : ''}" ${later ? '' : 'hidden'} aria-label="Date et heure de mise en ligne">
    </fieldset>`;
}
function readPublishAt(form) {
  if (form.elements.when?.value !== 'later') return null;
  const value = form.elements.publishAt.value;
  if (!value) throw new ApiError('Choisissez la date et l’heure de mise en ligne.');
  const date = new Date(value);
  if (date <= new Date()) throw new ApiError('La date de mise en ligne doit être dans le futur.');
  return date.toISOString();
}
document.addEventListener('change', (e) => {
  if (e.target.name !== 'when' || !e.target.closest('.schedule')) return;
  const date = e.target.closest('.schedule').querySelector('input[name=publishAt]');
  date.hidden = e.target.value !== 'later';
  date.required = e.target.value === 'later';
  if (!date.hidden) date.focus();
});

/* Aperçu des images jointes, sans quitter l'espace */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-lightbox]');
  if (!a || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `<figure><img src="${esc(a.dataset.lightbox)}" alt="${esc(a.dataset.name)}"><figcaption><span>${esc(a.dataset.name)}</span><a class="btn small" href="${esc(a.dataset.lightbox)}" target="_blank" rel="noopener" download="${esc(a.dataset.name)}">Ouvrir l’original</a></figcaption></figure><button type="button" class="lightbox-x" aria-label="Fermer">×</button>`;
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey, true); };
  const onKey = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } };
  box.addEventListener('click', (ev) => { if (ev.target === box || ev.target.closest('.lightbox-x')) close(); });
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(box);
});

/* ---------- Formulaire véhicule ---------- */
function openVehicleModal(existing = null, availability = { blocks: [], rentals: [] }) {
  const v = existing, editing = Boolean(v);
  openModal({
    eyebrow: 'Ma flotte', title: editing ? 'Modifier le véhicule' : 'Ajouter un véhicule', wide: true,
    confirmLabel: editing ? 'Enregistrer les modifications' : 'Valider le véhicule', loadingText: editing ? 'Enregistrement…' : 'Envoi du véhicule…',
    bodyHtml: `
      <div class="form-grid tight">${TVVehicleForm.html(v, { availability })}</div>
      ${scheduleBox(v?.publish_at)}
`,
    run: async (f) => {
      const body = { ...TVVehicleForm.read(f), publishAt: readPublishAt(f) };
      await api(editing ? `/partner/vehicles/${v.id}` : '/partner/vehicles', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      if (body.publishAt) return { title: editing ? 'Véhicule modifié' : 'Véhicule programmé', text: `Il apparaîtra sur le site le ${fmtDate(body.publishAt)}.` };
      return editing ? { title: 'Véhicule modifié', text: 'Les changements sont enregistrés.' } : { title: 'Véhicule publié', text: 'Il est visible sur le site dès maintenant.' };
    },
  });
}

function openOrderModal(o) {
  const x = o.extra || {};
  const rows = o.kind === 'car'
    ? [['Référence', o.ref], ['Véhicule', o.title], ['Départ', `${fmtDay(x.start_date)} ${x.start_time || ''}`], ['Retour', `${fmtDay(x.end_date)} ${x.end_time || ''}`], ['Lieu de prise en charge', x.pickup_address], ['Lieu de retour', x.return_address], ['Envoyée le', fmtDate(o.created)]]
    : [['Référence', o.ref], ['Offre', o.title], ['Trajet et dates', o.line], ['Type de billet', x.trip_type === 'oneway' ? 'Aller simple' : x.trip_type === 'roundtrip' ? 'Aller-retour' : ''], ['Voyageurs', x.travelers], ['Total estimé', money(x.total)], ['Envoyée le', fmtDate(o.created)]];
  openModal({ eyebrow: (KIND[o.kind] || KIND.car)[1], title: o.title, noFooter: true, cancelLabel: 'Fermer', wide: true,
    bodyHtml: `<div class="status-line">${badge(...clientState(o.status))}</div><dl class="kv">${rows.filter(([, v]) => v && String(v).trim() && String(v).trim() !== '—').map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="modal-actions"><button class="btn small primary" type="button" data-action="order-pdf" data-id="${esc(o.id)}" data-kind="${o.cancel}">${icon('download')} Télécharger en PDF</button></div>
      ${o.kind === 'car' && ['pending', 'confirmed'].includes(o.status) && String(x.start_date || '').slice(0, 10) >= new Date().toISOString().slice(0, 10) ? `<div class="modal-actions"><button class="btn small danger" type="button" data-action="car-cancel" data-id="${esc(o.id)}">Annuler ma réservation</button></div>`
        : o.kind !== 'car' && o.status === 'pending' ? `<div class="modal-actions"><button class="btn small danger" type="button" data-action="order-cancel" data-id="${esc(o.id)}" data-kind="${o.cancel}">Annuler la demande</button></div>` : ''}` });
}

function openBookingModal(b) {
  const rows = [['Référence', b.reference], ['Client', b.customer_name], ['E-mail', b.customer_email], ['Téléphone', b.customer_phone], ['Véhicule', b.vehicle_name],
    ['Départ', `${fmtDay(b.start_date)} ${b.start_time || ''}`], ['Retour', `${fmtDay(b.end_date)} ${b.end_time || ''}`], ['Lieu de prise en charge', b.pickup_address], ['Lieu de retour', b.return_address],
    ['Total', money(b.total_estimate)], ['Paiement', b.payment_status === 'paid' ? `Payé en ligne : ${money(b.paid_amount)}${b.pay_on_pickup != null ? ` · reste ${money(b.pay_on_pickup)} à régler à l’agence` : ''}` : b.payment_status === 'refunded' ? 'Remboursé' : ''], ['Options choisies', (b.extras || []).map(x => `${x.qty > 1 ? x.qty + ' × ' : ''}${x.name} (${money(x.total)})`).join(', ')], ['Total estimé', b.total_estimate == null ? '' : money(b.total_estimate)], ['Âge du conducteur', b.driver_age ? `${b.driver_age} ans${b.young_driver_notice ? ' (jeune conducteur)' : ''}` : ''], ['Frais d’annulation', b.cancel_fee ? money(b.cancel_fee) : ''], ['Message', b.message], ['Reçue le', fmtDate(b.created_at)]];
  openModal({ eyebrow: 'Réservation', title: b.vehicle_name, noFooter: true, cancelLabel: 'Fermer', wide: true,
    bodyHtml: `<div class="status-line">${badge(...bookingState(b.status))}</div><dl class="kv">${rows.filter(([, v]) => v && String(v).trim() && String(v).trim() !== '—').map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${b.status === 'pending' || b.status === 'confirmed' ? `<div class="modal-actions">${bookingActions(b)}</div>` : ''}` });
}

/* ---------- Alerte prix : création ---------- */
function openAlertModal(pre = {}) {
  openModal({
    eyebrow: 'Alerte prix', title: 'Créer une alerte', confirmLabel: 'Créer l’alerte', loadingText: 'Création…',
    bodyHtml: `<p class="modal-text">Indiquez votre trajet : nous vous prévenons dès qu’une offre correspond.</p>
      <div class="form-grid tight">
        ${field('Ville de départ (facultatif)', `name="fromCity" maxlength="80" value="${esc(pre.fromCity || '')}" placeholder="Ex. Paris"`)}
        ${field('Destination', `name="toCity" required minlength="2" maxlength="80" value="${esc(pre.toCity || '')}" placeholder="Ex. Dakar"`)}
        <label>Type de billet<select name="tripType"><option value="any">Aller-retour ou aller simple</option><option value="roundtrip" ${pre.tripType === 'roundtrip' ? 'selected' : ''}>Aller-retour</option><option value="oneway" ${pre.tripType === 'oneway' ? 'selected' : ''}>Aller simple</option></select></label>
        ${field('Prix maximum par personne (€, facultatif)', `name="maxPrice" type="number" min="1" max="20000" step="1" inputmode="numeric" value="${esc(pre.maxPrice || '')}" placeholder="Ex. 350"`)}
        <div class="full">${toggle('directOnly', 'Vols directs uniquement', pre.directOnly)}</div>
      </div>`,
    run: async (f) => {
      const d = Object.fromEntries(new FormData(f));
      await api('/client/alerts', { method: 'POST', body: JSON.stringify({ fromCity: d.fromCity || '', toCity: d.toCity, tripType: d.tripType, maxPrice: d.maxPrice ? Number(d.maxPrice) : null, directOnly: Boolean(d.directOnly) }) });
      if (location.hash !== '#alerts') location.hash = 'alerts';
      return { title: 'Alerte créée', text: 'Nous vous prévenons par e-mail dès qu’une offre correspond.' };
    },
  });
}

/* ---------- Actions ---------- */
const find = (list, id) => DATA[list].find(x => x.id === id);
const ACT = {
  'alert-new': () => openAlertModal(),
  'alert-toggle': (id) => { const a = find('alerts', id); return confirmCall({ eyebrow: 'Alerte prix', title: a.active ? 'Mettre cette alerte en pause ?' : 'Réactiver cette alerte ?', message: a.active ? 'Vous ne recevrez plus d’e-mail pour ce trajet tant qu’elle est en pause.' : 'Vous serez de nouveau prévenu des nouvelles offres sur ce trajet.', confirmLabel: a.active ? 'Mettre en pause' : 'Réactiver', loading: 'Enregistrement…', success: a.active ? 'Alerte en pause' : 'Alerte réactivée', method: 'PATCH', url: `/client/alerts/${id}`, body: { active: !a.active } }); },
  'alert-delete': (id) => confirmCall({ eyebrow: 'Alerte prix', title: 'Supprimer cette alerte ?', message: 'Vous ne serez plus prévenu des offres sur ce trajet.', confirmLabel: 'Supprimer', tone: 'danger', loading: 'Suppression…', success: 'Alerte supprimée', method: 'DELETE', url: `/client/alerts/${id}` }),
  'alert-price': (id) => { const a = find('alerts', id); openModal({ eyebrow: 'Alerte prix', title: 'Prix maximum', confirmLabel: 'Enregistrer', loadingText: 'Enregistrement…',
    bodyHtml: `<p class="modal-text">Vous serez prévenu seulement pour les offres à ce prix ou moins. Laissez vide pour tous les prix.</p><div class="form-grid tight">${field('Prix maximum par personne (€)', `name="maxPrice" type="number" min="1" max="20000" step="1" inputmode="numeric" value="${a.max_price ? Math.round(a.max_price) : ''}" placeholder="Ex. 350"`, true)}</div>`,
    run: async (f) => { const v = f.elements.maxPrice.value; await api(`/client/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ maxPrice: v ? Number(v) : null }) }); return { title: 'Prix maximum enregistré' }; } }); },
  'chat-open': (id) => { CH.id = id; CH.view = 'thread'; render(false); },
  'chat-back': () => { CH.view = 'list'; render(false); },
  'chat-new': () => openModal({
    eyebrow: 'Messagerie', title: 'Nouvelle conversation', confirmLabel: 'Envoyer', loadingText: 'Envoi…',
    bodyHtml: `<div class="form-grid tight">
      <label class="full">Sujet<select name="topic" required>${TOPICS().map(t => `<option>${esc(t)}</option>`).join('')}</select></label>
      ${field('Précision (facultatif)', 'name="detail" maxlength="80" placeholder="Ex. la référence TV-1234"', true)}
      <label class="full">Votre message<textarea name="message" rows="5" required maxlength="2000" placeholder="Expliquez-nous votre demande…"></textarea></label>
      <label class="full">Une photo ou un PDF ? (facultatif, 3 maximum)<input type="file" name="files" accept="${CHAT_ACCEPT}" multiple><small class="muted">JPG, JPEG, PNG ou PDF · 8 Mo maximum par fichier</small></label></div>`,
    run: async (form) => {
      const f = Object.fromEntries(new FormData(form));
      const picked = [...form.elements.namedItem('files').files].slice(0, 3);
      const attachments = [];
      for (const file of picked) attachments.push(await uploadChatFile(file));
      const r = await api('/chat/threads', { method: 'POST', body: JSON.stringify({ subject: f.detail?.trim() ? `${f.topic} · ${f.detail.trim()}` : f.topic, message: f.message, attachments }) });
      CH.id = r.id; CH.view = 'thread'; CH.files = [];
      return { title: 'Conversation créée', text: 'Nous vous répondons dès que possible.' };
    },
  }),
  'order-pdf': async (id, el) => {
    const path = el?.dataset.kind === 'requests' ? 'requests' : 'bookings';
    try {
      progress(1);
      const res = await fetch(`/api/client/${path}/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'reservation-tripvision.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Votre réservation est téléchargée en PDF.');
    } catch { toast('Impossible de générer le PDF pour le moment.'); } finally { progress(-1); }
  },
  reload: async () => { await render(); toast('Données actualisées.'); },
  'vehicle-new': () => openVehicleModal(),
  'vehicle-edit': async (id) => {
    try { openVehicleModal(find('vehicles', id), await api(`/partner/vehicles/${id}/availability`)); }
    catch (err) { if (!(err instanceof ApiError)) console.error(err); toast(err.message); }
  },
  'vehicle-hide': (id) => confirmCall({ eyebrow: 'Annonce', title: `Masquer « ${esc(find('vehicles', id).model)} » ?`, message: 'L’annonce disparaîtra du site. Vous pourrez la republier à tout moment.', confirmLabel: 'Masquer', loading: 'Masquage…', success: 'Annonce masquée', method: 'PATCH', url: `/partner/vehicles/${id}/visibility`, body: { hidden: true } }),
  'vehicle-show': (id) => confirmCall({ eyebrow: 'Annonce', title: `Republier « ${esc(find('vehicles', id).model)} » ?`, message: 'L’annonce sera de nouveau visible sur le site.', confirmLabel: 'Republier', loading: 'Publication…', success: 'Annonce republiée', method: 'PATCH', url: `/partner/vehicles/${id}/visibility`, body: { hidden: false } }),
  'vehicle-delete': (id) => confirmCall({ eyebrow: 'Annonce', title: `Supprimer « ${esc(find('vehicles', id).model)} » ?`, message: 'L’annonce sera retirée définitivement de votre flotte et du site.', confirmLabel: 'Supprimer', tone: 'danger', loading: 'Suppression…', success: 'Annonce supprimée', method: 'DELETE', url: `/partner/vehicles/${id}` }),
  'notif-open': async (id, el) => {
    const n = (DATA.notifications || []).find(x => x.id === id);
    if (!n) return;
    if (!n.read_at) { n.read_at = new Date().toISOString(); el?.classList.remove('unread'); BADGES.notifications = Math.max(0, BADGES.notifications - 1); paintBadges(); await markSeen(`/notifications/${id}/read`); }
    if (n.link) location.hash = `#${n.link}`;
  },
  'notif-read-all': async () => { await markSeen('/notifications/read-all'); toast('Notifications marquées comme lues.'); render(false); },
  'booking-open': (id) => {
    const b = find('bookings', id);
    if (!b) return;
    openBookingModal(b);
    if (b.unseen_partner) { b.unseen_partner = false; BADGES.bookings = Math.max(0, BADGES.bookings - 1); paintBadges(); document.querySelectorAll(`tr[data-id="${CSS.escape(id)}"] .new-tag`).forEach(t => t.remove()); markSeen(`/partner/bookings/${id}/seen`); }
  },
  'order-open': (id, el) => {
    const o = clientItems().find(x => x.id === id);
    if (!o) return;
    openOrderModal(o);
    if (o.unseen) {
      const list = el?.dataset.kind === 'requests' ? DATA.requests : DATA.bookings;
      const raw = list.find(x => x.id === id);
      if (raw) { raw.unseen_client = false; raw.client_seen_at = new Date().toISOString(); }
      BADGES.bookings = Math.max(0, BADGES.bookings - 1); paintBadges();
      document.querySelectorAll(`.order-card[data-id="${CSS.escape(id)}"] .new-tag`).forEach(t => t.remove());
      markSeen(`/client/orders/${o.cancel}/${id}/seen`);
    }
  },
  'booking-confirm': (id) => confirmCall({ eyebrow: 'Réservation', title: `Confirmer ${esc(find('bookings', id).reference)} ?`, message: 'Le client verra sa réservation comme confirmée.', confirmLabel: 'Confirmer', loading: 'Confirmation…', success: 'Réservation confirmée', method: 'PATCH', url: `/partner/bookings/${id}/status`, body: { status: 'confirmed' } }),
  'booking-refuse': (id) => { const b = find('bookings', id); confirmCall({ eyebrow: 'Réservation', title: `${b.status === 'confirmed' ? 'Annuler' : 'Refuser'} ${esc(b.reference)} ?`, message: 'Le client verra sa réservation comme annulée.', confirmLabel: b.status === 'confirmed' ? 'Annuler la réservation' : 'Refuser', tone: 'danger', loading: 'Mise à jour…', success: 'Réservation annulée', method: 'PATCH', url: `/partner/bookings/${id}/status`, body: { status: 'inactive' } }); },
  'car-cancel': async (id) => {
    let q;
    try { q = await api(`/client/bookings/${id}/cancel-quote`); } catch (err) { toast(err.message || 'Cette réservation ne peut plus être annulée.'); return; }
    if (q.started) { toast('La location a déjà commencé : elle ne peut plus être annulée en ligne.'); return; }
    const eur = (n) => money(n);
    const lines = q.free ? ['Annulation gratuite : votre réservation est annulée sans frais.', q.paid > 0 ? `Votre règlement de ${eur(q.paid)} vous est remboursé.` : '']
      : [`La période d’annulation gratuite est passée : l’enseigne applique des frais d’annulation de ${eur(q.fee)}.`, q.paid > 0 ? `Vous avez déjà réglé ${eur(q.paid)} en ligne.` : '',
        q.toPay > 0 ? `Il vous reste ${eur(q.toPay)} à payer maintenant pour annuler.` : q.refund > 0 ? `Le reste, soit ${eur(q.refund)}, vous est remboursé.` : 'Aucun autre paiement n’est demandé.'];
    openModal({ eyebrow: 'Réservation', title: 'Annuler ma réservation ?', confirmLabel: q.toPay > 0 ? `Payer ${eur(q.toPay)} et annuler` : 'Confirmer l’annulation', tone: 'danger', loadingText: 'Annulation…',
      bodyHtml: `<div class="modal-text">${lines.filter(Boolean).map(l => `<p>${esc(l)}</p>`).join('')}</div>`,
      run: async () => {
        const r = await api(`/client/bookings/${id}/cancel`, { method: 'POST' });
        if (r.checkoutUrl) { location.href = r.checkoutUrl; return new Promise(() => {}); }
        return { title: 'Réservation annulée', text: q.refund > 0 ? `${eur(q.refund)} vous sont remboursés.` : undefined };
      } });
  },
  'order-cancel': (id, el) => confirmCall({ eyebrow: 'Réservation', title: 'Annuler cette demande ?', message: 'Votre demande sera annulée. Vous pourrez en faire une nouvelle à tout moment.', confirmLabel: 'Annuler la demande', tone: 'danger', loading: 'Annulation…', success: 'Demande annulée', method: 'POST', url: `/client/${el.dataset.kind}/${id}/cancel` }),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || e.target.closest('a[href]')) return;
  const fn = ACT[el.dataset.action];
  if (!fn) return;
  e.stopPropagation();
  fn(el.dataset.id, el);
});
document.addEventListener('click', (e) => {
  const p = e.target.closest('[data-order-filter]');
  if (!p) return;
  document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.toggle('active', b === p));
  let shown = 0;
  document.querySelectorAll('#orderList > [data-kind]').forEach(d => { d.hidden = p.dataset.orderFilter !== 'all' && d.dataset.kind !== p.dataset.orderFilter; if (!d.hidden) shown++; });
  $('#orderNone').hidden = shown > 0 || !document.querySelector('#orderList > [data-kind]');
});

/* ---------- Formulaires ---------- */
document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!['companyForm', 'profileForm', 'passwordForm', 'chatForm'].includes(form.id)) return;
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const btn = form.querySelector('button[type=submit]');
  const data = Object.fromEntries(new FormData(form));
  const done = setLoading(btn, form.id === 'chatForm' ? 'Envoi…' : 'Enregistrement…');
  try {
    if (form.id === 'companyForm') {
      await api('/partner/profile', { method: 'POST', body: JSON.stringify({ ...data, kbisName: data.kbisName || undefined, phone: data.phone || undefined, city: data.city || undefined }) });
      toast('Informations de la société enregistrées.');
      await render();
    } else if (form.id === 'profileForm') {
      const r = await api('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) });
      user = { ...user, name: r.name };
      sessionStorage.setItem(KEY.user, JSON.stringify(user));
      renderNav();
      toast('Informations enregistrées.');
    } else if (form.id === 'passwordForm') {
      if (data.newPassword !== data.confirm) throw new ApiError('Les deux mots de passe ne correspondent pas.');
      const r = await api('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }) });
      if (r.token) { token = r.token; sessionStorage.setItem(KEY.token, token); }
      form.reset();
      toast('Mot de passe modifié.');
    } else if (form.id === 'chatForm') {
      if (!String(data.message || '').trim() && !CH.files.length) throw new ApiError('Écrivez un message ou joignez un fichier.');
      await api(`/chat/threads/${form.dataset.thread}/messages`, { method: 'POST', body: JSON.stringify({ message: data.message || '', attachments: CH.files }) });
      form.reset();
      CH.files = [];
      await render(false);
    }
  } catch (err) {
    if (!(err instanceof ApiError)) console.error(err);
    toast(err.message || 'Une erreur est survenue.');
  } finally { done(); }
});

/* ---------- Rendu ---------- */
let renderId = 0, chatCount = 0;
async function render(scroll = true) {
  renderNav();
  const id = ++renderId;
  const section = currentSection();
  const view = $('#view');
  if (scroll) view.innerHTML = '<div class="skeleton"><i></i><i></i><i></i></div>';
  const pages = user.role === 'partner' ? PARTNER_PAGES : CLIENT_PAGES;
  try {
    const html = await pages[section]();
    if (id !== renderId) return;
    view.innerHTML = html;
    TVPassword.enhance(view);
    markRequired(view);
    renderNav();
    refreshBadges();
    if (scroll) window.scrollTo(0, 0);
    const chat = $('#chatBody');
    if (chat) chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    if (id !== renderId) return;
    if (!(err instanceof ApiError)) console.error(err);
    view.innerHTML = `<section class="card"><div class="empty">${icon('alert')}<strong>Chargement impossible</strong><span>${esc(err.message)}</span><button class="btn small" data-action="reload">Réessayer</button></div></section>`;
  }
}
window.addEventListener('hashchange', () => { closeModalNow(); render(); });

// Messagerie : rafraîchissement discret des nouveaux messages.
setInterval(async () => {
  if (document.hidden || !user || currentSection() !== 'chat' || modalState) return;
  try {
    const d = await fetch('/api/chat/threads', { headers: { Authorization: `Bearer ${token}` } }).then(r => (r.ok ? r.json() : null));
    const sig = d ? d.map(t => `${t.id}${t.updated_at}${t.status}`).join('|') : chatSig;
    if (d && sig !== chatSig && !document.activeElement?.matches('#chatForm textarea')) render(false);
  } catch { /* hors ligne */ }
}, 20000);

function setCollapsed(on) {
  $('#app').classList.toggle('collapsed', on);
  const b = $('#collapseBtn');
  b.setAttribute('aria-label', on ? 'Agrandir le menu' : 'Réduire le menu');
  try { localStorage.setItem('tv_esp_collapsed', on ? '1' : '0'); } catch { /* indisponible */ }
}
$('#collapseBtn').addEventListener('click', () => setCollapsed(!$('#app').classList.contains('collapsed')));
$('#logoutBtn').addEventListener('click', () => {
  openModal({ eyebrow: 'Session', title: 'Se déconnecter ?', confirmLabel: 'Se déconnecter', tone: 'danger', loadingText: 'Déconnexion…', bodyHtml: '<p class="modal-text">Vous serez redirigé vers la page de connexion.</p>', run: async () => { signOut(); await new Promise(() => {}); } });
});

/* ---------- Démarrage ---------- */
(async function boot() {
  if (!token) { location.replace('/#login'); return; }
  try {
    const me = await api('/auth/me');
    user = { ...user, ...me.user };
    sessionStorage.setItem(KEY.user, JSON.stringify(user));
  } catch { return; }
  if (!['partner', 'client'].includes(user.role)) { location.replace(['it', 'admin', 'manager'].includes(user.role) ? '/backoffice/' : '/'); return; }
  if (user.role === 'partner') { try { setCollapsed(localStorage.getItem('tv_esp_collapsed') === '1'); } catch { /* indisponible */ } }
  document.body.dataset.theme = user.role;
  document.title = user.role === 'partner' ? 'Espace partenaire — TripVision' : 'Mon espace — TripVision';
  $('#app').hidden = false;
  $('#boot').remove();
  refreshBadges();
  const back = new URLSearchParams(location.search);
  if (back.get('cancel') === 'success' && back.get('session_id')) {
    history.replaceState(null, '', `${location.pathname}#orders`);
    try { const r = await api(`/payments/cancel-session/${encodeURIComponent(back.get('session_id'))}`); toast(r.cancelled ? 'Frais réglés : votre réservation est annulée.' : 'Paiement en cours de vérification : actualisez dans un instant.'); } catch { toast('Impossible de vérifier le paiement pour le moment.'); }
  }
  render();
})();


/* ---------- Menu du profil (client) ---------- */
document.addEventListener('click', (e) => {
  const menu = $('#userMenu');
  if (!menu) return;
  const me = e.target.closest('.me.has-menu');
  if (me && !e.target.closest('#userMenu')) { menu.hidden = !menu.hidden; return; }
  if (e.target.closest('[data-um-logout]')) { menu.hidden = true; $('#logoutBtn').click(); return; }
  if (e.target.closest('#userMenu a')) { menu.hidden = true; return; }
  menu.hidden = true;
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#userMenu')) $('#userMenu').hidden = true; });
document.addEventListener('click', (e) => { if (e.target.closest('[data-um-logout-account]')) $('#logoutBtn').click(); });

/* ---------- Déconnexion automatique après 15 minutes d'inactivité ---------- */
(function idleGuard() {
  const LIMIT = 15 * 60 * 1000, WARN = 60 * 1000;
  let last = Date.now(), warned = false, box = null;
  const hide = () => { box?.remove(); box = null; warned = false; };
  const bump = () => { if (Date.now() - last > LIMIT) return; last = Date.now(); if (warned) hide(); };
  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, bump, { passive: true }));
  const tick = () => {
    if (!token) return;
    const idle = Date.now() - last;
    if (idle >= LIMIT) { signOut('Vous avez été déconnecté après 15 minutes d’inactivité.'); return; }
    if (idle >= LIMIT - WARN && !warned) {
      warned = true;
      box = document.createElement('div');
      box.className = 'idle-warn';
      box.setAttribute('role', 'alertdialog');
      box.innerHTML = '<div><strong>Toujours là ?</strong><span>Sans activité, vous serez déconnecté dans une minute.</span></div><button type="button" class="btn small primary">Rester connecté</button>';
      box.querySelector('button').onclick = () => { last = Date.now(); hide(); api('/auth/ping').catch(() => {}); };
      document.body.appendChild(box);
    }
  };
  setInterval(tick, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();

// Menu repliable (partenaire, mobile et tablette)
document.addEventListener('click', (e) => {
  const b = e.target.closest('#menuBtn');
  const app = document.querySelector('.app');
  if (b && app) { const on = app.classList.toggle('nav-open'); b.setAttribute('aria-expanded', String(on)); }
  else if (app && e.target.closest('#nav a')) app.classList.remove('nav-open');
});
