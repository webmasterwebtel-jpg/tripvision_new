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
