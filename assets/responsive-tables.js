/* Tableaux du back-office et de l'espace partenaire : chaque cellule reçoit l'intitulé de sa colonne
   (data-label) pour que le CSS puisse afficher les lignes sous forme de cartes sur téléphone. */
(() => {
  const label = (table) => {
    const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    if (!heads.length) return;
    table.querySelectorAll('tbody tr').forEach((tr) => {
      [...tr.children].forEach((td, i) => {
        if (td.tagName !== 'TD' || td.hasAttribute('colspan')) return;
        if (!td.dataset.label && heads[i]) td.dataset.label = heads[i];
      });
    });
  };
  let raf = 0;
  const run = () => { raf = 0; document.querySelectorAll('table').forEach(label); };
  new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(run); }).observe(document.body, { childList: true, subtree: true });
  run();
})();
