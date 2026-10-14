/* Consentement aux cookies et traceurs : choix obligatoire (accepter ou refuser) avant d'utiliser le site.
   - Indispensables (connexion, panier de recherche) : toujours actifs, sans consentement.
   - Mesure d'audience anonyme (pages vues, clics, recherches) : seulement si le visiteur accepte.
   Tant que le visiteur n'a pas choisi, une fenêtre bloque le site ; seule la page « Politique de confidentialité » reste lisible
   (le bandeau passe alors en bas de page). Le choix est gardé 6 mois et se change via « Gérer les cookies » en bas de page. */
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

  var lastFocus = null;
  function wall() { return document.getElementById('cookieWall'); }
  function close() {
    var w = wall(); if (w) w.remove();
    document.documentElement.classList.remove('cookie-lock');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* rien */ } }
  }
  function choose(analytics) { save(analytics); close(); }
  // Sur la page de confidentialité, la fenêtre se range en bas pour laisser lire.
  function sync() {
    var w = wall(); if (!w) return;
    var peek = location.hash === '#privacy';
    w.classList.toggle('peek', peek);
    document.documentElement.classList.toggle('cookie-lock', !peek);
    w.querySelector('.cookie-banner').setAttribute('aria-modal', peek ? 'false' : 'true');
  }

  function show() {
    close();
    lastFocus = document.activeElement;
    var w = document.createElement('div');
    w.id = 'cookieWall';
    w.className = 'cookie-wall';
    w.innerHTML =
      '<div class="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookieTitle">' +
      '<div class="cookie-text"><strong id="cookieTitle">Vos données, vos choix</strong>' +
      '<p>TripVision utilise des cookies et traceurs indispensables au fonctionnement du site (connexion, recherches). Avec votre accord, nous mesurons aussi de façon anonyme les pages vues, les clics et les recherches pour améliorer nos offres. ' +
      'Pour accéder au site, merci d’accepter ou de refuser cette mesure d’audience. <a href="#privacy">Lire la politique de confidentialité</a></p></div>' +
      '<div class="cookie-actions"><button type="button" class="btn ghost" data-cookie="no">Tout refuser</button>' +
      '<button type="button" class="btn" data-cookie="yes">Tout accepter</button></div></div>';
    w.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie]');
      if (t) choose(t.getAttribute('data-cookie') === 'yes');
    });
    // Le clavier ne sort pas de la fenêtre tant qu'elle bloque le site.
    w.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || w.classList.contains('peek')) return;
      var f = w.querySelectorAll('a[href], button'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.body.appendChild(w);
    sync();
    var b = w.querySelector('[data-cookie=yes]'); if (b) b.focus({ preventScroll: true });
  }

  function init() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-cookie-settings]');
      if (a) { e.preventDefault(); show(); }
    });
    window.addEventListener('hashchange', sync);
    if (!read()) show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
