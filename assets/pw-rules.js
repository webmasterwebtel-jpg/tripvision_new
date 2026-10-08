/* Mots de passe : bouton afficher / masquer sur tous les champs + règles en direct.
   TVPassword.enhance(root)  → ajoute l'œil à chaque input[type=password] et la liste de règles aux input[data-pw-rules]. */
(() => {
  const RULES = [
    ['len', 'Au moins 14 caractères', (v) => v.length >= 14],
    ['low', 'Au moins une minuscule', (v) => /[a-z]/.test(v)],
    ['up', 'Au moins une majuscule', (v) => /[A-Z]/.test(v)],
    ['num', 'Au moins un chiffre', (v) => /\d/.test(v)],
    ['sym', 'Au moins un caractère spécial (! @ # $ % & * ? - _ + = …)', (v) => /[^a-zA-Z0-9]/.test(v)],
  ];
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6C3.9 9.3 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  const css = document.createElement('style');
  css.textContent = `
  .tvpw{position:relative;display:block}
  .tvpw>input{padding-right:48px!important;width:100%}
  .tvpw-eye{position:absolute;right:6px;top:50%;width:38px;height:38px;transform:translateY(-50%);display:grid;place-items:center;border:0;border-radius:8px;background:none;color:#7b857f;cursor:pointer;padding:0}
  .tvpw-eye:hover{color:#1f2a24;background:rgba(0,0,0,.05)}
  .tvpw-eye svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .tvpw-rules{margin:6px 0 2px;padding:14px 16px;border:1px solid #ddd6c9;border-radius:12px;background:#fff;font-size:12.5px;line-height:1.4;text-align:left;text-transform:none;letter-spacing:0;font-weight:400;color:#4c4742;grid-column:1/-1}
  .tvpw-meter{display:flex;gap:5px;margin-bottom:12px}
  .tvpw-meter i{flex:1;height:5px;border-radius:99px;background:#e4dfd6;transition:background .2s}
  .tvpw-meter[data-score="1"] i:nth-child(-n+1),.tvpw-meter[data-score="2"] i:nth-child(-n+2){background:#d4574d}
  .tvpw-meter[data-score="3"] i:nth-child(-n+3),.tvpw-meter[data-score="4"] i:nth-child(-n+4){background:#d9a13b}
  .tvpw-meter[data-score="5"] i{background:#2a7a52}
  .tvpw-title{display:flex;justify-content:space-between;margin:0 0 8px;font-weight:600;color:#1f2a24}
  .tvpw-rules ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
  .tvpw-rules li{display:flex;align-items:center;gap:9px;color:#7b857f}
  .tvpw-rules li b{flex:0 0 18px;height:18px;border-radius:50%;border:1.5px solid currentColor;display:grid;place-items:center;transition:background .2s,border-color .2s}
  .tvpw-rules li b::after{content:"";width:5px;height:9px;margin-top:-2px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) scale(0);transition:transform .18s}
  .tvpw-rules li.ok{color:#2a7a52;font-weight:600}
  .tvpw-rules li.ok b{background:#2a7a52;border-color:#2a7a52}
  .tvpw-rules li.ok b::after{transform:rotate(45deg) scale(1)}`;
  document.head.appendChild(css);

  function eye(input) {
    if (input.dataset.tvpw || input.closest('.tvpw, .pw, .password-field')) return;
    input.dataset.tvpw = '1';
    const wrap = document.createElement('span');
    wrap.className = 'tvpw';
    input.replaceWith(wrap);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tvpw-eye';
    btn.setAttribute('aria-label', 'Afficher le mot de passe');
    btn.innerHTML = EYE;
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? EYE_OFF : EYE;
      btn.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    });
    wrap.appendChild(btn);
  }

  function rules(input) {
    if (input.dataset.rules) return;
    input.dataset.rules = '1';
    const box = document.createElement('div');
    box.className = 'tvpw-rules';
    box.setAttribute('aria-live', 'polite');
    box.innerHTML = `<div class="tvpw-meter" data-score="0">${'<i></i>'.repeat(RULES.length)}</div>
      <p class="tvpw-title"><span>Votre mot de passe doit contenir :</span><span class="tvpw-count">0/${RULES.length}</span></p>
      <ul>${RULES.map(([id, label]) => `<li data-rule="${id}"><b></b>${label}</li>`).join('')}</ul>`;
    const anchor = input.closest('.tvpw, .pw, .password-field') || input;
    (anchor.closest('label') || anchor).insertAdjacentElement('afterend', box);
    const form = input.form;
    const submit = form?.querySelector('button[type=submit]');
    const update = () => {
      let score = 0;
      RULES.forEach(([id, , test]) => {
        const ok = test(input.value);
        if (ok) score++;
        box.querySelector(`[data-rule="${id}"]`).classList.toggle('ok', ok);
      });
      box.querySelector('.tvpw-meter').dataset.score = score;
      box.querySelector('.tvpw-count').textContent = `${score}/${RULES.length}`;
      input.setCustomValidity(score === RULES.length ? '' : 'Le mot de passe ne respecte pas toutes les exigences.');
    };
    input.addEventListener('input', update);
    form?.addEventListener('reset', () => setTimeout(update, 0));
    update();
  }

  function enhance(root = document) {
    root.querySelectorAll('input[type=password]').forEach(eye);
    root.querySelectorAll('input[data-pw-rules]').forEach(rules);
  }

  window.TVPassword = { enhance, RULES, problem: (v) => RULES.find(([, , t]) => !t(v))?.[1] || null };
})();
