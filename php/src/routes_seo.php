<?php
declare(strict_types=1);
/* Référencement : pages à adresses propres (/vols, /destination/dakar…), balises de partage, données structurées, robots.txt et plan du site.
   Le site reste une seule page côté navigateur ; chaque adresse ci-dessous renvoie la même page avec son titre, sa description et son adresse canonique. */

/** Pages encore « Bientôt disponible » : non indexées et absentes du plan du site. Retirer l'adresse d'ici au lancement. */
const SEO_SOON = ['/voitures', '/week-ends'];

const SEO_PAGES = [
    '/' => ['TripVision | Vols pas chers, week-ends et locations de voiture', 'TripVision déniche chaque jour les vols les moins chers au départ de la France. Réservez directement auprès de la compagnie, au même prix, et retrouvez bientôt les week-ends tout organisés et les locations de voiture.', 1.0, 'daily'],
    '/vols' => ['Vols pas chers depuis la France | TripVision', 'Les vols les moins chers sélectionnés par notre équipe : Dakar, Abidjan, Marrakech, Bali… Prix vérifié, même trajet et mêmes dates, réservation directe sur le site de la compagnie.', 0.9, 'daily'],
    '/voitures' => ['Location de voiture : bientôt disponible | TripVision', 'Les locations de voiture TripVision arrivent : enseignes vérifiées, prix total affiché d’avance. Laissez votre e-mail pour être prévenu à l’ouverture.', 0.3, 'monthly'],
    '/week-ends' => ['Week-ends tout organisés : bientôt disponibles | TripVision', 'Les week-ends TripVision arrivent : transport et hôtel réservés ensemble, payés en ligne. Laissez votre e-mail pour être prévenu à l’ouverture.', 0.3, 'monthly'],
    '/contact' => ['Contact | TripVision', 'Une question sur un vol, une réservation ou le site ? Écrivez à l’équipe TripVision, elle vous répond rapidement.', 0.5, 'yearly'],
    '/mentions-legales' => ['Mentions légales | TripVision', 'Mentions légales du site tripvision.fr : éditeur, responsabilité, propriété intellectuelle et contact.', 0.2, 'yearly'],
    '/politique-de-confidentialite' => ['Politique de confidentialité | TripVision', 'Comment TripVision collecte, utilise et protège vos données personnelles (RGPD) : finalités, durées de conservation et exercice de vos droits.', 0.2, 'yearly'],
];

function seo_root(): string
{
    foreach ([dirname(TV_APP), dirname(TV_APP, 2)] as $d) if (is_file($d . '/index.html')) return $d;
    return dirname(TV_APP);
}
function seo_destinations(): array
{
    static $list = null;
    if ($list === null) $list = json_decode((string)@file_get_contents(TV_APP . '/data/destinations.json'), true) ?: [];
    return $list;
}
function seo_destination(string $slug): ?array
{
    foreach (seo_destinations() as $d) if ($d['slug'] === $slug) return $d;
    return null;
}
function seo_h(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function seo_json(array $d): string { return str_replace('</', '<\/', json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); }

/** Page d'application avec son <head> propre à l'adresse demandée. */
function seo_page(string $path, string $title, string $desc, bool $index = true, array $jsonld = [], int $status = 200): never
{
    $html = (string)@file_get_contents(seo_root() . '/index.html');
    if ($html === '') fail(404, 'NOT_FOUND');
    $base = app_url();
    $url = $base . ($path === '/' ? '/' : $path);
    $img = $base . '/assets/og-tripvision.jpg';
    $head = "\n  <link rel=\"canonical\" href=\"" . seo_h($url) . "\" />\n"
        . '  <meta name="robots" content="' . ($index ? 'index,follow,max-image-preview:large' : 'noindex,follow') . "\" />\n"
        . '  <meta name="theme-color" content="#0f3b2e" />' . "\n"
        . '  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png" />' . "\n"
        . '  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />' . "\n"
        . '  <meta property="og:type" content="website" />' . "\n"
        . '  <meta property="og:site_name" content="TripVision" />' . "\n"
        . '  <meta property="og:locale" content="fr_FR" />' . "\n"
        . '  <meta property="og:title" content="' . seo_h($title) . "\" />\n"
        . '  <meta property="og:description" content="' . seo_h($desc) . "\" />\n"
        . '  <meta property="og:url" content="' . seo_h($url) . "\" />\n"
        . '  <meta property="og:image" content="' . seo_h($img) . "\" />\n"
        . '  <meta property="og:image:width" content="1200" />' . "\n" . '  <meta property="og:image:height" content="630" />' . "\n"
        . '  <meta name="twitter:card" content="summary_large_image" />' . "\n"
        . '  <meta name="twitter:title" content="' . seo_h($title) . "\" />\n"
        . '  <meta name="twitter:description" content="' . seo_h($desc) . "\" />\n"
        . '  <meta name="twitter:image" content="' . seo_h($img) . "\" />\n";
    foreach ($jsonld as $block) $head .= '  <script type="application/ld+json">' . seo_json($block) . "</script>\n";
    $html = preg_replace('#<title>.*?</title>#s', '<title>' . seo_h($title) . '</title>', $html, 1);
    $html = preg_replace('#<meta name="description"[^>]*>#', '<meta name="description" content="' . seo_h($desc) . '" />', $html, 1);
    $html = preg_replace('#</head>#', $head . '</head>', $html, 1);
    // Liens réels (explorables par les moteurs) : le clic reste géré par le site, l'adresse du lien sert à l'ouverture dans un nouvel onglet et au référencement.
    $real = ['home' => '/', 'flights' => '/vols', 'cars' => '/voitures', 'packs' => '/week-ends', 'contact' => '/contact', 'legal' => '/mentions-legales', 'privacy' => '/politique-de-confidentialite'];
    $html = preg_replace_callback('#href="\#([a-z]+)" data-page-link=""#', fn($m) => isset($real[$m[1]]) ? 'href="' . $real[$m[1]] . '" data-page-link="' . $m[1] . '"' : $m[0], $html);
    $links = '';
    foreach (['/vols' => 'Vols', '/voitures' => 'Voitures', '/week-ends' => 'Week-ends', '/contact' => 'Contact', '/mentions-legales' => 'Mentions légales', '/politique-de-confidentialite' => 'Politique de confidentialité'] as $href => $label) $links .= '<a href="' . $href . '">' . $label . '</a> ';
    if ($path === '/' || $path === '/vols') foreach (seo_destinations() as $d) $links .= '<a href="/destination/' . seo_h($d['slug']) . '">Vols vers ' . seo_h($d['name']) . '</a> ';
    $html = preg_replace('#<body([^>]*)>#', '<body$1><noscript><nav aria-label="Plan du site"><h1>' . seo_h($title) . '</h1><p>' . seo_h($desc) . '</p>' . $links . '</nav></noscript>', $html, 1);
    throw new HttpExit($status, $html, 'html', ['Cache-Control' => 'public, max-age=300']);
}

function seo_org(): array
{
    $base = app_url();
    return [
        ['@context' => 'https://schema.org', '@type' => 'Organization', 'name' => 'TripVision', 'url' => $base . '/', 'logo' => $base . '/assets/tripvision-logo-original.png', 'email' => 'hello@tripvision.fr', 'description' => 'Bons plans vols, week-ends et locations de voiture au départ de la France.'],
        ['@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => 'TripVision', 'url' => $base . '/', 'inLanguage' => 'fr-FR'],
    ];
}

foreach (array_keys(SEO_PAGES) as $p) {
    route('GET', $p, function () use ($p) {
        [$title, $desc] = SEO_PAGES[$p];
        $soon = in_array($p, SEO_SOON, true);
        $ld = $p === '/' ? seo_org() : [['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => [['@type' => 'ListItem', 'position' => 1, 'name' => 'Accueil', 'item' => app_url() . '/'], ['@type' => 'ListItem', 'position' => 2, 'name' => explode(' | ', $title)[0], 'item' => app_url() . $p]]]];
        seo_page($p, $title, $desc, !$soon, $ld);
    });
}
route('GET', '/destination/:slug', function (Req $req) {
    $d = seo_destination($req->param('slug'));
    if (!$d) seo_page('/destination/' . rawurlencode($req->param('slug')), 'Destination introuvable | TripVision', SEO_PAGES['/'][1], false, [], 404);
    $path = '/destination/' . $d['slug'];
    $title = "Vols pas chers vers {$d['name']} ({$d['country']}) | TripVision";
    $desc = "Les meilleurs prix de vols vers {$d['name']}, {$d['country']} : {$d['tag']}. Guide pratique, meilleure période pour partir et offres vérifiées par TripVision.";
    seo_page($path, $title, $desc, true, [
        ['@context' => 'https://schema.org', '@type' => 'TouristDestination', 'name' => $d['name'], 'description' => $d['tag'], 'url' => app_url() . $path, 'containedInPlace' => ['@type' => 'Country', 'name' => $d['country']]],
        ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => [['@type' => 'ListItem', 'position' => 1, 'name' => 'Accueil', 'item' => app_url() . '/'], ['@type' => 'ListItem', 'position' => 2, 'name' => 'Vols', 'item' => app_url() . '/vols'], ['@type' => 'ListItem', 'position' => 3, 'name' => $d['name'], 'item' => app_url() . $path]]],
    ]);
});

route('GET', '/robots.txt', function () {
    send_raw("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /backoffice/\nDisallow: /espace/\nDisallow: /activation/\nDisallow: /uploads/\n\nSitemap: " . app_url() . "/sitemap.xml\n", 'text/plain; charset=utf-8', 200, ['Cache-Control' => 'public, max-age=3600']);
});
route('GET', '/sitemap.xml', function () {
    $base = app_url();
    $today = gmdate('Y-m-d');
    $urls = [];
    foreach (SEO_PAGES as $p => [, , $prio, $freq]) if (!in_array($p, SEO_SOON, true)) $urls[] = [$p === '/' ? '/' : $p, $prio, $freq];
    foreach (seo_destinations() as $d) $urls[] = ['/destination/' . $d['slug'], 0.7, 'weekly'];
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as [$p, $prio, $freq]) $xml .= "  <url><loc>" . seo_h($base . $p) . "</loc><lastmod>$today</lastmod><changefreq>$freq</changefreq><priority>" . number_format($prio, 1) . "</priority></url>\n";
    send_raw($xml . '</urlset>' . "\n", 'application/xml; charset=utf-8', 200, ['Cache-Control' => 'public, max-age=3600']);
});
