<?php
/* Point d'entrée de l'API TripVision (version PHP). Les réglages sont dans app/.env — jamais dans ce fichier. */
declare(strict_types=1);
// Diagnostic temporaire (protégé par la CRON_KEY) : https://VOTRE-SITE/api.php?tvdiag=CRON_KEY, seulement si diag.php est présent.
if (isset($_GET['tvdiag']) && is_file(__DIR__ . '/diag.php')) { $_GET['key'] = (string)$_GET['tvdiag']; require __DIR__ . '/diag.php'; exit; }
define('TV_APP', __DIR__ . '/app');
require TV_APP . '/bootstrap.php';
tv_handle();
