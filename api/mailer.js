import nodemailer from 'nodemailer';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Logo TripVision joint à chaque e-mail (image intégrée : s'affiche sans dépendre d'une adresse publique).
const LOGO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'tripvision-logo-email.png');
const logoAttachment = { filename: 'tripvision.png', path: LOGO, cid: 'tvlogo', contentDisposition: 'inline' };

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
const port = Number(SMTP_PORT || 587);

export const mailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

const transporter = mailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

export async function verifyMail() {
  if (!transporter) return { ok: false, error: 'SMTP non configuré' };
  try { await transporter.verify(); return { ok: true }; } catch (err) { return { ok: false, error: err.message }; }
}

// Envoi par l'API HTTPS de Brevo si BREVO_API_KEY est définie (utile sur un hébergeur qui bloque les ports SMTP).
const { BREVO_API_KEY } = process.env;
export const mailReady = Boolean(BREVO_API_KEY) || mailConfigured;
async function sendViaBrevo({ to, subject, text, html, replyTo }) {
  const from = String(SMTP_FROM || SMTP_USER || '');
  const m = from.match(/^(.*)<([^>]+)>$/);
  const sender = m ? { name: m[1].trim().replace(/^"|"$/g, '') || 'TripVision', email: m[2].trim() } : { name: 'TripVision', email: from.trim() };
  const base = (process.env.APP_URL || '').replace(/\/$/, '');
  const body = { sender, to: [{ email: to }], subject, textContent: text, htmlContent: html ? html.replace('cid:tvlogo', `${base}/assets/tripvision-logo-email.png`) : undefined };
  if (replyTo) body.replyTo = { email: replyTo };
  const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Brevo ${r.status} ${(await r.text()).slice(0, 160)}`);
}
export async function sendMail({ to, subject, text, html, replyTo }) {
  if (BREVO_API_KEY) {
    try { await sendViaBrevo({ to, subject, text, html, replyTo }); return { sent: true }; }
    catch (err) { console.error('Envoi e-mail (Brevo) impossible :', err.message); return { sent: false, error: err.message }; }
  }
  if (!transporter) return { sent: false, error: 'SMTP non configuré' };
  try {
    await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, text, html, replyTo, attachments: html && html.includes('cid:tvlogo') ? [logoAttachment] : [] });
    return { sent: true };
  } catch (err) {
    console.error('Envoi e-mail impossible :', err.message);
    return { sent: false, error: err.message };
  }
}

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout({ title, intro, buttonLabel, url, outro, details = [] }) {
  const rows = details.filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 0;font-size:13px;color:#7b7f78;width:38%">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;color:#151816;font-weight:bold">${escapeHtml(v)}</td></tr>`).join('');
  const table = rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid #e4dfd6;border-bottom:1px solid #e4dfd6">${rows}</table>` : '';
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f8f5ef;font-family:Arial,Helvetica,sans-serif;color:#151816">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ef;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4dfd6">
<tr><td style="background:#ffffff;padding:22px 32px 18px;border-bottom:4px solid #0b352b"><img src="cid:tvlogo" width="170" alt="TripVision — Voyager autrement" style="display:block;border:0;outline:none;height:auto;max-width:170px"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;line-height:1.1;color:#151816">${escapeHtml(title)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a423e">${intro}</p>
${table}<p style="margin:0 0 24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#075f4b;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 26px;border-radius:8px">${escapeHtml(buttonLabel)}</a></p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#7b7f78">${outro}</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#7b7f78">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
</td></tr></table></body></html>`;
}

export function invitationEmail({ name, url, hours, invitedBy }) {
  const who = invitedBy ? ` par ${escapeHtml(invitedBy)}` : '';
  return {
    subject: 'Activez votre accès TripVision',
    text: `Bonjour ${name},\n\nUn accès TripVision a été créé pour vous${invitedBy ? ` par ${invitedBy}` : ''}.\nChoisissez votre mot de passe via ce lien (valable ${hours} h) :\n${url}\n\nSi vous n'attendiez pas cet e-mail, ignorez-le.`,
    html: layout({
      title: `Bienvenue, ${escapeHtml(name)}`,
      intro: `Un accès TripVision a été créé pour vous${who}. Choisissez votre mot de passe pour l'activer.`,
      buttonLabel: 'Activer mon accès',
      url,
      outro: `Ce lien est personnel et valable ${hours} heures. Si vous n'attendiez pas cet e-mail, ignorez-le.`,
    }),
  };
}

export function resetEmail({ name, url, hours }) {
  return {
    subject: 'Réinitialisez votre mot de passe TripVision',
    text: `Bonjour ${name},\n\nPour choisir un nouveau mot de passe, utilisez ce lien (valable ${hours} h) :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable.`,
    html: layout({
      title: 'Nouveau mot de passe',
      intro: `Bonjour ${escapeHtml(name)}, une réinitialisation de votre mot de passe a été demandée.`,
      buttonLabel: 'Choisir un nouveau mot de passe',
      url,
      outro: `Ce lien est valable ${hours} heures et ne peut être utilisé qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable.`,
    }),
  };
}


/* ---------- Notifications d'activité (jamais le contenu d'un message : seulement l'alerte et un bouton d'accès) ---------- */
export function notificationEmail({ subject, title, intro, details = [], buttonLabel, url, outro = 'Cet e-mail vous prévient d’une activité sur votre compte TripVision.' }) {
  const plain = [intro.replace(/<[^>]+>/g, ''), ...details.filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`), '', `${buttonLabel} : ${url}`].join('\n');
  return { subject, text: plain, html: layout({ title, intro, details, buttonLabel, url, outro }) };
}
