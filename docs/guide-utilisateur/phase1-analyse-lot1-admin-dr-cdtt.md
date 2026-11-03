# Phase 1 — Analyse du code · Lot 1 : ADMIN · DR · CDTT

> Document de travail pour la rédaction du guide d'utilisation. Source : code du
> dépôt (le code fait foi sur `docs/`). Les points marqués **[À VÉRIFIER]** sont
> à confirmer avant la rédaction.

## 1. Lancer l'application en local

| Étape | Commande / valeur |
|---|---|
| Configuration | `cp .env.example .env`, puis remplacer toutes les valeurs `CHANGE_ME` |
| Variables obligatoires | `JWT_SECRET` (≥ 32 caractères), `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `DATABASE_URL_DOCKER`, `PG_PASSWORD`, `SEED_PASSWORD` |
| Démarrage | `docker compose up --build` (depuis la racine) |
| Services | `frontend` (nginx), `api` (NestJS), `mysql` 8.0, `postgres` 16, `redis` 7 |
| Ports hôte | frontend `5173` (`WEB_PORT`), API `3000` (`API_PORT`), MySQL `3306`, PostgreSQL `5432`, Redis `6379` |
| URL de connexion | <http://localhost:5173/login> |
| Base de données | migrations puis seed appliqués automatiquement par l'entrypoint de l'API (`SEED_MODE=if-empty` par défaut) |

- La page de connexion affiche un encadré **« Comptes de démonstration (dev) »** avec 4 comptes cliquables (Admin, DR Littoral, CDS Littoral, TMO Littoral), sauf si `VITE_SHOW_DEMO_ACCOUNTS=false` au build. Pour les captures du guide, il faudra le **masquer** (sinon il apparaît dans chaque capture de connexion).
- **[À VÉRIFIER]** `docker-compose.yml` donne à `SEED_PASSWORD` une valeur par défaut `12345`, alors que `docs/comptes-de-test.md` affirme que le seed refuse de s'exécuter sans la variable. Sans `.env` renseigné, les comptes auraient donc ce mot de passe faible.

## 2. Droits des rôles du lot

Sources : `apps/web/src/config/rbac.ts`, `apps/web/src/config/nav.tsx`, guards `@Roles` des contrôleurs NestJS, `validation-manager.service.ts`.

### ADMIN (`A0001` / `admin@sabc.local`)
- **Voit** : tout. Toutes les routes `/admin/*` sont protégées côté frontend (`AuthGuard requiredRoles=['ADMIN']`) et côté API (`@Roles('ADMIN')`).
- **Fait** :
  - gère les utilisateurs, les rôles et la structure (régions, services, districts, secteurs) ;
  - gère les périodes d'évaluation, les règles d'évaluation, les modèles (templates) et les fiches de notation ;
  - gère les remplacements temporaires (**réservés à l'ADMIN**, aucun autre rôle n'a d'écran) ;
  - pilote les évaluations (gestion globale, historique, création d'une évaluation pour le compte d'un évaluateur) ;
  - consulte les analytics 360° (régions, rôles, anomalies, recherche individuelle, plans d'amélioration, tendances) ;
  - construit des rapports et les exporte en PowerPoint (.pptx) ou Word (.docx).
- Les règles « même région » et « même branche » ne s'appliquent pas à l'ADMIN (`isAdminEvaluator`). Il ne peut pas s'auto-évaluer (`canSelfEvaluate: false`).

### DR — Directeur régional (`D1010`, « DR Littoral »)
- **Voit** : son tableau de bord « Directeur Régional » (périmètre régional), le menu Évaluations, « Mon équipe » (seulement si l'API lui renvoie des subordonnés directs) et « Axes d'amélioration ». Aucun menu d'administration ni d'analytics.
- **Fait** :
  - évalue ses subordonnés (`canEvaluateSubs`) ; pas d'auto-évaluation, pas d'évaluation de pairs ; peut évaluer hors de sa branche (`canCrossBranch`) ;
  - **valide ou renvoie** les évaluations soumises : celles de ses subordonnés directs **et toutes celles des collaborateurs de sa région** (règle `verifierDRCDTT`) ;
  - exporte son tableau de bord (PNG, JPEG, PDF ; Excel/CSV selon les données) ;
  - télécharge ses fiches de notation en PDF.

### CDTT — Chef de département trade (`X0002`)
- Mêmes droits que le DR : même composant de tableau de bord (`RoleDirectorDashboardPage`) et même portée régionale de validation.
- **En plus** : une bascule **Tous / Commercial / Marketing / Sponsoring** filtre le tableau des collaborateurs par domaine (`enableDomaineToggle`).
- Le titre du tableau de bord est « Tableau de bord Chef Département Trade », avec le périmètre « Périmètre Trade ».
- **[À VÉRIFIER]** `rbac.ts` rattache le CDTT à la branche **marketing**, alors que `docs/comptes-de-test.md` le décrit comme basculant « entre commercial et marketing ».

## 3. Écrans atteignables

### Écrans publics

| URL | Contenu | Actions / champs | Messages |
|---|---|---|---|
| `/login` | Connexion | **Matricule ou Email** (obligatoire, ex. « A0001 ou utilisateur@sabc.local »), **Mot de passe** (obligatoire, bouton afficher/masquer), lien « Mot de passe oublié ? », bouton **Se connecter** | « Identifiants incorrects. » (401) · « Erreur de connexion. » · « Connexion en cours... » · pied de page « Besoin d'un accès ? Contactez votre administrateur. » |
| `/forgot-password` | Information seulement : **aucune réinitialisation en ligne** | Aucun champ | « contacter le service informatique interne … poste 1234 … support@sabc.cm … +237 233 42 75 00 » **[À VÉRIFIER : coordonnées réelles ou fictives ?]** |
| `/register` | Information seulement : pas d'inscription en ligne | Aucun champ | « Pour obtenir un accès, contactez votre manager ou l'équipe IT. » |

Après connexion, l'utilisateur est redirigé vers `/admin/dashboard` (ADMIN) ou `/<rôle>/dashboard`.

### Écrans communs à tous les rôles connectés (ADMIN, DR, CDTT inclus)

| URL | Menu | Contenu / actions | Règles et messages clés |
|---|---|---|---|
| `/evaluations/mine` | Évaluations › Mes évaluations | « Démarrer ou reprendre vos évaluations » : période active, cibles éligibles (paginées), règles actives, historique | Démarrage bloqué si aucune période ouverte (« Aucune campagne d'évaluation n'est ouverte pour l'instant. Contactez l'administrateur… ») · « Aucune règle active publiée pour votre rôle. » · « Aucune cible disponible » |
| `/evaluations/pending` | Évaluations › À compléter | « Vos évaluations à compléter » : brouillons à reprendre, retours à corriger | « Tout est à jour » |
| `/evaluations/:id/edit` | (depuis les listes) | Fiche de notation : chaque critère noté de 1 à 5 (ou « Non noté »), commentaire par critère, synthèse générale, progression en %, boutons **Enregistrer le brouillon** et **Soumettre l'évaluation** | Commentaire obligatoire si la note est inférieure au seuil du critère (3 par défaut) : « Un commentaire est obligatoire pour une note inférieure à 3. » · « Prêt à soumettre ? » · « Votre évaluation a été soumise pour validation. » · « Votre évaluation a été enregistrée en brouillon. » · mode hors ligne : brouillon gardé sur l'appareil, soumission impossible · « La période est fermée » |
| `/evaluations/validate` | Évaluations › À valider (si l'utilisateur a des validations) | « Évaluations à valider » : en attente, en retard (> 3 jours) ; ouvre la fenêtre **Validation de l'évaluation** | Valider : commentaire général **obligatoire** (« Un commentaire général est obligatoire pour valider une évaluation. ») · Renvoyer en brouillon : motif obligatoire de **20 à 1000 caractères** · boutons « Confirmer la validation » / « Renvoyer en brouillon » |
| `/evaluations/:id` | (depuis les listes) | Détail : évaluateur, évalué, note globale, critères, dates ; bouton « Continuer la saisie » ou « Corriger et resoumettre » selon le statut | Brouillon · « Évaluation transmise pour validation » · « validée et visible par la personne évaluée » · « Des ajustements sont nécessaires suite au rejet » |
| `/evaluations/historique` | Évaluations › Historique | Historique filtrable par statut et par période | — |
| `/evaluations/recues`, `/evaluations/donnees` | (liens internes) | Évaluations reçues et données, avec le motif de rejet le cas échéant | — |
| `/evaluations/fiches` | Évaluations › Mes fiches de notation | Fiches de notation de l'utilisateur, téléchargement PDF (`GET /rating-sheets/:id/pdf`) | — |
| `/equipe/subordonnes`, `/equipe/evaluations` | Mon équipe (DR, CDTT… si subordonnés directs) | Vue équipe et évaluations de l'équipe | — |
| `/axes-amelioration` | Axes d'amélioration | Axes faibles et recommandations | — |
| `/settings/profile`, `/settings/password`, `/settings/appearance` | Paramètres | Profil, changement de mot de passe, apparence (thème) | **[À VÉRIFIER]** règles de mot de passe (lot suivant) |

**Statuts d'une évaluation** : `brouillon` → `soumis` → `valide` ou `rejete` (« renvoyée en brouillon », qu'on corrige puis resoumet). Types : auto-évaluation, descendante, ascendante, par pairs.

### Tableaux de bord DR et CDTT (`/dr/dashboard`, `/cdtt/dashboard`)
- **Indicateurs** : Évaluations données · Validations en attente · Périmètre direct · Couverture globale (avec score moyen /5, ou « Aucun score consolidé »).
- **Cartes** : Performance par rôle · Répartition par niveau hiérarchique · Chaîne hiérarchique · Axes dominants du périmètre · Évaluations récemment données · Tableau du périmètre (avec la bascule de domaine pour le CDTT) · **Validations à arbitrer** (bouton « Examiner ») · Règles actives.
- **Accès rapides** : À valider (n), Axes d'amélioration, Évaluations en attente, Démarrer une évaluation, Vue équipe, Évaluations équipe.
- **Exporter** : tableau de bord en image (.png, .jpeg) ou en PDF ; données brutes en Excel (.xlsx) ou CSV si disponibles.
- Les anciennes sous-pages `/dr/teams`, `/dr/performance`, `/cdtt/commercial` et `/cdtt/marketing` redirigent vers le tableau de bord : **ne pas les documenter**.

### Écrans ADMIN

| URL | Menu | Contenu / champs principaux | Messages |
|---|---|---|---|
| `/admin/dashboard` | Tableau de bord | Indicateurs clés et accès rapides (Gestion des évaluations, Périodes, Règles, Utilisateurs, Analytics 360°, Rapports) | — |
| `/admin/utilisateurs` | Utilisateurs › Liste | « Gestion des utilisateurs » : recherche (matricule, nom, e-mail, rôle), filtres Rôle / Région / Statut / Manager, tri, pagination, création et modification | — |
| `/admin/utilisateurs/create` | (bouton) | Matricule (ex. A0001), Nom, Prénom, Adresse e-mail (prenom.nom@sabc.local), Téléphone, Mot de passe, Rôle, Région, Manager (matricule) | « Utilisateur créé. » · **[À VÉRIFIER]** champs obligatoires et règles DTO |
| `/admin/utilisateurs/:matricule` (+ `/edit`) | (depuis la liste) | Fiche, subordonnés, historique, chaîne hiérarchique ; modification | — |
| `/admin/utilisateurs/gaps` | Utilisateurs › Gaps d'évaluation | « Gaps d'évaluation par profil » (radar, tableau détaillé, recherche) | « Aucun gap d'évaluation » · « Impossible de charger les gaps d'évaluation » (bouton Réessayer) |
| `/admin/evaluations/management` | Évaluations › Gestion globale | « Pilotage global des évaluations » | « Aucune période » |
| `/admin/evaluations/form` | (depuis Gestion globale) | « Créer une évaluation » : collaborateur, période, règle | « Impossible de créer une évaluation » |
| `/admin/evaluations/history`, `/admin/evaluations/:id` | (liens internes) | Historique global et détail d'une évaluation | — |
| `/admin/evaluations/periodes` | Évaluations › Périodes | « Périodes d'évaluation » : création et modification (nom ex. « Cycle 2026 - Semestre 2 », code ex. « P2602 », description optionnelle), recherche ; API : ouvrir, fermer, basculer, supprimer | **[À VÉRIFIER]** dates et messages (lecture détaillée à faire) |
| `/admin/evaluations/fiches` | Évaluations › Fiches de notation | Configuration par période et par rôle : calcul de la note générale, cibles éligibles, publication | « La configuration de la fiche a été enregistrée. » |
| `/admin/evaluations/regles` (+ `/create`, `/:id/edit`) | Évaluations › Règles | Nom de la règle*, Description, Rôle évaluateur*, Rôle évalué*, Type d'évaluation*, Niveau de détail, Règle active, Même région obligatoire, Même branche obligatoire, Visibilité (évalué, manager N+1, niveaux supérieurs, admin) | Erreurs serveur : « Cette règle impose une évaluation dans la même région / branche » |
| `/admin/evaluations/templates` (+ `/create`, `/:id`, `/:id/edit`) | Évaluations › Modèles | Titre du template, Version (ex. 1.0), Description, Template actif ; sections et compétences : libellé, catégorie, description, poids (%), compétence obligatoire ; publier / dépublier, assigner à un rôle et une période | « Template créé. » |
| `/admin/remplacements` (+ `/create`, `/:id`, `/:id/edit`) | Remplacements | Titulaire, Remplaçant, Service de remplacement, Date de début, Date de fin, Durée prévue, Motif ; listes actifs / à venir / historique ; terminer un remplacement | « Remplacement créé. » |
| `/admin/roles` (+ `/create`, `/:id`) | Rôles › Gestion des rôles | Code rôle, Nom du rôle, Branche, Niveau / Mode hiérarchique, Description ; recherche, suppression | « Rôle créé. » · « Rôle supprimé. » |
| `/admin/structure/regions`, `/services`, `/districts`, `/secteurs` | Structure | Gestion des régions (nom, type, code attribué automatiquement), services, districts et secteurs | « Région supprimée. » (même logique pour les autres niveaux) |
| `/admin/analytics?tab=…` | Analytics | « Analytics 360° » : Analyse régionale, Analyse par rôle, Anomalies & alertes (lancer une détection, acquitter), Recherche individuelle, Plans d'amélioration (valider / rejeter des recommandations), Tendances | — |
| `/admin/reports` (+ `/:id/edit`) | Rapports | Liste et création (titre ex. « Synthèse annuelle 2026 ») ; constructeur par sections (Synthèse exécutive, KPIs globaux, Top 10 meilleurs performers, Matrice et radar des compétences, compétences faibles par région / district / métier, Recommandations & actions, Texte libre…), prévisualisation, export **PowerPoint** et **Word** | « Rapport supprimé. » |

## 4. Parcours de bout en bout (lot 1)

1. **Se connecter / se déconnecter** (tous) : `/login` → tableau de bord du rôle. Mot de passe oublié : il faut contacter le service informatique, aucune réinitialisation en ligne.
2. **Préparer une campagne** (ADMIN) : créer la période → créer ou vérifier les règles (évaluateur → évalué) → créer et publier le modèle → configurer et publier la fiche de notation par rôle → ouvrir la période.
3. **Évaluer un subordonné** (DR, CDTT, ADMIN) : Mes évaluations → choisir une cible éligible et une règle → remplir la fiche (notes 1-5 et commentaires) → Enregistrer le brouillon → Soumettre.
4. **Valider ou renvoyer une évaluation** (DR, CDTT : subordonnés directs et toute leur région) : tableau de bord « Validations à arbitrer » ou menu À valider → Examiner → commentaire obligatoire → Confirmer la validation, **ou** motif de 20 caractères minimum → Renvoyer en brouillon.
5. **Corriger une évaluation renvoyée** (évaluateur) : À compléter › Retours à corriger → Corriger et resoumettre.
6. **Piloter son périmètre** (DR, CDTT) : lecture des indicateurs, bascule de domaine (CDTT), export PDF du tableau de bord.
7. **Gérer un utilisateur** (ADMIN) : créer → affecter rôle, région et manager → modifier ou désactiver.
8. **Déclarer et terminer un remplacement temporaire** (ADMIN uniquement).
9. **Analyser et produire un rapport** (ADMIN) : Analytics 360° → Rapports → ajouter des sections → exporter en PPTX ou DOCX.

## 5. Écarts code ↔ prompt à signaler

| Sujet | Constat |
|---|---|
| **Contre-évaluation** | API seulement (`POST /evaluations/:id/contre-evaluation`, réservée au validateur ou au manager direct, sur une évaluation validée). **Aucun écran** ne l'appelle → ne pas la documenter comme une action utilisateur. |
| **Rappels de période** | `POST /evaluations/rappels/:idPeriode` (ADMIN) existe dans l'API, mais **aucun écran** ne l'appelle. |
| **Rapport de période** | `GET /evaluations/rapport/:idPeriode` : API sans écran. |
| **Notifications groupées** | `POST /notifications/send-bulk` (ADMIN) : API sans écran. |
| **Export Excel des rapports** | `GET /reports/:id/export/xlsx` existe, mais le constructeur ne propose que PowerPoint et Word. |
| **Mot de passe oublié / inscription** | Pages purement informatives : aucune action en ligne. |
| **Remplacements** | Réservés à l'ADMIN : le parcours « déclarer un remplacement » n'existe que dans sa partie du guide. |

## 6. Proposition de plan du guide (provisoire, à compléter avec les lots 2 à 4)

1. Page de titre, sommaire
2. Introduction : l'évaluation 360° à la SABC, le cycle d'une période, tableau « Quel est mon rôle ? »
3. Premiers pas : connexion (matricule ou e-mail), mot de passe oublié (contact IT), interface (menu latéral, en-tête, notifications), paramètres (profil, mot de passe, apparence)
4. **Tâches communes à tous** (décrites une seule fois) : démarrer une évaluation, remplir et soumettre une fiche, reprendre un brouillon, corriger une évaluation renvoyée, consulter l'historique et ses fiches PDF, consulter ses axes d'amélioration
5. **Valider les évaluations** (tous les rôles qui ont une file « À valider ») : examiner, valider, renvoyer
6. **Partie Direction — DR et CDTT** : tableau de bord directeur, périmètre régional, bascule de domaine (CDTT), arbitrage des validations, export du tableau de bord
7. Partie Encadrement — CSC, CDV, CDS, RTM, SRMO, SS *(lot 2-4)*
8. Partie Collaborateurs — TMO, AS… *(lot 3-4)*
9. **Partie Administrateur** : préparer une campagne (périodes, règles, modèles, fiches), gérer les utilisateurs, les rôles et la structure, gérer les remplacements, piloter les évaluations, Analytics 360°, rapports
10. FAQ et problèmes fréquents
11. Glossaire
