<?php
declare(strict_types=1);
/* Tâches planifiées : alertes de prix, paiements expirés, clôture des conversations, rythme de publication, brouillons de vols.
   Déclenchées par le CRON de l'hébergeur (…/api/cron/run?key=…) et, à défaut, au fil des visites (au plus une fois toutes les 5 minutes). */

/** Vrai pour un seul exécutant par période (UPDATE conditionnel sur job_runs). */
function job_due(string $name, int $minutes): bool
{
    q('INSERT INTO job_runs(name, last_run_at) VALUES ($1, now() - interval \'1 day\') ON CONFLICT (name) DO NOTHING', [$name]);
    return (bool)q1("UPDATE job_runs SET last_run_at = now() WHERE name = $1 AND last_run_at <= now() - ($2 || ' minutes')::interval RETURNING name", [$name, (string)$minutes]);
}
function run_jobs(bool $force = false): array
{
    $out = [];
    $step = function (string $name, callable $fn) use (&$out) { try { $out[$name] = $fn(); } catch (Throwable $e) { error_log("Tâche $name : " . $e->getMessage()); $out[$name] = 'erreur'; } };
    $step('alertes', fn() => check_price_alerts());
    $step('paiements', fn() => expire_unpaid());
    if ($force || job_due('chat_autoclose', 60)) $step('conversations', fn() => auto_close_chats());
    if ($force || job_due('freshness', 60)) $step('rythme', function () { check_freshness(); return 'ok'; });
    $step('brouillons', fn() => maybe_renew_drafts() ?? 'pas encore');
    return $out;
}
/** Appelée après l'envoi de la réponse : lance les tâches si le CRON ne l'a pas fait depuis 5 minutes. */
function opportunistic_jobs(): void
{
    if (env('DISABLE_VISIT_JOBS') === '1') return;
    try { if (job_due('tick', 5)) run_jobs(); } catch (Throwable $e) { error_log('Tâches : ' . $e->getMessage()); }
}
function cron_route(Req $req): never
{
    $key = env('CRON_KEY');
    $given = $req->q('key') ?: $req->header('x-cron-key');
    if (!$key || !hash_equals($key, (string)$given)) fail(404, 'NOT_FOUND');
    q('INSERT INTO job_runs(name, last_run_at) VALUES (\'tick\', now()) ON CONFLICT (name) DO UPDATE SET last_run_at = now()');
    send(['ok' => true, 'jobs' => run_jobs(true), 'time' => iso_now()]);
}
route('GET', '/api/cron/run', fn(Req $r) => cron_route($r));
route('POST', '/api/cron/run', fn(Req $r) => cron_route($r));

/** Vérification de l'hébergement : extensions PHP, base de données, accès sortants (Stripe, e-mail). Protégée par CRON_KEY. */
route('GET', '/api/cron/check', function (Req $req) {
    $key = env('CRON_KEY');
    if (!$key || !hash_equals($key, (string)($req->q('key') ?: $req->header('x-cron-key')))) fail(404, 'NOT_FOUND');
    $out = ['php' => PHP_VERSION, 'extensions' => []];
    foreach (['pdo_mysql', 'curl', 'mbstring', 'openssl', 'zip', 'gd', 'json'] as $e) $out['extensions'][$e] = extension_loaded($e);
    try { $t = microtime(true); $out['database'] = ['ok' => (int)q1('SELECT 1 AS x')['x'] === 1, 'ms' => (int)round((microtime(true) - $t) * 1000), 'version' => q1('SELECT VERSION() AS v')['v'], 'tables' => (int)q1('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()')['n']]; }
    catch (Throwable $e) { $out['database'] = ['ok' => false, 'error' => $e->getMessage()]; }
    if (function_exists('curl_init')) {
        $ch = curl_init('https://api.stripe.com/v1'); curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]); curl_exec($ch);
        $out['stripe'] = ['reachable' => curl_getinfo($ch, CURLINFO_RESPONSE_CODE) > 0, 'error' => curl_error($ch) ?: null]; curl_close($ch);
    }
    $out['mail'] = ['configured' => mail_ready(), 'mode' => env('BREVO_API_KEY') ? 'brevo' : (env('SMTP_HOST') ? 'smtp' : (env('MAIL_NATIVE') === '1' ? 'mail()' : 'aucun'))];
    if (env('SMTP_HOST')) { $fp = @stream_socket_client('tcp://' . env('SMTP_HOST') . ':' . (env('SMTP_PORT') ?: '587'), $en, $es, 8); $out['mail']['smtp_reachable'] = (bool)$fp; if ($fp) fclose($fp); }
    $out['settings'] = ['APP_URL' => env('APP_URL'), 'stripe_key' => payments_enabled() ? (payments_test_mode() ? 'test' : 'live') : 'absente', 'webhook_secret' => (bool)stripe_webhook_secret(), 'support_email' => (bool)staff_email(), 'jwt' => (bool)env('JWT_SECRET')];
    $out['time'] = iso_now();
    send($out);
});
