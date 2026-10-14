// Contrôle de sécurité et de référencement d'un site en ligne ou local :  node php/tools/security-check.mjs https://www.tripvision.fr
const base = (process.argv[2] || 'http://localhost:8770').replace(/\/$/, '');
let fails = 0;
const get = (p, init) => fetch(base + p, { redirect: 'manual', ...init });
const ok = (name, cond, info = '') => { console.log(`${cond ? 'OK   ' : 'ECHEC'}  ${name}${info ? '  — ' + info : ''}`); if (!cond) fails++; };

const home = await get('/');
const h = (r, k) => r.headers.get(k) || '';
ok('Accueil répond 200', home.status === 200, String(home.status));
for (const k of ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy']) ok(`En-tête ${k}`, !!h(home, k));
if (base.startsWith('https')) ok('HSTS actif', !!h(home, 'strict-transport-security'));
ok('Pas de X-Powered-By', !h(home, 'x-powered-by'));
const html = await home.text();
ok('Titre, description et adresse canonique', /<title>.+<\/title>/.test(html) && /name="description"/.test(html) && /rel="canonical"/.test(html));
ok('Balises de partage (og:image, twitter)', /og:image/.test(html) && /twitter:card/.test(html));
ok('Données structurées JSON-LD', /application\/ld\+json/.test(html));

for (const p of ['/app/.env', '/app/core.php', '/.env', '/.git/config', '/core.php', '/bootstrap.php', '/app/', '/php/src/core.php', '/%2e%2e/app/.env', '/..%2fapp%2f.env', '/api.php.bak', '/DEPLOIEMENT.md']) {
  const r = await get(p); const t = await r.text();
  ok(`Inaccessible : ${p}`, r.status >= 400 && !/DB_PASSWORD|JWT_SECRET|<\?php/.test(t), String(r.status));
}
for (const p of ['/backoffice/', '/espace/', '/activation/']) { const r = await get(p); ok(`noindex : ${p}`, /noindex/i.test(h(r, 'x-robots-tag') + (await r.text()).slice(0, 4000))); }
const r404 = await get('/destination/zzz'); ok('Destination inconnue : 404 + noindex', r404.status === 404 && /noindex/.test(await r404.text()));
const robots = await (await get('/robots.txt')).text(); ok('robots.txt avec plan du site', /Sitemap: https?:\/\/.+\/sitemap\.xml/.test(robots) && /Disallow: \/api\//.test(robots));
const sm = await (await get('/sitemap.xml')).text(); const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok('sitemap.xml valide', locs.length > 10 && /<urlset/.test(sm), `${locs.length} adresses`);
ok('Pages « bientôt disponible » absentes du plan', !locs.some((l) => /\/(voitures|week-ends)$/.test(l)));
let bad = 0; for (const l of locs.slice(0, 80)) { const r = await get(new URL(l).pathname); if (r.status !== 200) bad++; } ok('Toutes les adresses du plan répondent 200', bad === 0, `${bad} en erreur`);

const cors = await get('/api/public/offers', { headers: { Origin: 'https://evil.example' } });
ok('CORS : site tiers refusé', !h(cors, 'access-control-allow-origin'), h(cors, 'access-control-allow-origin'));
for (const [name, p] of [['injection SQL (paramètre)', "/api/public/cities?q=%27%20OR%201%3D1%3B--"], ['injection dans l\'adresse', "/api/public/offers?type=%27%3B%20DROP%20TABLE%20users%3B--"], ['traversal API', '/api/../app/.env'], ['uploads invalides', '/uploads/..%2f..%2fetc%2fpasswd']]) {
  const r = await get(p); ok(`Pas d'erreur serveur : ${name}`, r.status < 500, String(r.status));
}
const a = await get('/api/admin/dashboard'); ok('API admin sans jeton refusée', a.status === 401 || a.status === 403, String(a.status));
const lg = await get('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"email":"x@x.fr","password":"x"}' }); ok('Connexion erronée refusée (pas de 500)', lg.status === 401 || lg.status === 400 || lg.status === 429, String(lg.status));
console.log(fails ? `\n${fails} point(s) à corriger` : '\nTout est conforme');
process.exit(fails ? 1 : 0);
