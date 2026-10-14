<?php
declare(strict_types=1);
/* Packs week-end : réservation avec paiement en ligne (Stripe Checkout), retour de paiement, abandon, webhook, remboursement. */

function announce_pack(array $r): void
{
    $o = q1('SELECT * FROM offers WHERE id = $1', [$r['offer_id']]) ?: [];
    $ref = booking_ref($r['id']);
    $paid = $r['payment_status'] === 'paid';
    $o['from_city'] = ($o['from_city'] ?? '') ?: '—';
    $details = [['Référence', $ref], ['Séjour', $r['offer_title']], ['Trajet', $o['from_city'] . ' → ' . ($o['to_city'] ?? '')], ['Dates', implode(' → ', array_filter([mail_day($o['start_date'] ?? null), ($o['end_date'] ?? null) ? mail_day($o['end_date']) : '']))],
        ['Voyageurs', (string)$r['travelers']], [$paid ? 'Payé en ligne' : 'Total', num($r['paid_amount'] ?? $r['total']) . ' €']];
    $who = mail_text($r['customer_name']);
    notify(staff_email(), notification_email('[TripVision] ' . ($paid ? 'Pack réservé et payé' : 'Nouvelle demande de pack') . " $ref", $paid ? 'Pack réservé et payé' : 'Nouvelle demande de pack',
        $paid ? "$who vient de réserver et de payer un séjour." : "$who souhaite réserver un séjour.", 'Ouvrir le back-office', staff_link('bookings'), [...$details, ['Client', $r['customer_name']]]), $r['customer_email']);
    push_notification('staff', 'request', $paid ? 'Pack réservé et payé' : 'Nouvelle demande de pack', "$ref · " . $r['customer_name'], 'bookings', (string)$r['id']);
    push_notification(client_user_id($r['customer_email']), 'request', $paid ? 'Réservation confirmée' : 'Demande enregistrée', "$ref · " . $r['offer_title'], 'orders', (string)$r['id']);
    notify($r['customer_email'], notification_email($paid ? 'Votre réservation TripVision est confirmée' : 'Votre demande TripVision est bien reçue', $paid ? 'Réservation confirmée' : 'Demande bien reçue',
        $paid ? 'Merci, votre séjour est confirmé ! Votre paiement est bien enregistré. Retrouvez le détail de votre réservation et votre justificatif dans votre espace client.' : 'Merci ! Nous avons bien reçu votre demande et revenons vers vous très vite pour la confirmer.',
        'Voir ma réservation', espace_link('orders'), $details));
}
function fail_pack(string $id): bool
{
    return (bool)q1("UPDATE offer_requests SET payment_status = 'failed', status = 'cancelled', status_changed_at = now() WHERE id = $1 AND payment_status = 'awaiting' RETURNING id", [$id]);
}
/** Idempotent : appelé par le retour de paiement et par le webhook. */
function finalize_pack_paid(string $id, array $session): ?array
{
    $pi = is_string($session['payment_intent'] ?? null) ? $session['payment_intent'] : ($session['payment_intent']['id'] ?? null);
    $r = q1("UPDATE offer_requests SET payment_status = 'paid', status = 'confirmed', status_changed_at = now(), paid_amount = $2, paid_at = now(), stripe_payment_intent = $3 WHERE id = $1 AND payment_status = 'awaiting' RETURNING *", [$id, ((float)($session['amount_total'] ?? 0)) / 100, $pi]);
    if ($r) announce_pack($r);
    return $r;
}
function refund_pack(array $r): void
{
    if (!payments_enabled() || $r['payment_status'] !== 'paid' || !$r['stripe_payment_intent']) return;
    try {
        stripe_refund($r['stripe_payment_intent']);
        q("UPDATE offer_requests SET payment_status = 'refunded' WHERE id = $1", [$r['id']]);
        push_notification('staff', 'request', 'Pack remboursé', booking_ref($r['id']) . ' · ' . num($r['paid_amount'] ?? 0) . ' €', 'bookings', (string)$r['id']);
    } catch (Throwable $e) {
        error_log('Remboursement Stripe impossible : ' . $e->getMessage());
        push_notification('staff', 'request', 'Remboursement à faire à la main', booking_ref($r['id']) . ' : le remboursement automatique a échoué.', 'bookings', (string)$r['id']);
    }
}

route('POST', '/api/pack-bookings', function (Req $req) {
    $u = require_auth($req, ['client']);
    $b = $req->body();
    $offerId = (string)v_str($b, 'offerId', ['uuid' => true]);
    $travelers = (int)v_num($b, 'travelers', ['int' => true, 'min' => 1, 'max' => 9, 'default' => 1]);
    $nameIn = v_str($b, 'name', ['trim' => true, 'max' => 100, 'required' => false]);
    $phone = phone_field($b);
    $message = v_str($b, 'message', ['trim' => true, 'max' => 2000, 'required' => false]);
    $ip = $req->ip();
    if (is_locked_out("contact:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    $o = q1("SELECT * FROM offers WHERE id = $1 AND type = 'pack' AND status = 'active' AND deleted_at IS NULL AND (publish_at IS NULL OR publish_at <= now()) AND " . LIVE_DATES, [$offerId]);
    if (!$o) fail(404, 'OFFER_CLOSED', 'Les réservations de ce séjour sont closes : un pack se réserve au plus tard la veille du départ.');
    record_failed_attempt("contact:$ip", $ip);
    $total = (float)$o['price'] * $travelers;
    $name = $nameIn ?: ($u['name'] ?: explode('@', $u['email'])[0]);
    $summary = ($o['from_city'] ?: '—') . ' → ' . $o['to_city'] . ($o['start_date'] ? ' · ' . substr((string)$o['start_date'], 0, 10) . ($o['end_date'] ? ' → ' . substr((string)$o['end_date'], 0, 10) : '') : '');
    $r = q1('INSERT INTO offer_requests(offer_id, offer_type, offer_title, summary, customer_name, customer_email, customer_phone, travelers, total, message, payment_status, cancel_token, partner_name) VALUES ($1,\'pack\',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
        [$o['id'], $o['title'], $summary, $name, strtolower($u['email']), $phone, $travelers, $total, $message ?: null, payments_enabled() ? 'awaiting' : 'none', bin2hex(random_bytes(24)), offer_company($o)]);
    $ref = booking_ref($r['id']);
    if (!payments_enabled()) { announce_pack($r); send(['requested' => true, 'reference' => $ref], 201); }
    try {
        $app = app_url();
        $session = stripe_create_checkout([
            'bookingId' => $r['id'], 'reference' => $ref, 'cancelToken' => $r['cancel_token'], 'email' => $r['customer_email'], 'kind' => 'pack', 'appUrl' => $app,
            'lines' => [['label' => $o['title'] . ' · ' . $travelers . ' voyageur' . ($travelers > 1 ? 's' : ''), 'amount' => $total]],
            'description' => "Séjour TripVision $ref",
            'successUrl' => "$app/?payment=success&kind=pack&session_id={CHECKOUT_SESSION_ID}",
            'cancelUrl' => "$app/?payment=cancelled&kind=pack&r={$r['id']}&t={$r['cancel_token']}&o={$o['id']}",
        ]);
        q('UPDATE offer_requests SET stripe_session_id = $1 WHERE id = $2', [$session['id'], $r['id']]);
        send(['checkoutUrl' => $session['url'], 'reference' => $ref], 201);
    } catch (HttpExit $e) { throw $e; }
    catch (Throwable $e) {
        error_log('Stripe : ' . $e->getMessage());
        fail_pack($r['id']);
        fail(502, 'PAYMENT_UNAVAILABLE', 'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants.');
    }
});

route('GET', '/api/payments/pack-session/:id', function (Req $req) {
    if (!payments_enabled()) fail(404, 'NOT_FOUND');
    $sid = $req->param('id');
    $r = q1('SELECT * FROM offer_requests WHERE stripe_session_id = $1', [$sid]);
    if (!$r) fail(404, 'NOT_FOUND');
    $session = stripe_retrieve_session($sid);
    if (($session['payment_status'] ?? '') === 'paid') $r = finalize_pack_paid($r['id'], $session) ?: q1('SELECT * FROM offer_requests WHERE id = $1', [$r['id']]);
    elseif (($session['status'] ?? '') === 'expired') { fail_pack($r['id']); $r = q1('SELECT * FROM offer_requests WHERE id = $1', [$r['id']]); }
    send(['status' => $r['payment_status'], 'reference' => booking_ref($r['id']), 'title' => $r['offer_title'], 'summary' => $r['summary'], 'travelers' => $r['travelers'], 'total' => (float)$r['total'] + 0, 'paid' => $r['paid_amount'] === null ? null : (float)$r['paid_amount'] + 0, 'offerId' => $r['offer_id']]);
});

// Paiement abandonné : la demande est annulée.
route('POST', '/api/payments/pack-cancel', function (Req $req) {
    $b = $req->body();
    $rid = (string)v_str($b, 'requestId', ['uuid' => true]);
    $token = (string)v_str($b, 'token', ['min' => 10, 'max' => 100]);
    $r = q1('SELECT * FROM offer_requests WHERE id = $1 AND cancel_token = $2', [$rid, $token]);
    if (!$r) fail(404, 'NOT_FOUND');
    if ($r['payment_status'] === 'awaiting') { if ($r['stripe_session_id']) stripe_expire_session($r['stripe_session_id']); fail_pack($rid); }
    send(['ok' => true]);
});

route('POST', '/api/stripe/webhook', function (Req $req) {
    if (!payments_enabled() || !stripe_webhook_secret()) fail(404, 'NOT_FOUND');
    try { $event = stripe_construct_event($req->raw(), $req->header('stripe-signature')); }
    catch (Throwable) { fail(400, 'INVALID_SIGNATURE'); }
    $session = $event['data']['object'] ?? [];
    $requestId = $session['metadata']['request_id'] ?? null;
    $type = $event['type'] ?? '';
    if ($requestId && is_uuid((string)$requestId)) {
        if ($type === 'checkout.session.completed' && ($session['payment_status'] ?? '') === 'paid') finalize_pack_paid((string)$requestId, $session);
        elseif ($type === 'checkout.session.expired') fail_pack((string)$requestId);
    }
    send(['received' => true]);
});

/** Paiements jamais terminés après 40 minutes : la demande est annulée. Appelée par le CRON. */
function expire_unpaid(): int
{
    if (!payments_enabled()) return 0;
    $packs = q("SELECT id, stripe_session_id FROM offer_requests WHERE payment_status = 'awaiting' AND created_at < now() - interval '40 minutes'")->rows;
    foreach ($packs as $r) { if ($r['stripe_session_id']) stripe_expire_session($r['stripe_session_id']); fail_pack($r['id']); }
    return count($packs);
}
