<?php
/* Transfert des données de l'ancienne base PostgreSQL (Supabase) vers MariaDB (structure : php/db/schema.sql). Lecture seule côté PostgreSQL.
   Deux façons :
     1) Fichier SQL à importer dans phpMyAdmin (hébergement mutualisé, base non joignable de l'extérieur) :
          php php/tools/copy-postgres-to-mariadb.php "postgres://…" donnees.sql
        → importer d'abord php/db/schema.sql, puis donnees.sql (onglet « Importer »). Le fichier vide chaque table avant de la remplir.
     2) Copie directe vers une base MariaDB joignable (tests locaux) :
          php php/tools/copy-postgres-to-mariadb.php "postgres://…" "mysql://utilisateur:motdepasse@hote:3306/base" */
declare(strict_types=1);
ini_set('memory_limit', '1024M');
$pgUrl = $argv[1] ?? '';
$target = $argv[2] ?? '';
if (!str_starts_with($pgUrl, 'postgres') || $target === '') { fwrite(STDERR, "Usage : php copy-postgres-to-mariadb.php <postgres://…> <fichier.sql | mysql://…>\n"); exit(1); }

$p = parse_url($pgUrl);
$pg = pg_connect(sprintf("host='%s' port=%d dbname='%s' user='%s' password='%s' sslmode=%s connect_timeout=15", $p['host'], $p['port'] ?? 5432, ltrim($p['path'] ?? '/postgres', '/'), rawurldecode($p['user'] ?? ''), addcslashes(rawurldecode($p['pass'] ?? ''), "'\\"), str_contains($pgUrl, 'supabase.') ? 'require' : 'prefer'));
if (!$pg) { fwrite(STDERR, "Connexion PostgreSQL impossible\n"); exit(1); }
pg_query($pg, "SET TIME ZONE 'UTC'");

// Tables et colonnes MariaDB, lues dans schema.sql (les colonnes calculées « AS (…) » sont ignorées).
$schema = (string)file_get_contents(dirname(__DIR__) . '/db/schema.sql');
$myTables = [];
preg_match_all('/CREATE TABLE (\w+) \((.*?)\n\) ENGINE/s', $schema, $mm, PREG_SET_ORDER);
foreach ($mm as $t) {
    foreach (explode("\n", $t[2]) as $line) {
        if (preg_match('/^\s+`?(\w+)`?\s+(CHAR|VARCHAR|TEXT|ENUM|TINYINT|INT|BIGINT|SMALLINT|DECIMAL|DATE|DATETIME|JSON|LONGBLOB)\b/', $line, $c) && !str_contains($line, ' AS (')) $myTables[$t[1]][] = $c[1];
    }
}

$toSql = !str_starts_with($target, 'mysql://');
$my = null;
$out = null;
if ($toSql) {
    $out = fopen($target, 'wb');
    fwrite($out, "-- Données TripVision copiées depuis PostgreSQL le " . gmdate('Y-m-d H:i') . " UTC. À importer APRÈS schema.sql.\nSET NAMES utf8mb4;\nSET time_zone = '+00:00';\nSET sql_mode = 'NO_BACKSLASH_ESCAPES';\nSET FOREIGN_KEY_CHECKS = 0;\n\n");
} else {
    $m = parse_url($target);
    $my = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $m['host'], $m['port'] ?? 3306, ltrim($m['path'], '/')), rawurldecode($m['user'] ?? ''), rawurldecode($m['pass'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $my->exec("SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES,NO_BACKSLASH_ESCAPES', FOREIGN_KEY_CHECKS = 0");
}
$lit = function (mixed $v, bool $bin) use (&$my): string {
    if ($v === null) return 'NULL';
    if (is_int($v)) return (string)$v;
    if ($bin) return $v === '' ? "''" : '0x' . bin2hex($v);
    return "'" . str_replace("'", "''", (string)$v) . "'";
};

$total = 0;
foreach ($myTables as $table => $myCols) {
    if ($table === 'schema_migrations') continue;
    $exists = pg_fetch_row(pg_query_params($pg, "SELECT to_regclass('public.' || $1) IS NOT NULL", [$table]))[0] === 't';
    if (!$exists) { echo str_pad($table, 26) . "absente de PostgreSQL\n"; continue; }
    $pgCols = [];
    $r = pg_query_params($pg, "SELECT column_name, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [$table]);
    while ($c = pg_fetch_assoc($r)) $pgCols[$c['column_name']] = $c['udt_name'];
    $cols = array_values(array_intersect($myCols, array_keys($pgCols)));
    $missing = array_diff(array_keys($pgCols), $cols);
    $res = pg_query($pg, 'SELECT ' . implode(', ', array_map(fn($c) => '"' . $c . '"', $cols)) . " FROM \"$table\"");
    $colList = implode(', ', array_map(fn($c) => "`$c`", $cols));
    $n = 0;
    $batch = [];
    $flush = function () use (&$batch, $out, $table, $colList) {
        if ($batch) fwrite($out, "INSERT INTO `$table` ($colList) VALUES\n" . implode(",\n", $batch) . ";\n");
        $batch = [];
    };
    if ($toSql) fwrite($out, "DELETE FROM `$table`;\n");
    else { $my->exec("DELETE FROM `$table`"); $ins = $my->prepare("INSERT INTO `$table` ($colList) VALUES (" . implode(', ', array_fill(0, count($cols), '?')) . ')'); $my->beginTransaction(); }
    while ($row = pg_fetch_assoc($res)) {
        $vals = [];
        foreach ($cols as $c) {
            $v = $row[$c];
            $t = $pgCols[$c];
            if ($v !== null) {
                if ($t === 'bool') $v = $v === 't' ? 1 : 0;
                elseif ($t === 'timestamptz' || $t === 'timestamp') $v = (new DateTimeImmutable($v, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
                elseif ($t === 'bytea') $v = pg_unescape_bytea($v);
                elseif ($t[0] === '_') $v = json_encode(pg_array($v), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
            $vals[] = $v;
        }
        if ($toSql) {
            $batch[] = '(' . implode(', ', array_map(fn($v, $c) => $lit($v, $pgCols[$c] === 'bytea'), $vals, $cols)) . ')';
            if (count($batch) >= ($table === 'files' ? 5 : 200)) $flush();
        } else {
            foreach ($vals as $i => $v) $ins->bindValue($i + 1, $v, $v === null ? PDO::PARAM_NULL : ($pgCols[$cols[$i]] === 'bytea' ? PDO::PARAM_LOB : (is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR)));
            $ins->execute();
        }
        $n++;
    }
    if ($toSql) { $flush(); fwrite($out, "\n"); } else $my->commit();
    $total += $n;
    echo str_pad($table, 26) . str_pad((string)$n, 7, ' ', STR_PAD_LEFT) . ' lignes' . ($missing ? '   (colonnes ignorées : ' . implode(', ', $missing) . ')' : '') . "\n";
}
if ($toSql) { fwrite($out, "SET FOREIGN_KEY_CHECKS = 1;\n"); fclose($out); echo "Fichier écrit : $target (" . round(filesize($target) / 1048576, 1) . " Mo)\n"; }
else $my->exec('SET FOREIGN_KEY_CHECKS = 1');
echo "Terminé : $total lignes.\n";

function pg_array(string $s): array
{
    $s = trim($s);
    if ($s === '{}' || $s === '') return [];
    $s = substr($s, 1, -1);
    $out = []; $cur = ''; $q = false; $esc = false; $wasQ = false;
    for ($i = 0, $n = strlen($s); $i < $n; $i++) {
        $c = $s[$i];
        if ($esc) { $cur .= $c; $esc = false; continue; }
        if ($c === '\\') { $esc = true; continue; }
        if ($c === '"') { $q = !$q; $wasQ = true; continue; }
        if ($c === ',' && !$q) { $out[] = (!$wasQ && $cur === 'NULL') ? null : $cur; $cur = ''; $wasQ = false; continue; }
        $cur .= $c;
    }
    $out[] = (!$wasQ && $cur === 'NULL') ? null : $cur;
    return $out;
}
