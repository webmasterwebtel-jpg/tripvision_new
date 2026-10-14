<?php
declare(strict_types=1);
/* Base de données MariaDB / MySQL (hébergement Nuxit).
   Les requêtes du code restent écrites comme avant ($1, $2…, now(), interval '7 days', details->>'x', ::int, FILTER, ON CONFLICT, RETURNING) :
   elles sont traduites ici en SQL MariaDB 10.4+, une fois par requête (mise en cache). Les cas non traduisibles sont réécrits directement dans le code. */

final class Result
{
    public function __construct(public array $rows, public int $rowCount) {}
}
/** Valeur à enregistrer telle quelle en JSON (liste ou objet). */
final class PgJson { public function __construct(public mixed $value) {} }
/** Contenu binaire (fichiers importés). */
final class PgBytes { public function __construct(public string $data) {} }

final class DB
{
    private static ?PDO $pdo = null;
    private static array $cache = [];
    /** Tables dont l'identifiant est un UUID créé par le serveur (les autres : numéro automatique ou clé fournie). */
    private const UUID_TABLES = ['users', 'partners', 'vehicles', 'offers', 'bookings', 'files', 'contact_messages', 'partner_applications', 'chat_threads', 'chat_messages', 'chat_canned', 'offer_requests', 'notifications', 'vehicle_blocks', 'contacts', 'vehicle_categories', 'price_alerts'];
    private const AUTO_TABLES = ['audit_logs', 'login_attempts', 'login_history', 'auth_tokens', 'site_events', 'flight_leads'];
    /** Colonnes JSON, renvoyées décodées (comme jsonb avec PostgreSQL). */
    private const JSON_COLUMNS = ['details', 'permissions', 'extras', 'conditions_snapshot', 'attachments', 'value', 'sources'];

    public static function config(): array
    {
        $url = env('DATABASE_URL');
        if ($url && preg_match('#^(mysql|mariadb)://#', $url)) {
            $p = parse_url($url);
            return ['host' => $p['host'] ?? 'localhost', 'port' => (int)($p['port'] ?? 3306), 'user' => rawurldecode($p['user'] ?? ''), 'pass' => rawurldecode($p['pass'] ?? ''), 'db' => ltrim($p['path'] ?? '', '/')];
        }
        $db = env('DB_NAME');
        if (!$db) throw new RuntimeException('Base de données non configurée (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)');
        return ['host' => env('DB_HOST', 'localhost'), 'port' => (int)env('DB_PORT', '3306'), 'user' => (string)env('DB_USER', ''), 'pass' => (string)env('DB_PASSWORD', ''), 'db' => $db];
    }
    public static function connect(): PDO
    {
        if (self::$pdo) return self::$pdo;
        $c = self::config();
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'], $c['db']);
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::MYSQL_ATTR_FOUND_ROWS => true, PDO::ATTR_TIMEOUT => 10,
        ]);
        // UTC, chaînes « || », pas d'échappement par « \ » (comme PostgreSQL), mode strict.
        $pdo->exec("SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION,ERROR_FOR_DIVISION_BY_ZERO,NO_ZERO_DATE,NO_ZERO_IN_DATE,PIPES_AS_CONCAT,NO_BACKSLASH_ESCAPES'");
        return self::$pdo = $pdo;
    }

    public static function query(string $sql, array $params = []): Result
    {
        $pdo = self::connect();
        [$sql, $params] = self::runtime($sql, $params);
        $t = self::$cache[$sql] ??= self::translate($sql);
        $q = $t['sql'];
        $vals = array_map(fn($i) => $params[$i] ?? null, $t['order']);
        $newId = null;
        if ($t['insertTable'] && in_array($t['insertTable'], self::UUID_TABLES, true) && !$t['hasId']) {
            $newId = uuid4();
            $q = str_replace('__TV_NEW_ID__', "'" . $newId . "'", $q);
        }
        $st = self::run($pdo, $q, $vals);
        $rows = self::fetchAll($st);
        $count = $st->rowCount();
        if ($t['returning'] === null) return new Result($rows, $count ?: count($rows));
        // RETURNING : on relit la ligne écrite.
        $ret = $t['returning'];
        if ($t['insertTable']) {
            if ($count === 0) return new Result([], 0);
            $id = $newId ?? ($t['hasId'] ? ($params[$t['idParam']] ?? null) : null) ?? $pdo->lastInsertId();
            return new Result(self::fetchAll(self::run($pdo, "SELECT $ret FROM {$t['insertTable']} WHERE id = ?", [$id])), 1);
        }
        if ($count === 0) return new Result([], 0);
        $key = $t['key'];
        $kv = $key['param'] !== null ? ($params[$key['param']] ?? null) : $key['literal'];
        $rows = self::fetchAll(self::run($pdo, "SELECT $ret FROM {$t['table']} WHERE {$key['col']} = ?", [$kv]));
        return new Result($rows, count($rows));
    }

    private static function run(PDO $pdo, string $sql, array $vals): PDOStatement
    {
        try {
            $st = $pdo->prepare($sql);
            foreach (array_values($vals) as $i => $v) {
                $v = self::param($v);
                if ($v === null) $st->bindValue($i + 1, null, PDO::PARAM_NULL);
                elseif (is_int($v)) $st->bindValue($i + 1, $v, PDO::PARAM_INT);
                else $st->bindValue($i + 1, (string)$v, PDO::PARAM_STR);
            }
            $st->execute();
            return $st;
        } catch (PDOException $e) {
            throw new RuntimeException('SQL : ' . $e->getMessage() . ' — ' . substr(preg_replace('/\s+/', ' ', $sql), 0, 300));
        }
    }
    /** Valeur PHP → valeur SQL : booléen → 1/0, tableau/objet → JSON, date ISO → date MariaDB (UTC). */
    private static function param(mixed $v): mixed
    {
        if ($v === null || is_int($v)) return $v;
        if (is_bool($v)) return $v ? 1 : 0;
        if (is_float($v)) return rtrim(rtrim(sprintf('%.10F', $v), '0'), '.');
        if ($v instanceof PgJson) return json_encode($v->value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
        if ($v instanceof PgBytes) return $v->data;
        if (is_array($v)) return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
        $s = (string)$v;
        if (strlen($s) <= 35 && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/', $s)) {
            try { return (new DateTimeImmutable($s, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v'); } catch (Throwable) { return $s; }
        }
        return $s;
    }
    /** Lignes typées comme avec PostgreSQL : booléens, entiers, JSON décodé, dates ISO en UTC ; les décimaux restent des chaînes. */
    private static function fetchAll(PDOStatement $st): array
    {
        if ($st->columnCount() === 0) return [];
        $meta = [];
        for ($i = 0; $i < $st->columnCount(); $i++) $meta[] = $st->getColumnMeta($i) ?: [];
        $rows = [];
        while ($r = $st->fetch(PDO::FETCH_NUM)) {
            $row = [];
            foreach ($meta as $i => $m) $row[$m['name']] = self::cast($m, $r[$i]);
            $rows[] = $row;
        }
        return $rows;
    }
    private static function cast(array $m, mixed $v): mixed
    {
        if ($v === null) return null;
        $type = $m['native_type'] ?? '';
        switch ($type) {
            case 'TINY': return ($m['len'] ?? 0) == 1 ? (bool)(int)$v : (int)$v;
            // Grands entiers d'une table (identifiants automatiques) : chaîne, comme bigint avec PostgreSQL.
            case 'LONGLONG': return ($m['table'] ?? '') !== '' ? (string)$v : (int)$v;
            case 'SHORT': case 'LONG': case 'INT24': case 'YEAR': return (int)$v;
            case 'FLOAT': case 'DOUBLE': return (float)$v;
            case 'DATETIME': case 'TIMESTAMP':
                $s = (string)$v;
                return strlen($s) >= 19 ? substr($s, 0, 10) . 'T' . substr($s, 11, 8) . '.' . str_pad(substr($s, 20, 3), 3, '0') . 'Z' : $s;
            case 'NEWDECIMAL': case 'DECIMAL': return (string)$v;
        }
        if (is_string($v) && ($m['table'] ?? '') !== '' && in_array($m['name'], self::JSON_COLUMNS, true)) {
            $d = json_decode($v, true);
            return ($d === null && trim($v) !== 'null') ? $v : $d;
        }
        return $v;
    }

    /** Traductions qui dépendent des valeurs (non mises en cache). */
    private static function runtime(string $sql, array $params): array
    {
        if (str_contains($sql, "AT TIME ZONE 'Europe/Paris')")) {
            $today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d');
            $sql = str_replace(["(now() AT TIME ZONE 'Europe/Paris')::date", "(now() AT TIME ZONE 'Europe/Paris')"], ["'$today'", "'" . (new DateTimeImmutable('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d H:i:s') . "'"], $sql);
        }
        // col = ANY($n) avec une liste PHP → col IN (…) ; $n = ANY(col) → la liste JSON col contient la valeur.
        if (stripos($sql, 'ANY(') !== false) {
            $sql = preg_replace_callback('/([\w.]+)\s*=\s*ANY\s*\(\s*\$(\d+)\s*\)/i', function ($m) use (&$params) {
                $list = $params[(int)$m[2] - 1] ?? [];
                if (!is_array($list) || !$list) return 'FALSE';
                $marks = [];
                foreach (array_values($list) as $v) { $params[] = $v; $marks[] = '$' . count($params); }
                return $m[1] . ' IN (' . implode(', ', $marks) . ')';
            }, $sql);
            $sql = preg_replace('/(\$\d+)\s*=\s*ANY\s*\(\s*([\w.]+)\s*\)/i', 'JSON_CONTAINS($2, JSON_QUOTE($1))', $sql);
        }
        return [$sql, $params];
    }

    /** Traduction PostgreSQL → MariaDB (mise en cache par texte de requête). */
    public static function translate(string $sql): array
    {
        $out = ['returning' => null, 'insertTable' => null, 'table' => null, 'key' => null, 'hasId' => false, 'idParam' => null];
        if (preg_match('/\s+RETURNING\s+(.+)$/is', $sql, $m)) {
            $out['returning'] = trim($m[1]);
            $sql = substr($sql, 0, -strlen($m[0]));
        }
        // INSERT : identifiant UUID créé ici quand la requête ne le fournit pas.
        if (preg_match('/^\s*INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)\s*(VALUES|SELECT)\b/is', $sql, $m)) {
            $table = strtolower($m[1]);
            $cols = array_map(fn($c) => strtolower(trim($c, " \t\n\r`\"")), explode(',', $m[2]));
            $out['insertTable'] = $table;
            $idx = array_search('id', $cols, true);
            $out['hasId'] = $idx !== false;
            if ($idx !== false && preg_match('/VALUES\s*\((.*)\)/is', $sql, $vm)) {
                $vals = self::splitTop($vm[1]);
                if (isset($vals[$idx]) && preg_match('/^\s*\$(\d+)/', $vals[$idx], $pm)) $out['idParam'] = (int)$pm[1] - 1;
            }
            if (!$out['hasId'] && in_array($table, self::UUID_TABLES, true)) {
                $sql = preg_replace('/^(\s*INSERT\s+INTO\s+\w+\s*\()/is', '$1id, ', $sql, 1);
                if (strtoupper($m[3]) === 'VALUES') $sql = preg_replace_callback('/\bVALUES\s*\(/i', fn() => 'VALUES (__TV_NEW_ID__, ', $sql);
                else $sql = preg_replace('/\bSELECT\s+(DISTINCT\s+)?/i', 'SELECT $1UUID(), ', $sql, 1);
            }
            if ($out['returning'] !== null && !$out['hasId'] && !in_array($table, self::UUID_TABLES, true) && !in_array($table, self::AUTO_TABLES, true)) throw new LogicException("RETURNING sans identifiant : $table");
        } elseif ($out['returning'] !== null) {
            if (!preg_match('/^\s*UPDATE\s+(\w+)\b/is', $sql, $m)) throw new LogicException('RETURNING non pris en charge : ' . substr($sql, 0, 80));
            $out['table'] = strtolower($m[1]);
            if (!preg_match('/\bWHERE\s+(?:\w+\.)?(id|name|token_hash)\s*=\s*(\$(\d+)|\'([^\']*)\')/i', $sql, $k)) throw new LogicException('RETURNING sur plusieurs lignes : ' . substr($sql, 0, 80));
            $out['key'] = ['col' => strtolower($k[1]), 'param' => isset($k[3]) && $k[3] !== '' ? (int)$k[3] - 1 : null, 'literal' => $k[4] ?? null];
        }
        $sql = self::dialect($sql);
        $order = [];
        $sql = preg_replace_callback('/\$(\d+)/', function ($m) use (&$order) { $order[] = (int)$m[1] - 1; return '?'; }, $sql);
        $out['sql'] = $sql;
        $out['order'] = $order;
        return $out;
    }

    private static function dialect(string $s): string
    {
        // Durées : ($1 || ' hours')::interval → INTERVAL $1 HOUR ; interval '15 minutes' → INTERVAL 15 MINUTE.
        $unit = fn($u) => strtoupper(rtrim(strtolower($u), 's'));
        $s = preg_replace_callback("/\(\s*(\\$\d+)\s*\|\|\s*'\s*(\w+)'\s*\)\s*::\s*interval/i", fn($m) => 'INTERVAL ' . $m[1] . ' ' . $unit($m[2]), $s);
        $s = preg_replace_callback("/\binterval\s+'(\d+)\s+(\w+)'/i", fn($m) => 'INTERVAL ' . $m[1] . ' ' . $unit($m[2]), $s);
        $s = preg_replace("/date_trunc\('day',\s*([\w.]+)\)(::date)?/i", 'DATE($1)', $s);
        $s = preg_replace("/date_trunc\('month',\s*now\(\)\)/i", "DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')", $s);
        $s = preg_replace("/date_trunc\('year',\s*now\(\)\)/i", "DATE_FORMAT(UTC_TIMESTAMP(), '%Y-01-01')", $s);
        // JSON : col->'a'->>'b' → JSON_UNQUOTE(JSON_EXTRACT(col, '$.a.b')) ; col ? 'k' → la clé existe.
        $s = preg_replace_callback("/\b([a-z_][\w]*(?:\.[a-z_][\w]*)?)((?:\s*->\s*(?:'[^']+'|\d+))*)\s*->>\s*'([^']+)'/i", fn($m) => 'JSON_UNQUOTE(JSON_EXTRACT(' . $m[1] . ", '" . self::jsonPath($m[2] . "->'" . $m[3] . "'") . "'))", $s);
        $s = preg_replace_callback("/\b([a-z_][\w]*(?:\.[a-z_][\w]*)?)((?:\s*->\s*(?:'[^']+'|\d+))+)/i", fn($m) => 'JSON_EXTRACT(' . $m[1] . ", '" . self::jsonPath($m[2]) . "')", $s);
        $s = preg_replace("/\b([a-z_][\w]*(?:\.[a-z_][\w]*)?)\s+\?\s+'([\w.]+)'/i", "JSON_CONTAINS_PATH($1, 'one', '\$.$2')", $s);
        $s = preg_replace('/\bjsonb_array_length\s*\(/i', 'JSON_LENGTH(', $s);
        $s = preg_replace('/\bbtrim\s*\(/i', 'TRIM(', $s);
        $s = self::filters($s);
        // Conversions de type : x::int → CAST(x AS SIGNED)…
        $s = self::casts($s);
        $s = preg_replace('/\bnow\(\)/i', 'UTC_TIMESTAMP(3)', $s);
        $s = preg_replace('/\bcount\(\*\)/i', 'COUNT(*)', $s);
        // ON CONFLICT
        if (preg_match('/\bON\s+CONFLICT\b/i', $s)) {
            if (preg_match('/\bON\s+CONFLICT\s*(\([^)]*\))?\s*DO\s+NOTHING/i', $s)) {
                $s = preg_replace('/\bON\s+CONFLICT\s*(\([^)]*\))?\s*DO\s+NOTHING/i', '', $s);
                $s = preg_replace('/^\s*INSERT\s+INTO/i', 'INSERT IGNORE INTO', $s, 1);
            } else {
                $s = preg_replace('/\bON\s+CONFLICT\s*(\((?:[^()]|\([^()]*\))*\))?\s*DO\s+UPDATE\s+SET\b/i', 'ON DUPLICATE KEY UPDATE', $s);
                $s = preg_replace('/\bEXCLUDED\.(\w+)/i', 'VALUES($1)', $s);
            }
        }
        return $s;
    }
    private static function jsonPath(string $chain): string
    {
        preg_match_all("/->\s*(?:'([^']+)'|(\d+))/", $chain, $mm, PREG_SET_ORDER);
        $p = '$';
        foreach ($mm as $x) $p .= isset($x[2]) && $x[2] !== '' ? '[' . $x[2] . ']' : '.' . (preg_match('/^\w+$/', $x[1]) ? $x[1] : '"' . $x[1] . '"');
        return $p;
    }
    /** expr::type → CAST(expr AS type). L'expression est le mot ou la parenthèse (avec sa fonction) qui précède. */
    private static function casts(string $s): string
    {
        $map = ['int' => 'SIGNED', 'integer' => 'SIGNED', 'bigint' => 'SIGNED', 'smallint' => 'SIGNED', 'numeric' => 'DECIMAL(14,2)', 'float' => 'DOUBLE', 'text' => 'CHAR', 'varchar' => 'CHAR', 'date' => 'DATE', 'timestamptz' => 'DATETIME(3)', 'timestamp' => 'DATETIME(3)'];
        $strip = ['jsonb', 'json', 'uuid', 'boolean', 'bool'];
        while (preg_match('/::\s*([a-z]+)(\[\])?/i', $s, $m, PREG_OFFSET_CAPTURE)) {
            $type = strtolower($m[1][0]);
            $pos = $m[0][1];
            $end = $pos + strlen($m[0][0]);
            $start = self::exprStart($s, $pos);
            $expr = substr($s, $start, $pos - $start);
            if (in_array($type, $strip, true) || !isset($map[$type])) $rep = $expr;
            else $rep = 'CAST(' . $expr . ' AS ' . $map[$type] . ')';
            $s = substr($s, 0, $start) . $rep . substr($s, $end);
        }
        return $s;
    }
    private static function exprStart(string $s, int $pos): int
    {
        $i = $pos - 1;
        while ($i >= 0 && $s[$i] === ' ') $i--;
        if ($i < 0) return 0;
        if ($s[$i] === ')') {
            $depth = 0;
            for (; $i >= 0; $i--) {
                if ($s[$i] === ')') $depth++;
                elseif ($s[$i] === '(') { $depth--; if ($depth === 0) break; }
            }
            $j = $i - 1;
            while ($j >= 0 && (ctype_alnum($s[$j]) || $s[$j] === '_')) $j--;
            return $j + 1;
        }
        if ($s[$i] === "'") {
            $i--;
            while ($i >= 0 && $s[$i] !== "'") $i--;
            return max(0, $i);
        }
        while ($i >= 0 && (ctype_alnum($s[$i]) || in_array($s[$i], ['_', '.', '$'], true))) $i--;
        return $i + 1;
    }
    /** agg(x) FILTER (WHERE cond) → agg(CASE WHEN cond THEN x END). */
    private static function filters(string $s): string
    {
        while (preg_match('/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i', $s, $m, PREG_OFFSET_CAPTURE, $off ?? 0)) {
            $fnStart = $m[0][1];
            $open = $fnStart + strlen($m[0][0]) - 1;
            $close = self::matchParen($s, $open);
            $after = substr($s, $close + 1);
            if (!preg_match('/^\s*FILTER\s*\(\s*WHERE\s+/i', $after, $fm)) { $off = $open + 1; continue; }
            $fOpen = $close + 1 + strpos($after, '(');
            $fClose = self::matchParen($s, $fOpen);
            $cond = trim(substr($s, $close + 1 + strlen($fm[0]), $fClose - ($close + 1 + strlen($fm[0]))));
            $arg = trim(substr($s, $open + 1, $close - $open - 1));
            $val = $arg === '*' ? '1' : $arg;
            $rep = strtoupper($m[1][0]) . '(CASE WHEN ' . $cond . ' THEN ' . $val . ' END)';
            $s = substr($s, 0, $fnStart) . $rep . substr($s, $fClose + 1);
            $off = $fnStart + 1;
        }
        return $s;
    }
    private static function matchParen(string $s, int $open): int
    {
        $depth = 0; $q = false;
        for ($i = $open, $n = strlen($s); $i < $n; $i++) {
            $c = $s[$i];
            if ($c === "'") $q = !$q;
            if ($q) continue;
            if ($c === '(') $depth++;
            elseif ($c === ')') { $depth--; if ($depth === 0) return $i; }
        }
        return $n - 1;
    }
    private static function splitTop(string $s): array
    {
        $out = []; $cur = ''; $depth = 0; $q = false;
        for ($i = 0, $n = strlen($s); $i < $n; $i++) {
            $c = $s[$i];
            if ($c === "'") $q = !$q;
            if (!$q) { if ($c === '(') $depth++; elseif ($c === ')') $depth--; elseif ($c === ',' && $depth === 0) { $out[] = $cur; $cur = ''; continue; } }
            $cur .= $c;
        }
        $out[] = $cur;
        return $out;
    }

    public static function begin(): void { self::connect()->beginTransaction(); }
    public static function commit(): void { if (self::$pdo?->inTransaction()) self::$pdo->commit(); }
    public static function rollback(): void { if (self::$pdo?->inTransaction()) self::$pdo->rollBack(); }
}
function q(string $sql, array $params = []): Result { return DB::query($sql, $params); }
/** Première ligne ou null. */
function q1(string $sql, array $params = []): ?array { return DB::query($sql, $params)->rows[0] ?? null; }
function json_val(mixed $v): PgJson { return new PgJson($v); }
