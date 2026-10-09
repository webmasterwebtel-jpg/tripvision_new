/* Page unique d'activation / réinitialisation du mot de passe (clients, partenaires et équipe). */
(() => {
  const $ = (s) => document.querySelector(s);
  const token = new URLSearchParams(location.search).get('token') || '';
  const show = (id) => ['loading', 'form', 'done', 'invalid'].forEach((k) => { $('#' + k).hidden = k !== id; });
  history.replaceState(null, '', location.pathname);
  const TARGET = { partner: '/#partner', client: '/#login', it: '/backoffice/', admin: '/backoffice/', manager: '/backoffice/' };
  (async () => {
    try {
      const r = await fetch(`/api/auth/token-info?token=${encodeURIComponent(token)}`);
      if (!r.ok) throw new Error();
      const info = await r.json();
      $('#who').textContent = `${info.name} · ${info.email}`;
      if (info.purpose === 'reset') $('#eyebrow').textContent = 'Réinitialisation';
      window.TVPassword?.enhance(document);
      show('form');
    } catch { show('invalid'); }
  })();
  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, err = $('#err'), btn = f.querySelector('button');
    err.hidden = true;
    if (f.password.value !== f.confirm.value) { err.textContent = 'Les deux mots de passe ne correspondent pas.'; err.hidden = false; return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/auth/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: f.password.value }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.error === 'INVALID_LINK') return show('invalid');
        throw new Error(d.message || (d.error === 'WEAK_PASSWORD' ? 'Le mot de passe ne respecte pas les règles de sécurité.' : 'Impossible d’enregistrer le mot de passe.'));
      }
      try { sessionStorage.setItem('tv_login_email', d.email); } catch { /* stockage indisponible */ }
      const href = TARGET[d.role] || '/';
      $('#goto').href = href;
      $('#goto').textContent = d.role === 'partner' ? 'Aller à la connexion partenaire' : ['it', 'admin', 'manager'].includes(d.role) ? 'Aller au back-office' : 'Aller à la connexion';
      $('#doneText').textContent = 'Votre mot de passe est enregistré. Vous allez être redirigé vers la page de connexion.';
      show('done');
      setTimeout(() => { location.href = href; }, 2500);
    } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
  });
})();
