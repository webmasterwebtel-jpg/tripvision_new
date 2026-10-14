<?php
declare(strict_types=1);
/* E-mails : envoi (API Brevo, sinon SMTP, sinon mail() de l'hébergeur) et gabarits identiques à la version Node. */

function mail_ready(): bool { return (bool)env('BREVO_API_KEY') || (env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASSWORD')) || env('MAIL_NATIVE') === '1'; }

/** Sépare « Nom <adresse@x.fr> ». */
function mail_from(): array
{
    $from = (string)(env('SMTP_FROM') ?: env('SMTP_USER') ?: '');
    if (preg_match('/^(.*)<([^>]+)>\s*$/', $from, $m)) return [trim(trim($m[1]), '"') ?: 'TripVision', trim($m[2])];
    return ['TripVision', trim($from)];
}
function http_post_json(string $url, array $headers, string $body, int $timeout = 12): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_HTTPHEADER => $headers]);
    $out = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return [$code, (string)$out, $err];
}
function smtp_send(string $to, string $subject, string $text, ?string $html, ?string $replyTo): void
{
    $host = (string)env('SMTP_HOST'); $port = (int)(env('SMTP_PORT', '587'));
    [$fromName, $fromAddr] = mail_from();
    $remote = ($port === 465 ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 10);
    if (!$fp) throw new RuntimeException("SMTP: $errstr");
    stream_set_timeout($fp, 15);
    $read = function () use ($fp): string { $r = ''; while (($l = fgets($fp, 515)) !== false) { $r .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; } return $r; };
    $cmd = function (string $c, array $ok) use ($fp, $read): string { fwrite($fp, $c . "\r\n"); $r = $read(); if (!in_array(substr($r, 0, 3), $ok, true)) throw new RuntimeException('SMTP ' . trim($r)); return $r; };
    $read();
    $cmd('EHLO tripvision', ['250']);
    if ($port !== 465) { $cmd('STARTTLS', ['220']); stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT); $cmd('EHLO tripvision', ['250']); }
    $cmd('AUTH LOGIN', ['334']); $cmd(base64_encode((string)env('SMTP_USER')), ['334']); $cmd(base64_encode((string)env('SMTP_PASSWORD')), ['235']);
    $cmd("MAIL FROM:<$fromAddr>", ['250']); $cmd("RCPT TO:<$to>", ['250', '251']); $cmd('DATA', ['354']);
    $b = 'tv' . bin2hex(random_bytes(8));
    $enc = fn(string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
    $h = "From: {$enc($fromName)} <$fromAddr>\r\nTo: <$to>\r\nSubject: {$enc($subject)}\r\nMIME-Version: 1.0\r\n" . ($replyTo ? "Reply-To: <$replyTo>\r\n" : '');
    if ($html) {
        $msg = $h . "Content-Type: multipart/alternative; boundary=\"$b\"\r\n\r\n--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$b--";
    } else {
        $msg = $h . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text));
    }
    fwrite($fp, preg_replace('/^\./m', '..', $msg) . "\r\n.\r\n");
    $r = $read();
    if (!str_starts_with($r, '250')) throw new RuntimeException('SMTP ' . trim($r));
    @fwrite($fp, "QUIT\r\n"); fclose($fp);
}
function native_mail(string $to, string $subject, string $text, ?string $html, ?string $replyTo): void
{
    [$fromName, $fromAddr] = mail_from();
    $b = 'tv' . bin2hex(random_bytes(8));
    $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromAddr>\r\nMIME-Version: 1.0\r\n" . ($replyTo ? "Reply-To: $replyTo\r\n" : '');
    if ($html) {
        $headers .= "Content-Type: multipart/alternative; boundary=\"$b\"\r\n";
        $body = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$b--";
    } else {
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n";
        $body = chunk_split(base64_encode($text));
    }
    if (!@mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $fromAddr)) throw new RuntimeException('mail() a échoué');
}
/** @return array{sent: bool, error?: string} */
function send_mail(string $to, array $mail, ?string $replyTo = null): array
{
    $subject = $mail['subject']; $text = $mail['text']; $html = $mail['html'] ?? null;
    if ($html) $html = str_replace('cid:tvlogo', app_url() . '/assets/tripvision-logo-email.png', $html);
    try {
        if (env('BREVO_API_KEY')) {
            [$name, $addr] = mail_from();
            $body = ['sender' => ['name' => $name, 'email' => $addr], 'to' => [['email' => $to]], 'subject' => $subject, 'textContent' => $text] + ($html ? ['htmlContent' => $html] : []) + ($replyTo ? ['replyTo' => ['email' => $replyTo]] : []);
            [$code, $out, $err] = http_post_json('https://api.brevo.com/v3/smtp/email', ['api-key: ' . env('BREVO_API_KEY'), 'Content-Type: application/json', 'accept: application/json'], json_encode($body, JSON_UNESCAPED_UNICODE));
            if ($code < 200 || $code >= 300) throw new RuntimeException("Brevo $code " . substr($out ?: $err, 0, 160));
            return ['sent' => true];
        }
        if (env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASSWORD')) { smtp_send($to, $subject, $text, $html, $replyTo); return ['sent' => true]; }
        if (env('MAIL_NATIVE') === '1') { native_mail($to, $subject, $text, $html, $replyTo); return ['sent' => true]; }
        return ['sent' => false, 'error' => 'SMTP non configuré'];
    } catch (Throwable $e) {
        error_log('Envoi e-mail impossible : ' . $e->getMessage());
        return ['sent' => false, 'error' => $e->getMessage()];
    }
}
/** Envoi sans bloquer la réponse : après l'envoi de la réponse au navigateur (fastcgi_finish_request) ou en fin de script. */
function notify(?string $to, array $mail, ?string $replyTo = null): void
{
    if (!$to) return;
    $GLOBALS['tv_after'][] = static function () use ($to, $mail, $replyTo) { send_mail($to, $mail, $replyTo); };
}
function run_after(): void
{
    $jobs = $GLOBALS['tv_after'] ?? [];
    $GLOBALS['tv_after'] = [];
    foreach ($jobs as $j) { try { $j(); } catch (Throwable $e) { error_log('Tâche après réponse : ' . $e->getMessage()); } }
}

/* ---------- Gabarits (identiques à la version Node) ---------- */
function layout_mail(string $title, string $intro, string $buttonLabel, string $url, string $outro, array $details = []): string
{
    $rows = '';
    foreach ($details as [$k, $v]) if ($v !== null && $v !== '') $rows .= '<tr><td style="padding:6px 0;font-size:13px;color:#7b7f78;width:38%">' . esc_html($k) . '</td><td style="padding:6px 0;font-size:14px;color:#151816;font-weight:bold">' . esc_html($v) . '</td></tr>';
    $table = $rows ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid #e4dfd6;border-bottom:1px solid #e4dfd6">' . $rows . '</table>' : '';
    return '<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f8f5ef;font-family:Arial,Helvetica,sans-serif;color:#151816">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ef;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4dfd6">
<tr><td style="background:#ffffff;padding:22px 32px 18px;border-bottom:4px solid #0b352b"><img src="cid:tvlogo" width="170" alt="TripVision — Voyager autrement" style="display:block;border:0;outline:none;height:auto;max-width:170px"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-family:Georgia,\'Times New Roman\',serif;font-size:28px;font-weight:600;line-height:1.1;color:#151816">' . esc_html($title) . '</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a423e">' . $intro . '</p>
' . $table . '<p style="margin:0 0 24px"><a href="' . esc_html($url) . '" style="display:inline-block;background:#075f4b;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 26px;border-radius:8px">' . esc_html($buttonLabel) . '</a></p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#7b7f78">' . $outro . '</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#7b7f78">Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
</td></tr></table></body></html>';
}
function invitation_email(string $name, string $url, int $hours, ?string $invitedBy = null): array
{
    $who = $invitedBy ? ' par ' . esc_html($invitedBy) : '';
    return [
        'subject' => 'Activez votre accès TripVision',
        'text' => "Bonjour $name,\n\nUn accès TripVision a été créé pour vous" . ($invitedBy ? " par $invitedBy" : '') . ".\nChoisissez votre mot de passe via ce lien (valable $hours h) :\n$url\n\nSi vous n'attendiez pas cet e-mail, ignorez-le.",
        'html' => layout_mail('Bienvenue, ' . esc_html($name), "Un accès TripVision a été créé pour vous$who. Choisissez votre mot de passe pour l'activer.", 'Activer mon accès', $url, "Ce lien est personnel et valable $hours heures. Si vous n'attendiez pas cet e-mail, ignorez-le."),
    ];
}
function reset_email(string $name, string $url, int $hours): array
{
    return [
        'subject' => 'Réinitialisez votre mot de passe TripVision',
        'text' => "Bonjour $name,\n\nPour choisir un nouveau mot de passe, utilisez ce lien (valable $hours h) :\n$url\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable.",
        'html' => layout_mail('Nouveau mot de passe', 'Bonjour ' . esc_html($name) . ', une réinitialisation de votre mot de passe a été demandée.', 'Choisir un nouveau mot de passe', $url, "Ce lien est valable $hours heures et ne peut être utilisé qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable."),
    ];
}
function notification_email(string $subject, string $title, string $intro, string $buttonLabel, string $url, array $details = [], string $outro = 'Cet e-mail vous prévient d’une activité sur votre compte TripVision.'): array
{
    $lines = [strip_tags($intro)];
    foreach ($details as [$k, $v]) if ($v !== null && $v !== '') $lines[] = "$k : $v";
    $lines[] = '';
    $lines[] = "$buttonLabel : $url";
    return ['subject' => $subject, 'text' => implode("\n", $lines), 'html' => layout_mail($title, $intro, $buttonLabel, $url, $outro, $details)];
}
