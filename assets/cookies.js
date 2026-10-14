/* Bandeau de consentement aux cookies et traceurs.
   - Indispensables (connexion, panier de recherche) : toujours actifs, sans consentement.
   - Mesure d'audience anonyme (pages vues, clics, recherches) : seulement si le visiteur accepte.
   Le choix est gardé 6 mois dans ce navigateur et peut être changé à tout moment via « Gérer les cookies » en bas de page. */
(function () {
  'use strict';
  var KEY = 'tvConsent', MONTHS = 6;
  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && v.at && Date.now() - v.at < MONTHS * 30 * 864e5 && typeof v.analytics === 'boolean') return v;
    } catch (e) { /* stockage indisponible */ }
    return null;
  }
  function save(analytics) {
    try { localStorage.setItem(KEY, JSON.stringify({ analytics: analytics, at: Date.now() })); } catch (e) { /* rien */ }
  }
  window.TVConsent = { allowed: function () { var c = read(); return !!(c && c.analytics); }, open: show };

  function close() { var b = document.getElementById('cookieBanner'); if (b) b.remove(); }
  function choose(analytics) { save(analytics); close(); }

  function show() {
    close();
    var b = document.createElement('div');
    b.id = 'cookieBanner';
    b.className = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.setAttribute('aria-label', 'Cookies et confidentialité');
    b.innerHTML =
      '<div class="cookie-text"><strong>Vos données, vos choix</strong>' +
      '<p>TripVision utilise des cookies et traceurs indispensables au fonctionnement du site (connexion, recherches). Avec votre accord, nous mesurons aussi de façon anonyme les pages vues, les clics et les recherches pour améliorer nos offres. ' +
      '<a href="#privacy" data-page-link="privacy">En savoir plus</a></p></div>' +
      '<div class="cookie-actions"><button type="button" class="btn ghost" data-cookie="no">Tout refuser</button>' +
      '<button type="button" class="btn" data-cookie="yes">Tout accepter</button></div>';
    b.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie]');
      if (t) return choose(t.getAttribute('data-cookie') === 'yes');
      if (e.target.closest('[data-page-link]')) { /* le routeur du site ouvre la page ; le bandeau reste affiché */ }
    });
    document.body.appendChild(b);
  }

  function init() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-cookie-settings]');
      if (a) { e.preventDefault(); show(); }
    });
    if (!read()) show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
