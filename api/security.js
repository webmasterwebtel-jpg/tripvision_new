import { query } from './db.js';

const WINDOW_MINUTES = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

export async function isLockedOut(email, ip) {
  const since = `now() - interval '${WINDOW_MINUTES} minutes'`;
  const byEmail = await query(`SELECT COUNT(*) FROM login_attempts WHERE email = $1 AND created_at > ${since}`, [email]);
  if (Number(byEmail.rows[0].count) >= MAX_PER_EMAIL) return true;
  const byIp = await query(`SELECT COUNT(*) FROM login_attempts WHERE ip = $1 AND created_at > ${since}`, [ip]);
  return Number(byIp.rows[0].count) >= MAX_PER_IP;
}

export async function recordFailedAttempt(email, ip) {
  await query('INSERT INTO login_attempts(email, ip) VALUES ($1, $2)', [email, ip]);
}

export async function clearAttempts(email, ip) {
  await query('DELETE FROM login_attempts WHERE email = $1 OR ip = $2', [email, ip]);
}

export function passwordProblem(password) {
  if (password.length < 14) return 'Le mot de passe doit faire au moins 14 caractères.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return 'Utilisez au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
  }
  return null;
}

export async function audit(actorId, action, entity, entityId, ip) {
  await query('INSERT INTO audit_logs(actor_id, action, entity, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)', [actorId, action, entity, entityId ? String(entityId) : null, ip || null]);
}

export async function recordLogin(userId, ip, userAgent) {
  await query('INSERT INTO login_history(user_id, ip_address, user_agent) VALUES ($1,$2,$3)', [userId, ip || null, userAgent || null]);
  await query('UPDATE users SET last_login_at = now(), last_activity_at = now() WHERE id = $1', [userId]);
}

export function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim() || '0.0.0.0';
}

export function generateTemporaryPassword() {
  const random = crypto.randomUUID().replaceAll('-', '').slice(0, 14);
  return `${random}A1!`;
}
