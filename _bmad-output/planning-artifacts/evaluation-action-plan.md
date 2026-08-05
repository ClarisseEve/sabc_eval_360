# Plan d'action — Refonte du flux d'évaluation SABC Eval360
**Auteur** : Sally (UX Designer, BMAD) + Investigation automatisée
**Date** : 2026-05-31
**Objectif** : Rendre le processus d'évaluation compréhensible, fluide et sans blocage

---

## Résumé exécutif

L'application est fonctionnelle côté backend (tous les endpoints P0 sont implémentés), mais elle souffre de **3 niveaux de problèmes** :

1. **Infrastructure** : La base PostgreSQL n'avait pas de schema initial → tout pouvait échouer silencieusement
2. **Bugs frontend** : 3 bugs critiques rendaient des pages entièrement inutilisables (401 silencieux, 404, bouton manquant)
3. **UX** : Le parcours utilisateur n'est pas guidé — l'utilisateur doit deviner comment démarrer

---

## Corrections déjà appliquées ✅

| ID | Description | Statut |
|----|-------------|--------|
| PP-B1 | Migration PostgreSQL initiale (CREATE TABLE) | ✅ Créé |
| PP-B2 | Route GET /regles/all avant /regles/:id | ✅ Corrigé |
| PP-F1 | Clé localStorage erronée (Recues + Donnees) | ✅ Corrigé |
| PP-F2 | Redirection Form.tsx vers route inexistante | ✅ Corrigé |
| PP-F3 | Évaluation rejetée inaccessible dans Show.tsx | ✅ Corrigé |

---

## Phase 1 — Guidage utilisateur (Priorité haute)

**Objectif** : Tout utilisateur doit pouvoir démarrer une évaluation sans formation préalable.

### 1.1 Bouton "Démarrer une évaluation" dans le sidebar
- Ajouter un lien direct `/evaluations/mine` en position proéminente dans le sidebar (juste sous le logo)
- Pour les rôles évaluateurs, afficher un badge numérique si des évaluations sont en attente

### 1.2 Page hub `/evaluations` repensée
- Actuellement : liste de liens vers 5 sous-pages
- Cible : Tableau de bord personnel avec :
  - Statut de la période active (ouverte / fermée / aucune)
  - Progression : "X évaluations à compléter, Y validées"
  - Bouton principal "Démarrer / Reprendre" selon l'état
  - Liste compacte des évaluations en cours

### 1.3 Flux admin guidé — "Préparer une campagne"
- Nouvelle page ou modal wizard en 3 étapes :
  1. **Règles** : "Vérifiez qu'au moins une règle est active" (avec raccourci vers la création)
  2. **Période** : "Créez et ouvrez une période" (avec le formulaire inline)
  3. **Lancement** : "La campagne est prête — notifiez les évaluateurs"
- Remplacer "Basculer" par "Ouvrir la période" / "Fermer la période" pour la clarté

---

## Phase 2 — Simplification du flux de création (Priorité haute)

### 2.1 Réduction de la sélection 2 étapes → 1 étape
- **Actuel** : Sélectionner → Démarrer (2 boutons distincts)
- **Cible** : 1 seul bouton "Évaluer" sur chaque ligne de cible
  - Clic → ouvre directement le modal avec la cible pré-sélectionnée
  - Si une seule règle applicable → présélectionner automatiquement
  - Si plusieurs règles → afficher le choix dans le modal

### 2.2 Explication inline quand "Démarrer" est désactivé
- Si désactivé car "pas de période" → lien vers `/admin/evaluations/periodes`
- Si désactivé car "pas de règle" → message explicatif à côté du bouton désactivé (pas seulement dans un panneau latéral)

### 2.3 Message post-soumission avec fenêtre de modification
- Après `POST /evaluations/:id/submit` (succès) : afficher une alerte informative :
  > "Évaluation soumise. Vous pouvez encore la modifier pendant **72 heures** si nécessaire."

---

## Phase 3 — Qualité des données affichées (Priorité moyenne)

### 3.1 Filtre période → Select dynamique (PP-F10)
- `Recues.tsx` : remplacer l'input texte par un `<Select>` chargé depuis `GET /periodes`
- Idem pour `Donnees.tsx`

### 3.2 Affichage du seuil de commentaire avant saisie (PP-F8)
- Dans `Edit.tsx` : pour chaque critère avec `commentaire_requis_si_note_lt > 0`, afficher :
  > ℹ️ "Un commentaire sera requis si votre note est inférieure à X/5"

### 3.3 Invalidation de cache après validation (PP-F9)
- `ValidationModal.tsx` : remplacer `window.location.reload()` par `queryClient.invalidateQueries`

### 3.4 Notifications managers (PP temps réel)
- Brancher `notificationsApi.count` sur les évaluations `a_valider` pour afficher un badge dans le sidebar

---

## Phase 4 — Fonctionnalités manquantes (Priorité basse)

### 4.1 Page historique dédiée
- `/evaluations/historique` : liste paginée avec filtres (statut, période, type)
- Actuellement : widget limité à 12 entrées dans Mine.tsx

### 4.2 Templates routés et fonctionnels
- Enregistrer les routes `Templates/Create.tsx` et `Templates/Edit.tsx` dans `app.tsx`
- Créer une UI de visualisation des critères du template

### 4.3 Rappels réels (PP-B3)
- Implémenter l'envoi de notifications dans `POST /evaluations/rappels/:idPeriode`
- Brancher le `NotificationsService`

---

## Métriques de succès

| Métrique | Avant | Cible |
|----------|-------|-------|
| Temps pour créer une 1ère évaluation (admin neuf) | >15 min (si possible) | <3 min |
| Pages cassées (401 silencieux) | 2 (Recues, Donnees) | 0 |
| Clics pour démarrer une évaluation | 3-4 | 1-2 |
| Utilisateurs bloqués sans message d'erreur contextuel | Fréquent | 0 |

---

## Dépendances techniques

- La migration `20260530_000_init_schema_postgres.sql` **doit être exécutée** avant tout démarrage de l'API sur un environnement neuf
- Le seed `prisma/seed.ts` **doit être exécuté après** la migration PostgreSQL
- Les corrections de bugs (PP-F1, PP-F2, PP-F3) sont déjà appliquées dans le code
