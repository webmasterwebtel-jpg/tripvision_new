# Mise en ligne de la version PHP sur l'hébergement Nuxit

La version PHP reprend les mêmes écrans que la version actuelle et utilise la base **MariaDB fournie par Nuxit** (plus Supabase). Aucun outil spécial : tout se téléverse par FTP, la base s'installe par phpMyAdmin.

## 0. Avant de commencer
- La version actuelle (Render) **reste en ligne** pendant tout le test. On ne coupe rien tant que la version PHP n'est pas validée.
- Prévoir un **sous-domaine de test** (ex. `test.votredomaine.fr`) pointé sur un dossier de l'hébergement : on teste là, puis on bascule le vrai domaine.

## 1 bis. Créer la base de données (phpMyAdmin Nuxit)
1. Dans le panneau Nuxit → Bases de données : créer une base MariaDB et un utilisateur ; noter le nom de la base, l'utilisateur, le mot de passe et le serveur (souvent `localhost`).
2. Ouvrir phpMyAdmin, choisir la base, onglet **Importer** → fichier `php/db/schema.sql` (jeu de caractères utf8mb4) → Exécuter. Cela crée les 28 tables et les données de départ.
3. **Premier compte** (base vide) : php php/tools/create-admin.php toi@exemple.fr "Prénom Nom" crée premier-compte.sql et affiche un mot de passe temporaire (à changer à la première connexion). Importer ce fichier dans phpMyAdmin après schema.sql, puis le supprimer.
3 bis. Reprise des données de l'ancien site (comptes, offres, demandes, messages…) : sur l'ordinateur de développement, `php php/tools/copy-postgres-to-mariadb.php "postgres://…(adresse Supabase)" donnees.sql`, puis importer `donnees.sql` dans phpMyAdmin (après `schema.sql`). Les mots de passe et les connexions restent valables. Si le fichier dépasse la limite d'import de phpMyAdmin, le découper par tables ou demander à Nuxit de relever la limite.
4. Taille : l'offre Web 1 donne 2 bases de 250 Mo. Les images importées via le back-office sont stockées dans la base : privilégier des images légères (le serveur refuse déjà les fichiers trop gros).

## 1. Préparer le dossier à envoyer (sur l'ordinateur de développement)
```
node php/tools/build-dist.mjs
```
Crée le dossier `dist-php/` (≈ 90 Mo) : le site, le back-office, l'espace client, `api.php`, le dossier `app/` (le serveur PHP) et le `.htaccess`.

## 2. Créer le fichier de réglages
1. Dans `dist-php/app/`, copier `env.example` en `.env` (point devant, pas d'extension).
2. Le remplir (jamais dans Git, jamais par e-mail) :
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` : ceux de la base créée à l'étape 1 bis.
   - `JWT_SECRET` : **le même** que sur Render (Render → Environment) pour que personne ne soit déconnecté.
   - `APP_URL` : l'adresse publique, sans `/` final.
   - `SUPPORT_EMAIL` : l'adresse qui reçoit les alertes de l'équipe.
   - E-mails : SMTP du compte mail Nuxit (ou `MAIL_NATIVE=1`).
   - `STRIPE_SECRET_KEY` (test `sk_test_…` d'abord) et `STRIPE_WEBHOOK_SECRET`.
   - `CRON_KEY` : une longue chaîne aléatoire au choix.

## 3. Envoyer par FTP
Envoyer **tout le contenu** de `dist-php/` (y compris les fichiers qui commencent par un point : `.htaccess`, `app/.htaccess`, `app/.env`) dans le dossier du site (souvent `public_html` ou le dossier du sous-domaine). Mode de transfert « binaire ».

## 4. Vérifier l'hébergement
Ouvrir dans le navigateur : `https://VOTRE-SITE/api/cron/check?key=VOTRE_CRON_KEY`
La réponse doit montrer : `database.ok: true` (avec la version de MariaDB et `tables: 28`), `stripe.reachable: true`, `extensions.pdo_mysql`, `curl`, `mbstring`, `openssl` à `true`.
- Si `pdo_mysql` est `false` : activer l'extension dans le panneau (sélecteur de version PHP → extensions). Choisir PHP 8.2 ou plus récent.
- Si `database.ok` est `false` : vérifier `DB_*` dans `app/.env` (le message d'erreur est affiché).
- Si `stripe.reachable` est `false` : l'hébergeur bloque les connexions sortantes → demander à Nuxit d'autoriser le port 443.

## 4 bis. Adresses e-mail du site
- `hello@tripvision.fr` : l'adresse du site (contact, messages, alertes de l'équipe → `SUPPORT_EMAIL`).
- `noreply@tripvision.fr` : expéditeur des e-mails automatiques (activation, mot de passe, confirmations → `SMTP_USER`, `SMTP_FROM=TripVision <noreply@tripvision.fr>`).
À faire dans le panneau Nuxit : créer les deux boîtes, relever le serveur SMTP, le port et le mot de passe de `noreply@`, puis dans la zone DNS pointer les enregistrements **MX** vers Nuxit et remplacer le **SPF** par celui que Nuxit indique (et activer la signature **DKIM** si le panneau la propose). Tant que les MX pointent encore chez webmo.fr, garder `SMTP_HOST=smtp.webmo.fr`. Tester ensuite avec : `php php/tools/mail-send-test.php votre@adresse.fr`.

## 5. Tâches planifiées (CRON)
Dans le panneau Nuxit → « Tâches CRON » : une tâche **toutes les 5 minutes** (ou 10) qui ouvre :
```
https://VOTRE-SITE/api/cron/run?key=VOTRE_CRON_KEY
```
(commande possible : `curl -s "https://VOTRE-SITE/api/cron/run?key=…" > /dev/null`). Elle envoie les alertes de prix, annule les paiements non terminés après 40 min, clôture les conversations sans réponse (7 jours), rappelle de publier des offres (48 h) et renouvelle les brouillons de vols (toutes les 48 h). Sans CRON, ces tâches se lancent quand même au fil des visites (au plus toutes les 5 min), mais le CRON est plus fiable.

## 6. Stripe
Dans le tableau de bord Stripe → Développeurs → Webhooks : ajouter `https://VOTRE-SITE/api/stripe/webhook`, événements `checkout.session.completed` et `checkout.session.expired`, puis copier le secret `whsec_…` dans `app/.env` (`STRIPE_WEBHOOK_SECRET`).

## 7. Bascule du vrai domaine
1. Tester sur le sous-domaine : connexion client, création d'un compte, demande de vol, paiement d'un pack avec la carte de test `4242 4242 4242 4242`, reçu PDF, back-office (offres, messagerie, statistiques, exports).
2. Quand tout est validé : pointer le domaine (zone DNS Nuxit) sur l'hébergement, **sans toucher aux enregistrements MX** (les e-mails du domaine continuent de marcher). Mettre `APP_URL` à l'adresse définitive, décommenter la redirection HTTPS dans `.htaccess`.
3. Garder Render quelques jours en secours, puis le suspendre.

## Retour en arrière
Tant que Render tourne, revenir en arrière = remettre l'ancien enregistrement DNS. Attention : les deux versions ont chacune leur base (Supabase pour Render, MariaDB pour Nuxit) ; ce qui est créé sur l'une n'apparaît pas sur l'autre. Refaire la copie des données (étape 1 bis, point 3) juste avant la bascule définitive.

## Limites de cette version (volontaires)
- Les pages **Voitures** et **Week-ends** affichent « Bientôt disponible » (scène animée) ; l'espace partenaire est masqué. Le code reste en place : retirer `assets/soon.js` les rouvre.
- Les flèches « → » du reçu PDF sont remplacées par « – » (la police standard du PDF ne contient pas la flèche).

