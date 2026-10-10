/* Calcul du prix d'une location de voiture : le même code sert au site, aux espaces et au serveur.
   Les tarifs sont saisis TTC par l'enseigne :
   - une grille de prix par jour selon la durée TOTALE de la location (5 paliers) ;
   - des saisons (dates de chaque année + coefficient), appliquées jour par jour ;
   - des règles : durée minimale et maximale (30 jours au plus), retard toléré, lissage des seuils
     (jamais plus cher qu'un palier supérieur : 6 jours ne coûtent jamais plus que 7 jours). */
(function (root) {
  const PALIERS = [{ min: 1, max: 2 }, { min: 3, max: 6 }, { min: 7, max: 13 }, { min: 14, max: 29 }, { min: 30, max: null }];
  const MAX_DAYS = 30;
  const round2 = (n) => Math.round(Number(n) * 100) / 100;
  const pad = (n) => String(n).padStart(2, '0');
  const md = (d) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toDate = (x) => (x instanceof Date ? x : new Date(String(x).length <= 10 ? `${x}T12:00:00` : `${String(x).slice(0, 16)}:00`));

  // Tarifs d'une annonce ; une ancienne annonce (prix par jour seul) garde le même prix sur tous les paliers.
  function ratesOf(v) {
    const r = (v && (v.rates || v.details?.rates)) || {};
    const pd = Number(v?.priceDay ?? v?.price_day) || 0;
    const tiers = Array.isArray(r.tiers) && r.tiers.length === PALIERS.length ? r.tiers.map(Number) : PALIERS.map(() => pd);
    const maxDays = Math.min(MAX_DAYS, Math.max(1, Number(r.maxDays) || MAX_DAYS));
    return {
      tiers,
      seasons: (r.seasons || []).filter((s) => /^\d{2}-\d{2}$/.test(s.from) && /^\d{2}-\d{2}$/.test(s.to) && Number(s.coef) > 0),
      minDays: Math.min(maxDays, Math.max(1, Number(r.minDays) || 1)),
      maxDays,
      grace: r.grace == null ? 59 : Math.max(0, Number(r.grace) || 0),
      smoothing: r.smoothing !== false,
    };
  }

  // Nombre de jours facturés : chaque tranche de 24 h entamée, après le retard toléré.
  function countDays(start, end, grace = 59) {
    const minutes = (toDate(end) - toDate(start)) / 60000;
    if (!(minutes > 0)) return 1;
    return Math.max(1, Math.ceil((minutes - grace) / 1440));
  }
  const palierOf = (n) => PALIERS.findIndex((p) => p.min <= n && (p.max == null || n <= p.max));
  const priceFor = (rates, n) => rates.tiers[Math.max(0, palierOf(n))];
  // Coefficient de la saison du jour (une saison peut passer d'une année à l'autre, ex. 20/12 → 03/01).
  function seasonOf(rates, day) {
    const k = md(day);
    return rates.seasons.find((s) => (s.from <= s.to ? k >= s.from && k <= s.to : k >= s.from || k <= s.to)) || null;
  }
  // Somme jour par jour : palier selon la durée de référence, saison selon la date.
  function costDays(rates, start, n, ref) {
    const d0 = toDate(start);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const day = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i, 12);
      const s = seasonOf(rates, day);
      total += priceFor(rates, ref) * (s ? Number(s.coef) : 1);
    }
    return round2(total);
  }

  /* Devis d'une location. start / end : « AAAA-MM-JJTHH:MM » ou dates. */
  function quote(v, start, end) {
    const rates = ratesOf(v);
    const days = countDays(start, end, rates.grace);
    let base = costDays(rates, start, days, days), applied = null;
    if (rates.smoothing) {
      for (const p of PALIERS) {
        if (p.min <= days || p.min > rates.maxDays) continue;
        const c = costDays(rates, start, p.min, p.min);
        if (c < base) { base = c; applied = p.min; }
      }
    }
    const seasonal = rates.seasons.length && Array.from({ length: days }, (_, i) => { const d = toDate(start); return seasonOf(rates, new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, 12)); }).some(Boolean);
    const error = days < rates.minDays ? `Durée minimale de location : ${rates.minDays} jour${rates.minDays > 1 ? 's' : ''}.`
      : days > rates.maxDays ? `Durée maximale de location : ${rates.maxDays} jours.` : null;
    return { days, base, perDay: priceFor(rates, days), applied, seasonal: Boolean(seasonal), error, rates };
  }

  // Prix « à partir de » par jour (le palier le moins cher, hors saison).
  const fromPrice = (v) => Math.min(...ratesOf(v).tiers.filter((x) => x > 0));
  // Grille générée à partir d'un prix de base et d'une baisse par palier (en %).
  const generate = (base, pct) => PALIERS.map((_, i) => Math.max(1, Math.round(round2(Number(base) * (1 - (Number(pct) / 100) * i)))));
  const label = (p) => (p.max == null ? `${p.min} jours et plus` : `${p.min} à ${p.max} jours`);

  root.TVPricing = { PALIERS, MAX_DAYS, ratesOf, countDays, quote, fromPrice, generate, label, costDays, round2 };
})(typeof window !== 'undefined' ? window : globalThis);
