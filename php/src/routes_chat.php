<?php
declare(strict_types=1);
/* Messagerie client/partenaire ↔ équipe, pastilles, messages de contact. Jamais le contenu d'un message dans un e-mail. */

const MAX_OPEN_THREADS = 5;
const CHAT_AUTO_CLOSE_DAYS = 7;

function parse_attachments(array $b): array
{
    $list = $b['attachments'] ?? [];
    if ($list === null) $list = [];
    if (!is_array($list) || !array_is_list($list)) throw new ValidationFailed([['code' => 'invalid_type', 'message' => 'Expected array', 'path' => ['attachments']]]);
    if (count($list) > 3) throw new ValidationFailed([['code' => 'too_big', 'message' => 'Array must contain at most 3 element(s)', 'path' => ['attachments']]]);
    $out = [];
    foreach ($list as $i => $a) {
        $a = is_array($a) ? $a : [];
        $url = (string)v_str($a, 'url', ['regex' => '#^/uploads/[0-9a-f-]{36}$#i']);
        $name = (string)v_str($a, 'name', ['trim' => true, 'max' => 120]);
        $mime = (string)v_str($a, 'mime', ['max' => 60]);
        $size = (int)v_num($a, 'size', ['int' => true, 'min' => 0, 'max' => 8 * 1024 * 1024, 'required' => true]);
        $out[] = ['url' => $url, 'name' => $name, 'mime' => $mime, 'size' => $size];
    }
    return $out;
}
/** @return array{0:string,1:array} message et pièces jointes. */
function parse_chat_message(array $b, string $key = 'message'): array
{
    $text = (string)v_str($b, $key, ['trim' => true, 'max' => 4000, 'required' => false, 'default' => '']);
    $att = parse_attachments($b);
    if ($text === '' && !$att) invalid('Écrivez un message ou joignez un fichier.', ['message']);
    return [$text, $att];
}
function chat_thread_info(array $t): array
{
    $keys = ['id', 'subject', 'status', 'partner_name', 'partner_email', 'kind', 'created_at', 'updated_at', 'closed_at', 'closed_by', 'auto_closed', 'assigned_to', 'assigned_name', 'first_response_at', 'rating', 'rating_comment'];
    $o = [];
    foreach ($keys as $k) $o[$k] = $t[$k] ?? null;
    return $o;
}
/** Le client et le partenaire ne voient jamais les notes internes de l'équipe. */
function chat_messages(string $threadId, bool $forStaff = false): array
{
    return q('SELECT id, sender, body, created_at, author, attachments FROM chat_messages WHERE thread_id = $1 ' . ($forStaff ? '' : "AND sender <> 'note'") . ' ORDER BY created_at ASC', [$threadId])->rows;
}
function chat_identity(array $user): array
{
    $p = q1('SELECT trade_name, contact_email FROM partners WHERE user_id = $1 AND deleted_at IS NULL', [$user['id']]);
    return ['name' => ($p['trade_name'] ?? null) ?: ($user['name'] ?: $user['email']), 'email' => ($p['contact_email'] ?? null) ?: $user['email']];
}
function own_thread(array $user, string $id): ?array
{
    return is_uuid($id) ? q1('SELECT * FROM chat_threads WHERE id = $1 AND partner_user_id = $2', [$id, $user['id']]) : null;
}
function alert_staff_of_message(array $thread, array $user, bool $fresh): void
{
    $who = $user['role'] === 'partner' ? 'partenaire' : 'client';
    notify(staff_email(), notification_email('[TripVision] ' . ($fresh ? 'Nouvelle conversation' : 'Nouveau message') . ' — ' . $thread['partner_name'], $fresh ? 'Nouvelle conversation' : 'Nouveau message',
        mail_text($thread['partner_name']) . " ($who) vous a écrit dans la messagerie.", 'Ouvrir la messagerie', staff_link('chats')));
    push_notification('staff', 'chat', $fresh ? 'Nouvelle conversation' : 'Nouveau message', $thread['partner_name'] . " ($who) · " . $thread['subject'], 'chats');
}
const CHAT_LAST_MESSAGE = "(SELECT COALESCE(NULLIF(m.body, ''), CASE WHEN jsonb_array_length(COALESCE(m.attachments, '[]'::jsonb)) > 0 THEN '📎 ' || (m.attachments->0->>'name') ELSE '' END) FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN ('system', 'note') ORDER BY m.created_at DESC LIMIT 1)";

/* ---------- Pièces jointes : JPG/JPEG, PNG ou PDF ---------- */
function store_chat_file(Req $req, array $user): never
{
    $mime = trim(explode(';', $req->header('content-type'))[0]);
    $body = $req->raw();
    $ok = match ($mime) {
        'image/jpeg' => strlen($body) > 3 && str_starts_with($body, "\xFF\xD8\xFF"),
        'image/png' => strlen($body) > 8 && str_starts_with($body, "\x89PNG\r\n\x1A\n"),
        'application/pdf' => strlen($body) > 5 && str_starts_with($body, '%PDF-'),
        default => false,
    };
    if (!$ok || strlen($body) === 0 || strlen($body) > 8 * 1024 * 1024) fail(400, 'INVALID_FILE', 'Formats acceptés : JPG, JPEG, PNG ou PDF (8 Mo maximum).');
    $row = q1('INSERT INTO files(mime, size, data, created_by) VALUES ($1,$2,$3,$4) RETURNING id', [$mime, strlen($body), new PgBytes($body), $user['id']]);
    $name = rawurldecode($req->header('x-file-name') ?: 'fichier');
    $name = mb_substr(trim((string)preg_replace('/[^\p{L}\p{N}._ -]/u', '', $name)), 0, 120) ?: 'fichier';
    send(['url' => '/uploads/' . $row['id'], 'name' => $name, 'mime' => $mime, 'size' => strlen($body)], 201);
}
route('POST', '/api/chat/uploads', function (Req $req) { store_chat_file($req, require_auth($req, CHAT_ROLES)); });
route('POST', '/api/admin/chat-uploads', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES); require_any($u, 'chats.reply', 'chats.manage');
    store_chat_file($req, $u);
});

/* ---------- Côté client / partenaire ---------- */
route('GET', '/api/chat/threads', function (Req $req) {
    $u = require_auth($req, CHAT_ROLES);
    send(q('SELECT t.id, t.subject, t.status, t.created_at, t.updated_at, t.closed_at, t.auto_closed, t.rating, t.unread_partner AS unread, ' . CHAT_LAST_MESSAGE . " AS last_message
     FROM chat_threads t WHERE t.partner_user_id = $1 ORDER BY (t.status <> 'closed') DESC, t.updated_at DESC LIMIT 100", [$u['id']])->rows);
});
route('POST', '/api/chat/threads', function (Req $req) {
    $u = require_auth($req, CHAT_ROLES);
    $b = $req->body();
    $subject = (string)v_str($b, 'subject', ['trim' => true, 'min' => 2, 'max' => 120]);
    [$text, $att] = parse_chat_message($b);
    if (q1("SELECT count(*)::int AS n FROM chat_threads WHERE partner_user_id = $1 AND status <> 'closed'", [$u['id']])['n'] >= MAX_OPEN_THREADS)
        fail(409, 'TOO_MANY_THREADS', 'Vous avez déjà ' . MAX_OPEN_THREADS . ' conversations ouvertes. Poursuivez-en une ou attendez sa clôture.');
    $who = chat_identity($u);
    $t = q1('INSERT INTO chat_threads(partner_user_id, partner_name, partner_email, kind, subject) VALUES ($1,$2,$3,$4,$5) RETURNING *', [$u['id'], $who['name'], $who['email'], $u['role'], $subject]);
    q("INSERT INTO chat_messages(thread_id, sender, body, author, attachments) VALUES ($1,'partner',$2,$3,$4)", [$t['id'], $text, $who['name'], json_encode($att)]);
    q('UPDATE chat_threads SET unread_admin = 1 WHERE id = $1', [$t['id']]);
    alert_staff_of_message($t, $u, true);
    send(['id' => $t['id']], 201);
});
route('GET', '/api/chat/threads/:id', function (Req $req) {
    $u = require_auth($req, CHAT_ROLES);
    $t = own_thread($u, $req->param('id'));
    if (!$t) fail(404, 'NOT_FOUND');
    q('UPDATE chat_threads SET unread_partner = 0 WHERE id = $1', [$t['id']]);
    send(['thread' => chat_thread_info($t), 'messages' => chat_messages($t['id'])]);
});
route('POST', '/api/chat/threads/:id/messages', function (Req $req) {
    $u = require_auth($req, CHAT_ROLES);
    [$text, $att] = parse_chat_message($req->body());
    $t = own_thread($u, $req->param('id'));
    if (!$t) fail(404, 'NOT_FOUND');
    if ($t['status'] === 'closed') fail(409, 'THREAD_CLOSED', 'Cette conversation est clôturée. Démarrez-en une nouvelle si besoin.');
    $m = q1("INSERT INTO chat_messages(thread_id, sender, body, author, attachments) VALUES ($1,'partner',$2,$3,$4) RETURNING id, sender, body, created_at, author, attachments", [$t['id'], $text, $t['partner_name'], json_encode($att)]);
    // Le client a répondu : la conversation repasse à « ouverte » (l'équipe doit répondre).
    q("UPDATE chat_threads SET unread_admin = unread_admin + 1, status = 'open', updated_at = now() WHERE id = $1", [$t['id']]);
    alert_staff_of_message($t, $u, false);
    send(['message' => $m], 201);
});
// Note de satisfaction, donnée une seule fois après la clôture.
route('POST', '/api/chat/threads/:id/rating', function (Req $req) {
    $u = require_auth($req, CHAT_ROLES);
    $b = $req->body();
    $rating = (int)v_num($b, 'rating', ['int' => true, 'min' => 1, 'max' => 5, 'required' => true]);
    $comment = v_str($b, 'comment', ['trim' => true, 'max' => 500, 'required' => false]);
    $t = own_thread($u, $req->param('id'));
    if (!$t) fail(404, 'NOT_FOUND');
    if ($t['status'] !== 'closed') fail(409, 'NOT_CLOSED', 'Vous pourrez noter la conversation une fois clôturée.');
    if ($t['rating']) fail(409, 'ALREADY_RATED', 'Merci, vous avez déjà donné votre avis.');
    q('UPDATE chat_threads SET rating = $2, rating_comment = $3 WHERE id = $1', [$t['id'], $rating, $comment ?: null]);
    push_notification('staff', 'chat', "Avis reçu : $rating/5", $t['partner_name'] . ' · ' . $t['subject'], 'chats');
    send(['ok' => true]);
});

/* ---------- Pastilles de l'espace client / partenaire ---------- */
route('GET', '/api/me/badges', function (Req $req) {
    $u = require_auth($req, CHAT_ROLES);
    $chat = q1('SELECT COALESCE(sum(unread_partner), 0)::int AS n FROM chat_threads WHERE partner_user_id = $1', [$u['id']])['n'];
    if ($u['role'] === 'partner') {
        $bookings = q1("SELECT count(*)::int AS n FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id JOIN partners p ON p.id = v.partner_id WHERE p.user_id = $1 AND b.partner_seen_at IS NULL AND b.payment_status NOT IN ('awaiting', 'failed')", [$u['id']])['n'];
    } else {
        $bookings = (int)q1("SELECT (SELECT count(*) FROM bookings WHERE lower(customer_email) = lower($1) AND status_changed_at IS NOT NULL AND (client_seen_at IS NULL OR client_seen_at < status_changed_at))
            + (SELECT count(*) FROM offer_requests WHERE lower(customer_email) = lower($1) AND payment_status NOT IN ('awaiting', 'failed') AND status_changed_at IS NOT NULL AND (client_seen_at IS NULL OR client_seen_at < status_changed_at)) AS n", [$u['email']])['n'];
    }
    send(['chat' => $chat, 'bookings' => $bookings, 'notifications' => unread_notifications($u)]);
});
route('POST', '/api/client/orders/:kind/:id/seen', function (Req $req) {
    $u = require_auth($req, ['client']);
    $kind = $req->param('kind');
    $table = $kind === 'requests' ? 'offer_requests' : ($kind === 'bookings' ? 'bookings' : null);
    if (!$table) fail(404, 'NOT_FOUND');
    $id = $req->param('id');
    if (is_uuid($id)) q("UPDATE $table SET client_seen_at = now() WHERE id = $1 AND lower(customer_email) = lower($2)", [$id, $u['email']]);
    send(['ok' => true]);
});
route('POST', '/api/admin/offer-requests/:id/seen', function (Req $req) {
    require_auth($req, BACKOFFICE_ROLES);
    $id = $req->param('id');
    if (is_uuid($id)) q('UPDATE offer_requests SET staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $1', [$id]);
    send(['ok' => true]);
});
route('POST', '/api/admin/bookings/:id/seen', function (Req $req) {
    require_auth($req, BACKOFFICE_ROLES);
    $id = $req->param('id');
    if (is_uuid($id)) q('UPDATE bookings SET staff_seen_at = COALESCE(staff_seen_at, now()) WHERE id = $1', [$id]);
    send(['ok' => true]);
});

/* ---------- Côté équipe ---------- */
function chat_staff(Req $req): array { $u = require_auth($req, BACKOFFICE_ROLES); require_any($u, 'chats.reply', 'chats.manage'); return $u; }

route('GET', '/api/admin/chats', function (Req $req) {
    chat_staff($req);
    send(q('SELECT t.id, t.subject, t.status, t.partner_name, t.partner_email, t.kind, t.created_at, t.updated_at, t.closed_at, t.closed_by, t.auto_closed, t.unread_admin AS unread,
            t.assigned_to, t.assigned_name, t.first_response_at, t.rating,
            (SELECT count(*)::int FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN (\'system\', \'note\')) AS messages,
            ' . CHAT_LAST_MESSAGE . ' AS last_message,
            (SELECT sender FROM chat_messages m WHERE m.thread_id = t.id AND m.sender NOT IN (\'system\', \'note\') ORDER BY m.created_at DESC LIMIT 1) AS last_sender
     FROM chat_threads t ORDER BY (t.status <> \'closed\') DESC, (t.status = \'open\') DESC, t.updated_at DESC LIMIT 400')->rows);
});
// Chiffres de la messagerie : délai de première réponse, satisfaction, volumes.
route('GET', '/api/admin/chats-stats', function (Req $req) {
    chat_staff($req);
    $r = q1("SELECT
      count(*) FILTER (WHERE status = 'open')::int AS open, count(*) FILTER (WHERE status = 'pending')::int AS pending, count(*) FILTER (WHERE status = 'closed')::int AS closed,
      count(*) FILTER (WHERE status <> 'closed' AND assigned_to IS NULL)::int AS unassigned,
      round(avg(TIMESTAMPDIFF(SECOND, created_at, first_response_at) / 60) FILTER (WHERE first_response_at IS NOT NULL AND created_at >= now() - interval '30 days'))::int AS first_response_min,
      round(avg(rating)::numeric, 1) AS rating, count(rating)::int AS rated
    FROM chat_threads");
    $r['rating'] = $r['rating'] === null ? null : (float)$r['rating'] + 0;
    send($r + ['autoCloseDays' => CHAT_AUTO_CLOSE_DAYS]);
});
route('GET', '/api/admin/chat-staff', function (Req $req) {
    chat_staff($req);
    send(q("SELECT id, name, role FROM users WHERE role IN ('it','admin','manager') AND active AND deleted_at IS NULL ORDER BY name")->rows);
});
route('GET', '/api/admin/chat-canned', function (Req $req) {
    chat_staff($req);
    send(q('SELECT id, title, body FROM chat_canned ORDER BY created_at')->rows);
});
route('POST', '/api/admin/chat-canned', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES); require_can($u, 'chats.manage');
    $b = $req->body();
    $title = (string)v_str($b, 'title', ['trim' => true, 'min' => 2, 'max' => 60]);
    $body = (string)v_str($b, 'body', ['trim' => true, 'min' => 2, 'max' => 2000]);
    send(q1('INSERT INTO chat_canned(title, body, created_by) VALUES ($1,$2,$3) RETURNING id, title, body', [$title, $body, $u['name'] ?: $u['email']]), 201);
});
route('DELETE', '/api/admin/chat-canned/:id', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES); require_can($u, 'chats.manage');
    if (is_uuid($req->param('id'))) q('DELETE FROM chat_canned WHERE id = $1', [$req->param('id')]);
    send(['ok' => true]);
});
route('GET', '/api/admin/chats/:id', function (Req $req) {
    $u = chat_staff($req);
    $id = $req->param('id');
    $t = is_uuid($id) ? q1('SELECT * FROM chat_threads WHERE id = $1', [$id]) : null;
    if (!$t) fail(404, 'NOT_FOUND');
    q('UPDATE chat_threads SET unread_admin = 0 WHERE id = $1', [$t['id']]);
    send(['thread' => chat_thread_info($t), 'messages' => chat_messages($t['id'], true), 'canManage' => has_permission($u, 'chats.manage'), 'me' => $u['id']]);
});
route('POST', '/api/admin/chats/:id/messages', function (Req $req) {
    $u = chat_staff($req);
    [$text, $att] = parse_chat_message($req->body());
    $id = $req->param('id');
    $t = is_uuid($id) ? q1('SELECT * FROM chat_threads WHERE id = $1', [$id]) : null;
    if (!$t) fail(404, 'NOT_FOUND');
    if ($t['status'] === 'closed') fail(409, 'THREAD_CLOSED', 'Cette conversation est clôturée : rouvrez-la pour répondre.');
    $m = q1("INSERT INTO chat_messages(thread_id, sender, body, author, attachments) VALUES ($1,'admin',$2,$3,$4) RETURNING id, sender, body, created_at, author, attachments", [$t['id'], $text, $u['name'] ?: 'TripVision', json_encode($att)]);
    // Réponse de l'équipe : la conversation attend désormais le client ; la première réponse fixe le délai de réponse et prend la conversation en charge.
    q("UPDATE chat_threads SET unread_partner = unread_partner + 1, status = 'pending', updated_at = now(), first_response_at = COALESCE(first_response_at, now()), assigned_to = COALESCE(assigned_to, $2), assigned_name = COALESCE(assigned_name, $3) WHERE id = $1", [$t['id'], $u['id'], $u['name'] ?: $u['email']]);
    push_notification($t['partner_user_id'], 'chat', 'Vous avez une réponse', 'L’équipe TripVision a répondu à votre message.', 'chat');
    $mail = send_mail($t['partner_email'], notification_email('[TripVision] Vous avez une réponse', 'Vous avez une réponse', 'L’équipe TripVision a répondu à votre message. Connectez-vous à votre espace pour le lire et poursuivre la conversation.', 'Ouvrir ma messagerie', espace_link('chat')));
    send(['message' => $m, 'notified' => $mail['sent']], 201);
});
// Notes internes : visibles uniquement par l'équipe.
route('POST', '/api/admin/chats/:id/notes', function (Req $req) {
    $u = chat_staff($req);
    $text = (string)v_str($req->body(), 'message', ['trim' => true, 'min' => 1, 'max' => 2000]);
    $id = $req->param('id');
    if (!is_uuid($id) || !q1('SELECT id FROM chat_threads WHERE id = $1', [$id])) fail(404, 'NOT_FOUND');
    send(['message' => q1("INSERT INTO chat_messages(thread_id, sender, body, author) VALUES ($1,'note',$2,$3) RETURNING id, sender, body, created_at, author, attachments", [$id, $text, $u['name'] ?: 'Équipe'])], 201);
});
// Attribution : chacun peut prendre une conversation en charge ; confier ou retirer à quelqu'un d'autre demande le droit « Messagerie ».
route('POST', '/api/admin/chats/:id/assign', function (Req $req) {
    $u = chat_staff($req);
    $b = $req->body();
    $to = $b['to'] ?? null;
    if ($to !== null && (!is_string($to) || !is_uuid($to))) throw new ValidationFailed([['code' => 'invalid_string', 'message' => 'Invalid uuid', 'path' => ['to']]]);
    $id = $req->param('id');
    $t = is_uuid($id) ? q1('SELECT * FROM chat_threads WHERE id = $1', [$id]) : null;
    if (!$t) fail(404, 'NOT_FOUND');
    if ($to !== $u['id'] && !has_permission($u, 'chats.manage')) fail(403, 'PERMISSION_DENIED');
    $name = null;
    if ($to) {
        $x = q1("SELECT name, email FROM users WHERE id = $1 AND role IN ('it','admin','manager') AND active AND deleted_at IS NULL", [$to]);
        if (!$x) fail(404, 'NOT_FOUND');
        $name = $x['name'] ?: $x['email'];
    }
    q('UPDATE chat_threads SET assigned_to = $2, assigned_name = $3 WHERE id = $1', [$t['id'], $to, $name]);
    q("INSERT INTO chat_messages(thread_id, sender, body, author) VALUES ($1,'note',$2,$3)", [$t['id'], $to ? ($to === $u['id'] ? 'Conversation prise en charge.' : "Conversation confiée à $name.") : 'Conversation remise à disposition de l’équipe.', $u['name'] ?: 'Équipe']);
    send(['ok' => true, 'assigned_to' => $to, 'assigned_name' => $name]);
});
// Clôturer / rouvrir : réservé à l'IT et aux managers ou agents qui en ont reçu le droit.
function set_thread_status(Req $req, string $status): never
{
    $u = require_auth($req, BACKOFFICE_ROLES); require_can($u, 'chats.manage');
    $id = $req->param('id');
    $t = is_uuid($id) ? q1('SELECT * FROM chat_threads WHERE id = $1', [$id]) : null;
    if (!$t) fail(404, 'NOT_FOUND');
    if ($t['status'] === $status) send(['ok' => true, 'status' => $status]);
    $closing = $status === 'closed';
    if ($closing) q('UPDATE chat_threads SET status = $2, closed_at = now(), closed_by = $3, auto_closed = false, updated_at = now(), unread_partner = unread_partner + 1 WHERE id = $1', [$t['id'], $status, $u['name'] ?: $u['email']]);
    else q('UPDATE chat_threads SET status = $2, closed_at = NULL, closed_by = NULL, auto_closed = false, updated_at = now(), unread_partner = unread_partner + 1 WHERE id = $1', [$t['id'], $status]);
    q("INSERT INTO chat_messages(thread_id, sender, body) VALUES ($1,'system',$2)", [$t['id'], $closing ? 'Conversation clôturée par TripVision.' : 'Conversation rouverte par TripVision.']);
    push_notification($t['partner_user_id'], 'chat', $closing ? 'Conversation clôturée' : 'Conversation rouverte', $closing ? $t['subject'] . ' · donnez-nous votre avis' : $t['subject'], 'chat');
    audit($u['id'], $closing ? 'chat_closed' : 'chat_reopened', 'chat_thread', $t['id'], $req->ip());
    send(['ok' => true, 'status' => $status]);
}
route('POST', '/api/admin/chats/:id/close', fn(Req $r) => set_thread_status($r, 'closed'));
route('POST', '/api/admin/chats/:id/reopen', fn(Req $r) => set_thread_status($r, 'open'));

/** Clôture automatique : une conversation qui attend le client depuis 7 jours sans réponse. Appelée par le CRON. */
function auto_close_chats(): int
{
    $rows = [];
    foreach (q("SELECT id FROM chat_threads WHERE status = 'pending' AND updated_at < now() - ($1 || ' days')::interval", [(string)CHAT_AUTO_CLOSE_DAYS])->rows as $c) {
        $t = q1("UPDATE chat_threads SET status = 'closed', closed_at = now(), closed_by = 'Automatique', auto_closed = true, updated_at = now(), unread_partner = unread_partner + 1 WHERE id = $1 AND status = 'pending' RETURNING id, partner_user_id, subject", [$c['id']]);
        if ($t) $rows[] = $t;
    }
    foreach ($rows as $t) {
        q("INSERT INTO chat_messages(thread_id, sender, body) VALUES ($1,'system',$2)", [$t['id'], 'Conversation clôturée automatiquement après ' . CHAT_AUTO_CLOSE_DAYS . ' jours sans réponse. Vous pouvez en démarrer une nouvelle à tout moment.']);
        push_notification($t['partner_user_id'], 'chat', 'Conversation clôturée', $t['subject'] . ' · sans réponse depuis ' . CHAT_AUTO_CLOSE_DAYS . ' jours', 'chat');
    }
    return count($rows);
}

/* ---------- Messages de contact (back-office) ---------- */
route('GET', '/api/admin/messages', function (Req $req) {
    require_auth($req, BACKOFFICE_ROLES);
    send(q('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 300')->rows);
});
route('PATCH', '/api/admin/messages/:id', function (Req $req) {
    $u = require_auth($req, BACKOFFICE_ROLES);
    $handled = v_bool($req->body(), 'handled');
    if ($handled === null) throw new ValidationFailed([['code' => 'invalid_type', 'message' => 'Required', 'path' => ['handled']]]);
    $id = $req->param('id');
    $m = is_uuid($id) ? q1('UPDATE contact_messages SET handled_at = $1 WHERE id = $2 RETURNING *', [$handled ? gmdate('Y-m-d\TH:i:s\Z') : null, $id]) : null;
    if (!$m) fail(404, 'NOT_FOUND');
    audit($u['id'], $handled ? 'message_handled' : 'message_reopened', 'message', $id, $req->ip());
    send($m);
});
