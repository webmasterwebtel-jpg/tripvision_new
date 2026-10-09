/* Réservation d'un vol : TripVision ne vend pas de billet. Avant d'ouvrir le site de la compagnie,
   le visiteur laisse son adresse e-mail (obligatoire) ; sans e-mail valide, le site de la compagnie ne s'ouvre pas. */
(() => {
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const css = document.createElement('style');
  css.textContent = `
  .fg-ov{position:fixed;inset:0;z-index:100003;display:grid;place-items:center;padding:16px;background:rgba(5,18,14,.66);backdrop-filter:blur(5px);animation:fgIn .25s ease both}
  @keyframes fgIn{from{opacity:0}to{opacity:1}}
  .fg-card{position:relative;width:min(460px,100%);padding:28px 26px 24px;border-radius:22px;background:#fffdf8;box-shadow:0 36px 80px -24px rgba(0,0,0,.6);animation:fgUp .35s cubic-bezier(.2,1.2,.4,1) both}
  @keyframes fgUp{from{transform:translateY(16px) scale(.97);opacity:0}to{transform:none;opacity:1}}
  .fg-x{position:absolute;right:14px;top:12px;width:34px;height:34px;border:0;border-radius:50%;background:#f1ede4;color:#44505a;font-size:22px;line-height:1;cursor:pointer}
  .fg-ic{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:#e3f4ed;color:#075f4b;margin-bottom:12px}
  .fg-ic svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .fg-card h3{margin:0 0 6px;font:600 1.5rem/1.15 'Cormorant Garamond',Georgia,serif;color:#08271f}
  .fg-card p{margin:0 0 14px;color:#5f6a64;font-size:.93rem;line-height:1.5}
  .fg-route{display:flex;align-items:center;gap:8px;margin:0 0 14px;padding:10px 12px;border-radius:12px;background:#f6f2e9;font-size:.88rem;color:#3a423e}
  .fg-route b{color:#08271f}
  .fg-card label.fg-f{display:grid;gap:6px;font-size:.82rem;font-weight:600;color:#3a423e}
  .fg-card input[type=email]{width:100%;padding:13px 14px;border:1.5px solid #d9d2c3;border-radius:12px;font:inherit;font-size:1rem;background:#fff;color:#151816}
  .fg-card input[type=email]:focus{outline:none;border-color:#075f4b;box-shadow:0 0 0 4px rgba(7,95,75,.14)}
  .fg-card input.bad{border-color:#c0392b;box-shadow:0 0 0 4px rgba(192,57,43,.12);animation:fgShake .3s}
  @keyframes fgShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  .fg-err{min-height:18px;margin:6px 0 4px;color:#c0392b;font-size:.82rem}
  .fg-opt{display:flex;gap:10px;align-items:flex-start;margin:4px 0 16px;font-size:.84rem;color:#5f6a64;line-height:1.45;cursor:pointer}
  .fg-opt input{margin-top:2px;width:17px;height:17px;accent-color:#075f4b}
  .fg-go{width:100%;justify-content:center}
  .fg-note{margin:12px 0 0!important;text-align:center;font-size:.78rem!important;color:#8b948e!important}
  .fg-fallback{display:none;margin-top:12px;text-align:center;font-size:.88rem}
  .fg-fallback a{color:#075f4b;font-weight:600}`;
  document.head.appendChild(css);

  const offerOf = (id) => (typeof state !== 'undefined' ? state.flights.find((o) => String(o.id) === String(id)) : null);
  const known = () => { try { return JSON.parse(localStorage.getItem('tvContact') || 'null') || {}; } catch { return {}; } };

  function open(id) {
    const o = offerOf(id);
    const url = o?.flight?.bookingUrl;
    if (!o || !/^https?:\/\//i.test(url || '')) return;
    const airline = o.flight.airline || 'la compagnie';
    document.querySelector('.fg-ov')?.remove();
    const ov = document.createElement('div');
    ov.className = 'fg-ov';
    ov.innerHTML = `<form class="fg-card" novalidate role="dialog" aria-modal="true" aria-labelledby="fgTitle">
      <button type="button" class="fg-x" aria-label="Fermer" data-fg-close>×</button>
      <span class="fg-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg></span>
      <h3 id="fgTitle">Avant de rejoindre ${E(airline)}</h3>
      <p>Les billets se réservent directement sur le site de la compagnie. Indiquez votre adresse e-mail pour l’ouvrir.</p>
      <div class="fg-route"><svg class="tv-icon" aria-hidden="true" style="width:18px;height:18px"><use href="#i-plane"></use></svg><span><b>${E(o.from_city || '')} → ${E(o.to_city || '')}</b> · ${E(airline)}</span></div>
      <label class="fg-f">Votre adresse e-mail <input type="email" name="email" autocomplete="email" inputmode="email" placeholder="vous@exemple.fr" value="${E(known().email || '')}" required></label>
      <div class="fg-err" role="alert"></div>
      <label class="fg-opt"><input type="checkbox" name="consent" ${known().marketing ? 'checked' : ''}><span>Je souhaite recevoir, de temps en temps, les meilleures offres de vols par e-mail (facultatif).</span></label>
      <button class="btn fg-go" type="submit">Continuer vers ${E(airline)} ↗</button>
      <div class="fg-fallback">Si rien ne s’ouvre, <a href="${E(url)}" target="_blank" rel="noopener noreferrer">cliquez ici pour ouvrir le site de la compagnie</a>.</div>
      <p class="fg-note">Votre adresse n’est utilisée que pour vous recontacter au sujet de ce vol, jamais pour vous envoyer autre chose sans votre accord.</p>
    </form>`;
    document.body.appendChild(ov);
    const form = ov.querySelector('form'), input = form.elements.email, err = ov.querySelector('.fg-err');
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    ov.querySelector('[data-fg-close]').addEventListener('click', close);
    input.addEventListener('input', () => { input.classList.remove('bad'); err.textContent = ''; });
    setTimeout(() => { try { input.focus(); input.select(); } catch { /* rien */ } }, 60);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!MAIL.test(email)) {
        input.classList.add('bad');
        err.textContent = email ? 'Cette adresse e-mail ne semble pas valide.' : 'Votre adresse e-mail est obligatoire pour ouvrir le site de la compagnie.';
        input.focus();
        return;
      }
      // L'onglet de la compagnie est ouvert tout de suite (clic de l'utilisateur) puis dirigé vers le lien, sans bloquer sur le réseau.
      const tab = window.open('', '_blank');
      try { if (tab) tab.opener = null; } catch { /* rien */ }
      const consent = form.elements.consent.checked;
      try { localStorage.setItem('tvContact', JSON.stringify({ ...known(), email, marketing: consent })); } catch { /* rien */ }
      window.TVFX?.track('flight_click', o.id, o.to_city, o.country, `${o.from_city || ''} → ${o.to_city || ''}${o.flight?.airline ? ` · ${o.flight.airline}` : ''}`);
      const btn = form.querySelector('.fg-go');
      btn.disabled = true; btn.textContent = `Ouverture de ${airline}…`;
      try { await api('/public/flight-leads', { method: 'POST', body: JSON.stringify({ offerId: o.id, email, consent }) }); } catch { /* l'accès à la compagnie n'est pas bloqué par un incident réseau */ }
      if (tab && !tab.closed) { tab.location.href = url; close(); }
      else { ov.querySelector('.fg-fallback').style.display = 'block'; btn.disabled = false; btn.textContent = `Continuer vers ${airline} ↗`; }
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-flight-go]');
    if (b) { e.preventDefault(); open(b.dataset.flightGo); }
  });
})();
