<?php
declare(strict_types=1);
/* Point d'entrée commun : charge le socle, les routes, traite la requête. Défini : TV_APP (dossier de ce fichier). */
if (!defined('TV_APP')) define('TV_APP', __DIR__);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once TV_APP . '/core.php';
require_once TV_APP . '/mail.php';
require_once TV_APP . '/helpers.php';
require_once TV_APP . '/geo.php';
require_once TV_APP . '/payments.php';
require_once TV_APP . '/xlsx.php';
foreach (['routes_auth', 'routes_public', 'routes_stats', 'routes_client', 'routes_packs', 'routes_admin', 'routes_chat', 'routes_jobs'] as $f) {
    if (is_file(TV_APP . "/$f.php")) require_once TV_APP . "/$f.php";
}

function tv_handle(): void
{
    security_headers();
    $req = Req::capture();
    if ($req->method === 'OPTIONS') { http_response_code(204); return; }
    try {
        try {
            $r = $GLOBALS['tv_router']->dispatch($req);
            if ($r !== null) send($r);
            send(null, 204);
        } catch (ValidationFailed $v) {
            $msg = null;
            foreach ($v->issues as $i) if (($i['code'] ?? '') === 'custom') { $msg = $i['message']; break; }
            fail(400, 'VALIDATION_ERROR', $msg, ['details' => $v->issues]);
        }
    } catch (HttpExit $e) {
        emit($e);
    } catch (Throwable $t) {
        error_log('[tripvision] ' . $t->getMessage() . ' @ ' . $t->getFile() . ':' . $t->getLine());
        if (env('DEBUG') === '1') emit(new HttpExit(500, ['error' => 'SERVER_ERROR', 'debug' => $t->getMessage() . ' @ ' . basename($t->getFile()) . ':' . $t->getLine()]));
        else emit(new HttpExit(500, ['error' => 'SERVER_ERROR']));
    }
    // Les envois d'e-mails (et autres tâches différées) partent après la réponse.
    if (function_exists('fastcgi_finish_request')) @fastcgi_finish_request();
    else { @ob_flush(); @flush(); }
    try { run_after(); } catch (Throwable $t) { error_log('[tripvision after] ' . $t->getMessage()); }
}
