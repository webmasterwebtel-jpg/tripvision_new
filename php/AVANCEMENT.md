# Conversion PHP de TripVision — fichier d'avancement

Branche : `php-conversion` (la branche `main` / Render n'est PAS touchée).
Périmètre : vols (affichage + clic vers la compagnie), packs week-end (paiement Stripe + reçu PDF),
comptes clients, alertes prix, back-office, messagerie. Hors périmètre pour l'instant : voitures, espace partenaire.

## Règles de travail
- Aucune dépendance Composer : tout en PHP natif (pas de dossier vendor à envoyer par FTP).
- Même base Supabase, structure inchangée. Jetons JWT et mots de passe compatibles avec la version Node.
- Chaque étape est testée en local contre la version Node (comparaison des réponses) avant d'être cochée.

## Étapes
- [ ] 0. Socle (config, base, routeur, JWT, sécurité, e-mail)
