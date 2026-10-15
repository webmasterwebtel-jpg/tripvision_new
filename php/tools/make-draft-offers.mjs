// Génère le fichier SQL (brouillons de vols) et le tableau CSV à partir des tarifs relevés à la main.
//   node php/tools/make-draft-offers.mjs relevé.json sortie-sans-extension
// Les offres sont créées HORS LIGNE (status « inactive », details.draft = true) : l'équipe les vérifie dans le back-office avant publication.
import fs from 'node:fs';

const [, , inFile, outBase] = process.argv;
const rows = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const cat = JSON.parse(fs.readFileSync(new URL('../src/data/draft-catalog.json', import.meta.url), 'utf8'));
const airportName = { ...cat.airportName, BVA: 'BVA – Paris-Beauvais' };
const q = (s) => (s === null || s === undefined ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const day = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

const ryanair = (r) => `https://www.ryanair.com/fr/fr/trip/flights/select?adults=1&teens=0&children=0&infants=0&dateOut=${r.start}&dateIn=${r.end}&isConnectedFlight=false&isReturn=true&discount=0&promoCode=&originIata=${r.fromCode}&destinationIata=${r.toCode}&tpAdults=1&tpTeens=0&tpChildren=0&tpInfants=0&tpStartDate=${r.start}&tpEndDate=${r.end}&tpDiscount=0&tpPromoCode=&tpOriginIata=${r.fromCode}&tpDestinationIata=${r.toCode}`;
const kayak = (r) => `https://www.kayak.fr/flights/PAR-${r.toCode}/${r.start}/${r.end}/1adults?sort=price_a${r.stops === 0 ? '&fs=stops=0' : ''}`;

let sql = `-- Brouillons de vols (relevé du ${rows[0].releve}). Hors ligne : à vérifier dans le back-office avant publication.\n-- À importer dans phpMyAdmin APRÈS schema.sql.\nSET NAMES utf8mb4;\n\n`;
const csv = [['Trajet', 'Compagnie', 'Départ', 'Retour', 'Escales', 'Prix A/R (€)', 'Aéroports', 'Lien de l’offre (compagnie)', 'Lien de vérification (Kayak)', 'Remarque']];
for (const r of rows) {
  const fromAp = airportName[r.fromCode], toAp = airportName[r.toCode];
  const exact = r.airline === 'Ryanair' ? ryanair(r) : null;
  const link = exact || cat.airlineHome[r.airline] || '';
  const verify = kayak(r);
  const note = exact
    ? `Tarif relevé sur ryanair.com le ${r.releve} (aller ${day(r.start)}, retour ${day(r.end)}) : lien direct vers cette recherche. À revérifier avant publication.`
    : `Tarif relevé sur Kayak le ${r.releve} (aller ${day(r.start)}, retour ${day(r.end)}). Lien de ${r.airline} à compléter : ouvrir ${verify}, choisir l’offre ${r.airline}, puis copier l’adresse de sa page de recherche sur le site de la compagnie.`;
  const details = {
    flight: { tripType: 'roundtrip', airline: r.airline, bookingUrl: link, fromCountry: r.fromCountry || 'France', fromAirport: fromAp, toAirport: toAp, stops: r.stops, cabin: 'Économique' },
    images: [`/assets/dest/${r.img}.jpg`], draft: true, auto: false, toVerify: note, source: exact ? 'ryanair' : 'kayak',
  };
  sql += `INSERT INTO offers (id, type, title, from_city, to_city, country, badge, price, partner_name, start_date, end_date, image, description, status, details) VALUES (UUID(), 'flight', ${q(`${r.from} → ${r.to}`)}, ${q(r.from)}, ${q(r.to)}, ${q(r.country)}, 'Bon plan', ${r.price}, ${q(r.airline)}, ${q(r.start)}, ${q(r.end)}, ${q(`/assets/dest/${r.img}.jpg`)}, '', 'inactive', ${q(JSON.stringify(details))});\n`;
  csv.push([`${r.from} → ${r.to}`, r.airline, r.start, r.end, r.stops === 0 ? 'direct' : `${r.stops} escale`, String(r.price).replace('.', ','), `${fromAp} → ${toAp}`, link, verify, exact ? 'Lien exact vérifié (page de résultats ouverte avec ce trajet et ces dates)' : 'Lien compagnie à compléter']);
}
fs.writeFileSync(outBase + '.sql', sql, 'utf8');
fs.writeFileSync(outBase + '.csv', '﻿' + csv.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n'), 'utf8');
console.log(`${rows.length} offres → ${outBase}.sql / .csv`);
