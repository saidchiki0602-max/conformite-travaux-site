# Conformité Travaux — site conformitetravaux.com

Même gabarit « usine à sites » que kaertgroupe.com et travauxsanspiege.fr : **gabarit + données + agents**.

## Où sont les choses
- `src/data/pages/index.json` — tous les textes de l'accueil, **et les prix** (`pourqui.offres`) : les pages Tarifs et les trois pages par public les lisent ici. On change un prix à un seul endroit.
- `src/data/publics.json` — les trois pages par public (`/vendeur/`, `/agence-immobiliere/`, `/notaire/`).
- `src/data/guides.json` — les guides : titre, réponse courte, sections (intertitres en questions), FAQ, textes de référence, dates. **Ajouter un guide = ajouter une entrée ici**, puis dans `seo.json`, `public/sitemap.xml` et `public/llms.txt`.
- `src/data/pieces.mjs` — **le contenu juridique de l'outil** (règles et textes du test). Une règle à corriger se corrige ici et nulle part ailleurs.
- `src/data/questions.json` — les cinq questions du test.
- `src/data/lexique.json` — les termes expliqués au clic sur tout le site, et la page `/lexique/`.
- `src/data/seo.json` — pour chaque page, la requête visée (clé = chemin de la page, ex. `guides/mon-guide`).
- `scripts/audit.mjs` — audit SEO/GEO lancé à chaque déploiement ; **bloque la mise en ligne sur erreur** et génère la page cachée `/audit/`.
- `scripts/audit-live.py` — la grille de contrôle qualité Webenvue (partie automatisable) passée sur le site **en ligne**. Lancée chaque lundi par `.github/workflows/veille.yml`, qui ouvre un ticket s'il y a un critère non validé.
- `scripts/typo-fr.mjs` — typographie française (espaces insécables) appliquée au build.
- `scripts/indexnow.mjs` — prévient Bing (qui alimente ChatGPT et Copilot) après chaque déploiement.

## Commandes
- `npm run check` — build de production + audit, comme GitHub Actions.
- `npm run preview` — aperçu en fichiers plats pour relecture hors ligne.
- `npm run veille -- https://conformitetravaux.com` — contrôle du site en ligne.

## Mise en ligne (une fois)
1. Acheter `conformitetravaux.com`. DNS : 4 enregistrements A vers 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, et un CNAME `www` vers `saidchiki0602-max.github.io`.
2. Créer le dépôt GitHub `conformite-travaux-site` (vide), pousser ce dossier sur `main`.
3. Settings › Pages › Source : GitHub Actions. Domaine personnalisé : `conformitetravaux.com`, cocher « Enforce HTTPS ».
4. Secrets du dépôt (Settings › Secrets and variables › Actions), tous facultatifs — le site se publie sans :
   - `PUBLIC_FORM_ENDPOINT` et `PUBLIC_SUPABASE_ANON` : enregistrement des formulaires. Sans eux, les formulaires proposent un e-mail prérempli.
   - `PUBLIC_GSC_TOKEN` : code de la balise HTML de la Search Console.
   - `PUBLIC_CF_ANALYTICS_TOKEN` : mesure d'audience sans cookie (Cloudflare Web Analytics).
5. Search Console : ajouter la propriété, valider, soumettre `sitemap.xml`. Bing Webmaster Tools : « Importer depuis Google Search Console ».

## Règles du gabarit
1. Chaque page répond à la question principale dans ses deux premières lignes (bloc « La réponse courte »).
2. Intertitres des guides formulés comme les questions qu'on tape. FAQ balisée sur chaque page.
3. Titres ≤ 60 caractères, descriptions 120 à 160, un seul h1, aucun saut de niveau, canonical, sitemap et llms.txt complets.
4. **Aucun chiffre sans source.** Les règles de droit citent leur texte ; elles sont à faire relire par un professionnel avant publication.
5. Pas d'auteur nommé : l'auteur déclaré est Kaërt Groupe. Pas d'adresse dans le pied de page : « Bretagne ».
6. Kaërt ne fait aucune démarche à la place des utilisateurs : le site ne promet que ce que le logiciel fait seul.
