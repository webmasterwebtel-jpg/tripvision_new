<?php
declare(strict_types=1);
/* Suivi des visites : statistiques du back-office (tendances), exports, mise en avant automatique du site public, désinscription. */

const TRACK_WEIGHT = ['dest_view' => 1, 'pack_view' => 1, 'car_view' => 1, 'search_flight' => 2, 'search_car' => 2, 'search_pack' => 2, 'flight_click' => 4];
const BOOKING_WEIGHT = 10;
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function iso_ms(int $ts, int $ms = 0): string { return gmdate('Y-m-d\TH:i:s', $ts) . sprintf('.%03dZ', $ms); }
/** @return array{0:string,1:string} début et fin (ISO) de la période. */
function period_range(string $period): array
{
    $now = time();
    $to = iso_ms($now + 60);
    if ($period === 'month') return [gmdate('Y-m-01', $now) . 'T00:00:00.000Z', $to];
    $days = $period === '90d' ? 90 : ($period === '12m' ? 365 : 30);
    return [iso_ms($now - $days * 86400), $to];
}
function trend_period(string $q): string { return in_array($q, ['month', '30d', '90d', '12m'], true) ? $q : '30d'; }
function bump(array &$map, ?string $key, array $base, string $field, int $n, int $w): void
{
    if ($key === null || $key === '') return;
    $o = $map[$key] ?? ($base + ['views' => 0, 'clicks' => 0, 'searches' => 0, 'bookings' => 0, 'score' => 0]);
    $o[$field] += $n; $o['score'] += $n * $w;
    $map[$key] = $o;
}
function top_of(array $map, int $n = 10): array
{
    $v = array_values($map);
    usort($v, fn($a, $b) => ($b['score'] <=> $a['score']) ?: ($b['bookings'] <=> $a['bookings']));
    return array_slice($v, 0, $n);
}
function trends_data(string $from, string $to): array
{
    $ev = q('SELECT kind, key, city, country, max(label) AS label, count(*)::int AS n FROM site_events WHERE created_at >= $1 AND created_at < $2 GROUP BY kind, key, city, country', [$from, $to])->rows;
    $bk = q("SELECT v.id, v.model, COALESCE(NULLIF(v.details->>'city', ''), v.pickup_address) AS city, COALESCE(v.details->>'country', '') AS country, count(*)::int AS n FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.payment_status NOT IN ('awaiting', 'failed') AND b.status <> 'inactive' AND b.created_at >= $1 AND b.created_at < $2 GROUP BY v.id, v.model, 3, 4", [$from, $to])->rows;
    $rq = q("SELECT r.offer_type, o.id AS offer_id, o.title, o.from_city, o.to_city, o.country, count(*)::int AS n FROM offer_requests r JOIN offers o ON o.id = r.offer_id WHERE r.payment_status NOT IN ('awaiting', 'failed') AND r.status <> 'cancelled' AND r.created_at >= $1 AND r.created_at < $2 GROUP BY r.offer_type, o.id, o.title, o.from_city, o.to_city, o.country", [$from, $to])->rows;
    $daily = q("SELECT date_trunc('day', created_at)::date AS d, count(*)::int AS n FROM site_events WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1", [$from, $to])->rows;
    $countries = $cities = $flights = $packs = $cars = $carCities = [];
    $totals = ['views' => 0, 'clicks' => 0, 'searches' => 0, 'bookings' => 0];
    foreach ($ev as $e) {
        $f = $e['kind'] === 'flight_click' ? 'clicks' : (str_starts_with($e['kind'], 'search') ? 'searches' : 'views');
        $w = TRACK_WEIGHT[$e['kind']] ?? 1;
        $totals[$f] += $e['n'];
        if ($e['kind'] === 'car_view' || $e['kind'] === 'search_car') {
            bump($carCities, $e['city'], ['city' => $e['city'], 'country' => $e['country']], $f, $e['n'], $w);
            if ($e['kind'] === 'car_view') bump($cars, $e['key'], ['id' => $e['key'], 'label' => $e['label'], 'city' => $e['city']], $f, $e['n'], $w);
            continue;
        }
        bump($countries, $e['country'], ['country' => $e['country']], $f, $e['n'], $w);
        bump($cities, $e['city'], ['city' => $e['city'], 'country' => $e['country']], $f, $e['n'], $w);
        if ($e['kind'] === 'flight_click') bump($flights, $e['key'], ['id' => $e['key'], 'label' => $e['label'], 'city' => $e['city'], 'country' => $e['country']], $f, $e['n'], $w);
        if ($e['kind'] === 'pack_view') bump($packs, $e['key'], ['id' => $e['key'], 'label' => $e['label'], 'city' => $e['city'], 'country' => $e['country']], $f, $e['n'], $w);
    }
    foreach ($bk as $b) {
        $totals['bookings'] += $b['n'];
        bump($cars, (string)$b['id'], ['id' => (string)$b['id'], 'label' => $b['model'], 'city' => $b['city']], 'bookings', $b['n'], BOOKING_WEIGHT);
        bump($carCities, $b['city'], ['city' => $b['city'], 'country' => $b['country']], 'bookings', $b['n'], BOOKING_WEIGHT);
    }
    foreach ($rq as $r) {
        $totals['bookings'] += $r['n'];
        bump($countries, $r['country'], ['country' => $r['country']], 'bookings', $r['n'], BOOKING_WEIGHT);
        bump($cities, $r['to_city'], ['city' => $r['to_city'], 'country' => $r['country']], 'bookings', $r['n'], BOOKING_WEIGHT);
        $base = ['id' => (string)$r['offer_id'], 'label' => $r['title'], 'city' => $r['to_city'], 'country' => $r['country']];
        if ($r['offer_type'] === 'pack') bump($packs, (string)$r['offer_id'], $base, 'bookings', $r['n'], BOOKING_WEIGHT);
        else bump($flights, (string)$r['offer_id'], $base, 'bookings', $r['n'], BOOKING_WEIGHT);
    }
    return ['totals' => $totals, 'countries' => top_of($countries), 'cities' => top_of($cities), 'flights' => top_of($flights), 'packs' => top_of($packs), 'cars' => top_of($cars), 'carCities' => top_of($carCities), 'daily' => array_map(fn($x) => ['d' => $x['d'], 'n' => $x['n']], $daily)];
}

const KIND_LABEL = ['dest_view' => 'Page destination', 'pack_view' => 'Fiche séjour', 'car_view' => 'Fiche voiture', 'search_flight' => 'Recherche de vol', 'search_car' => 'Recherche de voiture', 'search_pack' => 'Recherche de séjour', 'flight_click' => 'Clic vers la compagnie'];
function trends_detail(string $kind, string $from, string $to): array
{
    if ($kind === 'bookings') {
        $b = q("SELECT b.created_at, 'Location de voiture' AS type, v.model AS offer, COALESCE(NULLIF(v.details->>'city', ''), v.pickup_address) AS city, b.customer_name AS customer, b.total_estimate AS amount, b.status FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.payment_status NOT IN ('awaiting', 'failed') AND b.created_at >= $1 AND b.created_at < $2", [$from, $to])->rows;
        $r = q("SELECT r.created_at, CASE WHEN r.offer_type = 'pack' THEN 'Séjour' ELSE 'Vol' END AS type, o.title AS offer, o.to_city AS city, r.customer_name AS customer, r.total AS amount, r.status FROM offer_requests r JOIN offers o ON o.id = r.offer_id WHERE r.payment_status NOT IN ('awaiting', 'failed') AND r.created_at >= $1 AND r.created_at < $2", [$from, $to])->rows;
        $all = array_merge($b, $r);
        usort($all, fn($x, $y) => strcmp($y['created_at'], $x['created_at']));
        return array_map(fn($x) => ['date' => $x['created_at'], 'type' => $x['type'], 'label' => $x['offer'], 'city' => $x['city'] ?: '', 'country' => '', 'customer' => $x['customer'] ?: '', 'amount' => $x['amount'] === null ? null : (float)$x['amount'] + 0, 'status' => $x['status']], array_slice($all, 0, 1000));
    }
    $kinds = $kind === 'clicks' ? ['flight_click'] : ($kind === 'searches' ? ['search_flight', 'search_car', 'search_pack'] : ['dest_view', 'pack_view', 'car_view']);
    $rows = q('SELECT kind, label, city, country, created_at FROM site_events WHERE kind = ANY($1) AND created_at >= $2 AND created_at < $3 ORDER BY created_at DESC LIMIT 1000', [$kinds, $from, $to])->rows;
    return array_map(fn($x) => ['date' => $x['created_at'], 'type' => KIND_LABEL[$x['kind']] ?? $x['kind'], 'label' => $x['label'] ?: '', 'city' => $x['city'] ?: '', 'country' => $x['country'] ?: ''], $rows);
}

route('GET', '/api/admin/trends', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES); require_can($u, 'trends.view');
    $period = trend_period($req->q('period'));
    [$from, $to] = period_range($period);
    send(['period' => $period, 'from' => $from, 'to' => $to] + trends_data($from, $to));
});
route('GET', '/api/admin/trends/detail', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES); require_can($u, 'trends.view');
    $k = $req->q('kind');
    $kind = in_array($k, ['views', 'clicks', 'searches', 'bookings'], true) ? $k : 'views';
    [$from, $to] = period_range(trend_period($req->q('period')));
    send(['kind' => $kind, 'rows' => trends_detail($kind, $from, $to)]);
});
function fr_datetime(string $iso): string { $t = strtotime($iso); return $t ? date('d/m/Y H:i:s', $t) : ''; }
route('GET', '/api/admin/trends/export', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES); require_can($u, 'trends.view');
    $period = trend_period($req->q('period'));
    $f = $req->q('format');
    $format = in_array($f, ['xlsx', 'xls', 'csv'], true) ? $f : 'xlsx';
    [$from, $to] = period_range($period);
    $t = trends_data($from, $to);
    $day = fn($d) => substr((string)$d, 0, 10);
    $stamp = gmdate('Y-m-d');
    $toprows = fn(array $list, callable $name) => array_map(fn($x, $i) => [$i + 1, $name($x), $x['views'] ?? 0, $x['clicks'] ?? 0, $x['searches'] ?? 0, $x['bookings'] ?? 0], $list, array_keys($list));
    $TOPH = ['Rang', 'Nom', 'Vues', 'Clics', 'Recherches', 'Réservations'];
    $join = fn(array $parts, string $sep) => implode($sep, array_filter($parts, fn($p) => $p !== null && $p !== ''));
    $sheets = [
        ['Résumé', ['Indicateur', 'Valeur'], [['Période', $day($from) . ' → ' . $day($to)], ['Pages consultées', $t['totals']['views']], ['Clics vers les compagnies', $t['totals']['clicks']], ['Recherches lancées', $t['totals']['searches']], ['Réservations et demandes', $t['totals']['bookings']]]],
        ['Par jour', ['Jour', 'Événements'], array_map(fn($x) => [$day($x['d']), $x['n']], $t['daily'])],
        ['Pays', $TOPH, $toprows($t['countries'], fn($x) => $x['country'] ?: '—')],
        ['Villes', $TOPH, $toprows($t['cities'], fn($x) => $join([$x['city'], $x['country']], ', ') ?: '—')],
        ['Vols', $TOPH, $toprows($t['flights'], fn($x) => $x['label'] ?: 'Vol')],
        ['Séjours', $TOPH, $toprows($t['packs'], fn($x) => $x['label'] ?: 'Séjour')],
        ['Voitures', $TOPH, $toprows($t['cars'], fn($x) => $join([$x['label'], $x['city']], ' · ') ?: 'Véhicule')],
    ];
    foreach ([['views', 'Pages consultées'], ['clicks', 'Clics compagnies'], ['searches', 'Recherches'], ['bookings', 'Réservations']] as [$kind, $title]) {
        $rows = trends_detail($kind, $from, $to);
        $sheets[] = [$title, $kind === 'bookings' ? ['Date', 'Type', 'Offre', 'Ville', 'Client', 'Montant (€)', 'Statut'] : ['Date', 'Type', 'Libellé', 'Ville', 'Pays'],
            array_map(fn($r) => $kind === 'bookings' ? [fr_datetime($r['date']), $r['type'], $r['label'], $r['city'], $r['customer'], $r['amount'], $r['status']] : [fr_datetime($r['date']), $r['type'], $r['label'], $r['city'], $r['country']], $rows)];
    }
    $name = "tripvision-statistiques-$stamp";
    if ($format === 'csv') {
        $cell = function ($v) { $x = (string)($v ?? ''); return preg_match('/[;"\n]/', $x) ? '"' . str_replace('"', '""', $x) . '"' : $x; };
        $parts = [];
        foreach ($sheets as [$title, $head, $rows]) $parts[] = implode("\r\n", array_merge([$title, implode(';', array_map($cell, $head))], array_map(fn($r) => implode(';', array_map($cell, $r)), $rows)));
        send_raw("\u{FEFF}" . implode("\r\n\r\n", $parts), 'text/csv; charset=utf-8', 200, ['Content-Disposition' => "attachment; filename=\"$name.csv\""]);
    }
    if ($format === 'xls' || !class_exists('ZipArchive')) {
        $x = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $cellX = fn($v) => (is_int($v) || is_float($v)) ? "<Cell><Data ss:Type=\"Number\">$v</Data></Cell>" : '<Cell><Data ss:Type="String">' . $x($v) . '</Data></Cell>';
        $xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#E3F1EA" ss:Pattern="Solid"/></Style></Styles>';
        foreach ($sheets as [$title, $head, $rows]) {
            $xml .= '<Worksheet ss:Name="' . mb_substr($x($title), 0, 31) . '"><Table><Row>' . implode('', array_map(fn($h) => '<Cell ss:StyleID="h"><Data ss:Type="String">' . $x($h) . '</Data></Cell>', $head)) . '</Row>';
            foreach ($rows as $r) $xml .= '<Row>' . implode('', array_map($cellX, $r)) . '</Row>';
            $xml .= '</Table></Worksheet>';
        }
        send_raw($xml . '</Workbook>', 'application/vnd.ms-excel; charset=utf-8', 200, ['Content-Disposition' => "attachment; filename=\"$name.xls\""]);
    }
    send_raw(xlsx_build($sheets), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 200, ['Content-Disposition' => "attachment; filename=\"$name.xlsx\""]);
});

// Mise en avant automatique sur le site public : recalculée sur les 30 derniers jours (cache 10 minutes).
route('GET', '/api/public/trending', function () {
    $c = cache_get('trending', 600);
    if ($c) send($c);
    [$from, $to] = period_range('30d');
    $t = trends_data($from, $to);
    $activity = $t['totals']['views'] + $t['totals']['clicks'] + $t['totals']['searches'] + $t['totals']['bookings'];
    $cities = array_slice(array_values(array_filter($t['cities'], fn($c) => !empty($c['city']))), 0, 6);
    $cities = array_map(fn($c, $i) => ['city' => $c['city'], 'country' => $c['country'], 'score' => $c['score'], 'rank' => $i + 1], $cities, array_keys($cities));
    $estimated = false;
    if (count($cities) < 4) {
        $estimated = true;
        $rows = q("SELECT to_city AS city, max(country) AS country, count(*)::int AS n FROM offers WHERE status = 'active' AND deleted_at IS NULL AND to_city IS NOT NULL GROUP BY to_city ORDER BY n DESC, to_city LIMIT 6")->rows;
        $cities = array_map(fn($r, $i) => ['city' => $r['city'], 'country' => $r['country'], 'score' => $r['n'], 'rank' => $i + 1], $rows, array_keys($rows));
    }
    $m = (int)gmdate('n') - 1;
    $ids = fn(array $l, int $n) => array_map(fn($x) => $x['id'], array_slice($l, 0, $n));
    $data = ['month' => MONTHS_FR[$m] . ' ' . gmdate('Y'), 'monthName' => MONTHS_FR[$m], 'estimated' => $estimated, 'activity' => $activity, 'cities' => $cities,
        'flights' => $ids($t['flights'], 4), 'packs' => $ids($t['packs'], 3), 'cars' => $ids($t['cars'], 4), 'countries' => array_map(fn($c) => $c['country'], array_slice($t['countries'], 0, 5))];
    cache_set('trending', $data);
    send($data);
});

route('GET', '/unsubscribe', function (Req $req) {
    $r = q('UPDATE contacts SET consent = false, unsubscribed_at = now() WHERE unsub_token = $1', [substr($req->q('t'), 0, 64)]);
    $ok = $r->rowCount > 0;
    send_html('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription</title><body style="font-family:Arial,sans-serif;background:#f8f5ef;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:440px;background:#fff;padding:40px;border:1px solid #e4dfd6;text-align:center"><h1 style="font-family:Georgia,serif">' . ($ok ? 'Vous êtes désinscrit(e)' : 'Lien invalide') . '</h1><p style="color:#555;line-height:1.6">' . ($ok ? 'Vous ne recevrez plus d’e-mails promotionnels de TripVision. Les e-mails liés à vos réservations continueront d’être envoyés.' : 'Ce lien de désinscription n’est pas valide.') . '</p></main>', $ok ? 200 : 404);
});
