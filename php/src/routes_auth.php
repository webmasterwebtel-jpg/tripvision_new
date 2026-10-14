<?php
declare(strict_types=1);
/* Connexion, comptes clients, mot de passe, profil, notifications. */

const TOKEN_HOURS = ['invite' => 48, 'reset' => 2];

function issue_token(string $userId, string $purpose, int $hours): string
{
    $token = rand_token(32);
    q('UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [$userId]);
    q("INSERT INTO auth_tokens(user_id, token_hash, purpose, expires_at) VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)", [$userId, sha256_hex($token), $purpose, (string)$hours]);
    return app_url() . '/activation/?token=' . $token;
}
function send_access_link(array $user, string $purpose, ?string $invitedBy = null, ?int $hours = null): array
{
    $validity = $hours ?? TOKEN_HOURS[$purpose];
    $url = issue_token($user['id'], $purpose, $validity);
    $mail = $purpose === 'reset' ? reset_email($user['name'], $url, $validity) : invitation_email($user['name'], $url, $validity, $invitedBy);
    $r = send_mail($user['email'], $mail);
    if ($r['sent']) return ['emailSent' => true];
    return ['emailSent' => false, 'activationUrl' => $url, 'emailError' => mail_ready() ? 'L’e-mail n’a pas pu être envoyé.' : 'L’envoi d’e-mails n’est pas configuré.'];
}
function send_verification(array $user): bool
{
    $token = rand_token(32);
    q("UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND purpose = 'verify' AND used_at IS NULL", [$user['id']]);
    q("INSERT INTO auth_tokens(user_id, token_hash, purpose, expires_at) VALUES ($1, $2, 'verify', now() + interval '48 hours')", [$user['id'], sha256_hex($token)]);
    $url = app_url() . '/api/auth/verify-email?t=' . $token;
    $mail = notification_email('Activez votre compte TripVision', 'Bienvenue, ' . mail_text($user['name']), 'Votre compte TripVision est créé. Cliquez sur le bouton ci-dessous pour l’activer, puis connectez-vous pour réserver.', 'Activer mon compte', $url, [], 'Ce lien est personnel et valable 48 heures. Si vous n’êtes pas à l’origine de cette inscription, ignorez cet e-mail.');
    $r = send_mail($user['email'], $mail);
    if (!$r['sent']) error_log("Activation (e-mail non envoyé) {$user['email']} : $url");
    return $r['sent'];
}
function find_valid_token(mixed $token): ?array
{
    if (!is_string($token) || strlen($token) < 20 || strlen($token) > 200) return null;
    return q1('SELECT t.id, t.purpose, u.id AS user_id, u.name, u.email, u.role FROM auth_tokens t JOIN users u ON u.id = t.user_id
               WHERE t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > now() AND u.active AND u.deleted_at IS NULL', [sha256_hex($token)]);
}
function phone_field(array $b): string
{
    $p = v_str($b, 'phone', ['trim' => true, 'min' => 6, 'minMsg' => 'Indiquez un numéro de téléphone valide.', 'max' => 30]);
    if (strlen((string)preg_replace('/\D/', '', (string)$p)) < 6) invalid('Indiquez un numéro de téléphone valide.', ['phone']);
    return (string)$p;
}
function describe_agent(string $ua): string
{
    $os = preg_match('/iPhone|iPad/i', $ua) ? 'iPhone / iPad' : (preg_match('/Android/i', $ua) ? 'Android' : (preg_match('/Windows/i', $ua) ? 'Windows' : (preg_match('/Mac OS X|Macintosh/i', $ua) ? 'Mac' : (preg_match('/Linux/i', $ua) ? 'Linux' : 'Appareil'))));
    $br = str_contains($ua, 'Edg/') ? 'Edge' : (preg_match('/OPR\/|Opera/', $ua) ? 'Opera' : (str_contains($ua, 'Firefox/') ? 'Firefox' : (str_contains($ua, 'Chrome/') ? 'Chrome' : (str_contains($ua, 'Safari/') ? 'Safari' : 'Navigateur'))));
    return "$br · $os";
}
function mask_ip(string $ip): string
{
    if (str_contains($ip, ':')) return implode(':', array_slice(explode(':', $ip), 0, 2)) . ':…';
    $p = explode('.', $ip);
    return count($p) === 4 ? "{$p[0]}.{$p[1]}.•.•" : '—';
}
function html_page(string $title, string $text, bool $ok = true): string
{
    $c = $ok ? '#0f3b2e' : '#a73535';
    return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $title . '</title><body style="font-family:Arial,sans-serif;background:#f8f5ef;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:440px;margin:16px;background:#fff;padding:40px;border:1px solid #e4dfd6;text-align:center"><h1 style="font-family:Georgia,serif;color:' . $c . '">' . $title . '</h1><p style="color:#555;line-height:1.6">' . $text . '</p><a href="/" style="display:inline-block;margin-top:14px;padding:13px 26px;background:#0f3b2e;color:#fff;text-decoration:none;font-weight:700">Retourner sur TripVision</a></main>';
}

route('GET', '/api/health', fn() => send(['ok' => true, 'service' => 'tripvision-api', 'time' => gmdate('Y-m-d\TH:i:s.v\Z')]));

route('POST', '/api/auth/login', function (Req $req) {
    $b = $req->body();
    $email = strtolower(trim((string)v_str($b, 'email', ['email' => true])));
    $password = (string)v_str($b, 'password', ['min' => 1]);
    $ip = $req->ip();
    if (is_locked_out($email, $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    $user = q1('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [$email]);
    $ok = $user && $user['active'] ? pw_check($password, (string)$user['password_hash']) : false;
    if (!$ok) { record_failed_attempt($email, $ip); fail(401, 'INVALID_CREDENTIALS'); }
    if ($user['role'] === 'client' && !$user['email_verified_at']) fail(403, 'EMAIL_NOT_VERIFIED', 'Activez votre compte avec le lien reçu par e-mail.');
    clear_attempts($email, $ip);
    record_login($user['id'], $ip, $req->userAgent());
    send([
        'token' => token_for($user),
        'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role'], 'name' => $user['name'], 'mustChangePassword' => $user['must_change_password']],
        'permissions' => effective_permissions(['role' => $user['role'], 'permissions' => $user['permissions'] ?: []]),
    ]);
});
route('GET', '/api/auth/ping', function (Req $req) { require_auth($req); send(['ok' => true]); });
route('GET', '/api/auth/me', function (Req $req) {
    $user = require_auth($req);
    $u = q1('SELECT first_name, last_name, phone, last_login_at, created_at FROM users WHERE id = $1', [$user['id']]) ?: [];
    $parts = explode(' ', (string)$user['name']);
    send([
        'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role'], 'name' => $user['name'], 'firstName' => $u['first_name'] ?? $parts[0], 'lastName' => $u['last_name'] ?? implode(' ', array_slice($parts, 1)), 'phone' => $u['phone'] ?? '', 'lastLoginAt' => $u['last_login_at'] ?? null, 'createdAt' => $u['created_at'] ?? null],
        'permissions' => effective_permissions($user),
    ]);
});
route('GET', '/api/auth/logins', function (Req $req) {
    $user = require_auth($req);
    $rows = q('SELECT created_at, ip_address, user_agent FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8', [$user['id']])->rows;
    send(array_map(fn($r) => ['at' => $r['created_at'], 'device' => describe_agent((string)($r['user_agent'] ?? '')), 'ip' => mask_ip((string)($r['ip_address'] ?? ''))], $rows));
});
route('PATCH', '/api/auth/profile', function (Req $req) {
    $user = require_auth($req);
    $b = $req->body();
    $first = (string)v_str($b, 'firstName', ['trim' => true, 'min' => 1, 'max' => 60]);
    $last = (string)v_str($b, 'lastName', ['trim' => true, 'min' => 1, 'max' => 60]);
    $phone = v_str($b, 'phone', ['trim' => true, 'max' => 30, 'required' => false]);
    if ($user['role'] === 'client' && strlen((string)preg_replace('/\D/', '', (string)$phone)) < 6) fail(400, 'VALIDATION_ERROR', 'Indiquez un numéro de téléphone valide.');
    $name = "$first $last";
    q('UPDATE users SET first_name = $1, last_name = $2, phone = $3, name = $4, updated_at = now() WHERE id = $5', [$first, $last, $phone ?: null, $name, $user['id']]);
    audit($user['id'], 'update_profile', 'user', $user['id'], $req->ip());
    send(['name' => $name, 'firstName' => $first, 'lastName' => $last, 'phone' => $phone ?: '']);
});
route('POST', '/api/auth/password', function (Req $req) {
    $user = require_auth($req);
    $b = $req->body();
    $cur = (string)v_str($b, 'currentPassword', ['min' => 1]);
    $new = (string)v_str($b, 'newPassword', ['min' => 1]);
    $row = q1('SELECT password_hash FROM users WHERE id = $1', [$user['id']]);
    if (!$row || !pw_check($cur, (string)$row['password_hash'])) fail(400, 'WRONG_PASSWORD', 'Le mot de passe actuel est incorrect.');
    if ($p = password_problem($new)) fail(400, 'WEAK_PASSWORD', $p);
    q('UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2', [pw_hash($new), $user['id']]);
    audit($user['id'], 'change_password', 'user', $user['id'], $req->ip());
    send(['token' => token_for(q1('SELECT * FROM users WHERE id = $1', [$user['id']]))]);
});
route('POST', '/api/auth/forgot-password', function (Req $req) {
    $email = strtolower(trim((string)v_str($req->body(), 'email', ['email' => true])));
    $ip = $req->ip();
    // Réponse identique que le compte existe ou non ; le travail se fait après l'envoi de la réponse.
    $GLOBALS['tv_after'][] = static function () use ($email, $ip) {
        if (is_locked_out("reset:$email", $ip)) return;
        record_failed_attempt("reset:$email", $ip);
        $user = q1('SELECT id, name, email FROM users WHERE email = $1 AND active AND deleted_at IS NULL', [$email]);
        if (!$user) return;
        $sent = send_access_link($user, 'reset');
        if (!$sent['emailSent']) q('UPDATE users SET reset_requested_at = now() WHERE id = $1', [$user['id']]);
        audit($user['id'], 'request_password_reset', 'user', $user['id'], $ip);
    };
    send(['ok' => true]);
});
route('GET', '/api/auth/token-info', function (Req $req) {
    $ip = $req->ip();
    if (is_locked_out("token:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    $t = find_valid_token($req->q('token'));
    if (!$t) { record_failed_attempt("token:$ip", $ip); fail(404, 'INVALID_LINK'); }
    send(['email' => $t['email'], 'name' => $t['name'], 'role' => $t['role'], 'purpose' => $t['purpose']]);
});
route('POST', '/api/auth/activate', function (Req $req) {
    $b = $req->body();
    $token = (string)v_str($b, 'token');
    $password = (string)v_str($b, 'password', ['min' => 1]);
    $ip = $req->ip();
    if (is_locked_out("token:$ip", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    $t = find_valid_token($token);
    if (!$t) { record_failed_attempt("token:$ip", $ip); fail(400, 'INVALID_LINK'); }
    if ($p = password_problem($password)) fail(400, 'WEAK_PASSWORD', $p);
    q('UPDATE users SET password_hash = $1, must_change_password = false, reset_requested_at = NULL, updated_at = now() WHERE id = $2', [pw_hash($password), $t['user_id']]);
    q('UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [$t['user_id']]);
    audit($t['user_id'], $t['purpose'] === 'invite' ? 'activate_account' : 'reset_password_by_link', 'user', $t['user_id'], $ip);
    send(['ok' => true, 'email' => $t['email'], 'role' => $t['role']]);
});
route('POST', '/api/auth/change-password', function (Req $req) {
    $user = require_auth($req);
    $password = (string)v_str($req->body(), 'password', ['min' => 1]);
    if ($p = password_problem($password)) fail(400, 'WEAK_PASSWORD', $p);
    q('UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2', [pw_hash($password), $user['id']]);
    audit($user['id'], 'change_password', 'user', $user['id'], $req->ip());
    send(['token' => token_for(q1('SELECT * FROM users WHERE id = $1', [$user['id']]))]);
});
route('GET', '/api/auth/verify-email', function (Req $req) {
    $t = $req->q('t');
    $row = (strlen($t) > 20 && strlen($t) < 200) ? q1("UPDATE auth_tokens SET used_at = now() WHERE token_hash = $1 AND purpose = 'verify' AND used_at IS NULL AND expires_at > now() RETURNING user_id", [sha256_hex($t)]) : null;
    if (!$row) send_html(html_page('Lien invalide ou expiré', 'Ce lien d’activation n’est plus valable. Reconnectez-vous sur TripVision pour recevoir un nouveau lien.', false), 400);
    q('UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1', [$row['user_id']]);
    send_html(html_page('Compte activé', 'Votre adresse e-mail est confirmée. Vous pouvez maintenant vous connecter et réserver.'));
});
route('POST', '/api/auth/resend-verification', function (Req $req) {
    $e = strtolower(trim((string)v_str($req->body(), 'email', ['email' => true])));
    $ip = $req->ip();
    if (is_locked_out("verify:$e", $ip)) fail(429, 'TOO_MANY_ATTEMPTS');
    record_failed_attempt("verify:$e", $ip);
    $u = q1("SELECT * FROM users WHERE email = $1 AND role = 'client' AND email_verified_at IS NULL AND active AND deleted_at IS NULL", [$e]);
    if ($u) send_verification($u);
    send(['sent' => true]);
});
route('POST', '/api/auth/register-client', function (Req $req) {
    $b = $req->body();
    $name = (string)v_str($b, 'name', ['min' => 2]);
    $email = strtolower(trim((string)v_str($b, 'email', ['email' => true])));
    $password = (string)v_str($b, 'password', ['min' => 8]);
    $phone = phone_field($b);
    if ($p = password_problem($password)) fail(400, 'WEAK_PASSWORD', $p);
    if (q1('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [$email])) fail(409, 'EMAIL_EXISTS');
    $user = q1("INSERT INTO users(email, name, role, password_hash, phone) VALUES ($1,$2,'client',$3,$4) RETURNING *", [$email, trim($name), pw_hash($password), trim($phone)]);
    send_verification($user);
    send(['pending' => true, 'email' => $user['email']], 201);
});

/* ---------- Notifications (équipe, partenaire, client) ---------- */
function notif_scope(array $user): array
{
    return in_array($user['role'], BACKOFFICE_ROLES, true) ? ["audience = 'staff'", []] : ["audience = 'user' AND user_id = $1", [$user['id']]];
}
function unread_notifications(array $user): int
{
    [$w, $p] = notif_scope($user);
    return (int)q1("SELECT count(*)::int AS n FROM notifications WHERE $w AND read_at IS NULL", $p)['n'];
}
route('GET', '/api/notifications', function (Req $req) {
    $u = require_auth($req);
    [$w, $p] = notif_scope($u);
    send(q("SELECT id, kind, title, body, link, ref_id, created_at, read_at FROM notifications WHERE $w ORDER BY created_at DESC LIMIT 300", $p)->rows);
});
route('POST', '/api/notifications/read-all', function (Req $req) {
    $u = require_auth($req);
    [$w, $p] = notif_scope($u);
    q('UPDATE notifications SET read_at = now(), read_by = $' . (count($p) + 1) . " WHERE $w AND read_at IS NULL", [...$p, $u['id']]);
    send(['ok' => true]);
});
route('POST', '/api/notifications/:id/read', function (Req $req) {
    $u = require_auth($req);
    [$w, $p] = notif_scope($u);
    q('UPDATE notifications SET read_at = COALESCE(read_at, now()), read_by = $' . (count($p) + 2) . ' WHERE id = $' . (count($p) + 1) . " AND $w", [...$p, $req->param('id'), $u['id']]);
    send(['ok' => true]);
});
