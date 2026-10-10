import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { mailConfigured, sendMail, invitationEmail, resetEmail, notificationEmail } from './mailer.js';
import { query } from './db.js';
import { canManageRole, hasPermission, effectivePermissions, sanitizePermissions, BACKOFFICE_ROLES, GOVERNANCE_ROLES, IT_ROLES } from './roles.js';
import ExcelJS from 'exceljs';
import { bookingPdf, requestPdf } from './pdf.js';
import { paymentsEnabled, testMode, createCheckout, retrieveSession, expireSession, refundPayment, constructEvent, webhookSecret } from './payments.js';
import { listCountries, searchCities, searchAirports, searchPlaces, countryCodeByName } from './geo.js';
// Moteur de prix partagé avec le site (grille par durée, saisons, retard toléré, lissage des seuils).
import '../assets/pricing.js';
const Pricing = globalThis.TVPricing;
import { isLockedOut, recordFailedAttempt, clearAttempts, passwordProblem, audit, recordLogin, clientIp } from './security.js';

const app = express();
const PORT = process.env.PORT || 3000;
const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
const JWT_SECRET = requiredEnv('JWT_SECRET');
const IDLE_LIMIT_MS = 15 * 60 * 1000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const categoryImages = {
  'Mini (A)': 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85',
  'Économique (B)': 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=85',
  'Compacte (C)': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=85',
  'Intermédiaire (D)': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85',
  'Routière (E)': 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85',
  'SUV et Break': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=85',
  'Monospace ou Minibus': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=85',
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'img-src': ["'self'", 'data:', 'blob:', 'https:'] },
  },
}));
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '2mb', verify: (req, _res, buf) => { if (req.originalUrl.startsWith('/api/stripe/webhook')) req.rawBody = buf; } }));
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
app.use('/backoffice', express.static(join(root, 'backoffice')));
app.use('/espace', express.static(join(root, 'espace')));
app.use('/activation', express.static(join(root, 'activation')));
app.use('/assets', express.static(join(root, 'assets')));
const siteFiles = ['index.html', 'styles.css', 'premium.css', 'script.js'];
app.get('/', (_req, res) => res.sendFile(join(root, 'index.html')));
siteFiles.forEach(f => app.get(`/${f}`, (_req, res) => res.sendFile(join(root, f))));

const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role, email: user.email, mustChangePassword: user.must_change_password }, JWT_SECRET, { expiresIn: '7d' });

function auth(...allowedRoles) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'INVALID_TOKEN' }); }
    try {
      const { rows } = await query('SELECT id, email, name, role, active, permissions, must_change_password, last_activity_at FROM users WHERE id = $1 AND deleted_at IS NULL', [payload.id]);
      const u = rows[0];
      if (!u || !u.active) return res.status(401).json({ error: 'ACCOUNT_DISABLED' });
      if (u.role !== 'partner' && u.role !== 'client') {
        const idle = u.last_activity_at ? Date.now() - new Date(u.last_activity_at).getTime() : 0;
        if (idle > IDLE_LIMIT_MS) return res.status(401).json({ error: 'SESSION_EXPIRED' });
        if (!u.last_activity_at || idle > 30000) await query('UPDATE users SET last_activity_at = now() WHERE id = $1', [u.id]);
      }
      if (allowedRoles.length && !allowedRoles.includes(u.role)) return res.status(403).json({ error: 'FORBIDDEN' });
      if (u.must_change_password && req.path !== '/api/auth/change-password') return res.status(403).json({ error: 'PASSWORD_CHANGE_REQUIRED' });
      req.user = { id: u.id, email: u.email, name: u.name, role: u.role, permissions: u.permissions || {} };
      next();
    } catch (err) { next(err); }
  };
}
const can = (key) => (req, res, next) => hasPermission(req.user, key) ? next() : res.status(403).json({ error: 'PERMISSION_DENIED' });
const canAny = (...keys) => (req, res, next) => (keys.some(k => hasPermission(req.user, k)) ? next() : res.status(403).json({ error: 'PERMISSION_DENIED' }));
const canChat = canAny('chats.reply', 'chats.manage');

// ---------- Liens d'activation / réinitialisation (à usage unique, envoyés par e-mail) ----------
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const TOKEN_HOURS = { invite: 48, reset: 2 };
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const unusablePasswordHash = () => bcrypt.hash(randomBytes(32).toString('hex'), 10);

async function issueToken(userId, purpose, hours) {
  const token = randomBytes(32).toString('base64url');
  await query('UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [userId]);
  await query("INSERT INTO auth_tokens(user_id, token_hash, purpose, expires_at) VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)", [userId, hashToken(token), purpose, String(hours)]);
  // Le lien mène à la page d'activation commune : clients et partenaires n'ont jamais de lien vers le back-office.
  return `${APP_URL}/activation/?token=${token}`;
}

async function sendAccessLink(user, purpose, { invitedBy, hours } = {}) {
  const validity = hours ?? TOKEN_HOURS[purpose];
  const url = await issueToken(user.id, purpose, validity);
  const mail = purpose === 'reset' ? resetEmail({ name: user.name, url, hours: validity }) : invitationEmail({ name: user.name, url, hours: validity, invitedBy });
  const result = await sendMail({ to: user.email, ...mail });
  return result.sent
    ? { emailSent: true }
    : { emailSent: false, activationUrl: url, emailError: (mailConfigured || process.env.BREVO_API_KEY) ? 'L’e-mail n’a pas pu être envoyé.' : 'L’envoi d’e-mails n’est pas configuré.' };
}

// Activation du compte client : lien à usage unique envoyé par e-mail, le compte ne se connecte qu'après.
async function sendVerification(user) {
  const token = randomBytes(32).toString('base64url');
  await query("UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND purpose = 'verify' AND used_at IS NULL", [user.id]);
  await query("INSERT INTO auth_tokens(user_id, token_hash, purpose, expires_at) VALUES ($1, $2, 'verify', now() + interval '48 hours')", [user.id, hashToken(token)]);
  const url = `${APP_URL}/api/auth/verify-email?t=${token}`;
  const result = await sendMail({ to: user.email, ...notificationEmail({ subject: 'Activez votre compte TripVision', title: `Bienvenue, ${mailText(user.name)}`, intro: 'Votre compte TripVision est créé. Cliquez sur le bouton ci-dessous pour l’activer, puis connectez-vous pour réserver.', buttonLabel: 'Activer mon compte', url, outro: 'Ce lien est personnel et valable 48 heures. Si vous n’êtes pas à l’origine de cette inscription, ignorez cet e-mail.' }) });
  if (!result.sent) console.warn(`Activation (e-mail non envoyé) ${user.email} : ${url}`);
  return result.sent;
}
const STAFF_EMAIL = process.env.SUPPORT_EMAIL || process.env.CONTACT_TO || '';
const mailText = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mailDay = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const staffLink = (section) => `${APP_URL}/backoffice/#${section}`;
const espaceLink = (section) => `${APP_URL}/espace/#${section}`;
const bookingRef = (id) => `TV-${String(id).slice(0, 8).toUpperCase()}`;
// Les e-mails ne contiennent jamais le texte d'un message : seulement l'alerte et un bouton d'accès à l'espace.
const notify = (to, mail, replyTo) => { if (to) sendMail({ to, ...mail, ...(replyTo ? { replyTo } : {}) }).catch(() => {}); };
const bookingDetails = (b, vehicleName) => {
  const total = b.total_estimate != null ? Number(b.total_estimate) : null, paid = b.payment_status === 'paid' ? Number(b.paid_amount || b.commission_amount || 0) : null;
  return [['Référence', bookingRef(b.id)], ['Véhicule', vehicleName], ['Client', b.customer_name], ['Du', [mailDay(b.start_date), b.start_time].filter(Boolean).join(' · ')], ['Au', [mailDay(b.end_date), b.end_time].filter(Boolean).join(' · ')],
    ['Total', total != null ? `${total} €` : ''], ['Payé en ligne (acompte)', paid != null ? `${paid} €` : ''], ['À régler à l’agence', total != null && paid != null ? `${Math.max(0, Math.round((total - paid) * 100) / 100)} €` : '']];
};
async function notifyBookingStatus(booking, status) {
  if (status === 'pending') return;
  const ctx = await vehicleContext(booking.vehicle_id);
  pushNotification(await clientUserId(booking.customer_email), { kind: 'booking', title: status === 'confirmed' ? 'Réservation confirmée' : 'Réservation annulée', body: `${bookingRef(booking.id)} · ${ctx.name}`, link: 'orders', refId: booking.id });
  notify(booking.customer_email, notificationEmail({
    subject: status === 'confirmed' ? 'Votre réservation TripVision est confirmée' : 'Votre réservation TripVision a été annulée',
    title: status === 'confirmed' ? 'Réservation confirmée' : 'Réservation annulée',
    intro: status === 'confirmed' ? 'Bonne nouvelle : votre réservation est confirmée.' : 'Votre réservation a été annulée.',
    details: bookingDetails(booking, ctx.name).filter(([k]) => k !== 'Client'), buttonLabel: 'Voir ma réservation', url: espaceLink('orders'),
  }));
}
async function vehicleContext(vehicleId) {
  if (!vehicleId) return { name: 'Location de véhicule', partnerUserId: null, partnerMail: '' };
  const { rows } = await query(`SELECT v.model, p.user_id AS partner_user_id, p.booking_email, p.contact_email, u.email AS user_email FROM vehicles v LEFT JOIN partners p ON p.id = v.partner_id LEFT JOIN users u ON u.id = p.user_id WHERE v.id = $1`, [vehicleId]);
  const r = rows[0] || {};
  return { name: r.model || 'Location de véhicule', partnerUserId: r.partner_user_id || null, partnerMail: r.booking_email || r.contact_email || r.user_email || '' };
}
// Centre de notifications : « staff » est partagé par toute l'équipe, sinon une personne précise. Jamais le contenu d'un message.
async function pushNotification(target, { kind, title, body = '', link = '', refId = null }) {
  try {
    if (target === 'staff') await query("INSERT INTO notifications(audience, kind, title, body, link, ref_id) VALUES ('staff',$1,$2,$3,$4,$5)", [kind, title, body, link, refId]);
    else if (target) await query("INSERT INTO notifications(audience, user_id, kind, title, body, link, ref_id) VALUES ('user',$1,$2,$3,$4,$5,$6)", [target, kind, title, body, link, refId]);
  } catch (err) { console.error('Notification impossible :', err.message); }
}
const clientUserId = async (email) => (await query("SELECT id FROM users WHERE lower(email) = lower($1) AND role = 'client' AND deleted_at IS NULL", [email])).rows[0]?.id || null;
// Carnet de contacts du mailing : une ligne par adresse e-mail ; le consentement marketing est enregistré à part.
async function recordContact({ email, name, phone, source, consent = false, count = 0 }) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return { returning: false };
  try {
    const { rows: existing } = await query('SELECT id FROM contacts WHERE lower(email) = $1', [e]);
    await query(
      `INSERT INTO contacts(email, name, phone, sources, consent, consent_at, requests_count)
       VALUES ($1, $2, $3, $4::text[], $5::boolean, CASE WHEN $5::boolean THEN now() END, $6)
       ON CONFLICT (lower(email)) DO UPDATE SET
         name = COALESCE(NULLIF($2, ''), contacts.name), phone = COALESCE(NULLIF($3, ''), contacts.phone),
         sources = (SELECT array_agg(DISTINCT x) FROM unnest(contacts.sources || $4::text[]) x),
         consent = contacts.consent OR $5::boolean, consent_at = CASE WHEN $5::boolean AND NOT contacts.consent THEN now() ELSE contacts.consent_at END,
         unsubscribed_at = CASE WHEN $5::boolean THEN NULL ELSE contacts.unsubscribed_at END,
         requests_count = contacts.requests_count + $6, last_seen_at = now()`,
      [e, name || null, phone || null, [source], Boolean(consent), count]);
    return { returning: existing.length > 0 };
  } catch (err) { console.error('Contact :', err.message); return { returning: false }; }
}
// Compte client facultatif : renvoie l'utilisateur si le jeton est valide, sinon null.
async function optionalClient(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const { rows } = await query("SELECT id, email, name, role, active FROM users WHERE id = $1 AND deleted_at IS NULL", [payload.id]);
    return rows[0] && rows[0].active && rows[0].role === 'client' ? rows[0] : null;
  } catch { return null; }
}
const normalizeImage = (url) => (typeof url === 'string' && url.startsWith(`${APP_URL}/uploads/`) ? url.slice(APP_URL.length) : url);
const absImage = (url) => (typeof url === 'string' && url.startsWith('/uploads/') ? `${APP_URL}${url}` : url);
const DEFAULT_OFFER_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85';
const cleanImages = (list, max = 10) => (Array.isArray(list) ? list.map(normalizeImage).filter(Boolean).slice(0, max) : []);
const withAbsImage = (row) => {
  const details = row.details || {};
  const images = cleanImages(details.images).map(absImage);
  return { ...row, image: images[0] || absImage(row.image), images: images.length ? images : (row.image ? [absImage(row.image)] : []), flight: details.flight || null, transport: details.transport || null, ratings: details.ratings || [] };
};

// ---------- Images importées (stockées en base, servies publiquement) ----------
const IMAGE_SIGNATURES = {
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
};
const uploadPermissions = ['vehicles.create', 'vehicles.edit', 'offers.create', 'offers.edit'];

const rawImage = express.raw({ type: Object.keys(IMAGE_SIGNATURES), limit: '5mb' });
app.post('/api/admin/uploads', auth(...BACKOFFICE_ROLES), rawImage, h(async (req, res) => {
  if (!uploadPermissions.some(k => hasPermission(req.user, k))) return res.status(403).json({ error: 'PERMISSION_DENIED' });
  await storeUpload(req, res);
}));
app.post('/api/partner/uploads', auth('partner'), rawImage, h(storeUpload));

async function storeUpload(req, res) {
  const mime = String(req.headers['content-type'] || '').split(';')[0].trim();
  const body = req.body;
  if (!IMAGE_SIGNATURES[mime] || !Buffer.isBuffer(body) || body.length === 0) return res.status(400).json({ error: 'INVALID_IMAGE' });
  if (!IMAGE_SIGNATURES[mime](body)) return res.status(400).json({ error: 'INVALID_IMAGE' });
  const { rows } = await query('INSERT INTO files(mime, size, data, created_by) VALUES ($1,$2,$3,$4) RETURNING id', [mime, body.length, body, req.user.id]);
  await audit(req.user.id, 'upload_image', 'file', rows[0].id, clientIp(req));
  res.status(201).json({ url: `/uploads/${rows[0].id}` });
}

app.get('/uploads/:id', h(async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).end();
  const { rows } = await query('SELECT mime, data FROM files WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).end();
  res.set({ 'Content-Type': rows[0].mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'cross-origin' });
  res.send(rows[0].data);
}));

async function findValidToken(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return null;
  const { rows } = await query(
    `SELECT t.id, t.purpose, u.id AS user_id, u.name, u.email, u.role
     FROM auth_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > now() AND u.active AND u.deleted_at IS NULL`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const changePasswordSchema = z.object({ password: z.string().min(1) });
const phoneField = z.string().trim().min(6, 'Indiquez un numéro de téléphone valide.').max(30).refine((v) => v.replace(/\D/g, '').length >= 6, 'Indiquez un numéro de téléphone valide.');
const clientRegisterSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), phone: phoneField, marketing: z.boolean().optional() });
const partnerSchema = z.object({
  legalName: z.string().min(2), tradeName: z.string().min(2), headOffice: z.string().min(2), agencies: z.string().min(2),
  siret: z.string().min(2), bookingEmail: z.string().email(), contactEmail: z.string().email(), managerName: z.string().min(2),
  kbisName: z.string().optional(), loginId: z.string().optional(), phone: z.string().optional(), city: z.string().optional(),
});
const extraSchema = z.object({
  key: z.string().trim().min(1).max(40), name: z.string().trim().min(1).max(60), description: z.string().trim().max(300).optional(),
  pricePerDay: z.coerce.number().positive().max(10000), pricing: z.enum(['day', 'once']).default('day'), maxQty: z.coerce.number().int().min(1).max(10).default(1),
});
// Les informations de l'annonce sont saisies par le back-office ou l’enseigne ; TripVision n'impose que l'essentiel pour publier.
const vehicleBase = z.object({
  model: z.string().min(2), category: z.string().min(2), passengers: z.coerce.number().int().positive(), transmission: z.string().min(2),
  doors: z.coerce.number().int().positive(), bags: z.coerce.number().int().min(0).max(30).default(0), airConditioning: z.boolean().default(true),
  fuelType: z.string().trim().min(2, 'Indiquez le carburant.').max(30), volumeM3: z.coerce.number().positive().max(60).optional(), payloadKg: z.coerce.number().positive().max(20000).optional(),
  // Tarifs TTC saisis une fois : 5 paliers de prix par jour selon la durée totale, saisons, règles.
  rates: z.object({
    tiers: z.array(z.coerce.number({ invalid_type_error: 'Indiquez un prix pour chaque palier.' }).positive('Indiquez un prix pour chaque palier.').max(5000)).length(5, 'Indiquez un prix pour chaque palier.'),
    seasons: z.array(z.object({ name: z.string().trim().min(1, 'Nommez chaque saison.').max(40), from: z.string().regex(/^\d{2}-\d{2}$/, 'Date de début de saison invalide.'), to: z.string().regex(/^\d{2}-\d{2}$/, 'Date de fin de saison invalide.'), coef: z.coerce.number().min(0.5, 'Coefficient entre 0,5 et 3.').max(3, 'Coefficient entre 0,5 et 3.') })).max(8).default([]),
    minDays: z.coerce.number().int().min(1).max(30).default(1), maxDays: z.coerce.number().int().min(1).max(30, 'La durée maximale est de 30 jours.').default(30),
    grace: z.coerce.number().int().min(0).max(180).default(59), smoothing: z.boolean().default(true),
  }, { required_error: 'Saisissez la grille de tarifs.' }).refine((r) => r.minDays <= r.maxDays, { message: 'La durée minimale doit être inférieure à la durée maximale.', path: ['minDays'] }),
  oldPriceDay: z.coerce.number().positive().optional(),
  pickupAddress: z.string().min(2), city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional().refine((c) => !c || countryCodeByName(c) === 'FR', { message: 'Les locations de voitures sont pour l’instant disponibles uniquement en France.' }),
  officeHours: z.string().trim().max(200).optional(), pickupInstructions: z.string().trim().max(500).optional(),
  officeHoursWeek: z.record(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']), z.object({ open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/) }).nullable()).refine((w) => Object.values(w).some(Boolean), { message: 'Indiquez les horaires d’ouverture de l’agence (au moins un jour).' }),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indiquez la date à partir de laquelle le véhicule est disponible.'), availableUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indiquez la date jusqu’à laquelle le véhicule est louable.'),
  includedCustom: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  // Restitution dans un autre lieu que le retrait : impossible, possible sans frais, ou avec un montant fixé par l’enseigne.
  returnPolicy: z.enum(['none', 'free', 'fee'], { errorMap: () => ({ message: 'Indiquez si le véhicule peut être rendu dans un autre lieu.' }) }), returnFee: z.coerce.number().min(0).max(5000).optional(),
  returnLocations: z.array(z.object({ key: z.string().trim().min(1).max(40), name: z.string().trim().min(1).max(120), address: z.string().trim().max(200).optional() })).max(15).optional(),
  youngDriverAge: z.coerce.number().int().min(19).max(30).optional(), youngDriverFee: z.coerce.number().min(0).max(1000).optional(), youngDriverPricing: z.enum(['day', 'once']).default('day'),
  blocks: z.array(z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/), reason: z.string().trim().max(120).optional() })).max(60).optional(),
  lessorName: z.string().trim().max(120).optional(), returnLocation: z.string().trim().max(200).optional(),
  deposit: z.coerce.number().min(0).max(100000).optional(), excess: z.coerce.number().min(0).max(100000).optional(), minAge: z.coerce.number().int({ message: 'Indiquez l’âge minimum du conducteur.' }).min(18).max(99),
  unlimitedKm: z.boolean().default(false), kmPerDay: z.coerce.number().int().positive().max(5000).optional(), extraKmPrice: z.coerce.number().min(0).max(100).optional(),
  fuelPolicy: z.string().trim().min(2, 'Indiquez la politique carburant.').max(80),
  // Annulation : période gratuite éventuelle, puis frais d'annulation fixés par l’enseigne.
  freeCancelHours: z.coerce.number().int().min(0).max(720), cancelFee: z.coerce.number().positive({ message: 'Indiquez les frais d’annulation.' }).max(5000), freeModification: z.boolean().default(false),
  theftProtection: z.boolean().default(false), fullInsurance: z.boolean().default(false), insuranceType: z.string().trim().max(120).optional(),
  taxesIncluded: z.boolean().default(true),
  rentalConditions: z.string().trim().min(10, 'Les conditions de location de l’enseigne sont obligatoires.').max(3000), tips: z.string().trim().max(600).optional(),
  extras: z.array(extraSchema).max(8).optional(),
});
const untilAfterFrom = [(v) => v.availableUntil >= v.availableFrom, { message: 'La fin de la période de location doit suivre son début.', path: ['availableUntil'] }];
const maxPeriodRule = [(v) => new Date(`${v.availableUntil}T00:00:00Z`).getTime() - new Date(`${v.availableFrom}T00:00:00Z`).getTime() <= 30 * 864e5, { message: 'Un véhicule peut être mis en ligne pour 30 jours au maximum : raccourcissez la période (vous pourrez la prolonger ensuite).', path: ['availableUntil'] }];
const kmRule = [(v) => v.unlimitedKm || (Number(v.kmPerDay) > 0 && v.extraKmPrice !== undefined && v.extraKmPrice !== null), { message: 'Indiquez le kilométrage inclus par jour et le supplément par km en plus (ou cochez « illimité »).', path: ['kmPerDay'] }];
const utilityRule = [(v) => !/utilit/i.test(v.category) || (Number(v.volumeM3) > 0 && Number(v.payloadKg) > 0), { message: 'Indiquez le volume utile et la charge utile du véhicule utilitaire.', path: ['volumeM3'] }];
const inclusionRule = [(v) => v.freeModification || v.theftProtection || v.fullInsurance || v.taxesIncluded || (v.includedCustom || []).length > 0, { message: 'Indiquez au moins un élément inclus dans le prix.', path: ['includedCustom'] }];
const returnRule = [(v) => v.returnPolicy === 'none' || (v.returnLocations || []).length > 0, { message: 'Indiquez au moins un lieu où le véhicule peut être déposé.', path: ['returnLocations'] }];
const returnFeeRule = [(v) => v.returnPolicy !== 'fee' || Number(v.returnFee) > 0, { message: 'Indiquez le montant des frais de restitution dans un autre lieu.', path: ['returnFee'] }];
const youngRule = [(v) => !(Number(v.youngDriverFee) > 0) || Boolean(v.youngDriverAge), { message: 'Indiquez en dessous de quel âge les frais jeune conducteur s’appliquent.', path: ['youngDriverAge'] }];
const vehicleSchema = vehicleBase.refine(...untilAfterFrom).refine(...maxPeriodRule).refine(...returnRule).refine(...returnFeeRule).refine(...youngRule).refine(...kmRule).refine(...utilityRule).refine(...inclusionRule);

// Dès qu'une réservation est faite, l'annonce quitte le site jusqu'à la fin de la location ; ensuite elle passe en brouillon et l’enseigne la republie.
async function reserveVehicle(vehicleId, bookingId, endDate, endTime) {
  if (!endDate) return;
  await query(`UPDATE vehicles SET status = 'inactive', details = details || $2::jsonb, updated_at = now() WHERE id = $1 AND status = 'approved'`,
    [vehicleId, JSON.stringify({ rentedUntil: `${endDate}T${endTime || '10:00'}`, rentedBookingId: String(bookingId), afterRental: false })]);
}
async function releaseVehicle(bookingId) {
  await query(`UPDATE vehicles SET status = 'approved', details = details - 'rentedUntil' - 'rentedBookingId', updated_at = now()
               WHERE details->>'rentedBookingId' = $1 AND status = 'inactive' AND NOT COALESCE((details->>'hiddenByPartner')::boolean, false)`, [String(bookingId)]);
}
async function endRentals() {
  const { rows } = await query(`UPDATE vehicles SET details = (details - 'rentedUntil' - 'rentedBookingId') || '{"afterRental": true}'::jsonb, updated_at = now()
    WHERE details ? 'rentedUntil' AND (details->>'rentedUntil')::timestamp <= now() RETURNING id, model, partner_id`);
  for (const v of rows) {
    const { rows: owner } = v.partner_id ? await query('SELECT user_id FROM partners WHERE id = $1', [v.partner_id]) : { rows: [] };
    if (owner[0]) await pushNotification(owner[0].user_id, { kind: 'vehicle', title: 'Location terminée', body: `${v.model} : republiez l’annonce quand le véhicule est prêt.`, link: 'fleet' });
    await pushNotification('staff', { kind: 'vehicle', title: 'Location terminée', body: `${v.model} est passé en brouillon.`, link: 'vehicles' });
  }
}
async function expireUnpaid() {
  const { rows } = await query(`SELECT id, stripe_session_id FROM bookings WHERE payment_status = 'awaiting' AND created_at < now() - interval '40 minutes'`);
  for (const b of rows) { if (b.stripe_session_id) await expireSession(b.stripe_session_id); await failBooking(b.id); }
  const { rows: packs } = await query(`SELECT id, stripe_session_id FROM offer_requests WHERE payment_status = 'awaiting' AND created_at < now() - interval '40 minutes'`);
  for (const r of packs) { if (r.stripe_session_id) await expireSession(r.stripe_session_id); await failPack(r.id); }
}
setInterval(() => { endRentals().catch((e) => console.error('Fin de location :', e.message)); if (paymentsEnabled) expireUnpaid().catch((e) => console.error('Paiements expirés :', e.message)); }, 60000);

// Disponibilité : une voiture indisponible (période saisie par l’enseigne) ou déjà louée (réservation confirmée) n'est pas proposée sur ces dates.
const isoLocal = (x) => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(x) ? x.slice(0, 16) : null);
const unavailableSql = (a, b) => ` AND (v.details->>'availableFrom' IS NULL OR (v.details->>'availableFrom')::date <= $${a}::timestamp) AND (v.details->>'availableUntil' IS NULL OR $${b}::timestamp < ((v.details->>'availableUntil')::date + 1))
  AND NOT EXISTS (SELECT 1 FROM vehicle_blocks vb WHERE vb.vehicle_id = v.id AND vb.start_at < $${b}::timestamp AND vb.end_at > $${a}::timestamp)
  AND NOT EXISTS (SELECT 1 FROM bookings bk WHERE bk.vehicle_id = v.id AND bk.status IN ('pending', 'confirmed') AND bk.start_date IS NOT NULL AND bk.end_date IS NOT NULL
    AND (bk.start_date + COALESCE(NULLIF(bk.start_time, ''), '00:00')::time) < $${b}::timestamp AND (bk.end_date + COALESCE(NULLIF(bk.end_time, ''), '23:59')::time) > $${a}::timestamp)`;
async function saveBlocks(vehicleId, blocks) {
  if (blocks === undefined) return;
  blocks = blocks.filter((b) => new Date(b.end) > new Date());
  for (const b of blocks) {
    if (new Date(b.end) <= new Date(b.start)) throw new z.ZodError([{ code: 'custom', path: ['blocks'], message: 'La fin d’une période d’indisponibilité doit suivre son début.' }]);
  }
  await query('DELETE FROM vehicle_blocks WHERE vehicle_id = $1', [vehicleId]);
  for (const b of blocks) await query('INSERT INTO vehicle_blocks(vehicle_id, start_at, end_at, reason) VALUES ($1,$2,$3,$4)', [vehicleId, b.start, b.end, b.reason || null]);
}
async function availabilityOf(vehicleId) {
  const { rows: blocks } = await query(`SELECT id, to_char(start_at, 'YYYY-MM-DD"T"HH24:MI') AS start, to_char(end_at, 'YYYY-MM-DD"T"HH24:MI') AS "end", reason FROM vehicle_blocks WHERE vehicle_id = $1 ORDER BY start_at`, [vehicleId]);
  const { rows: rentals } = await query(`SELECT id, customer_name, start_date, start_time, end_date, end_time, status FROM bookings WHERE vehicle_id = $1 AND status IN ('confirmed', 'pending') AND end_date >= current_date ORDER BY start_date`, [vehicleId]);
  return { blocks, rentals: rentals.map(r => ({ id: r.id, reference: bookingRef(r.id), customer: r.customer_name, start: `${String(r.start_date).slice(0, 10)} ${r.start_time || ''}`.trim(), end: `${String(r.end_date).slice(0, 10)} ${r.end_time || ''}`.trim(), status: r.status })) };
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
// « Lun-Sam 08:00 - 18:00 · Dim fermé » à partir des horaires jour par jour
function weekText(w) {
  const groups = [];
  DAY_KEYS.forEach((k, i) => {
    const h = w[k] ? `${w[k].open} - ${w[k].close}` : 'fermé';
    const last = groups[groups.length - 1];
    if (last && last.h === h) last.to = i; else groups.push({ from: i, to: i, h });
  });
  return groups.map(({ from, to, h }) => `${from === to ? DAY_LABELS[from] : `${DAY_LABELS[from]}-${DAY_LABELS[to]}`} ${h}`).join(' · ');
}

// Colonnes de prix déduites de la grille : prix par jour (1 à 2 jours), et prix de 7 et 30 jours.
const priceCols = (v) => ({ priceDay: v.rates.tiers[0], priceWeek: Pricing.round2(v.rates.tiers[2] * 7), priceMonth: Pricing.round2(v.rates.tiers[4] * 30) });

// Construit les détails stockés d'une annonce à partir du formulaire (même règle pour le back-office et l'espace partenaire).
function buildVehicleDetails(v, old = {}) {
  return {
    ...old,
    passengers: v.passengers, doors: v.doors, bags: v.bags, transmission: v.transmission, airConditioning: v.airConditioning,
    priceYear: null, rates: v.rates, fuelType: v.fuelType || null, volumeM3: v.volumeM3 ?? null, payloadKg: v.payloadKg ?? null, oldPriceDay: v.oldPriceDay ?? null,
    officeHoursWeek: v.officeHoursWeek ?? old.officeHoursWeek ?? null, includedCustom: v.includedCustom !== undefined ? v.includedCustom : (old.includedCustom || []),
    officeHours: v.officeHoursWeek ? weekText(v.officeHoursWeek) : (v.officeHours || null), pickupInstructions: v.pickupInstructions || null,
    returnPolicy: v.returnPolicy, returnFee: v.returnPolicy === 'fee' ? Number(v.returnFee) : 0,
    returnLocations: v.returnPolicy === 'none' ? [] : (v.returnLocations || []).map(({ key, name, address }) => ({ key, name, address: address || null })),
    lessorName: v.lessorName || old.lessorName || null,
    deposit: v.deposit ?? null, excess: v.excess ?? null, minAge: v.minAge ?? null,
    youngDriverAge: Number(v.youngDriverFee) > 0 ? v.youngDriverAge : null, youngDriverFee: Number(v.youngDriverFee) > 0 ? Number(v.youngDriverFee) : null, youngDriverPricing: v.youngDriverPricing || 'day',
    unlimitedKm: v.unlimitedKm, kmPerDay: v.unlimitedKm ? null : (v.kmPerDay ?? null), extraKmPrice: v.extraKmPrice ?? null,
    includedKm: v.unlimitedKm ? 'Kilométrage illimité' : (v.kmPerDay ? `${v.kmPerDay} km/jour` : null), fuelPolicy: v.fuelPolicy || null,
    freeCancelHours: v.freeCancelHours, freeCancel: v.freeCancelHours > 0, cancelFee: v.cancelFee, freeModification: v.freeModification,
    theftProtection: v.theftProtection, fullInsurance: v.fullInsurance, insuranceType: v.insuranceType || null,
    availableFrom: v.availableFrom, availableUntil: v.availableUntil, taxesIncluded: v.taxesIncluded,
    differentReturnAllowed: v.returnPolicy !== 'none', differentReturnFee: v.returnPolicy === 'fee' ? `${Number(v.returnFee)} €` : null,
    rentalConditions: v.rentalConditions || null, tips: v.tips || null,
    extras: (v.extras || []).map(({ key, name, description, pricePerDay, pricing, maxQty }) => ({ key, name, description: description || null, pricePerDay, pricing: pricing || 'day', maxQty: maxQty || 1 })),
    city: v.city ?? old.city ?? '', country: v.country ?? old.country ?? '',
    // L'image affichée est l'image type de la catégorie, choisie par TripVision.
    images: [], image: null, spin: [],
  };
}
const bookingSchema = z.object({
  vehicleId: z.string(), name: z.string().min(2).optional(), email: z.string().email().optional(), phone: z.string().optional(), marketing: z.boolean().optional(),
  pickupAddress: z.string().optional(), returnAddress: z.string().optional(), startDate: z.string().optional(), startTime: z.string().optional(), endDate: z.string().optional(), endTime: z.string().optional(), driverAge: z.coerce.number().optional(), message: z.string().optional(),
  extras: z.array(z.union([z.string().max(40), z.object({ key: z.string().max(40), qty: z.coerce.number().int().min(1).max(10) })])).max(12).optional(), protection: z.boolean().optional(), returnKey: z.string().max(40).optional(), title: z.string().max(10).optional(),
});
const publishAtSchema = z.string().datetime({ offset: true }).nullable().optional();
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide');
const flightSchema = z.object({
  tripType: z.enum(['roundtrip', 'oneway']).default('roundtrip'),
  airline: z.string().trim().min(2).max(80), flightNumber: z.string().trim().max(12).optional(),
  bookingUrl: z.string().trim().max(600).url('Indiquez le lien de réservation de la compagnie (https://…).').refine((u) => /^https?:\/\//i.test(u), 'Le lien doit commencer par https://'),
  fromCountry: z.string().trim().max(80).optional(), fromAirport: z.string().trim().max(120).optional(), toAirport: z.string().trim().max(120).optional(),
  departTime: timeStr.optional(), arriveTime: timeStr.optional(), arriveDayOffset: z.coerce.number().int().min(0).max(2).default(0),
  durationMin: z.coerce.number().int().min(10).max(2400).optional(), oneWayPrice: z.coerce.number().positive().optional(),
  returnFlightNumber: z.string().trim().max(12).optional(), returnDepartTime: timeStr.optional(), returnArriveTime: timeStr.optional(),
  returnDayOffset: z.coerce.number().int().min(0).max(2).default(0), returnDurationMin: z.coerce.number().int().min(10).max(2400).optional(),
  stops: z.coerce.number().int().min(0).max(3).default(0), cabin: z.string().trim().max(40).optional(), baggage: z.string().trim().max(80).optional(),
});
const PACK_TRANSPORTS = ['avion', 'train', 'bus', 'voiture'];
const RATING_SOURCES = ['TripAdvisor', 'Booking.com', 'Google', 'Expedia', 'Hotels.com'];
const ratingMax = (src) => (['Booking.com', 'Expedia', 'Hotels.com'].includes(src) ? 10 : 5);
const offerSchema = z.object({
  type: z.enum(['flight', 'pack']), title: z.string().min(2), fromCity: z.string().optional(), toCity: z.string().min(2), country: z.string().optional(),
  badge: z.string().optional(), price: z.coerce.number().positive(), oldPrice: z.coerce.number().optional(), partnerName: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), image: z.string().optional(), description: z.string().optional(), publishAt: publishAtSchema,
  hotelName: z.string().trim().max(160).optional(), hotelStars: z.coerce.number().int().min(1).max(5).optional(),
  hotelNights: z.coerce.number().int().min(1).max(60).optional(), hotelBoard: z.string().trim().max(80).optional(),
  images: z.array(z.string().max(500)).max(10).optional(), flight: flightSchema.optional(),
  // Pack week-end : un seul mode de transport jusqu'à l'hôtel, et les notes de l'hôtel relevées sur les sites d'avis.
  transport: z.object({ mode: z.enum(PACK_TRANSPORTS), details: z.string().trim().max(160).optional() }).optional(),
  ratings: z.array(z.object({ source: z.enum(RATING_SOURCES), score: z.coerce.number().min(0).max(10), count: z.coerce.number().int().min(0).max(1000000).optional() })).max(5).optional(),
}).superRefine((o, ctx) => {
  if (o.type === 'pack') {
    if (!o.hotelName) ctx.addIssue({ code: 'custom', path: ['hotelName'], message: 'Hôtel obligatoire pour un pack' });
    if (!o.hotelNights) ctx.addIssue({ code: 'custom', path: ['hotelNights'], message: 'Nombre de nuits obligatoire pour un pack' });
    // Nos packs sont des week-ends (1 ou 2 nuits) ou des week-ends prolongés (3 nuits), en France.
    if (o.hotelNights > 3) ctx.addIssue({ code: 'custom', path: ['hotelNights'], message: 'Un pack est un week-end (1 ou 2 nuits) ou un week-end prolongé (3 nuits).' });
    if (countryCodeByName(o.country || 'France') !== 'FR') ctx.addIssue({ code: 'custom', path: ['country'], message: 'Les packs week-end sont proposés en France uniquement.' });
    if (!o.transport?.mode) ctx.addIssue({ code: 'custom', path: ['transport'], message: 'Choisissez le mode de transport jusqu’à l’hôtel.' });
    for (const r of o.ratings || []) if (r.score > ratingMax(r.source)) ctx.addIssue({ code: 'custom', path: ['ratings'], message: `La note ${r.source} va jusqu’à ${ratingMax(r.source)}.` });
  }
  if (o.type === 'flight') {
    const f = o.flight;
    if (!f) return ctx.addIssue({ code: 'custom', path: ['flight'], message: 'Détails du vol obligatoires' });
    if (!o.startDate) ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Date de départ obligatoire' });
    if (!f.fromCountry) ctx.addIssue({ code: 'custom', path: ['fromCountry'], message: 'Pays de départ obligatoire' });
    if (f.tripType === 'roundtrip') {
      if (!o.endDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Date de retour obligatoire' });
      if (o.startDate && o.endDate && o.endDate < o.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Le retour doit suivre le départ' });
    }
  }
});
const adminPartnerSchema = partnerSchema.extend({
  loginEmail: z.string().email(),
  status: z.enum(['pending', 'approved']).default('approved'),
});
const permissionsSchema = z.record(z.boolean()).optional();
const accountRole = z.enum(['it', 'admin', 'manager']);
const createAccountSchema = z.object({ name: z.string().min(2), email: z.string().email(), role: accountRole, permissions: permissionsSchema });
const updateAccountSchema = z.object({ name: z.string().min(2), email: z.string().email(), role: accountRole, permissions: permissionsSchema });
const scheduleSchema = z.object({ publishAt: publishAtSchema });
const statusSchema = (values) => z.object({ status: z.enum(values) });

// ---------- Mappers DB -> API (compat avec le front existant) ----------
function mapPartner(p) {
  return {
    id: p.id, user_id: p.user_id, status: p.status,
    legalName: p.legal_name, tradeName: p.trade_name, headOffice: p.head_office, agencies: p.agencies,
    siret: p.siret, bookingEmail: p.booking_email, contactEmail: p.contact_email, managerName: p.manager_name,
    kbisName: p.kbis_name, loginId: p.login_id, phone: p.phone, city: p.city,
    company: p.trade_name, email: p.booking_email,
    created_at: p.created_at, updated_at: p.updated_at,
  };
}
// ---------- Réglages du site et images types des catégories (relus régulièrement, lus sans attente par les mappers) ----------
const settings = { franchisePerDay: 7, franchiseAmount: null };
const categoryImageByName = new Map();
async function loadSettings() {
  try {
    const { rows } = await query('SELECT key, value FROM site_settings');
    settings.franchiseAmount = null;
    for (const r of rows) {
      if (r.key === 'franchise_protection_per_day') settings.franchisePerDay = Math.max(0, Number(r.value) || 0);
      // Montant de la franchise : fixé par TripVision, le même pour tous les véhicules (absent = aucune franchise affichée).
      if (r.key === 'franchise_amount' && r.value != null && Number(r.value) > 0) settings.franchiseAmount = Number(r.value);
    }
  } catch (err) { console.error('Réglages :', err.message); }
}
async function loadCategoryImages() {
  try {
    const { rows } = await query('SELECT name, image FROM vehicle_categories');
    categoryImageByName.clear();
    for (const r of rows) if (r.image) categoryImageByName.set(String(r.name).toLowerCase(), r.image);
  } catch (err) { console.error('Images des catégories :', err.message); }
}
loadSettings(); loadCategoryImages();
setInterval(() => { loadSettings(); loadCategoryImages(); }, 60000);
const categoryImageOf = (name) => absImage(categoryImageByName.get(String(name || '').toLowerCase())) || categoryImages[name] || null;

// Restitution dans un autre lieu : l’enseigne choisit « impossible », « sans frais » ou « avec frais » (un seul montant).
function returnOptionsOf(d, pickupAddress) {
  const same = { key: 'same', name: 'À l’agence de retrait', address: pickupAddress || null, fee: 0, same: true };
  if (d.returnPolicy) {
    if (d.returnPolicy === 'none') return [same];
    const fee = d.returnPolicy === 'fee' ? Number(d.returnFee) || 0 : 0;
    return [same, ...(d.returnLocations || []).map(l => ({ key: l.key, name: l.name, address: l.address || null, fee }))];
  }
  // Annonces créées avant ce réglage : chaque lieu garde son supplément.
  const legacy = (d.returnLocations || []).map(l => ({ key: l.key, name: l.name, address: l.address || null, fee: Number(l.fee) || 0 }));
  return legacy.length ? legacy : [same];
}
function mapVehicle(v, partnerTradeName) {
  const details = v.details || {};
  const returnOptions = returnOptionsOf(details, v.pickup_address);
  const others = returnOptions.filter(o => !o.same);
  const stdImage = categoryImageOf(v.category) || Object.values(categoryImages)[0];
  return {
    id: v.id, partner_id: v.partner_id, status: v.status,
    model: v.model, category: v.category, pickupAddress: v.pickup_address,
    priceDay: Number(v.price_day), priceWeek: v.price_week == null ? null : Number(v.price_week), priceMonth: v.price_month == null ? null : Number(v.price_month), priceYear: details.priceYear ?? null,
    ...details, excess: settings.franchiseAmount, commissionPct: COMMISSION_PCT, protectionPricePerDay: settings.franchisePerDay,
    returnOptions, returnPolicy: details.returnPolicy || (!others.length ? 'none' : others.some(o => o.fee > 0) ? 'fee' : 'free'), returnFee: details.returnPolicy ? Number(details.returnFee) || 0 : Math.max(0, ...others.map(o => o.fee)),
    name: v.model, city: details.city || v.pickup_address, country: details.country || '', price: Number(v.price_day), seats: details.passengers,
    transmission: details.transmission, free_cancel: !!details.freeCancel, insurance: !!details.fullInsurance,
    unlimited: String(details.includedKm || '').toLowerCase().includes('illimité'),
    partner_company: partnerTradeName || details.lessorName || (v.partner_id ? 'Partenaire' : 'TripVision'),
    spin: [], image: stdImage, images: [stdImage],
    publish_at: v.publish_at, created_at: v.created_at, updated_at: v.updated_at,
  };
}
function mapBooking(b, vehicleName) {
  return {
    id: b.id, vehicle_id: b.vehicle_id, customer_name: b.customer_name, customer_email: b.customer_email, customer_phone: b.customer_phone,
    pickup_address: b.pickup_address, return_address: b.return_address, start_date: b.start_date, start_time: b.start_time,
    end_date: b.end_date, end_time: b.end_time, driver_age: b.driver_age, message: b.message, status: b.status,
    created_at: b.created_at, reference: `TV-${String(b.id).slice(0, 8).toUpperCase()}`,
    commission_amount: b.commission_amount == null ? null : Number(b.commission_amount), pay_on_pickup: b.commission_amount == null || b.total_estimate == null ? null : Math.max(0, Math.round((Number(b.total_estimate) - Number(b.commission_amount)) * 100) / 100),
    payment_status: b.payment_status || 'none', paid_amount: b.paid_amount == null ? null : Number(b.paid_amount),
    extras: b.extras || [], total_estimate: b.total_estimate == null ? null : Number(b.total_estimate), conditions_snapshot: b.conditions_snapshot || null, conditions_accepted_at: b.conditions_accepted_at || null,
    unseen_staff: !b.staff_seen_at, unseen_partner: !b.partner_seen_at,
    unseen_client: Boolean(b.status_changed_at && (!b.client_seen_at || new Date(b.client_seen_at) < new Date(b.status_changed_at))),
    cancel_fee: b.cancel_fee == null ? null : Number(b.cancel_fee), refunded_amount: b.refunded_amount == null ? null : Number(b.refunded_amount), company: b.company || null, vehicle_name: vehicleName || 'Location de véhicule', young_driver_notice: b.driver_age != null && Number(b.driver_age) < 26,
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'tripvision-api', time: new Date().toISOString() }));

// ---------- Auth ----------
app.post('/api/auth/login', h(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const email = body.email.toLowerCase().trim();
  const ip = clientIp(req);
  if (await isLockedOut(email, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  const { rows } = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  const user = rows[0];
  const ok = user && user.active ? await bcrypt.compare(body.password, user.password_hash) : false;
  if (!ok) { await recordFailedAttempt(email, ip); return res.status(401).json({ error: 'INVALID_CREDENTIALS' }); }
  if (user.role === 'client' && !user.email_verified_at) return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Activez votre compte avec le lien reçu par e-mail.' });
  await clearAttempts(email, ip);
  await recordLogin(user.id, ip, req.headers['user-agent']);
  res.json({ token: tokenFor(user), user: { id: user.id, email: user.email, role: user.role, name: user.name, mustChangePassword: user.must_change_password }, permissions: effectivePermissions(user) });
}));

app.get('/api/auth/ping', auth(), (_req, res) => res.json({ ok: true }));

app.get('/api/auth/me', auth(), h(async (req, res) => {
  const { rows } = await query('SELECT first_name, last_name, phone, last_login_at, created_at FROM users WHERE id = $1', [req.user.id]);
  const u = rows[0] || {};
  res.json({
    user: { id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name, firstName: u.first_name || String(req.user.name || '').split(' ')[0], lastName: u.last_name || String(req.user.name || '').split(' ').slice(1).join(' '), phone: u.phone || '', lastLoginAt: u.last_login_at, createdAt: u.created_at },
    permissions: effectivePermissions(req.user),
  });
}));

const profileSchema = z.object({ firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60), phone: z.string().trim().max(30).optional() });
// Dernières connexions du compte (appareil et adresse masquée), affichées dans « Mon compte ».
const describeAgent = (ua = '') => {
  const os = /iPhone|iPad/i.test(ua) ? 'iPhone / iPad' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X|Macintosh/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : 'Appareil';
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navigateur';
  return `${br} · ${os}`;
};
const maskIp = (ip = '') => (ip.includes(':') ? `${ip.split(':').slice(0, 2).join(':')}:…` : ip.split('.').length === 4 ? `${ip.split('.').slice(0, 2).join('.')}.•.•` : '—');
app.get('/api/auth/logins', auth(), h(async (req, res) => {
  const { rows } = await query('SELECT created_at, ip_address, user_agent FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8', [req.user.id]);
  res.json(rows.map((r) => ({ at: r.created_at, device: describeAgent(r.user_agent || ''), ip: maskIp(r.ip_address || '') })));
}));
app.patch('/api/auth/profile', auth(), h(async (req, res) => {
  const p = profileSchema.parse(req.body);
  if (req.user.role === 'client' && String(p.phone || '').replace(/\D/g, '').length < 6) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Indiquez un numéro de téléphone valide.' });
  const name = `${p.firstName} ${p.lastName}`;
  await query('UPDATE users SET first_name = $1, last_name = $2, phone = $3, name = $4, updated_at = now() WHERE id = $5', [p.firstName, p.lastName, p.phone || null, name, req.user.id]);
  await audit(req.user.id, 'update_profile', 'user', req.user.id, clientIp(req));
  res.json({ name, firstName: p.firstName, lastName: p.lastName, phone: p.phone || '' });
}));

const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(1) });
app.post('/api/auth/password', auth(), h(async (req, res) => {
  const body = passwordSchema.parse(req.body);
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0] || !(await bcrypt.compare(body.currentPassword, rows[0].password_hash))) return res.status(400).json({ error: 'WRONG_PASSWORD', message: 'Le mot de passe actuel est incorrect.' });
  const problem = passwordProblem(body.newPassword);
  if (problem) return res.status(400).json({ error: 'WEAK_PASSWORD', message: problem });
  await query('UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2', [await bcrypt.hash(body.newPassword, 10), req.user.id]);
  await audit(req.user.id, 'change_password', 'user', req.user.id, clientIp(req));
  const { rows: fresh } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  res.json({ token: tokenFor(fresh[0]) });
}));

app.post('/api/auth/forgot-password', h(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const e = email.toLowerCase().trim();
  const ip = clientIp(req);
  res.json({ ok: true });
  try {
    if (await isLockedOut(`reset:${e}`, ip)) return;
    await recordFailedAttempt(`reset:${e}`, ip);
    const { rows } = await query('SELECT id, name, email FROM users WHERE email = $1 AND active AND deleted_at IS NULL', [e]);
    const user = rows[0];
    if (!user) return;
    const sent = await sendAccessLink(user, 'reset');
    if (!sent.emailSent) await query('UPDATE users SET reset_requested_at = now() WHERE id = $1', [user.id]);
    await audit(user.id, 'request_password_reset', 'user', user.id, ip);
  } catch (err) { console.error('forgot-password :', err); }
}));

app.get('/api/auth/token-info', h(async (req, res) => {
  const ip = clientIp(req);
  if (await isLockedOut(`token:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  const t = await findValidToken(req.query.token);
  if (!t) { await recordFailedAttempt(`token:${ip}`, ip); return res.status(404).json({ error: 'INVALID_LINK' }); }
  res.json({ email: t.email, name: t.name, role: t.role, purpose: t.purpose });
}));

app.post('/api/auth/activate', h(async (req, res) => {
  const { token, password } = z.object({ token: z.string(), password: z.string().min(1) }).parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`token:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  const t = await findValidToken(token);
  if (!t) { await recordFailedAttempt(`token:${ip}`, ip); return res.status(400).json({ error: 'INVALID_LINK' }); }
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ error: 'WEAK_PASSWORD', message: problem });
  await query('UPDATE users SET password_hash = $1, must_change_password = false, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [await bcrypt.hash(password, 10), t.user_id]);
  await query('UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [t.user_id]);
  await audit(t.user_id, t.purpose === 'invite' ? 'activate_account' : 'reset_password_by_link', 'user', t.user_id, ip);
  res.json({ ok: true, email: t.email, role: t.role });
}));

app.post('/api/auth/change-password', auth(), h(async (req, res) => {
  const body = changePasswordSchema.parse(req.body);
  const problem = passwordProblem(body.password);
  if (problem) return res.status(400).json({ error: 'WEAK_PASSWORD', message: problem });
  const passwordHash = await bcrypt.hash(body.password, 10);
  await query('UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2', [passwordHash, req.user.id]);
  await audit(req.user.id, 'change_password', 'user', req.user.id, clientIp(req));
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  res.json({ token: tokenFor(rows[0]) });
}));

const htmlPage = (title, text, ok = true) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:Arial,sans-serif;background:#f8f5ef;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:440px;margin:16px;background:#fff;padding:40px;border:1px solid #e4dfd6;text-align:center"><h1 style="font-family:Georgia,serif;color:${ok ? '#0f3b2e' : '#a73535'}">${title}</h1><p style="color:#555;line-height:1.6">${text}</p><a href="/" style="display:inline-block;margin-top:14px;padding:13px 26px;background:#0f3b2e;color:#fff;text-decoration:none;font-weight:700">Retourner sur TripVision</a></main>`;
app.get('/api/auth/verify-email', h(async (req, res) => {
  const t = String(req.query.t || '');
  const { rows } = t.length > 20 && t.length < 200
    ? await query("UPDATE auth_tokens SET used_at = now() WHERE token_hash = $1 AND purpose = 'verify' AND used_at IS NULL AND expires_at > now() RETURNING user_id", [hashToken(t)])
    : { rows: [] };
  res.set('Content-Type', 'text/html; charset=utf-8');
  if (!rows[0]) return res.status(400).send(htmlPage('Lien invalide ou expiré', 'Ce lien d’activation n’est plus valable. Reconnectez-vous sur TripVision pour recevoir un nouveau lien.', false));
  await query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1', [rows[0].user_id]);
  res.send(htmlPage('Compte activé', 'Votre adresse e-mail est confirmée. Vous pouvez maintenant vous connecter et réserver.'));
}));
app.post('/api/auth/resend-verification', h(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const e = email.toLowerCase().trim(), ip = clientIp(req);
  if (await isLockedOut(`verify:${e}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  await recordFailedAttempt(`verify:${e}`, ip);
  const { rows } = await query("SELECT * FROM users WHERE email = $1 AND role = 'client' AND email_verified_at IS NULL AND active AND deleted_at IS NULL", [e]);
  if (rows[0]) await sendVerification(rows[0]);
  res.json({ sent: true });
}));
app.post('/api/auth/register-client', h(async (req, res) => {
  const body = clientRegisterSchema.parse(req.body);
  const problem = passwordProblem(body.password);
  if (problem) return res.status(400).json({ error: 'WEAK_PASSWORD', message: problem });
  const email = body.email.toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'EMAIL_EXISTS' });
  const passwordHash = await bcrypt.hash(body.password, 10);
  const { rows } = await query(
    'INSERT INTO users(email, name, role, password_hash, phone) VALUES ($1,$2,\'client\',$3,$4) RETURNING *',
    [email, body.name.trim(), passwordHash, body.phone.trim()]
  );
  const user = rows[0];
  await sendVerification(user);
  res.status(201).json({ pending: true, email: user.email });
}));

// ---------- Client ----------
app.get('/api/client/dashboard', auth('client'), h(async (req, res) => {
  const { rows: bookings } = await query(
    `SELECT b.*, v.model AS vehicle_model FROM bookings b LEFT JOIN vehicles v ON v.id = b.vehicle_id WHERE lower(b.customer_email) = lower($1) AND b.payment_status NOT IN ('awaiting', 'failed') ORDER BY b.created_at DESC`,
    [req.user.email]
  );
  const { rows: requests } = await query("SELECT * FROM offer_requests WHERE lower(customer_email) = lower($1) AND payment_status NOT IN ('awaiting', 'failed') ORDER BY created_at DESC", [req.user.email]);
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name },
    bookings: bookings.map(b => mapBooking(b, b.vehicle_model)),
    requests,
    payments: [], documents: [],
  });
}));

// Téléchargement de sa réservation en PDF (le client ne voit que les siennes).
const pdfName = (ref) => `tripvision-${String(ref).toLowerCase()}.pdf`;
function sendPdf(res, doc, ref) {
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${pdfName(ref)}"`, 'Cache-Control': 'no-store' });
  doc.pipe(res);
}
app.get('/api/client/bookings/:id/pdf', auth('client'), h(async (req, res) => {
  const { rows } = await query(
    `SELECT b.*, v.model, v.details, p.trade_name, v.pickup_address AS vehicle_address FROM bookings b LEFT JOIN vehicles v ON v.id = b.vehicle_id LEFT JOIN partners p ON p.id = v.partner_id
     WHERE b.id = $1 AND lower(b.customer_email) = lower($2) AND b.payment_status NOT IN ('awaiting', 'failed')`, [req.params.id, req.user.email]);
  const b = rows[0];
  if (!b) return res.status(404).json({ error: 'NOT_FOUND' });
  const m = mapBooking(b, b.model);
  const snap = b.conditions_snapshot || {}, d = b.details || {};
  const doc = bookingPdf({
    reference: m.reference, status: b.status, vehicle: m.vehicle_name, lessor: b.trade_name || snap.lessor || d.lessorName || 'TripVision', createdAt: b.created_at,
    startDate: b.start_date, startTime: b.start_time, endDate: b.end_date, endTime: b.end_time, pickup: b.pickup_address || b.vehicle_address, returnPlace: b.return_address, officeHours: snap.officeHours || d.officeHours,
    customer: b.customer_name, email: b.customer_email, phone: b.customer_phone, driverAge: b.driver_age, extras: b.extras || [], total: m.total_estimate, paymentStatus: m.payment_status, paidAmount: m.paid_amount ?? m.commission_amount, payOnPickup: m.pay_on_pickup,
    deposit: snap.deposit ?? d.deposit ?? null,
    conditions: { mileage: snap.mileage, fuelPolicy: snap.fuelPolicy, freeCancelHours: snap.freeCancelHours, minAge: snap.minAge, excess: snap.excess, insuranceType: snap.insuranceType, text: snap.conditions },
  });
  sendPdf(res, doc, m.reference);
}));
app.get('/api/client/requests/:id/pdf', auth('client'), h(async (req, res) => {
  const { rows } = await query('SELECT * FROM offer_requests WHERE id = $1 AND lower(customer_email) = lower($2)', [req.params.id, req.user.email]);
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  const reference = bookingRef(r.id);
  const doc = requestPdf({ reference, type: r.offer_type, status: r.status, title: r.offer_title, summary: r.summary, tripType: r.trip_type, travelers: r.travelers, createdAt: r.created_at, customer: r.customer_name, email: r.customer_email, phone: r.customer_phone, total: r.total, paid: r.payment_status === 'paid' ? Number(r.paid_amount ?? r.total) : null });
  sendPdf(res, doc, reference);
}));

// ---------- Géographie (pays et villes du monde) ----------
app.get('/api/geo/countries', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(listCountries(String(req.query.region || '').slice(0, 10)));
});
app.get('/api/geo/airports', h(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(await searchAirports(String(req.query.q || '').slice(0, 60), { countryCode: String(req.query.country || '').slice(0, 2), city: String(req.query.city || '').slice(0, 80), region: String(req.query.region || '').slice(0, 10), limit: req.query.country && !req.query.q ? 600 : 12 }));
}));
app.get('/api/geo/places', h(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(await searchPlaces(String(req.query.q || '').slice(0, 60), 12, String(req.query.country || '').slice(0, 2)));
}));
app.get('/api/geo/cities', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(searchCities(String(req.query.q || '').slice(0, 60), String(req.query.country || '').slice(0, 2), req.query.q ? 10 : 40, String(req.query.region || '').slice(0, 10)));
});

// ---------- Annulation d'une location par le client ----------
// Gratuite jusqu'à la limite fixée par l’enseigne ; ensuite, frais d'annulation de l’enseigne, déduits de l'acompte déjà réglé en ligne.
const r2 = (n) => Math.round(Number(n) * 100) / 100;
async function cancelQuote(booking) {
  const { rows } = await query('SELECT details FROM vehicles WHERE id = $1', [booking.vehicle_id]);
  const d = rows[0]?.details || {}, snap = booking.conditions_snapshot || {};
  const hours = Number(snap.freeCancelHours ?? d.freeCancelHours ?? 0);
  const fee = Number(snap.cancelFee ?? d.cancelFee ?? 0);
  const start = booking.start_date ? new Date(`${String(booking.start_date).slice(0, 10)}T${booking.start_time || '10:00'}:00`) : null;
  const hoursLeft = start ? (start.getTime() - Date.now()) / 3600000 : 0;
  const free = hours > 0 && hoursLeft >= hours;
  const paid = booking.payment_status === 'paid' ? Number(booking.paid_amount || 0) : 0;
  const due = free ? 0 : fee;
  return { free, freeHours: hours, fee: due, paid, toPay: Math.max(0, r2(due - paid)), refund: Math.max(0, r2(paid - due)), started: start ? hoursLeft <= 0 : false };
}
async function doCancelBooking(booking, { fee, refund }, byClient = true) {
  const { rows } = await query(`UPDATE bookings SET status = 'inactive', status_changed_at = now(), client_seen_at = now(), staff_seen_at = NULL, partner_seen_at = NULL, cancel_fee = $2, cancelled_at = now() WHERE id = $1 AND status IN ('pending', 'confirmed') RETURNING *`, [booking.id, fee]);
  const b = rows[0];
  if (!b) return null;
  await releaseVehicle(b.id);
  if (paymentsEnabled && b.payment_status === 'paid' && b.stripe_payment_intent && refund > 0) {
    try {
      const full = refund >= Number(b.paid_amount || 0) - 0.005;
      await refundPayment(b.stripe_payment_intent, full ? undefined : refund);
      await query('UPDATE bookings SET payment_status = $2, refunded_amount = $3 WHERE id = $1', [b.id, full ? 'refunded' : 'paid', refund]);
    } catch (err) {
      console.error('Remboursement Stripe impossible :', err.message);
      await pushNotification('staff', { kind: 'booking', title: 'Remboursement à faire à la main', body: `${bookingRef(b.id)} : le remboursement automatique a échoué.`, link: 'bookings', refId: b.id });
    }
  }
  const ctx = await vehicleContext(b.vehicle_id);
  const details = [...bookingDetails(b, ctx.name), ...(fee > 0 ? [['Frais d’annulation', `${fee} €`]] : [])];
  const intro = fee > 0 ? `Le client a annulé hors période gratuite : des frais d’annulation de ${fee} € s’appliquent.` : 'Le client a annulé sa réservation dans la période gratuite.';
  notify(ctx.partnerMail, notificationEmail({ subject: `Réservation annulée par le client — ${ctx.name}`, title: 'Réservation annulée', intro, details, buttonLabel: 'Voir dans mon espace', url: espaceLink('bookings') }));
  notify(STAFF_EMAIL, notificationEmail({ subject: `[TripVision] Réservation annulée ${bookingRef(b.id)}`, title: 'Réservation annulée par le client', intro, details, buttonLabel: 'Ouvrir le back-office', url: staffLink('bookings') }));
  pushNotification(ctx.partnerUserId, { kind: 'booking', title: 'Réservation annulée par le client', body: `${bookingRef(b.id)} · ${ctx.name}`, link: 'bookings', refId: b.id });
  pushNotification('staff', { kind: 'booking', title: 'Réservation annulée par le client', body: bookingRef(b.id), link: 'bookings', refId: b.id });
  return b;
}
const ownCancellable = async (req) => (await query(`SELECT * FROM bookings WHERE id = $1 AND lower(customer_email) = lower($2) AND status IN ('pending', 'confirmed') AND payment_status NOT IN ('awaiting', 'failed')`, [req.params.id, req.user.email])).rows[0];
app.get('/api/client/bookings/:id/cancel-quote', auth('client'), h(async (req, res) => {
  const b = await ownCancellable(req);
  if (!b) return res.status(409).json({ error: 'NOT_CANCELLABLE' });
  res.json(await cancelQuote(b));
}));
app.post('/api/client/bookings/:id/cancel', auth('client'), h(async (req, res) => {
  const b = await ownCancellable(req);
  if (!b) return res.status(409).json({ error: 'NOT_CANCELLABLE' });
  const q = await cancelQuote(b);
  if (q.started) return res.status(409).json({ error: 'STARTED', message: 'La location a déjà commencé : elle ne peut plus être annulée en ligne.' });
  if (q.toPay > 0 && paymentsEnabled) {
    // Les frais dépassent l'acompte : le client règle la différence, puis la réservation est annulée.
    const ctx = await vehicleContext(b.vehicle_id);
    const session = await createCheckout({
      bookingId: b.id, reference: bookingRef(b.id), email: b.customer_email, kind: 'cancel', appUrl: APP_URL,
      lines: [{ label: `Frais d’annulation · ${ctx.name}`, amount: q.toPay }], description: `Annulation ${bookingRef(b.id)}`,
      successUrl: `${APP_URL}/espace/?cancel=success&session_id={CHECKOUT_SESSION_ID}#orders`, cancelUrl: `${APP_URL}/espace/#orders`,
    });
    await query('UPDATE bookings SET cancel_session_id = $2, cancel_fee = $3 WHERE id = $1', [b.id, session.id, q.fee]);
    return res.json({ checkoutUrl: session.url, ...q });
  }
  await doCancelBooking(b, q);
  res.json({ ok: true, ...q });
}));
// Retour de Stripe après le paiement des frais d'annulation.
app.get('/api/payments/cancel-session/:id', auth('client'), h(async (req, res) => {
  const { rows } = await query(`SELECT * FROM bookings WHERE cancel_session_id = $1 AND lower(customer_email) = lower($2)`, [req.params.id, req.user.email]);
  const b = rows[0];
  if (!b) return res.status(404).json({ error: 'NOT_FOUND' });
  if (b.status === 'inactive') return res.json({ cancelled: true, fee: Number(b.cancel_fee || 0) });
  const session = await retrieveSession(req.params.id);
  if (session.payment_status !== 'paid') return res.json({ cancelled: false });
  await finalizeCancelPaid(b.id);
  res.json({ cancelled: true, fee: Number(b.cancel_fee || 0) });
}));
async function finalizeCancelPaid(bookingId) {
  const { rows } = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  const b = rows[0];
  if (!b || b.status === 'inactive') return;
  await doCancelBooking(b, { fee: Number(b.cancel_fee || 0), refund: 0 });
}
app.post('/api/client/requests/:id/cancel', auth('client'), h(async (req, res) => {
  const { rows } = await query(`UPDATE offer_requests SET status = 'cancelled', status_changed_at = now(), client_seen_at = now(), staff_seen_at = NULL WHERE id = $1 AND lower(customer_email) = lower($2) AND status = 'pending' RETURNING *`, [req.params.id, req.user.email]);
  if (!rows[0]) return res.status(409).json({ error: 'NOT_CANCELLABLE' });
  notify(STAFF_EMAIL, notificationEmail({ subject: `[TripVision] Demande annulée ${bookingRef(rows[0].id)}`, title: 'Demande annulée par le client', intro: 'Un client a annulé sa demande de réservation.', details: [['Référence', bookingRef(rows[0].id)], ['Offre', rows[0].offer_title], ['Client', rows[0].customer_name]], buttonLabel: 'Ouvrir le back-office', url: staffLink('bookings') }));
  pushNotification('staff', { kind: 'request', title: 'Demande annulée par le client', body: bookingRef(rows[0].id), link: 'bookings', refId: rows[0].id });
  res.json({ ok: true });
}));

// ---------- Public ----------
// Un pack se réserve au plus tard la veille du départ (dès le jour J, c'est fermé) ; une offre de vol disparaît quand sa date est passée.
// Ensuite l'offre s'archive : elle reste visible dans le back-office.
const PARIS_TODAY = `(now() AT TIME ZONE 'Europe/Paris')::date`;
const LIVE_DATES = `(start_date IS NULL OR (type = 'pack' AND start_date > ${PARIS_TODAY}) OR (type <> 'pack' AND start_date >= ${PARIS_TODAY}))`;
app.get('/api/public/offers', h(async (req, res) => {
  const params = [];
  let sql = `SELECT * FROM offers WHERE status = 'active' AND deleted_at IS NULL AND (publish_at IS NULL OR publish_at <= now()) AND ${LIVE_DATES}`;
  if (req.query.type) { params.push(req.query.type); sql += ` AND type = $${params.length}`; }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows.map(withAbsImage));
}));

app.get('/api/public/vehicles/:id', h(async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(404).json({ error: 'NOT_FOUND' });
  const { rows } = await query(
    `SELECT v.*, p.trade_name FROM vehicles v LEFT JOIN partners p ON p.id = v.partner_id
     WHERE v.id = $1 AND v.status = 'approved' AND v.deleted_at IS NULL AND (v.partner_id IS NULL OR (p.status = 'approved' AND p.deleted_at IS NULL)) AND (v.publish_at IS NULL OR v.publish_at <= now())`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(mapVehicle(rows[0], rows[0].trade_name));
}));
app.get('/api/public/vehicles', h(async (req, res) => {
  const { city = '', category = 'all' } = req.query;
  const params = [];
  let sql = `SELECT v.*, p.trade_name FROM vehicles v LEFT JOIN partners p ON p.id = v.partner_id
             WHERE v.status = 'approved' AND v.deleted_at IS NULL AND (v.partner_id IS NULL OR (p.status = 'approved' AND p.deleted_at IS NULL)) AND (v.publish_at IS NULL OR v.publish_at <= now()) AND (v.details->>'availableUntil' IS NULL OR (v.details->>'availableUntil')::date >= current_date)`;
  if (city) { params.push(`%${String(city).toLowerCase()}%`); sql += ` AND (lower(v.pickup_address) LIKE $${params.length} OR lower(v.details->>'city') LIKE $${params.length})`; }
  if (category && category !== 'all') { params.push(category); sql += ` AND v.category = $${params.length}`; }
  const from = isoLocal(req.query.start), to = isoLocal(req.query.end);
  if (from && to && new Date(to) > new Date(from)) { params.push(from, to); sql += unavailableSql(params.length - 1, params.length); }
  sql += ' ORDER BY v.created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows.map(v => mapVehicle(v, v.trade_name)));
}));

const contactSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(200), message: z.string().trim().min(5).max(3000) });

app.post('/api/contact', h(async (req, res) => {
  const body = contactSchema.parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`contact:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  await recordFailedAttempt(`contact:${ip}`, ip);
  const { rows: cm } = await query('INSERT INTO contact_messages(name, email, message) VALUES ($1,$2,$3) RETURNING id', [body.name, body.email.toLowerCase(), body.message]);
  pushNotification('staff', { kind: 'contact', title: 'Message de contact', body: body.name, refId: String(cm[0].id) });
  notify(STAFF_EMAIL, notificationEmail({ subject: '[TripVision] Nouveau message de contact', title: 'Nouveau message de contact', intro: `${mailText(body.name)} a envoyé un message depuis le site.`, buttonLabel: 'Ouvrir le back-office', url: staffLink('notifications') }), body.email);
  res.status(201).json({ ok: true });
}));

app.post('/api/newsletter', h(async (req, res) => {
  const { email } = z.object({ email: z.string().trim().email().max(200) }).parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`newsletter:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  await recordFailedAttempt(`newsletter:${ip}`, ip);
  await query('INSERT INTO newsletter_subscribers(email) VALUES ($1) ON CONFLICT DO NOTHING', [email.toLowerCase()]);
  res.status(201).json({ ok: true });
}));

const publicContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5).max(5000),
  website: z.string().optional().default(''),
});
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.CONTACT_TO || '';

app.post('/api/public/contact', h(async (req, res) => {
  const body = publicContactSchema.parse(req.body);
  if (body.website) return res.json({ sent: true });
  const ip = clientIp(req);
  if (await isLockedOut(`contact:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  await recordFailedAttempt(`contact:${ip}`, ip);
  const subject = body.subject.replace(/[\r\n]+/g, ' ');
  const { rows: cm } = await query('INSERT INTO contact_messages(name, email, subject, message) VALUES ($1,$2,$3,$4) RETURNING id', [body.name, body.email.toLowerCase(), subject, body.message]);
  pushNotification('staff', { kind: 'contact', title: 'Message de contact', body: body.name, refId: String(cm[0].id) });
  notify(STAFF_EMAIL, notificationEmail({ subject: '[TripVision] Nouveau message de contact', title: 'Nouveau message de contact', intro: `${mailText(body.name)} a envoyé un message depuis le site.`, buttonLabel: 'Ouvrir le back-office', url: staffLink('notifications') }), body.email);
  res.status(201).json({ sent: true });
}));

// Entreprise auprès de laquelle l'offre est prise : le partenaire saisi sur l'offre, sinon la compagnie du vol, sinon TripVision.
const offerCompany = (o) => String(o.partner_name || '').trim() || String(o.details?.flight?.airline || '').trim() || 'TripVision';
const offerRequestSchema = z.object({
  offerId: z.string().uuid(), name: z.string().trim().max(100).optional(), email: z.string().trim().email().max(160), marketing: z.boolean().optional(),
  phone: z.string().trim().max(40).optional(), travelers: z.coerce.number().int().min(1).max(9).default(1), message: z.string().trim().max(2000).optional(),
  tripType: z.enum(['roundtrip', 'oneway']).optional(),
});
app.post('/api/public/offer-requests', h(async (req, res) => {
  const b = offerRequestSchema.parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`contact:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  const { rows } = await query(`SELECT * FROM offers WHERE id = $1 AND status = 'active' AND deleted_at IS NULL AND (publish_at IS NULL OR publish_at <= now()) AND ${LIVE_DATES}`, [b.offerId]);
  const o = rows[0];
  if (!o) return res.status(404).json({ error: 'NOT_FOUND', message: 'Cette offre n’est plus réservable.' });
  // Un vol se réserve avec la seule adresse e-mail ; un pack demande un compte client.
  const client = await optionalClient(req);
  if (o.type === 'pack' && !client) return res.status(401).json({ error: 'ACCOUNT_REQUIRED', message: 'Créez un compte ou connectez-vous pour réserver un pack.' });
  if (client) { b.email = client.email; b.name = b.name || client.name; }
  b.name = (b.name || '').trim() || b.email.split('@')[0];
  await recordFailedAttempt(`contact:${ip}`, ip);
  // Sur un même vol, un client peut prendre un aller-retour et un autre un aller simple (au tarif aller simple de l'offre).
  const f = o.details?.flight;
  let tripType = null, unit = Number(o.price);
  if (o.type === 'flight' && f) {
    tripType = f.tripType === 'oneway' ? 'oneway' : (b.tripType || 'roundtrip');
    if (tripType === 'oneway' && f.tripType === 'roundtrip') {
      if (!f.oneWayPrice) return res.status(409).json({ error: 'ONE_WAY_UNAVAILABLE' });
      unit = Number(f.oneWayPrice);
    }
  }
  const total = unit * b.travelers;
  const withReturn = tripType !== 'oneway' && o.end_date;
  await query(
    `INSERT INTO offer_requests(offer_id, offer_type, offer_title, summary, customer_name, customer_email, customer_phone, travelers, total, message, trip_type, partner_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [o.id, o.type, o.title, `${o.from_city || '—'} → ${o.to_city}${o.start_date ? ' · ' + String(o.start_date).slice(0, 10) + (withReturn ? ' → ' + String(o.end_date).slice(0, 10) : '') : ''}`, b.name, b.email.toLowerCase(), b.phone || null, b.travelers, total, b.message || null, tripType, offerCompany(o)]
  );
  const contact = o.type === 'flight' ? await recordContact({ email: b.email, name: b.name, phone: b.phone, source: 'vol', consent: b.marketing, count: 1 }) : { returning: false };
  const { rows: created } = await query('SELECT id FROM offer_requests WHERE lower(customer_email) = $1 ORDER BY created_at DESC LIMIT 1', [b.email.toLowerCase()]);
  const ref = bookingRef(created[0]?.id || o.id);
  const details = [['Référence', ref], ['Offre', o.title], ['Trajet', `${o.from_city || '—'} → ${o.to_city}`], ['Type de billet', tripType === 'oneway' ? 'Aller simple' : tripType === 'roundtrip' ? 'Aller-retour' : ''], ['Dates', [mailDay(o.start_date), withReturn ? mailDay(o.end_date) : ''].filter(Boolean).join(' → ')], ['Voyageurs', String(b.travelers)], ['Total estimé', `${total} €`]];
  notify(STAFF_EMAIL, notificationEmail({ subject: `[TripVision] Nouvelle demande ${o.type === 'flight' ? 'de vol' : 'de pack'} ${ref}`, title: 'Nouvelle demande de réservation', intro: `${mailText(b.name)} souhaite réserver ${o.type === 'flight' ? 'un vol' : 'un pack'}.`, details: [...details, ['Client', b.name]], buttonLabel: 'Ouvrir le back-office', url: staffLink('bookings') }), b.email);
  pushNotification('staff', { kind: 'request', title: `Nouvelle demande ${o.type === 'flight' ? 'de vol' : 'de pack'}`, body: `${ref} · ${b.name}`, link: 'bookings', refId: String(created[0]?.id || '') });
  notify(b.email, notificationEmail({ subject: 'Votre demande TripVision est bien reçue', title: 'Demande bien reçue', intro: 'Merci ! Nous avons bien reçu votre demande de réservation et revenons vers vous très vite pour la confirmer.', details, buttonLabel: 'Suivre ma réservation', url: espaceLink('orders') }));
  res.status(201).json({ sent: true, returning: contact.returning });
}));

const partnerApplicationSchema = z.object({
  legalName: z.string().trim().min(2), tradeName: z.string().trim().min(2), headOffice: z.string().trim().min(2), agencies: z.string().trim().min(2),
  siret: z.string().trim().min(2), bookingEmail: z.string().trim().email(), contactEmail: z.string().trim().email(), managerName: z.string().trim().min(2),
  kbisName: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), loginEmail: z.string().trim().email(),
});

app.post('/api/public/partner-applications', h(async (req, res) => {
  const a = partnerApplicationSchema.parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`application:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  await recordFailedAttempt(`application:${ip}`, ip);
  const email = a.loginEmail.toLowerCase();
  const clash = await query("SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL UNION SELECT 1 FROM partner_applications WHERE login_email = $1 AND status = 'pending'", [email]);
  if (clash.rows.length) return res.status(409).json({ error: 'APPLICATION_EXISTS' });
  const { rows } = await query(
    `INSERT INTO partner_applications(legal_name, trade_name, head_office, agencies, siret, booking_email, contact_email, manager_name, kbis_name, phone, city, login_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, status`,
    [a.legalName, a.tradeName, a.headOffice, a.agencies, a.siret, a.bookingEmail.toLowerCase(), a.contactEmail.toLowerCase(), a.managerName, a.kbisName || null, a.phone || null, a.city || null, email]
  );
  notify(STAFF_EMAIL, notificationEmail({ subject: '[TripVision] Nouvelle candidature partenaire', title: 'Nouvelle candidature partenaire', intro: `${mailText(a.tradeName)} demande l’ouverture d’un espace partenaire.`, buttonLabel: 'Examiner la candidature', url: staffLink('applications') }));
  pushNotification('staff', { kind: 'application', title: 'Nouvelle candidature partenaire', body: a.tradeName, link: 'applications' });
  res.status(201).json(rows[0]);
}));

// Prévient l’enseigne, l'équipe et le client d'une nouvelle réservation (après paiement quand le paiement en ligne est actif).
async function announceBooking(row) {
  const ctx = await vehicleContext(row.vehicle_id);
  const details = bookingDetails(row, ctx.name);
  const confirmed = row.status === 'confirmed';
  notify(ctx.partnerMail, notificationEmail({ subject: `${confirmed ? 'Nouvelle réservation confirmée' : 'Nouvelle demande de réservation'} — ${ctx.name}`, title: confirmed ? 'Nouvelle réservation confirmée' : 'Nouvelle demande de réservation', intro: confirmed ? 'Un client vient de réserver et de payer en ligne un de vos véhicules. Aucune validation n’est nécessaire : le client a réglé 10 % du total en ligne, le solde est à encaisser lors du retrait.' : 'Un client vient de demander la réservation d’un de vos véhicules. Consultez-la et confirmez-la depuis votre espace.', details, buttonLabel: 'Voir dans mon espace', url: espaceLink('bookings') }));
  pushNotification(ctx.partnerUserId, { kind: 'booking', title: confirmed ? 'Nouvelle réservation confirmée' : 'Nouvelle demande de réservation', body: `${bookingRef(row.id)} · ${ctx.name}`, link: 'bookings', refId: row.id });
  pushNotification('staff', { kind: 'booking', title: 'Nouvelle réservation', body: `${bookingRef(row.id)} · ${ctx.name}`, link: 'bookings', refId: row.id });
  notify(STAFF_EMAIL, notificationEmail({ subject: `[TripVision] Nouvelle réservation ${bookingRef(row.id)}`, title: 'Nouvelle réservation', intro: confirmed ? 'Une réservation vient d’être payée et confirmée automatiquement.' : 'Une demande de réservation vient d’être enregistrée.', details, buttonLabel: 'Ouvrir le back-office', url: staffLink('bookings') }), row.customer_email);
  // Le client est prévenu directement (message dans son espace + e-mail).
  pushNotification(await clientUserId(row.customer_email), { kind: 'booking', title: confirmed ? 'Réservation confirmée' : 'Réservation enregistrée', body: `${bookingRef(row.id)} · ${ctx.name}`, link: 'orders', refId: row.id });
  notify(row.customer_email, notificationEmail({ subject: confirmed ? 'Votre réservation TripVision est confirmée' : 'Votre réservation TripVision est enregistrée', title: confirmed ? 'Réservation confirmée' : 'Réservation enregistrée', intro: confirmed ? 'Merci, votre réservation est confirmée ! Votre paiement est bien enregistré. Il vous reste à régler le solde directement à l’enseigne lors du retrait du véhicule.' : 'Merci ! Votre réservation est enregistrée.', details: details.filter(([k]) => k !== 'Client'), buttonLabel: 'Voir ma réservation', url: espaceLink('orders') }));
}

// ---------- Réservation d'un pack avec paiement en ligne ----------
const packBookingSchema = z.object({
  offerId: z.string().uuid(), travelers: z.coerce.number().int().min(1).max(9).default(1), name: z.string().trim().max(100).optional(),
  phone: phoneField, message: z.string().trim().max(2000).optional(),
});
function packDetails(o, r, ref) {
  return [['Référence', ref], ['Séjour', r.offer_title], ['Trajet', `${o.from_city || '—'} → ${o.to_city}`], ['Dates', [mailDay(o.start_date), o.end_date ? mailDay(o.end_date) : ''].filter(Boolean).join(' → ')], ['Voyageurs', String(r.travelers)], [r.payment_status === 'paid' ? 'Payé en ligne' : 'Total', `${Number(r.paid_amount ?? r.total)} €`]];
}
async function announcePack(r) {
  const { rows } = await query('SELECT * FROM offers WHERE id = $1', [r.offer_id]);
  const o = rows[0] || {};
  const ref = bookingRef(r.id);
  const paid = r.payment_status === 'paid';
  const details = packDetails(o, r, ref);
  notify(STAFF_EMAIL, notificationEmail({ subject: `[TripVision] ${paid ? 'Pack réservé et payé' : 'Nouvelle demande de pack'} ${ref}`, title: paid ? 'Pack réservé et payé' : 'Nouvelle demande de pack', intro: paid ? `${mailText(r.customer_name)} vient de réserver et de payer un séjour.` : `${mailText(r.customer_name)} souhaite réserver un séjour.`, details: [...details, ['Client', r.customer_name]], buttonLabel: 'Ouvrir le back-office', url: staffLink('bookings') }), r.customer_email);
  pushNotification('staff', { kind: 'request', title: paid ? 'Pack réservé et payé' : 'Nouvelle demande de pack', body: `${ref} · ${r.customer_name}`, link: 'bookings', refId: String(r.id) });
  pushNotification(await clientUserId(r.customer_email), { kind: 'request', title: paid ? 'Réservation confirmée' : 'Demande enregistrée', body: `${ref} · ${r.offer_title}`, link: 'orders', refId: String(r.id) });
  notify(r.customer_email, notificationEmail({ subject: paid ? 'Votre réservation TripVision est confirmée' : 'Votre demande TripVision est bien reçue', title: paid ? 'Réservation confirmée' : 'Demande bien reçue', intro: paid ? 'Merci, votre séjour est confirmé ! Votre paiement est bien enregistré. Retrouvez le détail de votre réservation et votre justificatif dans votre espace client.' : 'Merci ! Nous avons bien reçu votre demande et revenons vers vous très vite pour la confirmer.', details, buttonLabel: 'Voir ma réservation', url: espaceLink('orders') }));
}
async function failPack(id) {
  const { rows } = await query(`UPDATE offer_requests SET payment_status = 'failed', status = 'cancelled', status_changed_at = now() WHERE id = $1 AND payment_status = 'awaiting' RETURNING id`, [id]);
  return Boolean(rows[0]);
}
async function finalizePackPaid(id, session) {
  const { rows } = await query(
    `UPDATE offer_requests SET payment_status = 'paid', status = 'confirmed', status_changed_at = now(), paid_amount = $2, paid_at = now(), stripe_payment_intent = $3 WHERE id = $1 AND payment_status = 'awaiting' RETURNING *`,
    [id, (session.amount_total || 0) / 100, typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null]);
  if (rows[0]) await announcePack(rows[0]);
  return rows[0] || null;
}
async function refundPack(r) {
  if (!paymentsEnabled || r.payment_status !== 'paid' || !r.stripe_payment_intent) return;
  try {
    await refundPayment(r.stripe_payment_intent);
    await query(`UPDATE offer_requests SET payment_status = 'refunded' WHERE id = $1`, [r.id]);
    await pushNotification('staff', { kind: 'request', title: 'Pack remboursé', body: `${bookingRef(r.id)} · ${Number(r.paid_amount || 0)} €`, link: 'bookings', refId: String(r.id) });
  } catch (err) {
    console.error('Remboursement Stripe impossible :', err.message);
    await pushNotification('staff', { kind: 'request', title: 'Remboursement à faire à la main', body: `${bookingRef(r.id)} : le remboursement automatique a échoué.`, link: 'bookings', refId: String(r.id) });
  }
}
app.post('/api/pack-bookings', auth('client'), h(async (req, res) => {
  const b = packBookingSchema.parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`contact:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  const { rows } = await query(`SELECT * FROM offers WHERE id = $1 AND type = 'pack' AND status = 'active' AND deleted_at IS NULL AND (publish_at IS NULL OR publish_at <= now()) AND ${LIVE_DATES}`, [b.offerId]);
  const o = rows[0];
  if (!o) return res.status(404).json({ error: 'OFFER_CLOSED', message: 'Les réservations de ce séjour sont closes : un pack se réserve au plus tard la veille du départ.' });
  await recordFailedAttempt(`contact:${ip}`, ip);
  const total = Number(o.price) * b.travelers;
  const name = b.name || req.user.name || req.user.email.split('@')[0];
  const summary = `${o.from_city || '—'} → ${o.to_city}${o.start_date ? ' · ' + String(o.start_date).slice(0, 10) + (o.end_date ? ' → ' + String(o.end_date).slice(0, 10) : '') : ''}`;
  const { rows: made } = await query(
    `INSERT INTO offer_requests(offer_id, offer_type, offer_title, summary, customer_name, customer_email, customer_phone, travelers, total, message, payment_status, cancel_token, partner_name) VALUES ($1,'pack',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [o.id, o.title, summary, name, req.user.email.toLowerCase(), b.phone, b.travelers, total, b.message || null, paymentsEnabled ? 'awaiting' : 'none', randomBytes(24).toString('hex'), offerCompany(o)]);
  const r = made[0];
  const ref = bookingRef(r.id);
  if (!paymentsEnabled) {
    await announcePack(r);
    return res.status(201).json({ requested: true, reference: ref });
  }
  try {
    const session = await createCheckout({
      bookingId: r.id, reference: ref, cancelToken: r.cancel_token, email: r.customer_email, kind: 'pack', appUrl: APP_URL,
      lines: [{ label: `${o.title} · ${b.travelers} voyageur${b.travelers > 1 ? 's' : ''}`, amount: total }],
      description: `Séjour TripVision ${ref}`,
      successUrl: `${APP_URL}/?payment=success&kind=pack&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_URL}/?payment=cancelled&kind=pack&r=${r.id}&t=${r.cancel_token}&o=${o.id}`,
    });
    await query('UPDATE offer_requests SET stripe_session_id = $1 WHERE id = $2', [session.id, r.id]);
    return res.status(201).json({ checkoutUrl: session.url, reference: ref });
  } catch (err) {
    console.error('Stripe :', err.message);
    await failPack(r.id);
    return res.status(502).json({ error: 'PAYMENT_UNAVAILABLE', message: 'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants.' });
  }
}));
app.get('/api/payments/pack-session/:id', h(async (req, res) => {
  if (!paymentsEnabled) return res.status(404).json({ error: 'NOT_FOUND' });
  const { rows } = await query('SELECT * FROM offer_requests WHERE stripe_session_id = $1', [req.params.id]);
  let r = rows[0];
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  const session = await retrieveSession(req.params.id);
  if (session.payment_status === 'paid') r = (await finalizePackPaid(r.id, session)) || (await query('SELECT * FROM offer_requests WHERE id = $1', [r.id])).rows[0];
  else if (session.status === 'expired') { await failPack(r.id); r = (await query('SELECT * FROM offer_requests WHERE id = $1', [r.id])).rows[0]; }
  res.json({ status: r.payment_status, reference: bookingRef(r.id), title: r.offer_title, summary: r.summary, travelers: r.travelers, total: Number(r.total), paid: r.paid_amount == null ? null : Number(r.paid_amount), offerId: r.offer_id });
}));
app.post('/api/payments/pack-cancel', h(async (req, res) => {
  const { requestId, token } = z.object({ requestId: z.string().uuid(), token: z.string().min(10).max(100) }).parse(req.body);
  const { rows } = await query('SELECT * FROM offer_requests WHERE id = $1 AND cancel_token = $2', [requestId, token]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  if (rows[0].payment_status === 'awaiting') { if (rows[0].stripe_session_id) await expireSession(rows[0].stripe_session_id); await failPack(requestId); }
  res.json({ ok: true });
}));

// ---------- Paiement en ligne (Stripe) ----------
async function failBooking(bookingId) {
  const { rows } = await query(`UPDATE bookings SET payment_status = 'failed', status = 'inactive', status_changed_at = now() WHERE id = $1 AND payment_status = 'awaiting' RETURNING id`, [bookingId]);
  if (rows[0]) await releaseVehicle(bookingId);
  return Boolean(rows[0]);
}
// Idempotent : appelé par le retour de paiement et par le webhook.
async function finalizePaid(bookingId, session) {
  const { rows } = await query(
    `UPDATE bookings SET payment_status = 'paid', status = 'confirmed', status_changed_at = now(), paid_amount = $2, paid_at = now(), stripe_payment_intent = $3 WHERE id = $1 AND payment_status = 'awaiting' RETURNING *`,
    [bookingId, (session.amount_total || 0) / 100, typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null]);
  if (rows[0]) await announceBooking(rows[0]);
  return rows[0] || null;
}
async function refundBooking(booking) {
  if (!paymentsEnabled || booking.payment_status !== 'paid' || !booking.stripe_payment_intent) return;
  try {
    await refundPayment(booking.stripe_payment_intent);
    await query(`UPDATE bookings SET payment_status = 'refunded' WHERE id = $1`, [booking.id]);
    await pushNotification('staff', { kind: 'booking', title: 'Réservation remboursée', body: `${bookingRef(booking.id)} · ${Number(booking.paid_amount || 0)} €`, link: 'bookings', refId: booking.id });
  } catch (err) {
    console.error('Remboursement Stripe impossible :', err.message);
    await pushNotification('staff', { kind: 'booking', title: 'Remboursement à faire à la main', body: `${bookingRef(booking.id)} : le remboursement automatique a échoué.`, link: 'bookings', refId: booking.id });
  }
}

app.get('/api/public/config', (_req, res) => res.json({ payments: paymentsEnabled, testMode }));

// Retour de Stripe : on vérifie le paiement auprès de Stripe (sans dépendre du webhook).
app.get('/api/payments/session/:id', h(async (req, res) => {
  if (!paymentsEnabled) return res.status(404).json({ error: 'NOT_FOUND' });
  const { rows } = await query('SELECT * FROM bookings WHERE stripe_session_id = $1', [req.params.id]);
  let booking = rows[0];
  if (!booking) return res.status(404).json({ error: 'NOT_FOUND' });
  const session = await retrieveSession(req.params.id);
  if (session.payment_status === 'paid') booking = (await finalizePaid(booking.id, session)) || (await query('SELECT * FROM bookings WHERE id = $1', [booking.id])).rows[0];
  else if (session.status === 'expired') { await failBooking(booking.id); booking = (await query('SELECT * FROM bookings WHERE id = $1', [booking.id])).rows[0]; }
  const ctx = await vehicleContext(booking.vehicle_id);
  res.json({ status: booking.payment_status, reference: bookingRef(booking.id), vehicle: ctx.name, startDate: booking.start_date, startTime: booking.start_time, endDate: booking.end_date, endTime: booking.end_time, total: Number(booking.total_estimate), paid: booking.paid_amount == null ? null : Number(booking.paid_amount) });
}));
// Paiement abandonné : la réservation est annulée et l'annonce revient en ligne.
app.post('/api/payments/cancel', h(async (req, res) => {
  const { bookingId, token } = z.object({ bookingId: z.string().uuid(), token: z.string().min(10).max(100) }).parse(req.body);
  const { rows } = await query(`SELECT * FROM bookings WHERE id = $1 AND cancel_token = $2`, [bookingId, token]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  if (rows[0].payment_status === 'awaiting') { if (rows[0].stripe_session_id) await expireSession(rows[0].stripe_session_id); await failBooking(bookingId); }
  res.json({ ok: true });
}));
app.post('/api/stripe/webhook', h(async (req, res) => {
  if (!paymentsEnabled || !webhookSecret) return res.status(404).end();
  let event;
  try { event = constructEvent(req.rawBody, req.headers['stripe-signature']); } catch { return res.status(400).json({ error: 'INVALID_SIGNATURE' }); }
  const session = event.data.object;
  const bookingId = session.metadata?.booking_id, requestId = session.metadata?.request_id, cancelId = session.metadata?.cancel_booking_id;
  if (cancelId && event.type === 'checkout.session.completed' && session.payment_status === 'paid') await finalizeCancelPaid(cancelId);
  else if (bookingId && event.type === 'checkout.session.completed' && session.payment_status === 'paid') await finalizePaid(bookingId, session);
  else if (bookingId && event.type === 'checkout.session.expired') await failBooking(bookingId);
  else if (requestId && event.type === 'checkout.session.completed' && session.payment_status === 'paid') await finalizePackPaid(requestId, session);
  else if (requestId && event.type === 'checkout.session.expired') await failPack(requestId);
  res.json({ received: true });
}));

// Ce qui se règle en ligne à la réservation : 10 % du total de la location, options, protection et frais compris. Le solde se paie à l’enseigne.
const COMMISSION_PCT = 10;
const commissionOf = (total) => Math.round(Number(total) * COMMISSION_PCT) / 100;
const conditionsSnapshot = (d, lessor) => ({
  lessor, deposit: d.deposit ?? null, excess: settings.franchiseAmount ?? null, minAge: d.minAge ?? null, mileage: d.includedKm ?? null, extraKmPrice: d.extraKmPrice ?? null, fuelPolicy: d.fuelPolicy ?? null,
  freeCancelHours: d.freeCancelHours ?? 0, cancelFee: d.cancelFee ?? null, freeModification: !!d.freeModification, insuranceType: d.insuranceType ?? null, youngDriver: d.youngDriverFee > 0 ? { age: d.youngDriverAge, fee: d.youngDriverFee, pricing: d.youngDriverPricing || 'day' } : null, officeHours: d.officeHours ?? null, conditions: d.rentalConditions ?? null,
});

app.post('/api/bookings', auth('client'), h(async (req, res) => {
  const b = bookingSchema.parse(req.body);
  b.email = req.user.email;
  b.name = b.name?.trim() || req.user.name;
  const { rows: vrows } = await query(
    `SELECT v.*, p.trade_name FROM vehicles v LEFT JOIN partners p ON p.id = v.partner_id
     WHERE v.id = $1 AND v.status = 'approved' AND v.deleted_at IS NULL AND (v.partner_id IS NULL OR (p.status = 'approved' AND p.deleted_at IS NULL)) AND (v.publish_at IS NULL OR v.publish_at <= now())`, [b.vehicleId]);
  const veh = vrows[0];
  if (!veh) return res.status(404).json({ error: 'NOT_FOUND' });
  const d = veh.details || {};
  const from = b.startDate ? `${b.startDate}T${b.startTime || '10:00'}` : null, to = b.endDate ? `${b.endDate}T${b.endTime || '10:00'}` : null;
  if (from && to) {
    const { rows: busy } = await query(`SELECT 1 FROM vehicles v WHERE v.id = $1 ${unavailableSql(2, 3)}`, [veh.id, from, to]);
    if (!busy.length) return res.status(409).json({ error: 'UNAVAILABLE', message: 'Ce véhicule n’est plus disponible sur cette période. Choisissez d’autres dates ou un autre véhicule.' });
  }
  if (d.minAge && b.driverAge && b.driverAge < d.minAge) return res.status(400).json({ error: 'VALIDATION_ERROR', message: `L’enseigne exige un conducteur d’au moins ${d.minAge} ans.` });
  const todayParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  if (b.startDate && b.startDate < todayParis) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La date de départ ne peut pas être dans le passé.' });
  const q = Pricing.quote(mapVehicle(veh, veh.trade_name), from || `${todayParis}T10:00`, to || `${todayParis}T10:00`);
  if (q.error) return res.status(400).json({ error: 'VALIDATION_ERROR', message: q.error });
  const days = q.days;
  const wanted = new Map((b.extras || []).map(e => (typeof e === 'string' ? [e, 1] : [e.key, e.qty])));
  const chosen = (d.extras || []).filter(x => wanted.has(x.key)).map(x => {
    const qty = Math.min(Number(x.maxQty || 1), wanted.get(x.key));
    const unit = Number(x.pricePerDay);
    return { key: x.key, name: x.name, qty, pricePerDay: unit, pricing: x.pricing || 'day', total: unit * qty * (x.pricing === 'once' ? 1 : days) };
  });
  const options = returnOptionsOf(d, veh.pickup_address);
  const loc = options.find(l => l.key === (b.returnKey || 'same')) || options[0];
  const returnAddr = loc ? [loc.name, loc.address].filter(Boolean).join(' · ') : (b.returnAddress || null);
  if (loc && loc.fee > 0) chosen.push({ key: 'return', name: `Restitution dans un autre lieu : ${loc.name}`, qty: 1, pricePerDay: Number(loc.fee), pricing: 'once', total: Number(loc.fee) });
  // Frais jeune conducteur, fixés par l’enseigne : par jour ou en forfait unique.
  if (d.youngDriverFee > 0 && d.youngDriverAge && b.driverAge && b.driverAge < d.youngDriverAge) {
    const once = d.youngDriverPricing === 'once', fee = Number(d.youngDriverFee);
    chosen.push({ key: 'young', name: `Conducteur de moins de ${d.youngDriverAge} ans`, qty: 1, pricePerDay: fee, pricing: once ? 'once' : 'day', total: once ? fee : fee * days });
  }
  // Protection de la franchise : prix fixe, le même pour toutes les voitures (réglé par TripVision).
  if (b.protection && settings.franchisePerDay > 0) chosen.push({ key: 'protection', name: 'Protection de la franchise', pricePerDay: settings.franchisePerDay, total: settings.franchisePerDay * days });
  const baseRental = q.base;
  const total = baseRental + chosen.reduce((n, x) => n + x.total, 0);
  const snapshot = conditionsSnapshot(d, veh.trade_name || 'TripVision');
  const { rows } = await query(
    `INSERT INTO bookings(vehicle_id, customer_name, customer_email, customer_phone, pickup_address, return_address, start_date, start_time, end_date, end_time, driver_age, message, extras, conditions_snapshot, conditions_accepted_at, total_estimate, payment_status, cancel_token, commission_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NULL,$15,$16,$17,$18) RETURNING *`,
    [b.vehicleId, b.name, b.email, b.phone || null, b.pickupAddress || null, returnAddr, b.startDate || null, b.startTime || null, b.endDate || null, b.endTime || null, b.driverAge || null, b.message || null, JSON.stringify(chosen), JSON.stringify(snapshot), total, paymentsEnabled ? 'awaiting' : 'none', randomBytes(24).toString('hex'), commissionOf(total)]
  );
  await reserveVehicle(veh.id, rows[0].id, b.endDate, b.endTime);
  if (!paymentsEnabled) {
    await announceBooking(rows[0]);
    return res.status(201).json(mapBooking(rows[0]));
  }
  // Paiement en ligne : la réservation attend le paiement ; l'annonce est retenue pendant ce temps.
  const reference = bookingRef(rows[0].id);
  // Seul l'acompte se règle en ligne ; le solde est payé à l’enseigne au retrait du véhicule.
  const lines = [{ label: `Acompte de réservation · ${String(veh.model).replace(/ ou similaire$/i, '')} (${days} jour${days > 1 ? 's' : ''})`, amount: Number(rows[0].commission_amount) }];
  try {
    const session = await createCheckout({ bookingId: rows[0].id, reference, cancelToken: rows[0].cancel_token, email: rows[0].customer_email, lines, appUrl: APP_URL });
    await query('UPDATE bookings SET stripe_session_id = $1 WHERE id = $2', [session.id, rows[0].id]);
    return res.status(201).json({ ...mapBooking(rows[0]), checkoutUrl: session.url });
  } catch (err) {
    console.error('Stripe :', err.message);
    await failBooking(rows[0].id);
    return res.status(502).json({ error: 'PAYMENT_UNAVAILABLE', message: 'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants.' });
  }
}));

// ---------- Partenaire ----------
app.get('/api/partner/dashboard', auth('partner'), h(async (req, res) => {
  const { rows: partnerRows } = await query('SELECT * FROM partners WHERE user_id = $1 AND deleted_at IS NULL', [req.user.id]);
  const partner = partnerRows[0];
  if (!partner) return res.json({ partner: null, vehicles: [], bookings: [] });
  const { rows: vehicleRows } = await query('SELECT * FROM vehicles WHERE partner_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC', [partner.id]);
  const vehicles = vehicleRows.map(v => mapVehicle(v, partner.trade_name));
  const vehicleIds = vehicleRows.map(v => v.id);
  let bookings = [];
  if (vehicleIds.length) {
    const { rows: bookingRows } = await query(
      `SELECT b.*, v.model AS vehicle_model FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.vehicle_id = ANY($1) AND b.payment_status NOT IN ('awaiting', 'failed') ORDER BY b.created_at DESC`,
      [vehicleIds]
    );
    bookings = bookingRows.map(b => mapBooking(b, b.vehicle_model));
  }
  res.json({ partner: mapPartner(partner), vehicles, bookings });
}));

app.post('/api/partner/profile', auth('partner'), h(async (req, res) => {
  const p = partnerSchema.parse(req.body);
  const { rows } = await query('SELECT id FROM partners WHERE user_id = $1', [req.user.id]);
  let partner;
  if (rows.length) {
    const upd = await query(
      `UPDATE partners SET legal_name=$1, trade_name=$2, head_office=$3, agencies=$4, siret=$5, booking_email=$6, contact_email=$7, manager_name=$8, kbis_name=$9, login_id=$10, phone=$11, city=$12, updated_at=now()
       WHERE user_id = $13 RETURNING *`,
      [p.legalName, p.tradeName, p.headOffice, p.agencies, p.siret, p.bookingEmail, p.contactEmail, p.managerName, p.kbisName || null, p.loginId || null, p.phone || null, p.city || null, req.user.id]
    );
    partner = upd.rows[0];
  } else {
    const ins = await query(
      `INSERT INTO partners(user_id, legal_name, trade_name, head_office, agencies, siret, booking_email, contact_email, manager_name, kbis_name, login_id, phone, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.id, p.legalName, p.tradeName, p.headOffice, p.agencies, p.siret, p.bookingEmail, p.contactEmail, p.managerName, p.kbisName || null, p.loginId || null, p.phone || null, p.city || null]
    );
    partner = ins.rows[0];
  }
  res.status(201).json(mapPartner(partner));
}));

// Une nouvelle annonce ne peut pas commencer dans le passé.
const notInPast = (v) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  if (v.availableFrom < today) throw new z.ZodError([{ code: 'custom', path: ['availableFrom'], message: 'La période de location ne peut pas commencer dans le passé.' }]);
};
// Le partenaire peut programmer la mise en ligne de son annonce (date future), ou la publier tout de suite.
const futurePublishAt = (body) => {
  const { publishAt } = scheduleSchema.parse({ publishAt: body?.publishAt ?? null });
  if (publishAt && new Date(publishAt) <= new Date()) throw new z.ZodError([{ code: 'custom', path: ['publishAt'], message: 'La date de mise en ligne doit être dans le futur.' }]);
  return publishAt || null;
};
app.post('/api/partner/vehicles', auth('partner'), h(async (req, res) => {
  const v = vehicleSchema.parse(req.body);
  notInPast(v);
  const publishAt = futurePublishAt(req.body);
  const { rows } = await query('SELECT id, trade_name FROM partners WHERE user_id = $1 AND deleted_at IS NULL', [req.user.id]);
  const partner = rows[0];
  if (!partner) return res.status(400).json({ error: 'PARTNER_PROFILE_REQUIRED' });
  const details = buildVehicleDetails(v, {});
  const { rows: inserted } = await query(
    `INSERT INTO vehicles(partner_id, status, model, category, pickup_address, price_day, price_week, price_month, details, publish_at)
     VALUES ($1,'approved',$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [partner.id, /similaire/i.test(v.model) ? v.model : `${v.model} ou similaire`, v.category, v.pickupAddress, priceCols(v).priceDay, priceCols(v).priceWeek, priceCols(v).priceMonth, details, publishAt]
  );
  await saveBlocks(inserted[0].id, v.blocks);
  res.status(201).json(mapVehicle(inserted[0], partner.trade_name));
}));

// ---------- Admin / back-office ----------
app.get('/api/admin/badges', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  const { rows } = await query(`SELECT
    (SELECT count(*) FROM bookings WHERE staff_seen_at IS NULL AND payment_status NOT IN ('awaiting', 'failed')) + (SELECT count(*) FROM offer_requests WHERE staff_seen_at IS NULL AND payment_status NOT IN ('awaiting', 'failed')) AS bookings,
    (SELECT count(*) FROM contact_messages WHERE handled_at IS NULL) AS messages,
    (SELECT COALESCE(sum(unread_admin), 0) FROM chat_threads) AS chats,
    (SELECT count(*) FROM partner_applications WHERE status = 'pending') AS applications`);
  const r = rows[0];
  res.json({ bookings: Number(r.bookings), messages: Number(r.messages), chats: Number(r.chats), applications: Number(r.applications), notifications: await unreadNotifications(req.user) });
}));

app.get('/api/admin/dashboard', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  const [{ rows: partners }, { rows: vehicles }, { rows: offers }] = await Promise.all([
    query('SELECT * FROM partners WHERE deleted_at IS NULL ORDER BY created_at DESC'),
    query(`SELECT v.*, p.trade_name FROM vehicles v LEFT JOIN partners p ON p.id = v.partner_id WHERE v.deleted_at IS NULL ORDER BY v.created_at DESC`),
    query('SELECT * FROM offers WHERE deleted_at IS NULL ORDER BY created_at DESC'),
  ]);
  const { rows: bookings } = await query(
    `SELECT b.*, v.model AS vehicle_model, (v.partner_id IS NOT NULL) AS partner_owned, COALESCE(p.trade_name, 'TripVision') AS company FROM bookings b LEFT JOIN vehicles v ON v.id = b.vehicle_id LEFT JOIN partners p ON p.id = v.partner_id WHERE b.payment_status NOT IN ('awaiting', 'failed') ORDER BY b.created_at DESC`
  );
  const { rows: offerRequests } = await query("SELECT * FROM offer_requests WHERE payment_status NOT IN ('awaiting', 'failed') ORDER BY created_at DESC LIMIT 300");
  // Les réservations ne sont transmises qu'aux comptes qui ont le droit de les voir.
  if (!hasPermission(req.user, 'bookings.view') && !hasPermission(req.user, 'bookings.manage')) { bookings.length = 0; offerRequests.length = 0; }
  const unseenBookings = bookings.filter(b => !b.staff_seen_at).length + offerRequests.filter(r => !r.staff_seen_at).length;
  const { rows: unread } = await query('SELECT count(*)::int AS n FROM contact_messages WHERE handled_at IS NULL');
  const { rows: extra } = await query("SELECT (SELECT count(*)::int FROM partner_applications WHERE status = 'pending') AS applications, (SELECT COALESCE(sum(unread_admin), 0)::int FROM chat_threads) AS chats");
  res.json({
    partners: partners.map(mapPartner),
    vehicles: vehicles.map(v => mapVehicle(v, v.trade_name)),
    bookings: bookings.map(b => mapBooking(b, b.vehicle_model)),
    offers: offers.map(withAbsImage),
    offerRequests,
    unseenBookings,
    unreadMessages: unread[0].n,
    pendingApplications: extra[0].applications,
    unreadChats: extra[0].chats,
  });
}));

// ---------- Suivi des réservations, réglages, e-mails des vols, rythme de publication ----------
// Combien de réservations ont été faites ces 7 derniers jours, ce mois-ci et cette année (voitures, packs, vols). Trace seulement : TripVision n'annule rien.
app.get('/api/admin/booking-stats', auth(...BACKOFFICE_ROLES), canAny('bookings.view', 'bookings.manage'), h(async (_req, res) => {
  const { rows } = await query(`
    WITH ev AS (
      SELECT 'car' AS kind, created_at FROM bookings WHERE payment_status NOT IN ('awaiting', 'failed')
      UNION ALL SELECT offer_type AS kind, created_at FROM offer_requests WHERE payment_status NOT IN ('awaiting', 'failed')
    ), edges AS (
      SELECT (now() - interval '7 days') AS wk, date_trunc('month', now()) AS mo, date_trunc('year', now()) AS yr
    )
    SELECT k.kind,
      count(*) FILTER (WHERE ev.created_at >= e.wk)::int AS week,
      count(*) FILTER (WHERE ev.created_at >= e.mo)::int AS month,
      count(*) FILTER (WHERE ev.created_at >= e.yr)::int AS year
    FROM (VALUES ('car'), ('pack'), ('flight')) AS k(kind) CROSS JOIN edges e LEFT JOIN ev ON ev.kind = k.kind
    GROUP BY k.kind`);
  const out = { week: { car: 0, pack: 0, flight: 0, total: 0 }, month: { car: 0, pack: 0, flight: 0, total: 0 }, year: { car: 0, pack: 0, flight: 0, total: 0 } };
  for (const r of rows) for (const p of ['week', 'month', 'year']) { out[p][r.kind] = r[p]; out[p].total += r[p]; }
  res.json(out);
}));

const settingsSchema = z.object({ franchisePerDay: z.coerce.number().min(0).max(200) });
app.get('/api/admin/settings', auth(...BACKOFFICE_ROLES), canAny('franchise.manage', 'settings.manage'), h(async (_req, res) => {
  await loadSettings();
  res.json({ franchisePerDay: settings.franchisePerDay });
}));
app.put('/api/admin/settings', auth(...BACKOFFICE_ROLES), canAny('franchise.manage', 'settings.manage'), h(async (req, res) => {
  const b = settingsSchema.parse(req.body);
  await query(`INSERT INTO site_settings(key, value, updated_at, updated_by) VALUES ('franchise_protection_per_day', $1::jsonb, now(), $2)
               ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = now(), updated_by = $2`, [JSON.stringify(b.franchisePerDay), req.user.name || req.user.email]);
  settings.franchisePerDay = b.franchisePerDay;
  await audit(req.user.id, 'update_settings', 'settings', null, clientIp(req));
  res.json({ franchisePerDay: settings.franchisePerDay });
}));

// Montant de la franchise, le même pour toutes les annonces : on le fixe, on le change ou on le supprime.
app.get('/api/admin/franchise', auth(...BACKOFFICE_ROLES), h(async (_req, res) => {
  await loadSettings();
  res.json({ amount: settings.franchiseAmount, protectionPerDay: settings.franchisePerDay });
}));
app.put('/api/admin/franchise', auth(...BACKOFFICE_ROLES), canAny('franchise.manage', 'settings.manage'), h(async (req, res) => {
  const { amount } = z.object({ amount: z.coerce.number({ invalid_type_error: 'Indiquez un montant.' }).min(1, 'Indiquez un montant d’au moins 1 €.').max(100000) }).parse(req.body);
  await query(`INSERT INTO site_settings(key, value, updated_at, updated_by) VALUES ('franchise_amount', $1::jsonb, now(), $2)
               ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = now(), updated_by = $2`, [JSON.stringify(amount), req.user.name || req.user.email]);
  settings.franchiseAmount = amount;
  await audit(req.user.id, 'set_franchise_amount', 'settings', null, clientIp(req));
  res.json({ amount });
}));
app.delete('/api/admin/franchise', auth(...BACKOFFICE_ROLES), canAny('franchise.manage', 'settings.manage'), h(async (req, res) => {
  await query("DELETE FROM site_settings WHERE key = 'franchise_amount'");
  settings.franchiseAmount = null;
  await audit(req.user.id, 'remove_franchise_amount', 'settings', null, clientIp(req));
  res.json({ amount: null });
}));

// Avant d'ouvrir le site de la compagnie, le visiteur laisse son e-mail (obligatoire). Il reste facultatif d'accepter les offres par e-mail.
const flightLeadSchema = z.object({ offerId: z.string().uuid(), email: z.string().trim().email().max(160), consent: z.boolean().optional() });
app.post('/api/public/flight-leads', h(async (req, res) => {
  const b = flightLeadSchema.parse(req.body);
  const ip = clientIp(req);
  if (await isLockedOut(`lead:${ip}`, ip)) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  const { rows } = await query(`SELECT id, title, from_city, to_city, details FROM offers WHERE id = $1 AND type = 'flight' AND status = 'active' AND deleted_at IS NULL`, [b.offerId]);
  const o = rows[0];
  if (!o) return res.status(404).json({ error: 'NOT_FOUND' });
  await recordFailedAttempt(`lead:${ip}`, ip);
  const email = b.email.toLowerCase();
  await query('INSERT INTO flight_leads(offer_id, airline, route, email, consent) VALUES ($1,$2,$3,$4,$5)', [o.id, o.details?.flight?.airline || null, `${o.from_city || '—'} → ${o.to_city}`, email, Boolean(b.consent)]);
  await recordContact({ email, source: 'vol', consent: b.consent, count: 0 });
  res.status(201).json({ ok: true });
}));
app.get('/api/admin/flight-leads', auth(...BACKOFFICE_ROLES), can('mailing.export'), h(async (_req, res) => {
  const { rows } = await query('SELECT id, airline, route, email, consent, created_at FROM flight_leads ORDER BY created_at DESC LIMIT 300');
  const { rows: st } = await query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS week, count(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month FROM flight_leads`);
  res.json({ leads: rows, stats: st[0] });
}));

// De nouvelles offres doivent être publiées au moins toutes les 48 h.
const FRESH_HOURS = 48;
async function freshness() {
  const { rows } = await query(`SELECT max(created_at) AS last, count(*) FILTER (WHERE created_at >= now() - interval '48 hours')::int AS recent, count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS week FROM offers WHERE deleted_at IS NULL`);
  const last = rows[0].last ? new Date(rows[0].last) : null;
  const hours = last ? Math.floor((Date.now() - last.getTime()) / 3600000) : null;
  return { last, hours, limit: FRESH_HOURS, overdue: hours === null || hours >= FRESH_HOURS, recent: rows[0].recent, week: rows[0].week };
}
app.get('/api/admin/freshness', auth(...BACKOFFICE_ROLES), h(async (_req, res) => res.json(await freshness())));
async function checkFreshness() {
  const f = await freshness();
  if (!f.overdue) return;
  const { rows } = await query("SELECT 1 FROM notifications WHERE audience = 'staff' AND kind = 'freshness' AND created_at > now() - interval '24 hours' LIMIT 1");
  if (rows[0]) return;
  const body = f.hours === null ? 'Aucune offre n’est encore publiée.' : `La dernière offre date d’il y a ${f.hours} h : il en faut de nouvelles au moins toutes les ${FRESH_HOURS} h.`;
  await pushNotification('staff', { kind: 'freshness', title: 'Pensez à publier de nouvelles offres', body, link: 'offers' });
  notify(STAFF_EMAIL, notificationEmail({ subject: '[TripVision] De nouvelles offres sont attendues', title: 'De nouvelles offres sont attendues', intro: body, buttonLabel: 'Publier une offre', url: staffLink('offers') }));
}
setInterval(() => checkFreshness().catch((e) => console.error('Rythme de publication :', e.message)), 60 * 60 * 1000);
setTimeout(() => checkFreshness().catch(() => {}), 30000);

const offerCover = (o) => cleanImages(o.images)[0] || normalizeImage(o.image) || null;
const offerDetails = (o) => ({ images: cleanImages(o.images), ...(o.type === 'flight' && o.flight ? { flight: o.flight } : {}), ...(o.type === 'pack' ? { transport: o.transport || null, ratings: o.ratings || [] } : {}) });

app.post('/api/admin/offers', auth(...BACKOFFICE_ROLES), can('offers.create'), h(async (req, res) => {
  const o = offerSchema.parse(req.body);
  const { rows } = await query(
    `INSERT INTO offers(type, title, from_city, to_city, country, badge, price, old_price, partner_name, start_date, end_date, image, description, publish_at, hotel_name, hotel_stars, hotel_nights, hotel_board, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [o.type, o.title, o.fromCity || '', o.toCity, o.country || '', o.badge || (o.type === 'flight' ? 'Bon plan' : (o.hotelNights >= 3 ? 'Week-end prolongé' : 'Week-end')), o.price, o.oldPrice || null, o.partnerName || 'TripVision', o.startDate || null, o.endDate || null, offerCover(o) || DEFAULT_OFFER_IMAGE, o.description || '', o.publishAt || null, o.type === 'pack' ? o.hotelName : null, o.type === 'pack' ? (o.hotelStars || null) : null, o.type === 'pack' ? o.hotelNights : null, o.type === 'pack' ? (o.hotelBoard || null) : null, offerDetails(o)]
  );
  await audit(req.user.id, o.publishAt ? 'schedule_offer' : 'create_offer', 'offer', rows[0].id, clientIp(req));
  res.status(201).json(withAbsImage(rows[0]));
}));

app.patch('/api/admin/offers/:id', auth(...BACKOFFICE_ROLES), can('offers.edit'), h(async (req, res) => {
  const o = offerSchema.parse(req.body);
  const { rows } = await query(
    `UPDATE offers SET title = $1, from_city = $2, to_city = $3, country = $4, badge = $5, price = $6, old_price = $7, start_date = $8, end_date = $9,
            image = COALESCE($10, image), description = $11, hotel_name = $12, hotel_stars = $13, hotel_nights = $14, hotel_board = $15,
            details = $17::jsonb || (CASE WHEN status = 'inactive' AND details ? 'draft' THEN jsonb_build_object('draft', true, 'toVerify', details->'toVerify') ELSE '{}'::jsonb END)
     WHERE id = $16 AND deleted_at IS NULL RETURNING *`,
    [o.title, o.fromCity || '', o.toCity, o.country || '', o.badge || (o.type === 'flight' ? 'Bon plan' : (o.hotelNights >= 3 ? 'Week-end prolongé' : 'Week-end')), o.price, o.oldPrice || null, o.startDate || null, o.endDate || null,
     (o.images ? (offerCover(o) || DEFAULT_OFFER_IMAGE) : (normalizeImage(o.image) || null)), o.description || '', o.type === 'pack' ? o.hotelName : null, o.type === 'pack' ? (o.hotelStars || null) : null, o.type === 'pack' ? o.hotelNights : null, o.type === 'pack' ? (o.hotelBoard || null) : null, req.params.id, offerDetails(o)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, 'update_offer', 'offer', req.params.id, clientIp(req));
  res.json(withAbsImage(rows[0]));
}));

const statusWithSchedule = (values) => z.object({ status: z.enum(values), publishAt: publishAtSchema });

app.patch('/api/admin/offers/:id/status', auth(...BACKOFFICE_ROLES), can('offers.edit'), h(async (req, res) => {
  const { status, publishAt } = statusWithSchedule(['active', 'inactive']).parse(req.body);
  const { rows } = status === 'active'
    // Publier une offre en brouillon la valide : elle n'est plus marquée « à vérifier ».
    ? await query(`UPDATE offers SET status = $1, publish_at = $2, details = COALESCE(details, '{}'::jsonb) - 'draft' - 'toVerify' WHERE id = $3 AND deleted_at IS NULL RETURNING *`, [status, publishAt || null, req.params.id])
    : await query('UPDATE offers SET status = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, `offer_${status}`, 'offer', req.params.id, clientIp(req));
  res.json(rows[0]);
}));

app.patch('/api/admin/offers/:id/schedule', auth(...BACKOFFICE_ROLES), can('offers.edit'), h(async (req, res) => {
  const { publishAt } = scheduleSchema.parse(req.body);
  const { rows } = await query('UPDATE offers SET publish_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *', [publishAt || null, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, 'schedule_offer', 'offer', req.params.id, clientIp(req));
  res.json(rows[0]);
}));

app.delete('/api/admin/offers/:id', auth(...BACKOFFICE_ROLES), can('offers.delete'), h(async (req, res) => {
  const { rows } = await query("UPDATE offers SET deleted_at = now(), status = 'inactive' WHERE id = $1 AND deleted_at IS NULL RETURNING id", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, 'delete_offer', 'offer', req.params.id, clientIp(req));
  res.json({ ok: true });
}));

const adminVehicleSchema = vehicleBase.extend({ partnerId: z.string().uuid().nullable().optional(), publishAt: publishAtSchema, draft: z.boolean().optional() }).refine(...untilAfterFrom).refine(...maxPeriodRule).refine(...returnRule).refine(...returnFeeRule).refine(...youngRule).refine(...kmRule).refine(...utilityRule).refine(...inclusionRule);

app.post('/api/admin/vehicles', auth(...BACKOFFICE_ROLES), can('vehicles.create'), h(async (req, res) => {
  const v = adminVehicleSchema.parse(req.body);
  notInPast(v);
  let partner = null;
  if (v.partnerId) {
    const { rows: partnerRows } = await query('SELECT id, trade_name FROM partners WHERE id = $1 AND deleted_at IS NULL', [v.partnerId]);
    partner = partnerRows[0];
    if (!partner) return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const details = buildVehicleDetails(v, {});
  const status = v.draft ? 'pending' : 'approved';
  const { rows } = await query(
    `INSERT INTO vehicles(partner_id, status, model, category, pickup_address, price_day, price_week, price_month, details, publish_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [partner?.id ?? null, status, v.model, v.category, v.pickupAddress, priceCols(v).priceDay, priceCols(v).priceWeek, priceCols(v).priceMonth, details, v.draft ? null : (v.publishAt || null)]
  );
  await saveBlocks(rows[0].id, v.blocks);
  await audit(req.user.id, v.publishAt ? 'schedule_vehicle' : 'create_vehicle', 'vehicle', rows[0].id, clientIp(req));
  res.status(201).json(mapVehicle(rows[0], partner?.trade_name || 'TripVision'));
}));

app.patch('/api/admin/vehicles/:id', auth(...BACKOFFICE_ROLES), can('vehicles.edit'), h(async (req, res) => {
  const v = adminVehicleSchema.parse(req.body);
  let partner = null;
  if (v.partnerId) {
    const { rows: partnerRows } = await query('SELECT id, trade_name FROM partners WHERE id = $1 AND deleted_at IS NULL', [v.partnerId]);
    partner = partnerRows[0];
    if (!partner) return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const { rows: current } = await query('SELECT details FROM vehicles WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (!current[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  const old = current[0].details || {};
  const details = buildVehicleDetails(v, old);
  const { rows } = await query(
    `UPDATE vehicles SET partner_id = $1, model = $2, category = $3, pickup_address = $4, price_day = $5, price_week = $6, price_month = $7, details = $8, updated_at = now()
     WHERE id = $9 AND deleted_at IS NULL RETURNING *`,
    [partner?.id ?? null, v.model, v.category, v.pickupAddress, priceCols(v).priceDay, priceCols(v).priceWeek, priceCols(v).priceMonth, details, req.params.id]
  );
  await saveBlocks(req.params.id, v.blocks);
  await audit(req.user.id, 'update_vehicle', 'vehicle', req.params.id, clientIp(req));
  res.json(mapVehicle(rows[0], partner?.trade_name || 'TripVision'));
}));

app.patch('/api/admin/vehicles/:id/status', auth(...BACKOFFICE_ROLES), can('vehicles.edit'), h(async (req, res) => {
  const { status, publishAt } = statusWithSchedule(['pending', 'approved', 'inactive']).parse(req.body);
  const { rows } = status === 'approved'
    ? await query('UPDATE vehicles SET status = $1, publish_at = $2, updated_at = now() WHERE id = $3 AND deleted_at IS NULL RETURNING id, status, publish_at', [status, publishAt || null, req.params.id])
    : await query('UPDATE vehicles SET status = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL RETURNING id, status, publish_at', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  if (status === 'approved') await query(`UPDATE vehicles SET details = details - 'afterRental' - 'rentedUntil' - 'rentedBookingId' - 'hiddenByPartner' WHERE id = $1`, [req.params.id]);
  await audit(req.user.id, `vehicle_${status}`, 'vehicle', req.params.id, clientIp(req));
  const { rows: owner } = await query('SELECT p.user_id, v.model FROM vehicles v JOIN partners p ON p.id = v.partner_id WHERE v.id = $1', [req.params.id]);
  if (owner[0]) pushNotification(owner[0].user_id, { kind: 'vehicle', title: status === 'approved' ? 'Annonce validée' : status === 'inactive' ? 'Annonce masquée par TripVision' : 'Annonce remise en attente', body: owner[0].model, link: 'fleet' });
  res.json(rows[0]);
}));

app.patch('/api/admin/vehicles/:id/schedule', auth(...BACKOFFICE_ROLES), can('vehicles.edit'), h(async (req, res) => {
  const { publishAt } = scheduleSchema.parse(req.body);
  const { rows } = await query('UPDATE vehicles SET publish_at = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL RETURNING id, status, publish_at', [publishAt || null, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, 'schedule_vehicle', 'vehicle', req.params.id, clientIp(req));
  res.json(rows[0]);
}));

app.delete('/api/admin/vehicles/:id', auth(...BACKOFFICE_ROLES), can('vehicles.delete'), h(async (req, res) => {
  const { rows } = await query("UPDATE vehicles SET deleted_at = now(), status = 'inactive', updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, 'delete_vehicle', 'vehicle', req.params.id, clientIp(req));
  res.json({ ok: true });
}));

// TripVision garde la trace des réservations faites auprès des enseignes et des compagnies : c'est à eux de les annuler.
const NO_CANCEL_TEXT = 'TripVision n’annule pas les réservations faites auprès d’une enseigne ou d’une compagnie : nous en gardons la trace.';
app.patch('/api/admin/bookings/:id/status', auth(...BACKOFFICE_ROLES), can('bookings.manage'), h(async (req, res) => {
  const { status } = statusSchema(['pending', 'confirmed', 'inactive']).parse(req.body);
  if (status === 'inactive') return res.status(403).json({ error: 'NO_CANCEL', message: NO_CANCEL_TEXT });
  const { rows: owner } = await query('SELECT v.partner_id FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.id = $1', [req.params.id]);
  if (owner[0]?.partner_id) return res.status(403).json({ error: 'PARTNER_BOOKING', message: 'Cette réservation appartient à un partenaire : seul le partenaire peut la modifier.' });
  const { rows } = await query('UPDATE bookings SET status = $1, status_changed_at = now(), staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, `booking_${status}`, 'booking', req.params.id, clientIp(req));
  notifyBookingStatus(rows[0], status).catch(() => {});
  if (status === 'inactive') { await releaseVehicle(rows[0].id); await refundBooking(rows[0]); }
  res.json(rows[0]);
}));

app.patch('/api/admin/offer-requests/:id/status', auth(...BACKOFFICE_ROLES), can('bookings.manage'), h(async (req, res) => {
  const { status } = statusSchema(['pending', 'confirmed', 'cancelled']).parse(req.body);
  if (status === 'cancelled') return res.status(403).json({ error: 'NO_CANCEL', message: NO_CANCEL_TEXT });
  const { rows } = await query('UPDATE offer_requests SET status = $1, status_changed_at = now(), staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  if (status === 'cancelled') await refundPack(rows[0]);
  if (status !== 'pending') pushNotification(await clientUserId(rows[0].customer_email), { kind: 'request', title: status === 'confirmed' ? 'Demande confirmée' : 'Demande annulée', body: `${bookingRef(rows[0].id)} · ${rows[0].offer_title}`, link: 'orders', refId: rows[0].id });
  if (status !== 'pending') notify(rows[0].customer_email, notificationEmail({ subject: status === 'confirmed' ? 'Votre demande TripVision est confirmée' : 'Votre demande TripVision a été annulée', title: status === 'confirmed' ? 'Demande confirmée' : 'Demande annulée', intro: status === 'confirmed' ? 'Bonne nouvelle : votre demande de réservation est confirmée.' : 'Votre demande de réservation a été annulée.', details: [['Référence', bookingRef(rows[0].id)], ['Offre', rows[0].offer_title]], buttonLabel: 'Voir ma réservation', url: espaceLink('orders') }));
  await audit(req.user.id, `offer_request_${status}`, 'offer_request', req.params.id, clientIp(req));
  res.json(rows[0]);
}));

// ---------- Candidatures de partenaires ----------
app.get('/api/admin/partner-applications', auth(...BACKOFFICE_ROLES), can('partners.manage'), h(async (_req, res) => {
  const { rows } = await query('SELECT * FROM partner_applications ORDER BY (status = \'pending\') DESC, created_at DESC LIMIT 300');
  res.json(rows);
}));

app.post('/api/admin/partner-applications/:id/approve', auth(...BACKOFFICE_ROLES), can('partners.manage'), h(async (req, res) => {
  const { rows } = await query("SELECT * FROM partner_applications WHERE id = $1 AND status = 'pending'", [req.params.id]);
  const a = rows[0];
  if (!a) return res.status(404).json({ error: 'NOT_FOUND' });
  const existing = await query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [a.login_email]);
  if (existing.rows.length) return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
  const { rows: userRows } = await query(
    "INSERT INTO users(email, name, role, password_hash, must_change_password, created_by) VALUES ($1,$2,'partner',$3,true,$4) RETURNING *",
    [a.login_email, a.manager_name, await unusablePasswordHash(), req.user.id]
  );
  const user = userRows[0];
  const { rows: partnerRows } = await query(
    `INSERT INTO partners(user_id, status, legal_name, trade_name, head_office, agencies, siret, booking_email, contact_email, manager_name, kbis_name, phone, city)
     VALUES ($1,'approved',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [user.id, a.legal_name, a.trade_name, a.head_office, a.agencies, a.siret, a.booking_email, a.contact_email, a.manager_name, a.kbis_name, a.phone, a.city]
  );
  await query("UPDATE partner_applications SET status = 'approved', reviewed_by = $1, reviewed_at = now() WHERE id = $2", [req.user.id, a.id]);
  await audit(req.user.id, 'approve_partner_application', 'partner_application', a.id, clientIp(req));
  const access = await sendAccessLink(user, 'invite', { invitedBy: req.user.name });
  res.status(201).json({ partner: mapPartner(partnerRows[0]), loginEmail: a.login_email, ...access });
}));

app.post('/api/admin/partner-applications/:id/reject', auth(...BACKOFFICE_ROLES), can('partners.manage'), h(async (req, res) => {
  const { rows } = await query("UPDATE partner_applications SET status = 'rejected', reviewed_by = $1, reviewed_at = now() WHERE id = $2 AND status = 'pending' RETURNING id", [req.user.id, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, 'reject_partner_application', 'partner_application', req.params.id, clientIp(req));
  res.json({ ok: true });
}));

// ---------- Messagerie partenaire <-> équipe ----------
const attachmentSchema = z.object({ url: z.string().regex(/^\/uploads\/[0-9a-f-]{36}$/i), name: z.string().trim().max(120), mime: z.string().max(60), size: z.coerce.number().int().min(0).max(8 * 1024 * 1024) });
const chatMessageSchema = z.object({ message: z.string().trim().max(4000).default(''), attachments: z.array(attachmentSchema).max(3).default([]) })
  .refine((m) => m.message.length > 0 || m.attachments.length > 0, { message: 'Écrivez un message ou joignez un fichier.', path: ['message'] });
const chatThreadInfo = (t) => ({
  id: t.id, subject: t.subject, status: t.status, partner_name: t.partner_name, partner_email: t.partner_email, kind: t.kind, created_at: t.created_at, updated_at: t.updated_at,
  closed_at: t.closed_at, closed_by: t.closed_by, auto_closed: t.auto_closed, assigned_to: t.assigned_to, assigned_name: t.assigned_name, first_response_at: t.first_response_at, rating: t.rating, rating_comment: t.rating_comment,
});
// Le client et le partenaire ne voient jamais les notes internes de l'équipe.
const chatMessages = async (threadId, forStaff = false) => (await query(
  `SELECT id, sender, body, created_at, author, attachments FROM chat_messages WHERE thread_id = $1 ${forStaff ? '' : "AND sender <> 'note'"} ORDER BY created_at ASC`, [threadId])).rows;
// Pièces jointes de la messagerie : JPG/JPEG, PNG ou PDF.
const CHAT_FILE_TYPES = {
  'image/jpeg': IMAGE_SIGNATURES['image/jpeg'],
  'image/png': IMAGE_SIGNATURES['image/png'],
  'application/pdf': (b) => b.length > 5 && b.subarray(0, 5).toString('ascii') === '%PDF-',
};
const rawChatFile = express.raw({ type: Object.keys(CHAT_FILE_TYPES), limit: '8mb' });
async function storeChatFile(req, res) {
  const mime = String(req.headers['content-type'] || '').split(';')[0].trim();
  const body = req.body;
  if (!CHAT_FILE_TYPES[mime] || !Buffer.isBuffer(body) || body.length === 0 || !CHAT_FILE_TYPES[mime](body)) return res.status(400).json({ error: 'INVALID_FILE', message: 'Formats acceptés : JPG, JPEG, PNG ou PDF (8 Mo maximum).' });
  const { rows } = await query('INSERT INTO files(mime, size, data, created_by) VALUES ($1,$2,$3,$4) RETURNING id', [mime, body.length, body, req.user.id]);
  let name = 'fichier';
  try { name = decodeURIComponent(String(req.headers['x-file-name'] || 'fichier')).replace(/[^\p{L}\p{N}._ -]/gu, '').slice(0, 120) || 'fichier'; } catch { /* nom par défaut */ }
  res.status(201).json({ url: `/uploads/${rows[0].id}`, name, mime, size: body.length });
}
app.post('/api/chat/uploads', auth('partner', 'client'), rawChatFile, h(storeChatFile));
app.post('/api/admin/chat-uploads', auth(...BACKOFFICE_ROLES), canChat, rawChatFile, h(storeChatFile));

async function ownVehicle(userId, id) {
  const { rows } = await query(
    `SELECT v.*, p.trade_name FROM vehicles v JOIN partners p ON p.id = v.partner_id WHERE v.id = $1 AND p.user_id = $2 AND v.deleted_at IS NULL AND p.deleted_at IS NULL`, [id, userId]);
  return rows[0] || null;
}

app.get('/api/partner/vehicles/:id/availability', auth('partner'), h(async (req, res) => {
  const own = await ownVehicle(req.user.id, req.params.id);
  if (!own) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(await availabilityOf(own.id));
}));
app.get('/api/admin/vehicles/:id/availability', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  res.json(await availabilityOf(req.params.id));
}));

app.patch('/api/partner/vehicles/:id', auth('partner'), h(async (req, res) => {
  const v = vehicleSchema.parse(req.body);
  const current = await ownVehicle(req.user.id, req.params.id);
  if (!current) return res.status(404).json({ error: 'NOT_FOUND' });
  const old = current.details || {};
  const details = buildVehicleDetails(v, old);
  const reschedule = Object.prototype.hasOwnProperty.call(req.body || {}, 'publishAt');
  const publishAt = reschedule ? futurePublishAt(req.body) : current.publish_at;
  const { rows } = await query(
    `UPDATE vehicles SET model = $1, category = $2, pickup_address = $3, price_day = $4, price_week = $5, price_month = $6, details = $7, publish_at = $9, updated_at = now() WHERE id = $8 RETURNING *`,
    [v.model, v.category, v.pickupAddress, priceCols(v).priceDay, priceCols(v).priceWeek, priceCols(v).priceMonth, details, req.params.id, publishAt]);
  await saveBlocks(req.params.id, v.blocks);
  await audit(req.user.id, 'partner_update_vehicle', 'vehicle', req.params.id, clientIp(req));
  res.json(mapVehicle(rows[0], current.trade_name));
}));

app.patch('/api/partner/vehicles/:id/visibility', auth('partner'), h(async (req, res) => {
  const { hidden } = z.object({ hidden: z.boolean() }).parse(req.body);
  const current = await ownVehicle(req.user.id, req.params.id);
  if (!current) return res.status(404).json({ error: 'NOT_FOUND' });
  const details = { ...(current.details || {}) };
  if (hidden) {
    if (current.status !== 'approved') return res.status(409).json({ error: 'NOT_PUBLISHED' });
    details.hiddenByPartner = true;
    await query(`UPDATE vehicles SET status = 'inactive', details = $1, updated_at = now() WHERE id = $2`, [details, current.id]);
  } else {
    if (details.rentedUntil) return res.status(409).json({ error: 'RENTED', message: `Ce véhicule est loué jusqu’au ${String(details.rentedUntil).replace('T', ' à ')}. Vous pourrez republier l’annonce ensuite.` });
    if (!(current.status === 'inactive' && (details.hiddenByPartner || details.afterRental))) return res.status(409).json({ error: 'HIDDEN_BY_TRIPVISION' });
    delete details.hiddenByPartner;
    delete details.afterRental;
    await query(`UPDATE vehicles SET status = 'approved', details = $1, updated_at = now() WHERE id = $2`, [details, current.id]);
  }
  await audit(req.user.id, hidden ? 'partner_hide_vehicle' : 'partner_show_vehicle', 'vehicle', current.id, clientIp(req));
  res.json({ ok: true });
}));

app.delete('/api/partner/vehicles/:id', auth('partner'), h(async (req, res) => {
  const current = await ownVehicle(req.user.id, req.params.id);
  if (!current) return res.status(404).json({ error: 'NOT_FOUND' });
  await query('UPDATE vehicles SET deleted_at = now() WHERE id = $1', [current.id]);
  await audit(req.user.id, 'partner_delete_vehicle', 'vehicle', current.id, clientIp(req));
  res.status(204).end();
}));

app.patch('/api/partner/bookings/:id/status', auth('partner'), h(async (req, res) => {
  const { status } = statusSchema(['confirmed', 'inactive']).parse(req.body);
  const { rows } = await query(
    `UPDATE bookings b SET status = $1, status_changed_at = now(), partner_seen_at = COALESCE(b.partner_seen_at, now()) FROM vehicles v JOIN partners p ON p.id = v.partner_id
     WHERE b.id = $2 AND v.id = b.vehicle_id AND p.user_id = $3 RETURNING b.*`, [status, req.params.id, req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  notifyBookingStatus(rows[0], status).catch(() => {});
  if (status === 'inactive') { await releaseVehicle(rows[0].id); await refundBooking(rows[0]); }
  await audit(req.user.id, `partner_booking_${status}`, 'booking', req.params.id, clientIp(req));
  res.json({ ok: true });
}));

const CHAT_ROLES = ['partner', 'client'];
const MAX_OPEN_THREADS = 5;
const newThreadSchema = z.object({ subject: z.string().trim().min(2).max(120), message: z.string().trim().max(4000).default(''), attachments: z.array(attachmentSchema).max(3).default([]) })
  .refine((m) => m.message.length > 0 || m.attachments.length > 0, { message: 'Écrivez un message ou joignez un fichier.', path: ['message'] });
async function chatIdentity(user) {
  const { rows } = await query('SELECT trade_name, contact_email FROM partners WHERE user_id = $1 AND deleted_at IS NULL', [user.id]);
  return { name: rows[0]?.trade_name || user.name || user.email, email: rows[0]?.contact_email || user.email };
}
const ownThread = async (user, id) => (await query('SELECT * FROM chat_threads WHERE id = $1 AND partner_user_id = $2', [id, user.id])).rows[0] || null;
function alertStaffOfMessage(thread, user, fresh) {
  const who = user.role === 'partner' ? 'partenaire' : 'client';
  notify(STAFF_EMAIL, notificationEmail({ subject: `[TripVision] ${fresh ? 'Nouvelle conversation' : 'Nouveau message'} — ${thread.partner_name}`, title: fresh ? 'Nouvelle conversation' : 'Nouveau message', intro: `${mailText(thread.partner_name)} (${who}) vous a écrit dans la messagerie.`, buttonLabel: 'Ouvrir la messagerie', url: staffLink('chats') }));
  pushNotification('staff', { kind: 'chat', title: fresh ? 'Nouvelle conversation' : 'Nouveau message', body: `${thread.partner_name} (${who}) · ${thread.subject}`, link: 'chats' });
}

app.get('/api/chat/threads', auth(...CHAT_ROLES), h(async (req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.subject, t.status, t.created_at, t.updated_at, t.closed_at, t.auto_closed, t.rating, t.unread_partner AS unread,
            (SELECT COALESCE(NULLIF(m.body, ''), CASE WHEN jsonb_array_length(COALESCE(m.attachments, '[]'::jsonb)) > 0 THEN '📎 ' || (m.attachments->0->>'name') ELSE '' END) FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN ('system', 'note') ORDER BY m.created_at DESC LIMIT 1) AS last_message
     FROM chat_threads t WHERE t.partner_user_id = $1 ORDER BY (t.status <> 'closed') DESC, t.updated_at DESC LIMIT 100`, [req.user.id]);
  res.json(rows);
}));
app.post('/api/chat/threads', auth(...CHAT_ROLES), h(async (req, res) => {
  const b = newThreadSchema.parse(req.body);
  const { rows: open } = await query(`SELECT count(*)::int AS n FROM chat_threads WHERE partner_user_id = $1 AND status <> 'closed'`, [req.user.id]);
  if (open[0].n >= MAX_OPEN_THREADS) return res.status(409).json({ error: 'TOO_MANY_THREADS', message: `Vous avez déjà ${MAX_OPEN_THREADS} conversations ouvertes. Poursuivez-en une ou attendez sa clôture.` });
  const who = await chatIdentity(req.user);
  const { rows } = await query('INSERT INTO chat_threads(partner_user_id, partner_name, partner_email, kind, subject) VALUES ($1,$2,$3,$4,$5) RETURNING *', [req.user.id, who.name, who.email, req.user.role, b.subject]);
  const thread = rows[0];
  await query("INSERT INTO chat_messages(thread_id, sender, body, author, attachments) VALUES ($1,'partner',$2,$3,$4)", [thread.id, b.message, who.name, JSON.stringify(b.attachments || [])]);
  await query('UPDATE chat_threads SET unread_admin = 1 WHERE id = $1', [thread.id]);
  alertStaffOfMessage(thread, req.user, true);
  res.status(201).json({ id: thread.id });
}));
app.get('/api/chat/threads/:id', auth(...CHAT_ROLES), h(async (req, res) => {
  const t = await ownThread(req.user, req.params.id);
  if (!t) return res.status(404).json({ error: 'NOT_FOUND' });
  await query('UPDATE chat_threads SET unread_partner = 0 WHERE id = $1', [t.id]);
  res.json({ thread: chatThreadInfo(t), messages: await chatMessages(t.id) });
}));
app.post('/api/chat/threads/:id/messages', auth(...CHAT_ROLES), h(async (req, res) => {
  const { message: text, attachments } = chatMessageSchema.parse(req.body);
  const t = await ownThread(req.user, req.params.id);
  if (!t) return res.status(404).json({ error: 'NOT_FOUND' });
  if (t.status === 'closed') return res.status(409).json({ error: 'THREAD_CLOSED', message: 'Cette conversation est clôturée. Démarrez-en une nouvelle si besoin.' });
  const { rows } = await query("INSERT INTO chat_messages(thread_id, sender, body, author, attachments) VALUES ($1,'partner',$2,$3,$4) RETURNING id, sender, body, created_at, author, attachments", [t.id, text, t.partner_name, JSON.stringify(attachments)]);
  // Le client a répondu : la conversation repasse à « ouverte » (l'équipe doit répondre).
  await query("UPDATE chat_threads SET unread_admin = unread_admin + 1, status = 'open', updated_at = now() WHERE id = $1", [t.id]);
  alertStaffOfMessage(t, req.user, false);
  res.status(201).json({ message: rows[0] });
}));
// Note de satisfaction, donnée une seule fois après la clôture.
app.post('/api/chat/threads/:id/rating', auth(...CHAT_ROLES), h(async (req, res) => {
  const b = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(500).optional() }).parse(req.body);
  const t = await ownThread(req.user, req.params.id);
  if (!t) return res.status(404).json({ error: 'NOT_FOUND' });
  if (t.status !== 'closed') return res.status(409).json({ error: 'NOT_CLOSED', message: 'Vous pourrez noter la conversation une fois clôturée.' });
  if (t.rating) return res.status(409).json({ error: 'ALREADY_RATED', message: 'Merci, vous avez déjà donné votre avis.' });
  await query('UPDATE chat_threads SET rating = $2, rating_comment = $3 WHERE id = $1', [t.id, b.rating, b.comment || null]);
  pushNotification('staff', { kind: 'chat', title: `Avis reçu : ${b.rating}/5`, body: `${t.partner_name} · ${t.subject}`, link: 'chats' });
  res.json({ ok: true });
}));

// ---------- Tendances : ce que les visiteurs consultent, cliquent, cherchent et réservent ----------
const TRACK_KINDS = ['dest_view', 'flight_click', 'pack_view', 'car_view', 'search_flight', 'search_car', 'search_pack'];
const TRACK_WEIGHT = { dest_view: 1, pack_view: 1, car_view: 1, search_flight: 2, search_car: 2, search_pack: 2, flight_click: 4 };
const BOOKING_WEIGHT = 10;
const trackSeen = new Map();
const trackSchema = z.object({
  kind: z.enum(TRACK_KINDS), key: z.string().trim().min(1).max(120),
  city: z.string().trim().max(80).optional(), country: z.string().trim().max(80).optional(), label: z.string().trim().max(160).optional(),
});
setInterval(() => { const cut = Date.now() - 31 * 60 * 1000; for (const [k, t] of trackSeen) if (t < cut) trackSeen.delete(k); }, 10 * 60 * 1000);
app.post('/api/public/track', h(async (req, res) => {
  const t = trackSchema.safeParse(req.body);
  if (!t.success) return res.status(204).end();
  const ip = clientIp(req);
  const minute = `m|${ip}|${Math.floor(Date.now() / 60000)}`;
  trackSeen.set(minute, (trackSeen.get(minute) || 0) + 1);
  if (trackSeen.get(minute) > 60) return res.status(204).end();
  // Un même visiteur n'est compté qu'une fois par page toutes les 30 minutes.
  const k = `${ip}|${t.data.kind}|${t.data.key}`;
  if (Date.now() - (trackSeen.get(k) || 0) < 30 * 60 * 1000) return res.status(204).end();
  trackSeen.set(k, Date.now());
  const d = t.data;
  await query('INSERT INTO site_events(kind, key, city, country, label) VALUES ($1,$2,$3,$4,$5)', [d.kind, d.key, d.city || null, d.country || null, d.label || null]);
  res.status(204).end();
}));

const periodRange = (period) => {
  const now = new Date(), to = new Date(now.getTime() + 60000);
  if (period === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), to];
  const days = period === '90d' ? 90 : period === '12m' ? 365 : 30;
  return [new Date(now.getTime() - days * 86400000), to];
};
const bump = (map, key, base, field, n, w) => {
  if (!key) return;
  const o = map.get(key) || { ...base, views: 0, clicks: 0, searches: 0, bookings: 0, score: 0 };
  o[field] += n; o.score += n * w;
  map.set(key, o);
};
const top = (map, n = 10) => [...map.values()].sort((a, b) => b.score - a.score || b.bookings - a.bookings).slice(0, n);
async function trendsData(from, to) {
  const [{ rows: ev }, { rows: bk }, { rows: rq }, { rows: daily }] = await Promise.all([
    query('SELECT kind, key, city, country, max(label) AS label, count(*)::int AS n FROM site_events WHERE created_at >= $1 AND created_at < $2 GROUP BY kind, key, city, country', [from, to]),
    query(`SELECT v.id, v.model, COALESCE(NULLIF(v.details->>'city', ''), v.pickup_address) AS city, COALESCE(v.details->>'country', '') AS country, count(*)::int AS n FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.payment_status NOT IN ('awaiting', 'failed') AND b.status <> 'inactive' AND b.created_at >= $1 AND b.created_at < $2 GROUP BY v.id, v.model, 3, 4`, [from, to]),
    query(`SELECT r.offer_type, o.id AS offer_id, o.title, o.from_city, o.to_city, o.country, count(*)::int AS n FROM offer_requests r JOIN offers o ON o.id = r.offer_id WHERE r.payment_status NOT IN ('awaiting', 'failed') AND r.status <> 'cancelled' AND r.created_at >= $1 AND r.created_at < $2 GROUP BY r.offer_type, o.id, o.title, o.from_city, o.to_city, o.country`, [from, to]),
    query(`SELECT date_trunc('day', created_at)::date AS d, count(*)::int AS n FROM site_events WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1`, [from, to]),
  ]);
  const countries = new Map(), cities = new Map(), flights = new Map(), packs = new Map(), cars = new Map(), carCities = new Map();
  const totals = { views: 0, clicks: 0, searches: 0, bookings: 0 };
  const field = (kind) => (kind === 'flight_click' ? 'clicks' : kind.startsWith('search') ? 'searches' : 'views');
  for (const e of ev) {
    const f = field(e.kind), w = TRACK_WEIGHT[e.kind];
    totals[f] += e.n;
    if (e.kind === 'car_view' || e.kind === 'search_car') { bump(carCities, e.city, { city: e.city, country: e.country }, f, e.n, w); if (e.kind === 'car_view') bump(cars, e.key, { id: e.key, label: e.label, city: e.city }, f, e.n, w); continue; }
    bump(countries, e.country, { country: e.country }, f, e.n, w);
    bump(cities, e.city, { city: e.city, country: e.country }, f, e.n, w);
    if (e.kind === 'flight_click') bump(flights, e.key, { id: e.key, label: e.label, city: e.city, country: e.country }, f, e.n, w);
    if (e.kind === 'pack_view') bump(packs, e.key, { id: e.key, label: e.label, city: e.city, country: e.country }, f, e.n, w);
  }
  for (const b of bk) {
    totals.bookings += b.n;
    bump(cars, String(b.id), { id: String(b.id), label: b.model, city: b.city }, 'bookings', b.n, BOOKING_WEIGHT);
    bump(carCities, b.city, { city: b.city, country: b.country }, 'bookings', b.n, BOOKING_WEIGHT);
  }
  for (const r of rq) {
    totals.bookings += r.n;
    bump(countries, r.country, { country: r.country }, 'bookings', r.n, BOOKING_WEIGHT);
    bump(cities, r.to_city, { city: r.to_city, country: r.country }, 'bookings', r.n, BOOKING_WEIGHT);
    bump(r.offer_type === 'pack' ? packs : flights, String(r.offer_id), { id: String(r.offer_id), label: r.title, city: r.to_city, country: r.country }, 'bookings', r.n, BOOKING_WEIGHT);
  }
  return { totals, countries: top(countries), cities: top(cities), flights: top(flights), packs: top(packs), cars: top(cars), carCities: top(carCities), daily: daily.map((x) => ({ d: x.d, n: x.n })) };
}
app.get('/api/admin/trends', auth(...BACKOFFICE_ROLES), can('trends.view'), h(async (req, res) => {
  const period = ['month', '30d', '90d', '12m'].includes(req.query.period) ? req.query.period : '30d';
  const [from, to] = periodRange(period);
  res.json({ period, from, to, ...(await trendsData(from, to)) });
}));

// Mise en avant automatique sur le site public : recalculée sur les 30 derniers jours (mise en cache 10 minutes).
let trendingCache = { at: 0, data: null };
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
app.get('/api/public/trending', h(async (_req, res) => {
  if (trendingCache.data && Date.now() - trendingCache.at < 10 * 60 * 1000) return res.json(trendingCache.data);
  const [from, to] = periodRange('30d');
  const t = await trendsData(from, to);
  const activity = t.totals.views + t.totals.clicks + t.totals.searches + t.totals.bookings;
  let cities = t.cities.filter((c) => c.city).slice(0, 6).map((c, i) => ({ city: c.city, country: c.country, score: c.score, rank: i + 1 }));
  let estimated = false;
  if (cities.length < 4) {
    // Pas encore assez de visites : on met à la une les destinations qui comptent le plus d'offres publiées.
    estimated = true;
    const { rows } = await query(`SELECT to_city AS city, max(country) AS country, count(*)::int AS n FROM offers WHERE status = 'active' AND deleted_at IS NULL AND to_city IS NOT NULL GROUP BY to_city ORDER BY n DESC, to_city LIMIT 6`);
    cities = rows.map((r, i) => ({ city: r.city, country: r.country, score: r.n, rank: i + 1 }));
  }
  const data = {
    month: `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`, monthName: MONTHS[new Date().getMonth()], estimated, activity,
    cities, flights: t.flights.slice(0, 4).map((x) => x.id), packs: t.packs.slice(0, 3).map((x) => x.id), cars: t.cars.slice(0, 4).map((x) => x.id), countries: t.countries.slice(0, 5).map((c) => c.country),
  };
  trendingCache = { at: Date.now(), data };
  res.json(data);
}));

// ---------- Notifications (équipe, partenaire, client) ----------
const notifScope = (user) => (BACKOFFICE_ROLES.includes(user.role) ? { where: "audience = 'staff'", params: [] } : { where: "audience = 'user' AND user_id = $1", params: [user.id] });
app.get('/api/notifications', auth(), h(async (req, res) => {
  const sc = notifScope(req.user);
  const { rows } = await query(`SELECT id, kind, title, body, link, ref_id, created_at, read_at FROM notifications WHERE ${sc.where} ORDER BY created_at DESC LIMIT 300`, sc.params);
  res.json(rows);
}));
app.post('/api/notifications/read-all', auth(), h(async (req, res) => {
  const sc = notifScope(req.user);
  await query(`UPDATE notifications SET read_at = now(), read_by = $${sc.params.length + 1} WHERE ${sc.where} AND read_at IS NULL`, [...sc.params, req.user.id]);
  res.json({ ok: true });
}));
app.post('/api/notifications/:id/read', auth(), h(async (req, res) => {
  const sc = notifScope(req.user);
  await query(`UPDATE notifications SET read_at = COALESCE(read_at, now()), read_by = $${sc.params.length + 2} WHERE id = $${sc.params.length + 1} AND ${sc.where}`, [...sc.params, req.params.id, req.user.id]);
  res.json({ ok: true });
}));
const unreadNotifications = async (user) => {
  const sc = notifScope(user);
  return (await query(`SELECT count(*)::int AS n FROM notifications WHERE ${sc.where} AND read_at IS NULL`, sc.params)).rows[0].n;
};

// Pastilles de notification de l'espace partenaire / client.
app.get('/api/me/badges', auth(...CHAT_ROLES), h(async (req, res) => {
  const { rows: chat } = await query('SELECT COALESCE(sum(unread_partner), 0)::int AS n FROM chat_threads WHERE partner_user_id = $1', [req.user.id]);
  let bookings = 0;
  if (req.user.role === 'partner') {
    const { rows } = await query(
      `SELECT count(*)::int AS n FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id JOIN partners p ON p.id = v.partner_id WHERE p.user_id = $1 AND b.partner_seen_at IS NULL AND b.payment_status NOT IN ('awaiting', 'failed')`, [req.user.id]);
    bookings = rows[0].n;
  } else {
    const { rows } = await query(
      `SELECT (SELECT count(*) FROM bookings WHERE lower(customer_email) = lower($1) AND status_changed_at IS NOT NULL AND (client_seen_at IS NULL OR client_seen_at < status_changed_at))
            + (SELECT count(*) FROM offer_requests WHERE lower(customer_email) = lower($1) AND payment_status NOT IN ('awaiting', 'failed') AND status_changed_at IS NOT NULL AND (client_seen_at IS NULL OR client_seen_at < status_changed_at)) AS n`, [req.user.email]);
    bookings = Number(rows[0].n);
  }
  res.json({ chat: chat[0].n, bookings, notifications: await unreadNotifications(req.user) });
}));

app.post('/api/partner/bookings/:id/seen', auth('partner'), h(async (req, res) => {
  await query(
    `UPDATE bookings b SET partner_seen_at = COALESCE(b.partner_seen_at, now()) FROM vehicles v JOIN partners p ON p.id = v.partner_id
     WHERE b.id = $1 AND v.id = b.vehicle_id AND p.user_id = $2`, [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

app.post('/api/client/orders/:kind/:id/seen', auth('client'), h(async (req, res) => {
  const table = req.params.kind === 'requests' ? 'offer_requests' : req.params.kind === 'bookings' ? 'bookings' : null;
  if (!table) return res.status(404).json({ error: 'NOT_FOUND' });
  await query(`UPDATE ${table} SET client_seen_at = now() WHERE id = $1 AND lower(customer_email) = lower($2)`, [req.params.id, req.user.email]);
  res.json({ ok: true });
}));

app.post('/api/admin/bookings/:id/seen', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  await query('UPDATE bookings SET staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));
app.post('/api/admin/offer-requests/:id/seen', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  await query('UPDATE offer_requests SET staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

const CHAT_AUTO_CLOSE_DAYS = 7;
app.get('/api/admin/chats', auth(...BACKOFFICE_ROLES), canChat, h(async (_req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.subject, t.status, t.partner_name, t.partner_email, t.kind, t.created_at, t.updated_at, t.closed_at, t.closed_by, t.auto_closed, t.unread_admin AS unread,
            t.assigned_to, t.assigned_name, t.first_response_at, t.rating,
            (SELECT count(*)::int FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN ('system', 'note')) AS messages,
            (SELECT COALESCE(NULLIF(m.body, ''), CASE WHEN jsonb_array_length(COALESCE(m.attachments, '[]'::jsonb)) > 0 THEN '📎 ' || (m.attachments->0->>'name') ELSE '' END) FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN ('system', 'note') ORDER BY m.created_at DESC LIMIT 1) AS last_message,
            (SELECT sender FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN ('system', 'note') ORDER BY m.created_at DESC LIMIT 1) AS last_sender
     FROM chat_threads t ORDER BY (t.status <> 'closed') DESC, (t.status = 'open') DESC, t.updated_at DESC LIMIT 400`
  );
  res.json(rows);
}));

// Chiffres de la messagerie : délai de première réponse, satisfaction, volumes.
app.get('/api/admin/chats-stats', auth(...BACKOFFICE_ROLES), canChat, h(async (_req, res) => {
  const { rows } = await query(`SELECT
      count(*) FILTER (WHERE status = 'open')::int AS open, count(*) FILTER (WHERE status = 'pending')::int AS pending, count(*) FILTER (WHERE status = 'closed')::int AS closed,
      count(*) FILTER (WHERE status <> 'closed' AND assigned_to IS NULL)::int AS unassigned,
      round(avg(extract(epoch FROM (first_response_at - created_at)) / 60) FILTER (WHERE first_response_at IS NOT NULL AND created_at >= now() - interval '30 days'))::int AS first_response_min,
      round(avg(rating)::numeric, 1) AS rating, count(rating)::int AS rated
    FROM chat_threads`);
  const r = rows[0];
  res.json({ ...r, rating: r.rating == null ? null : Number(r.rating), autoCloseDays: CHAT_AUTO_CLOSE_DAYS });
}));

app.get('/api/admin/chats/:id', auth(...BACKOFFICE_ROLES), canChat, h(async (req, res) => {
  const { rows } = await query('SELECT * FROM chat_threads WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await query('UPDATE chat_threads SET unread_admin = 0 WHERE id = $1', [rows[0].id]);
  res.json({ thread: chatThreadInfo(rows[0]), messages: await chatMessages(rows[0].id, true), canManage: hasPermission(req.user, 'chats.manage'), me: req.user.id });
}));

app.post('/api/admin/chats/:id/messages', auth(...BACKOFFICE_ROLES), canChat, h(async (req, res) => {
  const { message: text, attachments } = chatMessageSchema.parse(req.body);
  const { rows } = await query('SELECT * FROM chat_threads WHERE id = $1', [req.params.id]);
  const thread = rows[0];
  if (!thread) return res.status(404).json({ error: 'NOT_FOUND' });
  if (thread.status === 'closed') return res.status(409).json({ error: 'THREAD_CLOSED', message: 'Cette conversation est clôturée : rouvrez-la pour répondre.' });
  const { rows: msgRows } = await query("INSERT INTO chat_messages(thread_id, sender, body, author, attachments) VALUES ($1,'admin',$2,$3,$4) RETURNING id, sender, body, created_at, author, attachments", [thread.id, text, req.user.name || 'TripVision', JSON.stringify(attachments)]);
  // Réponse de l'équipe : la conversation attend désormais le client ; la première réponse fixe le délai de réponse et prend la conversation en charge.
  await query(`UPDATE chat_threads SET unread_partner = unread_partner + 1, status = 'pending', updated_at = now(),
                 first_response_at = COALESCE(first_response_at, now()),
                 assigned_to = COALESCE(assigned_to, $2), assigned_name = COALESCE(assigned_name, $3)
               WHERE id = $1`, [thread.id, req.user.id, req.user.name || req.user.email]);
  pushNotification(thread.partner_user_id, { kind: 'chat', title: 'Vous avez une réponse', body: 'L’équipe TripVision a répondu à votre message.', link: 'chat' });
  const mail = await sendMail({ to: thread.partner_email, ...notificationEmail({ subject: '[TripVision] Vous avez une réponse', title: 'Vous avez une réponse', intro: 'L’équipe TripVision a répondu à votre message. Connectez-vous à votre espace pour le lire et poursuivre la conversation.', buttonLabel: 'Ouvrir ma messagerie', url: espaceLink('chat') }) });
  res.status(201).json({ message: msgRows[0], notified: mail.sent });
}));

// Notes internes : visibles uniquement par l'équipe.
app.post('/api/admin/chats/:id/notes', auth(...BACKOFFICE_ROLES), canChat, h(async (req, res) => {
  const { message: text } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body);
  const { rows } = await query('SELECT id FROM chat_threads WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  const { rows: m } = await query("INSERT INTO chat_messages(thread_id, sender, body, author) VALUES ($1,'note',$2,$3) RETURNING id, sender, body, created_at, author, attachments", [req.params.id, text, req.user.name || 'Équipe']);
  res.status(201).json({ message: m[0] });
}));

// Attribution : chacun peut prendre une conversation en charge ; confier ou retirer à quelqu'un d'autre demande le droit « Messagerie ».
app.get('/api/admin/chat-staff', auth(...BACKOFFICE_ROLES), canChat, h(async (_req, res) => {
  const { rows } = await query("SELECT id, name, role FROM users WHERE role IN ('it','admin','manager') AND active AND deleted_at IS NULL ORDER BY name");
  res.json(rows);
}));
app.post('/api/admin/chats/:id/assign', auth(...BACKOFFICE_ROLES), canChat, h(async (req, res) => {
  const { to } = z.object({ to: z.string().uuid().nullable() }).parse(req.body);
  const { rows } = await query('SELECT * FROM chat_threads WHERE id = $1', [req.params.id]);
  const t = rows[0];
  if (!t) return res.status(404).json({ error: 'NOT_FOUND' });
  if (to !== req.user.id && !hasPermission(req.user, 'chats.manage')) return res.status(403).json({ error: 'PERMISSION_DENIED' });
  let name = null;
  if (to) {
    const { rows: u } = await query("SELECT name, email FROM users WHERE id = $1 AND role IN ('it','admin','manager') AND active AND deleted_at IS NULL", [to]);
    if (!u[0]) return res.status(404).json({ error: 'NOT_FOUND' });
    name = u[0].name || u[0].email;
  }
  await query('UPDATE chat_threads SET assigned_to = $2, assigned_name = $3 WHERE id = $1', [t.id, to, name]);
  await query("INSERT INTO chat_messages(thread_id, sender, body, author) VALUES ($1,'note',$2,$3)", [t.id, to ? (to === req.user.id ? 'Conversation prise en charge.' : `Conversation confiée à ${name}.`) : 'Conversation remise à disposition de l’équipe.', req.user.name || 'Équipe']);
  res.json({ ok: true, assigned_to: to, assigned_name: name });
}));

// Réponses types, partagées par l'équipe.
app.get('/api/admin/chat-canned', auth(...BACKOFFICE_ROLES), canChat, h(async (_req, res) => {
  res.json((await query('SELECT id, title, body FROM chat_canned ORDER BY created_at')).rows);
}));
app.post('/api/admin/chat-canned', auth(...BACKOFFICE_ROLES), can('chats.manage'), h(async (req, res) => {
  const b = z.object({ title: z.string().trim().min(2).max(60), body: z.string().trim().min(2).max(2000) }).parse(req.body);
  const { rows } = await query('INSERT INTO chat_canned(title, body, created_by) VALUES ($1,$2,$3) RETURNING id, title, body', [b.title, b.body, req.user.name || req.user.email]);
  res.status(201).json(rows[0]);
}));
app.delete('/api/admin/chat-canned/:id', auth(...BACKOFFICE_ROLES), can('chats.manage'), h(async (req, res) => {
  await query('DELETE FROM chat_canned WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// Clôturer / rouvrir une conversation : réservé à l'IT et aux managers ou agents qui en ont reçu le droit.
async function setThreadStatus(req, res, status) {
  const { rows } = await query('SELECT * FROM chat_threads WHERE id = $1', [req.params.id]);
  const t = rows[0];
  if (!t) return res.status(404).json({ error: 'NOT_FOUND' });
  if (t.status === status) return res.json({ ok: true, status });
  const closing = status === 'closed';
  await query(`UPDATE chat_threads SET status = $2, closed_at = ${closing ? 'now()' : 'NULL'}, closed_by = ${closing ? '$3' : 'NULL'}, auto_closed = false, updated_at = now(), unread_partner = unread_partner + 1 WHERE id = $1`, closing ? [t.id, status, req.user.name || req.user.email] : [t.id, status]);
  await query("INSERT INTO chat_messages(thread_id, sender, body) VALUES ($1,'system',$2)", [t.id, closing ? 'Conversation clôturée par TripVision.' : 'Conversation rouverte par TripVision.']);
  pushNotification(t.partner_user_id, { kind: 'chat', title: closing ? 'Conversation clôturée' : 'Conversation rouverte', body: closing ? `${t.subject} · donnez-nous votre avis` : t.subject, link: 'chat' });
  await audit(req.user.id, closing ? 'chat_closed' : 'chat_reopened', 'chat_thread', t.id, clientIp(req));
  res.json({ ok: true, status });
}
app.post('/api/admin/chats/:id/close', auth(...BACKOFFICE_ROLES), can('chats.manage'), h((req, res) => setThreadStatus(req, res, 'closed')));
app.post('/api/admin/chats/:id/reopen', auth(...BACKOFFICE_ROLES), can('chats.manage'), h((req, res) => setThreadStatus(req, res, 'open')));

// Clôture automatique : une conversation qui attend le client depuis 7 jours sans réponse est clôturée.
async function autoCloseChats() {
  const { rows } = await query(`UPDATE chat_threads SET status = 'closed', closed_at = now(), closed_by = 'Automatique', auto_closed = true, updated_at = now(), unread_partner = unread_partner + 1
    WHERE status = 'pending' AND updated_at < now() - ($1 || ' days')::interval RETURNING id, partner_user_id, subject`, [String(CHAT_AUTO_CLOSE_DAYS)]);
  for (const t of rows) {
    await query("INSERT INTO chat_messages(thread_id, sender, body) VALUES ($1,'system',$2)", [t.id, `Conversation clôturée automatiquement après ${CHAT_AUTO_CLOSE_DAYS} jours sans réponse. Vous pouvez en démarrer une nouvelle à tout moment.`]);
    pushNotification(t.partner_user_id, { kind: 'chat', title: 'Conversation clôturée', body: `${t.subject} · sans réponse depuis ${CHAT_AUTO_CLOSE_DAYS} jours`, link: 'chat' });
  }
}
setInterval(() => autoCloseChats().catch((e) => console.error('Clôture automatique :', e.message)), 60 * 60 * 1000);
setTimeout(() => autoCloseChats().catch(() => {}), 45000);

// ---------- Messages de contact ----------
app.get('/api/admin/messages', auth(...BACKOFFICE_ROLES), h(async (_req, res) => {
  const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 300');
  res.json(rows);
}));

app.patch('/api/admin/messages/:id', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  const { handled } = z.object({ handled: z.boolean() }).parse(req.body);
  const { rows } = await query('UPDATE contact_messages SET handled_at = $1 WHERE id = $2 RETURNING *', [handled ? new Date() : null, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, handled ? 'message_handled' : 'message_reopened', 'message', req.params.id, clientIp(req));
  res.json(rows[0]);
}));

// ---------- Partenaires ----------
app.post('/api/admin/partners', auth(...BACKOFFICE_ROLES), can('partners.manage'), h(async (req, res) => {
  const p = adminPartnerSchema.parse(req.body);
  const email = p.loginEmail.toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
  const passwordHash = await unusablePasswordHash();
  const { rows: userRows } = await query(
    "INSERT INTO users(email, name, role, password_hash, must_change_password, created_by) VALUES ($1,$2,'partner',$3,true,$4) RETURNING *",
    [email, p.managerName, passwordHash, req.user.id]
  );
  const user = userRows[0];
  const { rows: partnerRows } = await query(
    `INSERT INTO partners(user_id, status, legal_name, trade_name, head_office, agencies, siret, booking_email, contact_email, manager_name, kbis_name, login_id, phone, city)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [user.id, p.status, p.legalName, p.tradeName, p.headOffice, p.agencies, p.siret, p.bookingEmail, p.contactEmail, p.managerName, p.kbisName || null, p.loginId || null, p.phone || null, p.city || null]
  );
  await audit(req.user.id, 'create_partner', 'partner', partnerRows[0].id, clientIp(req));
  const access = await sendAccessLink(user, 'invite', { invitedBy: req.user.name });
  res.status(201).json({ partner: mapPartner(partnerRows[0]), loginEmail: email, ...access });
}));

app.patch('/api/admin/partners/:id/status', auth(...BACKOFFICE_ROLES), can('partners.manage'), h(async (req, res) => {
  const { status } = statusSchema(['pending', 'approved', 'inactive']).parse(req.body);
  const { rows } = await query('UPDATE partners SET status = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL RETURNING *', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  await audit(req.user.id, `partner_${status}`, 'partner', req.params.id, clientIp(req));
  res.json(mapPartner(rows[0]));
}));

app.delete('/api/admin/partners/:id', auth(...BACKOFFICE_ROLES), can('partners.delete'), h(async (req, res) => {
  const { rows } = await query("UPDATE partners SET deleted_at = now(), status = 'inactive', updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING user_id", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  if (rows[0].user_id) await query('UPDATE users SET active = false, updated_at = now() WHERE id = $1', [rows[0].user_id]);
  await audit(req.user.id, 'delete_partner', 'partner', req.params.id, clientIp(req));
  res.json({ ok: true });
}));

// ---------- Comptes internes ----------
const ACCOUNT_COLUMNS = 'id, email, name, role, active, permissions, last_login_at, created_at, reset_requested_at';
const hasAnyAccountPermission = (u) => ['accounts.create', 'accounts.edit', 'accounts.delete'].some(k => hasPermission(u, k));

function accountRights(actor, target) {
  const manageable = target.id !== actor.id && canManageRole(actor.role, target.role);
  return { edit: manageable && hasPermission(actor, 'accounts.edit'), delete: manageable && hasPermission(actor, 'accounts.delete') };
}

// Personne ne peut donner plus de droits qu'il n'en a.
function checkGrantable(actor, permissions, res) {
  const clean = sanitizePermissions(permissions);
  if (Object.keys(clean).some(k => !hasPermission(actor, k))) { res.status(403).json({ error: 'PERMISSION_ESCALATION' }); return null; }
  return clean;
}

async function loadAccount(req, res, right) {
  const { rows } = await query(`SELECT ${ACCOUNT_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL AND role IN ('it','admin','manager')`, [req.params.id]);
  const target = rows[0];
  if (!target) { res.status(404).json({ error: 'NOT_FOUND' }); return null; }
  if (target.id === req.user.id) { res.status(403).json({ error: 'SELF_ACTION' }); return null; }
  if (!accountRights(req.user, target)[right]) { res.status(403).json({ error: 'ROLE_NOT_ALLOWED' }); return null; }
  return target;
}

// ---------- Catégories de véhicules ----------
const categorySchema = z.object({ name: z.string().trim().min(2).max(60), image: z.string().max(500).nullable().optional(), position: z.coerce.number().int().min(0).max(999).optional(), active: z.boolean().optional() });
const mapCategory = (c) => ({ id: c.id, name: c.name, image: absImage(c.image) || null, position: c.position, active: c.active });
app.get('/api/public/categories', h(async (_req, res) => {
  const { rows } = await query('SELECT * FROM vehicle_categories WHERE active ORDER BY position, name');
  res.json(rows.map(mapCategory));
}));
app.get('/api/admin/categories', auth(...BACKOFFICE_ROLES), can('categories.manage'), h(async (_req, res) => {
  const { rows } = await query('SELECT c.*, (SELECT count(*)::int FROM vehicles v WHERE v.deleted_at IS NULL AND lower(v.category) = lower(c.name)) AS vehicles FROM vehicle_categories c ORDER BY position, name');
  res.json(rows.map(c => ({ ...mapCategory(c), vehicles: c.vehicles })));
}));
app.post('/api/admin/categories', auth(...BACKOFFICE_ROLES), can('categories.manage'), h(async (req, res) => {
  const b = categorySchema.parse(req.body);
  const { rows: dup } = await query('SELECT 1 FROM vehicle_categories WHERE lower(name) = lower($1)', [b.name]);
  if (dup.length) return res.status(409).json({ error: 'EXISTS', message: 'Cette catégorie existe déjà.' });
  const { rows } = await query('INSERT INTO vehicle_categories(name, image, position, active) VALUES ($1,$2,$3,$4) RETURNING *', [b.name, normalizeImage(b.image) || null, b.position ?? 50, b.active ?? true]);
  await audit(req.user.id, 'create_category', 'category', rows[0].id, clientIp(req));
  loadCategoryImages();
  res.status(201).json(mapCategory(rows[0]));
}));
app.patch('/api/admin/categories/:id', auth(...BACKOFFICE_ROLES), can('categories.manage'), h(async (req, res) => {
  const b = categorySchema.parse(req.body);
  const { rows: old } = await query('SELECT * FROM vehicle_categories WHERE id = $1', [req.params.id]);
  if (!old[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  const { rows: dup } = await query('SELECT 1 FROM vehicle_categories WHERE lower(name) = lower($1) AND id <> $2', [b.name, req.params.id]);
  if (dup.length) return res.status(409).json({ error: 'EXISTS', message: 'Cette catégorie existe déjà.' });
  const { rows } = await query('UPDATE vehicle_categories SET name = $1, image = $2, position = COALESCE($3, position), active = COALESCE($4, active) WHERE id = $5 RETURNING *', [b.name, normalizeImage(b.image) || null, b.position ?? null, b.active ?? null, req.params.id]);
  if (old[0].name !== b.name) await query('UPDATE vehicles SET category = $1 WHERE lower(category) = lower($2)', [b.name, old[0].name]);
  await audit(req.user.id, 'update_category', 'category', req.params.id, clientIp(req));
  loadCategoryImages();
  res.json(mapCategory(rows[0]));
}));
app.delete('/api/admin/categories/:id', auth(...BACKOFFICE_ROLES), can('categories.manage'), h(async (req, res) => {
  const { rows: c } = await query('SELECT name FROM vehicle_categories WHERE id = $1', [req.params.id]);
  if (!c[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  const { rows: used } = await query('SELECT count(*)::int AS n FROM vehicles WHERE deleted_at IS NULL AND lower(category) = lower($1)', [c[0].name]);
  if (used[0].n) return res.status(409).json({ error: 'IN_USE', message: `${used[0].n} annonce(s) utilisent cette catégorie : changez-les d’abord, ou désactivez la catégorie.` });
  await query('DELETE FROM vehicle_categories WHERE id = $1', [req.params.id]);
  await audit(req.user.id, 'delete_category', 'category', req.params.id, clientIp(req));
  loadCategoryImages();
  res.json({ ok: true });
}));

// ---------- Mailing ----------
const mailingWhere = (q) => {
  const where = [], params = [];
  if (q.source) { params.push(String(q.source)); where.push(`$${params.length} = ANY(sources)`); }
  const consent = q.consent === 'all' ? 'all' : q.consent === 'no' ? 'no' : 'yes';
  if (consent === 'yes') where.push('consent AND unsubscribed_at IS NULL'); else if (consent === 'no') where.push('NOT consent');
  if (q.q) { params.push(`%${String(q.q).toLowerCase()}%`); where.push(`(lower(email) LIKE $${params.length} OR lower(coalesce(name, '')) LIKE $${params.length})`); }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
};
app.get('/api/admin/mailing', auth(...BACKOFFICE_ROLES), can('mailing.export'), h(async (_req, res) => {
  const { rows } = await query('SELECT id, email, name, phone, sources, consent, unsubscribed_at, requests_count, created_at, last_seen_at FROM contacts ORDER BY last_seen_at DESC LIMIT 20000');
  const { rows: st } = await query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE consent AND unsubscribed_at IS NULL)::int AS consent, count(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::int AS unsubscribed FROM contacts`);
  res.json({ contacts: rows, stats: st[0] });
}));
const SOURCE_LABELS = { vol: 'Vol' };
app.get('/api/admin/mailing/export', auth(...BACKOFFICE_ROLES), can('mailing.export'), h(async (req, res) => {
  const w = mailingWhere(req.query);
  const { rows } = await query(`SELECT * FROM contacts ${w.sql} ORDER BY last_seen_at DESC`, w.params);
  const fmtD = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');
  const header = ['E-mail', 'Nom', 'Téléphone', 'Origine', 'Accord marketing', 'Désinscrit', 'Première activité', 'Dernière activité', 'Demandes', 'Lien de désinscription'];
  const table = rows.map(c => [c.email, c.name || '', c.phone || '', c.sources.map(x => SOURCE_LABELS[x] || x).join(', '), c.consent ? 'Oui' : 'Non', c.unsubscribed_at ? 'Oui' : 'Non', fmtD(c.created_at), fmtD(c.last_seen_at), c.requests_count, `${APP_URL}/unsubscribe?t=${c.unsub_token}`]);
  await audit(req.user.id, 'export_contacts', 'contacts', null, clientIp(req));
  const stamp = new Date().toISOString().slice(0, 10);
  if (req.query.format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Contacts');
    ws.addRow(header).font = { bold: true };
    table.forEach(r => ws.addRow(r));
    ws.columns = [32, 24, 18, 22, 16, 12, 18, 18, 10, 48].map(width => ({ width }));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="tripvision-contacts-${stamp}.xlsx"` });
    return res.send(Buffer.from(await wb.xlsx.writeBuffer()));
  }
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [header, ...table].map(r => r.map(esc).join(';')).join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="tripvision-contacts-${stamp}.csv"` });
  res.send(csv);
}));
app.get('/unsubscribe', h(async (req, res) => {
  const { rowCount } = await query('UPDATE contacts SET consent = false, unsubscribed_at = now() WHERE unsub_token = $1', [String(req.query.t || '').slice(0, 64)]);
  res.set('Content-Type', 'text/html; charset=utf-8').status(rowCount ? 200 : 404).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription</title><body style="font-family:Arial,sans-serif;background:#f8f5ef;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:440px;background:#fff;padding:40px;border:1px solid #e4dfd6;text-align:center"><h1 style="font-family:Georgia,serif">${rowCount ? 'Vous êtes désinscrit(e)' : 'Lien invalide'}</h1><p style="color:#555;line-height:1.6">${rowCount ? 'Vous ne recevrez plus d’e-mails promotionnels de TripVision. Les e-mails liés à vos réservations continueront d’être envoyés.' : 'Ce lien de désinscription n’est pas valide.'}</p></main>`);
}));

// ---------- Comptes clients (inscrits sur le site) ----------
const canClients = (...keys) => canAny('clients.view', ...keys);
const loadClient = async (req, res) => {
  const { rows } = await query(`SELECT id, email, name, phone, active, created_at, last_login_at, reset_requested_at FROM users WHERE id = $1 AND role = 'client' AND deleted_at IS NULL`, [req.params.id]);
  if (!rows[0]) { res.status(404).json({ error: 'NOT_FOUND' }); return null; }
  return rows[0];
};

app.get('/api/admin/clients', auth(...BACKOFFICE_ROLES), canClients('accounts.create', 'accounts.edit', 'accounts.delete'), h(async (_req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.name, u.phone, u.active, u.created_at, u.last_login_at, u.reset_requested_at,
            (SELECT count(*)::int FROM bookings b WHERE lower(b.customer_email) = lower(u.email) AND b.payment_status NOT IN ('awaiting', 'failed')) AS bookings,
            (SELECT count(*)::int FROM offer_requests r WHERE lower(r.customer_email) = lower(u.email) AND r.payment_status NOT IN ('awaiting', 'failed')) AS requests
     FROM users u WHERE u.role = 'client' AND u.deleted_at IS NULL ORDER BY u.created_at DESC LIMIT 1000`);
  res.json(rows);
}));

app.get('/api/admin/clients/:id', auth(...BACKOFFICE_ROLES), canClients('accounts.create', 'accounts.edit', 'accounts.delete'), h(async (req, res) => {
  const client = await loadClient(req, res);
  if (!client) return;
  const { rows: bookings } = await query(`SELECT b.*, v.model AS vehicle_model FROM bookings b LEFT JOIN vehicles v ON v.id = b.vehicle_id WHERE lower(b.customer_email) = lower($1) AND b.payment_status NOT IN ('awaiting', 'failed') ORDER BY b.created_at DESC LIMIT 100`, [client.email]);
  const { rows: requests } = await query("SELECT * FROM offer_requests WHERE lower(customer_email) = lower($1) AND payment_status NOT IN ('awaiting', 'failed') ORDER BY created_at DESC LIMIT 100", [client.email]);
  res.json({ client, bookings: bookings.map(b => mapBooking(b, b.vehicle_model)), requests });
}));

app.patch('/api/admin/clients/:id/status', auth(...BACKOFFICE_ROLES), can('accounts.edit'), h(async (req, res) => {
  const { status } = statusSchema(['active', 'inactive']).parse(req.body);
  const client = await loadClient(req, res);
  if (!client) return;
  await query('UPDATE users SET active = $1, updated_at = now() WHERE id = $2', [status === 'active', client.id]);
  await audit(req.user.id, status === 'active' ? 'unblock_client' : 'block_client', 'user', client.id, clientIp(req));
  res.json({ ok: true });
}));

// Réinitialisation du mot de passe d'un partenaire : un lien est envoyé par e-mail (l'ancien mot de passe cesse de fonctionner).
app.post('/api/admin/partners/:id/reset-password', auth(...BACKOFFICE_ROLES), can('partners.manage'), h(async (req, res) => {
  const { rows } = await query(
    `SELECT u.* FROM partners p JOIN users u ON u.id = p.user_id WHERE p.id = $1 AND p.deleted_at IS NULL AND u.deleted_at IS NULL`, [req.params.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  await query('UPDATE users SET password_hash = $1, must_change_password = true, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [await unusablePasswordHash(), user.id]);
  const access = await sendAccessLink(user, 'reset', { hours: 48 });
  await audit(req.user.id, 'reset_partner_password', 'user', user.id, clientIp(req));
  res.json({ loginEmail: user.email, ...access });
}));

app.post('/api/admin/clients/:id/reset-password', auth(...BACKOFFICE_ROLES), can('accounts.edit'), h(async (req, res) => {
  const client = await loadClient(req, res);
  if (!client) return;
  await query('UPDATE users SET password_hash = $1, must_change_password = true, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [await unusablePasswordHash(), client.id]);
  const access = await sendAccessLink(client, 'reset', { hours: 48 });
  await audit(req.user.id, 'reset_client_password', 'user', client.id, clientIp(req));
  res.json({ loginEmail: client.email, ...access });
}));

app.delete('/api/admin/clients/:id', auth(...BACKOFFICE_ROLES), can('accounts.delete'), h(async (req, res) => {
  const client = await loadClient(req, res);
  if (!client) return;
  await query('UPDATE users SET deleted_at = now(), active = false, updated_at = now() WHERE id = $1', [client.id]);
  await audit(req.user.id, 'delete_client', 'user', client.id, clientIp(req));
  res.status(204).end();
}));

app.get('/api/admin/accounts', auth(...BACKOFFICE_ROLES), h(async (req, res) => {
  if (!hasAnyAccountPermission(req.user)) return res.status(403).json({ error: 'PERMISSION_DENIED' });
  const { rows } = req.user.role !== 'it'
    ? await query(`SELECT ${ACCOUNT_COLUMNS} FROM users WHERE deleted_at IS NULL AND role IN ('manager', 'admin') ORDER BY created_at DESC`)
    : await query(`SELECT ${ACCOUNT_COLUMNS} FROM users WHERE deleted_at IS NULL AND role IN ('it','admin','manager') ORDER BY created_at DESC`);
  res.json(rows.map(u => ({ ...u, permissions: effectivePermissions(u), can: accountRights(req.user, u) })));
}));

app.post('/api/admin/accounts', auth(...BACKOFFICE_ROLES), can('accounts.create'), h(async (req, res) => {
  const body = createAccountSchema.parse(req.body);
  if (!canManageRole(req.user.role, body.role)) return res.status(403).json({ error: 'ROLE_NOT_ALLOWED' });
  const permissions = ['manager', 'admin'].includes(body.role) ? checkGrantable(req.user, body.permissions, res) : {};
  if (!permissions) return;
  const email = body.email.toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
  const passwordHash = await unusablePasswordHash();
  const { rows } = await query(
    'INSERT INTO users(email, name, role, password_hash, must_change_password, created_by, permissions) VALUES ($1,$2,$3,$4,true,$5,$6) RETURNING id, email, name, role, created_at',
    [email, body.name.trim(), body.role, passwordHash, req.user.id, permissions]
  );
  await audit(req.user.id, `create_${body.role}`, 'user', rows[0].id, clientIp(req));
  const access = await sendAccessLink(rows[0], 'invite', { invitedBy: req.user.name });
  res.status(201).json({ user: rows[0], loginEmail: email, ...access });
}));

app.patch('/api/admin/accounts/:id', auth(...BACKOFFICE_ROLES), can('accounts.edit'), h(async (req, res) => {
  const body = updateAccountSchema.parse(req.body);
  const target = await loadAccount(req, res, 'edit');
  if (!target) return;
  if (!canManageRole(req.user.role, body.role)) return res.status(403).json({ error: 'ROLE_NOT_ALLOWED' });
  const permissions = ['manager', 'admin'].includes(body.role) ? checkGrantable(req.user, body.permissions, res) : {};
  if (!permissions) return;
  const email = body.email.toLowerCase().trim();
  const clash = await query('SELECT id FROM users WHERE email = $1 AND id <> $2 AND deleted_at IS NULL', [email, target.id]);
  if (clash.rows.length) return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
  const { rows } = await query(`UPDATE users SET name = $1, first_name = NULL, last_name = NULL, email = $2, role = $3, permissions = $4, updated_at = now() WHERE id = $5 RETURNING ${ACCOUNT_COLUMNS}`, [body.name.trim(), email, body.role, permissions, target.id]);
  await audit(req.user.id, 'update_account', 'user', target.id, clientIp(req));
  res.json(rows[0]);
}));

app.patch('/api/admin/accounts/:id/status', auth(...BACKOFFICE_ROLES), can('accounts.edit'), h(async (req, res) => {
  const { status } = statusSchema(['active', 'inactive']).parse(req.body);
  const target = await loadAccount(req, res, 'edit');
  if (!target) return;
  const { rows } = await query(`UPDATE users SET active = $1, updated_at = now() WHERE id = $2 RETURNING ${ACCOUNT_COLUMNS}`, [status === 'active', target.id]);
  await audit(req.user.id, status === 'active' ? 'unblock_account' : 'block_account', 'user', target.id, clientIp(req));
  res.json(rows[0]);
}));

app.post('/api/admin/accounts/:id/reset-password', auth(...BACKOFFICE_ROLES), can('accounts.edit'), h(async (req, res) => {
  const target = await loadAccount(req, res, 'edit');
  if (!target) return;
  await query('UPDATE users SET password_hash = $1, must_change_password = true, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [await unusablePasswordHash(), target.id]);
  const access = await sendAccessLink(target, 'reset', { hours: 48 });
  await audit(req.user.id, 'reset_password', 'user', target.id, clientIp(req));
  res.json({ loginEmail: target.email, ...access });
}));

app.delete('/api/admin/accounts/:id', auth(...BACKOFFICE_ROLES), can('accounts.delete'), h(async (req, res) => {
  const target = await loadAccount(req, res, 'delete');
  if (!target) return;
  await query('UPDATE users SET deleted_at = now(), active = false, updated_at = now() WHERE id = $1', [target.id]);
  await audit(req.user.id, 'delete_account', 'user', target.id, clientIp(req));
  res.json({ ok: true });
}));

app.get('/api/admin/audit-logs', auth(...BACKOFFICE_ROLES), can('audit.view'), h(async (_req, res) => {
  const { rows } = await query(
    `SELECT a.*, u.email AS actor_email, u.role AS actor_role FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 200`
  );
  res.json(rows);
}));

app.get('/api/it/login-history', auth(...IT_ROLES), h(async (_req, res) => {
  const { rows } = await query(
    `SELECT h.*, u.email, u.name, u.role FROM login_history h JOIN users u ON u.id = h.user_id ORDER BY h.created_at DESC LIMIT 200`
  );
  res.json(rows);
}));

app.get('/api/it/health', auth(...IT_ROLES), h(async (_req, res) => {
  const { rows } = await query(
    `SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL) AS partners,
            (SELECT COUNT(*) FROM vehicles WHERE deleted_at IS NULL) AS vehicles, (SELECT COUNT(*) FROM bookings) AS bookings`
  );
  res.json({ ok: true, counts: rows[0], time: new Date().toISOString() });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof z.ZodError) return res.status(400).json({ error: 'VALIDATION_ERROR', message: err.errors.find(e => e.code === 'custom')?.message, details: err.errors });
  res.status(500).json({ error: 'SERVER_ERROR' });
});

app.listen(PORT, () => console.log(`TripVision API running on :${PORT}`));
