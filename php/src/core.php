<?php
declare(strict_types=1);
/* TripVision — socle PHP : configuration, base de données, requête / réponse, JWT, rôles, sécurité.
   Aucune dépendance externe (pas de Composer) : tout se téléverse par FTP. */

mb_internal_encoding('UTF-8');
date_default_timezone_set('UTC');

/* ---------- Configuration (.env) ---------- */
function tv_env_load(): void
{
    static $done = false;
    if ($done) return;
    $done = true;
    $candidates = [TV_APP . '/.env', dirname(TV_APP) . '/.env', dirname(TV_APP, 2) . '/.env'];
    foreach ($candidates as $file) {
        if (!is_file($file)) continue;
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
            [$k, $v] = array_map('trim', explode('=', $line, 2));
            if (strlen($v) >= 2 && ($v[0] === '"' || $v[0] === "'") && substr($v, -1) === $v[0]) $v = substr($v, 1, -1);
            if (getenv($k) === false) { putenv("$k=$v"); $_ENV[$k] = $v; }
        }
        break;
    }
}
function env(string $key, ?string $default = null): ?string
{
    tv_env_load();
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}
function app_url(): string { return rtrim(env('APP_URL', 'http://localhost:8080'), '/'); }

/* ---------- Erreurs et réponses ---------- */
final class HttpExit extends Exception
{
    public function __construct(public int $status, public mixed $payload, public string $type = 'json', public array $headers = [])
    {
        parent::__construct('http');
    }
}
/** Envoie une réponse JSON et termine (équivalent de res.status(x).json(y) + return). */
function send(mixed $data, int $status = 200, array $headers = []): never { throw new HttpExit($status, $data, 'json', $headers); }
function fail(int $status, string $error, ?string $message = null, array $extra = []): never
{
    $p = ['error' => $error] + ($message !== null ? ['message' => $message] : []) + $extra;
    throw new HttpExit($status, $p);
}
function send_html(string $html, int $status = 200): never { throw new HttpExit($status, $html, 'html'); }
function send_raw(string $body, string $contentType, int $status = 200, array $headers = []): never { throw new HttpExit($status, $body, 'raw', ['Content-Type' => $contentType] + $headers); }
function redirect(string $url): never { throw new HttpExit(302, '', 'redirect', ['Location' => $url]); }

/** Erreur de validation, au format de zod (message personnalisé en premier). */
final class ValidationFailed extends Exception
{
    public function __construct(public array $issues) { parent::__construct('validation'); }
}
function invalid(string $message, array $path = []): never { throw new ValidationFailed([['code' => 'custom', 'message' => $message, 'path' => $path]]); }

/* ---------- Requête ---------- */
final class Req
{
    public string $method;
    public string $path;
    public array $query = [];
    public array $params = [];
    public array $headers = [];
    public ?array $user = null;
    private ?string $raw = null;
    private mixed $json = null;
    private bool $jsonRead = false;

    public static function capture(): Req
    {
        $r = new Req();
        $r->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $r->path = rawurldecode(parse_url($uri, PHP_URL_PATH) ?: '/');
        $r->query = $_GET;
        foreach ($_SERVER as $k => $v) if (str_starts_with($k, 'HTTP_')) $r->headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string)$v;
        if (isset($_SERVER['CONTENT_TYPE'])) $r->headers['content-type'] = (string)$_SERVER['CONTENT_TYPE'];
        if (empty($r->headers['authorization'])) {
            $a = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ($_SERVER['PHP_AUTH_DIGEST'] ?? null);
            if ($a) $r->headers['authorization'] = (string)$a;
            elseif (function_exists('apache_request_headers')) foreach (apache_request_headers() as $k => $v) if (strtolower($k) === 'authorization') $r->headers['authorization'] = (string)$v;
        }
        return $r;
    }
    public function raw(): string { return $this->raw ??= (string)file_get_contents('php://input'); }
    /** Corps JSON (objet associatif), tableau vide s'il est absent ou invalide. */
    public function body(): array
    {
        if (!$this->jsonRead) {
            $this->jsonRead = true;
            $d = json_decode($this->raw(), true);
            $this->json = is_array($d) ? $d : [];
        }
        return $this->json;
    }
    public function header(string $name): string { return $this->headers[strtolower($name)] ?? ''; }
    public function q(string $name, string $default = ''): string { $v = $this->query[$name] ?? $default; return is_array($v) ? $default : (string)$v; }
    public function param(string $name): string { return (string)($this->params[$name] ?? ''); }
    public function ip(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        if (env('TRUST_PROXY') === '1' && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) $ip = trim(explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        return $ip ?: '0.0.0.0';
    }
    public function userAgent(): string { return $this->header('user-agent'); }
}

/* ---------- Base de données (PostgreSQL / Supabase) ---------- */
final class Result
{
    public function __construct(public array $rows, public int $rowCount) {}
}
final class DB
{
    private static mixed $conn = null;
    private static ?PDO $pdo = null;

    private static function parseUrl(): array
    {
        $url = env('DATABASE_URL');
        if (!$url) throw new RuntimeException('DATABASE_URL manquante');
        $p = parse_url($url);
        return [
            'host' => $p['host'] ?? 'localhost', 'port' => (int)($p['port'] ?? 5432), 'user' => rawurldecode($p['user'] ?? ''), 'pass' => rawurldecode($p['pass'] ?? ''),
            'db' => ltrim($p['path'] ?? '/postgres', '/'), 'ssl' => str_contains($url, 'supabase.') || str_contains($url, 'sslmode=require'),
        ];
    }
    public static function connect(): void
    {
        if (self::$conn !== null || self::$pdo !== null) return;
        $c = self::parseUrl();
        if (function_exists('pg_connect') && env('DB_DRIVER') !== 'pdo') {
            $dsn = sprintf("host='%s' port=%d dbname='%s' user='%s' password='%s' sslmode=%s connect_timeout=10", $c['host'], $c['port'], $c['db'], $c['user'], addcslashes($c['pass'], "'\\"), $c['ssl'] ? 'require' : 'prefer');
            $conn = @pg_connect($dsn);
            if (!$conn) throw new RuntimeException('Connexion à la base impossible');
            pg_query($conn, "SET TIME ZONE 'UTC'");
            pg_query($conn, "SET client_encoding TO 'UTF8'");
            self::$conn = $conn;
            return;
        }
        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=%s', $c['host'], $c['port'], $c['db'], $c['ssl'] ? 'require' : 'prefer');
        self::$pdo = new PDO($dsn, $c['user'], $c['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
        self::$pdo->exec("SET TIME ZONE 'UTC'");
    }
    /** Convertit un paramètre PHP en valeur PostgreSQL (tableau → littéral de tableau, objet → JSON, booléen → t/f). */
    private static function param(mixed $v): mixed
    {
        if ($v === null) return null;
        if (is_bool($v)) return $v ? 't' : 'f';
        if (is_array($v)) {
            if (array_is_list($v) && !self::looksLikeJsonList($v)) {
                return '{' . implode(',', array_map(fn($x) => $x === null ? 'NULL' : '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], (string)$x) . '"', $v)) . '}';
            }
            return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
        }
        if ($v instanceof PgJson) return json_encode($v->value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
        if ($v instanceof PgBytes) return $v->data;
        return (string)$v;
    }
    private static function looksLikeJsonList(array $v): bool { return false; }

    public static function query(string $sql, array $params = []): Result
    {
        self::connect();
        if (self::$conn !== null) {
            $bin = null;
            foreach ($params as $i => $p) if ($p instanceof PgBytes) $bin = true;
            $conv = array_map(fn($p) => $p instanceof PgBytes ? pg_escape_bytea(self::$conn, $p->data) : self::param($p), $params);
            $res = @pg_query_params(self::$conn, $sql, $conv);
            if ($res === false) throw new RuntimeException('SQL : ' . pg_last_error(self::$conn));
            $rows = [];
            $n = pg_num_fields($res);
            $types = [];
            for ($i = 0; $i < $n; $i++) $types[pg_field_name($res, $i)] = (int)pg_field_type_oid($res, $i);
            while ($row = pg_fetch_assoc($res)) {
                foreach ($row as $k => $v) $row[$k] = self::cast($types[$k] ?? 0, $v);
                $rows[] = $row;
            }
            $count = pg_affected_rows($res);
            if ($rows && $count === 0) $count = count($rows);
            return new Result($rows, $count);
        }
        // Repli PDO : $1, $2… sont convertis en « ? » (un paramètre répété est dupliqué).
        $order = [];
        $sql = str_replace('?', '??', $sql); // l'opérateur JSONB « ? » doit être doublé avec PDO
        $q = preg_replace_callback('/\$(\d+)/', function ($m) use (&$order) { $order[] = (int)$m[1] - 1; return '?'; }, $sql);
        $vals = array_map(fn($i) => self::param($params[$i] ?? null), $order);
        $st = self::$pdo->prepare($q);
        foreach ($vals as $i => $v) {
            if ($v === null) $st->bindValue($i + 1, null, PDO::PARAM_NULL); else $st->bindValue($i + 1, $v);
        }
        $st->execute();
        $rows = [];
        if ($st->columnCount() > 0) {
            $meta = [];
            for ($i = 0; $i < $st->columnCount(); $i++) $meta[$i] = $st->getColumnMeta($i);
            while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
                foreach ($meta as $m) { $name = $m['name']; $r[$name] = self::cast(self::pdoOid($m['native_type'] ?? ''), is_resource($r[$name]) ? stream_get_contents($r[$name]) : ($r[$name] === null ? null : (string)$r[$name])); }
                $rows[] = $r;
            }
        }
        return new Result($rows, $st->rowCount() ?: count($rows));
    }
    private static function pdoOid(string $t): int
    {
        return ['bool' => 16, 'int2' => 21, 'int4' => 23, 'int8' => 20, 'float4' => 700, 'float8' => 701, 'numeric' => 1700, 'json' => 114, 'jsonb' => 3802, 'date' => 1082, 'timestamp' => 1114, 'timestamptz' => 1184, 'bytea' => 17, '_text' => 1009, '_varchar' => 1015, '_int4' => 1007][$t] ?? 0;
    }
    /** Même typage que le module « pg » de Node : entiers, booléens, JSON, dates ISO ; numeric et bigint restent des chaînes. */
    private static function cast(int $oid, ?string $v): mixed
    {
        if ($v === null) return null;
        switch ($oid) {
            case 16: return $v === 't' || $v === '1' || $v === 'true';
            case 21: case 23: return (int)$v;
            case 700: case 701: return (float)$v;
            case 114: case 3802: $d = json_decode($v, true); return $d === null && $v !== 'null' ? $v : $d;
            case 1184: case 1114:
                try { $d = new DateTimeImmutable($v, new DateTimeZone('UTC')); return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z'); } catch (Throwable) { return $v; }
            case 17: return str_starts_with($v, '\\x') ? hex2bin(substr($v, 2)) : pg_unescape_bytea($v);
            case 1009: case 1015: case 1007: return self::parseArray($v, $oid === 1007);
        }
        return $v;
    }
    private static function parseArray(string $s, bool $int): array
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
        return $int ? array_map(fn($x) => $x === null ? null : (int)$x, $out) : $out;
    }
    public static function begin(): void { self::connect(); self::$conn !== null ? pg_query(self::$conn, 'BEGIN') : self::$pdo->beginTransaction(); }
    public static function commit(): void { self::$conn !== null ? pg_query(self::$conn, 'COMMIT') : self::$pdo->commit(); }
    public static function rollback(): void { self::$conn !== null ? @pg_query(self::$conn, 'ROLLBACK') : @self::$pdo->rollBack(); }
}
/** Valeur à enregistrer telle quelle en JSON (liste ou objet). */
final class PgJson { public function __construct(public mixed $value) {} }
final class PgBytes { public function __construct(public string $data) {} }
function q(string $sql, array $params = []): Result { return DB::query($sql, $params); }
/** Première ligne ou null. */
function q1(string $sql, array $params = []): ?array { return DB::query($sql, $params)->rows[0] ?? null; }
function json_val(mixed $v): PgJson { return new PgJson($v); }

/* ---------- Outils ---------- */
function uuid4(): string
{
    $d = random_bytes(16);
    $d[6] = chr(ord($d[6]) & 0x0f | 0x40);
    $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}
function b64url(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64url_dec(string $s): string { return (string)base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4)); }
function rand_token(int $bytes = 32): string { return b64url(random_bytes($bytes)); }
function sha256_hex(string $s): string { return hash('sha256', $s); }
function is_uuid(string $s): bool { return (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $s); }
function esc_html(mixed $v): string { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function fr_date(?string $d, string $fmt = 'j F Y'): string
{
    if (!$d) return '';
    $ts = strtotime(substr($d, 0, 10) . ' 12:00:00 UTC');
    if (!$ts) return '';
    static $months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    static $days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    $out = '';
    foreach (str_split($fmt) as $c) {
        $out .= match ($c) { 'j' => (string)(int)gmdate('j', $ts), 'F' => $months[(int)gmdate('n', $ts) - 1], 'Y' => gmdate('Y', $ts), 'l' => $days[(int)gmdate('w', $ts)], default => $c };
    }
    return $out;
}
/** Nombre au format JS (sans zéros inutiles) : 12.50 → 12.5 ; 12.0 → 12. */
function num(mixed $v): string
{
    if ($v === null || $v === '') return '';
    $f = (float)$v;
    if (floor($f) == $f && abs($f) < 1e15) return (string)(int)$f;
    return rtrim(rtrim(number_format($f, 10, '.', ''), '0'), '.');
}
function fr_num(mixed $v, int $max = 0): string
{
    $s = number_format((float)$v, $max, ',', "\u{202F}");
    return $s;
}
function r2(mixed $n): float { return round((float)$n * 100) / 100; }
function norm_text(string $s): string
{
    $s = mb_strtolower($s);
    if (class_exists('Normalizer')) $s = Normalizer::normalize($s, Normalizer::FORM_D) ?: $s;
    else $s = strtr($s, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'ñ' => 'n', 'œ' => 'oe', 'æ' => 'ae']);
    $s = preg_replace('/[\x{0300}-\x{036f}]/u', '', $s);
    return trim((string)preg_replace('/[^a-z0-9]+/', ' ', $s));
}

/* ---------- JWT HS256 (compatible avec les jetons de la version Node) ---------- */
function jwt_secret(): string { $s = env('JWT_SECRET'); if (!$s) throw new RuntimeException('JWT_SECRET manquante'); return $s; }
function jwt_sign(array $payload, int $ttl = 7 * 86400): string
{
    $now = time();
    $body = $payload + ['iat' => $now, 'exp' => $now + $ttl];
    $h = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $p = b64url(json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    return "$h.$p." . b64url(hash_hmac('sha256', "$h.$p", jwt_secret(), true));
}
function jwt_verify(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $head = json_decode(b64url_dec($h), true);
    if (!is_array($head) || ($head['alg'] ?? '') !== 'HS256') return null;
    if (!hash_equals(b64url(hash_hmac('sha256', "$h.$p", jwt_secret(), true)), $s)) return null;
    $data = json_decode(b64url_dec($p), true);
    if (!is_array($data)) return null;
    if (isset($data['exp']) && $data['exp'] < time()) return null;
    return $data;
}
function token_for(array $user): string
{
    return jwt_sign(['id' => $user['id'], 'role' => $user['role'], 'email' => $user['email'], 'mustChangePassword' => (bool)$user['must_change_password']]);
}

/* ---------- Mots de passe ---------- */
function pw_hash(string $p): string { $h = password_hash($p, PASSWORD_BCRYPT, ['cost' => 10]); return '$2a$' . substr($h, 4); } // « $2a$ » : lisible par bcryptjs (version Node)
function pw_check(string $p, string $hash): bool
{
    // bcryptjs écrit « $2a$ » ou « $2b$ » : PHP lit « $2y$ », même algorithme.
    if (preg_match('/^\$2[abx]\$/', $hash)) $hash = '$2y$' . substr($hash, 4);
    return password_verify($p, $hash);
}
function password_problem(string $password): ?string
{
    if (mb_strlen($password) < 14) return 'Le mot de passe doit faire au moins 14 caractères.';
    if (!preg_match('/[a-z]/', $password) || !preg_match('/[A-Z]/', $password) || !preg_match('/\d/', $password) || !preg_match('/[^a-zA-Z0-9]/', $password)) {
        return 'Utilisez au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
    }
    return null;
}
function temporary_password(): string { return substr(str_replace('-', '', uuid4()), 0, 14) . 'A1!'; }

/* ---------- Anti-force brute, journal d'audit, historique de connexion ---------- */
function is_locked_out(string $email, string $ip): bool
{
    $a = q1("SELECT COUNT(*)::int AS n FROM login_attempts WHERE email = $1 AND created_at > now() - interval '15 minutes'", [$email]);
    if (($a['n'] ?? 0) >= 5) return true;
    $b = q1("SELECT COUNT(*)::int AS n FROM login_attempts WHERE ip = $1 AND created_at > now() - interval '15 minutes'", [$ip]);
    return ($b['n'] ?? 0) >= 20;
}
function record_failed_attempt(string $email, string $ip): void { q('INSERT INTO login_attempts(email, ip) VALUES ($1, $2)', [$email, $ip]); }
function clear_attempts(string $email, string $ip): void { q('DELETE FROM login_attempts WHERE email = $1 OR ip = $2', [$email, $ip]); }
function audit(?string $actorId, string $action, string $entity, mixed $entityId, ?string $ip): void
{
    q('INSERT INTO audit_logs(actor_id, action, entity, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)', [$actorId, $action, $entity, $entityId !== null && $entityId !== '' ? (string)$entityId : null, $ip]);
}
function record_login(string $userId, ?string $ip, ?string $ua): void
{
    q('INSERT INTO login_history(user_id, ip_address, user_agent) VALUES ($1,$2,$3)', [$userId, $ip, $ua ?: null]);
    q('UPDATE users SET last_login_at = now(), last_activity_at = now() WHERE id = $1', [$userId]);
}

/* ---------- Rôles et droits ---------- */
const BACKOFFICE_ROLES = ['it', 'admin', 'manager'];
const GOVERNANCE_ROLES = ['it', 'manager'];
const IT_ROLES = ['it'];
const CHAT_ROLES = ['partner', 'client'];
const PERMISSIONS = [
    'vehicles.create', 'vehicles.edit', 'vehicles.delete', 'franchise.manage', 'offers.create', 'offers.edit', 'offers.delete', 'bookings.view', 'bookings.manage',
    'partners.manage', 'partners.delete', 'clients.view', 'accounts.create', 'accounts.edit', 'accounts.delete', 'mailing.export', 'categories.manage', 'chats.reply', 'chats.manage',
    'settings.manage', 'trends.view', 'audit.view',
];
function can_manage_role(string $actor, string $target): bool
{
    $m = ['it' => ['it', 'manager', 'admin'], 'manager' => ['manager', 'admin'], 'admin' => []];
    return in_array($target, $m[$actor] ?? [], true);
}
function has_permission(array $user, string $key): bool
{
    if (($user['role'] ?? '') === 'it') return true;
    return in_array($user['role'] ?? '', ['manager', 'admin'], true) && (($user['permissions'][$key] ?? false) === true);
}
function effective_permissions(array $user): array
{
    $o = [];
    foreach (PERMISSIONS as $k) $o[$k] = has_permission($user, $k);
    return $o;
}
function sanitize_permissions(mixed $input): array
{
    $o = [];
    foreach (PERMISSIONS as $k) if (is_array($input) && ($input[$k] ?? null) === true) $o[$k] = true;
    return $o;
}
const IDLE_LIMIT_MS = 15 * 60 * 1000;

/** Authentification : renvoie l'utilisateur ou termine par 401 / 403 (même comportement que le middleware Node). */
function require_auth(Req $req, array $allowedRoles = []): array
{
    $header = $req->header('authorization');
    $token = str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;
    if (!$token) fail(401, 'AUTH_REQUIRED');
    $payload = jwt_verify($token);
    if (!$payload) fail(401, 'INVALID_TOKEN');
    $u = q1('SELECT id, email, name, role, active, permissions, must_change_password, last_activity_at FROM users WHERE id = $1 AND deleted_at IS NULL', [$payload['id'] ?? '']);
    if (!$u || !$u['active']) fail(401, 'ACCOUNT_DISABLED');
    if ($u['role'] !== 'partner' && $u['role'] !== 'client') {
        $idle = $u['last_activity_at'] ? (time() - strtotime($u['last_activity_at'])) * 1000 : 0;
        if ($idle > IDLE_LIMIT_MS) fail(401, 'SESSION_EXPIRED');
        if (!$u['last_activity_at'] || $idle > 30000) q('UPDATE users SET last_activity_at = now() WHERE id = $1', [$u['id']]);
    }
    if ($allowedRoles && !in_array($u['role'], $allowedRoles, true)) fail(403, 'FORBIDDEN');
    if ($u['must_change_password'] && $req->path !== '/api/auth/change-password') fail(403, 'PASSWORD_CHANGE_REQUIRED');
    $req->user = ['id' => $u['id'], 'email' => $u['email'], 'name' => $u['name'], 'role' => $u['role'], 'permissions' => $u['permissions'] ?: []];
    return $req->user;
}
function require_can(array $user, string $key): void { if (!has_permission($user, $key)) fail(403, 'PERMISSION_DENIED'); }
function require_any(array $user, string ...$keys): void
{
    foreach ($keys as $k) if (has_permission($user, $k)) return;
    fail(403, 'PERMISSION_DENIED');
}
/** Compte client facultatif (jeton valide) ou null. */
function optional_client(Req $req): ?array
{
    $header = $req->header('authorization');
    if (!str_starts_with($header, 'Bearer ')) return null;
    $payload = jwt_verify(substr($header, 7));
    if (!$payload) return null;
    $u = q1('SELECT id, email, name, role, active FROM users WHERE id = $1 AND deleted_at IS NULL', [$payload['id'] ?? '']);
    return ($u && $u['active'] && $u['role'] === 'client') ? $u : null;
}

/* ---------- Validation (équivalent minimal de zod) ---------- */
function v_issue(string $code, string $message, array $path, array $extra = []): never { throw new ValidationFailed([['code' => $code] + $extra + ['message' => $message, 'path' => $path]]); }
function v_str(array $b, string $k, array $o = []): ?string
{
    $v = $b[$k] ?? null;
    $has = array_key_exists($k, $b) && $v !== null;
    if (!$has) {
        if (($o['required'] ?? true) && !array_key_exists('default', $o)) v_issue('invalid_type', 'Required', [$k], ['expected' => 'string', 'received' => 'undefined']);
        return $o['default'] ?? null;
    }
    if (!is_string($v) && !is_numeric($v)) v_issue('invalid_type', 'Expected string, received ' . gettype($v), [$k], ['expected' => 'string', 'received' => gettype($v)]);
    $s = (string)$v;
    if ($o['trim'] ?? false) $s = trim($s);
    $len = mb_strlen($s);
    if (isset($o['min']) && $len < $o['min']) isset($o['minMsg']) ? v_issue('custom', $o['minMsg'], [$k]) : v_issue('too_small', "String must contain at least {$o['min']} character(s)", [$k], ['minimum' => $o['min'], 'type' => 'string', 'inclusive' => true, 'exact' => false]);
    if (isset($o['max']) && $len > $o['max']) isset($o['maxMsg']) ? v_issue('custom', $o['maxMsg'], [$k]) : v_issue('too_big', "String must contain at most {$o['max']} character(s)", [$k], ['maximum' => $o['max'], 'type' => 'string', 'inclusive' => true, 'exact' => false]);
    if (($o['email'] ?? false) && !preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $s)) v_issue('invalid_string', 'Invalid email', [$k], ['validation' => 'email']);
    if (($o['uuid'] ?? false) && !is_uuid($s)) v_issue('invalid_string', 'Invalid uuid', [$k], ['validation' => 'uuid']);
    if (isset($o['in']) && !in_array($s, $o['in'], true)) v_issue('invalid_enum_value', "Invalid enum value. Expected '" . implode("' | '", $o['in']) . "', received '$s'", [$k], ['options' => $o['in'], 'received' => $s]);
    if (isset($o['regex']) && !preg_match($o['regex'], $s)) v_issue(isset($o['regexMsg']) ? 'custom' : 'invalid_string', $o['regexMsg'] ?? 'Invalid', [$k], isset($o['regexMsg']) ? [] : ['validation' => 'regex']);
    return $s;
}
function v_num(array $b, string $k, array $o = []): int|float|null
{
    $v = $b[$k] ?? null;
    if (!array_key_exists($k, $b) || $v === null || $v === '') {
        if (($o['required'] ?? false) && !array_key_exists('default', $o)) v_issue('invalid_type', 'Required', [$k], ['expected' => 'number', 'received' => 'undefined']);
        return $o['default'] ?? null;
    }
    if (!is_numeric($v)) v_issue('invalid_type', 'Expected number, received nan', [$k], ['expected' => 'number', 'received' => 'nan']);
    $n = $v + 0;
    if (($o['int'] ?? false) && floor((float)$n) != $n) v_issue('invalid_type', 'Expected integer, received float', [$k], ['expected' => 'integer', 'received' => 'float']);
    if (isset($o['min']) && $n < $o['min']) isset($o['minMsg']) ? v_issue('custom', $o['minMsg'], [$k]) : v_issue('too_small', "Number must be greater than or equal to {$o['min']}", [$k], ['minimum' => $o['min'], 'type' => 'number', 'inclusive' => true, 'exact' => false]);
    if (isset($o['max']) && $n > $o['max']) isset($o['maxMsg']) ? v_issue('custom', $o['maxMsg'], [$k]) : v_issue('too_big', "Number must be less than or equal to {$o['max']}", [$k], ['maximum' => $o['max'], 'type' => 'number', 'inclusive' => true, 'exact' => false]);
    if (($o['positive'] ?? false) && $n <= 0) isset($o['posMsg']) ? v_issue('custom', $o['posMsg'], [$k]) : v_issue('too_small', 'Number must be greater than 0', [$k], ['minimum' => 0, 'type' => 'number', 'inclusive' => false, 'exact' => false]);
    return ($o['int'] ?? false) ? (int)$n : $n;
}
function v_bool(array $b, string $k, ?bool $default = null): ?bool
{
    if (!array_key_exists($k, $b) || $b[$k] === null) return $default;
    if (!is_bool($b[$k])) throw new ValidationFailed([['code' => 'invalid_type', 'message' => 'Expected boolean', 'path' => [$k]]]);
    return $b[$k];
}

/* ---------- Routeur ---------- */
final class Router
{
    private array $routes = [];
    public function add(string $method, string $pattern, callable $fn): void
    {
        $regex = '#^' . preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $fn];
    }
    public function dispatch(Req $req): mixed
    {
        $allowed = false;
        foreach ($this->routes as [$m, $regex, $fn]) {
            if (!preg_match($regex, $req->path, $mt)) continue;
            $allowed = true;
            if ($m !== $req->method) continue;
            $req->params = array_filter($mt, 'is_string', ARRAY_FILTER_USE_KEY);
            return $fn($req);
        }
        if ($allowed) fail(405, 'METHOD_NOT_ALLOWED');
        fail(404, 'NOT_FOUND');
    }
}
$GLOBALS['tv_router'] = new Router();
function route(string $method, string $pattern, callable $fn): void { $GLOBALS['tv_router']->add($method, $pattern, $fn); }

/* ---------- Réponse ---------- */
function security_headers(): void
{
    // Mêmes protections que « helmet » côté Node.
    header("Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data: blob: https:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests");
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Origin-Agent-Cluster: ?1');
    header('Referrer-Policy: no-referrer');
    if ((($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') header('Strict-Transport-Security: max-age=15552000; includeSubDomains');
    header('X-Content-Type-Options: nosniff');
    header('X-DNS-Prefetch-Control: off');
    header('X-Download-Options: noopen');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Permitted-Cross-Domain-Policies: none');
    header('X-XSS-Protection: 0');
    header_remove('X-Powered-By');
    $origin = env('CORS_ORIGIN', '*');
    $reqOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '*') { if ($reqOrigin) { header('Access-Control-Allow-Origin: ' . $reqOrigin); header('Vary: Origin'); } }
    elseif ($reqOrigin && in_array($reqOrigin, array_map('trim', explode(',', $origin)), true)) { header('Access-Control-Allow-Origin: ' . $reqOrigin); header('Vary: Origin'); }
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
function emit(HttpExit $e): void
{
    http_response_code($e->status);
    foreach ($e->headers as $k => $v) header("$k: $v");
    if ($e->status === 204 || $e->status === 304) return;
    switch ($e->type) {
        case 'html': header('Content-Type: text/html; charset=utf-8'); echo $e->payload; break;
        case 'raw': echo $e->payload; break;
        case 'redirect': break;
        default:
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($e->payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION | JSON_PARTIAL_OUTPUT_ON_ERROR);
    }
}
