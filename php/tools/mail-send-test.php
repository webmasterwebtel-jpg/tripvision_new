<?php
/* Envoi de vérification des e-mails de la version PHP : php php/tools/mail-send-test.php adresse@exemple.fr
   Utilise le .env du projet (SMTP / Brevo). N'écrit rien en base. */
define('TV_APP', dirname(__DIR__) . '/src');
require TV_APP . '/bootstrap.php';
$to = $argv[1] ?? '';
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) { fwrite(STDERR, "Indiquez l'adresse du destinataire.\n"); exit(1); }
$mode = env('BREVO_API_KEY') ? 'Brevo' : (env('SMTP_HOST') ? 'SMTP ' . env('SMTP_HOST') . ':' . (env('SMTP_PORT') ?: '587') : (env('MAIL_NATIVE') === '1' ? 'mail()' : 'AUCUN'));
echo "Mode : $mode\n";
$tests = [
    'Activation de compte' => notification_email('[Test PHP] Activez votre compte TripVision', 'Bienvenue, Camille', 'Votre compte TripVision est créé. Cliquez sur le bouton ci-dessous pour l’activer, puis connectez-vous pour réserver.', 'Activer mon compte', app_url() . '/api/auth/verify-email?t=exemple', [], 'Ce lien est personnel et valable 48 heures. Si vous n’êtes pas à l’origine de cette inscription, ignorez cet e-mail.'),
    'Réinitialisation du mot de passe' => reset_email('Camille', app_url() . '/activation/?token=exemple', 2),
    'Confirmation de réservation' => notification_email('[Test PHP] Votre réservation TripVision est confirmée', 'Réservation confirmée', 'Merci, votre séjour est confirmé ! Votre paiement est bien enregistré. Retrouvez le détail de votre réservation et votre justificatif dans votre espace client.', 'Voir ma réservation', espace_link('orders'), [['Référence', 'TV-DEMO0001'], ['Séjour', 'Week-end à Marrakech'], ['Trajet', 'Paris → Marrakech'], ['Voyageurs', '2'], ['Payé en ligne', '778 €']]),
];
foreach ($tests as $label => $mail) {
    $mail['subject'] = str_starts_with($mail['subject'], '[Test PHP]') ? $mail['subject'] : '[Test PHP] ' . $mail['subject'];
    $r = send_mail($to, $mail);
    echo str_pad($label, 36), $r['sent'] ? 'envoyé' : 'ÉCHEC : ' . ($r['error'] ?? '?'), "\n";
}
