/* Renouvellement des brouillons de vols : toutes les 48 h, les brouillons automatiques que personne n'a touchés sont remplacés
   par de nouveaux. Rien n'est jamais publié : l'équipe vérifie chaque tarif et chaque lien, puis publie.
   - remplacés : brouillons créés par ce système (details.auto), non modifiés par un agent (details.touched), jamais publiés ;
   - jamais touchés : offres publiées, brouillons modifiés ou créés à la main, packs. */
import { AIRLINE_HOME, AIRPORT_NAME, ROUTES } from './draft-catalog.js';

export const DRAFT_EVERY_HOURS = 48;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const iso = (d) => d.toISOString().slice(0, 10);

// Saison : été et fêtes plus chers, janvier à mars moins chers (repère indicatif).
const season = (d) => { const m = d.getUTCMonth() + 1; return m === 7 || m === 8 ? 1.1 : m === 12 ? 1.12 : m <= 3 ? 0.94 : m === 4 || m === 10 ? 1.04 : 1; };

export function buildDrafts(now = new Date()) {
  const A = globalThis.TVAirline;
  const out = [];
  for (const [from, fa, fc, to, ta, tc, airline, base, stops, dur, lead, stay, img] of ROUTES) {
    const start = new Date(now.getTime() + Math.max(14, lead + rnd(-9, 12)) * 864e5);
    const nights = Math.max(2, stay + rnd(-2, 2));
    const end = new Date(start.getTime() + nights * 864e5);
    const price = Math.max(29, Math.round(base * season(start) * (0.9 + Math.random() * 0.22)));
    const flight = { tripType: 'roundtrip', airline, bookingUrl: AIRLINE_HOME[airline], fromCountry: fc, fromAirport: AIRPORT_NAME[fa], toAirport: AIRPORT_NAME[ta], stops, cabin: 'Économique', durationMin: dur, arriveDayOffset: 0, returnDayOffset: 0 };
    const exact = A?.buildExact({ start_date: iso(start), end_date: iso(end), flight }, {});
    if (exact) flight.bookingUrl = exact;
    out.push({
      title: `${from} → ${to}`, from, to, country: tc, price, airline, start: iso(start), end: iso(end), image: `/assets/dest/${img}.jpg`,
      details: { flight, images: [`/assets/dest/${img}.jpg`], draft: true, auto: true, autoBatch: now.toISOString(), toVerify: 'Tarif « dès » indicatif, dates et lien à vérifier avant publication.' },
    });
  }
  return out;
}

export async function renewDrafts(query, by = 'auto') {
  // 1) on retire les anciens brouillons automatiques non touchés (ils disparaissent de la liste)
  const old = await query(`UPDATE offers SET deleted_at = now()
     WHERE type = 'flight' AND status = 'inactive' AND deleted_at IS NULL AND publish_at IS NULL
       AND details ? 'draft' AND details->>'auto' = 'true' AND COALESCE(details->>'touched', '') <> 'true' RETURNING id`);
  // 2) les nouveaux, toujours en brouillon
  const fresh = buildDrafts();
  for (const d of fresh) {
    await query(`INSERT INTO offers(type, title, from_city, to_city, country, badge, price, partner_name, start_date, end_date, image, description, status, details)
      VALUES ('flight', $1, $2, $3, $4, 'Bon plan', $5, $6, $7, $8, $9, '', 'inactive', $10)`,
      [d.title, d.from, d.to, d.country, d.price, d.airline, d.start, d.end, d.image, JSON.stringify(d.details)]);
  }
  await query(`INSERT INTO job_runs(name, last_run_at, last_created, last_replaced, last_by) VALUES ('auto_drafts', now(), $1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET last_run_at = now(), last_created = $1, last_replaced = $2, last_by = $3`, [fresh.length, old.rowCount, by]);
  return { created: fresh.length, replaced: old.rowCount };
}
