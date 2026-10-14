<?php
declare(strict_types=1);
/* Paiement en ligne avec Stripe Checkout, sans bibliothèque (appels HTTPS directs). Aucune donnée de carte ne transite par TripVision. */

function stripe_key(): string { return (string)env('STRIPE_SECRET_KEY', ''); }
function payments_enabled(): bool { return stripe_key() !== ''; }
function payments_test_mode(): bool { return str_starts_with(stripe_key(), 'sk_test_'); }
function stripe_webhook_secret(): string { return (string)env('STRIPE_WEBHOOK_SECRET', ''); }
function cents(mixed $euros): int { return (int)round((float)$euros * 100); }

/** Encodage « application/x-www-form-urlencoded » imbriqué à la façon de Stripe : a[b][0]=c. */
function stripe_flatten(array $data, string $prefix = ''): array
{
    $out = [];
    foreach ($data as $k => $v) {
        $key = $prefix === '' ? (string)$k : $prefix . '[' . $k . ']';
        if (is_array($v)) $out += stripe_flatten($v, $key);
        elseif (is_bool($v)) $out[$key] = $v ? 'true' : 'false';
        elseif ($v !== null) $out[$key] = (string)$v;
    }
    return $out;
}
function stripe_call(string $method, string $path, array $data = []): array
{
    if (!payments_enabled()) throw new RuntimeException('Stripe désactivé');
    $ch = curl_init('https://api.stripe.com/v1' . $path);
    $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_USERPWD => stripe_key() . ':', CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => ['Stripe-Version: 2024-06-20']];
    $fields = http_build_query(stripe_flatten($data), '', '&', PHP_QUERY_RFC3986);
    if ($method === 'GET') { if ($fields !== '') curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1' . $path . '?' . $fields); }
    else $opts[CURLOPT_POSTFIELDS] = $fields;
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($res === false) throw new RuntimeException('Stripe injoignable : ' . $err);
    $j = json_decode((string)$res, true);
    if (!is_array($j)) throw new RuntimeException("Stripe : réponse illisible ($code)");
    if ($code >= 400) throw new RuntimeException('Stripe : ' . ($j['error']['message'] ?? "erreur $code"));
    return $j;
}

/** Crée la page de paiement Stripe. $lines : [['label'=>…, 'amount'=>euros]]. */
function stripe_create_checkout(array $o): array
{
    $kind = $o['kind'] ?? 'booking';
    $id = (string)$o['bookingId'];
    $items = [];
    foreach ($o['lines'] as $l) if ((float)$l['amount'] > 0) {
        $items[] = ['quantity' => 1, 'price_data' => ['currency' => 'eur', 'unit_amount' => cents($l['amount']), 'product_data' => ['name' => mb_substr((string)$l['label'], 0, 120)]]];
    }
    $meta = $kind === 'pack' ? ['request_id' => $id] : ($kind === 'cancel' ? ['cancel_booking_id' => $id] : ['booking_id' => $id]);
    $app = $o['appUrl'];
    return stripe_call('POST', '/checkout/sessions', [
        'mode' => 'payment', 'locale' => 'fr', 'customer_email' => $o['email'], 'client_reference_id' => $id,
        'metadata' => $meta + ['reference' => $o['reference']],
        'line_items' => $items,
        'payment_intent_data' => ['description' => $o['description'] ?? ('Réservation TripVision ' . $o['reference']), 'metadata' => $meta],
        'expires_at' => time() + 31 * 60,
        'success_url' => $o['successUrl'] ?? "$app/?payment=success&session_id={CHECKOUT_SESSION_ID}#reserve",
        'cancel_url' => $o['cancelUrl'] ?? "$app/?payment=cancelled&b=$id&t=" . ($o['cancelToken'] ?? '') . '#reserve',
    ]);
}
function stripe_retrieve_session(string $id): array { return stripe_call('GET', '/checkout/sessions/' . rawurlencode($id)); }
function stripe_expire_session(string $id): void { try { stripe_call('POST', '/checkout/sessions/' . rawurlencode($id) . '/expire'); } catch (Throwable) {} }
/** Sans montant : remboursement total ; avec un montant (euros) : partiel. */
function stripe_refund(string $paymentIntent, ?float $amount = null): array
{
    return stripe_call('POST', '/refunds', ['payment_intent' => $paymentIntent] + ($amount ? ['amount' => cents($amount)] : []));
}
/** Vérifie la signature d'un webhook (HMAC-SHA256, tolérance 5 min) et renvoie l'événement. */
function stripe_construct_event(string $raw, string $header): array
{
    $secret = stripe_webhook_secret();
    $t = null; $sigs = [];
    foreach (explode(',', $header) as $part) { $kv = explode('=', trim($part), 2); if (count($kv) !== 2) continue; if ($kv[0] === 't') $t = $kv[1]; if ($kv[0] === 'v1') $sigs[] = $kv[1]; }
    if ($t === null || !$sigs) throw new RuntimeException('Signature absente');
    $expected = hash_hmac('sha256', $t . '.' . $raw, $secret);
    $ok = false;
    foreach ($sigs as $s) if (hash_equals($expected, $s)) $ok = true;
    if (!$ok || abs(time() - (int)$t) > 300) throw new RuntimeException('Signature invalide');
    $e = json_decode($raw, true);
    if (!is_array($e)) throw new RuntimeException('Événement illisible');
    return $e;
}
