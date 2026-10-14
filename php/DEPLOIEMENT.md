# Mise en ligne de la version PHP sur l'hébergement Nuxit

La version PHP est un copier-coller de la version actuelle (même base Supabase, mêmes écrans). Aucun outil spécial : tout se téléverse par FTP.

## 0. Avant de commencer
- La version actuelle (Render) **reste en ligne** pendant tout le test. On ne coupe rien tant que la version PHP n'est pas validée.
- Prévoir un **sous-domaine de test** (ex. `test.votredomaine.fr`) pointé sur un dossier de l'hébergement : on teste là, puis on bascule le vrai domaine.

## 1. Préparer le dossier à envoyer (sur l'ordinateur de développement)
```
node php/tools/build-dist.mjs
```
Crée le dossier `dist-php/` (≈ 90 Mo) : le site, le back-office, l'espace client, `api.php`, le dossier `app/` (le serveur PHP) et le `.htaccess`.

## 2. Créer le fichier de réglages
1. Dans `dist-php/app/`, copier `env.example` en `.env` (point devant, pas d'extension).
2. Le remplir (jamais dans Git, jamais par e-mail) :
   - `DATABASE_URL` et `JWT_SECRET` : **les mêmes** que sur Render (Render → Environment). Avec le même `JWT_SECRET`, personne n'est déconnecté.
   - `APP_URL` : l'adresse publique, sans `/` final.
   - `SUPPORT_EMAIL` : l'adresse qui reçoit les alertes de l'équipe.
   - E-mails : SMTP du compte mail Nuxit (ou `MAIL_NATIVE=1`).
   - `STRIPE_SECRET_KEY` (test `sk_test_…` d'abord) et `STRIPE_WEBHOOK_SECRET`.
   - `CRON_KEY` : une longue chaîne aléatoire au choix.

## 3. Envoyer par FTP
Envoyer **tout le contenu** de `dist-php/` (y compris les fichiers qui commencent par un point : `.htaccess`, `app/.htaccess`, `app/.env`) dans le dossier du site (souvent `public_html` ou le dossier du sous-domaine). Mode de transfert « binaire ».

## 4. Vérifier l'hébergement
Ouvrir dans le navigateur : `https://VOTRE-SITE/api/cron/check?key=VOTRE_CRON_KEY`
La réponse doit montrer : `database.ok: true`, `stripe.reachable: true`, `extensions.pgsql` ou `extensions.pdo_pgsql` à `true`, `curl`, `mbstring`, `openssl` à `true`.
- Si `pgsql` et `pdo_pgsql` sont tous les deux `false` : activer l'extension PostgreSQL dans le panneau (sélecteur de version PHP → extensions). Sans elle la base n'est pas joignable.
- Si `stripe.reachable` est `false` ou `database.ok` est `false` : l'hébergeur bloque les connexions sortantes → demander à Nuxit de les autoriser (ports 443 et 6543).

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
Tant que Render tourne, revenir en arrière = remettre l'ancien enregistrement DNS. Les données sont dans Supabase : rien ne se perd d'un côté ou de l'autre.

## Limites de cette version (volontaires)
- Les locations de voitures et l'espace partenaire sont **masqués** (non proposés pour le lancement). Le code et les tables existent toujours dans la version actuelle.
- Les flèches « → » du reçu PDF sont remplacées par « – » (la police standard du PDF ne contient pas la flèche).
