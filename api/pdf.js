// Documents PDF de réservation (confirmation à télécharger par le client).
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LOGO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'tripvision-logo-email.png');

const GREEN = '#0f3b2e', GOLD = '#c8a24a', INK = '#14231d', MUTED = '#6b7a72', LINE = '#e3ddcf', SAND = '#f6f2ea';
const eur = (n) => (n == null || n === '' || Number.isNaN(Number(n)) ? '' : `${Number(n).toFixed(2).replace('.', ',')} €`);
const day = (d) => (d ? (d instanceof Date ? d : new Date(`${String(d).slice(0, 10)}T12:00:00`)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');
const when = (d, t) => [day(d), t ? String(t).slice(0, 5) : ''].filter(Boolean).join(' à ');

function start() {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: { Title: 'Confirmation de réservation TripVision', Author: 'TripVision' } });
  return doc;
}
function header(doc, { title, reference, status }) {
  doc.rect(0, 0, 595, 8).fill(GREEN);
  try { doc.image(LOGO, 48, 24, { width: 168 }); } catch { doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(24).text('TripVision', 48, 34); }
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Référence', 380, 28, { width: 167, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(20).fillColor(GREEN).text(reference, 380, 40, { width: 167, align: 'right' });
  doc.roundedRect(447, 70, 100, 22, 11).fill(status.ok ? '#e3f1ea' : '#fbefd5');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(status.ok ? '#1f7a55' : '#8a5a10').text(status.label.toUpperCase(), 447, 77, { width: 100, align: 'center', characterSpacing: 0.6 });
  doc.moveTo(48, 104).lineTo(547, 104).strokeColor(GOLD).lineWidth(2).stroke();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(GREEN).text(title.toUpperCase(), 48, 114, { characterSpacing: 1.4 });
  doc.y = 142;
}
function section(doc, title) {
  if (doc.y > 740) doc.addPage();
  doc.y += 6;
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(title.toUpperCase(), 48, y, { characterSpacing: 1.8 });
  doc.moveTo(48, y + 15).lineTo(547, y + 15).strokeColor(LINE).lineWidth(1).stroke();
  doc.y = y + 21;
}
function rows(doc, list) {
  for (const [k, v] of list.filter(([, x]) => x !== undefined && x !== null && String(x).trim() !== '')) {
    if (doc.y > 770) doc.addPage();
    const y = doc.y;
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(k, 48, y, { width: 150 });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(String(v), 205, y, { width: 342 });
    doc.y = Math.max(doc.y, y + 14) + 2;
  }
}
function priceBox(doc, { total, online, onsite, deposit }) {
  if (doc.y > 690) doc.addPage();
  const y = doc.y + 4;
  doc.roundedRect(48, y, 499, onsite != null ? 96 : 60, 10).fill(SAND);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('PRIX TOTAL', 66, y + 14, { characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(28).fillColor(GREEN).text(eur(total) || '—', 66, y + 26);
  if (onsite != null) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('PAYÉ EN LIGNE', 300, y + 14, { characterSpacing: 1.2 });
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#1f7a55').text(eur(online), 300, y + 28);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('À RÉGLER À L’ENSEIGNE AU RETRAIT', 300, y + 54, { characterSpacing: 0.6 });
    doc.font('Helvetica-Bold').fontSize(15).fillColor(INK).text(eur(onsite), 300, y + 67);
  }
  doc.y = y + (onsite != null ? 96 : 60) + 10;
  if (deposit != null) {
    const dy = doc.y;
    doc.roundedRect(48, dy, 499, 40, 8).lineWidth(1.5).strokeColor('#d9a13b').fillAndStroke('#fff8e6', '#d9a13b');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#8a5a00').text('DÉPÔT DE GARANTIE', 64, dy + 8, { characterSpacing: 1 });
    doc.font('Helvetica').fontSize(8.5).fillColor('#4d3a07').text(deposit > 0 ? 'Demandé par l’enseigne à l’agence lors du retrait du véhicule.' : 'L’enseigne ne demande pas de dépôt de garantie.', 64, dy + 22);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#8a5a00').text(deposit > 0 ? eur(deposit) : 'Aucun', 380, dy + 12, { width: 150, align: 'right' });
    doc.y = dy + 50;
  }
}
function footer(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.moveTo(48, 800).lineTo(547, 800).strokeColor(LINE).lineWidth(1).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(`TripVision · info@tripvision.fr · Document généré le ${new Date().toLocaleDateString('fr-FR')} · Page ${i + 1}/${range.count}`, 48, 808, { width: 499, align: 'center', lineBreak: false });
  }
}

export function bookingPdf(b) {
  const doc = start();
  doc.options.bufferPages = true;
  const confirmed = b.status === 'confirmed' || b.status === 'completed';
  header(doc, { title: 'Voucher de location de voiture', reference: b.reference, status: { ok: confirmed, label: confirmed ? 'Confirmée' : ['inactive', 'cancelled'].includes(b.status) ? 'Annulée' : 'En attente' } });
  section(doc, 'Votre véhicule');
  rows(doc, [['Véhicule', b.vehicle], ['Enseigne', b.lessor], ['Réservé le', day(b.createdAt)]]);
  section(doc, 'Retrait et restitution');
  rows(doc, [['Départ', when(b.startDate, b.startTime)], ['Lieu de prise en charge', b.pickup], ['Retour', when(b.endDate, b.endTime)], ['Lieu de restitution', b.returnPlace], ['Horaires de l’agence', b.officeHours]]);
  section(doc, 'Conducteur principal');
  rows(doc, [['Nom', b.customer], ['E-mail', b.email], ['Téléphone', b.phone], ['Âge déclaré', b.driverAge ? `${b.driverAge} ans` : '']]);
  if (b.extras?.length) {
    section(doc, 'Options choisies');
    rows(doc, b.extras.map((x) => [`${x.qty > 1 ? `${x.qty} × ` : ''}${x.name}`, eur(x.total)]));
  }
  section(doc, 'Prix et paiement');
  const paid = b.paymentStatus === 'paid';
  priceBox(doc, { total: b.total, online: b.paidAmount, onsite: paid ? b.payOnPickup : null, deposit: b.deposit });
  if (b.conditions && Object.values(b.conditions).some(Boolean)) {
    section(doc, 'Conditions de l’enseigne');
    rows(doc, [['Kilométrage', b.conditions.mileage], ['Carburant', b.conditions.fuelPolicy], ['Annulation', b.conditions.freeCancelHours > 0 ? `Gratuite jusqu’à ${b.conditions.freeCancelHours} h avant le départ` : ''], ['Âge minimum', b.conditions.minAge ? `${b.conditions.minAge} ans` : ''], ['Franchise', b.conditions.excess != null ? eur(b.conditions.excess) : ''], ['Assurance', b.conditions.insuranceType]]);
    if (b.conditions.text) {
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(b.conditions.text, 48, doc.y, { width: 499, align: 'left' });
    }
  }
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('Présentez ce document (imprimé ou sur téléphone), votre pièce d’identité, votre permis de conduire et une carte bancaire au nom du conducteur lors du retrait du véhicule.', 48, doc.y, { width: 499 });
  footer(doc);
  doc.end();
  return doc;
}

export function requestPdf(r) {
  const doc = start();
  doc.options.bufferPages = true;
  const confirmed = r.status === 'confirmed';
  header(doc, { title: r.type === 'flight' ? 'Réservation de vol' : 'Réservation de pack', reference: r.reference, status: { ok: confirmed, label: confirmed ? 'Confirmée' : r.status === 'cancelled' ? 'Annulée' : 'En attente' } });
  section(doc, r.type === 'flight' ? 'Votre vol' : 'Votre pack');
  rows(doc, [['Offre', r.title], ['Détail', r.summary], ['Type de billet', r.tripType === 'oneway' ? 'Aller simple' : r.tripType === 'roundtrip' ? 'Aller-retour' : ''], ['Voyageurs', r.travelers], ['Demandée le', day(r.createdAt)]]);
  section(doc, 'Voyageur');
  rows(doc, [['Nom', r.customer], ['E-mail', r.email], ['Téléphone', r.phone]]);
  section(doc, 'Prix');
  priceBox(doc, { total: r.total, online: null, onsite: null, deposit: null });
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(confirmed ? (r.paid != null ? ('Cette réservation est confirmée et réglée en ligne (' + eur(r.paid) + ').') : 'Cette réservation est confirmée par TripVision.') : 'Cette demande sera confirmée par TripVision après vérification de la disponibilité ; aucun paiement n’a été demandé à ce stade.', 48, doc.y, { width: 499 });
  footer(doc);
  doc.end();
  return doc;
}
