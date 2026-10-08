/* Connexion / création de compte au moment de réserver une voiture ou un pack.
   La session reste en mémoire le temps de la réservation : rien n'est conservé sur le site public.
   TVAuth.require({ reason }) → Promise<{ token, user }> (rejeté si l'utilisateur ferme la fenêtre). */
(() => {
  const css = `
  .tvga{position:fixed;inset:0;z-index:10050;display:none;overflow-y:auto;overscroll-behavior:contain;padding:16px;background:rgba(14,28,24,.6);backdrop-filter:blur(3px)}
  html.tv-lock,html.tv-lock body{overflow:hidden!important}
  .tvga.open{display:block}
  .tvga-card{position:relative;width:100%;max-width:440px;margin:max(16px,5vh) auto;background:#fff;border:1px solid #e4dfd6;padding:30px 28px 26px;box-shadow:0 24px 60px rgba(0,0,0,.25)}
  .tvga-card h2{font-family:Georgia,serif;font-size:25px;margin:0 0 6px;color:#0f3b2e}
  .tvga-card p.lead{margin:0 0 18px;color:#5c6660;font-size:14.5px;line-height:1.55}
  .tvga-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;background:#f3efe6;border-radius:50%;font-size:20px;cursor:pointer;line-height:1}
  .tvga-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid #d9d4c8;margin-bottom:18px}
  .tvga-tabs button{padding:11px;border:0;background:#fff;font-weight:600;cursor:pointer;color:#5c6660}
  .tvga-tabs button.on{background:#0f3b2e;color:#fff}
  .tvga-card form{display:grid;gap:12px}
  .tvga-card label{display:grid;gap:5px;font-size:13px;font-weight:600;color:#33403b}
  .tvga-card input:not([type=checkbox]){padding:12px 13px;border:1px solid #cfc9bb;font:inherit;font-weight:400}
  .tvga-card .tvga-chk{display:flex;gap:9px;align-items:flex-start;font-weight:400;font-size:12.5px;color:#5c6660;line-height:1.45}
  .tvga-card .tvga-chk input{margin-top:2px}
  .tvga-err{color:#a73535;font-size:13px;min-height:0;margin:0}
  .tvga-card .btn{width:100%;justify-content:center}
  .tvga-card .btn:disabled{opacity:.45;cursor:not-allowed;filter:grayscale(.4)}
  .tvga-ok{padding:14px 16px;background:#eef5f1;border-left:3px solid #0f3b2e;font-size:14px;line-height:1.55;color:#1d3a2f}
  .tvga-link{background:none;border:0;padding:0;color:#0f3b2e;text-decoration:underline;font:inherit;cursor:pointer}
  .tvga-note{margin:14px 0 0;font-size:12px;color:#7b857f;text-align:center}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const API = () => window.GEO_API || '/api';
  const call = async (path, body) => {
    const res = await fetch(`${API()}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'ERROR'); e.detail = data.message; throw e; }
    return data;
  };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MSG = {
    INVALID_CREDENTIALS: 'E-mail ou mot de passe incorrect.', TOO_MANY_ATTEMPTS: 'Trop de tentatives, réessayez plus tard.',
    EMAIL_EXISTS: 'Un compte existe déjà avec cet e-mail : connectez-vous.', WEAK_PASSWORD: 'Le mot de passe ne respecte pas les règles de sécurité.',
  };

  let session = null, modal = null, pending = null;
  const close = (ok) => { modal?.classList.remove('open'); sync(); if (pending) { ok ? pending.resolve(ok) : pending.reject(new Error('CANCELLED')); pending = null; } };

  function build() {
    modal = document.createElement('div'); modal.className = 'tvga';
    modal.innerHTML = `<div class="tvga-card" role="dialog" aria-modal="true" aria-labelledby="tvgaTitle"><button class="tvga-x" type="button" aria-label="Fermer">×</button>
      <h2 id="tvgaTitle">Votre compte TripVision</h2><p class="lead" id="tvgaLead"></p>
      <div class="tvga-tabs"><button type="button" data-t="login" class="on">Se connecter</button><button type="button" data-t="signup">Créer un compte</button></div>
      <form data-f="login"><label>E-mail<input name="email" type="email" required autocomplete="email"></label><label>Mot de passe<input name="password" type="password" required autocomplete="current-password"></label><p class="tvga-err"></p><button class="btn" type="submit">Continuer</button></form>
      <form data-f="signup" hidden><label>Nom complet<input name="name" required minlength="2" autocomplete="name"></label><label>E-mail<input name="email" type="email" required autocomplete="email"></label><label>Mot de passe<input name="password" type="password" required minlength="8" data-pw-rules autocomplete="new-password"></label>
        <label class="tvga-chk"><input type="checkbox" name="terms" required> J’ai lu et j’accepte les conditions d’utilisation de TripVision et la gestion de mes données pour traiter mes réservations.</label><p class="tvga-err"></p><button class="btn" type="submit" disabled>Créer mon compte</button></form>
      <div class="tvga-ok" data-sent hidden></div>
      <p class="tvga-note">Votre session n’est conservée que le temps de cette réservation.</p></div>`;
    document.body.appendChild(modal);
    window.TVPassword?.enhance(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.tvga-x')) close(null); });
    const signup = modal.querySelector('form[data-f="signup"]');
    signup.elements.terms.addEventListener('change', () => { signup.querySelector('button[type=submit]').disabled = !signup.elements.terms.checked; });
    modal.querySelectorAll('.tvga-tabs button').forEach(b => b.onclick = () => {
      modal.querySelectorAll('.tvga-tabs button').forEach(x => x.classList.toggle('on', x === b));
      modal.querySelectorAll('form').forEach(f => { f.hidden = f.dataset.f !== b.dataset.t; });
      modal.querySelector('[data-sent]').hidden = true;
    });
    modal.querySelectorAll('form').forEach(f => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = f.querySelector('.tvga-err'), btn = f.querySelector('button[type=submit]'), label = btn.textContent;
      err.textContent = ''; btn.disabled = true; btn.textContent = 'Un instant…';
      try {
        const fd = Object.fromEntries(new FormData(f));
        let data;
        if (f.dataset.f === 'login') data = await call('/auth/login', { email: fd.email, password: fd.password });
        else {
          const r = await call('/auth/register-client', { name: fd.name, email: fd.email, password: fd.password });
          const box = modal.querySelector('[data-sent]');
          box.innerHTML = `Un e-mail d’activation vient d’être envoyé à <b>${esc(r.email)}</b>. Cliquez sur le lien reçu, puis revenez ici pour vous connecter. Rien de ce que vous avez saisi n’est perdu.`;
          box.hidden = false;
          const lf = modal.querySelector('form[data-f="login"]'); lf.elements.email.value = r.email;
          f.reset(); f.querySelector('button[type=submit]').disabled = true;
          modal.querySelector('.tvga-tabs [data-t="login"]').click(); box.hidden = false;
          return;
        }
        if (data.user.role !== 'client') throw new Error('NOT_CLIENT');
        session = { token: data.token, user: data.user };
        f.reset(); close(session);
      } catch (ex) {
        if (ex.message === 'EMAIL_NOT_VERIFIED') {
          err.innerHTML = 'Votre compte n’est pas encore activé : cliquez sur le lien reçu par e-mail. <button type="button" class="tvga-link">Renvoyer le lien</button>';
          err.querySelector('button').onclick = async () => { try { await call('/auth/resend-verification', { email: f.elements.email.value }); err.textContent = 'Un nouveau lien vient de vous être envoyé.'; } catch { err.textContent = 'Réessayez dans quelques minutes.'; } };
          return;
        }
        err.textContent = ex.message === 'NOT_CLIENT' ? 'Ce compte n’est pas un compte client.' : (MSG[ex.message] || ex.detail || 'Une erreur est survenue, réessayez.');
      } finally { btn.disabled = false; btn.textContent = label; }
    }));
  }

  window.TVAuth = {
    get session() { return session; },
    headers() { return session ? { Authorization: `Bearer ${session.token}` } : {}; },
    reset() { session = null; },
    require({ reason = '', tab = 'login' } = {}) {
      if (session) return Promise.resolve(session);
      if (!modal) build();
      modal.querySelector('#tvgaLead').textContent = reason || 'Connectez-vous ou créez un compte pour continuer.';
      modal.querySelector(`.tvga-tabs [data-t="${tab}"]`).click();
      modal.classList.add('open'); sync();
      setTimeout(() => modal.querySelector('form:not([hidden]) input')?.focus(), 30);
      return new Promise((resolve, reject) => { pending = { resolve, reject }; });
    },
  };

  /* Quand une fenêtre est ouverte (connexion, détail, conditions de location…), la page derrière ne défile plus. */
  function sync() {
    const open = document.querySelector('.modal.open, .tvga.open');
    document.documentElement.classList.toggle('tv-lock', Boolean(open));
  }
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
})();
