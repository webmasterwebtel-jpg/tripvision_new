<?php
/* Diagnostic temporaire de l'hébergement : https://VOTRE-SITE/diag.php?key=CRON_KEY
   Affiche la version de PHP, les extensions et l'erreur exacte qui empêche le serveur de démarrer. À SUPPRIMER après usage. */
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
ini_set('display_errors', '1');
error_reporting(E_ALL);
$env = @file_get_contents(__DIR__ . '/app/.env');
$key = $env !== false && preg_match('/^CRON_KEY=(.+)$/m', $env, $m) ? trim($m[1], " \t\r\n\"'") : '';
if ($key === '' || !hash_equals($key, (string)($_GET['key'] ?? ''))) { http_response_code(404); echo 'Not found'; exit; }

echo 'PHP ', PHP_VERSION, ' (', PHP_SAPI, ")\n";
foreach (['pdo_mysql', 'curl', 'mbstring', 'openssl', 'zip', 'gd', 'json', 'intl'] as $e) echo str_pad($e, 12), extension_loaded($e) ? 'oui' : 'NON', "\n";
echo "\nfichiers de app/ : ", implode(', ', array_map('basename', glob(__DIR__ . '/app/*.php') ?: [])), "\n";
echo '.env lisible : ', $env !== false ? 'oui' : 'NON', "\n";
echo 'DB_HOST renseigné : ', $env !== false && preg_match('/^DB_HOST=\S+/m', $env) ? 'oui' : 'NON', "\n";
echo 'open_basedir : ', ini_get('open_basedir') ?: '(aucune)', "\n";

echo "\n--- Chargement du serveur ---\n";
define('TV_APP', __DIR__ . '/app');
set_error_handler(function ($no, $str, $file, $line) { echo "[avertissement] $str ($file:$line)\n"; return true; });
foreach (['core', 'mail', 'helpers', 'geo', 'payments', 'xlsx', 'pdf', 'routes_auth', 'routes_public', 'routes_stats', 'routes_client', 'routes_packs', 'routes_admin', 'routes_chat', 'routes_jobs', 'routes_seo'] as $f) {
    $path = TV_APP . "/$f.php";
    if (!is_file($path)) { echo "MANQUANT : $f.php\n"; continue; }
    try { require_once $path; echo "ok  $f.php\n"; }
    catch (Throwable $t) { echo "ERREUR dans $f.php : ", get_class($t), ' : ', $t->getMessage(), ' (', basename($t->getFile()), ':', $t->getLine(), ")\n"; break; }
}
echo "\n--- Base de données ---\n";
try { echo 'connexion : ', (int)q1('SELECT 1 AS x')['x'] === 1 ? 'ok' : 'échec', "\n"; echo 'version : ', q1('SELECT VERSION() AS v')['v'], "\n"; echo 'tables : ', q1('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()')['n'], "\n"; }
catch (Throwable $t) { echo 'ERREUR : ', $t->getMessage(), "\n"; }
