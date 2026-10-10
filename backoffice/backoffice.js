const BO = ['it', 'admin', 'manager'];
const GOV = ['it', 'manager']; // journal d’audit
const ICONS = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  vehicles: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6v4h-2M3 13v4h2M3 13h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>',
  offers: '<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.1 1.1 6.4 3.6-3.3 3.3-2.7-.5L3 14.8l3.2 1.4 1.4 3.2 1.1-1.1-.5-2.7 3.3-3.3 3.6 6.4z"/>',
  bookings: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  partners: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M12 10h.01M15 10h.01"/>',
  categories: '<path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z"/>',
  mailing: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  clients: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  accounts: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  audit: '<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  connections: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  health: '<path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 22l8.8-8.3a5 5 0 0 0 0-7.1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  empty: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4m0 10V11m9-4-9 4"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>',
  notifications: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9zM10 20a2 2 0 0 0 4 0"/>',
  messages: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  chats: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5A8 8 0 1 1 21 12z"/>',
  trends: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  applications: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  clock2: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

const GROUPS = { ops: 'Opérations', gov: 'Gouvernance', tech: 'Technique', me: 'Compte' };
const ACCOUNT_PERMS = ['accounts.create', 'accounts.edit', 'accounts.delete'];
const SECTIONS = [
  { id: 'overview', label: 'Vue d’ensemble', group: 'ops', allow: () => true },
  { id: 'vehicles', label: 'Annonces véhicules', group: 'ops', allow: () => true },
  { id: 'offers', label: 'Vols & packs', group: 'ops', allow: () => true },
  { id: 'bookings', label: 'Réservations', group: 'ops', allow: () => can('bookings.view') || can('bookings.manage') },
  { id: 'categories', label: 'Catégories de voitures', group: 'ops', allow: () => can('categories.manage') },
  { id: 'notifications', label: 'Notifications', group: 'ops', allow: () => true },
  { id: 'messages', label: 'Messages de contact', group: 'ops', nav: false, allow: () => true },
  { id: 'chats', label: 'Messagerie', group: 'ops', allow: () => can('chats.reply') || can('chats.manage') },
  { id: 'trends', label: 'Tendances', group: 'ops', allow: () => can('trends.view') },
  { id: 'partners', label: 'Partenaires', group: 'gov', allow: () => can('partners.manage') },
  { id: 'applications', label: 'Candidatures', group: 'gov', allow: () => can('partners.manage') },
  { id: 'clients', label: 'Clients', group: 'gov', allow: () => can('clients.view') || ACCOUNT_PERMS.some(can) },
  { id: 'mailing', label: 'Mailing', group: 'gov', allow: () => can('mailing.export') },
  { id: 'accounts', label: 'Comptes internes', group: 'gov', allow: () => ACCOUNT_PERMS.some(can) },
  { id: 'audit', label: 'Journal d’audit', group: 'gov', allow: () => can('audit.view') },
  { id: 'connections', label: 'Connexions', group: 'tech', allow: () => user?.role === 'it' },
  { id: 'health', label: 'Santé système', group: 'tech', allow: () => user?.role === 'it' },
  { id: 'profile', label: 'Mon profil', group: 'me', allow: () => true },
];
const ROLE_LABELS = { it: 'IT', admin: 'Agent', manager: 'Manager' };
const MANAGEABLE = { it: ['it', 'manager', 'admin'], manager: ['manager', 'admin'], admin: [] };
const PERM_GROUPS = [
  ['Annonces véhicules', [['vehicles.create', 'Ajouter'], ['vehicles.edit', 'Valider, publier, masquer, programmer'], ['vehicles.delete', 'Supprimer'], ['franchise.manage', 'Fixer la franchise et le prix de sa protection (toutes les voitures)']]],
  ['Offres vols & packs', [['offers.create', 'Créer'], ['offers.edit', 'Activer, désactiver, programmer'], ['offers.delete', 'Supprimer']]],
  ['Réservations', [['bookings.view', 'Voir les réservations et leurs chiffres'], ['bookings.manage', 'Confirmer les réservations (l’annulation reste à l’enseigne)']]],
  ['Messagerie', [['chats.reply', 'Lire et répondre aux clients et partenaires'], ['chats.manage', 'Clôturer, rouvrir, attribuer, gérer les réponses types']]],
  ['Partenaires', [['partners.manage', 'Créer, valider, suspendre'], ['partners.delete', 'Supprimer']]],
  ['Clients', [['clients.view', 'Voir la liste des clients']]],
  ['Mailing', [['mailing.export', 'Consulter et exporter les contacts']]],
  ['Catégories de voitures', [['categories.manage', 'Créer, modifier, ordonner les catégories']]],
  ['Tendances', [['trends.view', 'Voir ce que les visiteurs recherchent et réservent']]],
  ['Comptes internes', [['accounts.create', 'Créer'], ['accounts.edit', 'Modifier, bloquer, réinitialiser'], ['accounts.delete', 'Supprimer']]],
  ['Journal d’audit', [['audit.view', 'Consulter le journal des actions']]],
];
const ALL_PERMS = PERM_GROUPS.flatMap(([, items]) => items.map(([k]) => k));
const DEFAULT_PERMS = { admin: ['vehicles.create', 'vehicles.edit', 'offers.create', 'offers.edit', 'bookings.view', 'chats.reply'], manager: ['vehicles.create', 'vehicles.edit', 'offers.create', 'offers.edit', 'bookings.view', 'bookings.manage', 'mailing.export', 'categories.manage', 'chats.reply', 'chats.manage', 'trends.view', 'clients.view', 'audit.view'] };
const ERRORS = {
  FORBIDDEN: 'Action non autorisée pour votre rôle.',
  PERMISSION_DENIED: 'Vous n’avez pas la permission d’effectuer cette action.',
  PERMISSION_ESCALATION: 'Vous ne pouvez pas accorder des droits que vous n’avez pas.',
  ROLE_NOT_ALLOWED: 'Vous ne pouvez pas agir sur ce type de compte.',
  SELF_ACTION: 'Vous ne pouvez pas faire cela sur votre propre compte.',
  ACCOUNT_DISABLED: 'Votre compte est bloqué ou supprimé.',
  SESSION_EXPIRED: 'Session expirée par inactivité. Reconnectez-vous.',
  INVALID_IMAGE: 'Image invalide : utilisez un fichier JPG, PNG ou WebP de 5 Mo maximum.',
  EMAIL_ALREADY_EXISTS: 'Cet e-mail existe déjà.',
  EMAIL_EXISTS: 'Cet e-mail existe déjà.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives. Réessayez dans 15 minutes.',
  VALIDATION_ERROR: 'Certains champs sont invalides.',
  WEAK_PASSWORD: 'Mot de passe trop faible.',
  NOT_FOUND: 'Élément introuvable ou déjà supprimé.',
};

let token = sessionStorage.getItem('tv_bo_token');
let user = JSON.parse(sessionStorage.getItem('tv_bo_user') || 'null');
let perms = JSON.parse(sessionStorage.getItem('tv_bo_perms') || '{}');
let meLoaded = false;
const DATA = { categories: [], mailing: [], clients: [], offers: [], vehicles: [], bookings: [], requests: [], partners: [], accounts: [], messages: [], applications: [], chats: [] };

const $ = (sel) => document.querySelector(sel);
const isGov = () => GOV.includes(user?.role);
const can = (key) => user?.role === 'it' || perms[key] === true;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v) => v == null || v === '' ? '—' : Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const fmtDate = (v) => v ? new Date(v).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDay = (v) => v ? new Date(String(v).slice(0, 10)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const STATUS_LABELS = { approved: 'Validé', active: 'Actif', confirmed: 'Confirmé', pending: 'En attente', inactive: 'Inactif' };
const badge = (s, label) => {
  const tone = ['approved', 'active', 'confirmed'].includes(s) ? 'ok' : s === 'inactive' ? 'bad' : s === 'pending' ? 'warn' : '';
  return `<span class="badge ${tone}">${esc(label || STATUS_LABELS[s] || s || '—')}</span>`;
};
const isScheduled = (item) => ['active', 'approved'].includes(item.status) && item.publish_at && new Date(item.publish_at) > new Date();
const isLive = (item) => ['active', 'approved'].includes(item.status) && !isScheduled(item);
// Un pack est archivé dès le jour du départ (plus réservable) ; un vol quand sa date est passée. Il reste consultable ici.
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const isArchived = (o) => Boolean(o.type && o.start_date && (o.type === 'pack' ? String(o.start_date).slice(0, 10) <= todayIso() : String(o.start_date).slice(0, 10) < todayIso()));
const pubBadge = (item) => isArchived(item)
  ? '<span class="badge plain">Archivée</span><span class="muted">départ passé</span>'
  : item.rentedUntil
  ? `<span class="badge warn">Loué</span><span class="muted">jusqu’au ${fmtDate(item.rentedUntil)}</span>`
  : item.afterRental && item.status === 'inactive'
  ? '<span class="badge plain">Brouillon</span><span class="muted">location terminée</span>'
  : isScheduled(item)
  ? `<span class="badge warn">Programmé</span><span class="muted">${fmtDate(item.publish_at)}</span>`
  : badge(item.status);

const fa = (attrs) => Object.entries(attrs).map(([k, v]) => ` data-f-${k}="${esc(v)}"`).join('');
const pubKey = (item) => (isArchived(item) ? 'archived' : item.rentedUntil ? 'rented' : item.afterRental && item.status === 'inactive' ? 'draft' : isScheduled(item) ? 'scheduled' : item.status);
const uniq = (list) => [...new Set(list.filter(Boolean))].sort().map(v => [v, v]);
const hotelSummary = (o) => [esc(o.hotel_name), o.hotel_stars ? '★'.repeat(Number(o.hotel_stars)) : '', o.hotel_nights ? `${o.hotel_nights} nuit${Number(o.hotel_nights) > 1 ? 's' : ''}` : '', esc(o.hotel_board)].filter(Boolean).join(' · ');

/* Astérisque rouge sur les champs obligatoires */
function markRequired(root = document) {
  root.querySelectorAll('label').forEach(label => {
    if (label.dataset.req) return;
    const control = label.querySelector(':scope > input[required]:not([type=hidden]):not([type=radio]):not([type=checkbox]), :scope > select[required], :scope > textarea[required], :scope > .pw > input[required]');
    if (!control) return;
    label.dataset.req = '1';
    const star = document.createElement('span');
    star.className = 'req';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '*';
    const text = [...label.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (text) {
      const name = document.createElement('span');
      name.className = 'lbl';
      text.replaceWith(name);
      name.append(text, star);
    } else label.prepend(star);
  });
  root.querySelectorAll('.modal-body, form.card > .form-grid').forEach(box => {
    if (box.querySelector('.req') && !box.querySelector(':scope > .req-note')) box.insertAdjacentHTML('beforeend', '<p class="req-note"><span class="req">*</span> Champs obligatoires</p>');
  });
}

/* ---------- Retours visuels : progression, toast, boutons ---------- */
let inflight = 0;
const progress = (delta) => { inflight = Math.max(0, inflight + delta); $('#progress').classList.toggle('on', inflight > 0); };

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
const stopIdleSafe = () => { if (typeof stopIdle === 'function') stopIdle(); };
const SCREENS = ['login', 'forgot', 'activate', 'changePassword', 'app'];
function show(id) { SCREENS.forEach(x => { $('#' + x).hidden = x !== id; }); }

function saveSession(data) {
  token = data.token || token;
  user = data.user || user;
  if (data.permissions) perms = data.permissions;
  sessionStorage.setItem('tv_bo_token', token);
  sessionStorage.setItem('tv_bo_user', JSON.stringify(user));
  sessionStorage.setItem('tv_bo_perms', JSON.stringify(perms));
}

function logout(message) {
  stopIdleSafe();
  token = null; user = null; perms = {}; meLoaded = false;
  sessionStorage.clear();
  closeDrawer(); closeModalNow();
  location.hash = '';
  show('login');
  if (typeof message === 'string') toast(message);
}

class ApiError extends Error {}

async function api(path, options = {}) {
  progress(1);
  try {
    const res = await fetch('/api' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (data.error === 'PASSWORD_CHANGE_REQUIRED') {
      user.mustChangePassword = true;
      show('changePassword');
      throw new ApiError('Changement de mot de passe requis.');
    }
    if (res.status === 401 && data.error !== 'INVALID_CREDENTIALS') {
      logout(ERRORS[data.error] || 'Session expirée, reconnectez-vous.');
      throw new ApiError(ERRORS[data.error] || 'Session expirée, reconnectez-vous.');
    }
    if (!res.ok) throw new ApiError(data.message || ERRORS[data.error] || `Erreur ${res.status}`);
    return data;
  } finally { progress(-1); }
}

/* ---------- Mots de passe : afficher / masquer ---------- */
const PW_RULES = [
  ['len', 'Au moins 14 caractères', (v) => v.length >= 14],
  ['low', 'Au moins une minuscule', (v) => /[a-z]/.test(v)],
  ['up', 'Au moins une majuscule', (v) => /[A-Z]/.test(v)],
  ['num', 'Au moins un chiffre', (v) => /\d/.test(v)],
  ['sym', 'Au moins un caractère spécial (! @ # $ % & * ? - _ + = …)', (v) => /[^a-zA-Z0-9]/.test(v)],
];

function attachPasswordRules(input) {
  if (input.dataset.rules) return;
  input.dataset.rules = '1';
  const box = document.createElement('div');
  box.className = 'pw-rules';
  box.setAttribute('aria-live', 'polite');
  box.innerHTML = `<div class="pw-meter" data-score="0">${'<i></i>'.repeat(PW_RULES.length)}</div>
    <p class="pw-title"><span>Votre mot de passe doit contenir :</span><span class="pw-count">0/${PW_RULES.length}</span></p>
    <ul>${PW_RULES.map(([id, label]) => `<li data-rule="${id}"><b></b>${esc(label)}</li>`).join('')}</ul>`;
  (input.closest('label') || input).insertAdjacentElement('afterend', box);
  const form = input.form;
  const submit = form?.querySelector('button[type=submit]');
  const update = () => {
    let score = 0;
    PW_RULES.forEach(([id, , test]) => {
      const ok = test(input.value);
      if (ok) score++;
      box.querySelector(`[data-rule="${id}"]`).classList.toggle('ok', ok);
    });
    box.querySelector('.pw-meter').dataset.score = score;
    box.querySelector('.pw-count').textContent = `${score}/${PW_RULES.length}`;
    input.setCustomValidity(score === PW_RULES.length ? '' : 'Le mot de passe ne respecte pas toutes les exigences.');
    if (submit && !submit.classList.contains('is-loading')) submit.disabled = score !== PW_RULES.length;
  };
  input.addEventListener('input', update);
  form?.addEventListener('reset', () => setTimeout(update, 0));
  update();
}

function enhancePasswords(root = document) {
  root.querySelectorAll('input[type=password]:not([data-pw])').forEach(input => {
    input.dataset.pw = '1';
    const wrap = document.createElement('span');
    wrap.className = 'pw';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle';
    btn.setAttribute('aria-label', 'Afficher le mot de passe');
    btn.innerHTML = EYE;
    wrap.appendChild(btn);
  });
  root.querySelectorAll('input[data-pw-rules]').forEach(attachPasswordRules);
}

/* ---------- Navigation ---------- */
const allowedSections = () => SECTIONS.filter(s => s.allow());

/* Pastilles : éléments à traiter par section (elles baissent quand on ouvre la conversation ou le détail). */
let BADGES = {};
const NAV_BADGE = { bookings: 'bookings', notifications: 'notifications', chats: 'chats', applications: 'applications' };
async function refreshBadges() {
  if (!token) return;
  try {
    const res = await fetch('/api/admin/badges', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    BADGES = await res.json();
    document.querySelectorAll('#nav a[data-badge]').forEach(a => {
      const n = BADGES[a.dataset.badge] || 0;
      let el = a.querySelector('.nav-count');
      if (!n) { el?.remove(); return; }
      if (!el) { el = document.createElement('em'); el.className = 'nav-count'; a.appendChild(el); }
      el.textContent = n > 99 ? '99+' : n;
    });
  } catch { /* hors ligne */ }
}
const markSeen = async (path) => { try { await fetch(`/api${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignoré */ } refreshBadges(); };
setInterval(() => { if (!document.hidden) refreshBadges(); }, 30000);

function renderNav() {
  const current = currentSection();
  let lastGroup = null;
  $('#nav').innerHTML = allowedSections().filter(s => s.nav !== false).map(s => {
    const label = s.group !== lastGroup ? `<div class="nav-group">${GROUPS[s.group]}</div>` : '';
    lastGroup = s.group;
    const n = BADGES[NAV_BADGE[s.id]] || 0;
    return `${label}<a href="#${s.id}" title="${esc(s.label)}" ${NAV_BADGE[s.id] ? `data-badge="${NAV_BADGE[s.id]}"` : ''} class="${s.id === current ? 'active' : ''}" ${s.id === current ? 'aria-current="page"' : ''}>${icon(s.id)}<span>${esc(s.label)}</span>${n ? `<em class="nav-count">${n > 99 ? '99+' : n}</em>` : ''}</a>`;
  }).join('');
  refreshBadges();
  $('#whoName').textContent = user.name || user.email;
  $('#whoAvatar').textContent = initials(user.name || user.email);
  $('#whoRole').textContent = ROLE_LABELS[user.role] || user.role;
}

function currentSection() {
  const id = location.hash.replace('#', '');
  return allowedSections().some(s => s.id === id) ? id : 'overview';
}

function setCollapsed(on) {
  $('#app').classList.toggle('collapsed', on);
  const b = $('#collapseBtn');
  b.setAttribute('aria-label', on ? 'Agrandir le menu' : 'Réduire le menu');
  b.title = on ? 'Agrandir le menu' : 'Réduire le menu';
  try { localStorage.setItem('tv_bo_collapsed', on ? '1' : '0'); } catch { /* stockage indisponible */ }
}

let renderId = 0;

async function render() {
  if (!token || !user) return show('login');
  if (user.mustChangePassword) return show('changePassword');
  show('app');
  resetIdle(true);
  if (!meLoaded) {
    try {
      const me = await api('/auth/me');
      saveSession({ user: { ...user, ...me.user }, permissions: me.permissions });
      meLoaded = true;
    } catch (err) { if (!token) return; }
  }
  renderNav();
  const id = ++renderId;
  const section = currentSection();
  const view = $('#view');
  view.innerHTML = '<div class="skeleton"><i></i><i></i><i></i></div>';
  try {
    const html = await RENDERERS[section]();
    if (id === renderId) { view.innerHTML = html; enhancePasswords(view); markRequired(view); window.scrollTo(0, 0); }
  } catch (err) {
    if (id !== renderId || !token || err instanceof ApiError && err.message.startsWith('Changement')) return;
    if (!(err instanceof ApiError)) console.error(err);
    view.innerHTML = `<section class="card"><div class="empty">${icon('alert')}<strong>Chargement impossible</strong><span>${esc(err.message)}</span><button class="btn small" data-action="reload">Réessayer</button></div></section>`;
  }
}

/* ---------- Gabarits ---------- */
const pageHead = (eyebrow, title, subtitle = '', actions = '') => `
  <header class="page-head"><div>
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h2>${title}</h2>
    ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  </div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;

const emptyRow = (cols, message) => `<tr><td colspan="${cols}"><div class="empty">${icon('empty')}<strong>${esc(message)}</strong><span>Les éléments apparaîtront ici dès leur création.</span></div></td></tr>`;

function tableCard({ id, title, count, head, rows, empty, cols, filters = [] }) {
  const selects = filters.map(f => `<select class="filter-select" data-col-filter="${id}" data-key="${f.key}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)} : tous</option>${f.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`).join('');
  return `
    <section class="card">
      <div class="card-head">
        <div><h3>${esc(title)}</h3><p>${esc(count)}</p></div>
        <div class="card-tools">
          ${selects}
          <label class="search">${icon('search')}<input type="search" placeholder="Rechercher…" data-filter="${id}" aria-label="Rechercher dans ${esc(title)}"></label>
          <button class="btn small" type="button" data-action="reload" title="Actualiser les données">${icon('refresh')} Actualiser</button>
        </div>
      </div>
      <div class="table-wrap"><table id="${id}">
        <thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows || emptyRow(cols, empty)}</tbody>
      </table></div>
      <div class="empty no-results" data-none="${id}" hidden>${icon('search')}<strong>Aucun résultat</strong><span>Modifiez la recherche ou les filtres.</span></div>
    </section>`;
}

const field = (label, attrs, full = false) => `<label class="${full ? 'full' : ''}">${esc(label)}<input ${attrs}></label>`;

function formCard(id, title, subtitle, fields, submitLabel) {
  return `
    <form id="${id}" class="card">
      <div class="card-head"><div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div></div>
      <div class="form-grid">${fields}<div class="form-actions"><button class="btn primary" type="submit">${esc(submitLabel)}</button></div></div>
    </form>`;
}

const statsCards = (st) => `<div class="stat-trio">${[['7 derniers jours', 'week'], ['Ce mois-ci', 'month'], ['Cette année', 'year']].map(([label, k]) => `<div class="stat-card"><span>${label}</span><strong>${st[k].total}</strong><em>${plural(st[k].car, 'voiture', 'voitures')} · ${plural(st[k].pack, 'pack', 'packs')} · ${plural(st[k].flight, 'vol', 'vols')}</em></div>`).join('')}</div>`;
const refOfRequest = (r) => `TV-${String(r.id).slice(0, 8).toUpperCase()}`;
const requestActions = (r) => [
  can('bookings.manage') && r.status === 'pending' && actionBtn('request-confirm', r.id, 'Confirmer', 'primary'),
].filter(Boolean).join('') || '<span class="muted">Trace conservée</span>';
const actionBtn = (action, id, label, cls = '') => `<button class="btn small ${cls}" type="button" data-action="${action}" data-id="${esc(id)}">${label}</button>`;
const siteBtn = (kind, item, label) => {
  const href = kind === 'offer' ? `/?offer=${encodeURIComponent(item.id)}` : `/?annonce=${encodeURIComponent(item.id)}`;
  return isLive(item)
    ? `<a class="btn small" href="${href}" target="_blank" rel="noopener">${label} ${icon('external')}</a>`
    : `<button class="btn small" type="button" disabled title="${isScheduled(item) ? 'Visible sur le site à la date programmée' : 'Visible sur le site une fois publié'}">${label} ${icon('external')}</button>`;
};

function scheduleFields(current, withDraft = false) {
  const later = !!(current && new Date(current) > new Date());
  return `
    <fieldset class="schedule">
      <legend>Mise en ligne</legend>
      <label class="choice"><input type="radio" name="when" value="now" ${later ? '' : 'checked'}><span>Immédiatement</span></label>
      <label class="choice"><input type="radio" name="when" value="later" ${later ? 'checked' : ''}><span>Programmer à une date précise</span></label>
      ${withDraft ? '<label class="choice"><input type="radio" name="when" value="draft"><span>Ne pas publier (en attente de validation)</span></label>' : ''}
      <input type="datetime-local" name="publishAt" value="${later ? toLocalInput(current) : ''}" ${later ? '' : 'hidden'}>
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

function readSchedule(form) {
  if (form.elements.when?.value === 'draft') return { draft: true, publishAt: null };
  return { draft: false, publishAt: readPublishAt(form) };
}

/* ---------- Popup de confirmation avec états (confirmer → en cours → résultat) ---------- */
let modalState = null;

function closeModalNow() { $('#modalRoot').innerHTML = ''; document.body.classList.remove('modal-open'); modalState = null; }

function openModal({ eyebrow = '', title, bodyHtml = '', confirmLabel = 'Confirmer', tone = 'primary', loadingText = 'Action en cours…', wide = false, run, onDone }) {
  const root = $('#modalRoot');
  root.innerHTML = `
    <div class="overlay modal-overlay"><form class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle" novalidate>
      <div class="modal-pane" data-pane="form">
        <header class="modal-head"><span class="eyebrow">${esc(eyebrow)}</span><h3 id="modalTitle">${esc(title)}</h3></header>
        <div class="modal-body">${bodyHtml}</div>
        <p class="form-error" role="alert" hidden></p>
        <footer class="modal-foot"><button class="btn" type="button" data-modal-cancel>Annuler</button><button class="btn ${tone}" type="submit">${esc(confirmLabel)}</button></footer>
      </div>
      <div class="modal-pane center" data-pane="loading" hidden><span class="spinner big" aria-hidden="true"></span><strong>${esc(loadingText)}</strong><span class="muted">Merci de patienter, ne fermez pas cette fenêtre.</span></div>
      <div class="modal-pane center" data-pane="done" hidden></div>
    </form></div>`;
  document.body.classList.add('modal-open');
  enhancePasswords(root);
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
  if (!form.querySelector('input, select, textarea')) form.querySelector('button[type=submit]').focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (modalState.busy) return;
    if (form.querySelector('[data-gallery][data-busy]')) { toast('Patientez : l’image est en cours de téléversement.'); return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }
    err.hidden = true;
    modalState.busy = true;
    showPane('loading');
    try {
      const result = (await run(form)) || {};
      showPane('done');
      pane('done').innerHTML = `
        <span class="done-icon">${icon('check')}</span>
        <strong>${esc(result.title || 'Terminé')}</strong>
        ${result.text ? `<span class="muted">${esc(result.text)}</span>` : ''}
        ${result.html || ''}
        <button class="btn primary" type="button" data-modal-close>Fermer</button>`;
      if (modalState) modalState.busy = false;
      closeDrawer();
      if (onDone) onDone();
      render();
      const done = () => closeModalNow();
      pane('done').querySelector('[data-modal-close]').addEventListener('click', done);
      pane('done').querySelector('[data-modal-close]').focus();
      if (!result.html) setTimeout(() => { if (modalState?.form === form) done(); }, 1500);
    } catch (error) {
      if (modalState) modalState.busy = false;
      if (!token) return;
      if (!(error instanceof ApiError)) console.error(error);
      showPane('form');
      err.textContent = error.message;
      err.hidden = false;
    }
  });
}

const credentialsHtml = (data, label) => data.emailSent
  ? `<div class="notice-box ok">
      <strong>${esc(label)}</strong>
      <div>Un e-mail d’activation vient d’être envoyé à <code>${esc(data.loginEmail)}</code>.</div>
      <span class="muted">Le lien est personnel, à usage unique. Si rien n’arrive, demandez de vérifier les courriers indésirables.</span>
    </div>`
  : `<div class="notice-box">
      <strong>${esc(label)}</strong>
      <div>${esc(data.emailError || 'L’e-mail n’a pas pu être envoyé.')} Transmettez ce lien d’activation à <code>${esc(data.loginEmail)}</code> :</div>
      <code class="link-code">${esc(data.activationUrl)}</code>
      <button class="btn small" type="button" data-copy="${esc(data.activationUrl)}">Copier le lien</button>
      <span class="muted">À usage unique. Il ne sera plus affiché.</span>
    </div>`;

const confirmCall = ({ eyebrow, title, message, confirmLabel, tone = 'primary', loading, success, successText, method = 'PATCH', url, body }) => openModal({
  eyebrow, title, confirmLabel, tone, loadingText: loading,
  bodyHtml: `<p class="modal-text">${message}</p>`,
  run: async () => { await api(url, { method, body: body ? JSON.stringify(body) : undefined }); return { title: success, text: successText }; },
});

/* ---------- Panneau de détail ---------- */
const CH = { mode: 'reply', files: [], staff: null };
const chatBadge = (t) => t.status === 'closed' ? `<span class="badge off">${t.auto_closed ? 'Clôturée (auto)' : 'Clôturée'}</span>` : t.status === 'pending' ? '<span class="badge plain">En attente du client</span>' : t.unread > 0 ? `<span class="badge warn">${t.unread} non lu${t.unread > 1 ? 's' : ''}</span>` : '<span class="badge ok">À traiter</span>';
const attHtml = (list) => (list || []).map(a => /^image\//.test(a.mime)
  ? `<a class="att img" href="${esc(a.url)}" target="_blank" rel="noopener" data-lightbox="${esc(a.url)}" data-name="${esc(a.name)}"><img src="${esc(a.url)}" alt="${esc(a.name)}"></a>`
  : `<a class="att file" href="${esc(a.url)}" target="_blank" rel="noopener">${icon('applications')}<span><b>${esc(a.name)}</b><small>PDF${a.size ? ` · ${Math.max(1, Math.round(a.size / 1024))} Ko` : ''}</small></span></a>`).join('');
const chatBubble = (m, t) => m.sender === 'system'
  ? `<div class="bubble system"><span>${esc(m.body)}</span><small>${fmtDate(m.created_at)}</small></div>`
  : m.sender === 'note'
    ? `<div class="bubble note"><b>Note interne · ${esc(m.author || 'Équipe')}</b><span>${esc(m.body)}</span><small>${fmtDate(m.created_at)} · invisible pour le client</small></div>`
    : `<div class="bubble ${m.sender}">${m.body ? `<span>${esc(m.body)}</span>` : ''}${m.attachments?.length ? `<div class="atts">${attHtml(m.attachments)}</div>` : ''}<small>${m.sender === 'admin' ? esc(m.author || 'Équipe') : esc(t.partner_name)} · ${fmtDate(m.created_at)}</small></div>`;
async function openChat(id, keepDraft = false) {
  try {
    const d = await api(`/admin/chats/${id}`);
    refreshBadges();
    if (!keepDraft) { CH.mode = 'reply'; CH.files = []; }
    if (d.canManage && !CH.staff) CH.staff = await api('/admin/chat-staff').catch(() => []);
    const canned = DATA.canned || await api('/admin/chat-canned').catch(() => []);
    DATA.canned = canned;
    const t = d.thread, closed = t.status === 'closed', mine = t.assigned_to === d.me;
    const bubbles = d.messages.map(m => chatBubble(m, t)).join('') || '<p class="muted">Aucun message pour le moment.</p>';
    const toggle = d.canManage ? (closed ? actionBtn('chat-reopen', id, 'Rouvrir la conversation', 'primary') : actionBtn('chat-close', id, 'Clôturer la conversation', 'danger')) : '';
    const resp = t.first_response_at ? Math.max(0, Math.round((new Date(t.first_response_at) - new Date(t.created_at)) / 60000)) : null;
    const assign = `<div class="chat-assign"><span>${t.assigned_name ? `Attribuée à <b>${esc(t.assigned_name)}</b>` : 'Non attribuée'}</span>${!closed && !mine ? actionBtn('chat-take', id, 'Prendre en charge') : ''}${d.canManage && !closed && CH.staff?.length ? `<select data-chat-assign="${esc(id)}" aria-label="Attribuer à"><option value="">Attribuer à…</option>${CH.staff.map(u => `<option value="${esc(u.id)}" ${u.id === t.assigned_to ? 'selected' : ''}>${esc(u.name)} · ${esc(ROLE_LABELS[u.role] || u.role)}</option>`).join('')}${t.assigned_to ? '<option value="none">Retirer l’attribution</option>' : ''}</select>` : ''}</div>`;
    const meta = `<div class="chat-meta">${resp != null ? `<span>${icon('clock')} 1ʳᵉ réponse en ${resp < 60 ? `${resp} min` : `${Math.round(resp / 6) / 10} h`}</span>` : '<span>Pas encore de réponse</span>'}${t.rating ? `<span class="rating" title="${t.rating}/5">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</span>${t.rating_comment ? `<em>« ${esc(t.rating_comment)} »</em>` : ''}` : closed ? '<span class="muted">Avis du client : pas encore donné</span>' : ''}</div>`;
    const cannedSel = canned.length ? `<select data-chat-canned aria-label="Réponses types"><option value="">Réponses types…</option>${canned.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('')}</select>` : '';
    $('#drawer').innerHTML = `
      <header class="drawer-head"><div><span class="eyebrow">Messagerie ${t.kind === 'client' ? 'client' : 'partenaire'}</span><h3>${esc(t.subject || 'Conversation')}</h3>
        <div class="drawer-status">${chatBadge({ ...t, unread: 0 })}<span class="muted">${esc(t.partner_name)} · ${esc(t.partner_email)}</span></div>${assign}${meta}</div>
        <button class="icon-btn light" type="button" data-action="close-drawer" aria-label="Fermer">${icon('close')}</button></header>
      <div class="drawer-body chat-body">${bubbles}</div>
      ${closed
        ? `<footer class="drawer-foot chat-closed">${toggle || '<p class="muted">Conversation clôturée.</p>'}</footer>`
        : `<form id="chatReplyForm" class="drawer-foot chat-form" data-thread="${esc(id)}">
            <div class="chat-tabs" role="tablist"><button type="button" class="${CH.mode === 'reply' ? 'on' : ''}" data-chat-mode="reply">Répondre au ${t.kind === 'client' ? 'client' : 'partenaire'}</button><button type="button" class="${CH.mode === 'note' ? 'on' : ''}" data-chat-mode="note">Note interne</button></div>
            <textarea name="message" ${CH.mode === 'note' ? 'required' : ''} maxlength="4000" rows="3" placeholder="${CH.mode === 'note' ? 'Note visible uniquement par l’équipe…' : 'Votre réponse…'}"></textarea>
            <div class="chat-files" id="chatFiles">${chatFileChips()}</div>
            <div class="chat-form-actions"><label class="btn small file-btn" ${CH.mode === 'note' ? 'hidden' : ''}>${icon('upload')} Joindre<input type="file" id="chatFile" accept="${CHAT_ACCEPT}" multiple hidden></label><span class="chat-formats">JPG, PNG ou PDF · 8 Mo</span>${CH.mode === 'note' ? '' : cannedSel}${toggle}<button class="btn primary" type="submit">${CH.mode === 'note' ? 'Ajouter la note' : 'Envoyer'}</button></div>
          </form>`}`;
    $('#drawer').hidden = false;
    $('#overlay').hidden = false;
    document.body.classList.add('drawer-open');
    const body = $('#drawer .chat-body');
    body.scrollTop = body.scrollHeight;
    CH.open = { id, sig: chatSigOf(d) };
  } catch (err) { if (!(err instanceof ApiError)) console.error(err); toast(err.message); }
}
// Conversation ouverte : les nouveaux messages (et pièces jointes) s'affichent sans recharger, le brouillon est conservé.
const chatSigOf = (d) => `${d.thread.status}|${d.thread.assigned_to || ''}|${d.messages.length}|${d.messages.at(-1)?.id || ''}`;
setInterval(async () => {
  const drawer = $('#drawer');
  if (!CH.open || document.hidden || drawer.hidden || !drawer.querySelector('.chat-body')) return;
  try {
    const d = await api(`/admin/chats/${CH.open.id}`);
    const sig = chatSigOf(d);
    if (sig === CH.open.sig || !CH.open) return;
    const form = document.getElementById('chatReplyForm');
    const draft = form?.elements.message.value || '';
    const focused = document.activeElement === form?.elements.message;
    await openChat(CH.open.id, true);
    const ta = document.querySelector('#chatReplyForm textarea');
    if (ta) { ta.value = draft; if (focused) ta.focus(); }
    if (currentSection() === 'chats') refreshChatList();
  } catch { /* nouvel essai au prochain passage */ }
}, 5000);
async function refreshChatList() {
  try {
    const list = await api('/admin/chats');
    DATA.chats = list;
    list.forEach(t => {
      const row = document.querySelector(`#tblChats tbody tr[data-id="${CSS.escape(t.id)}"]`);
      const cell = row?.querySelector('[data-last]');
      if (cell) cell.textContent = String(t.last_message || '').slice(0, 90);
    });
  } catch { /* sans gravité */ }
}
/* Aperçu des images jointes, sans quitter le back-office */
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
// Pièces jointes acceptées : JPG/JPEG, PNG et PDF (le type est déduit de l'extension si le navigateur ne le donne pas).
const CHAT_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
const chatMime = (file) => file.type && file.type !== 'image/pjpeg' ? file.type : ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' }[String(file.name).split('.').pop().toLowerCase()] || '');
const chatFileChips = () => CH.files.map((f, i) => `<span class="chip-file">${esc(f.name)}<button type="button" data-chat-unfile="${i}" aria-label="Retirer">×</button></span>`).join('');
async function uploadChatFile(file) {
  if (file.size > 8 * 1024 * 1024) throw new ApiError('Fichier trop lourd (8 Mo maximum).');
  const type = chatMime(file);
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(type)) throw new ApiError(`« ${file.name} » : formats acceptés JPG, JPEG, PNG ou PDF.`);
  const res = await fetch('/api/admin/chat-uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': type, 'X-File-Name': encodeURIComponent(file.name) }, body: file });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Fichier refusé : JPG, JPEG, PNG ou PDF (8 Mo maximum).');
  return data;
}
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-chat-mode]');
  if (m) { const f = document.getElementById('chatReplyForm'); const draft = f?.elements.message.value || ''; CH.mode = m.dataset.chatMode; openChat(f.dataset.thread, true).then(() => { const t = document.querySelector('#chatReplyForm textarea'); if (t) { t.value = draft; t.focus(); } }); return; }
  const u = e.target.closest('[data-chat-unfile]');
  if (u) { CH.files.splice(Number(u.dataset.chatUnfile), 1); document.getElementById('chatFiles').innerHTML = chatFileChips(); }
});
document.addEventListener('change', async (e) => {
  if (e.target.id === 'chatFile') {
    const list = [...e.target.files];
    e.target.value = '';
    for (const f of list) {
      if (CH.files.length >= 3) { toast('3 fichiers au maximum par message.'); break; }
      try { toast(`Téléversement de ${f.name}…`); CH.files.push(await uploadChatFile(f)); document.getElementById('chatFiles').innerHTML = chatFileChips(); } catch (err) { toast(err.message); }
    }
    return;
  }
  if (e.target.matches?.('[data-chat-canned]')) {
    const c = (DATA.canned || []).find(x => x.id === e.target.value);
    const ta = document.querySelector('#chatReplyForm textarea');
    if (c && ta) { ta.value = ta.value ? `${ta.value}\n${c.body}` : c.body; ta.focus(); }
    e.target.value = '';
    return;
  }
  if (e.target.matches?.('[data-chat-assign]')) {
    const to = e.target.value;
    if (!to) return;
    try { await api(`/admin/chats/${e.target.dataset.chatAssign}/assign`, { method: 'POST', body: JSON.stringify({ to: to === 'none' ? null : to }) }); toast(to === 'none' ? 'Attribution retirée.' : 'Conversation attribuée.'); await openChat(e.target.dataset.chatAssign, true); if (currentSection() === 'chats') render(); } catch (err) { toast(err.message); }
  }
});

async function openClientDrawer(id) {
  try {
    const d = await api(`/admin/clients/${id}`);
    const c = d.client;
    const items = [
      ...d.bookings.map(b => ({ ref: b.reference, title: b.vehicle_name, line: `${fmtDay(b.start_date)} → ${fmtDay(b.end_date)}`, status: b.status, at: b.created_at })),
      ...d.requests.map(r => ({ ref: refOfRequest(r), title: r.offer_title, line: r.summary, status: r.status === 'cancelled' ? 'inactive' : r.status, at: r.created_at })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at));
    $('#drawer').innerHTML = `
      <header class="drawer-head"><div><span class="eyebrow">Client</span><h3>${esc(c.name)}</h3><div class="drawer-status">${c.active ? badge('active', 'Actif') : badge('inactive', 'Bloqué')}</div></div>
        <button class="icon-btn light" type="button" data-action="close-drawer" aria-label="Fermer">${icon('close')}</button></header>
      <div class="drawer-body">${kv([['E-mail', esc(c.email)], ['Téléphone', esc(c.phone)], ['Inscrit le', fmtDate(c.created_at)], ['Dernière connexion', c.last_login_at ? fmtDate(c.last_login_at) : 'Jamais']])}
        <h4 class="form-section">Réservations (${items.length})</h4>
        ${items.length ? `<ul class="client-orders">${items.map(i => `<li><div><strong>${esc(i.title)}</strong><span class="muted">${esc(i.ref)} · ${esc(i.line)}</span></div>${badge(i.status)}</li>`).join('')}</ul>` : '<p class="muted">Aucune réservation pour le moment.</p>'}</div>
      <footer class="drawer-foot">${[
        can('accounts.edit') && actionBtn('client-reset', c.id, 'Réinit. mot de passe'),
        can('accounts.edit') && (c.active ? actionBtn('client-block', c.id, 'Bloquer', 'danger') : actionBtn('client-unblock', c.id, 'Débloquer', 'primary')),
        can('accounts.delete') && actionBtn('client-delete', c.id, 'Supprimer', 'danger'),
      ].filter(Boolean).join('')}</footer>`;
    $('#drawer').hidden = false;
    $('#overlay').hidden = false;
    document.body.classList.add('drawer-open');
  } catch (err) { if (!(err instanceof ApiError)) console.error(err); toast(err.message); }
}

function closeDrawer() { CH.open = null; document.body.classList.remove('drawer-open'); $('#drawer').hidden = true; $('#overlay').hidden = true; $('#drawer').innerHTML = ''; }

const NOTIF_ICON = { booking: 'bookings', request: 'offers', contact: 'messages', chat: 'chats', application: 'applications', vehicle: 'vehicles', freshness: 'clock' };
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  if (m < 1440) return `il y a ${Math.round(m / 60)} h`;
  if (m < 10080) return `il y a ${Math.round(m / 1440)} j`;
  return fmtDay(iso);
};
const notifItems = (list) => list.map(n => `<button type="button" class="notif ${n.read_at ? '' : 'unread'}" data-action="notif-open" data-id="${esc(n.id)}" data-kind="${esc(n.kind)}">
  <span class="notif-icon">${icon(NOTIF_ICON[n.kind] || 'notifications')}</span>
  <span class="notif-main"><strong>${esc(n.title)}</strong>${n.body ? `<span class="muted">${esc(n.body)}</span>` : ''}</span>
  <span class="notif-time">${ago(n.created_at)}</span></button>`).join('');
function filterNotifs() {
  const unreadOnly = document.querySelector('[data-notif-state].active')?.dataset.notifState === 'unread';
  const kind = document.querySelector('[data-notif-kind]')?.value || '';
  let shown = 0;
  document.querySelectorAll('#notifList .notif').forEach(el => {
    const hide = (unreadOnly && !el.classList.contains('unread')) || (kind && el.dataset.kind !== kind);
    el.hidden = hide;
    if (!hide) shown++;
  });
  const none = document.getElementById('notifNone');
  if (none) none.hidden = shown > 0;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-notif-state]');
  if (b) { document.querySelectorAll('[data-notif-state]').forEach(x => x.classList.toggle('active', x === b)); filterNotifs(); }
});
document.addEventListener('change', (e) => { if (e.target.matches?.('[data-notif-kind]')) filterNotifs(); });
const hhmm = (t, off) => (t ? `${esc(t)}${off ? ` (+${off} j)` : ''}` : '—');
const flightRows = (o) => {
  const f = o.flight;
  if (!f) return [];
  const dur = f.durationMin ? `${Math.floor(f.durationMin / 60)} h ${String(f.durationMin % 60).padStart(2, '0')}` : '';
  return [
    ['Compagnie', [esc(f.airline), esc(f.flightNumber)].filter(Boolean).join(' · ')],
    ['Aller', `${fmtDay(o.start_date)} · ${hhmm(f.departTime)} → ${hhmm(f.arriveTime, f.arriveDayOffset)}${dur ? ` · ${dur}` : ''}`],
    f.tripType === 'roundtrip' ? ['Retour', `${fmtDay(o.end_date)} · ${hhmm(f.returnDepartTime)} → ${hhmm(f.returnArriveTime, f.returnDayOffset)}`] : ['Trajet', 'Aller simple'],
    ['Escales', f.stops ? `${f.stops} escale${f.stops > 1 ? 's' : ''}` : 'Direct'], ['Classe', esc(f.cabin)], ['Bagages', esc(f.baggage)],
  ];
};
const kv = (rows) => `<dl class="kv">${rows.filter(Boolean).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v || v === 0 ? v : '—'}</dd></div>`).join('')}</dl>`;
const yesNo = (v) => v ? 'Oui' : 'Non';

function detailContent(kind, id) {
  if (kind === 'offer') {
    const o = DATA.offers.find(x => x.id === id); if (!o) return null;
    return {
      eyebrow: o.type === 'flight' ? 'Offre vol' : 'Offre pack', title: o.title, image: o.image, images: o.images,
      status: pubBadge(o),
      body: kv([
        ['Trajet', `${esc(o.from_city || '—')} → ${esc(o.to_city)}`], ['Pays', esc(o.country)], ['Prix', `${money(o.price)}${o.old_price ? ` <s class="muted">${money(o.old_price)}</s>` : ''}`],
        o.hotel_name && ['Hôtel inclus', hotelSummary(o)], ...flightRows(o), ['Étiquette', esc(o.badge)], ['Partenaire', esc(o.partner_name)], ['Dates', `${fmtDay(o.start_date)} → ${fmtDay(o.end_date)}`],
        ['Mise en ligne', isArchived(o) ? 'Archivée : le départ est passé, l’offre n’est plus visible sur le site' : isScheduled(o) ? `Programmée le ${fmtDate(o.publish_at)}` : isLive(o) ? 'En ligne' : 'Hors ligne'], ['Réservations', o.type === 'pack' && o.start_date ? `Possibles jusqu’à la veille du départ (${fmtDay(new Date(new Date(String(o.start_date).slice(0, 10)).getTime() - 864e5).toISOString())})` : ''], ['Créée le', fmtDate(o.created_at)], ['Description', esc(o.description)],
      ]),
      actions: offerActions(o, true),
    };
  }
  if (kind === 'vehicle') {
    const v = DATA.vehicles.find(x => x.id === id); if (!v) return null;
    return {
      eyebrow: 'Annonce véhicule', title: v.model, image: v.image, images: v.images, status: pubBadge(v),
      body: kv([
        ['Catégorie', esc(v.category)], ['Partenaire', esc(v.partner_company)], ['Ville', [v.city !== v.pickupAddress && esc(v.city), esc(v.country)].filter(Boolean).join(', ')], ['Retrait', esc(v.pickupAddress)],
        ['Tarifs (par jour)', window.TVPricing ? (() => { const r = window.TVPricing.ratesOf(v); return window.TVPricing.PALIERS.map((p, i) => `${window.TVPricing.label(p)} : ${money(r.tiers[i])}`).join(' · ') + (r.seasons.length ? `<br>Saisons : ${r.seasons.map((z) => `${esc(z.name)} × ${String(z.coef).replace('.', ',')}`).join(', ')}` : '') + `<br>Durée ${r.minDays} à ${r.maxDays} j · retard toléré ${r.grace} min${r.smoothing ? ' · lissage des seuils' : ''}`; })() : `${money(v.priceDay)}/jour`], ['Places / portes', `${esc(v.passengers)} / ${esc(v.doors)}`], ['Boîte', esc(v.transmission)],
        ['Bagages / carburant', `${esc(v.bags ?? '—')} / ${esc(v.fuelType || '—')}`], ['Dépôt de garantie', v.deposit == null ? '—' : money(v.deposit)], ['Franchise', v.excess == null ? 'Non définie' : `${money(v.excess)} (montant fixé par TripVision)`], ['Assurance', esc(v.insuranceType || [v.theftProtection && 'Protection vol', v.fullInsurance && 'Tous risques'].filter(Boolean).join(', ') || '—')], ['Kilométrage', esc(v.includedKm)], ['Politique carburant', esc(v.fuelPolicy)], ['Annulation', v.freeCancelHours > 0 ? `Gratuite jusqu’à ${esc(v.freeCancelHours)} h avant` : 'Pas d’annulation gratuite'], ['Protection franchise', v.protectionPricePerDay ? `${money(v.protectionPricePerDay)}/j (prix fixe TripVision)` : '—'], ['Âge du conducteur', [v.minAge ? `${esc(v.minAge)} ans minimum` : '18 ans minimum', v.youngDriverFee > 0 && `moins de ${esc(v.youngDriverAge)} ans : + ${money(v.youngDriverFee)}${v.youngDriverPricing === 'once' ? ' (forfait)' : '/jour'}`].filter(Boolean).join(' · ')], ['Restitution ailleurs', v.returnPolicy === 'fee' ? `Possible, + ${money(v.returnFee)}` : v.returnPolicy === 'free' ? 'Possible, sans frais' : 'Non'], ['Options payantes', (v.extras || []).map(e => `${esc(e.name)} ${money(e.pricePerDay)}/j`).join(', ')],
        ['Options', [v.airConditioning && 'Climatisation', v.fullInsurance && 'Assurance tous risques', v.theftProtection && 'Protection vol', v.freeCancel && 'Annulation gratuite', v.freeModification && 'Modification gratuite'].filter(Boolean).join(', ')],
        ['Conditions', esc(v.rentalConditions)], ['Mise en ligne', isScheduled(v) ? `Programmée le ${fmtDate(v.publish_at)}` : isLive(v) ? 'En ligne' : 'Hors ligne'], ['Ajoutée le', fmtDate(v.created_at)],
      ]),
      actions: vehicleActions(v, true),
    };
  }
  if (kind === 'booking') {
    const b = DATA.bookings.find(x => x.id === id); if (!b) return null;
    return {
      eyebrow: 'Réservation', title: b.reference, status: badge(b.status),
      body: kv([
        ['Client', esc(b.customer_name)], ['E-mail', esc(b.customer_email)], ['Téléphone', esc(b.customer_phone)], ['Véhicule', esc(b.vehicle_name)], ['Entreprise', esc(b.company)],
        ['Départ', `${fmtDay(b.start_date)} ${esc(b.start_time || '')}`], ['Retour', `${fmtDay(b.end_date)} ${esc(b.end_time || '')}`],
        ['Lieu de retrait', esc(b.pickup_address)], ['Lieu de retour', esc(b.return_address)], ['Âge du conducteur', b.driver_age ? `${esc(b.driver_age)} ans${b.young_driver_notice ? ' (jeune conducteur)' : ''}` : ''],
        ['Total', money(b.total_estimate)], ['Paiement', b.payment_status === 'paid' ? `Payé en ligne : ${money(b.paid_amount)} · reste ${money(b.pay_on_pickup)} à régler à l’enseigne` : b.payment_status === 'refunded' ? 'Remboursé' : ''], ['Options choisies', (b.extras || []).map(x => `${x.qty > 1 ? x.qty + ' × ' : ''}${esc(x.name)} (${money(x.total)})`).join(', ')], ['Total estimé', b.total_estimate == null ? '' : money(b.total_estimate)],
        ['Message', esc(b.message)], ['Reçue le', fmtDate(b.created_at)],
      ]),
      actions: bookingActions(b),
    };
  }
  if (kind === 'application') {
    const a = DATA.applications.find(x => x.id === id); if (!a) return null;
    const status = { pending: badge('pending', 'À traiter'), approved: badge('approved', 'Acceptée'), rejected: badge('inactive', 'Refusée') }[a.status];
    return {
      eyebrow: 'Candidature partenaire', title: a.trade_name, status,
      body: kv([
        ['Raison sociale', esc(a.legal_name)], ['Numéro de SIRET', esc(a.siret)], ['Adresse du siège', esc(a.head_office)], ['Agence(s)', esc(a.agencies)], ['Responsable', esc(a.manager_name)],
        ['Email des réservations', esc(a.booking_email)], ['Email de contact', esc(a.contact_email)], ['Téléphone', esc(a.phone)], ['Référence Kbis', esc(a.kbis_name)],
        ['Email de connexion', esc(a.login_email)], ['Reçue le', fmtDate(a.created_at)],
      ]),
      actions: a.status === 'pending' && can('partners.manage') ? actionBtn('application-approve', a.id, 'Accepter', 'primary') + actionBtn('application-reject', a.id, 'Refuser', 'danger') : '',
    };
  }
  if (kind === 'message') {
    const m = DATA.messages.find(x => x.id === id); if (!m) return null;
    return {
      eyebrow: 'Message de contact', title: m.name, status: m.handled_at ? badge('active', 'Traité') : badge('pending', 'Nouveau'),
      body: kv([['E-mail', esc(m.email)], ['Objet', esc(m.subject)], ['Reçu le', fmtDate(m.created_at)], ['Message', `<span class="preline">${esc(m.message)}</span>`]]),
      actions: `<a class="btn small primary" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Votre message à TripVision')}">Répondre par e-mail</a>${actionBtn('message-toggle', m.id, m.handled_at ? 'Rouvrir' : 'Marquer traité')}`,
    };
  }
  if (kind === 'partner') {
    const p = DATA.partners.find(x => x.id === id); if (!p) return null;
    return {
      eyebrow: 'Partenaire', title: p.tradeName, status: badge(p.status),
      body: kv([
        ['Raison sociale', esc(p.legalName)], ['Numéro de SIRET', esc(p.siret)], ['Adresse du siège', esc(p.headOffice)], ['Agence(s)', esc(p.agencies)], ['Responsable', esc(p.managerName)],
        ['Email des réservations', esc(p.bookingEmail)], ['Email de contact', esc(p.contactEmail)], ['Téléphone', esc(p.phone)], ['Référence Kbis', esc(p.kbisName)], ['Créé le', fmtDate(p.created_at)],
      ]),
      actions: partnerActions(p),
    };
  }
  return null;
}

function openDrawer(kind, id) {
  const d = detailContent(kind, id);
  if (!d) return;
  if (kind === 'booking') {
    const b = DATA.bookings.find(x => x.id === id);
    if (b?.unseen_staff) { b.unseen_staff = false; document.querySelector(`#tblBookings tr[data-id="${CSS.escape(id)}"] .new-tag`)?.remove(); markSeen(`/admin/bookings/${id}/seen`); }
  }
  $('#drawer').innerHTML = `
    <header class="drawer-head"><div><span class="eyebrow">${esc(d.eyebrow)}</span><h3>${esc(d.title)}</h3><div class="drawer-status">${d.status}</div></div>
      <button class="icon-btn light" type="button" data-action="close-drawer" aria-label="Fermer">${icon('close')}</button></header>
    <div class="drawer-body">${d.image ? `<img class="drawer-img" src="${esc(d.image)}" alt="">` : ''}${d.images?.length > 1 ? `<div class="drawer-thumbs">${d.images.map(u => `<img src="${esc(u)}" alt="" data-thumb>`).join('')}</div>` : ''}${d.body}</div>
    <footer class="drawer-foot">${d.actions}</footer>`;
  $('#drawer').hidden = false;
  $('#overlay').hidden = false;
  document.body.classList.add('drawer-open');
  $('#drawer').querySelector('.icon-btn').focus();
}

/* ---------- Boutons d'actions (selon permissions) ---------- */
function offerActions(o, withExtras = false) {
  return [
    siteBtn('offer', o, 'Voir l’offre'),
    can('offers.edit') && actionBtn('offer-edit', o.id, 'Modifier'),
    !isArchived(o) && can('offers.edit') && actionBtn('offer-schedule', o.id, `${icon('clock')} Programmer`),
    !isArchived(o) && can('offers.edit') && (o.status === 'active' ? actionBtn('offer-deactivate', o.id, 'Désactiver', 'danger') : actionBtn('offer-activate', o.id, 'Activer', 'primary')),
    can('offers.delete') && actionBtn('offer-delete', o.id, 'Supprimer', 'danger'),
  ].filter(Boolean).join('');
}
function vehicleActions(v, withExtras = false) {
  return [
    siteBtn('vehicle', v, 'Voir l’annonce'),
    can('vehicles.edit') && actionBtn('vehicle-edit', v.id, 'Modifier'),
    can('vehicles.edit') && actionBtn('vehicle-schedule', v.id, `${icon('clock')} Programmer`),
    can('vehicles.edit') && (v.status === 'approved' ? actionBtn('vehicle-hide', v.id, 'Masquer', 'danger') : actionBtn('vehicle-approve', v.id, 'Publier', 'primary')),
    can('vehicles.delete') && actionBtn('vehicle-delete', v.id, 'Supprimer', 'danger'),
  ].filter(Boolean).join('');
}
function bookingActions(b) {
  // TripVision garde la trace des réservations : elles se gèrent (et s'annulent) auprès de l’enseigne, jamais ici.
  if (b.partner_owned) return '<span class="muted">Géré par l’enseigne</span>';
  return [
    can('bookings.manage') && b.status === 'pending' && actionBtn('booking-confirm', b.id, 'Confirmer', 'primary'),
  ].filter(Boolean).join('') || '<span class="muted">Trace conservée</span>';
}
function partnerActions(p) {
  return [
    can('partners.manage') && p.status !== 'approved' && actionBtn('partner-approve', p.id, 'Valider', 'primary'),
    can('partners.manage') && p.status !== 'inactive' && actionBtn('partner-suspend', p.id, 'Suspendre', 'danger'),
    can('partners.manage') && actionBtn('partner-reset', p.id, 'Réinit. mot de passe'),
    can('partners.delete') && actionBtn('partner-delete', p.id, 'Supprimer', 'danger'),
  ].filter(Boolean).join('');
}

/* ---------- Écrans ---------- */
const RENDERERS = {
  async overview() {
    const [d, fr, st] = await Promise.all([api('/admin/dashboard'), api('/admin/freshness').catch(() => null), api('/admin/booking-stats').catch(() => null)]);
    Object.assign(DATA, { offers: d.offers, vehicles: d.vehicles, bookings: d.bookings, partners: d.partners });
    const pendingVehicles = d.vehicles.filter(v => v.status === 'pending').length;
    const pendingPartners = d.partners.filter(p => p.status === 'pending').length;
    const pendingBookings = d.bookings.filter(b => b.status === 'pending').length;
    const pendingRequests = (d.offerRequests || []).filter(r => r.status === 'pending').length;
    const canPartners = can('partners.manage');
    const unreadMessages = d.unreadMessages || 0;
    const pendingApplications = canPartners ? (d.pendingApplications || 0) : 0;
    const unreadChats = d.unreadChats || 0;
    const total = pendingVehicles + pendingBookings + pendingRequests + unreadMessages + unreadChats + pendingApplications + (canPartners ? pendingPartners : 0);
    const first = String(user.name || '').split(' ')[0] || 'vous';
    const todo = [
      [pendingVehicles, 'annonce(s) véhicule à valider', 'vehicles'],
      [pendingBookings, 'réservation(s) à confirmer', 'bookings'],
      [pendingRequests, 'demande(s) de vols ou de packs à confirmer', 'bookings'],
      [unreadMessages, 'message(s) de contact à traiter', 'notifications'],
      [unreadChats, 'message(s) de partenaires non lus', 'chats'],
      ...(canPartners ? [[pendingApplications, 'candidature(s) de partenaires à traiter', 'applications']] : []),
      ...(canPartners ? [[pendingPartners, 'partenaire(s) à valider', 'partners']] : []),
    ];
    const scheduled = [
      ...d.offers.filter(isScheduled).map(o => ({ kind: 'offer', label: 'Offre', item: o, title: o.title })),
      ...d.vehicles.filter(isScheduled).map(v => ({ kind: 'vehicle', label: 'Annonce', item: v, title: v.model })),
    ].sort((a, b) => new Date(a.item.publish_at) - new Date(b.item.publish_at)).slice(0, 5);
    const recent = d.bookings.slice(0, 5);
    const pct = fr && fr.hours != null ? Math.min(100, Math.round(fr.hours / fr.limit * 100)) : 100;
    const fresh = fr ? `<section class="card fresh ${fr.overdue ? 'late' : pct >= 75 ? 'soon' : 'ok'}">
        <div class="fresh-ic">${icon('clock')}</div>
        <div class="fresh-main"><h3>${fr.overdue ? 'De nouvelles offres sont attendues' : 'Rythme de publication : à jour'}</h3>
          <p>${fr.hours == null ? 'Aucune offre n’est encore publiée.' : fr.overdue ? `La dernière offre date d’il y a ${fr.hours} h : il en faut de nouvelles au moins toutes les ${fr.limit} h.` : `Dernière offre il y a ${fr.hours} h · la prochaine est attendue dans les ${fr.limit - fr.hours} h.`} <span class="muted">${plural(fr.week, 'offre créée', 'offres créées')} ces 7 jours.</span></p>
          <div class="fresh-bar" aria-hidden="true"><i style="width:${pct}%"></i></div></div>
        ${can('offers.create') ? '<a class="btn primary" href="#offers">+ Publier une offre</a>' : ''}
      </section>` : '';
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Tableau de bord</span>
          <h3>Bonjour ${esc(first)}, <em>voici votre journée.</em></h3>
          <p>${total ? 'Des éléments attendent votre validation pour rester en ligne.' : 'Tout est à jour. Aucune action en attente.'}</p>
        </div>
        <div class="hero-count"><strong>${total}</strong><span>${total > 1 ? 'Actions en attente' : 'Action en attente'}</span></div>
      </section>
      ${fresh}
      <div class="kpis">
        ${canPartners ? `<div class="kpi"><div class="kpi-icon">${icon('partners')}</div><div><strong>${d.partners.length}</strong><span>Partenaires</span></div></div>` : ''}
        <div class="kpi"><div class="kpi-icon">${icon('vehicles')}</div><div><strong>${d.vehicles.length}</strong><span>Annonces</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('offers')}</div><div><strong>${d.offers.length}</strong><span>Vols &amp; packs</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('bookings')}</div><div><strong>${d.bookings.length + (d.offerRequests || []).length}</strong><span>Réservations & demandes</span></div></div>
      </div>
      ${st ? `<section class="card"><div class="card-head"><div><h3>Réservations enregistrées</h3><p>Voitures, packs et vols réservés : TripVision en garde la trace.</p></div><a class="btn small" href="#bookings">Voir le suivi</a></div>${statsCards(st)}</section>` : ''}
      <section class="card">
        <div class="card-head"><div><h3>À traiter</h3><p>Ce qui demande une décision de votre part</p></div><button class="btn small" type="button" data-action="reload" title="Actualiser les données">${icon('refresh')} Actualiser</button></div>
        <div class="todo">${todo.map(([n, label, to]) => `<a href="#${to}"><b>${n}</b><span>${label}</span><i>→</i></a>`).join('')}</div>
      </section>
      <section class="card">
        <div class="card-head"><div><h3>Publications programmées</h3><p>${scheduled.length ? 'Prochaines mises en ligne automatiques' : 'Aucune publication programmée'}</p></div></div>
        ${scheduled.length ? `<div class="todo">${scheduled.map(s => `<a href="#" data-detail="${s.kind}" data-id="${esc(s.item.id)}"><b>${icon('clock')}</b><span><strong>${esc(s.title)}</strong> <span class="muted">· ${s.label}</span></span><span class="muted">${fmtDate(s.item.publish_at)}</span></a>`).join('')}</div>` : ''}
      </section>
      <section class="card">
        <div class="card-head"><div><h3>Dernières réservations</h3><p>${plural(recent.length, 'demande récente', 'demandes récentes')}</p></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Référence</th><th>Client</th><th>Véhicule</th><th>Statut</th></tr></thead>
          <tbody>${recent.map(b => `<tr class="clickable" data-detail="booking" data-id="${esc(b.id)}"><td><strong>${esc(b.reference)}</strong></td><td>${esc(b.customer_name)}</td><td>${esc(b.vehicle_name)}</td><td>${badge(b.status)}</td></tr>`).join('') || emptyRow(4, 'Aucune réservation')}</tbody>
        </table></div>
      </section>`;
  },

  async vehicles() {
    const [{ vehicles, partners }, fr] = await Promise.all([api('/admin/dashboard'), api('/admin/franchise').catch(() => null)]);
    if (fr) { FR.amount = fr.amount; FR.protection = fr.protectionPerDay; }
    DATA.vehicles = vehicles;
    DATA.partners = partners;
    const rows = vehicles.map(v => `<tr class="clickable"${fa({ status: pubKey(v), category: v.category, owner: v.partner_company })} data-detail="vehicle" data-id="${esc(v.id)}">
      <td><strong>${esc(v.model)}</strong></td><td>${esc(v.category)}</td><td>${esc(v.partner_company)}</td>
      <td class="num">${money(v.priceDay)}</td><td>${pubBadge(v)}</td>
      <td class="actions"><span class="row-actions">${vehicleActions(v)}</span></td></tr>`).join('');
    return pageHead('Opérations', 'Annonces <em>véhicules</em>', 'Cliquez sur une annonce pour la consulter. Ajoutez-en une, publiez-la ou programmez sa mise en ligne.',
      `${can('franchise.manage') || can('settings.manage') ? `<button class="btn" type="button" data-action="franchise-edit">${icon('shield')} Franchise${FR.amount ? ` · ${money(FR.amount)}` : ''}</button>` : ''}${can('vehicles.create') ? '<button class="btn primary" type="button" data-action="vehicle-new">+ Nouvelle annonce</button>' : ''}`)
      + tableCard({ id: 'tblVehicles', title: 'Annonces', count: plural(vehicles.length, 'annonce', 'annonces'), head: ['Modèle', 'Catégorie', 'Partenaire', 'Prix / jour', 'Publication', ''], rows, empty: 'Aucune annonce', cols: 6, filters: [{ key: 'status', label: 'Statut', options: [['approved', 'En ligne'], ['rented', 'Loué'], ['draft', 'Brouillon'], ['scheduled', 'Programmée'], ['pending', 'En attente'], ['inactive', 'Masquée']] }, { key: 'category', label: 'Catégorie', options: TVVehicleForm.CATEGORIES.map(c => [c, c]) }, { key: 'owner', label: 'Propriétaire', options: uniq(vehicles.map(v => v.partner_company)) }] });
  },

  async offers() {
    const { offers } = await api('/admin/dashboard');
    DATA.offers = offers;
    const rows = offers.map(o => `<tr class="clickable"${fa({ status: pubKey(o), country: o.country })} data-detail="offer" data-type="${o.type}" data-id="${esc(o.id)}">
      <td><span class="badge plain">${o.type === 'flight' ? 'Vol' : 'Pack'}</span></td><td><strong>${esc(o.title)}</strong></td><td>${esc(o.to_city)}</td>
      <td class="num">${money(o.price)}</td><td>${pubBadge(o)}</td>
      <td class="actions"><span class="row-actions">${offerActions(o)}</span></td></tr>`).join('');
    return pageHead('Opérations', 'Vols <em>& packs</em>', 'Cliquez sur une offre pour la consulter. Publiez-la tout de suite ou programmez-la.',
      can('offers.create') ? '<button class="btn" type="button" data-action="offer-new-flight">+ Nouveau vol</button><button class="btn primary" type="button" data-action="offer-new-pack">+ Nouveau pack</button>' : '')
      + '<div class="pills" role="group" aria-label="Filtrer par type"><button type="button" class="pill active" data-type-filter="all">Tous</button><button type="button" class="pill" data-type-filter="flight">Vols</button><button type="button" class="pill" data-type-filter="pack">Packs</button></div>'
      + tableCard({ id: 'tblOffers', title: 'Offres', count: plural(offers.length, 'offre', 'offres'), head: ['Type', 'Titre', 'Destination', 'Prix', 'Publication', ''], rows, empty: 'Aucune offre', cols: 6, filters: [{ key: 'status', label: 'Statut', options: [['active', 'En ligne'], ['scheduled', 'Programmée'], ['inactive', 'Désactivée'], ['archived', 'Archivée']] }, { key: 'country', label: 'Pays', options: uniq(offers.map(o => o.country)) }] });
  },

  async bookings() {
    const [{ bookings, offerRequests }, st] = await Promise.all([api('/admin/dashboard'), api('/admin/booking-stats').catch(() => null)]);
    DATA.bookings = bookings;
    DATA.requests = offerRequests || [];
    const rows = bookings.map(b => `<tr class="clickable"${fa({ status: b.status })} data-detail="booking" data-id="${esc(b.id)}">
      <td><strong>${esc(b.reference)}</strong>${b.payment_status === 'paid' ? ' <span class="badge ok">Payé</span>' : b.payment_status === 'refunded' ? ' <span class="badge plain">Remboursé</span>' : ''}${b.unseen_staff ? ' <span class="badge warn new-tag">Nouveau</span>' : ''}${b.young_driver_notice ? '<span class="muted">Jeune conducteur</span>' : ''}</td>
      <td>${esc(b.customer_name)}<span class="muted">${esc(b.customer_email)}</span></td>
      <td>${esc(b.vehicle_name)}${b.company ? `<span class="muted">Entreprise : <b>${esc(b.company)}</b></span>` : ''}</td>
      <td class="num">${fmtDay(b.start_date)} → ${fmtDay(b.end_date)}</td>
      <td>${badge(b.status)}</td>
      <td class="actions"><span class="row-actions">${bookingActions(b)}</span></td></tr>`).join('');
    const reqRows = DATA.requests.map(r => `<tr class="clickable"${fa({ status: r.status, type: r.offer_type })} data-action="request-seen" data-id="${esc(r.id)}">
      <td><strong>${esc(refOfRequest(r))}</strong>${r.staff_seen_at ? '' : ' <span class="badge warn new-tag">Nouveau</span>'}<span class="muted">${r.offer_type === 'flight' ? 'Vol' : 'Pack'}</span></td>
      <td>${esc(r.customer_name)}<span class="muted">${esc(r.customer_email)}${r.customer_phone ? ' · ' + esc(r.customer_phone) : ''}</span></td>
      <td>${esc(r.offer_title)}${r.trip_type ? ` <span class="badge plain">${r.trip_type === 'oneway' ? 'Aller simple' : 'Aller-retour'}</span>` : ''}<span class="muted">${esc(r.summary)}</span><span class="muted">Entreprise : <b>${esc(r.partner_name || 'TripVision')}</b></span></td>
      <td class="num">${r.travelers} · ${money(r.total)}</td>
      <td>${badge(r.status === 'cancelled' ? 'inactive' : r.status)}${r.payment_status === 'paid' ? ` <span class="badge ok">Payé ${esc(money(r.paid_amount))}</span>` : r.payment_status === 'refunded' ? ' <span class="badge off">Remboursé</span>' : ''}</td>
      <td class="actions"><span class="row-actions">${requestActions(r)}</span></td></tr>`).join('');
    return pageHead('Opérations', 'Suivi <em>des réservations</em>', 'Cliquez sur une réservation pour voir tous les détails.')
      + (st ? `<section class="card"><div class="card-head"><div><h3>Réservations enregistrées</h3><p>Nombre de réservations faites sur la période, tous services confondus.</p></div></div>${statsCards(st)}</section>` : '')
      + `<div class="info-strip">${icon('alert')}<p>TripVision garde la <b>trace</b> de chaque réservation. Une réservation faite auprès d’une enseigne ou d’une compagnie ne s’annule pas depuis le back-office : c’est à l’enseigne ou à la compagnie de le faire.</p></div>`
      + tableCard({ id: 'tblRequests', title: 'Demandes vols & packs', count: plural(DATA.requests.length, 'demande', 'demandes'), head: ['Référence', 'Client', 'Offre', 'Voyageurs · Total', 'Statut', ''], rows: reqRows, empty: 'Aucune demande de vol ou de pack', cols: 6, filters: [{ key: 'status', label: 'Statut', options: [['pending', 'En attente'], ['confirmed', 'Confirmée'], ['cancelled', 'Annulée par la compagnie ou l’enseigne']] }, { key: 'type', label: 'Type', options: [['flight', 'Vols'], ['pack', 'Packs']] }] })
      + tableCard({ id: 'tblBookings', title: 'Réservations', count: plural(bookings.length, 'réservation', 'réservations'), head: ['Référence', 'Client', 'Véhicule', 'Dates', 'Statut', ''], rows, empty: 'Aucune réservation', cols: 6, filters: [{ key: 'status', label: 'Statut', options: [['pending', 'En attente'], ['confirmed', 'Confirmée'], ['inactive', 'Annulée par l’enseigne']] }] });
  },

  async notifications() {
    const list = await api('/notifications');
    DATA.notifications = list;
    const unread = list.filter(n => !n.read_at).length;
    const KINDS = [['booking', 'Réservations'], ['request', 'Vols & packs'], ['contact', 'Contact'], ['chat', 'Messagerie'], ['application', 'Candidatures']];
    return pageHead('Opérations', '<em>Notifications</em>', 'Tout ce qui demande votre attention : réservations, demandes de vols et de packs, messages de contact, candidatures. Ouvrez une notification pour la traiter et la marquer comme lue.',
      `<button class="btn small" type="button" data-action="notif-read-all" ${unread ? '' : 'disabled'}>Tout marquer comme lu</button><button class="btn small" type="button" data-action="reload">${icon('refresh')} Actualiser</button><a class="btn small" href="#messages">Tous les messages de contact</a>`)
      + `<section class="card">
        <div class="card-head"><div><h3>Fil d’activité</h3><p>${unread ? plural(unread, 'non lue', 'non lues') : 'Tout est lu'} · ${plural(list.length, 'notification', 'notifications')}</p></div>
          <div class="card-tools"><div class="pillbar"><button type="button" class="pill active" data-notif-state="all">Toutes</button><button type="button" class="pill" data-notif-state="unread">Non lues</button></div>
          <select class="filter-select" data-notif-kind aria-label="Type"><option value="">Type : tous</option>${KINDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div></div>
        <div class="notif-list" id="notifList">${notifItems(list)}</div>
        <div class="empty no-results" id="notifNone" ${list.length ? 'hidden' : ''}>${icon('notifications')}<strong>Aucune notification</strong><span>Les nouvelles activités apparaîtront ici.</span></div></section>`;
  },

  async messages() {
    const list = await api('/admin/messages');
    DATA.messages = list;
    const rows = list.map(m => `<tr class="clickable"${fa({ status: m.handled_at ? 'handled' : 'new' })} data-detail="message" data-id="${esc(m.id)}">
      <td class="num">${fmtDate(m.created_at)}</td>
      <td><strong>${esc(m.name)}</strong><span class="muted">${esc(m.email)}</span></td>
      <td>${m.subject ? `<strong>${esc(m.subject)}</strong><span class="muted">` : '<span>'}${esc(m.message.slice(0, 90))}${m.message.length > 90 ? '…' : ''}</span></td>
      <td>${m.handled_at ? badge('active', 'Traité') : badge('pending', 'Nouveau')}</td>
      <td class="actions"><span class="row-actions"><a class="btn small" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Votre message à TripVision')}">Répondre</a>${actionBtn('message-toggle', m.id, m.handled_at ? 'Rouvrir' : 'Marquer traité', m.handled_at ? '' : 'primary')}</span></td></tr>`).join('');
    return pageHead('Opérations', 'Messages <em>de contact</em>', 'Les messages envoyés depuis le formulaire du site. Cliquez pour lire le message en entier.')
      + tableCard({ id: 'tblMessages', title: 'Messages', count: plural(list.length, 'message', 'messages'), head: ['Reçu le', 'Expéditeur', 'Message', 'Statut', ''], rows, empty: 'Aucun message', cols: 5, filters: [{ key: 'status', label: 'Statut', options: [['new', 'Nouveau'], ['handled', 'Traité']] }] });
  },

  async applications() {
    const list = await api('/admin/partner-applications');
    DATA.applications = list;
    const labels = { pending: badge('pending', 'À traiter'), approved: badge('approved', 'Acceptée'), rejected: badge('inactive', 'Refusée') };
    const rows = list.map(a => `<tr class="clickable"${fa({ status: a.status })} data-detail="application" data-id="${esc(a.id)}">
      <td class="num">${fmtDate(a.created_at)}</td>
      <td><strong>${esc(a.trade_name)}</strong><span class="muted">${esc(a.legal_name)}</span></td>
      <td>${esc(a.manager_name)}<span class="muted">${esc(a.contact_email)}</span></td>
      <td>${esc(a.login_email)}</td><td>${labels[a.status]}</td>
      <td class="actions"><span class="row-actions">${a.status === 'pending' && can('partners.manage') ? actionBtn('application-approve', a.id, 'Accepter', 'primary') + actionBtn('application-reject', a.id, 'Refuser', 'danger') : ''}</span></td></tr>`).join('');
    const pending = list.filter(a => a.status === 'pending').length;
    return pageHead('Gouvernance', 'Candidatures <em>de partenaires</em>', 'Demandes envoyées depuis le site. En acceptant, le partenaire est créé et reçoit son e-mail d’activation.')
      + tableCard({ id: 'tblApplications', title: 'Candidatures', count: `${pending} à traiter sur ${plural(list.length, 'demande', 'demandes')}`, head: ['Reçue le', 'Entreprise', 'Responsable', 'E-mail de connexion', 'Statut', ''], rows, empty: 'Aucune candidature', cols: 6, filters: [{ key: 'status', label: 'Statut', options: [['pending', 'À traiter'], ['approved', 'Acceptée'], ['rejected', 'Refusée']] }] });
  },

  async trends() {
    const period = DATA.trendPeriod || '30d';
    const [t, pub] = await Promise.all([api(`/admin/trends?period=${period}`), api('/public/trending').catch(() => null)]);
    const n = (v) => Number(v || 0).toLocaleString('fr-FR');
    const PERIODS = [['month', 'Ce mois-ci'], ['30d', '30 jours'], ['90d', '90 jours'], ['12m', '12 mois']];
    const kpi = (ic, v, label) => `<div class="kpi"><div class="kpi-icon">${icon(ic)}</div><div><strong>${n(v)}</strong><span>${label}</span></div></div>`;
    const bars = (title, sub, list, label, extra) => {
      const max = Math.max(1, ...list.map(x => x.score));
      return `<section class="card trend-card"><div class="card-head"><div><h3>${title}</h3><p>${sub}</p></div></div>
        ${list.length ? `<ol class="trend-list">${list.map((x, i) => `<li><span class="trend-rank">${i + 1}</span><div class="trend-main"><div class="trend-line"><strong>${esc(label(x))}</strong><em>${extra(x)}</em></div><div class="trend-bar"><i style="width:${Math.max(6, Math.round(x.score / max * 100))}%"></i></div></div></li>`).join('')}</ol>` : '<p class="muted trend-empty">Pas encore de données sur cette période.</p>'}</section>`;
    };
    const detail = (x) => [x.views && `${n(x.views)} vue${x.views > 1 ? 's' : ''}`, x.clicks && `${n(x.clicks)} clic${x.clicks > 1 ? 's' : ''}`, x.searches && `${n(x.searches)} recherche${x.searches > 1 ? 's' : ''}`, x.bookings && `<b>${n(x.bookings)} réservation${x.bookings > 1 ? 's' : ''}</b>`].filter(Boolean).join(' · ') || '—';
    const days = t.daily, maxD = Math.max(1, ...days.map(d => d.n));
    const W = 640, H = 120, pts = days.map((d, i) => [days.length > 1 ? i / (days.length - 1) * W : W / 2, H - 8 - (d.n / maxD) * (H - 24)]);
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const spark = days.length ? `<svg viewBox="0 0 ${W} ${H}" class="trend-spark" preserveAspectRatio="none" aria-label="Activité par jour"><path d="${line} L${W} ${H} L0 ${H} Z" class="area"/><path d="${line}" class="ln"/></svg>` : '<p class="muted trend-empty">L’activité apparaîtra ici dès les premières visites.</p>';
    const feat = pub ? `<section class="card trend-card trend-feature"><div class="card-head"><div><h3>Mise en avant sur le site</h3><p>Affichée automatiquement sur l’accueil : « Tendances de ${esc(pub.monthName)} ». Recalculée sur les 30 derniers jours, sans rien faire.</p></div><span class="badge ${pub.estimated ? 'warn' : 'ok'}">${pub.estimated ? 'Démarrage : offres les plus fournies' : 'Basée sur les visites'}</span></div>
        <div class="trend-chips">${pub.cities.map(c => `<span class="trend-chip"><b>#${c.rank}</b> ${esc(c.city)}${c.country ? ` <small>${esc(c.country)}</small>` : ''}</span>`).join('')}</div></section>` : '';
    return pageHead('Analyse', 'Tendances <em>du site</em>', 'Ce que les visiteurs consultent, cliquent, recherchent et réservent. Les destinations les plus populaires remontent d’elles-mêmes sur le site public.',
      `<div class="pillbar" role="group" aria-label="Période">${PERIODS.map(([k, l]) => `<button type="button" class="pill ${k === period ? 'active' : ''}" data-action="trend-period" data-id="${k}">${l}</button>`).join('')}</div>`)
      + `<div class="kpis">${kpi('overview', t.totals.views, 'Pages consultées')}${kpi('external', t.totals.clicks, 'Clics vers les compagnies')}${kpi('search', t.totals.searches, 'Recherches lancées')}${kpi('bookings', t.totals.bookings, 'Réservations & demandes')}</div>`
      + `<section class="card trend-card"><div class="card-head"><div><h3>Activité du site</h3><p>Visites, clics et recherches par jour.</p></div></div>${spark}</section>`
      + feat
      + `<div class="trend-grid">`
      + bars('Pays les plus populaires', 'Consultés, cherchés et réservés', t.countries, x => x.country, detail)
      + bars('Villes et destinations', 'Les plus recherchées et réservées', t.cities, x => x.city + (x.country ? ` · ${x.country}` : ''), detail)
      + bars('Vols les plus cliqués', 'Clics vers l’offre de la compagnie', t.flights, x => x.label || 'Vol', detail)
      + bars('Packs les plus vus', 'Fiches consultées et réservations', t.packs, x => x.label || 'Pack', detail)
      + bars('Voitures les plus consultées', 'Fiches ouvertes et réservations', t.cars, x => (x.label || 'Véhicule') + (x.city ? ` · ${x.city}` : ''), detail)
      + bars('Villes de location', 'Où l’on cherche une voiture', t.carCities, x => x.city, detail)
      + `</div>`;
  },

  async chats() {
    const [list, st, canned] = await Promise.all([api('/admin/chats'), api('/admin/chats-stats').catch(() => null), api('/admin/chat-canned').catch(() => [])]);
    DATA.chats = list;
    DATA.canned = canned;
    const min = (m) => (m == null ? '—' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60 * 10) / 10} h` : `${Math.round(m / 1440 * 10) / 10} j`);
    const kpi = (ic, v, label) => `<div class="kpi"><div class="kpi-icon">${icon(ic)}</div><div><strong>${v}</strong><span>${label}</span></div></div>`;
    const kpis = st ? `<div class="kpis">${kpi('chats', st.open, 'À traiter')}${kpi('clock', st.pending, 'En attente du client')}${kpi('check', st.closed, 'Clôturées')}${kpi('clock', min(st.first_response_min), '1ʳᵉ réponse (30 j)')}${kpi('profile', st.rated ? `${String(st.rating).replace('.', ',')} / 5` : '—', `Satisfaction${st.rated ? ` · ${plural(st.rated, 'avis', 'avis')}` : ''}`)}</div>` : '';
    const open = list.filter(t => t.status !== 'closed').length;
    const rows = list.map(t => `<tr class="clickable"${fa({ state: t.status === 'closed' ? 'closed' : t.status === 'pending' ? 'pending' : t.unread > 0 ? 'unread' : 'open', owner: t.assigned_to === user.id ? 'mine' : t.assigned_to ? 'other' : 'none' })} data-detail="chat" data-id="${esc(t.id)}">
      <td><strong>${esc(t.subject || 'Conversation')}</strong><span class="muted">${esc(t.partner_name)} · ${t.kind === 'client' ? 'Client' : 'Partenaire'}</span></td>
      <td>${t.last_sender === 'admin' ? '<span class="muted">Vous : </span>' : ''}<span data-last>${esc(String(t.last_message || '').slice(0, 90))}</span><span class="muted">${t.messages} message${t.messages > 1 ? 's' : ''}</span></td>
      <td>${t.assigned_name ? `<span class="who-sm"><span class="avatar sm">${esc(initials(t.assigned_name))}</span>${esc(t.assigned_name)}</span>` : '<span class="muted">Non attribuée</span>'}</td>
      <td class="num">${fmtDate(t.updated_at)}</td>
      <td>${chatBadge(t)}${t.rating ? `<span class="rating" title="${t.rating}/5">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</span>` : ''}</td></tr>`).join('');
    const cannedCard = `<section class="card"><div class="card-head"><div><h3>Réponses types</h3><p>Des réponses toutes prêtes, à insérer en un clic dans une conversation.</p></div>${can('chats.manage') ? '<button class="btn small primary" type="button" data-action="canned-add">+ Nouvelle réponse type</button>' : ''}</div>
      <div class="canned-list">${canned.map(c => `<div class="canned"><div><strong>${esc(c.title)}</strong><p>${esc(c.body)}</p></div>${can('chats.manage') ? `<button class="btn small danger" type="button" data-action="canned-del" data-id="${esc(c.id)}">Retirer</button>` : ''}</div>`).join('') || '<p class="muted">Aucune réponse type.</p>'}</div></section>`;
    return pageHead('Opérations', 'Messagerie <em>clients & partenaires</em>', 'Chaque conversation a son statut : à traiter, en attente du client ou clôturée (automatiquement après ' + (st?.autoCloseDays || 7) + ' jours sans réponse). Prenez-la en charge, ajoutez des notes internes et répondez avec vos réponses types.')
      + kpis
      + tableCard({ id: 'tblChats', title: 'Conversations', count: `${open} en cours · ${list.length} au total`, head: ['Sujet', 'Dernier message', 'Attribuée à', 'Mise à jour', 'Statut'], rows, empty: 'Aucune conversation', cols: 5, filters: [{ key: 'state', label: 'Statut', options: [['unread', 'Non lues'], ['open', 'À traiter'], ['pending', 'En attente du client'], ['closed', 'Clôturées']] }, { key: 'owner', label: 'Attribution', options: [['mine', 'Mes conversations'], ['none', 'Non attribuées'], ['other', 'Attribuées à un collègue']] }] })
      + cannedCard;
  },

  async partners() {
    const { partners } = await api('/admin/dashboard');
    DATA.partners = partners;
    const rows = partners.map(p => `<tr class="clickable"${fa({ status: p.status })} data-detail="partner" data-id="${esc(p.id)}">
      <td><strong>${esc(p.legalName)}</strong></td><td>${esc(p.tradeName)}</td><td>${esc(p.bookingEmail)}</td><td>${badge(p.status)}</td>
      <td class="actions"><span class="row-actions">${partnerActions(p)}</span></td></tr>`).join('');
    const fields = `
      ${field('Raison sociale', 'name="legalName" required minlength="2" placeholder="Nom légal de l’entreprise"')}
      ${field('Nom commercial', 'name="tradeName" required minlength="2" placeholder="Nom visible par les clients"')}
      ${field('Adresse du siège', 'name="headOffice" required minlength="2" placeholder="Adresse complète"')}
      ${field('Agence(s)', 'name="agencies" required minlength="2" placeholder="Adresse de la ou des agences"')}
      ${field('Numéro de SIRET', 'name="siret" required minlength="2" placeholder="Numéro SIRET"')}
      ${field('Email des réservations', 'name="bookingEmail" type="email" required placeholder="reservations@entreprise.fr"')}
      ${field('Email de contact', 'name="contactEmail" type="email" required placeholder="contact@entreprise.fr"')}
      ${field('Responsable', 'name="managerName" required minlength="2" placeholder="Nom et prénom"')}
      ${field('Téléphone', 'name="phone" type="tel" placeholder="Téléphone professionnel"')}
      ${field('Référence Kbis', 'name="kbisName" placeholder="Nom du fichier ou référence"')}
      ${field('Email de connexion du partenaire', 'name="loginEmail" type="email" required placeholder="L’identifiant de son accès"', true)}`;
    return pageHead('Gouvernance', 'Réseau <em>de partenaires</em>', 'Créez les accès partenaires et contrôlez leur statut.')
      + (can('partners.manage') ? formCard('partnerForm', 'Nouveau partenaire', 'Un e-mail d’activation sera envoyé à son adresse de connexion.', fields, 'Créer le partenaire') : '')
      + tableCard({ id: 'tblPartners', title: 'Partenaires', count: plural(partners.length, 'partenaire', 'partenaires'), head: ['Raison sociale', 'Nom commercial', 'E-mail', 'Statut', ''], rows, empty: 'Aucun partenaire', cols: 5, filters: [{ key: 'status', label: 'Statut', options: [['approved', 'Validé'], ['pending', 'En attente'], ['inactive', 'Suspendu']] }] });
  },

  async accounts() {
    const list = await api('/admin/accounts');
    DATA.accounts = list;
    const rows = list.map(a => {
      const self = a.id === user.id;
      const count = Object.values(a.permissions).filter(Boolean).length;
      const actions = [
        a.can.edit && actionBtn('account-edit', a.id, 'Modifier'),
        a.can.edit && actionBtn('account-reset', a.id, 'Réinit. mot de passe'),
        a.can.edit && (a.active ? actionBtn('account-block', a.id, 'Bloquer', 'danger') : actionBtn('account-unblock', a.id, 'Débloquer', 'primary')),
        a.can.delete && actionBtn('account-delete', a.id, 'Supprimer', 'danger'),
      ].filter(Boolean).join('');
      return `<tr${fa({ role: a.role, state: a.active ? 'active' : 'blocked' })}>
        <td><div class="who"><span class="avatar sm">${esc(initials(a.name))}</span><div><strong>${esc(a.name)}${self ? ' <span class="badge plain">Vous</span>' : ''}</strong><span class="muted">${esc(a.email)}</span></div></div></td>
        <td><span class="badge plain">${esc(ROLE_LABELS[a.role])}</span>${a.role !== 'it' ? `<span class="muted">${plural(count, 'droit', 'droits')}</span>` : '<span class="muted">Accès complet</span>'}</td>
        <td>${a.active ? badge('active', 'Actif') : badge('inactive', 'Bloqué')}${a.reset_requested_at ? `<span class="badge warn" title="${fmtDate(a.reset_requested_at)}">Mot de passe oublié</span>` : ''}</td>
        <td class="num">${a.last_login_at ? fmtDate(a.last_login_at) : 'Jamais'}</td>
        <td class="actions"><span class="row-actions">${actions || '<span class="muted">—</span>'}</span></td></tr>`;
    }).join('');
    const creatable = can('accounts.create') && (MANAGEABLE[user.role] || []).length;
    return pageHead('Gouvernance', 'Comptes <em>internes</em>', 'Définissez précisément ce que chaque compte peut faire. Nul ne peut agir sur un rôle supérieur ni sur son propre compte.',
      creatable ? `<button class="btn primary" type="button" data-action="account-new">+ Nouveau compte</button>` : '')
      + tableCard({ id: 'tblAccounts', title: 'Équipe interne', count: plural(list.length, 'compte', 'comptes'), head: ['Utilisateur', 'Rôle', 'État', 'Dernière connexion', ''], rows, empty: 'Aucun compte', cols: 5, filters: [{ key: 'role', label: 'Rôle', options: [['it', 'IT'], ['manager', 'Manager'], ['admin', 'Agent']] }, { key: 'state', label: 'État', options: [['active', 'Actif'], ['blocked', 'Bloqué']] }] });
  },

  async clients() {
    const list = await api('/admin/clients');
    DATA.clients = list;
    const rows = list.map(c => {
      const actions = [
        can('accounts.edit') && actionBtn('client-reset', c.id, 'Réinit. mot de passe'),
        can('accounts.edit') && (c.active ? actionBtn('client-block', c.id, 'Bloquer', 'danger') : actionBtn('client-unblock', c.id, 'Débloquer', 'primary')),
        can('accounts.delete') && actionBtn('client-delete', c.id, 'Supprimer', 'danger'),
      ].filter(Boolean).join('');
      return `<tr class="clickable"${fa({ state: c.active ? 'active' : 'blocked' })} data-detail="client" data-id="${esc(c.id)}">
        <td><div class="who"><span class="avatar sm">${esc(initials(c.name))}</span><div><strong>${esc(c.name)}</strong><span class="muted">${esc(c.email)}${c.phone ? ' · ' + esc(c.phone) : ''}</span></div></div></td>
        <td class="num">${c.bookings + c.requests}<span class="muted">${plural(c.bookings, 'voiture', 'voitures')} · ${plural(c.requests, 'vol/pack', 'vols/packs')}</span></td>
        <td>${c.active ? badge('active', 'Actif') : badge('inactive', 'Bloqué')}${c.reset_requested_at ? '<span class="badge warn">Mot de passe oublié</span>' : ''}</td>
        <td class="num">${fmtDay(c.created_at)}</td><td class="num">${c.last_login_at ? fmtDate(c.last_login_at) : 'Jamais'}</td>
        <td class="actions"><span class="row-actions">${actions || '<span class="muted">—</span>'}</span></td></tr>`;
    }).join('');
    return pageHead('Gouvernance', '<em>Clients</em>', 'Comptes créés par les voyageurs sur le site. Cliquez sur un client pour voir ses réservations, le bloquer ou réinitialiser son accès.')
      + tableCard({ id: 'tblClients', title: 'Comptes clients', count: plural(list.length, 'client', 'clients'), head: ['Client', 'Réservations', 'État', 'Inscrit le', 'Dernière connexion', ''], rows, empty: 'Aucun client inscrit', cols: 6, filters: [{ key: 'state', label: 'État', options: [['active', 'Actifs'], ['blocked', 'Bloqués']] }] });
  },

  async categories() {
    const list = await api('/admin/categories');
    DATA.categories = list;
    const rows = list.map(c => `<tr${fa({ state: c.active ? 'on' : 'off' })}>
      <td><div class="who">${c.image ? `<img class="cat-thumb" src="${esc(c.image)}" alt="">` : '<span class="avatar sm">—</span>'}<div><strong>${esc(c.name)}</strong><span class="muted">${c.image ? 'Image personnalisée' : 'Sans image : photo d’une annonce utilisée'}</span></div></div></td>
      <td class="num">${c.vehicles}</td><td class="num">${c.position}</td><td>${c.active ? badge('active', 'Affichée') : badge('inactive', 'Masquée')}</td>
      <td class="actions"><span class="row-actions">${actionBtn('category-edit', c.id, 'Modifier')}${actionBtn('category-delete', c.id, 'Supprimer', 'danger')}</span></td></tr>`).join('');
    return pageHead('Opérations', '<em>Catégories</em> de voitures', 'Les catégories proposées aux enseignes et affichées sur le site public (nom et image). Une image claire sur fond blanc donne le meilleur rendu.', actionBtn('category-add', '', '+ Ajouter une catégorie', 'primary'))
      + tableCard({ id: 'tblCategories', title: 'Catégories', count: plural(list.length, 'catégorie', 'catégories'), head: ['Catégorie', 'Annonces', 'Ordre', 'État', ''], rows, empty: 'Aucune catégorie', cols: 5, filters: [{ key: 'state', label: 'État', options: [['on', 'Affichées'], ['off', 'Masquées']] }] });
  },

  async mailing() {
    const [{ contacts, stats }, leadsData] = await Promise.all([api('/admin/mailing'), api('/admin/flight-leads').catch(() => null)]);
    DATA.mailing = contacts;
    const leadRows = (leadsData?.leads || []).map(l => `<tr data-f-consent="${l.consent ? 'yes' : 'no'}"><td class="num">${fmtDate(l.created_at)}</td><td><strong>${esc(l.email)}</strong></td><td>${esc(l.route)}</td><td>${esc(l.airline || '—')}</td><td>${l.consent ? '<span class="badge ok">Oui</span>' : '<span class="badge plain">Non</span>'}</td></tr>`).join('');
    const SRC = { vol: 'Vol (réservation ou clic compagnie)' };
    const rows = contacts.map(c => {
      const state = c.unsubscribed_at ? 'unsub' : c.consent ? 'yes' : 'no';
      return `<tr${fa({ state })}>
        <td><strong>${esc(c.email)}</strong><span class="muted">${esc(c.name || '—')}${c.phone ? ' · ' + esc(c.phone) : ''}</span></td>
        <td>${c.sources.map(s => `<span class="badge plain">${esc(SRC[s] || s)}</span>`).join(' ')}</td>
        <td>${state === 'yes' ? badge('active', 'Accord marketing') : state === 'unsub' ? badge('inactive', 'Désinscrit') : '<span class="badge waiting">Sans accord</span>'}</td>
        <td class="num">${c.requests_count}</td><td class="num">${fmtDay(c.created_at)}</td><td class="num">${fmtDate(c.last_seen_at)}</td></tr>`;
    }).join('');
    const exportCard = `<section class="card"><div class="card-head"><div><h3>Exporter la liste</h3><p>Choisissez les contacts à inclure, puis le format. La colonne « Accord marketing » indique ceux qui ont coché la case lors de leur réservation.</p></div></div>
      <div class="form-grid" style="align-items:end">
        <label>Consentement<select id="mlConsent"><option value="all">Tous les contacts</option><option value="yes">Avec accord marketing uniquement</option><option value="no">Sans accord</option></select></label>
        <div class="form-actions" style="display:flex;gap:10px"><button class="btn primary" type="button" data-action="mailing-export" data-id="xlsx">Télécharger Excel (.xlsx)</button><button class="btn" type="button" data-action="mailing-export" data-id="csv">Télécharger CSV</button></div>
      </div></section>`;
    return pageHead('Gouvernance', '<em>Mailing</em>', 'Adresses e-mail des personnes qui réservent un vol ou qui laissent leur e-mail avant d’ouvrir le site d’une compagnie. Une adresse déjà connue est reconnue à son retour.')
      + `<div class="kpis">
        <div class="kpi"><div class="kpi-icon">${icon('mailing')}</div><div><strong>${stats.total}</strong><span>Contacts</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('clients')}</div><div><strong>${stats.consent}</strong><span>Avec accord marketing</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('alert')}</div><div><strong>${stats.unsubscribed}</strong><span>Désinscrits</span></div></div></div>`
      + exportCard
      + tableCard({ id: 'tblMailing', title: 'Contacts', count: plural(contacts.length, 'contact', 'contacts'), head: ['Contact', 'Origine', 'Consentement', 'Demandes', 'Premier contact', 'Dernière activité'], rows, empty: 'Aucun contact pour le moment', cols: 6, filters: [{ key: 'state', label: 'Consentement', options: [['yes', 'Accord marketing'], ['no', 'Sans accord'], ['unsub', 'Désinscrits']] }] })
      + (leadsData ? tableCard({ id: 'tblLeads', title: 'E-mails laissés avant une compagnie', count: `${plural(leadsData.stats.week, 'e-mail', 'e-mails')} ces 7 jours · ${leadsData.stats.total} au total`, head: ['Date', 'E-mail', 'Trajet', 'Compagnie', 'Accord offres'], rows: leadRows, empty: 'Aucun e-mail laissé pour le moment', cols: 5, filters: [{ key: 'consent', label: 'Accord offres', options: [['yes', 'Oui'], ['no', 'Non']] }] }) : '');
  },

  async audit() {
    const logs = await api('/admin/audit-logs');
    const rows = logs.map(l => `<tr${fa({ entity: l.entity, action: l.action })}>
      <td class="num">${fmtDate(l.created_at)}</td>
      <td><strong>${esc(l.actor_email || '—')}</strong><span class="muted">${esc(ROLE_LABELS[l.actor_role] || '')}</span></td>
      <td>${esc(l.action)}</td><td>${esc(l.entity)} <span class="muted">${esc(l.entity_id || '')}</span></td><td>${esc(l.ip_address || '')}</td></tr>`).join('');
    return pageHead('Gouvernance', 'Journal <em>d’audit</em>', 'Chaque action sensible est tracée avec son auteur.')
      + tableCard({ id: 'tblAudit', title: 'Historique des actions', count: plural(logs.length, 'entrée', 'entrées'), head: ['Date', 'Acteur', 'Action', 'Élément', 'IP'], rows, empty: 'Aucune action enregistrée', cols: 5, filters: [{ key: 'entity', label: 'Élément', options: uniq(logs.map(l => l.entity)) }, { key: 'action', label: 'Action', options: uniq(logs.map(l => l.action)) }] });
  },

  async connections() {
    const list = await api('/it/login-history');
    const rows = list.map(r => `<tr${fa({ role: r.role })}>
      <td class="num">${fmtDate(r.created_at)}</td><td><strong>${esc(r.name)}</strong><span class="muted">${esc(r.email)}</span></td>
      <td><span class="badge plain">${esc(ROLE_LABELS[r.role] || r.role)}</span></td><td>${esc(r.ip_address || '')}</td>
      <td class="muted">${esc((r.user_agent || '').slice(0, 70))}</td></tr>`).join('');
    return pageHead('Technique', 'Historique <em>des connexions</em>', 'Qui s’est connecté, quand, et depuis quel appareil.')
      + tableCard({ id: 'tblConn', title: 'Connexions', count: plural(list.length, 'connexion', 'connexions'), head: ['Date', 'Utilisateur', 'Rôle', 'IP', 'Navigateur'], rows, empty: 'Aucune connexion', cols: 5, filters: [{ key: 'role', label: 'Rôle', options: [['it', 'IT'], ['manager', 'Manager'], ['admin', 'Agent']] }] });
  },

  async profile() {
    const me = await api('/auth/me');
    const u = me.user;
    saveSession({ user: { ...user, name: u.name }, permissions: me.permissions });
    const labels = Object.fromEntries(PERM_GROUPS.flatMap(([group, items]) => items.map(([k, l]) => [k, `${group} · ${l}`])));
    const granted = Object.entries(me.permissions).filter(([, v]) => v).map(([k]) => labels[k]).filter(Boolean);
    const identity = `
      <section class="card profile-hero">
        <span class="avatar xl">${esc(initials(u.name))}</span>
        <div><h3>${esc(u.name)}</h3><div class="profile-meta"><span class="role-chip dark">${esc(ROLE_LABELS[u.role] || u.role)}</span><span class="muted">${esc(u.email)}</span></div>
          <p class="muted">Dernière connexion : ${fmtDate(u.lastLoginAt)} · Compte créé le ${fmtDay(u.createdAt)}</p></div>
      </section>`;
    const info = `
      <form id="profileForm" class="card">
        <div class="card-head"><div><h3>Informations personnelles</h3><p>Ces informations sont visibles par les autres membres de l’équipe.</p></div></div>
        <div class="form-grid">
          ${field('Prénom', `name="firstName" required maxlength="60" autocomplete="given-name" value="${esc(u.firstName)}"`)}
          ${field('Nom', `name="lastName" required maxlength="60" autocomplete="family-name" value="${esc(u.lastName)}"`)}
          ${field('Téléphone', `name="phone" type="tel" maxlength="30" autocomplete="tel" placeholder="+33 6 00 00 00 00" value="${esc(u.phone)}"`)}
          ${field('Adresse e-mail', `value="${esc(u.email)}" disabled title="L’e-mail est votre identifiant de connexion, contactez le service IT ou un manager pour le modifier"`)}
          <div class="form-actions"><button class="btn primary" type="submit">Enregistrer les modifications</button></div>
        </div>
      </form>`;
    const security = `
      <form id="passwordForm" class="card">
        <div class="card-head"><div><h3>Mot de passe</h3><p>Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</p></div></div>
        <div class="form-grid">
          ${field('Mot de passe actuel', 'name="currentPassword" type="password" required autocomplete="current-password"', true)}
          ${field('Nouveau mot de passe', 'name="newPassword" type="password" required autocomplete="new-password" data-pw-rules')}
          ${field('Confirmer le nouveau mot de passe', 'name="confirm" type="password" required autocomplete="new-password"')}
          <div class="form-actions"><button class="btn primary" type="submit">Changer le mot de passe</button></div>
        </div>
      </form>`;
    const rights = `
      <section class="card">
        <div class="card-head"><div><h3>Mes droits</h3><p>${me.user.role === 'it' ? 'Votre rôle dispose d’un accès complet.' : 'Définis par le service IT ou un manager.'}</p></div></div>
        <div class="card-body">${granted.length ? `<div class="chips">${granted.map(g => `<span class="badge ok">${esc(g)}</span>`).join('')}</div>` : '<p class="muted">Aucun droit particulier : lecture seule.</p>'}</div>
      </section>`;
    return pageHead('Compte', 'Mon <em>profil</em>', 'Gérez vos informations personnelles et la sécurité de votre accès.') + identity + info + security + rights;
  },

  async health() {
    const h = await api('/it/health');
    return pageHead('Technique', 'Santé <em>du système</em>', `Base de données joignable. Mesuré le ${fmtDate(h.time)}.`) + `
      <div class="kpis">
        <div class="kpi"><div class="kpi-icon">${icon('accounts')}</div><div><strong>${esc(h.counts.users)}</strong><span>Comptes</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('partners')}</div><div><strong>${esc(h.counts.partners)}</strong><span>Partenaires</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('vehicles')}</div><div><strong>${esc(h.counts.vehicles)}</strong><span>Annonces</span></div></div>
        <div class="kpi"><div class="kpi-icon">${icon('bookings')}</div><div><strong>${esc(h.counts.bookings)}</strong><span>Réservations</span></div></div>
      </div>`;
  },
};

/* ---------- Formulaire compte (création / modification) ---------- */
function accountFormBody(account) {
  const roles = MANAGEABLE[user.role] || [];
  const defaults = (r) => Object.fromEntries((DEFAULT_PERMS[r] || []).map(k => [k, true]));
  const current = account?.permissions || defaults(account?.role || roles[roles.length - 1] || 'admin');
  const switches = PERM_GROUPS.map(([group, items]) => `
    <div class="perm-group"><h4>${esc(group)}</h4>${items.map(([key, label]) => `
      <label class="switch ${can(key) ? '' : 'locked'}" ${can(key) ? '' : 'title="Vous ne possédez pas ce droit"'}>
        <input type="checkbox" name="perm_${key}" ${current[key] ? 'checked' : ''} ${can(key) ? '' : 'disabled'}>
        <span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}</span>
      </label>`).join('')}</div>`).join('');
  const role = account?.role || (roles.includes('admin') ? 'admin' : roles[0] || 'manager');
  return `
    <div class="form-grid tight" ${account ? '' : 'data-new-account'}>
      ${field('Nom complet', `name="name" required minlength="2" value="${esc(account?.name || '')}"`)}
      ${field('Adresse e-mail', `name="email" type="email" required value="${esc(account?.email || '')}"`)}
      <label>Rôle<select name="role">${roles.map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`).join('')}</select></label>
    </div>
    <div class="perms" ${role === 'it' ? 'hidden' : ''}>
      <div class="perms-head"><strong>Niveau d’accès</strong><span class="muted">Cochez ce que ce compte a le droit de faire.</span></div>
      <div class="perm-grid">${switches}</div>
    </div>
    <p class="perms-full muted" ${role === 'it' ? '' : 'hidden'}>Le rôle ${ROLE_LABELS.it} dispose d’un accès complet.</p>`;
}

function collectPermissions(form) {
  return Object.fromEntries(ALL_PERMS.map(k => [k, !!form.elements.namedItem(`perm_${k}`)?.checked]));
}

/* ---------- Création d'annonces et d'offres ---------- */
const toggle = (name, label, checked = false) => `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}</span></label>`;
const HOTEL_BOARDS = ['Petit-déjeuner inclus', 'Demi-pension', 'Pension complète', 'Sans repas'];
const fv = (x) => esc(x ?? '');
const options = (list, current) => list.map(x => `<option ${x === current ? 'selected' : ''}>${esc(x)}</option>`).join('');

/* ---------- Franchise : un seul montant, fixé par TripVision pour toutes les voitures ---------- */
const FR = { amount: null, protection: null };
function openFranchiseModal() {
  const has = FR.amount != null;
  openModal({
    eyebrow: 'Annonces véhicules', title: 'Franchise et protection', confirmLabel: 'Appliquer à tous les véhicules', loadingText: 'Enregistrement…',
    bodyHtml: `<p class="modal-text">Les mêmes valeurs pour <b>toutes les annonces</b>, celles des partenaires comprises. Elles s’affichent tout de suite sur chaque offre.</p>
      <div class="form-grid">
        ${field('Montant de la franchise (€)', `name="amount" type="number" min="1" max="100000" step="1" placeholder="Ex. 1200" value="${has ? esc(FR.amount) : ''}"`)}
        ${field('Protection de la franchise (€ par jour)', `name="protection" type="number" min="0" max="200" step="0.01" required placeholder="Ex. 7" value="${FR.protection != null ? esc(FR.protection) : ''}"`)}
        <p class="muted full">Franchise : ce qui reste à la charge du client en cas de dommage ou de vol (laissez vide pour ne pas en afficher). Protection : l’option que le client peut ajouter à sa réservation (0 pour ne plus la proposer).</p>
      </div>
      ${has ? `<div class="fr-current"><span>Franchise actuelle : <b>${money(FR.amount)}</b></span><button class="btn small danger" type="button" data-action="franchise-delete">Supprimer la franchise</button></div>` : ''}`,
    run: async (f) => {
      const raw = f.elements.amount.value.trim();
      const protection = Number(f.elements.protection.value);
      if (raw) FR.amount = (await api('/admin/franchise', { method: 'PUT', body: JSON.stringify({ amount: Number(raw) }) })).amount;
      else if (has) FR.amount = (await api('/admin/franchise', { method: 'DELETE' })).amount;
      FR.protection = (await api('/admin/settings', { method: 'PUT', body: JSON.stringify({ franchisePerDay: protection }) })).franchisePerDay;
      return { title: 'Enregistré', text: `${FR.amount ? `Franchise : ${money(FR.amount)}` : 'Aucune franchise affichée'} · protection : ${FR.protection > 0 ? `${money(FR.protection)} / jour` : 'non proposée'}. Appliqué à toutes les voitures.` };
    },
  });
}

function openVehicleModal(existing = null, availability = { blocks: [], rentals: [] }) {
  const v = existing;
  const editing = Boolean(v);
  const partners = DATA.partners.filter(p => p.status !== 'inactive' || (v && p.id === v.partner_id));
  openModal({
    eyebrow: 'Annonces véhicules', title: editing ? 'Modifier l’annonce' : 'Ajouter une annonce',
    confirmLabel: editing ? 'Enregistrer les modifications' : 'Ajouter l’annonce', loadingText: editing ? 'Enregistrement…' : 'Création de l’annonce…', wide: true,
    bodyHtml: `
      <div class="form-grid tight">
        <label class="full">Propriétaire de l’annonce<select name="partnerId"><option value="">TripVision (annonce interne, sans partenaire)</option>${partners.map(p => `<option value="${esc(p.id)}" ${v && v.partner_id === p.id ? 'selected' : ''}>${esc(p.tradeName)}${p.status === 'pending' ? ' (en attente de validation)' : ''}</option>`).join('')}</select></label>
        ${TVVehicleForm.html(v, { lessor: true, availability })}
      </div>
      ${editing ? '' : scheduleFields(null, true)}`,
    run: async (f) => {
      const { draft, publishAt } = editing ? { draft: false, publishAt: null } : readSchedule(f);
      const g = (n) => f.elements.namedItem(n);
      const body = { ...TVVehicleForm.read(f), partnerId: g('partnerId').value || null };
      if (!body.partnerId && !body.lessorName) throw new ApiError('Indiquez le nom de l’enseigne : il est affiché sur le site avec ses conditions de location.');
      if (!editing) { body.draft = draft; body.publishAt = publishAt; }
      await api(editing ? `/admin/vehicles/${v.id}` : '/admin/vehicles', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      if (editing) return { title: 'Annonce modifiée', text: 'Les changements sont enregistrés et visibles sur le site.' };
      if (draft) return { title: 'Annonce ajoutée', text: 'Elle est en attente : publiez-la quand vous êtes prêt.' };
      return publishAt ? { title: 'Annonce programmée', text: `Mise en ligne le ${fmtDate(publishAt)}.` } : { title: 'Annonce publiée', text: body.partnerId ? 'Elle est visible sur le site si son partenaire est validé.' : 'Elle est maintenant visible sur le site.' };
    },
  });
}

const CABINS = ['Économique', 'Économique premium', 'Affaires', 'Première'];
const STOPS = [[0, 'Direct'], [1, '1 escale'], [2, '2 escales'], [3, '3 escales']];
const DAY_OFFSETS = [[0, 'Même jour'], [1, '+1 jour'], [2, '+2 jours']];
const pairs = (list, current) => list.map(([v, l]) => `<option value="${v}" ${String(v) === String(current) ? 'selected' : ''}>${esc(l)}</option>`).join('');
const dateOnly = (d) => (d ? String(d).slice(0, 10) : '');

function syncTripType(form) {
  const one = form.elements.namedItem('tripType')?.value === 'oneway';
  form.querySelectorAll('[data-return]').forEach(box => {
    box.hidden = one;
    box.querySelectorAll('input, select').forEach(i => { i.disabled = one; });
  });
}
document.addEventListener('change', (e) => { if (e.target.matches?.('select[name=tripType]')) syncTripType(e.target.form); });

/* Un vol relie n'importe quels pays : TripVision publie les meilleurs tarifs qu'elle trouve, partout dans le monde. */
function routeFields(o) {
  const f = o?.flight || {};
  return `
    ${field('Pays de départ', `name="fromCountry" required data-geo="country" placeholder="Rechercher un pays…" value="${fv(f.fromCountry || '')}"`)}
    ${field('Ville de départ', `name="fromCity" required data-geo="city" data-geo-country="fromCountry" placeholder="Rechercher une ville…" value="${fv(o?.from_city)}"`)}
    ${field('Pays d’arrivée', `name="country" required data-geo="country" placeholder="Rechercher un pays…" value="${fv(o?.country || '')}"`)}
    ${field('Ville d’arrivée', `name="toCity" required minlength="2" data-geo="city" data-geo-country="country" placeholder="Rechercher une ville…" value="${fv(o?.to_city)}"`)}`;
}

function flightFields(o) {
  const f = o?.flight || {};
  const oneway = f.tripType === 'oneway';
  const dur = Number(f.durationMin) || 0;
  const dis = oneway ? 'disabled' : '';
  return `
    <h4 class="form-section full">Vol aller</h4>
    <label>Type de trajet<select name="tripType"><option value="roundtrip" ${oneway ? '' : 'selected'}>Aller-retour</option><option value="oneway" ${oneway ? 'selected' : ''}>Aller simple</option></select></label>
    ${field('Compagnie aérienne', `name="airline" required maxlength="80" placeholder="Ex. Air France" value="${fv(f.airline)}"`)}
    ${field('N° de vol', `name="flightNumber" maxlength="12" placeholder="AF 718" value="${fv(f.flightNumber)}"`)}
    ${field('Lien de réservation sur le site de la compagnie', `name="bookingUrl" type="url" required maxlength="600" placeholder="https://www.compagnie.com/vol/…" value="${fv(f.bookingUrl)}"`, true)}
    <p class="hint full">TripVision ne vend pas les billets : le bouton « Réserver » du site envoie le voyageur sur ce lien, dans un nouvel onglet.</p>
    ${field('Aéroport de départ', `name="fromAirport" maxlength="120" data-geo="airport" data-geo-city="fromCity" data-geo-country="fromCountry" placeholder="Rechercher un aéroport…" value="${fv(f.fromAirport)}"`)}
    ${field('Aéroport d’arrivée', `name="toAirport" maxlength="120" data-geo="airport" data-geo-city="toCity" data-geo-country="country" placeholder="Rechercher un aéroport…" value="${fv(f.toAirport)}"`)}
    ${field('Date de départ', `name="startDate" type="date" required value="${fv(dateOnly(o?.start_date))}"`)}
    ${field('Heure de départ (facultatif)', `name="departTime" type="time" value="${fv(f.departTime)}"`)}
    ${field('Heure d’arrivée (facultatif)', `name="arriveTime" type="time" value="${fv(f.arriveTime)}"`)}
    <label>Arrivée<select name="arriveDayOffset">${pairs(DAY_OFFSETS, f.arriveDayOffset || 0)}</select></label>
    ${field('Durée du vol (heures, facultatif)', `name="durH" type="number" min="0" max="40" placeholder="2" value="${fv(dur ? Math.floor(dur / 60) : '')}"`)}
    ${field('Durée (minutes)', `name="durM" type="number" min="0" max="59" placeholder="30" value="${fv(dur ? dur % 60 : '')}"`)}
    <div class="sub-grid full" data-return ${oneway ? 'hidden' : ''}>
      <h4 class="form-section full">Vol retour</h4>
      ${field('Date de retour', `name="endDate" type="date" required ${dis} value="${fv(dateOnly(o?.end_date))}"`)}
      ${field('N° de vol retour', `name="returnFlightNumber" maxlength="12" ${dis} placeholder="AF 719" value="${fv(f.returnFlightNumber)}"`)}
      ${field('Heure de départ (retour, facultatif)', `name="returnDepartTime" type="time" ${dis} value="${fv(f.returnDepartTime)}"`)}
      ${field('Heure d’arrivée (retour, facultatif)', `name="returnArriveTime" type="time" ${dis} value="${fv(f.returnArriveTime)}"`)}
      <label>Arrivée (retour)<select name="returnDayOffset" ${dis}>${pairs(DAY_OFFSETS, f.returnDayOffset || 0)}</select></label>
    </div>
    <h4 class="form-section full">Prestations</h4>
    <label>Escales<select name="stops">${pairs(STOPS, f.stops || 0)}</select></label>
    <label>Classe<select name="cabin">${options(CABINS, f.cabin || CABINS[0])}</select></label>
    ${field('Bagages', `name="baggage" maxlength="80" placeholder="1 bagage cabine inclus" value="${fv(f.baggage)}"`)}
    <label class="full">Prix « aller simple » par voyageur (€, facultatif)<input name="oneWayPrice" type="number" min="1" step="0.01" placeholder="Laissez vide pour ne vendre que l’aller-retour" value="${fv(f.oneWayPrice)}"></label>
    <p class="muted full">Sur un vol aller-retour, renseignez ce prix pour qu’un autre voyageur puisse prendre uniquement l’aller sur le même vol.</p>`;
}

// Packs week-end : un seul mode de transport jusqu'à l'hôtel, et les notes de l'hôtel sur les sites d'avis.
const PACK_TRANSPORTS = [['avion', 'Avion'], ['train', 'Train'], ['bus', 'Bus'], ['voiture', 'Voiture']];
const TP_ICON = {
  avion: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.1 1.1 6.4 3.6-3.3 3.3-2.7-.5L3 14.8l3.2 1.4 1.4 3.2 1.1-1.1-.5-2.7 3.3-3.3 3.6 6.4z"/></svg>',
  train: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l-2-4M15 21l2-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/></svg>',
  bus: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/></svg>',
  voiture: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6v4h-2M3 13v4h2M3 13h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/></svg>',
};
const RATING_SITES = [['TripAdvisor', 5], ['Booking.com', 10], ['Google', 5]];
function openOfferModal(type, existing = null) {
  const o = existing;
  const editing = Boolean(o);
  const isPack = type === 'pack';
  const label = isPack ? 'pack' : 'vol';
  openModal({
    eyebrow: editing ? (isPack ? 'Modifier le pack' : 'Modifier le vol') : (isPack ? 'Nouveau pack' : 'Nouveau vol'),
    title: editing ? `Modifier ce ${label}` : (isPack ? 'Ajouter un pack' : 'Ajouter un vol'),
    confirmLabel: editing ? 'Enregistrer les modifications' : 'Publier', loadingText: editing ? 'Enregistrement…' : 'Création en cours…', wide: true,
    bodyHtml: `
      <div class="form-grid tight">
        ${field(isPack ? 'Titre' : 'Titre (facultatif)', `name="title" ${isPack ? 'required' : ''} minlength="2" placeholder="${isPack ? 'Week-end gourmand à Bordeaux' : 'Auto : Paris → Rome'}" value="${fv(o?.title)}"`, true)}
        ${isPack ? `
        ${field('Ville de départ', `name="fromCity" required data-geo="city" placeholder="Rechercher une ville…" value="${fv(o?.from_city)}"`)}
        ${field('Destination (en France)', `name="toCity" required minlength="2" data-geo="city" data-geo-country="country" placeholder="Rechercher une ville…" value="${fv(o?.to_city)}"`)}
        ${field('Pays', `name="country" readonly data-code="FR" value="France" title="Les packs week-end sont proposés en France uniquement"`)}
        <h4 class="form-section full">Transport jusqu’à l’hôtel</h4>
        <div class="full transport-pick" role="radiogroup" aria-label="Mode de transport">${PACK_TRANSPORTS.map(([k, t]) => `<label class="tp-opt"><input type="radio" name="transportMode" value="${k}" required ${(o?.transport?.mode || '') === k ? 'checked' : ''}><span>${TP_ICON[k]}<b>${t}</b></span></label>`).join('')}</div>
        ${field('Précision sur le transport (facultatif)', `name="transportDetails" maxlength="160" placeholder="Ex. TGV direct Paris → Bordeaux, aller-retour" value="${fv(o?.transport?.details)}"`, true)}` : routeFields(o)}
        ${field('Étiquette', `name="badge" placeholder="${isPack ? 'Week-end' : 'Bon plan'}" value="${fv(o?.badge)}"`)}
        ${field(isPack ? 'Prix par voyageur (€)' : 'Prix par voyageur (€)', `name="price" type="number" min="1" step="0.01" required placeholder="129" value="${fv(o?.price)}"`)}
        ${field('Ancien prix barré (€, facultatif)', `name="oldPrice" type="number" min="1" step="0.01" value="${fv(o?.old_price)}"`)}
        ${isPack ? `
        ${field('Début du séjour', `name="startDate" type="date" value="${fv(dateOnly(o?.start_date))}"`)}
        ${field('Fin du séjour', `name="endDate" type="date" value="${fv(dateOnly(o?.end_date))}"`)}
        <h4 class="form-section full">Hôtel inclus dans le pack</h4>
        ${field('Nom de l’hôtel', `name="hotelName" required maxlength="160" placeholder="Ex. Hôtel de la Cité, Bordeaux" value="${fv(o?.hotel_name)}"`, true)}
        <label>Catégorie de l’hôtel<select name="hotelStars">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${(o?.hotel_stars ? Number(o.hotel_stars) : 3) === n ? 'selected' : ''}>${'★'.repeat(n)} ${n} étoile${n > 1 ? 's' : ''}</option>`).join('')}</select></label>
        <label>Formule<select name="hotelNights" required>${[[1, 'Week-end · 1 nuit'], [2, 'Week-end · 2 nuits'], [3, 'Week-end prolongé · 3 nuits']].map(([n, t]) => `<option value="${n}" ${Number(o?.hotel_nights || 2) === n ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Formule repas<select name="hotelBoard">${options(HOTEL_BOARDS, o?.hotel_board || HOTEL_BOARDS[0])}</select></label>
        <h4 class="form-section full">Notes de l’hôtel sur les sites d’avis (facultatif)</h4>
        <p class="muted full">Recopiez les notes affichées sur TripAdvisor, Booking.com ou Google : elles s’affichent sur l’offre avec leur source.</p>
        ${RATING_SITES.map(([src, max]) => { const r = (o?.ratings || []).find((x) => x.source === src) || {}; return `<div class="rating-row full"><b>${src}</b>${field(`Note sur ${max}`, `name="rate_${src}" type="number" min="0" max="${max}" step="0.1" placeholder="${max === 10 ? '8.6' : '4.5'}" value="${fv(r.score)}"`)}${field('Nombre d’avis', `name="count_${src}" type="number" min="0" step="1" placeholder="1240" value="${fv(r.count)}"`)}</div>`; }).join('')}` : flightFields(o)}
        <h4 class="form-section full">Visuels et description</h4>
        ${galleryField(isPack ? 'Photos du pack' : 'Photos de l’offre', o?.images)}
        <label class="full">Description<textarea name="description" rows="2" placeholder="Quelques lignes pour donner envie…">${fv(o?.description)}</textarea></label>
      </div>
      ${editing ? '' : scheduleFields(null)}`,
    run: async (f) => {
      const publishAt = editing ? null : readPublishAt(f);
      const g = (n) => f.elements.namedItem(n)?.value;
      const body = { type, title: g('title') || `${g('fromCity') || ''} → ${g('toCity')}`, toCity: g('toCity'), price: Number(g('price')), fromCity: g('fromCity') || undefined, country: g('country') || undefined, badge: g('badge') || undefined, oldPrice: g('oldPrice') ? Number(g('oldPrice')) : undefined, startDate: g('startDate') || undefined, endDate: g('endDate') || undefined, images: JSON.parse(g('images') || '[]'), description: g('description') || undefined };
      if (isPack) {
        const ratings = RATING_SITES.map(([source]) => ({ source, score: g(`rate_${source}`), count: g(`count_${source}`) })).filter((r) => r.score !== '' && r.score != null).map((r) => ({ source: r.source, score: Number(r.score), ...(r.count ? { count: Number(r.count) } : {}) }));
        Object.assign(body, { country: 'France', hotelName: g('hotelName'), hotelStars: Number(g('hotelStars')), hotelNights: Number(g('hotelNights')), hotelBoard: g('hotelBoard'), transport: { mode: f.querySelector('input[name=transportMode]:checked')?.value, details: g('transportDetails') || undefined }, ratings });
      }
      else {
        const roundtrip = g('tripType') !== 'oneway';
        body.endDate = roundtrip ? g('endDate') || undefined : undefined;
        body.flight = {
          tripType: roundtrip ? 'roundtrip' : 'oneway', fromCountry: g('fromCountry'), airline: g('airline'), bookingUrl: g('bookingUrl'), flightNumber: g('flightNumber') || undefined, fromAirport: g('fromAirport') || undefined, toAirport: g('toAirport') || undefined,
          departTime: g('departTime') || undefined, arriveTime: g('arriveTime') || undefined, arriveDayOffset: Number(g('arriveDayOffset')), durationMin: Number(g('durH') || 0) * 60 + Number(g('durM') || 0) || undefined,
          stops: Number(g('stops')), cabin: g('cabin'), baggage: g('baggage') || undefined, oneWayPrice: roundtrip && g('oneWayPrice') ? Number(g('oneWayPrice')) : undefined,
          ...(roundtrip ? { returnFlightNumber: g('returnFlightNumber') || undefined, returnDepartTime: g('returnDepartTime') || undefined, returnArriveTime: g('returnArriveTime') || undefined, returnDayOffset: Number(g('returnDayOffset')) } : {}),
        };
      }
      if (!editing) body.publishAt = publishAt;
      await api(editing ? `/admin/offers/${o.id}` : '/admin/offers', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      if (editing) return { title: isPack ? 'Pack modifié' : 'Vol modifié', text: 'Les changements sont enregistrés et visibles sur le site.' };
      return publishAt ? { title: 'Publication programmée', text: `Mise en ligne le ${fmtDate(publishAt)}.` } : { title: isPack ? 'Pack publié' : 'Vol publié', text: 'Il est maintenant visible sur le site.' };
    },
  });
}

/* ---------- Actions ---------- */
const find = (list, id) => DATA[list].find(x => x.id === id);
const categoryModal = (c = null) => openModal({
  eyebrow: 'Catégories', title: c ? `Modifier « ${c.name} »` : 'Nouvelle catégorie', confirmLabel: c ? 'Enregistrer' : 'Ajouter', wide: false, loadingText: 'Enregistrement…',
  bodyHtml: `<div class="form-grid">${field('Nom de la catégorie', `name="name" required minlength="2" maxlength="60" placeholder="Ex. Petits, SUV, Premium" value="${esc(c?.name || '')}"`, true)}
    ${field('Ordre d’affichage (1 = en premier)', `name="position" type="number" min="0" max="999" value="${esc(c?.position ?? 50)}"`)}
    <div class="perm-grid full">${toggle('active', 'Affichée sur le site', c?.active !== false)}</div>
    ${galleryField('Image de la catégorie', c?.image ? [c.image] : [], { name: 'image', max: 1, cover: false, hint: 'voiture de profil, de préférence sur fond blanc' })}</div>`,
  run: async (f) => {
    const g = (n) => f.elements.namedItem(n);
    const image = JSON.parse(g('image').value || '[]')[0] || null;
    const body = { name: g('name').value.trim(), position: Number(g('position').value || 50), active: g('active').checked, image };
    await api(c ? `/admin/categories/${c.id}` : '/admin/categories', { method: c ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    return { title: c ? 'Catégorie modifiée' : 'Catégorie ajoutée' };
  },
});
const ACT = {
  'category-add': () => categoryModal(),
  'category-edit': (id) => categoryModal(find('categories', id)),
  'category-delete': (id) => confirmCall({ eyebrow: 'Suppression', title: `Supprimer « ${esc(find('categories', id).name)} » ?`, message: 'Impossible tant que des annonces utilisent cette catégorie : masquez-la plutôt si besoin.', confirmLabel: 'Supprimer', tone: 'danger', loading: 'Suppression…', success: 'Catégorie supprimée', method: 'DELETE', url: `/admin/categories/${id}` }),
  'mailing-export': async (format) => {
    const q = new URLSearchParams({ format, consent: $('#mlConsent')?.value || 'all' });
    try {
      const res = await fetch('/api/admin/mailing/export?' + q, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tripvision-contacts-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Export téléchargé.');
    } catch { toast('Export impossible.'); }
  },
  reload: async () => { await render(); toast('Données actualisées.'); },
  'close-drawer': () => closeDrawer(),
  'trend-period': async (id) => { DATA.trendPeriod = id; await render(); },
  'chat-close': async (id) => { try { await api(`/admin/chats/${id}/close`, { method: 'POST' }); toast('Conversation clôturée.'); await openChat(id); if (currentSection() === 'chats') render(); } catch (err) { toast(err.message); } },
  'chat-take': async (id) => { try { await api(`/admin/chats/${id}/assign`, { method: 'POST', body: JSON.stringify({ to: user.id }) }); toast('Conversation prise en charge.'); await openChat(id, true); if (currentSection() === 'chats') render(); } catch (err) { toast(err.message); } },
  'canned-add': () => openModal({ eyebrow: 'Messagerie', title: 'Nouvelle réponse type', confirmLabel: 'Ajouter', loadingText: 'Ajout…',
    bodyHtml: `<div class="form-grid"><label class="full">Titre<input name="title" required minlength="2" maxlength="60" placeholder="Ex. Remboursement en cours"></label><label class="full">Texte de la réponse<textarea name="body" required minlength="2" maxlength="2000" rows="5" placeholder="Bonjour, …"></textarea></label></div>`,
    run: async (f) => { await api('/admin/chat-canned', { method: 'POST', body: JSON.stringify({ title: f.elements.title.value.trim(), body: f.elements.body.value.trim() }) }); DATA.canned = null; return { title: 'Réponse type ajoutée' }; } }),
  'canned-del': (id) => confirmCall({ eyebrow: 'Messagerie', title: 'Retirer cette réponse type ?', message: 'Elle ne sera plus proposée dans les conversations.', confirmLabel: 'Retirer', tone: 'danger', loading: 'Suppression…', success: 'Réponse type retirée', method: 'DELETE', url: `/admin/chat-canned/${id}` }),
  'chat-reopen': async (id) => { try { await api(`/admin/chats/${id}/reopen`, { method: 'POST' }); toast('Conversation rouverte.'); await openChat(id); if (currentSection() === 'chats') render(); } catch (err) { toast(err.message); } },

  'message-toggle': async (id) => {
    const m = DATA.messages.find(x => x.id === id);
    try { await api(`/admin/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ handled: !m.handled_at }) }); toast(m.handled_at ? 'Message rouvert.' : 'Message marqué comme traité.'); closeDrawer(); render(); }
    catch (err) { if (!(err instanceof ApiError)) console.error(err); toast(err.message); }
  },
  'application-approve': (id) => {
    const a = DATA.applications.find(x => x.id === id);
    openModal({ eyebrow: 'Candidature', title: `Accepter ${a.trade_name} ?`, confirmLabel: 'Accepter et inviter', loadingText: 'Création du partenaire…',
      bodyHtml: `<p class="modal-text">Le partenaire sera créé et validé. Un e-mail d’activation sera envoyé à <strong>${esc(a.login_email)}</strong> pour qu’il choisisse son mot de passe.</p>`,
      run: async () => ({ title: 'Candidature acceptée', html: credentialsHtml(await api(`/admin/partner-applications/${id}/approve`, { method: 'POST' }), a.trade_name) }) });
  },
  'application-reject': (id) => confirmCall({ eyebrow: 'Candidature', title: `Refuser ${esc(DATA.applications.find(x => x.id === id).trade_name)} ?`, message: 'La candidature sera classée comme refusée. Aucun e-mail n’est envoyé au candidat.', confirmLabel: 'Refuser', tone: 'danger', loading: 'Enregistrement…', success: 'Candidature refusée', method: 'POST', url: `/admin/partner-applications/${id}/reject` }),
  'vehicle-new': () => openVehicleModal(),
  'franchise-edit': () => openFranchiseModal(),
  'franchise-delete': () => confirmCall({ eyebrow: 'Franchise', title: 'Supprimer la franchise ?', message: 'Plus aucun montant de franchise ne sera affiché sur les annonces. Vous pourrez en définir un nouveau à tout moment.', confirmLabel: 'Supprimer', tone: 'danger', loading: 'Suppression…', success: 'Franchise supprimée', successText: 'Les annonces n’affichent plus de franchise.', method: 'DELETE', url: '/admin/franchise' }),
  'vehicle-edit': async (id) => {
    try { openVehicleModal(find('vehicles', id), await api(`/admin/vehicles/${id}/availability`)); }
    catch (err) { if (!(err instanceof ApiError)) console.error(err); toast(err.message); }
  },
  'offer-edit': (id) => { const o = find('offers', id); openOfferModal(o.type, o); },
  'offer-new-flight': () => openOfferModal('flight'),
  'offer-new-pack': () => openOfferModal('pack'),

  'offer-activate': (id) => {
    const o = find('offers', id);
    openModal({ eyebrow: 'Offre', title: `Publier « ${o.title} » ?`, confirmLabel: 'Publier', loadingText: 'Publication en cours…', bodyHtml: `<p class="modal-text">L’offre deviendra visible sur le site. Vous pouvez aussi choisir une date de mise en ligne.</p>${scheduleFields(o.publish_at)}`,
      run: async (f) => { const publishAt = readPublishAt(f); await api(`/admin/offers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'active', publishAt }) }); return publishAt ? { title: 'Publication programmée', text: `Mise en ligne le ${fmtDate(publishAt)}.` } : { title: 'Offre publiée', text: 'Elle est maintenant visible sur le site.' }; } });
  },
  'offer-deactivate': (id) => confirmCall({ eyebrow: 'Offre', title: `Désactiver « ${esc(find('offers', id).title)} » ?`, message: 'L’offre disparaîtra du site immédiatement. Vous pourrez la réactiver plus tard.', confirmLabel: 'Désactiver', tone: 'danger', loading: 'Désactivation en cours…', success: 'Offre désactivée', url: `/admin/offers/${id}/status`, body: { status: 'inactive' } }),
  'offer-delete': (id) => confirmCall({ eyebrow: 'Suppression', title: `Supprimer « ${esc(find('offers', id).title)} » ?`, message: 'L’offre sera retirée du site et de cette liste. Cette action ne peut pas être annulée depuis le back-office.', confirmLabel: 'Supprimer définitivement', tone: 'danger', loading: 'Suppression en cours…', success: 'Offre supprimée', method: 'DELETE', url: `/admin/offers/${id}` }),
  'offer-schedule': (id) => {
    const o = find('offers', id);
    openModal({ eyebrow: 'Offre', title: `Programmer « ${o.title} »`, confirmLabel: 'Enregistrer la date', loadingText: 'Enregistrement de la programmation…', bodyHtml: `<p class="modal-text">Choisissez quand l’offre doit apparaître sur le site. L’offre doit être active pour être publiée à cette date.</p>${scheduleFields(o.publish_at)}`,
      run: async (f) => { const publishAt = readPublishAt(f); await api(`/admin/offers/${id}/schedule`, { method: 'PATCH', body: JSON.stringify({ publishAt }) }); return { title: publishAt ? 'Publication programmée' : 'Programmation retirée', text: publishAt ? `Mise en ligne le ${fmtDate(publishAt)}.` : 'L’offre suit son statut actuel.' }; } });
  },

  'vehicle-approve': (id) => {
    const v = find('vehicles', id);
    openModal({ eyebrow: 'Annonce', title: `Publier « ${v.model} » ?`, confirmLabel: 'Publier', loadingText: 'Publication en cours…', bodyHtml: `<p class="modal-text">L’annonce deviendra visible sur le site. Vous pouvez aussi choisir une date de mise en ligne.</p>${scheduleFields(v.publish_at)}`,
      run: async (f) => { const publishAt = readPublishAt(f); await api(`/admin/vehicles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'approved', publishAt }) }); return publishAt ? { title: 'Publication programmée', text: `Mise en ligne le ${fmtDate(publishAt)}.` } : { title: 'Annonce publiée', text: 'Elle est maintenant visible sur le site.' }; } });
  },
  'vehicle-hide': (id) => confirmCall({ eyebrow: 'Annonce', title: `Masquer « ${esc(find('vehicles', id).model)} » ?`, message: 'L’annonce disparaîtra du site immédiatement.', confirmLabel: 'Masquer', tone: 'danger', loading: 'Masquage en cours…', success: 'Annonce masquée', url: `/admin/vehicles/${id}/status`, body: { status: 'inactive' } }),
  'vehicle-delete': (id) => confirmCall({ eyebrow: 'Suppression', title: `Supprimer « ${esc(find('vehicles', id).model)} » ?`, message: 'L’annonce sera retirée du site et de cette liste.', confirmLabel: 'Supprimer définitivement', tone: 'danger', loading: 'Suppression en cours…', success: 'Annonce supprimée', method: 'DELETE', url: `/admin/vehicles/${id}` }),
  'vehicle-schedule': (id) => {
    const v = find('vehicles', id);
    openModal({ eyebrow: 'Annonce', title: `Programmer « ${v.model} »`, confirmLabel: 'Enregistrer la date', loadingText: 'Enregistrement de la programmation…', bodyHtml: `<p class="modal-text">Choisissez quand l’annonce doit apparaître sur le site. Elle doit être validée pour être publiée à cette date.</p>${scheduleFields(v.publish_at)}`,
      run: async (f) => { const publishAt = readPublishAt(f); await api(`/admin/vehicles/${id}/schedule`, { method: 'PATCH', body: JSON.stringify({ publishAt }) }); return { title: publishAt ? 'Publication programmée' : 'Programmation retirée', text: publishAt ? `Mise en ligne le ${fmtDate(publishAt)}.` : 'L’annonce suit son statut actuel.' }; } });
  },

  'request-seen': (id, el) => {
    const r = find('requests', id);
    if (r && !r.staff_seen_at) { r.staff_seen_at = new Date().toISOString(); el?.querySelector('.new-tag')?.remove(); markSeen(`/admin/offer-requests/${id}/seen`); }
  },
  'notif-open': async (id, el) => {
    const n = (DATA.notifications || []).find(x => x.id === id);
    if (!n) return;
    if (!n.read_at) { n.read_at = new Date().toISOString(); el?.classList.remove('unread'); await markSeen(`/notifications/${id}/read`); }
    if (n.kind === 'contact' && n.ref_id) {
      try { DATA.messages = await api('/admin/messages'); } catch (err) { toast(err.message); return; }
      if (DATA.messages.some(m => String(m.id) === String(n.ref_id))) openDrawer('message', n.ref_id); else location.hash = '#messages';
    } else if (n.link) location.hash = `#${n.link}`;
  },
  'notif-read-all': async () => { await markSeen('/notifications/read-all'); toast('Notifications marquées comme lues.'); render(); },
  'request-confirm': (id) => confirmCall({ eyebrow: 'Demande', title: `Confirmer ${esc(refOfRequest(find('requests', id)))} ?`, message: 'Le client verra sa demande comme confirmée dans son espace.', confirmLabel: 'Confirmer', loading: 'Confirmation en cours…', success: 'Demande confirmée', url: `/admin/offer-requests/${id}/status`, body: { status: 'confirmed' } }),
  'booking-confirm': (id) => confirmCall({ eyebrow: 'Réservation', title: `Confirmer ${esc(find('bookings', id).reference)} ?`, message: 'La réservation passera au statut « Confirmé ».', confirmLabel: 'Confirmer', loading: 'Confirmation en cours…', success: 'Réservation confirmée', url: `/admin/bookings/${id}/status`, body: { status: 'confirmed' } }),

  'partner-approve': (id) => confirmCall({ eyebrow: 'Partenaire', title: `Valider ${esc(find('partners', id).tradeName)} ?`, message: 'Ses annonces validées pourront apparaître sur le site.', confirmLabel: 'Valider', loading: 'Validation en cours…', success: 'Partenaire validé', url: `/admin/partners/${id}/status`, body: { status: 'approved' } }),
  'partner-suspend': (id) => confirmCall({ eyebrow: 'Partenaire', title: `Suspendre ${esc(find('partners', id).tradeName)} ?`, message: 'Toutes ses annonces seront retirées du site tant qu’il est suspendu.', confirmLabel: 'Suspendre', tone: 'danger', loading: 'Suspension en cours…', success: 'Partenaire suspendu', url: `/admin/partners/${id}/status`, body: { status: 'inactive' } }),
  'partner-delete': (id) => confirmCall({ eyebrow: 'Suppression', title: `Supprimer ${esc(find('partners', id).tradeName)} ?`, message: 'Le partenaire et ses annonces seront retirés, et son accès sera bloqué.', confirmLabel: 'Supprimer définitivement', tone: 'danger', loading: 'Suppression en cours…', success: 'Partenaire supprimé', method: 'DELETE', url: `/admin/partners/${id}` }),

  'account-new': () => openModal({
    eyebrow: 'Nouveau compte', title: 'Créer un compte interne', confirmLabel: 'Créer le compte', loadingText: 'Création du compte…', wide: true, bodyHtml: accountFormBody(null),
    run: async (f) => {
      const role = f.elements.role.value;
      const body = { name: f.elements.name.value, email: f.elements.email.value, role, permissions: role !== 'it' ? collectPermissions(f) : {} };
      const created = await api('/admin/accounts', { method: 'POST', body: JSON.stringify(body) });
      return { title: 'Compte créé', html: credentialsHtml(created, `${ROLE_LABELS[role]} : ${body.name}`) };
    },
  }),
  'account-edit': (id) => {
    const a = DATA.accounts.find(x => x.id === id);
    openModal({
      eyebrow: 'Compte', title: `Modifier ${a.name}`, confirmLabel: 'Enregistrer', loadingText: 'Enregistrement…', wide: true, bodyHtml: accountFormBody(a),
      run: async (f) => {
        const role = f.elements.role.value;
        await api(`/admin/accounts/${id}`, { method: 'PATCH', body: JSON.stringify({ name: f.elements.name.value, email: f.elements.email.value, role, permissions: role !== 'it' ? collectPermissions(f) : {} }) });
        return { title: 'Compte mis à jour', text: 'Les nouveaux droits s’appliquent immédiatement.' };
      },
    });
  },
  'account-block': (id) => confirmCall({ eyebrow: 'Compte', title: `Bloquer ${esc(DATA.accounts.find(x => x.id === id).name)} ?`, message: 'La personne sera déconnectée et ne pourra plus se connecter tant que le compte est bloqué.', confirmLabel: 'Bloquer le compte', tone: 'danger', loading: 'Blocage en cours…', success: 'Compte bloqué', url: `/admin/accounts/${id}/status`, body: { status: 'inactive' } }),
  'account-unblock': (id) => confirmCall({ eyebrow: 'Compte', title: `Débloquer ${esc(DATA.accounts.find(x => x.id === id).name)} ?`, message: 'La personne pourra de nouveau se connecter.', confirmLabel: 'Débloquer', loading: 'Déblocage en cours…', success: 'Compte débloqué', url: `/admin/accounts/${id}/status`, body: { status: 'active' } }),
  'account-delete': (id) => confirmCall({ eyebrow: 'Suppression', title: `Supprimer ${esc(DATA.accounts.find(x => x.id === id).name)} ?`, message: 'Le compte sera supprimé et l’accès retiré immédiatement. L’historique d’audit est conservé.', confirmLabel: 'Supprimer définitivement', tone: 'danger', loading: 'Suppression en cours…', success: 'Compte supprimé', method: 'DELETE', url: `/admin/accounts/${id}` }),
  'client-block': (id) => confirmCall({ eyebrow: 'Client', title: `Bloquer ${esc(find('clients', id).name)} ?`, message: 'Le client sera déconnecté et ne pourra plus se connecter ni réserver avec ce compte.', confirmLabel: 'Bloquer le compte', tone: 'danger', loading: 'Blocage en cours…', success: 'Compte bloqué', url: `/admin/clients/${id}/status`, body: { status: 'inactive' } }),
  'client-unblock': (id) => confirmCall({ eyebrow: 'Client', title: `Débloquer ${esc(find('clients', id).name)} ?`, message: 'Le client pourra de nouveau se connecter.', confirmLabel: 'Débloquer', loading: 'Déblocage en cours…', success: 'Compte débloqué', url: `/admin/clients/${id}/status`, body: { status: 'active' } }),
  'client-delete': (id) => confirmCall({ eyebrow: 'Suppression', title: `Supprimer ${esc(find('clients', id).name)} ?`, message: 'Le compte sera supprimé et l’accès retiré immédiatement. Ses réservations sont conservées.', confirmLabel: 'Supprimer définitivement', tone: 'danger', loading: 'Suppression en cours…', success: 'Compte supprimé', method: 'DELETE', url: `/admin/clients/${id}` }),
  'partner-reset': (id) => {
    const p = find('partners', id);
    openModal({ eyebrow: 'Partenaire', title: `Réinitialiser le mot de passe de ${p.trade_name || p.name || 'ce partenaire'} ?`, confirmLabel: 'Envoyer le lien', loadingText: 'Envoi du lien…', bodyHtml: '<p class="modal-text">L’ancien mot de passe cessera de fonctionner. Un e-mail contenant un lien pour choisir un nouveau mot de passe sera envoyé au partenaire (valable 48 h).</p>',
      run: async () => ({ title: 'Réinitialisation lancée', html: credentialsHtml(await api(`/admin/partners/${id}/reset-password`, { method: 'POST' }), p.trade_name || p.name || 'le partenaire') }) });
  },
  'client-reset': (id) => {
    const c = find('clients', id);
    openModal({ eyebrow: 'Client', title: `Réinitialiser le mot de passe de ${c.name} ?`, confirmLabel: 'Envoyer le lien', loadingText: 'Envoi du lien…', bodyHtml: '<p class="modal-text">L’ancien mot de passe cessera de fonctionner. Un e-mail contenant un lien pour choisir un nouveau mot de passe sera envoyé au client (valable 48 heures).</p>',
      run: async () => ({ title: 'Réinitialisation lancée', html: credentialsHtml(await api(`/admin/clients/${id}/reset-password`, { method: 'POST' }), c.name) }) });
  },
  'account-reset': (id) => {
    const a = DATA.accounts.find(x => x.id === id);
    openModal({ eyebrow: 'Compte', title: `Réinitialiser le mot de passe de ${a.name} ?`, confirmLabel: 'Envoyer le lien', loadingText: 'Envoi du lien…', bodyHtml: '<p class="modal-text">L’ancien mot de passe cessera de fonctionner. Un e-mail contenant un lien pour choisir un nouveau mot de passe sera envoyé à la personne (valable 48 heures).</p>',
      run: async () => ({ title: 'Réinitialisation lancée', html: credentialsHtml(await api(`/admin/accounts/${id}/reset-password`, { method: 'POST' }), a.name) }) });
  },
};

/* ---------- Événements ---------- */
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.pw-toggle');
  if (toggle) {
    const input = toggle.parentNode.querySelector('input');
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.innerHTML = visible ? EYE_OFF : EYE;
    toggle.setAttribute('aria-label', visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    return;
  }
  const pill = e.target.closest('[data-type-filter]');
  if (pill) {
    document.querySelectorAll('[data-type-filter]').forEach(p => p.classList.toggle('active', p === pill));
    document.querySelectorAll('#tblOffers tbody tr[data-type]').forEach(tr => tr.toggleAttribute('data-typehide', pill.dataset.typeFilter !== 'all' && tr.dataset.type !== pill.dataset.typeFilter));
    return;
  }
  const goto = e.target.closest('[data-goto]');
  if (goto) { show(goto.dataset.goto); return; }
  const btn = e.target.closest('[data-action]');
  if (btn && !btn.disabled) {
    const fn = ACT[btn.dataset.action];
    if (fn) { e.preventDefault(); try { fn(btn.dataset.id, btn); } catch (err) { console.error(err); toast('Impossible d’ouvrir cette action.'); } }
    return;
  }
  const row = e.target.closest('[data-detail]');
  if (row && !e.target.closest('a:not([data-detail]), button, input, select, label')) { e.preventDefault(); if (row.dataset.detail === 'chat') openChat(row.dataset.id); else if (row.dataset.detail === 'client') openClientDrawer(row.dataset.id); else openDrawer(row.dataset.detail, row.dataset.id); }
});

document.addEventListener('change', (e) => {
  if (e.target.name === 'when') {
    const scope = e.target.closest('fieldset');
    const date = scope.querySelector('input[name=publishAt]');
    const later = e.target.value === 'later';
    date.hidden = !later;
    date.required = later;
    if (later && !date.value) date.value = toLocalInput(new Date(Date.now() + 3600e3).toISOString());
  }
  if (e.target.name === 'role' && e.target.closest('.modal')) {
    const full = e.target.value === 'it';
    const modal = e.target.closest('.modal');
    modal.querySelector('.perms').hidden = full;
    modal.querySelector('.perms-full').hidden = !full;
    // Nouveau compte : les droits de départ suivent le rôle choisi.
    if (!full && modal.querySelector('[data-new-account]')) {
      const base = new Set(DEFAULT_PERMS[e.target.value] || []);
      ALL_PERMS.forEach((k) => { const c = modal.querySelector(`[name="perm_${k}"]`); if (c && !c.disabled) c.checked = base.has(k); });
    }
  }
});

function applyTableFilters(tableId) {
  const q = (document.querySelector(`[data-filter="${tableId}"]`)?.value || '').trim().toLowerCase();
  const active = [...document.querySelectorAll(`[data-col-filter="${tableId}"]`)].filter(sel => sel.value).map(sel => [sel.dataset.key, sel.value]);
  let rows = 0, visible = 0;
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(tr => {
    const isData = tr.hasAttribute('data-detail') || [...tr.attributes].some(a => a.name.startsWith('data-f-'));
    if (!isData) { tr.hidden = Boolean(q) || active.length > 0; return; }
    rows += 1;
    const ok = (!q || tr.textContent.toLowerCase().includes(q)) && active.every(([key, value]) => tr.getAttribute(`data-f-${key}`) === value);
    tr.hidden = !ok;
    if (ok) visible += 1;
  });
  const none = document.querySelector(`[data-none="${tableId}"]`);
  if (none) none.hidden = !(rows > 0 && visible === 0);
}

document.addEventListener('input', (e) => {
  const input = e.target.closest('[data-filter]');
  if (input) applyTableFilters(input.dataset.filter);
});
document.addEventListener('change', (e) => {
  const select = e.target.closest('[data-col-filter]');
  if (select) applyTableFilters(select.dataset.colFilter);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalState) closeDrawer(); });
$('#overlay').addEventListener('click', closeDrawer);

document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!['loginForm', 'forgotForm', 'activateForm', 'changePasswordForm', 'partnerForm', 'profileForm', 'passwordForm', 'chatReplyForm'].includes(form.id)) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const errorEl = form.id === 'loginForm' ? $('#loginError') : form.id === 'changePasswordForm' ? $('#changePasswordError') : form.id === 'activateForm' ? $('#activateError') : null;
  if (errorEl) errorEl.hidden = true;
  const submit = form.querySelector('button[type=submit]');

  if (form.id === 'chatReplyForm') {
    const stopChat = setLoading(submit, 'Envoi…');
    const note = CH.mode === 'note';
    try {
      if (note) await api(`/admin/chats/${form.dataset.thread}/notes`, { method: 'POST', body: JSON.stringify({ message: data.message }) });
      else {
        if (!String(data.message || '').trim() && !CH.files.length) throw new ApiError('Écrivez un message ou joignez un fichier.');
        const res = await api(`/admin/chats/${form.dataset.thread}/messages`, { method: 'POST', body: JSON.stringify({ message: data.message || '', attachments: CH.files }) });
        toast(res.notified ? 'Réponse envoyée, la personne a été prévenue par e-mail.' : 'Réponse enregistrée (l’e-mail de notification n’a pas pu partir).');
      }
      if (note) toast('Note ajoutée.');
      CH.files = []; CH.mode = 'reply';
      await openChat(form.dataset.thread);
      render();
    } catch (err) {
      stopChat();
      if (!(err instanceof ApiError)) console.error(err);
      toast(err.message);
    }
    return;
  }

  if (form.id === 'passwordForm') {
    if (data.newPassword !== data.confirm) return toast('Les deux nouveaux mots de passe ne correspondent pas.');
    openModal({
      eyebrow: 'Sécurité', title: 'Changer votre mot de passe ?', confirmLabel: 'Changer le mot de passe', loadingText: 'Mise à jour du mot de passe…',
      bodyHtml: '<p class="modal-text">Votre nouveau mot de passe sera utilisé dès votre prochaine connexion. Vous restez connecté sur cet appareil.</p>',
      run: async () => {
        const res = await api('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }) });
        saveSession({ token: res.token });
        return { title: 'Mot de passe modifié', text: 'Votre accès est à jour.' };
      },
    });
    return;
  }

  if (form.id === 'profileForm') {
    const stopProfile = setLoading(submit, 'Enregistrement…');
    try {
      const res = await api('/auth/profile', { method: 'PATCH', body: JSON.stringify({ firstName: data.firstName, lastName: data.lastName, phone: data.phone || undefined }) });
      saveSession({ user: { ...user, name: res.name } });
      toast('Profil mis à jour.');
      stopProfile();
      render();
    } catch (err) {
      stopProfile();
      if (!(err instanceof ApiError)) console.error(err);
      toast(err.message);
    }
    return;
  }

  if (form.id === 'partnerForm') {
    openModal({
      eyebrow: 'Partenaire', title: `Créer ${data.tradeName} ?`, confirmLabel: 'Créer le partenaire', loadingText: 'Création du partenaire et de son accès…',
      bodyHtml: `<p class="modal-text">Un e-mail d’activation sera envoyé à <strong>${esc(data.loginEmail)}</strong> pour qu’il choisisse lui-même son mot de passe.</p>`,
      run: async () => {
        const created = await api('/admin/partners', { method: 'POST', body: JSON.stringify(data) });
        return { title: 'Partenaire créé', html: credentialsHtml(created, data.tradeName) };
      },
    });
    return;
  }

  const stop = setLoading(submit, form.id === 'loginForm' ? 'Connexion…' : form.id === 'forgotForm' ? 'Envoi…' : 'Enregistrement…');
  try {
    if (form.id === 'loginForm') {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(ERRORS[body.error] || 'E-mail ou mot de passe incorrect.');
      // Le back-office est réservé à l'équipe TripVision : clients et partenaires ont leurs propres espaces.
      if (!BO.includes(body.user?.role)) throw new ApiError('E-mail ou mot de passe incorrect.');
      meLoaded = true;
      saveSession(body);
      form.reset();
      location.hash = '';
      return render();
    }
    if (form.id === 'forgotForm') {
      await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const msg = $('#forgotMsg');
      msg.textContent = 'Si ce compte existe, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Pensez à vérifier vos courriers indésirables.';
      msg.hidden = false;
      return;
    }
    if (form.id === 'activateForm') {
      if (data.password !== data.confirm) throw new ApiError('Les deux mots de passe ne correspondent pas.');
      const res = await fetch('/api/auth/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: activation.token, password: data.password }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.error === 'INVALID_LINK') { showActivation('invalid'); return; }
        throw new ApiError(body.message || ERRORS[body.error] || 'Impossible d’enregistrer le mot de passe.');
      }
      activation.email = body.email;
      form.reset();
      const internal = BO.includes(body.role);
      $('#activateGoLogin').hidden = !internal;
      $('#activateGoSite').hidden = internal;
      if (internal) $('#activateDoneText').textContent = 'Votre accès est activé. Vous pouvez maintenant vous connecter au back-office.';
      else {
        // Partenaire ou client : retour vers sa propre page de connexion, e-mail prérempli.
        const target = body.role === 'partner' ? '/#partner' : '/#login';
        try { sessionStorage.setItem('tv_login_email', body.email); } catch { /* stockage indisponible */ }
        $('#activateDoneText').textContent = 'Votre mot de passe est enregistré. Redirection vers votre page de connexion…';
        $('#activateGoSite').textContent = body.role === 'partner' ? 'Aller à la connexion partenaire' : 'Aller à la connexion client';
        $('#activateGoSite').href = target;
        setTimeout(() => { location.href = target; }, 2200);
      }
      showActivation('done');
      return;
    }
    if (form.id === 'changePasswordForm') {
      if (data.password !== data.confirm) throw new ApiError('Les deux mots de passe ne correspondent pas.');
      const body = await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ password: data.password }) });
      user.mustChangePassword = false;
      saveSession({ token: body.token, user });
      form.reset();
      toast('Mot de passe mis à jour.');
      return render();
    }
  } catch (err) {
    if (!(err instanceof ApiError)) console.error(err);
    if (errorEl) { errorEl.textContent = err.message; errorEl.hidden = false; } else toast(err.message);
  } finally { stop(); }
});

$('.me').addEventListener('click', (e) => { if (!e.target.closest('#logoutBtn')) location.hash = 'profile'; });
$('.me').style.cursor = 'pointer';
$('.me').title = 'Mon profil';

/* Le défilement sur le menu ne doit jamais faire bouger la page. */
$('.sidebar').addEventListener('wheel', (e) => {
  const nav = $('#nav');
  const scrollable = nav.scrollHeight > nav.clientHeight + 1;
  const atTop = nav.scrollTop <= 0;
  const atBottom = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1;
  if (!nav.contains(e.target) || !scrollable || (e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) e.preventDefault();
}, { passive: false });

$('#logoutBtn').addEventListener('click', () => {
  openModal({ eyebrow: 'Session', title: 'Se déconnecter ?', confirmLabel: 'Se déconnecter', tone: 'danger', loadingText: 'Déconnexion…', bodyHtml: '<p class="modal-text">Vous devrez saisir à nouveau vos identifiants.</p>', run: async () => ({ title: 'À bientôt', text: 'Vous êtes déconnecté.' }), onDone: () => logout() });
});
$('#collapseBtn').addEventListener('click', () => setCollapsed(!$('#app').classList.contains('collapsed')));
window.addEventListener('hashchange', () => { closeDrawer(); render(); });

/* ---------- Galerie d'images : sélection multiple ou glisser-déposer ---------- */
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
  const res = await fetch('/api/admin/uploads', { method: 'POST', headers: { 'Content-Type': file.type, Authorization: `Bearer ${token}` }, body: file });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(ERRORS[data.error] || 'Session expirée, reconnectez-vous.'); throw new ApiError('Session expirée.'); }
  if (!res.ok) throw new ApiError(ERRORS[data.error] || `Erreur ${res.status}`);
  return data.url;
}

async function galUpload(g, files) {
  if (g.dataset.busy) return;
  const maxPhotos = Number(g.dataset.max || GALLERY_MAX);
  const room = maxPhotos - galImages(g).length;
  if (room <= 0) return toast(`Maximum ${maxPhotos} photos.`);
  const queue = [...files].filter(f => f.type.startsWith('image/') || IMAGE_TYPES.includes(f.type));
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
      try { galSet(g, [...galImages(g), await uploadFile(todo[i])]); }
      catch (err) { toast(err.message || 'Téléversement impossible.'); }
    }
  } finally {
    delete g.dataset.busy;
    setZone(zone, 'empty');
    progress(-1);
  }
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
document.addEventListener('click', (e) => {
  const t = e.target.closest?.('[data-thumb]');
  const main = t && $('#drawer .drawer-img');
  if (main) main.src = t.src;
});

/* ---------- Déconnexion automatique après 15 minutes d'inactivité ---------- */
const IDLE_MS = 15 * 60 * 1000;
const IDLE_WARNING_MS = 60 * 1000;
const PING_EVERY_MS = 4 * 60 * 1000;
let idleTimer = null, warnTimer = null, countdown = null, lastPing = Date.now();

function hideIdleWarning() {
  clearInterval(countdown);
  const el = $('#idleWarn');
  if (el) el.hidden = true;
}

function showIdleWarning() {
  let el = $('#idleWarn');
  if (!el) {
    el = document.createElement('div');
    el.id = 'idleWarn';
    el.setAttribute('role', 'alert');
    el.innerHTML = '<span>Inactif : déconnexion dans <b id="idleCount">60</b> s</span><button class="btn small primary" type="button" id="idleStay">Rester connecté</button>';
    document.body.appendChild(el);
    $('#idleStay').addEventListener('click', () => resetIdle(true));
  }
  el.hidden = false;
  let left = Math.round(IDLE_WARNING_MS / 1000);
  $('#idleCount').textContent = left;
  clearInterval(countdown);
  countdown = setInterval(() => { left -= 1; $('#idleCount').textContent = Math.max(left, 0); }, 1000);
}

function stopIdle() {
  clearTimeout(idleTimer);
  clearTimeout(warnTimer);
  hideIdleWarning();
}

function resetIdle(force = false) {
  if (!token) return stopIdle();
  const warning = $('#idleWarn') && !$('#idleWarn').hidden;
  if (warning && !force) return;
  stopIdle();
  warnTimer = setTimeout(showIdleWarning, IDLE_MS - IDLE_WARNING_MS);
  idleTimer = setTimeout(() => logout('Session expirée par inactivité. Reconnectez-vous.'), IDLE_MS);
  if (Date.now() - lastPing > PING_EVERY_MS) {
    lastPing = Date.now();
    fetch('/api/auth/ping', { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (r.status === 401) logout('Session expirée par inactivité. Reconnectez-vous.'); }).catch(() => {});
  }
}

let lastMove = 0;
['mousemove', 'keydown', 'click', 'scroll', 'wheel', 'touchstart'].forEach(name => {
  document.addEventListener(name, () => { const now = Date.now(); if (now - lastMove > 1000) { lastMove = now; resetIdle(); } }, { passive: true, capture: true });
});

/* ---------- Activation / réinitialisation par lien ---------- */
const activation = { token: null, email: '' };

function showActivation(state) {
  show('activate');
  $('#activateLoading').hidden = state !== 'loading';
  $('#activateForm').hidden = state !== 'form';
  $('#activateDone').hidden = state !== 'done';
  $('#activateInvalid').hidden = state !== 'invalid';
}

async function enterActivation(token) {
  activation.token = token;
  showActivation('loading');
  try {
    const res = await fetch(`/api/auth/token-info?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error('invalid');
    const info = await res.json();
    activation.email = info.email;
    const reset = info.purpose === 'reset';
    $('#activateEyebrow').textContent = reset ? 'Réinitialisation' : 'Activation';
    $('#activateTitle').innerHTML = reset ? 'Nouveau <em>mot de passe</em>' : 'Activer <em>mon accès</em>';
    $('#activateWho').textContent = `${info.name} · ${info.email}`;
    showActivation('form');
  } catch { showActivation('invalid'); }
}

$('#activateGoLogin').addEventListener('click', () => {
  show('login');
  const f = $('#loginForm');
  f.email.value = activation.email;
  f.password.focus();
});

document.addEventListener('click', async (e) => {
  const copy = e.target.closest('[data-copy]');
  if (!copy) return;
  try { await navigator.clipboard.writeText(copy.dataset.copy); toast('Lien copié.'); } catch { toast('Copie impossible : sélectionnez le lien manuellement.'); }
});

try { setCollapsed(localStorage.getItem('tv_bo_collapsed') === '1'); } catch { /* stockage indisponible */ }
// Scène animée (avions, voitures, hôtel) dans la partie décorative des écrans de connexion.
document.querySelectorAll('.auth-art').forEach((el) => window.TVScene?.mount(el, { variant: 'night' }));
enhancePasswords();
const linkToken = new URLSearchParams(location.search).get('token');
if (linkToken) {
  history.replaceState(null, '', location.pathname + location.hash);
  enterActivation(linkToken);
} else {
  render();
}

// Menu repliable (mobile et tablette)
document.addEventListener('click', (e) => {
  const b = e.target.closest('#menuBtn');
  const app = document.querySelector('.app');
  if (b && app) { const on = app.classList.toggle('nav-open'); b.setAttribute('aria-expanded', String(on)); }
  else if (app && e.target.closest('#nav a')) app.classList.remove('nav-open');
});
