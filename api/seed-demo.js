import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const PARTNER_EMAIL = 'partner@tripvision.fr';
const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

const vehicles = [
  { model: 'Peugeot 208 ou similaire', category: 'Économique (B)', city: 'Paris Gare de Lyon', day: 39, week: 230, month: 780, transmission: 'Manuelle', km: 'Kilométrage illimité', image: image('photo-1549924231-f129b911e442') },
  { model: 'Renault Clio ou similaire', category: 'Compacte (C)', city: 'Lyon Part-Dieu', day: 44, week: 260, month: 890, transmission: 'Manuelle', km: '300 km / jour', image: image('photo-1533473359331-0135ef1b58bf') },
  { model: 'Toyota Corolla Hybride ou similaire', category: 'Intermédiaire (D)', city: 'Marseille Saint-Charles', day: 58, week: 340, month: 1180, transmission: 'Automatique', km: 'Kilométrage illimité', image: image('photo-1492144534655-ae79c964c9d7') },
  { model: 'Peugeot 3008 ou similaire', category: 'SUV et Break', city: 'Nice Aéroport', day: 79, week: 470, month: 1640, transmission: 'Automatique', km: 'Kilométrage illimité', image: image('photo-1519641471654-76ce0107ad1b') },
  { model: 'Renault Trafic ou similaire', category: 'Monospace ou Minibus', city: 'Paris Gare de Lyon', day: 95, week: 560, month: 1990, transmission: 'Manuelle', km: '250 km / jour', image: image('photo-1609521263047-f8f205293f24') },
];

const offers = [
  { type: 'flight', title: 'Paris → Lisbonne aller-retour', from: 'Paris', to: 'Lisbonne', country: 'Portugal', badge: 'Bon plan', price: 119, old: 164, description: 'Vol direct, bagage cabine inclus.' },
  { type: 'flight', title: 'Paris → Rome aller-retour', from: 'Paris', to: 'Rome', country: 'Italie', badge: 'Vente flash', price: 98, old: 135, description: 'Départs de Paris Orly, horaires en semaine.' },
  { type: 'pack', title: 'Pack week-end Barcelone', from: 'Paris', to: 'Barcelone', country: 'Espagne', badge: 'Pack week-end', price: 289, old: 345, description: 'Vol aller-retour et hôtel 3 nuits, petit-déjeuner inclus.' },
];

async function run() {
  const existing = await query('SELECT id FROM users WHERE email = $1', [PARTNER_EMAIL]);
  if (existing.rows.length) {
    console.log('- données de démo déjà présentes, ignoré');
    await pool.end();
    return;
  }

  const partnerPassword = requiredEnv('PARTNER_PASSWORD');
  const passwordHash = await bcrypt.hash(partnerPassword, 10);
  const { rows: [user] } = await query(
    `INSERT INTO users(email, name, role, password_hash) VALUES ($1,'Partenaire TripVision','partner',$2) RETURNING id`,
    [PARTNER_EMAIL, passwordHash]
  );
  const { rows: [partner] } = await query(
    `INSERT INTO partners(user_id, status, legal_name, trade_name, head_office, agencies, siret, booking_email, contact_email, manager_name, phone, city)
     VALUES ($1,'approved','Location Démo SAS','Location Démo','12 rue de la Paix, Paris','Paris, Lyon, Marseille, Nice','12345678900011','contact@demo-location.fr','contact@demo-location.fr','Partenaire TripVision','+33 1 00 00 00 00','Paris')
     RETURNING id`,
    [user.id]
  );

  for (const v of vehicles) {
    await query(
      `INSERT INTO vehicles(partner_id, status, model, category, pickup_address, price_day, price_week, price_month, details)
       VALUES ($1,'approved',$2,$3,$4,$5,$6,$7,$8)`,
      [partner.id, v.model, v.category, v.city, v.day, v.week, v.month, {
        passengers: 5, transmission: v.transmission, doors: 5, airConditioning: true, includedKm: v.km,
        fuelPolicy: 'Plein à plein', freeCancel: true, theftProtection: true, freeModification: false, fullInsurance: true,
        rentalConditions: 'Permis depuis plus de 3 ans, pièce d\'identité et carte bancaire requises.',
        differentReturnAllowed: true, differentReturnFee: '50', image: v.image,
      }]
    );
  }

  for (const o of offers) {
    await query(
      `INSERT INTO offers(type, title, from_city, to_city, country, badge, price, old_price, partner_name, image, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'TripVision',$9,$10,'active')`,
      [o.type, o.title, o.from, o.to, o.country, o.badge, o.price, o.old, image('photo-1507525428034-b723cf961d3e'), o.description]
    );
  }

  console.log(`✓ partenaire démo créé : ${PARTNER_EMAIL}`);
  console.log(`✓ ${vehicles.length} véhicules publiés, ${offers.length} offres actives`);
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
