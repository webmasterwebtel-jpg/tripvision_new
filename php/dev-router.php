<?php
/* Serveur local : php -S 127.0.0.1:8080 php/dev-router.php (depuis la racine du projet). Sert le site et l'API. */
$root = dirname(__DIR__);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$isApi = str_starts_with($path, '/api/') || str_starts_with($path, '/uploads/') || $path === '/unsubscribe';
if (!$isApi) {
    $f = $path === '/' ? '/index.html' : $path;
    foreach (['backoffice', 'espace', 'activation', 'assets'] as $d) if ($path === "/$d" || $path === "/$d/") $f = "/$d/index.html";
    $ok = in_array(ltrim($f, '/'), ['index.html', 'styles.css', 'premium.css', 'script.js'], true) || preg_match('#^/(backoffice|espace|activation|assets)/#', $f);
    $full = realpath($root . $f);
    if ($ok && $full && str_starts_with($full, $root) && is_file($full)) {
        $types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8', 'js' => 'application/javascript; charset=utf-8', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'svg' => 'image/svg+xml', 'webp' => 'image/webp', 'json' => 'application/json', 'ico' => 'image/x-icon'];
        header('Content-Type: ' . ($types[strtolower(pathinfo($full, PATHINFO_EXTENSION))] ?? 'application/octet-stream'));
        readfile($full); return;
    }
    http_response_code(404); echo 'Not found'; return;
}
define('TV_APP', __DIR__ . '/src');
require TV_APP . '/bootstrap.php';
tv_handle();
