/* Accueil : bandeau des drapeaux de tous les pays desservis, qui défile en continu. */
(function () {
  var band = document.getElementById('hhStats');
  var dest = window.TV_DEST || [], flags = window.TV_FLAGS || {};
  if (!band || !dest.length) return;
  var seen = {}, countries = [];
  dest.forEach(function (d) { if (d.country && flags[d.country] && !seen[d.country]) { seen[d.country] = 1; countries.push(d.country); } });
  if (!countries.length) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var item = function (c, hidden) {
    return '<li' + (hidden ? ' aria-hidden="true"' : '') + '><img src="/assets/flags/' + flags[c] + '.svg" alt="' + (hidden ? '' : 'Drapeau : ' + esc(c)) + '" width="36" height="27" decoding="async"><span>' + esc(c) + '</span></li>';
  };
  var list = countries.map(function (c) { return item(c, false); }).join('');
  var copy = countries.map(function (c) { return item(c, true); }).join('');
  band.classList.add('hh-flags');
  band.innerHTML = '<div class="wrap"><p class="hh-flags-head"><strong>' + dest.length + '</strong> destinations dans <strong>' + countries.length + '</strong> pays</p></div>' +
    '<div class="hh-flags-track" role="group" aria-label="Pays desservis"><ul class="hh-flags-row">' + list + copy + '</ul></div>';
  var row = band.querySelector('.hh-flags-row');
  row.style.setProperty('--n', countries.length);
})();
