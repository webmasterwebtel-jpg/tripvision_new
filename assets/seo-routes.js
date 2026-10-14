/* Adresses propres (/vols, /destination/dakar…) : le site fonctionne par pages internes (#flights…), on traduit donc l'adresse demandée avant tout le reste. */
(function () {
  var map = { '/vols': 'flights', '/voitures': 'cars', '/week-ends': 'packs', '/contact': 'contact', '/mentions-legales': 'legal', '/politique-de-confidentialite': 'privacy' };
  var p = location.pathname.replace(/\/+$/, '') || '/';
  var h = map[p];
  var d = /^\/destination\/([a-z0-9-]+)$/.exec(p);
  if (d) h = 'destination/' + d[1];
  if (!h || location.hash) return;
  try { history.replaceState(null, '', '/' + location.search + '#' + h); } catch (e) { location.hash = h; }
})();
