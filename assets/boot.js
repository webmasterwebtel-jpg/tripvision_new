/* Affiche tout de suite la page demandée par l'adresse (évite l'éclair de la page d'accueil à l'actualisation). */
(function () {
  var id = (location.hash || '').slice(1);
  if (id === 'client' || id === 'admin' || id === 'admin-login') id = 'login';
  if (['home', 'flights', 'cars', 'reserve', 'packs', 'login', 'partner', 'contact'].indexOf(id) > -1) document.documentElement.setAttribute('data-boot', id);
  setTimeout(function () { document.documentElement.removeAttribute('data-boot'); }, 6000);
})();
