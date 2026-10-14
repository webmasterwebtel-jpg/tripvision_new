# Conversion PHP de TripVision — fichier d'avancement

Branche : `php-conversion` (la branche `main` / Render n'est PAS touchée).
Périmètre : vols (affichage + clic vers la compagnie), packs week-end (paiement Stripe + reçu PDF), comptes clients, alertes prix, back-office, messagerie.
Hors périmètre pour l'instant : voitures, espace partenaire (masqués dans le dossier à envoyer).

## Règles de travail
- Aucune dépendance Composer : tout en PHP natif (pas de dossier vendor à envoyer par FTP).
- Base MariaDB de l'hébergement Nuxit (structure : php/db/schema.sql, couche de traduction php/src/db.php). Jetons JWT et mots de passe compatibles avec la version Node. Reprise des données Supabase : php/tools/copy-postgres-to-mariadb.php.
- Chaque étape est testée en local contre la version Node (comparaison des réponses) avant d'être cochée.

## Étapes
- [x] 0. Socle (config, base, routeur, JWT, sécurité, e-mail) — jetons croisés Node↔PHP, mots de passe bcrypt
- [x] A. Public : config, offres, géographie, contact, newsletter, demandes, e-mail des vols, suivi des visites, tendances publiques, désinscription, images
- [x] B. Client : tableau de bord, alertes prix, notifications/pastilles, messagerie, annulation de demande, reçu PDF
- [x] C. Packs week-end : Stripe (session réelle en mode test, retour, abandon, webhook signé), reçu PDF
- [x] D. Back-office : tableau de bord, offres (création, modification, statut avec garde « lien faible », lien, planification, suppression), brouillons auto, demandes, messagerie, statistiques + exports xlsx/xls/csv, mailing + export, alertes, clients, comptes internes, journal, connexions, santé
- [x] E. Tâches planifiées : /api/cron/run (CRON) + déclenchement de secours au fil des visites ; /api/cron/check (diagnostic de l'hébergement)
- [x] F. Mise en ligne : `php/tools/build-dist.mjs` → `dist-php/`, `.htaccess`, `.env` d'exemple, `php/DEPLOIEMENT.md`
- [ ] G. À faire AVEC l'utilisateur : test sur l'hébergement Nuxit (création de la base, import schema.sql, extension pdo_mysql, accès sortant Stripe, CRON), paiement avec une vraie carte de test sur la page Stripe, validation, bascule du domaine

## Tests réalisés (local, mêmes données que Node)
- Réponses identiques Node/PHP : offres, géographie, connexion, notifications, alertes, messagerie complète (création, réponse, notes, attribution, clôture, avis, réouverture), tableau de bord, statistiques, exports, mailing, comptes, offres (cycle complet), demandes.
- Liens compagnies : 60 cas identiques entre JavaScript et PHP (`php/tools/air-parity.mjs`).
- Pack : création → session Stripe → webhook (signature fausse refusée, rejeu sans effet) → reçu PDF → paiement abandonné.
- Interface réelle (Chrome) sur le dossier `dist-php` servi par php-cgi (`php/tools/dev-server.mjs`) : site, connexion et navigation du back-office sans erreur.
- Mode de secours PDO (si l'hébergeur n'a que `pdo_pgsql`).

## Lancer en local
```
node php/tools/build-dist.mjs
node php/tools/dev-server.mjs dist-php 8770     (variables : APP_URL, DEBUG=1, DISABLE_VISIT_JOBS=1, CRON_KEY…)
```
(copier `.env` dans `dist-php/app/` pour le test, puis le supprimer ; `dist-php/` n'est pas versionné)

## Reste à améliorer (non bloquant)
- Messages d'erreur de validation : mêmes codes que zod, textes en anglais pour certains champs (comme la version Node).
- Aperçu du tableau de bord : quelques blocs « voitures / partenaires » à 0 restent visibles.

