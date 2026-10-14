<?php
/* Crée le fichier SQL du premier compte du back-office (à importer dans phpMyAdmin APRÈS schema.sql).
     php php/tools/create-admin.php toi@exemple.fr "Prénom Nom"
   Un mot de passe temporaire est généré et affiché une seule fois dans ce terminal (il n'est écrit nulle part ailleurs que sous forme chiffrée).
   À la première connexion le site oblige à choisir un nouveau mot de passe. Rôle : « it » (tous les droits). */
declare(strict_types=1);
$email = strtolower(trim($argv[1] ?? ''));
$name = trim($argv[2] ?? 'Administrateur TripVision');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { fwrite(STDERR, "Usage : php create-admin.php adresse@exemple.fr \"Prénom Nom\"\n"); exit(1); }
$alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
$pw = '';
for ($i = 0; $i < 14; $i++) $pw .= $alphabet[random_int(0, strlen($alphabet) - 1)];
$pw .= '-' . random_int(10, 99);
$hash = '$2a$' . substr(password_hash($pw, PASSWORD_BCRYPT, ['cost' => 10]), 4);
$d = random_bytes(16); $d[6] = chr(ord($d[6]) & 0x0f | 0x40); $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
$id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
$q = fn(string $s) => "'" . str_replace("'", "''", $s) . "'";
$parts = explode(' ', $name, 2);
$sql = "-- Premier compte du back-office (rôle IT). À importer après schema.sql.\nSET NAMES utf8mb4;\n"
    . "INSERT INTO users (id, email, name, first_name, last_name, role, password_hash, must_change_password, active, permissions, email_verified_at) VALUES ("
    . implode(', ', [$q($id), $q($email), $q($name), $q($parts[0]), $q($parts[1] ?? ''), "'it'", $q($hash), '1', '1', "'{}'", 'UTC_TIMESTAMP(3)']) . ");\n";
$file = 'premier-compte.sql';
file_put_contents($file, $sql);
echo "Fichier écrit : $file\nIdentifiant : $email\nMot de passe temporaire : $pw\n(noté ici seulement ; à changer à la première connexion — importer ensuite $file dans phpMyAdmin puis le supprimer de votre ordinateur)\n";
