<?php
/* Point d'entrée de l'API TripVision (version PHP). Les réglages sont dans app/.env — jamais dans ce fichier. */
declare(strict_types=1);
define('TV_APP', __DIR__ . '/app');
require TV_APP . '/bootstrap.php';
tv_handle();
