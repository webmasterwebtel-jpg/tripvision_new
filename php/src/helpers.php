<?php
declare(strict_types=1);
/* Fonctions communes : notifications, contacts, références, images, liens vers les compagnies. */

function staff_email(): string { return (string)(env('SUPPORT_EMAIL') ?: env('CONTACT_TO') ?: ''); }
function staff_link(string $section): string { return app_url() . '/backoffice/#' . $section; }
function espace_link(string $section): string { return app_url() . '/espace/#' . $section; }
function booking_ref(mixed $id): string { return 'TV-' . strtoupper(substr((string)$id, 0, 8)); }
function mail_day(?string $d): string { return $d ? fr_date($d, 'j F Y') : ''; }
function mail_text(mixed $v): string { return esc_html($v); }
function eur_js(mixed $n): string { return fr_num($n, 0) . ' €'; }

/** Centre de notifications : « staff » pour toute l'équipe, sinon une personne précise. Jamais le contenu d'un message. */
function push_notification(?string $target, string $kind, string $title, string $body = '', string $link = '', mixed $refId = null): void
{
    try {
        if ($target === 'staff') q("INSERT INTO notifications(audience, kind, title, body, link, ref_id) VALUES ('staff',$1,$2,$3,$4,$5)", [$kind, $title, $body, $link, $refId !== null ? (string)$refId : null]);
        elseif ($target) q("INSERT INTO notifications(audience, user_id, kind, title, body, link, ref_id) VALUES ('user',$1,$2,$3,$4,$5,$6)", [$target, $kind, $title, $body, $link, $refId !== null ? (string)$refId : null]);
    } catch (Throwable $e) { error_log('Notification impossible : ' . $e->getMessage()); }
}
function client_user_id(string $email): ?string
{
    return q1("SELECT id FROM users WHERE lower(email) = lower($1) AND role = 'client' AND deleted_at IS NULL", [$email])['id'] ?? null;
}
/** Carnet de contacts du mailing : une ligne par adresse e-mail ; le consentement marketing est enregistré à part. */
function record_contact(string $email, ?string $name, ?string $phone, string $source, bool $consent = false, int $count = 0): array
{
    $e = strtolower(trim($email));
    if ($e === '') return ['returning' => false];
    try {
        $cur = q1('SELECT id, sources FROM contacts WHERE email = $1', [$e]);
        if (!$cur) {
            q('INSERT INTO contacts(email, name, phone, sources, consent, consent_at, requests_count) VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN now() END, $6)',
                [$e, $name ?: null, $phone ?: null, [$source], $consent, $count]);
            return ['returning' => false];
        }
        $sources = array_values(array_unique(array_merge(is_array($cur['sources']) ? $cur['sources'] : [], [$source])));
        sort($sources);
        // MariaDB applique les affectations dans l'ordre : consent_at est calculé avant de modifier consent.
        q("UPDATE contacts SET name = COALESCE(NULLIF($2, ''), name), phone = COALESCE(NULLIF($3, ''), phone), sources = $4,
             consent_at = CASE WHEN $5 AND NOT consent THEN now() ELSE consent_at END, consent = consent OR $5,
             unsubscribed_at = CASE WHEN $5 THEN NULL ELSE unsubscribed_at END,
             requests_count = requests_count + $6, last_seen_at = now() WHERE id = $1",
            [$cur['id'], $name ?: null, $phone ?: null, $sources, $consent, $count]);
        return ['returning' => true];
    } catch (Throwable $err) { error_log('Contact : ' . $err->getMessage()); return ['returning' => false]; }
}

/* ---------- Images ---------- */
function normalize_image(mixed $url): mixed { return (is_string($url) && str_starts_with($url, app_url() . '/uploads/')) ? substr($url, strlen(app_url())) : $url; }
function abs_image(mixed $url): mixed { return (is_string($url) && str_starts_with($url, '/uploads/')) ? app_url() . $url : $url; }
const DEFAULT_OFFER_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85';
function clean_images(mixed $list, int $max = 10): array
{
    if (!is_array($list)) return [];
    $o = [];
    foreach ($list as $u) { $u = normalize_image($u); if ($u) $o[] = $u; if (count($o) >= $max) break; }
    return $o;
}
/** Offre telle que l'API la renvoie : images absolues, vol, transport et notes à la racine. */
function with_abs_image(array $row): array
{
    $d = is_array($row['details'] ?? null) ? $row['details'] : [];
    $images = array_map('abs_image', clean_images($d['images'] ?? []));
    $row['image'] = $images[0] ?? abs_image($row['image'] ?? null);
    $row['images'] = $images ?: (($row['image'] ?? null) ? [abs_image($row['image'])] : []);
    $row['flight'] = $d['flight'] ?? null;
    $row['transport'] = $d['transport'] ?? null;
    $row['ratings'] = $d['ratings'] ?? [];
    return $row;
}
const PARIS_TODAY = "(now() AT TIME ZONE 'Europe/Paris')::date";
const LIVE_DATES = "(start_date IS NULL OR (type = 'pack' AND start_date > " . PARIS_TODAY . ") OR (type <> 'pack' AND start_date >= " . PARIS_TODAY . "))";

/* ---------- Liens vers les compagnies (même règles que assets/airline-links.js) ---------- */
function air_cabin_code(string $c): string
{
    return ['economique' => 'ECONOMY', 'economique premium' => 'PREMIUM', 'premium' => 'PREMIUM', 'affaires' => 'BUSINESS', 'business' => 'BUSINESS', 'premiere' => 'FIRST', 'first' => 'FIRST'][norm_text($c)] ?? 'ECONOMY';
}
function air_iata(?string $s): string { return preg_match('/\b([A-Z]{3})\b/', (string)$s, $m) ? $m[1] : ''; }
const AIR_CITY = ['CDG' => 'PAR', 'ORY' => 'PAR', 'BVA' => 'PAR', 'LHR' => 'LON', 'LGW' => 'LON', 'STN' => 'LON', 'LTN' => 'LON', 'LCY' => 'LON', 'SEN' => 'LON', 'JFK' => 'NYC', 'EWR' => 'NYC', 'LGA' => 'NYC', 'FCO' => 'ROM', 'CIA' => 'ROM', 'MXP' => 'MIL', 'LIN' => 'MIL', 'BGY' => 'MIL', 'IAD' => 'WAS', 'DCA' => 'WAS', 'BWI' => 'WAS', 'ORD' => 'CHI', 'MDW' => 'CHI', 'NRT' => 'TYO', 'HND' => 'TYO', 'GRU' => 'SAO', 'CGH' => 'SAO', 'GIG' => 'RIO', 'SDU' => 'RIO', 'EZE' => 'BUE', 'AEP' => 'BUE', 'ARN' => 'STO', 'BMA' => 'STO', 'YUL' => 'YMQ', 'YYZ' => 'YTO'];
function air_day(mixed $d): string { return $d ? substr((string)$d, 0, 10) : ''; }
function air_params(array $o, array $opts = []): array
{
    $f = $o['flight'] ?? ($o['details']['flight'] ?? []);
    $oneway = array_key_exists('oneway', $opts) && $opts['oneway'] !== null ? (bool)$opts['oneway'] : (($f['tripType'] ?? '') === 'oneway');
    $cab = $opts['cabin'] ?? null;
    return [
        'from' => air_iata($f['fromAirport'] ?? ''), 'to' => air_iata($f['toAirport'] ?? ''), 'depart' => air_day($o['start_date'] ?? ''), 'ret' => $oneway ? '' : air_day($o['end_date'] ?? ''), 'oneway' => $oneway,
        'adults' => max(1, min(9, (int)($opts['adults'] ?? 1))), 'cabin' => ($cab && $cab !== 'all') ? $cab : ($f['cabin'] ?? 'Économique'),
    ];
}
function air_has_builder(?string $airline): bool { return in_array(norm_text((string)$airline), ['air france', 'klm', 'klm royal dutch airlines', 'easyjet'], true); }
function air_build_exact(array $o, array $opts = []): ?string
{
    $f = $o['flight'] ?? ($o['details']['flight'] ?? []);
    $a = norm_text((string)($f['airline'] ?? ''));
    $p = air_params($o, $opts);
    if (!air_has_builder($a) || !$p['from'] || !$p['to'] || !$p['depart']) return null;
    if (!$p['oneway'] && !$p['ret']) return null;
    if ($a === 'easyjet') {
        $oneway = $p['oneway'] || !$p['ret'];
        return "https://www.easyjet.com/deeplink?lang=FR&dep={$p['from']}&dest={$p['to']}&dd={$p['depart']}" . ($oneway ? '' : "&rd={$p['ret']}") . "&apax={$p['adults']}&cpax=0&ipax=0&isOneWay=" . ($oneway ? 'on' : 'off');
    }
    $host = $a === 'air france' ? 'wwws.airfrance.fr' : 'www.klm.fr';
    $place = fn(string $c) => (isset(AIR_CITY[$c]) ? AIR_CITY[$c] . ':C' : $c . ':A');
    $A = $place($p['from']); $B = $place($p['to']);
    $c8 = fn(string $d) => str_replace('-', '', $d);
    $bCode = explode(':', $B)[0]; $bKind = explode(':', $B)[1];
    $out = "$A:" . $c8($p['depart']) . ">$bCode:$bKind";
    $conn = ($p['oneway'] || !$p['ret']) ? $out : "$out-$B:" . $c8($p['ret']) . ">$A";
    // Le premier tronçon écrit « PAR:C:date>DSS:A » : on remplace « > » par « %3E », comme le fait la version JavaScript.
    return "https://$host/search/offers?pax={$p['adults']}:0:0:0:0:0:0:0&cabinClass=" . air_cabin_code((string)$p['cabin']) . '&activeConnection=0&connections=' . str_replace('>', '%3E', $conn) . '&bookingFlow=LEISURE';
}
function air_is_homepage(string $u): bool
{
    $p = parse_url(trim($u));
    if (!$p || !in_array($p['scheme'] ?? '', ['http', 'https'], true) || empty($p['host'])) return true;
    if (!empty($p['query'])) return false;
    $parts = array_values(array_filter(explode('/', $p['path'] ?? ''), fn($s) => $s !== '' && !preg_match('/^[a-z]{2}([-_][a-z]{2})?$/i', $s)));
    return count($parts) === 0 || (count($parts) === 1 && preg_match('/^(accueil|home|index|homepage|flights|vols)$/i', $parts[0]));
}
function air_date_forms(string $d): array
{
    $d = air_day($d);
    if (!$d) return [];
    [$y, $m, $dd] = explode('-', $d);
    $yy = substr($y, 2);
    $mon = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][(int)$m - 1];
    return [$d, "$y$m$dd", "$dd-$m-$y", "$dd/$m/$y", "$dd.$m.$y", "$y/$m/$dd", "$dd$m$yy", "$yy$m$dd", "$dd$mon$y", "$dd$mon$yy", ((int)$dd) . "$mon$y"];
}
/** Qualité du lien enregistré (même niveaux que le back-office : exact, ok, partial, unverified, weak, none). */
function air_analyze(array $o, array $opts = []): array
{
    $f = $o['flight'] ?? ($o['details']['flight'] ?? []);
    $p = air_params($o, $opts);
    $exact = air_build_exact($o, $opts);
    if ($exact) return ['level' => 'exact', 'url' => $exact, 'mode' => 'exact', 'checks' => [], 'note' => 'Lien fabriqué automatiquement à partir de l’offre : il ouvre la recherche de la compagnie avec exactement ce trajet.'];
    $url = trim((string)($f['bookingUrl'] ?? ''));
    $pu = parse_url($url);
    if (!$url || !$pu || !in_array($pu['scheme'] ?? '', ['http', 'https'], true)) return ['level' => 'none', 'url' => '', 'mode' => 'saved', 'checks' => [], 'note' => 'Aucun lien de réservation.'];
    if (air_is_homepage($url)) return ['level' => 'weak', 'url' => $url, 'mode' => 'saved', 'checks' => [], 'note' => 'Ce lien mène à la page d’accueil de la compagnie, pas à l’offre. Faites la recherche sur son site (même trajet, mêmes dates), puis collez l’adresse de la page de résultats.'];
    $hay = strtolower(preg_replace('/\s+/', '', rawurldecode($url)));
    $has = fn($c) => $c && str_contains($hay, strtolower($c));
    $hasDate = function ($d) use ($hay) { foreach (air_date_forms((string)$d) as $x) if (str_contains($hay, strtolower($x))) return true; return false; };
    $checks = [['ok' => $has($p['from']), 'label' => 'Départ'], ['ok' => $has($p['to']), 'label' => 'Arrivée'], ['ok' => $hasDate($p['depart']), 'label' => 'Date aller']];
    if (!$p['oneway'] && $p['ret']) $checks[] = ['ok' => $hasDate($p['ret']), 'label' => 'Date retour'];
    $good = count(array_filter($checks, fn($c) => $c['ok']));
    if ($good === count($checks)) return ['level' => 'ok', 'url' => $url, 'mode' => 'saved', 'checks' => $checks, 'note' => 'Les aéroports et les dates de l’offre sont bien dans le lien.'];
    if ($good > 0) return ['level' => 'partial', 'url' => $url, 'mode' => 'saved', 'checks' => $checks, 'note' => 'Certains éléments de l’offre ne figurent pas dans le lien : ouvrez-le pour vérifier le trajet et les dates.'];
    return ['level' => 'unverified', 'url' => $url, 'mode' => 'saved', 'checks' => $checks, 'note' => 'Le lien ne contient pas le trajet ni les dates en clair (adresse de session) : ouvrez-le et comparez avec l’offre.'];
}
