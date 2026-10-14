<?php
declare(strict_types=1);
/* Espace client : tableau de bord, reçus PDF, annulation d'une demande, alertes de prix. */

route('GET', '/api/client/dashboard', function (Req $req) {
    $u = require_auth($req, ['client']);
    $requests = q("SELECT * FROM offer_requests WHERE lower(customer_email) = lower($1) AND payment_status NOT IN ('awaiting', 'failed') ORDER BY created_at DESC", [$u['email']])->rows;
    send(['user' => ['id' => $u['id'], 'email' => $u['email'], 'name' => $u['name']], 'bookings' => [], 'requests' => $requests, 'payments' => [], 'documents' => []]);
});

route('GET', '/api/client/requests/:id/pdf', function (Req $req) {
    $u = require_auth($req, ['client']);
    $id = $req->param('id');
    $r = is_uuid($id) ? q1('SELECT * FROM offer_requests WHERE id = $1 AND lower(customer_email) = lower($2)', [$id, $u['email']]) : null;
    if (!$r) fail(404, 'NOT_FOUND');
    $reference = booking_ref($r['id']);
    send_pdf(request_pdf([
        'reference' => $reference, 'type' => $r['offer_type'], 'status' => $r['status'], 'title' => $r['offer_title'], 'summary' => $r['summary'], 'tripType' => $r['trip_type'], 'travelers' => $r['travelers'],
        'createdAt' => $r['created_at'], 'customer' => $r['customer_name'], 'email' => $r['customer_email'], 'phone' => $r['customer_phone'], 'total' => $r['total'],
        'paid' => $r['payment_status'] === 'paid' ? (float)($r['paid_amount'] ?? $r['total']) : null,
    ]), $reference);
});

route('POST', '/api/client/requests/:id/cancel', function (Req $req) {
    $u = require_auth($req, ['client']);
    $id = $req->param('id');
    $r = is_uuid($id) ? q1("UPDATE offer_requests SET status = 'cancelled', status_changed_at = now(), client_seen_at = now(), staff_seen_at = NULL WHERE id = $1 AND lower(customer_email) = lower($2) AND status = 'pending' RETURNING *", [$id, $u['email']]) : null;
    if (!$r) fail(409, 'NOT_CANCELLABLE');
    $ref = booking_ref($r['id']);
    notify(staff_email(), notification_email("[TripVision] Demande annulée $ref", 'Demande annulée par le client', 'Un client a annulé sa demande de réservation.', 'Ouvrir le back-office', staff_link('bookings'), [['Référence', $ref], ['Offre', $r['offer_title']], ['Client', $r['customer_name']]]));
    push_notification('staff', 'request', 'Demande annulée par le client', $ref, 'bookings', $r['id']);
    send(['ok' => true]);
});

/* ---------- Alertes prix ---------- */
// Une offre de vol en ligne correspond à une alerte : même destination, même départ si précisé, prix sous le maximum.
const LIVE_FLIGHT = "o.type = 'flight' AND o.status = 'active' AND o.deleted_at IS NULL AND (o.publish_at IS NULL OR o.publish_at <= now()) AND (o.start_date IS NULL OR o.start_date >= (now() AT TIME ZONE 'Europe/Paris')::date)";
const ALERT_PRICE = "(CASE WHEN a.trip_type = 'oneway' AND COALESCE(o.details->'flight'->>'tripType', 'roundtrip') <> 'oneway' THEN NULLIF(o.details->'flight'->>'oneWayPrice', '')::numeric ELSE o.price END)";
const ALERT_MATCH = "lower(o.to_city) LIKE '%' || lower(a.to_city) || '%'
  AND (COALESCE(a.from_city, '') = '' OR lower(o.from_city) LIKE '%' || lower(a.from_city) || '%')
  AND (NOT a.direct_only OR COALESCE(NULLIF(o.details->'flight'->>'stops', '')::numeric, 0) = 0)
  AND (a.trip_type = 'any'
       OR (a.trip_type = 'roundtrip' AND COALESCE(o.details->'flight'->>'tripType', 'roundtrip') <> 'oneway')
       OR (a.trip_type = 'oneway' AND " . ALERT_PRICE . " IS NOT NULL))
  AND (a.max_price IS NULL OR " . ALERT_PRICE . " <= a.max_price)";

function alert_route(array $a): string { return ($a['from_city'] ? $a['from_city'] . ' → ' : '') . $a['to_city']; }
function euros(mixed $n): string { return fr_num($n, 0) . ' €'; }

route('GET', '/api/client/alerts', function (Req $req) {
    $u = require_auth($req, ['client']);
    send(q('SELECT a.*, m.n::int AS matches, m.best FROM price_alerts a
       LEFT JOIN LATERAL (SELECT count(*) AS n, min(' . ALERT_PRICE . ') AS best FROM offers o WHERE ' . LIVE_FLIGHT . ' AND ' . ALERT_MATCH . ') m ON true
      WHERE a.user_id = $1 ORDER BY a.active DESC, a.created_at DESC', [$u['id']])->rows);
});

function alert_price_field(array $b, bool $nullable = true): ?float
{
    if (!array_key_exists('maxPrice', $b) || $b['maxPrice'] === null || $b['maxPrice'] === '') return null;
    return (float)v_num($b, 'maxPrice', ['positive' => true, 'max' => 20000]);
}
route('POST', '/api/client/alerts', function (Req $req) {
    $u = require_auth($req, ['client']);
    $b = $req->body();
    $from = trim((string)v_str($b, 'fromCity', ['trim' => true, 'max' => 80, 'required' => false, 'default' => '']));
    $to = (string)v_str($b, 'toCity', ['trim' => true, 'min' => 2, 'minMsg' => 'Indiquez une destination.', 'max' => 80]);
    $max = alert_price_field($b);
    $trip = (string)v_str($b, 'tripType', ['in' => ['any', 'roundtrip', 'oneway'], 'required' => false, 'default' => 'any']);
    $direct = (bool)v_bool($b, 'directOnly', false);
    if (q1('SELECT count(*)::int AS n FROM price_alerts WHERE user_id = $1', [$u['id']])['n'] >= 20) fail(400, 'LIMIT', 'Vous avez déjà 20 alertes : supprimez-en une pour en créer une nouvelle.');
    if (q1("SELECT id FROM price_alerts WHERE user_id = $1 AND lower(coalesce(from_city, '')) = lower($2) AND lower(to_city) = lower($3) AND trip_type = $4 AND active", [$u['id'], $from, $to, $trip])) fail(409, 'DUPLICATE', 'Vous suivez déjà ce trajet : retrouvez-le dans « Mes alertes ».');
    $a = q1('INSERT INTO price_alerts(user_id, from_city, to_city, max_price, trip_type, direct_only) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [$u['id'], $from ?: null, $to, $max ?: null, $trip, $direct]);
    // Les offres déjà en ligne sont visibles tout de suite dans « Mes alertes » : seules les nouvelles déclencheront un e-mail.
    q('INSERT INTO price_alert_hits(alert_id, offer_id) SELECT a.id, o.id FROM price_alerts a JOIN offers o ON ' . LIVE_FLIGHT . ' AND ' . ALERT_MATCH . ' WHERE a.id = $1 ON CONFLICT DO NOTHING', [$a['id']]);
    push_notification('staff', 'alert', 'Nouvelle alerte prix', alert_route($a) . ($a['max_price'] ? ' · jusqu’à ' . euros($a['max_price']) : ''), 'alerts', $a['id']);
    send($a, 201);
});
route('PATCH', '/api/client/alerts/:id', function (Req $req) {
    $u = require_auth($req, ['client']);
    $b = $req->body();
    $active = v_bool($b, 'active');
    $hasMax = array_key_exists('maxPrice', $b);
    $max = alert_price_field($b);
    $id = $req->param('id');
    $a = is_uuid($id) ? q1('UPDATE price_alerts SET active = COALESCE($1, active), max_price = CASE WHEN $4 THEN $2 ELSE max_price END WHERE id = $3 AND user_id = $5 RETURNING *', [$active, $max, $id, $hasMax, $u['id']]) : null;
    if (!$a) fail(404, 'NOT_FOUND');
    send($a);
});
route('DELETE', '/api/client/alerts/:id', function (Req $req) {
    $u = require_auth($req, ['client']);
    $id = $req->param('id');
    if (!is_uuid($id) || !q('DELETE FROM price_alerts WHERE id = $1 AND user_id = $2', [$id, $u['id']])->rowCount) fail(404, 'NOT_FOUND');
    send(['ok' => true]);
});

/** Nouvelles offres publiées : chaque alerte concernée est prévenue une seule fois. Appelée par le CRON. */
function check_price_alerts(): int
{
    $rows = q('SELECT a.id AS alert_id, a.user_id, a.from_city, a.to_city, u.email, o.id AS offer_id, ' . ALERT_PRICE . ' AS price
         FROM price_alerts a
         JOIN users u ON u.id = a.user_id AND u.active AND u.deleted_at IS NULL
         JOIN offers o ON ' . LIVE_FLIGHT . ' AND ' . ALERT_MATCH . '
        WHERE a.active AND NOT EXISTS (SELECT 1 FROM price_alert_hits x WHERE x.alert_id = a.id AND x.offer_id = o.id)
        LIMIT 1000')->rows;
    $by = [];
    foreach ($rows as $r) { $by[$r['alert_id']] ??= $r + ['offers' => []]; $by[$r['alert_id']]['offers'][] = $r; }
    foreach ($by as $a) {
        foreach ($a['offers'] as $o) q('INSERT INTO price_alert_hits(alert_id, offer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [$a['alert_id'], $o['offer_id']]);
        $n = count($a['offers']);
        $best = min(array_map(fn($o) => (float)$o['price'], $a['offers']));
        q('UPDATE price_alerts SET hits = hits + $1, last_hit_at = now() WHERE id = $2', [$n, $a['alert_id']]);
        $route = alert_route($a);
        push_notification($a['user_id'], 'alert', "Alerte prix : $route", "$n nouvelle" . ($n > 1 ? 's' : '') . ' offre' . ($n > 1 ? 's' : '') . ' dès ' . euros($best), 'alerts', $a['alert_id']);
        notify($a['email'], notification_email("[TripVision] Alerte prix : $route dès " . euros($best), 'Une offre correspond à votre alerte',
            'Bonne nouvelle : ' . ($n > 1 ? "$n nouvelles offres correspondent" : 'une nouvelle offre correspond') . ' à votre alerte prix.',
            'Voir les offres', app_url() . '/#flights', [['Trajet', $route], ['Prix', 'dès ' . euros($best) . ' par personne']],
            'Vous recevez cet e-mail car vous avez créé une alerte prix. Mettez-la en pause ou supprimez-la depuis « Mes alertes » dans votre espace.'));
    }
    return count($by);
}

// Aperçu de mise en page (local seulement : APP_ENV=dev).
if (env('APP_ENV') === 'dev') {
    route('GET', '/api/dev/pdf-sample', function () {
        send_raw(request_pdf(['reference' => 'TV-ABCD1234', 'type' => 'pack', 'status' => 'confirmed', 'title' => 'Week-end à Marrakech · Riad & spa', 'summary' => 'Paris → Marrakech · 2026-11-13 → 2026-11-16 · héberge ment inclus', 'tripType' => 'roundtrip', 'travelers' => 2, 'createdAt' => '2026-10-10T10:00:00.000Z', 'customer' => 'Éloïse Dupont-Martin', 'email' => 'eloise@example.test', 'phone' => '+33 6 12 34 56 78', 'total' => '1290.5', 'paid' => 1290.5]), 'application/pdf');
    });
}
