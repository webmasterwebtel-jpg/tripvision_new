<?php
declare(strict_types=1);
/* Routes publiques : configuration, offres, contact, e-mail des vols, demandes, suivi des visites, géographie, images. */

/** Limiteur léger sans table : « combien de fois cette clé depuis N secondes ». Fichiers dans le dossier temporaire. */
function throttle_count(string $key, int $windowSec): int
{
    $dir = sys_get_temp_dir() . '/tv_throttle';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $f = $dir . '/' . sha256_hex($key);
    $now = time();
    $d = ['t' => $now, 'n' => 0];
    if (is_file($f)) { $x = json_decode((string)@file_get_contents($f), true); if (is_array($x) && $now - ($x['t'] ?? 0) < $windowSec) $d = $x; }
    $d['n']++;
    @file_put_contents($f, json_encode($d), LOCK_EX);
    if (mt_rand(1, 200) === 1) foreach (glob($dir . '/*') ?: [] as $old) if ($now - (int)@filemtime($old) > 3600) @unlink($old);
    return $d['n'];
}
function cache_get(string $key, int $ttl): mixed
{
    $f = sys_get_temp_dir() . '/tv_cache_' . sha256_hex($key);
    if (is_file($f) && time() - (int)filemtime($f) < $ttl) { $d = json_decode((string)file_get_contents($f), true); return $d['v'] ?? null; }
    return null;
}
function cache_set(string $key, mixed $v): void { @file_put_contents(sys_get_temp_dir() . '/tv_cache_' . sha256_hex($key), json_encode(['v' => $v]), LOCK_EX); }

route('GET', '/api/public/config', fn() => send(['payments' => payments_enabled(), 'testMode' => payments_test_mode()]));

route('GET', '/api/public/offers', function (Req $req) {
    $params = [];
    $sql = "SELECT * FROM offers WHERE status = 'active' AND deleted_at IS NULL AND (publish_at IS NULL OR publish_at <= now()) AND " . LIVE_DATES;
    $type = $req->q('type');
    if ($type !== '') { $params[] = $type; $sql .= ' AND type = $' . count($params); }
    $sql .= ' ORDER BY COALESCE(publish_at, created_at) DESC';
    send(array_map('with_abs_image', q($sql, $params)->rows));
});
// Les voitures ne sont pas encore proposées : le site reçoit des listes vides.
route('GET', '/api/public/vehicles', fn() => send([]));
route('GET', '/api/public/vehicles/:id', fn() => fail(404, 'NOT_FOUND'));
route('GET', '/api/public/categories', fn() => send([]));

/* ---------- Contact, lettre d'information ---------- */
route('POST', '/api/contact', function (Req $req) {
    $b = $req->body();
    $name = (string)v_str($b, 'name', ['trim' => true, 'min' => 2, 'max' => 100]);
    $email = (string)v_str($b, 'email', ['trim' => true, 'email' => true, 'max' => 200]);
    $message = (string)v_str($b, 'message', ['trim' => true, 'min' => 5, 'max' => 3000]);
    $ip = $req->ip();
    if (is_locked_out("contact:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    record_failed_attempt("contact:$ip", $ip);
    $cm = q1('INSERT INTO contact_messages(name, email, message) VALUES ($1,$2,$3) RETURNING id', [$name, strtolower($email), $message]);
    push_notification('staff', 'contact', 'Message de contact', $name, '', (string)$cm['id']);
    notify(staff_email(), notification_email('[TripVision] Nouveau message de contact', 'Nouveau message de contact', mail_text($name) . ' a envoyé un message depuis le site.', 'Ouvrir le back-office', staff_link('notifications')), $email);
    send(['ok' => true], 201);
});
route('POST', '/api/newsletter', function (Req $req) {
    $email = (string)v_str($req->body(), 'email', ['trim' => true, 'email' => true, 'max' => 200]);
    $ip = $req->ip();
    if (is_locked_out("newsletter:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    record_failed_attempt("newsletter:$ip", $ip);
    q('INSERT INTO newsletter_subscribers(email) VALUES ($1) ON CONFLICT DO NOTHING', [strtolower($email)]);
    send(['ok' => true], 201);
});
route('POST', '/api/public/contact', function (Req $req) {
    $b = $req->body();
    $name = (string)v_str($b, 'name', ['trim' => true, 'min' => 2, 'max' => 100]);
    $email = (string)v_str($b, 'email', ['trim' => true, 'email' => true, 'max' => 160]);
    $subject = (string)v_str($b, 'subject', ['trim' => true, 'min' => 2, 'max' => 120]);
    $message = (string)v_str($b, 'message', ['trim' => true, 'min' => 5, 'max' => 5000]);
    $website = (string)v_str($b, 'website', ['required' => false, 'default' => '']);
    if ($website !== '') send(['sent' => true]);
    $ip = $req->ip();
    if (is_locked_out("contact:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    record_failed_attempt("contact:$ip", $ip);
    $subject = preg_replace('/[\r\n]+/', ' ', $subject);
    $cm = q1('INSERT INTO contact_messages(name, email, subject, message) VALUES ($1,$2,$3,$4) RETURNING id', [$name, strtolower($email), $subject, $message]);
    push_notification('staff', 'contact', 'Message de contact', $name, '', (string)$cm['id']);
    notify(staff_email(), notification_email('[TripVision] Nouveau message de contact', 'Nouveau message de contact', mail_text($name) . ' a envoyé un message depuis le site.', 'Ouvrir le back-office', staff_link('notifications')), $email);
    send(['sent' => true], 201);
});

/* ---------- Demandes sur une offre (vol : e-mail seul ; pack : compte client) ---------- */
function offer_company(array $o): string
{
    $p = trim((string)($o['partner_name'] ?? ''));
    if ($p !== '') return $p;
    $a = trim((string)($o['details']['flight']['airline'] ?? ''));
    return $a !== '' ? $a : 'TripVision';
}
route('POST', '/api/public/offer-requests', function (Req $req) {
    $b = $req->body();
    $offerId = (string)v_str($b, 'offerId', ['uuid' => true]);
    $name = v_str($b, 'name', ['trim' => true, 'max' => 100, 'required' => false]);
    $email = (string)v_str($b, 'email', ['trim' => true, 'email' => true, 'max' => 160]);
    $marketing = v_bool($b, 'marketing');
    $phone = v_str($b, 'phone', ['trim' => true, 'max' => 40, 'required' => false]);
    $travelers = (int)v_num($b, 'travelers', ['int' => true, 'min' => 1, 'max' => 9, 'default' => 1]);
    $message = v_str($b, 'message', ['trim' => true, 'max' => 2000, 'required' => false]);
    $tripTypeIn = v_str($b, 'tripType', ['in' => ['roundtrip', 'oneway'], 'required' => false]);
    $ip = $req->ip();
    if (is_locked_out("contact:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    $o = q1("SELECT * FROM offers WHERE id = $1 AND status = 'active' AND deleted_at IS NULL AND (publish_at IS NULL OR publish_at <= now()) AND " . LIVE_DATES, [$offerId]);
    if (!$o) fail(404, 'NOT_FOUND', 'Cette offre n’est plus réservable.');
    $client = optional_client($req);
    if ($o['type'] === 'pack' && !$client) fail(401, 'ACCOUNT_REQUIRED', 'Créez un compte ou connectez-vous pour réserver un pack.');
    if ($client) { $email = $client['email']; $name = $name ?: $client['name']; }
    $name = trim((string)$name) ?: explode('@', $email)[0];
    record_failed_attempt("contact:$ip", $ip);
    $f = $o['details']['flight'] ?? null;
    $tripType = null; $unit = (float)$o['price'];
    if ($o['type'] === 'flight' && $f) {
        $tripType = ($f['tripType'] ?? '') === 'oneway' ? 'oneway' : ($tripTypeIn ?: 'roundtrip');
        if ($tripType === 'oneway' && ($f['tripType'] ?? '') === 'roundtrip') {
            if (empty($f['oneWayPrice'])) fail(409, 'ONE_WAY_UNAVAILABLE');
            $unit = (float)$f['oneWayPrice'];
        }
    }
    $total = $unit * $travelers;
    $withReturn = $tripType !== 'oneway' && $o['end_date'];
    $summary = ($o['from_city'] ?: '—') . ' → ' . $o['to_city'] . ($o['start_date'] ? ' · ' . substr((string)$o['start_date'], 0, 10) . ($withReturn ? ' → ' . substr((string)$o['end_date'], 0, 10) : '') : '');
    q('INSERT INTO offer_requests(offer_id, offer_type, offer_title, summary, customer_name, customer_email, customer_phone, travelers, total, message, trip_type, partner_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [$o['id'], $o['type'], $o['title'], $summary, $name, strtolower($email), $phone ?: null, $travelers, $total, $message ?: null, $tripType, offer_company($o)]);
    $contact = $o['type'] === 'flight' ? record_contact($email, $name, $phone, 'vol', (bool)$marketing, 1) : ['returning' => false];
    $created = q1('SELECT id FROM offer_requests WHERE lower(customer_email) = $1 ORDER BY created_at DESC LIMIT 1', [strtolower($email)]);
    $ref = booking_ref($created['id'] ?? $o['id']);
    $details = [['Référence', $ref], ['Offre', $o['title']], ['Trajet', ($o['from_city'] ?: '—') . ' → ' . $o['to_city']], ['Type de billet', $tripType === 'oneway' ? 'Aller simple' : ($tripType === 'roundtrip' ? 'Aller-retour' : '')],
        ['Dates', implode(' → ', array_filter([mail_day($o['start_date']), $withReturn ? mail_day($o['end_date']) : '']))], ['Voyageurs', (string)$travelers], ['Total estimé', num($total) . ' €']];
    notify(staff_email(), notification_email('[TripVision] Nouvelle demande ' . ($o['type'] === 'flight' ? 'de vol' : 'de pack') . " $ref", 'Nouvelle demande de réservation', mail_text($name) . ' souhaite réserver ' . ($o['type'] === 'flight' ? 'un vol' : 'un pack') . '.', 'Ouvrir le back-office', staff_link('bookings'), [...$details, ['Client', $name]]), $email);
    push_notification('staff', 'request', 'Nouvelle demande ' . ($o['type'] === 'flight' ? 'de vol' : 'de pack'), "$ref · $name", 'bookings', (string)($created['id'] ?? ''));
    notify($email, notification_email('Votre demande TripVision est bien reçue', 'Demande bien reçue', 'Merci ! Nous avons bien reçu votre demande de réservation et revenons vers vous très vite pour la confirmer.', 'Suivre ma réservation', espace_link('orders'), $details));
    send(['sent' => true, 'returning' => $contact['returning']], 201);
});

/* ---------- E-mail laissé avant d'ouvrir le site de la compagnie ---------- */
route('POST', '/api/public/flight-leads', function (Req $req) {
    $b = $req->body();
    $offerId = (string)v_str($b, 'offerId', ['uuid' => true]);
    $email = (string)v_str($b, 'email', ['trim' => true, 'email' => true, 'max' => 160]);
    $consent = (bool)v_bool($b, 'consent', false);
    $ip = $req->ip();
    if (is_locked_out("lead:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    $o = q1("SELECT id, title, from_city, to_city, details FROM offers WHERE id = $1 AND type = 'flight' AND status = 'active' AND deleted_at IS NULL", [$offerId]);
    if (!$o) fail(404, 'NOT_FOUND');
    record_failed_attempt("lead:$ip", $ip);
    $email = strtolower($email);
    q('INSERT INTO flight_leads(offer_id, airline, route, email, consent) VALUES ($1,$2,$3,$4,$5)', [$o['id'], $o['details']['flight']['airline'] ?? null, ($o['from_city'] ?: '—') . ' → ' . $o['to_city'], $email, $consent]);
    record_contact($email, null, null, 'vol', $consent, 0);
    send(['ok' => true], 201);
});

/* ---------- Suivi des visites (tendances) ---------- */
const TRACK_KINDS = ['dest_view', 'flight_click', 'pack_view', 'car_view', 'search_flight', 'search_car', 'search_pack'];
route('POST', '/api/public/track', function (Req $req) {
    $b = $req->body();
    try {
        $kind = (string)v_str($b, 'kind', ['in' => TRACK_KINDS]);
        $key = (string)v_str($b, 'key', ['trim' => true, 'min' => 1, 'max' => 120]);
        $city = v_str($b, 'city', ['trim' => true, 'max' => 80, 'required' => false]);
        $country = v_str($b, 'country', ['trim' => true, 'max' => 80, 'required' => false]);
        $label = v_str($b, 'label', ['trim' => true, 'max' => 160, 'required' => false]);
    } catch (ValidationFailed) { send(null, 204); }
    $ip = $req->ip();
    if (throttle_count("m|$ip|" . intdiv(time(), 60), 60) > 60) send(null, 204);
    // Un même visiteur n'est compté qu'une fois par page toutes les 30 minutes.
    if (throttle_count("$ip|$kind|$key", 1800) > 1) send(null, 204);
    q('INSERT INTO site_events(kind, key, city, country, label) VALUES ($1,$2,$3,$4,$5)', [$kind, $key, $city ?: null, $country ?: null, $label ?: null]);
    send(null, 204);
});

/* ---------- Géographie ---------- */
route('GET', '/api/geo/countries', fn(Req $r) => send(geo_countries(substr($r->q('region'), 0, 10)), 200, ['Cache-Control' => 'public, max-age=86400']));
route('GET', '/api/geo/airports', function (Req $r) {
    $q = substr($r->q('q'), 0, 60); $cc = substr($r->q('country'), 0, 2);
    send(geo_search_airports($q, ['countryCode' => $cc, 'city' => substr($r->q('city'), 0, 80), 'region' => substr($r->q('region'), 0, 10), 'limit' => ($cc !== '' && $q === '') ? 600 : 12]), 200, ['Cache-Control' => 'public, max-age=3600']);
});
route('GET', '/api/geo/places', fn(Req $r) => send(geo_search_places(substr($r->q('q'), 0, 60), 12, substr($r->q('country'), 0, 2)), 200, ['Cache-Control' => 'public, max-age=3600']));
route('GET', '/api/geo/cities', function (Req $r) {
    $q = substr($r->q('q'), 0, 60);
    send(geo_search_cities($q, substr($r->q('country'), 0, 2), $q !== '' ? 10 : 40, substr($r->q('region'), 0, 10)), 200, ['Cache-Control' => 'public, max-age=3600']);
});

/* ---------- Images importées (stockées en base) ---------- */
route('GET', '/uploads/:id', function (Req $req) {
    $id = $req->param('id');
    if (!preg_match('/^[0-9a-f-]{36}$/i', $id)) fail(404, 'NOT_FOUND');
    $row = q1('SELECT mime, data FROM files WHERE id = $1', [$id]);
    if (!$row) fail(404, 'NOT_FOUND');
    send_raw((string)$row['data'], (string)$row['mime'], 200, ['Cache-Control' => 'public, max-age=31536000, immutable', 'X-Content-Type-Options' => 'nosniff', 'Cross-Origin-Resource-Policy' => 'cross-origin']);
});
