# Sécurité et référencement — TripVision (version PHP)

Contrôle automatique (site local ou en ligne) : `node php/tools/security-check.mjs https://www.tripvision.fr` — doit afficher « Tout est conforme ».

## Déjà en place
- **En-têtes** : CSP stricte, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP, HSTS (dès que le site est en HTTPS).
- **Fichiers protégés** (`.htaccess`) : dossier `app/` (code, `.env`), fichiers cachés (`.git`, `.env`, `.user.ini`), tout `.php` sauf `api.php`, `.md`, `.log`, `.sql`, `.bak`. `.well-known/security.txt` publié.
- **API** : requêtes SQL toutes paramétrées, CORS fermé par défaut (`CORS_ORIGIN` vide), limites de tentatives de connexion, jetons signés, mots de passe en bcrypt, contrôle des fichiers importés (octets d'en-tête JPG/PNG/WebP/PDF), validation des entrées (400, jamais 500).
- **Espaces privés** (`/backoffice`, `/espace`, `/activation`, `/api`, `/uploads`) : `noindex` (balise + en-tête `X-Robots-Tag`) et `Disallow` dans `robots.txt`.
- **Polices** : Cormorant Garamond et Inter hébergées sur le site (`assets/fonts/`, aucune requête vers Google).
- **Sessions** : équipe du back-office = connexion de 8 h au plus et déconnexion après 15 min d'inactivité (côté serveur) ; clients = 7 jours.
- **Anti-robots** : formulaire de contact avec champ piège et délai minimum de 3 s (les envois trop rapides sont ignorés sans erreur).
- **Cookies** : mur de consentement bloquant, statistiques uniquement après accord.

## Référencement
- Adresses propres : `/vols`, `/contact`, `/mentions-legales`, `/politique-de-confidentialite`, `/destination/<ville>` (55 destinations), chacune avec titre, description, adresse canonique, balises de partage (Facebook/WhatsApp/X, image 1200×630) et données structurées (Organization, WebSite, TouristDestination, BreadcrumbList).
- `/sitemap.xml` et `/robots.txt` générés à partir de `APP_URL`.
- `/voitures` et `/week-ends` : `noindex` et hors plan du site tant qu'ils sont « Bientôt disponible ». **Au lancement** : retirer l'adresse de `SEO_SOON` dans `php/src/routes_seo.php`.
- Pour changer le titre ou la description d'une page : `SEO_PAGES` dans `php/src/routes_seo.php`.

## À faire le jour de la mise en ligne
1. `APP_URL=https://www.tripvision.fr` dans `app/.env` (sans « / » final), `CORS_ORIGIN` vide.
2. Activer le certificat HTTPS chez Nuxit, puis décommenter les 3 lignes « HTTPS uniquement » du `.htaccess`.
3. `JWT_SECRET` long et aléatoire (le même que sur Render tant que les deux tournent), `CRON_KEY` défini, clés Stripe **live** + webhook.
4. Lancer le contrôle ci-dessus ; vérifier `/app/.env` → 403.
5. Google Search Console et Bing Webmaster Tools : ajouter le domaine, envoyer `https://www.tripvision.fr/sitemap.xml`.
6. Changer le mot de passe du compte administrateur initial.

## Limites connues (décisions à prendre)
- Mentions légales : l'hébergeur (Nuxit) est renseigné ; l'identité de l'éditeur TripVision (forme juridique, adresse, immatriculation, directeur de publication) reste à compléter.
- Pas de double authentification pour les comptes du back-office (recommandée, chantier à part).
- Le site reste une application à une seule page ; les moteurs voient le contenu après exécution du JavaScript (Google le fait). Le HTML initial contient titre, description et liens.

