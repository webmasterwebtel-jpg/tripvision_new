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

echo "
--- Essais de connexion à la base (sans mot de passe affiché) ---
";
$cfg = [];
foreach (['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as $k) $cfg[$k] = $env !== false && preg_match('/^' . $k . '=(.*)$/m', $env, $m) ? trim($m[1], " 	
\"'") : '';
echo 'DB_HOST=', $cfg['DB_HOST'], ' DB_PORT=', $cfg['DB_PORT'] ?: '(3306)', ' DB_NAME=', $cfg['DB_NAME'], ' DB_USER=', $cfg['DB_USER'], ' mot de passe: ', $cfg['DB_PASSWORD'] === '' || $cfg['DB_PASSWORD'] === 'A_REMPLIR' ? 'NON RENSEIGNÉ' : 'renseigné (' . strlen($cfg['DB_PASSWORD']) . " caractères)
";
$hosts = array_unique(array_filter([$cfg['DB_HOST'], 'localhost', '127.0.0.1', 'c11-sq115', 'mysql']));
foreach ($hosts as $h) foreach (array_unique([(int)($cfg['DB_PORT'] ?: 3306), 3306]) as $port) {
    try {
        $dsn = $h === 'localhost' && $port === 3306 ? "mysql:host=$h;dbname={$cfg['DB_NAME']};charset=utf8mb4" : "mysql:host=$h;port=$port;dbname={$cfg['DB_NAME']};charset=utf8mb4";
        $p = new PDO($dsn, $cfg['DB_USER'], $cfg['DB_PASSWORD'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]);
        echo "  $h:$port -> CONNEXION OK (", $p->query('SELECT VERSION()')->fetchColumn(), ', ', $p->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')->fetchColumn(), " tables)
";
    } catch (Throwable $t) { echo "  $h:$port -> ", substr($t->getMessage(), 0, 160), "
"; }
}

echo "\n--- Réglages PHP de l'hébergeur pour MySQL ---\n";
foreach (['pdo_mysql.default_socket', 'mysqli.default_host', 'mysqli.default_port', 'mysqli.default_socket', 'mysqlnd.net_read_timeout'] as $k) echo "  $k = ", var_export(ini_get($k), true), "\n";
echo "\n--- Ports ouverts ---\n";
foreach (['c11-sq115', '127.0.0.1'] as $h) foreach ([3306, 3307, 3308, 3309, 33060, 5432] as $port) {
    $fp = @stream_socket_client("tcp://$h:$port", $en, $es, 3);
    echo "  $h:$port -> ", $fp ? 'OUVERT' : "fermé ($es)", "\n";
    if ($fp) fclose($fp);
}
echo "\n--- Sockets possibles ---\n";
foreach (array_filter([ini_get('pdo_mysql.default_socket'), ini_get('mysqli.default_socket'), '/var/run/mysqld/mysqld.sock', '/var/lib/mysql/mysql.sock', '/tmp/mysql.sock', '/run/mysqld/mysqld.sock']) as $sock) {
    echo "  $sock -> ", @file_exists($sock) ? 'présent' : 'absent', "\n";
    if (@file_exists($sock)) {
        try { $p = new PDO("mysql:unix_socket=$sock;dbname={$cfg['DB_NAME']};charset=utf8mb4", $cfg['DB_USER'], $cfg['DB_PASSWORD'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); echo "     CONNEXION OK par ce socket\n"; }
        catch (Throwable $t) { echo '     ', substr($t->getMessage(), 0, 140), "\n"; }
    }
}
