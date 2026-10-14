// Compare les e-mails générés par Node (api/mailer.js) et par PHP (php/src/mail.php) : objet, texte et HTML identiques.
//   node php/tools/mail-parity.mjs
import { invitationEmail, resetEmail, notificationEmail } from '../../api/mailer.js';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const slash = (p) => p.split(path.sep).join('/');
process.env.APP_URL = process.env.APP_URL || 'https://exemple.test';
const cases = {
  invitation: invitationEmail({ name: 'Camille Martin', url: 'https://exemple.test/activation/?token=abc', hours: 48, invitedBy: 'Sarah' }),
  invitationSans: invitationEmail({ name: 'Camille', url: 'https://exemple.test/activation/?token=abc', hours: 48 }),
  reset: resetEmail({ name: 'Camille & Co <b>', url: 'https://exemple.test/activation/?token=xyz', hours: 2 }),
  notif: notificationEmail({ subject: '[TripVision] Nouvelle demande TV-ABCD1234', title: 'Nouvelle demande', intro: 'Camille souhaite réserver un vol.', buttonLabel: 'Ouvrir le back-office', url: 'https://exemple.test/backoffice/#bookings', details: [['Référence', 'TV-ABCD1234'], ['Trajet', 'Paris → Dakar'], ['Total estimé', '820 €'], ['Client', 'Camille <script>']] }),
  notifOutro: notificationEmail({ subject: 'Votre réservation TripVision est confirmée', title: 'Réservation confirmée', intro: 'Merci, votre séjour est confirmé !', buttonLabel: 'Voir ma réservation', url: 'https://exemple.test/espace/#orders', details: [], outro: 'Ce lien est personnel et valable 48 heures.' }),
};
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
const f = path.join(os.tmpdir(), 'tv_mail_cases.json');
fs.writeFileSync(f, JSON.stringify(cases));
const php = `<?php define('TV_APP', '${slash(path.join(here, '..', 'src'))}'); putenv('APP_URL=${process.env.APP_URL}'); require TV_APP . '/core.php'; require TV_APP . '/mail.php'; require TV_APP . '/helpers.php';
$js = json_decode(file_get_contents('${slash(f)}'), true);
$d = fn($a) => $a ?? [];
$mine = [
 'invitation' => invitation_email('Camille Martin', 'https://exemple.test/activation/?token=abc', 48, 'Sarah'),
 'invitationSans' => invitation_email('Camille', 'https://exemple.test/activation/?token=abc', 48),
 'reset' => reset_email('Camille & Co <b>', 'https://exemple.test/activation/?token=xyz', 2),
 'notif' => notification_email('[TripVision] Nouvelle demande TV-ABCD1234', 'Nouvelle demande', 'Camille souhaite réserver un vol.', 'Ouvrir le back-office', 'https://exemple.test/backoffice/#bookings', [['Référence', 'TV-ABCD1234'], ['Trajet', 'Paris → Dakar'], ['Total estimé', '820 €'], ['Client', 'Camille <script>']]),
 'notifOutro' => notification_email('Votre réservation TripVision est confirmée', 'Réservation confirmée', 'Merci, votre séjour est confirmé !', 'Voir ma réservation', 'https://exemple.test/espace/#orders', [], 'Ce lien est personnel et valable 48 heures.'),
];
echo json_encode($mine, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);`;
const pf = path.join(os.tmpdir(), 'tv_mail_check.php');
fs.writeFileSync(pf, php);
const mine = JSON.parse(execFileSync('php', [pf], { encoding: 'utf8', maxBuffer: 1 << 26 }));
let bad = 0;
for (const [k, js] of Object.entries(cases)) {
  const p = mine[k];
  for (const field of ['subject', 'text', 'html']) {
    const a = norm(js[field]), b = norm(p[field]);
    if (a === b) continue;
    bad++;
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    console.log(`DIFF ${k}.${field} à la position ${i}\n  node: …${a.slice(Math.max(0, i - 40), i + 80)}\n  php : …${b.slice(Math.max(0, i - 40), i + 80)}`);
  }
}
console.log(`${Object.keys(cases).length} e-mails comparés, ${bad} différence(s)`);
fs.unlinkSync(f); fs.unlinkSync(pf);
