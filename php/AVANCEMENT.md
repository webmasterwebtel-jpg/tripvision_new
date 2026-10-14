# Conversion PHP de TripVision — fichier d'avancement

Branche : `php-conversion` (la branche `main` / Render n'est PAS touchée).
Périmètre : vols (affichage + clic vers la compagnie), packs week-end (paiement Stripe + reçu PDF),
comptes clients, alertes prix, back-office, messagerie. Hors périmètre pour l'instant : voitures, espace partenaire.

## Règles de travail
- Aucune dépendance Composer : tout en PHP natif (pas de dossier vendor à envoyer par FTP).
- Même base Supabase, structure inchangée. Jetons JWT et mots de passe compatibles avec la version Node.
- Chaque étape est testée en local contre la version Node (comparaison des réponses) avant d'être cochée.

## Étapes
- [x] 0. Socle (config, base, routeur, JWT, sécurité, e-mail) — testé : connexion, jetons croisés Node↔PHP, mots de passe bcrypt
- [x] A. Public : config, offres, géographie, contact, newsletter, demandes, e-mail des vols, suivi des visites, tendances publiques, désinscription, images
- [ ] B. Client : tableau de bord, alertes prix, notifications/pastilles, messagerie client, annulation de demande, reçus PDF
- [ ] C. Packs week-end : paiement Stripe (session, annulation, webhook), remboursement, reçu PDF
- [ ] D. Back-office : tableau de bord, offres (création/statut/lien/planification/brouillons), demandes, messagerie, stats + exports, mailing, comptes, clients, journal, connexions
- [ ] E. Tâches planifiées (CRON) : alertes prix, renouvellement des brouillons, fraîcheur, clôture auto des conversations, paiements expirés
- [ ] F. Mise en ligne : .htaccess, .env.example, script de build « dist », guide de déploiement FTP

## Lancer en local
php -S 127.0.0.1:8765 php/dev-router.php   (depuis la racine du projet ; Node sur 3000 pour comparer)

