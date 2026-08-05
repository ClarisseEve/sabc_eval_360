# Pain Points — Flux d'évaluation SABC Eval360
**Auteur** : Sally (UX Designer, BMAD)
**Date** : 2026-05-31
**Méthode** : Exploration automatisée du code source (frontend + backend)

---

## Classification

| Sévérité | Signification |
|----------|---------------|
| 🔴 **CRITIQUE** | Bloque complètement l'utilisateur |
| 🟠 **MAJEUR** | Cause confusion ou perte de données |
| 🟡 **MODÉRÉ** | Friction notable, workaround possible |
| 🔵 **MINEUR** | Amélioration de confort |

---

## Pain Points Backend / Infrastructure

### PP-B1 🔴 CRITIQUE — Tables PostgreSQL non initialisées
- **Symptôme** : L'API retourne des erreurs 500 ("relation does not exist") si la base PG n'est pas initialisée
- **Cause** : Les migrations ALTER (20260409, 20260528) supposent des tables existantes, mais aucune migration CREATE TABLE n'existait
- **Impact** : TOUS les modules (périodes, règles, évaluations, templates) sont non-fonctionnels en environnement neuf
- **Fix** : Migration `20260530_000_init_schema_postgres.sql` créée ✅

### PP-B2 🟠 MAJEUR — Route GET /regles/all interceptée par GET /regles/:id
- **Symptôme** : `GET /api/regles/all` retourne une erreur 404 ("Règle introuvable: all") au lieu de la liste complète
- **Cause** : NestJS résout les routes dans l'ordre de déclaration ; `@Get(':id')` était déclaré avant `@Get('all')`
- **Impact** : L'admin ne peut pas récupérer toutes les règles (liste admin bloquée)
- **Fix** : Ordre corrigé dans `regles.controller.ts` ✅

### PP-B3 🔵 MINEUR — Rappels d'évaluation non envoyés
- **Symptôme** : `POST /evaluations/rappels/:idPeriode` retourne la liste des brouillons sans notifier personne
- **Cause** : `NotificationsService` n'est pas appelé dans cette méthode
- **Impact** : Le bouton "Envoyer des rappels" dans l'UI admin est un faux-positif

---

## Pain Points Frontend / UX

### PP-F1 🔴 CRITIQUE — Pages "Évaluations reçues" et "Évaluations données" toujours vides
- **Symptôme** : Les pages `/evaluations/recues` et `/evaluations/donnees` affichent des listes vides même avec des données
- **Cause** : `localStorage.getItem('access_token')` — clé incorrecte (la bonne est `'sabc_access_token'`) → le token JWT est null → les requêtes retournent 401
- **Impact** : Ces deux pages sont complètement cassées pour tous les utilisateurs
- **Fichiers** : `Recues.tsx:111`, `Donnees.tsx:175`
- **Fix** : Clé corrigée ✅

### PP-F2 🔴 CRITIQUE — Redirection admin vers page 404 après création d'évaluation
- **Symptôme** : Après création via `/admin/evaluations/form`, l'admin atterrit sur la page 404
- **Cause** : `navigate('/common/evaluations/${id}/edit')` — route inexistante (la bonne est `/evaluations/${id}/edit`)
- **Impact** : L'admin ne peut jamais finaliser une évaluation depuis son espace
- **Fichier** : `Form.tsx:114`
- **Fix** : Redirection corrigée ✅

### PP-F3 🟠 MAJEUR — Évaluation rejetée inaccessible depuis la vue détail
- **Symptôme** : Quand une évaluation est rejetée, aucun bouton "Corriger" n'apparaît dans `Show.tsx`
- **Cause** : `canEdit` ne couvrait pas le statut `rejete` côté frontend (alors que le backend autorise bien l'édition)
- **Impact** : L'évaluateur doit naviguer manuellement vers `/evaluations/donnees` pour trouver le bouton
- **Fichier** : `Show.tsx:73-77`
- **Fix** : `canEditRejected` ajouté, bouton "Corriger et resoumettre" affiché ✅

### PP-F4 🟠 MAJEUR — Aucun guidage pour démarrer une évaluation
- **Symptôme** : L'utilisateur connecté ne sait pas comment démarrer une évaluation
- **Cause** : Aucun CTA "Démarrer une évaluation" dans le sidebar ou le dashboard rôle
- **Impact** : Le point d'entrée unique (`/evaluations/mine`) est peu discoverable
- **Recommandation** : Ajouter un bouton proéminent dans le sidebar et/ou le dashboard

### PP-F5 🟡 MODÉRÉ — Sélection de cible en 2 étapes inutilement complexe
- **Symptôme** : L'utilisateur doit cliquer "Sélectionner" puis "Démarrer" pour la même cible
- **Cause** : Architecture de l'état `selectedTarget` qui nécessite une confirmation intermédiaire
- **Recommandation** : Fusionner en un seul bouton "Évaluer" sur chaque ligne de la liste des cibles

### PP-F6 🟡 MODÉRÉ — 5 appels Suspense bloquants au chargement de Mine.tsx
- **Symptôme** : Sur réseau lent, la page `/evaluations/mine` est entièrement bloquée le temps que les 5 requêtes répondent
- **Cause** : `useSuspenseQuery` parallèle pour `list`, `eligibles`, `historique`, `periodesActives`, `regles`
- **Recommandation** : Prioriser `periodesActives` + `eligibles` (bloquants pour l'action), charger `historique` et `regles` en secondaire

### PP-F7 🟡 MODÉRÉ — Fenêtre de modification 72h non communiquée à la soumission
- **Symptôme** : L'utilisateur soumet, puis découvre plus tard qu'il ne peut plus modifier
- **Cause** : La règle 72h n'est jamais annoncée explicitement lors de la soumission
- **Recommandation** : Ajouter un message lors de la soumission : "Vous pouvez encore modifier cette évaluation pendant 72h"

### PP-F8 🟡 MODÉRÉ — Seuil de commentaire invisible avant la saisie
- **Symptôme** : Le badge "Commentaire obligatoire sous note X" n'apparaît qu'après avoir saisi une note insuffisante
- **Recommandation** : Afficher le seuil dès le chargement du formulaire pour chaque critère

### PP-F9 🔵 MINEUR — Rechargement brutal après validation (window.location.reload)
- **Symptôme** : Après validation/rejet d'une évaluation, la page se recharge complètement
- **Cause** : `ValidationModal.tsx` appelle `window.location.reload()` au lieu d'invalider le cache React Query
- **Recommandation** : Utiliser `queryClient.invalidateQueries(['evaluations'])` pour une mise à jour fluide

### PP-F10 🔵 MINEUR — Filtre "Période" en texte libre dans Recues.tsx
- **Symptôme** : Le filtre période demande "Code ou identifiant" — l'utilisateur n'a pas accès à ces codes
- **Recommandation** : Remplacer par un `<Select>` chargé depuis `GET /periodes`

### PP-F11 🔵 MINEUR — Pages de templates non routées
- **Symptôme** : Les fichiers `Templates/Create.tsx`, `Templates/Edit.tsx` existent mais ne sont pas dans le router
- **Impact** : La gestion des templates est inaccessible via navigation directe
