<?php
declare(strict_types=1);
/* Back-office : tableau de bord, offres (vols et packs), demandes, brouillons automatiques, mailing, clients, comptes internes, journal. */

const NO_CANCEL_TEXT = 'TripVision n’annule pas les réservations faites auprès d’une enseigne ou d’une compagnie : nous en gardons la trace.';
const DRAFT_EVERY_HOURS = 48;
const FRESH_HOURS = 48;

function bo(Req $req, string ...$perms): array
{
    $u = require_auth($req, BACKOFFICE_ROLES);
    if ($perms) require_any($u, ...$perms);
    return $u;
}
function id_or_404(Req $req, string $name = 'id'): string
{
    $id = $req->param($name);
    if (!is_uuid($id)) fail(404, 'NOT_FOUND');
    return $id;
}
function iso_now(): string { return iso_ms(time(), (int)(fmod(microtime(true), 1) * 1000)); }
/** Pour un champ JSONB « objet » (même s'il est vide). */
function obj_json(array $a): PgJson { return json_val((object)$a); }

/* ---------- Validation d'une offre (équivalent de offerSchema) ---------- */
const PACK_TRANSPORTS = ['avion', 'train', 'bus', 'voiture'];
const RATING_SOURCES = ['TripAdvisor', 'Booking.com', 'Google', 'Expedia', 'Hotels.com'];
function rating_max(string $src): int { return in_array($src, ['Booking.com', 'Expedia', 'Hotels.com'], true) ? 10 : 5; }
function time_str(array $b, string $k): ?string
{
    return v_str($b, $k, ['required' => false, 'regex' => '/^([01]\d|2[0-3]):[0-5]\d$/', 'regexMsg' => 'Heure invalide']);
}
function publish_at_field(array $b, string $k = 'publishAt'): ?string
{
    $v = $b[$k] ?? null;
    if ($v === null) return null;
    if (!is_string($v) || !preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)$/', $v)) throw new ValidationFailed([['code' => 'invalid_string', 'validation' => 'datetime', 'message' => 'Invalid datetime', 'path' => [$k]]]);
    return $v;
}
function parse_flight(array $f): array
{
    $trip = (string)v_str($f, 'tripType', ['in' => ['roundtrip', 'oneway'], 'required' => false, 'default' => 'roundtrip']);
    $url = (string)v_str($f, 'bookingUrl', ['trim' => true, 'max' => 600, 'required' => false, 'default' => '']);
    if ($url !== '' && !preg_match('#^https?://#i', $url)) invalid('Le lien doit commencer par https://', ['flight', 'bookingUrl']);
    $o = ['tripType' => $trip, 'airline' => (string)v_str($f, 'airline', ['trim' => true, 'min' => 2, 'max' => 80]), 'bookingUrl' => $url];
    $opt = function (string $k, array $o2) use ($f, &$o) { $v = v_str($f, $k, $o2 + ['required' => false]); if ($v !== null) $o[$k] = $v; };
    $opt('flightNumber', ['trim' => true, 'max' => 12]);
    $opt('fromCountry', ['trim' => true, 'max' => 80]);
    $opt('fromAirport', ['trim' => true, 'max' => 120]);
    $opt('toAirport', ['trim' => true, 'max' => 120]);
    foreach (['departTime', 'arriveTime'] as $k) { $t = time_str($f, $k); if ($t !== null) $o[$k] = $t; }
    $o['arriveDayOffset'] = (int)v_num($f, 'arriveDayOffset', ['int' => true, 'min' => 0, 'max' => 2, 'default' => 0]);
    foreach ([['durationMin', 10, 2400], ] as [$k, $mn, $mx]) { $n = v_num($f, $k, ['int' => true, 'min' => $mn, 'max' => $mx]); if ($n !== null) $o[$k] = $n; }
    $n = v_num($f, 'oneWayPrice', ['positive' => true]); if ($n !== null) $o['oneWayPrice'] = $n;
    $opt('returnFlightNumber', ['trim' => true, 'max' => 12]);
    foreach (['returnDepartTime', 'returnArriveTime'] as $k) { $t = time_str($f, $k); if ($t !== null) $o[$k] = $t; }
    $o['returnDayOffset'] = (int)v_num($f, 'returnDayOffset', ['int' => true, 'min' => 0, 'max' => 2, 'default' => 0]);
    $n = v_num($f, 'returnDurationMin', ['int' => true, 'min' => 10, 'max' => 2400]); if ($n !== null) $o['returnDurationMin'] = $n;
    $o['stops'] = (int)v_num($f, 'stops', ['int' => true, 'min' => 0, 'max' => 3, 'default' => 0]);
    $opt('cabin', ['trim' => true, 'max' => 40]);
    $opt('baggage', ['trim' => true, 'max' => 80]);
    return $o;
}
/** Exécute une lecture de champ ; en cas d'erreur, elle est mise de côté et la valeur par défaut est renvoyée. */
function soft(array &$issues, callable $fn, mixed $default = null): mixed
{
    try { return $fn(); } catch (ValidationFailed $e) { array_push($issues, ...$e->issues); return $default; }
}
function parse_offer(array $b): array
{
    $issues = [];
    $o = [];
    $o['type'] = soft($issues, fn() => (string)v_str($b, 'type', ['in' => ['flight', 'pack']]));
    $o['title'] = soft($issues, fn() => (string)v_str($b, 'title', ['min' => 2]));
    $o['fromCity'] = soft($issues, fn() => v_str($b, 'fromCity', ['required' => false]));
    $o['toCity'] = soft($issues, fn() => (string)v_str($b, 'toCity', ['min' => 2]));
    $o['country'] = soft($issues, fn() => v_str($b, 'country', ['required' => false]));
    $o['badge'] = soft($issues, fn() => v_str($b, 'badge', ['required' => false]));
    $o['price'] = soft($issues, fn() => (float)v_num($b, 'price', ['required' => true, 'positive' => true]));
    $o['oldPrice'] = soft($issues, fn() => v_num($b, 'oldPrice'));
    $o['partnerName'] = soft($issues, fn() => v_str($b, 'partnerName', ['required' => false]));
    $o['startDate'] = soft($issues, fn() => v_str($b, 'startDate', ['required' => false]));
    $o['endDate'] = soft($issues, fn() => v_str($b, 'endDate', ['required' => false]));
    $o['image'] = soft($issues, fn() => v_str($b, 'image', ['required' => false]));
    $o['description'] = soft($issues, fn() => v_str($b, 'description', ['required' => false]));
    $o['publishAt'] = soft($issues, fn() => publish_at_field($b));
    $o['hotelName'] = soft($issues, fn() => v_str($b, 'hotelName', ['trim' => true, 'max' => 160, 'required' => false]));
    $o['hotelStars'] = soft($issues, fn() => v_num($b, 'hotelStars', ['int' => true, 'min' => 1, 'max' => 5]));
    $o['hotelNights'] = soft($issues, fn() => v_num($b, 'hotelNights', ['int' => true, 'min' => 1, 'max' => 60]));
    $o['hotelBoard'] = soft($issues, fn() => v_str($b, 'hotelBoard', ['trim' => true, 'max' => 80, 'required' => false]));
    $o['images'] = null;
    soft($issues, function () use ($b, &$o) {
    if (isset($b['images'])) {
        if (!is_array($b['images']) || !array_is_list($b['images']) || count($b['images']) > 10) throw new ValidationFailed([['code' => 'too_big', 'message' => 'Array must contain at most 10 element(s)', 'path' => ['images']]]);
        foreach ($b['images'] as $i => $im) if (!is_string($im) || mb_strlen($im) > 500) throw new ValidationFailed([['code' => 'invalid_type', 'message' => 'Image invalide', 'path' => ['images', $i]]]);
        $o['images'] = $b['images'];
    }
    });
    $o['flight'] = isset($b['flight']) && is_array($b['flight']) ? soft($issues, fn() => parse_flight($b['flight'])) : null;
    $o['transport'] = null;
    soft($issues, function () use ($b, &$o) {
    if (isset($b['transport']) && is_array($b['transport'])) {
        $o['transport'] = ['mode' => (string)v_str($b['transport'], 'mode', ['in' => PACK_TRANSPORTS])];
        $d = v_str($b['transport'], 'details', ['trim' => true, 'max' => 160, 'required' => false]);
        if ($d !== null) $o['transport']['details'] = $d;
    }
    });
    $o['ratings'] = null;
    soft($issues, function () use ($b, &$o) {
    if (isset($b['ratings'])) {
        if (!is_array($b['ratings']) || !array_is_list($b['ratings']) || count($b['ratings']) > 5) throw new ValidationFailed([['code' => 'too_big', 'message' => 'Array must contain at most 5 element(s)', 'path' => ['ratings']]]);
        $o['ratings'] = [];
        foreach ($b['ratings'] as $r) {
            $r = is_array($r) ? $r : [];
            $x = ['source' => (string)v_str($r, 'source', ['in' => RATING_SOURCES]), 'score' => v_num($r, 'score', ['required' => true, 'min' => 0, 'max' => 10])];
            $c = v_num($r, 'count', ['int' => true, 'min' => 0, 'max' => 1000000]);
            if ($c !== null) $x['count'] = $c;
            $o['ratings'][] = $x;
        }
    }
    });
    $add = function (string $path, string $msg) use (&$issues) { $issues[] = ['code' => 'custom', 'message' => $msg, 'path' => [$path]]; };
    if ($o['type'] === 'pack') {
        if (!$o['hotelName']) $add('hotelName', 'Hôtel obligatoire pour un pack');
        if (!$o['hotelNights']) $add('hotelNights', 'Nombre de nuits obligatoire pour un pack');
        if ($o['hotelNights'] > 7) $add('hotelNights', 'Un pack dure 7 nuits au maximum.');
        if (!$o['country']) $add('country', 'Indiquez le pays de destination.');
        if (empty($o['transport']['mode'])) $add('transport', 'Choisissez le mode de transport jusqu’à l’hôtel.');
        foreach ($o['ratings'] ?? [] as $r) if ($r['score'] > rating_max($r['source'])) $add('ratings', 'La note ' . $r['source'] . ' va jusqu’à ' . rating_max($r['source']) . '.');
    }
    if ($o['type'] === 'flight') {
        $f = $o['flight'];
        if (!$f) $add('flight', 'Détails du vol obligatoires');
        else {
            if (!$o['startDate']) $add('startDate', 'Date de départ obligatoire');
            if (empty($f['fromCountry'])) $add('fromCountry', 'Pays de départ obligatoire');
            if ($f['tripType'] === 'roundtrip') {
                if (!$o['endDate']) $add('endDate', 'Date de retour obligatoire');
                if ($o['startDate'] && $o['endDate'] && $o['endDate'] < $o['startDate']) $add('endDate', 'Le retour doit suivre le départ');
            }
        }
    }
    if ($issues) throw new ValidationFailed($issues);
    return $o;
}
/** Compagnies au format de lien vérifié : le lien est fabriqué à partir de l'offre ; sinon celui de l'agent est exigé. */
function normalize_flight_link(array &$o): void
{
    if ($o['type'] !== 'flight' || !$o['flight']) return;
    $exact = air_build_exact(['start_date' => $o['startDate'], 'end_date' => $o['endDate'], 'flight' => $o['flight']], []);
    if ($exact) $o['flight']['bookingUrl'] = $exact;
    elseif (!preg_match('#^https?://#i', $o['flight']['bookingUrl'] ?? '')) invalid('Indiquez le lien de la page de résultats de la compagnie (même trajet, mêmes dates).', ['flight', 'bookingUrl']);
}
function offer_cover(array $o): ?string { return clean_images($o['images'] ?? [])[0] ?? (normalize_image($o['image']) ?: null); }
function offer_details(array $o): array
{
    return ['images' => clean_images($o['images'] ?? [])]
        + ($o['type'] === 'flight' && $o['flight'] ? ['flight' => $o['flight']] : [])
        + ($o['type'] === 'pack' ? ['transport' => $o['transport'] ?: null, 'ratings' => $o['ratings'] ?: []] : []);
}
function offer_badge(array $o): string
{
    return $o['badge'] ?: ($o['type'] === 'flight' ? 'Bon plan' : (($o['hotelNights'] ?? 0) >= 4 ? 'Escapade' : (($o['hotelNights'] ?? 0) === 3 ? 'Week-end prolongé' : 'Week-end')));
}
function queue_price_alerts(): void
{
    $GLOBALS['tv_after'][] = static function () { check_price_alerts(); };
}

/* ---------- Tableau de bord ---------- */
route('GET', '/api/admin/badges', function (Req $req) {
    $u = bo($req);
    $r = q1("SELECT
    (SELECT count(*) FROM bookings WHERE staff_seen_at IS NULL AND payment_status NOT IN ('awaiting', 'failed')) + (SELECT count(*) FROM offer_requests WHERE staff_seen_at IS NULL AND payment_status NOT IN ('awaiting', 'failed')) AS bookings,
    (SELECT count(*) FROM contact_messages WHERE handled_at IS NULL) AS messages,
    (SELECT COALESCE(sum(unread_admin), 0) FROM chat_threads) AS chats,
    (SELECT count(*) FROM partner_applications WHERE status = 'pending') AS applications");
    send(['bookings' => (int)$r['bookings'], 'messages' => (int)$r['messages'], 'chats' => (int)$r['chats'], 'applications' => (int)$r['applications'], 'notifications' => unread_notifications($u)]);
});
route('GET', '/api/admin/dashboard', function (Req $req) {
    $u = bo($req);
    $offers = q('SELECT * FROM offers WHERE deleted_at IS NULL ORDER BY created_at DESC')->rows;
    $requests = q("SELECT * FROM offer_requests WHERE payment_status NOT IN ('awaiting', 'failed') ORDER BY created_at DESC LIMIT 300")->rows;
    // Les réservations ne sont transmises qu'aux comptes qui ont le droit de les voir.
    if (!has_permission($u, 'bookings.view') && !has_permission($u, 'bookings.manage')) $requests = [];
    $unseen = count(array_filter($requests, fn($r) => !$r['staff_seen_at']));
    $unread = q1('SELECT count(*)::int AS n FROM contact_messages WHERE handled_at IS NULL')['n'];
    $extra = q1("SELECT (SELECT count(*)::int FROM partner_applications WHERE status = 'pending') AS applications, (SELECT COALESCE(sum(unread_admin), 0)::int FROM chat_threads) AS chats");
    send(['partners' => [], 'vehicles' => [], 'bookings' => [], 'offers' => array_map('with_abs_image', $offers), 'offerRequests' => $requests, 'unseenBookings' => $unseen, 'unreadMessages' => $unread, 'pendingApplications' => $extra['applications'], 'unreadChats' => $extra['chats']]);
});
// Combien de réservations ces 7 derniers jours, ce mois-ci et cette année. Trace seulement : TripVision n'annule rien.
route('GET', '/api/admin/booking-stats', function (Req $req) {
    bo($req, 'bookings.view', 'bookings.manage');
    $rows = q("WITH ev AS (
      SELECT 'car' AS kind, created_at FROM bookings WHERE payment_status NOT IN ('awaiting', 'failed')
      UNION ALL SELECT offer_type AS kind, created_at FROM offer_requests WHERE payment_status NOT IN ('awaiting', 'failed')
    ), edges AS (SELECT (now() - interval '7 days') AS wk, date_trunc('month', now()) AS mo, date_trunc('year', now()) AS yr)
    SELECT k.kind, count(*) FILTER (WHERE ev.created_at >= e.wk)::int AS week, count(*) FILTER (WHERE ev.created_at >= e.mo)::int AS month, count(*) FILTER (WHERE ev.created_at >= e.yr)::int AS year
    FROM (VALUES ('car'), ('pack'), ('flight')) AS k(kind) CROSS JOIN edges e LEFT JOIN ev ON ev.kind = k.kind GROUP BY k.kind")->rows;
    $z = fn() => ['car' => 0, 'pack' => 0, 'flight' => 0, 'total' => 0];
    $out = ['week' => $z(), 'month' => $z(), 'year' => $z()];
    foreach ($rows as $r) foreach (['week', 'month', 'year'] as $p) { $out[$p][$r['kind']] = $r[$p]; $out[$p]['total'] += $r[$p]; }
    send($out);
});

/* ---------- Réglages (affichés par le back-office) ---------- */
function load_settings(): array
{
    $s = ['franchisePerDay' => 7, 'franchiseAmount' => null];
    try {
        foreach (q('SELECT key, value FROM site_settings')->rows as $r) {
            if ($r['key'] === 'franchise_protection_per_day') $s['franchisePerDay'] = max(0, (float)$r['value']) + 0;
            if ($r['key'] === 'franchise_amount' && $r['value'] !== null && (float)$r['value'] > 0) $s['franchiseAmount'] = (float)$r['value'] + 0;
        }
    } catch (Throwable $e) { error_log('Réglages : ' . $e->getMessage()); }
    return $s;
}
function save_setting(string $key, mixed $value, array $u): void
{
    q('INSERT INTO site_settings(key, value, updated_at, updated_by) VALUES ($1, $2::jsonb, now(), $3) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = now(), updated_by = $3', [$key, json_encode($value), $u['name'] ?: $u['email']]);
}
route('GET', '/api/admin/settings', function (Req $req) { bo($req, 'franchise.manage', 'settings.manage'); send(['franchisePerDay' => load_settings()['franchisePerDay']]); });
route('PUT', '/api/admin/settings', function (Req $req) {
    $u = bo($req, 'franchise.manage', 'settings.manage');
    $v = (float)v_num($req->body(), 'franchisePerDay', ['required' => true, 'min' => 0, 'max' => 200]);
    save_setting('franchise_protection_per_day', $v + 0, $u);
    audit($u['id'], 'update_settings', 'settings', null, $req->ip());
    send(['franchisePerDay' => $v + 0]);
});
route('GET', '/api/admin/franchise', function (Req $req) { bo($req); $s = load_settings(); send(['amount' => $s['franchiseAmount'], 'protectionPerDay' => $s['franchisePerDay']]); });
route('PUT', '/api/admin/franchise', function (Req $req) {
    $u = bo($req, 'franchise.manage', 'settings.manage');
    $v = (float)v_num($req->body(), 'amount', ['required' => true, 'min' => 1, 'minMsg' => 'Indiquez un montant d’au moins 1 €.', 'max' => 100000]);
    save_setting('franchise_amount', $v + 0, $u);
    audit($u['id'], 'set_franchise_amount', 'settings', null, $req->ip());
    send(['amount' => $v + 0]);
});
route('DELETE', '/api/admin/franchise', function (Req $req) {
    $u = bo($req, 'franchise.manage', 'settings.manage');
    q("DELETE FROM site_settings WHERE key = 'franchise_amount'");
    audit($u['id'], 'remove_franchise_amount', 'settings', null, $req->ip());
    send(['amount' => null]);
});
// Parties masquées dans cette version (voitures, partenaires) : listes vides pour que l'interface reste cohérente.
route('GET', '/api/admin/partner-applications', function (Req $req) { bo($req, 'partners.manage'); send([]); });
route('GET', '/api/admin/categories', function (Req $req) { bo($req, 'categories.manage'); send([]); });

/* ---------- E-mails laissés avant d'ouvrir le site d'une compagnie ---------- */
route('GET', '/api/admin/flight-leads', function (Req $req) {
    bo($req, 'mailing.export');
    $rows = q('SELECT id, airline, route, email, consent, created_at FROM flight_leads ORDER BY created_at DESC LIMIT 300')->rows;
    $st = q1("SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS week, count(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month FROM flight_leads");
    send(['leads' => $rows, 'stats' => $st]);
});

/* ---------- Rythme de publication : de nouvelles offres au moins toutes les 48 h ---------- */
function freshness(): array
{
    $r = q1("SELECT max(created_at) AS last, count(*) FILTER (WHERE created_at >= now() - interval '48 hours')::int AS recent, count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS week FROM offers WHERE deleted_at IS NULL");
    $last = $r['last'];
    $hours = $last ? (int)floor((time() - strtotime($last)) / 3600) : null;
    return ['last' => $last, 'hours' => $hours, 'limit' => FRESH_HOURS, 'overdue' => $hours === null || $hours >= FRESH_HOURS, 'recent' => $r['recent'], 'week' => $r['week']];
}
route('GET', '/api/admin/freshness', function (Req $req) { bo($req); send(freshness()); });
function check_freshness(): void
{
    $f = freshness();
    if (!$f['overdue']) return;
    if (q1("SELECT 1 AS x FROM notifications WHERE audience = 'staff' AND kind = 'freshness' AND created_at > now() - interval '24 hours' LIMIT 1")) return;
    $body = $f['hours'] === null ? 'Aucune offre n’est encore publiée.' : 'La dernière offre date d’il y a ' . $f['hours'] . ' h : il en faut de nouvelles au moins toutes les ' . FRESH_HOURS . ' h.';
    push_notification('staff', 'freshness', 'Pensez à publier de nouvelles offres', $body, 'offers');
    notify(staff_email(), notification_email('[TripVision] De nouvelles offres sont attendues', 'De nouvelles offres sont attendues', $body, 'Publier une offre', staff_link('offers')));
}

/* ---------- Offres ---------- */
route('POST', '/api/admin/offers', function (Req $req) {
    $u = bo($req, 'offers.create');
    $o = parse_offer($req->body());
    normalize_flight_link($o);
    $pack = $o['type'] === 'pack';
    $r = q1('INSERT INTO offers(type, title, from_city, to_city, country, badge, price, old_price, partner_name, start_date, end_date, image, description, publish_at, hotel_name, hotel_stars, hotel_nights, hotel_board, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *',
        [$o['type'], $o['title'], $o['fromCity'] ?: '', $o['toCity'], $o['country'] ?: '', offer_badge($o), $o['price'], $o['oldPrice'] ?: null, $o['partnerName'] ?: 'TripVision', $o['startDate'] ?: null, $o['endDate'] ?: null,
         offer_cover($o) ?: DEFAULT_OFFER_IMAGE, $o['description'] ?: '', $o['publishAt'] ?: null, $pack ? $o['hotelName'] : null, $pack ? ($o['hotelStars'] ?: null) : null, $pack ? $o['hotelNights'] : null, $pack ? ($o['hotelBoard'] ?: null) : null, json_val(offer_details($o))]);
    audit($u['id'], $o['publishAt'] ? 'schedule_offer' : 'create_offer', 'offer', $r['id'], $req->ip());
    if ($o['type'] === 'flight') queue_price_alerts();
    send(with_abs_image($r), 201);
});
route('PATCH', '/api/admin/offers/:id', function (Req $req) {
    $u = bo($req, 'offers.edit');
    $o = parse_offer($req->body());
    normalize_flight_link($o);
    $id = id_or_404($req);
    $pack = $o['type'] === 'pack';
    $img = $o['images'] !== null ? (offer_cover($o) ?: DEFAULT_OFFER_IMAGE) : (normalize_image($o['image']) ?: null);
    $r = q1("UPDATE offers SET title = $1, from_city = $2, to_city = $3, country = $4, badge = $5, price = $6, old_price = $7, start_date = $8, end_date = $9,
            image = COALESCE($10, image), description = $11, hotel_name = $12, hotel_stars = $13, hotel_nights = $14, hotel_board = $15,
            details = $17::jsonb || (CASE WHEN status = 'inactive' AND details ? 'draft' THEN jsonb_build_object('draft', true, 'toVerify', details->'toVerify') ELSE '{}'::jsonb END)
     WHERE id = $16 AND deleted_at IS NULL RETURNING *",
        [$o['title'], $o['fromCity'] ?: '', $o['toCity'], $o['country'] ?: '', offer_badge($o), $o['price'], $o['oldPrice'] ?: null, $o['startDate'] ?: null, $o['endDate'] ?: null,
         $img, $o['description'] ?: '', $pack ? $o['hotelName'] : null, $pack ? ($o['hotelStars'] ?: null) : null, $pack ? $o['hotelNights'] : null, $pack ? ($o['hotelBoard'] ?: null) : null, $id, json_encode(offer_details($o), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    if (!$r) fail(404, 'NOT_FOUND');
    audit($u['id'], 'update_offer', 'offer', $id, $req->ip());
    send(with_abs_image($r));
});
route('PATCH', '/api/admin/offers/:id/status', function (Req $req) {
    $u = bo($req, 'offers.edit');
    $b = $req->body();
    $status = (string)v_str($b, 'status', ['in' => ['active', 'inactive']]);
    $publishAt = publish_at_field($b);
    $id = id_or_404($req);
    if ($status === 'active') {
        $cur = q1('SELECT * FROM offers WHERE id = $1 AND deleted_at IS NULL', [$id]);
        if (($cur['type'] ?? '') === 'flight') {
            $a = air_analyze(['start_date' => substr((string)($cur['start_date'] ?? ''), 0, 10), 'end_date' => substr((string)($cur['end_date'] ?? ''), 0, 10), 'flight' => $cur['details']['flight'] ?? null]);
            if (in_array($a['level'], ['weak', 'none'], true)) fail(400, 'LINK_WEAK', 'Publication impossible : ' . $a['note'] . ' Utilisez « Changer le lien » sur cette offre.');
        }
    }
    // Publier une offre en brouillon la valide : elle n'est plus marquée « à vérifier ».
    $r = $status === 'active'
        ? q1("UPDATE offers SET status = $1, publish_at = COALESCE($2, now()), details = COALESCE(details, '{}'::jsonb) - 'draft' - 'toVerify' WHERE id = $3 AND deleted_at IS NULL RETURNING *", [$status, $publishAt, $id])
        : q1('UPDATE offers SET status = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *', [$status, $id]);
    if (!$r) fail(404, 'NOT_FOUND');
    audit($u['id'], "offer_$status", 'offer', $id, $req->ip());
    if ($status === 'active' && $r['type'] === 'flight') queue_price_alerts();
    send($r);
});
// Changer seulement le lien de réservation d'un vol (vérification par l'équipe).
route('PATCH', '/api/admin/offers/:id/link', function (Req $req) {
    $u = bo($req, 'offers.edit');
    $url = (string)v_str($req->body(), 'bookingUrl', ['trim' => true, 'max' => 600]);
    if (!filter_var($url, FILTER_VALIDATE_URL)) throw new ValidationFailed([['code' => 'invalid_string', 'validation' => 'url', 'message' => 'Lien invalide', 'path' => ['bookingUrl']]]);
    if (!preg_match('#^https://#i', $url)) invalid('Le lien doit commencer par https://', ['bookingUrl']);
    $id = id_or_404($req);
    $cur = q1("SELECT * FROM offers WHERE id = $1 AND type = 'flight' AND deleted_at IS NULL", [$id]);
    if (!$cur) fail(404, 'NOT_FOUND');
    $exact = air_build_exact(['start_date' => substr((string)$cur['start_date'], 0, 10), 'end_date' => substr((string)$cur['end_date'], 0, 10), 'flight' => $cur['details']['flight'] ?? null], []);
    if ($exact) $url = $exact;
    $r = q1("UPDATE offers SET details = jsonb_set(COALESCE(details, '{}'::jsonb), '{flight,bookingUrl}', to_jsonb($1::text), true) || '{\"touched\": true}'::jsonb WHERE id = $2 AND type = 'flight' AND deleted_at IS NULL RETURNING *", [$url, $id]);
    if (!$r) fail(404, 'NOT_FOUND');
    audit($u['id'], 'update_offer_link', 'offer', $id, $req->ip());
    send(with_abs_image($r));
});
route('PATCH', '/api/admin/offers/:id/schedule', function (Req $req) {
    $u = bo($req, 'offers.edit');
    $publishAt = publish_at_field($req->body());
    $id = id_or_404($req);
    $r = q1('UPDATE offers SET publish_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *', [$publishAt, $id]);
    if (!$r) fail(404, 'NOT_FOUND');
    audit($u['id'], 'schedule_offer', 'offer', $id, $req->ip());
    send($r);
});
route('DELETE', '/api/admin/offers/:id', function (Req $req) {
    $u = bo($req, 'offers.delete');
    $id = id_or_404($req);
    if (!q1("UPDATE offers SET deleted_at = now(), status = 'inactive' WHERE id = $1 AND deleted_at IS NULL RETURNING id", [$id])) fail(404, 'NOT_FOUND');
    audit($u['id'], 'delete_offer', 'offer', $id, $req->ip());
    send(['ok' => true]);
});
// Images des offres.
route('POST', '/api/admin/uploads', function (Req $req) {
    $u = bo($req, 'vehicles.create', 'vehicles.edit', 'offers.create', 'offers.edit');
    $mime = trim(explode(';', $req->header('content-type'))[0]);
    $body = $req->raw();
    $ok = match ($mime) {
        'image/jpeg' => strlen($body) > 3 && str_starts_with($body, "\xFF\xD8\xFF"),
        'image/png' => strlen($body) > 8 && str_starts_with($body, "\x89PNG\r\n\x1A\n"),
        'image/webp' => strlen($body) > 12 && substr($body, 0, 4) === 'RIFF' && substr($body, 8, 4) === 'WEBP',
        default => false,
    };
    if (!$ok || strlen($body) > 5 * 1024 * 1024) fail(400, 'INVALID_IMAGE');
    $row = q1('INSERT INTO files(mime, size, data, created_by) VALUES ($1,$2,$3,$4) RETURNING id', [$mime, strlen($body), new PgBytes($body), $u['id']]);
    audit($u['id'], 'upload_image', 'file', $row['id'], $req->ip());
    send(['url' => '/uploads/' . $row['id']], 201);
});

/* ---------- Brouillons de vols renouvelés toutes les 48 h (rien n'est jamais publié automatiquement) ---------- */
function auto_season(int $month): float { return $month === 7 || $month === 8 ? 1.1 : ($month === 12 ? 1.12 : ($month <= 3 ? 0.94 : ($month === 4 || $month === 10 ? 1.04 : 1.0))); }
function build_drafts(): array
{
    $cat = json_decode((string)file_get_contents(TV_APP . '/data/draft-catalog.json'), true);
    $now = time();
    $out = [];
    foreach ($cat['routes'] as [$from, $fa, $fc, $to, $ta, $tc, $airline, $base, $stops, $dur, $lead, $stay, $img]) {
        $start = $now + max(14, $lead + random_int(-9, 12)) * 86400;
        $nights = max(2, $stay + random_int(-2, 2));
        $end = $start + $nights * 86400;
        $price = max(29, (int)round($base * auto_season((int)gmdate('n', $start)) * (0.9 + mt_rand() / mt_getrandmax() * 0.22)));
        $flight = ['tripType' => 'roundtrip', 'airline' => $airline, 'bookingUrl' => $cat['airlineHome'][$airline] ?? '', 'fromCountry' => $fc, 'fromAirport' => $cat['airportName'][$fa] ?? null, 'toAirport' => $cat['airportName'][$ta] ?? null, 'stops' => $stops, 'cabin' => 'Économique', 'durationMin' => $dur, 'arriveDayOffset' => 0, 'returnDayOffset' => 0];
        $exact = air_build_exact(['start_date' => gmdate('Y-m-d', $start), 'end_date' => gmdate('Y-m-d', $end), 'flight' => $flight], []);
        if ($exact) $flight['bookingUrl'] = $exact;
        $out[] = ['title' => "$from → $to", 'from' => $from, 'to' => $to, 'country' => $tc, 'price' => $price, 'airline' => $airline, 'start' => gmdate('Y-m-d', $start), 'end' => gmdate('Y-m-d', $end), 'image' => "/assets/dest/$img.jpg",
            'details' => ['flight' => $flight, 'images' => ["/assets/dest/$img.jpg"], 'draft' => true, 'auto' => true, 'autoBatch' => iso_now(), 'toVerify' => 'Tarif « dès » indicatif, dates et lien à vérifier avant publication.']];
    }
    return $out;
}
function renew_drafts(string $by = 'auto'): array
{
    $old = q("UPDATE offers SET deleted_at = now() WHERE type = 'flight' AND status = 'inactive' AND deleted_at IS NULL AND publish_at IS NULL AND details ? 'draft' AND details->>'auto' = 'true' AND COALESCE(details->>'touched', '') <> 'true' RETURNING id");
    $fresh = build_drafts();
    foreach ($fresh as $d) {
        q("INSERT INTO offers(type, title, from_city, to_city, country, badge, price, partner_name, start_date, end_date, image, description, status, details) VALUES ('flight', $1, $2, $3, $4, 'Bon plan', $5, $6, $7, $8, $9, '', 'inactive', $10)",
            [$d['title'], $d['from'], $d['to'], $d['country'], $d['price'], $d['airline'], $d['start'], $d['end'], $d['image'], json_val($d['details'])]);
    }
    q("INSERT INTO job_runs(name, last_run_at, last_created, last_replaced, last_by) VALUES ('auto_drafts', now(), $1, $2, $3) ON CONFLICT (name) DO UPDATE SET last_run_at = now(), last_created = $1, last_replaced = $2, last_by = $3", [count($fresh), $old->rowCount, $by]);
    return ['created' => count($fresh), 'replaced' => $old->rowCount];
}
/** Un seul exécutant gagne la course (UPDATE conditionnel). Appelée par le CRON. */
function maybe_renew_drafts(): ?array
{
    if (!q1("UPDATE job_runs SET last_run_at = now() WHERE name = 'auto_drafts' AND last_run_at <= now() - ($1 || ' hours')::interval RETURNING name", [(string)DRAFT_EVERY_HOURS])) return null;
    $r = renew_drafts('auto');
    push_notification('staff', 'offer', 'Nouveaux brouillons de vols', $r['created'] . ' brouillons à vérifier' . ($r['replaced'] ? ' · ' . $r['replaced'] . ' anciens remplacés' : ''), 'offers');
    return $r;
}
route('GET', '/api/admin/auto-drafts', function (Req $req) {
    bo($req, 'offers.create', 'offers.edit');
    $row = q1("SELECT * FROM job_runs WHERE name = 'auto_drafts'");
    $cnt = q1("SELECT count(*) FILTER (WHERE details->>'auto' = 'true' AND COALESCE(details->>'touched', '') <> 'true')::int AS replaceable, count(*) FILTER (WHERE COALESCE(details->>'touched', '') = 'true' OR details->>'auto' IS NULL)::int AS kept FROM offers WHERE type = 'flight' AND status = 'inactive' AND deleted_at IS NULL AND details ? 'draft'");
    $last = $row['last_run_at'] ?? null;
    send(['everyHours' => DRAFT_EVERY_HOURS, 'lastRunAt' => $last, 'nextRunAt' => $last ? iso_ms(strtotime($last) + DRAFT_EVERY_HOURS * 3600, 0) : null, 'lastCreated' => $row['last_created'] ?? 0, 'lastReplaced' => $row['last_replaced'] ?? 0, 'lastBy' => $row['last_by'] ?? null, 'replaceable' => $cnt['replaceable'], 'kept' => $cnt['kept']]);
});
route('POST', '/api/admin/auto-drafts/run', function (Req $req) {
    $u = bo($req, 'offers.create');
    $r = renew_drafts($u['email'] ?: 'agent');
    audit($u['id'], 'renew_auto_drafts', 'offer', null, $req->ip());
    send($r);
});

/* ---------- Alertes de prix : vue de l'équipe ---------- */
route('GET', '/api/admin/alerts', function (Req $req) {
    bo($req, 'offers.create', 'offers.edit', 'trends.view', 'mailing.export');
    send(q('SELECT a.*, u.name AS client_name, u.email AS client_email, m.n::int AS matches, m.best FROM price_alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN LATERAL (SELECT count(*) AS n, min(' . ALERT_PRICE . ') AS best FROM offers o WHERE ' . LIVE_FLIGHT . ' AND ' . ALERT_MATCH . ') m ON true
      ORDER BY a.created_at DESC LIMIT 2000')->rows);
});

/* ---------- Demandes de vols et de packs ---------- */
route('PATCH', '/api/admin/offer-requests/:id/status', function (Req $req) {
    $u = bo($req, 'bookings.manage');
    $status = (string)v_str($req->body(), 'status', ['in' => ['pending', 'confirmed', 'cancelled']]);
    if ($status === 'cancelled') fail(403, 'NO_CANCEL', NO_CANCEL_TEXT);
    $id = id_or_404($req);
    $r = q1('UPDATE offer_requests SET status = $1, status_changed_at = now(), staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $2 RETURNING *', [$status, $id]);
    if (!$r) fail(404, 'NOT_FOUND');
    if ($status !== 'pending') {
        $ref = booking_ref($r['id']);
        push_notification(client_user_id($r['customer_email']), 'request', $status === 'confirmed' ? 'Demande confirmée' : 'Demande annulée', "$ref · " . $r['offer_title'], 'orders', $r['id']);
        notify($r['customer_email'], notification_email($status === 'confirmed' ? 'Votre demande TripVision est confirmée' : 'Votre demande TripVision a été annulée', $status === 'confirmed' ? 'Demande confirmée' : 'Demande annulée',
            $status === 'confirmed' ? 'Bonne nouvelle : votre demande de réservation est confirmée.' : 'Votre demande de réservation a été annulée.', 'Voir ma réservation', espace_link('orders'), [['Référence', $ref], ['Offre', $r['offer_title']]]));
    }
    audit($u['id'], "offer_request_$status", 'offer_request', $id, $req->ip());
    send($r);
});

/* ---------- Mailing ---------- */
function mailing_where(Req $req): array
{
    $where = []; $params = [];
    if ($req->q('source') !== '') { $params[] = $req->q('source'); $where[] = '$' . count($params) . ' = ANY(sources)'; }
    $c = $req->q('consent');
    $consent = $c === 'all' ? 'all' : ($c === 'no' ? 'no' : 'yes');
    if ($consent === 'yes') $where[] = 'consent AND unsubscribed_at IS NULL'; elseif ($consent === 'no') $where[] = 'NOT consent';
    if ($req->q('q') !== '') { $params[] = '%' . strtolower($req->q('q')) . '%'; $n = count($params); $where[] = "(lower(email) LIKE \$$n OR lower(coalesce(name, '')) LIKE \$$n)"; }
    return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
}
route('GET', '/api/admin/mailing', function (Req $req) {
    bo($req, 'mailing.export');
    $rows = q('SELECT id, email, name, phone, sources, consent, unsubscribed_at, requests_count, created_at, last_seen_at FROM contacts ORDER BY last_seen_at DESC LIMIT 20000')->rows;
    $st = q1('SELECT count(*)::int AS total, count(*) FILTER (WHERE consent AND unsubscribed_at IS NULL)::int AS consent, count(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::int AS unsubscribed FROM contacts');
    send(['contacts' => $rows, 'stats' => $st]);
});
route('GET', '/api/admin/mailing/export', function (Req $req) {
    $u = bo($req, 'mailing.export');
    [$sql, $params] = mailing_where($req);
    $rows = q("SELECT * FROM contacts $sql ORDER BY last_seen_at DESC", $params)->rows;
    $fmt = fn($d) => $d ? date('d/m/Y H:i', strtotime($d)) : '';
    $header = ['E-mail', 'Nom', 'Téléphone', 'Origine', 'Accepte nos offres', 'Désinscrit', 'Première activité', 'Dernière activité', 'Demandes', 'Lien de désinscription'];
    $table = array_map(fn($c) => [$c['email'], $c['name'] ?: '', $c['phone'] ?: '', implode(', ', array_map(fn($x) => ['vol' => 'Vol', 'avertir_voiture' => 'Prévenir : voitures', 'avertir_pack' => 'Prévenir : week-ends'][$x] ?? $x, $c['sources'] ?? [])), $c['consent'] ? 'Oui' : 'Non', $c['unsubscribed_at'] ? 'Oui' : 'Non', $fmt($c['created_at']), $fmt($c['last_seen_at']), $c['requests_count'], app_url() . '/unsubscribe?t=' . $c['unsub_token']], $rows);
    audit($u['id'], 'export_contacts', 'contacts', null, $req->ip());
    $stamp = gmdate('Y-m-d');
    if ($req->q('format') === 'xlsx' && class_exists('ZipArchive')) {
        send_raw(xlsx_build([['Contacts', $header, $table, [32, 24, 18, 22, 16, 12, 18, 18, 10, 48]]]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 200, ['Content-Disposition' => "attachment; filename=\"tripvision-contacts-$stamp.xlsx\""]);
    }
    $esc = fn($v) => '"' . str_replace('"', '""', (string)($v ?? '')) . '"';
    $csv = "\u{FEFF}" . implode("\r\n", array_map(fn($r) => implode(';', array_map($esc, $r)), array_merge([$header], $table)));
    send_raw($csv, 'text/csv; charset=utf-8', 200, ['Content-Disposition' => "attachment; filename=\"tripvision-contacts-$stamp.csv\""]);
});

/* ---------- Comptes clients ---------- */
function load_client(Req $req): array
{
    $id = id_or_404($req);
    $c = q1("SELECT id, email, name, phone, active, created_at, last_login_at, reset_requested_at FROM users WHERE id = $1 AND role = 'client' AND deleted_at IS NULL", [$id]);
    if (!$c) fail(404, 'NOT_FOUND');
    return $c;
}
route('GET', '/api/admin/clients', function (Req $req) {
    bo($req, 'clients.view', 'accounts.create', 'accounts.edit', 'accounts.delete');
    send(q("SELECT u.id, u.email, u.name, u.phone, u.active, u.created_at, u.last_login_at, u.reset_requested_at,
            (SELECT count(*)::int FROM bookings b WHERE lower(b.customer_email) = lower(u.email) AND b.payment_status NOT IN ('awaiting', 'failed')) AS bookings,
            (SELECT count(*)::int FROM offer_requests r WHERE lower(r.customer_email) = lower(u.email) AND r.payment_status NOT IN ('awaiting', 'failed')) AS requests
     FROM users u WHERE u.role = 'client' AND u.deleted_at IS NULL ORDER BY u.created_at DESC LIMIT 1000")->rows);
});
route('GET', '/api/admin/clients/:id', function (Req $req) {
    bo($req, 'clients.view', 'accounts.create', 'accounts.edit', 'accounts.delete');
    $c = load_client($req);
    $requests = q("SELECT * FROM offer_requests WHERE lower(customer_email) = lower($1) AND payment_status NOT IN ('awaiting', 'failed') ORDER BY created_at DESC LIMIT 100", [$c['email']])->rows;
    send(['client' => $c, 'bookings' => [], 'requests' => $requests]);
});
route('PATCH', '/api/admin/clients/:id/status', function (Req $req) {
    $u = bo($req, 'accounts.edit');
    $status = (string)v_str($req->body(), 'status', ['in' => ['active', 'inactive']]);
    $c = load_client($req);
    q('UPDATE users SET active = $1, updated_at = now() WHERE id = $2', [$status === 'active', $c['id']]);
    audit($u['id'], $status === 'active' ? 'unblock_client' : 'block_client', 'user', $c['id'], $req->ip());
    send(['ok' => true]);
});
function unusable_hash(): string { return pw_hash(bin2hex(random_bytes(32))); }
route('POST', '/api/admin/clients/:id/reset-password', function (Req $req) {
    $u = bo($req, 'accounts.edit');
    $c = load_client($req);
    q('UPDATE users SET password_hash = $1, must_change_password = true, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [unusable_hash(), $c['id']]);
    $access = send_access_link($c, 'reset', null, 48);
    audit($u['id'], 'reset_client_password', 'user', $c['id'], $req->ip());
    send(['loginEmail' => $c['email']] + $access);
});
route('DELETE', '/api/admin/clients/:id', function (Req $req) {
    $u = bo($req, 'accounts.delete');
    $c = load_client($req);
    q('UPDATE users SET deleted_at = now(), active = false, updated_at = now() WHERE id = $1', [$c['id']]);
    audit($u['id'], 'delete_client', 'user', $c['id'], $req->ip());
    send(null, 204);
});

/* ---------- Comptes internes ---------- */
const ACCOUNT_COLUMNS = 'id, email, name, role, active, permissions, last_login_at, created_at, reset_requested_at';
function has_any_account_permission(array $u): bool { foreach (['accounts.create', 'accounts.edit', 'accounts.delete'] as $k) if (has_permission($u, $k)) return true; return false; }
function account_rights(array $actor, array $target): array
{
    $manageable = $target['id'] !== $actor['id'] && can_manage_role($actor['role'], $target['role']);
    return ['edit' => $manageable && has_permission($actor, 'accounts.edit'), 'delete' => $manageable && has_permission($actor, 'accounts.delete')];
}
/** Personne ne peut donner plus de droits qu'il n'en a. */
function check_grantable(array $actor, mixed $permissions): array
{
    $clean = sanitize_permissions($permissions);
    foreach (array_keys($clean) as $k) if (!has_permission($actor, $k)) fail(403, 'PERMISSION_ESCALATION');
    return $clean;
}
function load_account(Req $req, array $actor, string $right): array
{
    $id = id_or_404($req);
    $t = q1('SELECT ' . ACCOUNT_COLUMNS . " FROM users WHERE id = $1 AND deleted_at IS NULL AND role IN ('it','admin','manager')", [$id]);
    if (!$t) fail(404, 'NOT_FOUND');
    if ($t['id'] === $actor['id']) fail(403, 'SELF_ACTION');
    if (!account_rights($actor, $t)[$right]) fail(403, 'ROLE_NOT_ALLOWED');
    return $t;
}
function account_out(array $u): array { $u['permissions'] = (object)($u['permissions'] ?: []); return $u; }
function parse_account(array $b): array
{
    $perms = $b['permissions'] ?? null;
    if ($perms !== null && !is_array($perms)) throw new ValidationFailed([['code' => 'invalid_type', 'message' => 'Expected object', 'path' => ['permissions']]]);
    foreach ((array)$perms as $k => $v) if (!is_bool($v)) throw new ValidationFailed([['code' => 'invalid_type', 'message' => 'Expected boolean', 'path' => ['permissions', $k]]]);
    return ['name' => (string)v_str($b, 'name', ['min' => 2]), 'email' => (string)v_str($b, 'email', ['email' => true]), 'role' => (string)v_str($b, 'role', ['in' => ['it', 'admin', 'manager']]), 'permissions' => $perms];
}
route('GET', '/api/admin/accounts', function (Req $req) {
    $u = bo($req);
    if (!has_any_account_permission($u)) fail(403, 'PERMISSION_DENIED');
    $roles = $u['role'] !== 'it' ? "'manager', 'admin'" : "'it','admin','manager'";
    $rows = q('SELECT ' . ACCOUNT_COLUMNS . " FROM users WHERE deleted_at IS NULL AND role IN ($roles) ORDER BY created_at DESC")->rows;
    send(array_map(fn($r) => array_merge($r, ['permissions' => (object)effective_permissions($r), 'can' => account_rights($u, $r)]), $rows));
});
route('POST', '/api/admin/accounts', function (Req $req) {
    $u = bo($req, 'accounts.create');
    $b = parse_account($req->body());
    if (!can_manage_role($u['role'], $b['role'])) fail(403, 'ROLE_NOT_ALLOWED');
    $perms = in_array($b['role'], ['manager', 'admin'], true) ? check_grantable($u, $b['permissions']) : [];
    $email = strtolower(trim($b['email']));
    if (q1('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [$email])) fail(409, 'EMAIL_ALREADY_EXISTS');
    $r = q1('INSERT INTO users(email, name, role, password_hash, must_change_password, created_by, permissions) VALUES ($1,$2,$3,$4,true,$5,$6) RETURNING id, email, name, role, created_at', [$email, trim($b['name']), $b['role'], unusable_hash(), $u['id'], obj_json($perms)]);
    audit($u['id'], 'create_' . $b['role'], 'user', $r['id'], $req->ip());
    $access = send_access_link($r, 'invite', $u['name']);
    send(['user' => $r, 'loginEmail' => $email] + $access, 201);
});
route('PATCH', '/api/admin/accounts/:id', function (Req $req) {
    $u = bo($req, 'accounts.edit');
    $b = parse_account($req->body());
    $t = load_account($req, $u, 'edit');
    if (!can_manage_role($u['role'], $b['role'])) fail(403, 'ROLE_NOT_ALLOWED');
    $perms = in_array($b['role'], ['manager', 'admin'], true) ? check_grantable($u, $b['permissions']) : [];
    $email = strtolower(trim($b['email']));
    if (q1('SELECT id FROM users WHERE email = $1 AND id <> $2 AND deleted_at IS NULL', [$email, $t['id']])) fail(409, 'EMAIL_ALREADY_EXISTS');
    $r = q1('UPDATE users SET name = $1, first_name = NULL, last_name = NULL, email = $2, role = $3, permissions = $4, updated_at = now() WHERE id = $5 RETURNING ' . ACCOUNT_COLUMNS, [trim($b['name']), $email, $b['role'], obj_json($perms), $t['id']]);
    audit($u['id'], 'update_account', 'user', $t['id'], $req->ip());
    send(account_out($r));
});
route('PATCH', '/api/admin/accounts/:id/status', function (Req $req) {
    $u = bo($req, 'accounts.edit');
    $status = (string)v_str($req->body(), 'status', ['in' => ['active', 'inactive']]);
    $t = load_account($req, $u, 'edit');
    $r = q1('UPDATE users SET active = $1, updated_at = now() WHERE id = $2 RETURNING ' . ACCOUNT_COLUMNS, [$status === 'active', $t['id']]);
    audit($u['id'], $status === 'active' ? 'unblock_account' : 'block_account', 'user', $t['id'], $req->ip());
    send(account_out($r));
});
route('POST', '/api/admin/accounts/:id/reset-password', function (Req $req) {
    $u = bo($req, 'accounts.edit');
    $t = load_account($req, $u, 'edit');
    q('UPDATE users SET password_hash = $1, must_change_password = true, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [unusable_hash(), $t['id']]);
    $access = send_access_link($t, 'reset', null, 48);
    audit($u['id'], 'reset_password', 'user', $t['id'], $req->ip());
    send(['loginEmail' => $t['email']] + $access);
});
route('DELETE', '/api/admin/accounts/:id', function (Req $req) {
    $u = bo($req, 'accounts.delete');
    $t = load_account($req, $u, 'delete');
    q('UPDATE users SET deleted_at = now(), active = false, updated_at = now() WHERE id = $1', [$t['id']]);
    audit($u['id'], 'delete_account', 'user', $t['id'], $req->ip());
    send(['ok' => true]);
});

/* ---------- Journal et suivi technique ---------- */
route('GET', '/api/admin/audit-logs', function (Req $req) {
    bo($req, 'audit.view');
    send(q('SELECT a.*, u.email AS actor_email, u.role AS actor_role FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 200')->rows);
});
route('GET', '/api/it/login-history', function (Req $req) {
    require_auth($req, IT_ROLES);
    send(q('SELECT h.*, u.email, u.name, u.role FROM login_history h JOIN users u ON u.id = h.user_id ORDER BY h.created_at DESC LIMIT 200')->rows);
});
route('GET', '/api/it/health', function (Req $req) {
    require_auth($req, IT_ROLES);
    $c = q1('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL) AS partners, (SELECT COUNT(*) FROM vehicles WHERE deleted_at IS NULL) AS vehicles, (SELECT COUNT(*) FROM bookings) AS bookings');
    send(['ok' => true, 'counts' => $c, 'time' => iso_now()]);
});
