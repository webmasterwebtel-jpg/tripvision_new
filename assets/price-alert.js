/* Alerte prix depuis le site : le visiteur se connecte (TVAuth), choisit son trajet et son prix maximum.
   L'alerte se retrouve ensuite dans son espace, rubrique « Mes alertes ».
   TVAlert.open({ fromCity, toCity, tripType, directOnly, maxPrice }) */
(() => {
  const css = `
  .tval{position:fixed;inset:0;z-index:10040;display:none;overflow-y:auto;overscroll-behavior:contain;padding:16px;background:rgba(14,28,24,.6);backdrop-filter:blur(3px)}
  .tval.open{display:block}
  .tval-card{position:relative;width:100%;max-width:480px;margin:max(16px,6vh) auto;background:#fff;border:1px solid #e4dfd6;border-radius:18px;padding:30px 28px 26px;box-shadow:0 24px 60px rgba(0,0,0,.25)}
  .tval-ic{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:#eef5f1;color:#0f3b2e;margin-bottom:12px}
  .tval-ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .tval-card h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;margin:0 0 6px;color:#0f3b2e}
  .tval-card p.lead{margin:0 0 18px;color:#5c6660;font-size:14.5px;line-height:1.55}
  .tval-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;background:#f3efe6;border-radius:50%;font-size:20px;cursor:pointer;line-height:1}
  .tval-card form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .tval-card label{display:grid;gap:6px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#5c6660}
  .tval-card label.full,.tval-card .full{grid-column:1/-1}
  .tval-card input:not([type=checkbox]),.tval-card select{padding:12px 13px;border:1px solid #d9d4c8;border-radius:12px;font:inherit;font-size:15px;font-weight:500;text-transform:none;letter-spacing:0;color:#16261f;background:#fff}
  .tval-card input:focus,.tval-card select:focus{outline:2px solid #c6a76b;outline-offset:1px}
  .tval-chk{display:flex!important;align-items:center;gap:12px!important;text-transform:none!important;letter-spacing:0!important;font-size:14px!important;font-weight:500!important;color:#33403b!important;cursor:pointer}
  .tval-chk input{width:22px;height:22px;margin:0;accent-color:#0d7a58;cursor:pointer}
  .tval-err{grid-column:1/-1;color:#a73535;font-size:13px;margin:0}
  .tval-err:empty{display:none}
  .tval-card .btn{grid-column:1/-1;width:100%;justify-content:center}
  .tval-ok{text-align:center}
  .tval-ok .tval-ic{margin:0 auto 12px;background:#0f3b2e;color:#fff}
  .tval-ok .btn{margin-top:8px}
  .tval-ok a.btn{display:inline-flex;width:100%;justify-content:center;text-decoration:none}
  .tval-note{margin:14px 0 0;font-size:12px;color:#7b857f;text-align:center}
  @media (max-width:520px){.tval-card{padding:26px 18px 20px}.tval-card form{grid-template-columns:1fr}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const API = () => window.GEO_API || '/api';
  let modal = null;

  function build() {
    modal = document.createElement('div');
    modal.className = 'tval'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'tvalTitle');
    modal.innerHTML = '<div class="tval-card"><button class="tval-x" type="button" aria-label="Fermer">×</button><div class="tval-body"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.tval-x') || e.target.closest('[data-tval-close]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }
  const close = () => modal?.classList.remove('open');

  function form(pre) {
    const body = modal.querySelector('.tval-body');
    body.innerHTML = `<span class="tval-ic">${BELL}</span><h2 id="tvalTitle">Créer une alerte prix</h2>
      <p class="lead">Nous surveillons les offres pour vous et vous prévenons par e-mail dès qu’un vol correspond.</p>
      <form novalidate>
        <label>Départ<input name="fromCity" maxlength="80" value="${esc(pre.fromCity)}" placeholder="Toutes villes"></label>
        <label>Destination<input name="toCity" required minlength="2" maxlength="80" value="${esc(pre.toCity)}" placeholder="Ex. Dakar"></label>
        <label>Billet<select name="tripType"><option value="any">Aller-retour ou aller simple</option><option value="roundtrip" ${pre.tripType === 'roundtrip' ? 'selected' : ''}>Aller-retour</option><option value="oneway" ${pre.tripType === 'oneway' ? 'selected' : ''}>Aller simple</option></select></label>
        <label>Prix max / pers.<input name="maxPrice" type="number" min="1" max="20000" step="1" inputmode="numeric" value="${esc(pre.maxPrice)}" placeholder="Tous les prix"></label>
        <label class="tval-chk full"><input type="checkbox" name="directOnly" ${pre.directOnly ? 'checked' : ''}> Vols directs uniquement</label>
        <p class="tval-err" role="alert"></p>
        <button class="btn" type="submit">Créer mon alerte</button>
      </form>
      <p class="tval-note">Vous gérez vos alertes depuis votre espace, rubrique « Mes alertes ».</p>`;
    const f = body.querySelector('form');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = f.querySelector('.tval-err'); err.textContent = '';
      const d = Object.fromEntries(new FormData(f));
      if (String(d.toCity || '').trim().length < 2) { err.textContent = 'Indiquez une destination.'; f.elements.toCity.focus(); return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Création…';
      try {
        const s = await window.TVAuth.require({ reason: 'Connectez-vous pour enregistrer votre alerte prix.' });
        const res = await fetch(`${API()}/client/alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
          body: JSON.stringify({ fromCity: String(d.fromCity || '').trim(), toCity: String(d.toCity).trim(), tripType: d.tripType, maxPrice: d.maxPrice ? Number(d.maxPrice) : null, directOnly: Boolean(d.directOnly) }) });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.error === 'FORBIDDEN') throw new Error('Les alertes prix sont réservées aux comptes voyageurs.');
        if (!res.ok) throw new Error(data.message || 'Impossible de créer l’alerte pour le moment.');
        done(d);
      } catch (ex) {
        if (ex && ex.message) err.textContent = ex.message === 'CLOSED' ? '' : ex.message;
        btn.disabled = false; btn.textContent = 'Créer mon alerte';
      }
    });
  }
  function done(d) {
    modal.querySelector('.tval-body').innerHTML = `<div class="tval-ok"><span class="tval-ic">${CHECK}</span><h2 id="tvalTitle">Alerte créée</h2>
      <p class="lead">Nous vous écrivons dès qu’un vol ${d.fromCity ? `${esc(d.fromCity)} → ` : 'vers '}${esc(d.toCity)}${d.maxPrice ? ` à ${esc(d.maxPrice)} € ou moins` : ''} est publié.</p>
      <a class="btn" href="/espace/#alerts">Voir mes alertes</a><button class="btn ghost" type="button" data-tval-close>Continuer</button></div>`;
  }

  window.TVAlert = {
    // Connexion d'abord, puis le formulaire : une alerte appartient toujours à un compte voyageur.
    async open(pre = {}) {
      if (!window.TVAuth) return;
      try { await window.TVAuth.require({ reason: 'Connectez-vous ou créez votre compte pour être prévenu dès qu’un vol correspond à votre trajet.' }); }
      catch { return; }
      if (!modal) build();
      form({ fromCity: '', toCity: '', tripType: 'any', directOnly: false, maxPrice: '', ...pre });
      modal.classList.add('open');
      setTimeout(() => modal.querySelector(pre.toCity ? 'input[name=maxPrice]' : 'input[name=toCity]')?.focus(), 30);
    },
  };
})();
