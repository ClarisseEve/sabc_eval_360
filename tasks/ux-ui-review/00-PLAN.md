<!-- Généré par le party mode UX/UI (workflow wf_fc54d4b9-4c1, 19 experts).
     6 reviewers ont échoué (Auth/Erreurs, Admin Dashboard&Analytics, Admin Évaluations-core,
     Règles&Templates, Profil/Réglages, axe Navigation) — comblés via le workflow correctif. -->

# Plan d'action design consolidé — SABC Eval360

## 1. Verdict exécutif

**Note globale synthétisée : 44/100** (zone « fonctionnel mais trop simple » — précisément le reproche client). Les sous-notes confirment une app à plusieurs vitesses : socle de composants et dashboards de rôle parfois proches de la cible (Button, Card, Sidebar, MetricCard, RoleDashboardShared), mais un système immature et incohérent au-dessus.

**Forces réelles**
- **Briques individuelles soignées** : Button (CVA, loading, focus-ring), Card multi-variants, Sidebar data-driven RBAC avec collapse animé et active-state propre — niveau « recherché ».
- **Socle dashboard industrialisé** : les 10 dashboards de rôle délèguent à 3 archétypes partagés (Director/Manager/Individual) via `DashboardPageFrame` + `MetricCard` + skeletons — la preuve que l'équipe sait atteindre la cible.
- **Typographie fluide bien calibrée** (clamp, letter-spacing) et palette de marque SABC existante.
- **Quelques pages premium isolées** : `Evaluations/Show.tsx`, `Edit.tsx` (auto-save offline, jauges, pills) montrent la densité attendue.

**Faiblesses majeures**
- **Double système de tokens non réconcilié** : `--sabc-*` (hex) vs shadcn oklch où `--primary` est **noir**, et surtout **rouge de marque == rouge d'erreur** (`#E53E3E` = `--sabc-error` = `--sabc-red-primary`). La hiérarchie d'action et le sens sémantique s'effondrent. Dark mode rattrapé au `!important` + `text-shadow`.
- **Feedback cassé** : dossier `UI/Toast` **vide**, aucun `<Toaster>` monté ; ~12 pages admin notifient via `window.alert()`/`confirm()` natifs ; exports/mutations silencieux.
- **Composants riches non adoptés** : `DataTable` = **0 importeur** alors que 41 pages câblent la `Table` brute (sans tri/filtre/densité/sticky/hover) ; `MetricCard` 7 usages vs 51 stat-cards inline ; pas d'`EmptyState` réutilisable ; navigation `window.location.href` (full reload) qui casse l'esprit SPA.
- **Trois tiers de maturité cohabitent** dans la même nav : production data-driven / maquettes figées à données factices (KPI `text-5xl`, graphes « à implémenter ») / coquilles vides (« Contenu à implémenter » en prod : TMO, SS, RTM, SRMO, AS). Accessibilité non conforme WCAG AA (contraste gris secondaire ~2.6:1, scaling texte no-op, ARIA 16/248 fichiers).

---

## 2. Langage de design cible (résumé opérationnel)

- **Structure ClickUp/Linear** : sidebar 240–280px groupée/labellisée, active = accent + indicateur ; **header contextuel** par vue (titre + breadcrumb + filtres + 1 action primaire à droite) ; vues riches (table/cartes/board/graphes) avec sélecteur de vue.
- **Accent rouge discipliné** : rouge SABC = action primaire / état actif / critique **uniquement**. Tout le reste en neutres froids. Statuts en pills sémantiques (succès=vert, soumis=bleu, retard=ambre, brouillon=gris) **distinctes du rouge de marque**.
- **Échelles strictes** : espacement **8px** (4/8/12/16/24/32) ; rayons **~8/6/4px** (carte/contrôle/pill) ; élévation tokenisée e0→e4 (ombres légères diffuses) ; transitions **120–200ms**.
- **Composants « recherchés mais efficaces »** : cards à niveaux (titre/méta/état/action + avatar) ; tables avec tri/filtre/densité réglable/sticky/actions au hover/sélection ; **empty states illustrés + CTA** (premier-usage / sans-résultat / erreur) ; **skeletons structurels** >500ms ; **toasts** non bloquants sémantiques ~5s ; avatars à couleur déterministe ; tooltips accessibles.
- **Cohérence inter-écrans** : mêmes composants = même rendu partout. Cap **5–7 KPI** au-dessus de la ligne de flottaison.

---

## 3. Diagnostic de cohérence transverse (incohérences les plus coûteuses, dédupliquées)

| # | Incohérence systémique | Constatée par | Coût |
|---|---|---|---|
| C1 | **Rouge marque = rouge erreur** (`#E53E3E`) + **double couche de tokens** (`--sabc-*` hex vs shadcn oklch `--primary` noir) ; 67 hex `#E53E3E` codés en dur dans 43 fichiers | Brand, DS, A11y, État DS | Détruit hiérarchie d'action + sémantique ; rebranding/dark ingérables |
| C2 | **Aucun système de Toast monté** ; `UI/Toast` vide ; **12 fichiers** en `alert()`/`confirm()` natifs ; mutations/exports silencieux | Interaction, DS, Reports, Rôles, Utilisateurs | Utilisateur doute du succès ; rupture totale du langage visuel |
| C3 | **`DataTable` 0 importeur** vs **41 tables brutes** anémiques (pas de tri/filtre/densité/sticky/hover/skeleton) | DS, Cohérence, Utilisateurs, Rôles, Dashboards | « Table anémique » sur tout l'usage RH intensif |
| C4 | **Pas de PageHeader/PageContainer partagé** : 3 échelles de titre (`text-xl semibold` / `text-2xl bold` / `text-2xl semibold`), espacements divergents | Cohérence | Deux produits perçus en passant d'un écran à l'autre |
| C5 | **Dark mode 10/122 pages** : toute la section Admin casse en sombre ; rattrapage `!important`/`text-shadow` | Cohérence, Brand, A11y | Incohérence visuelle + contraste non fiable |
| C6 | **Pas d'`EmptyState` riche** ni de **skeletons généralisés** : empty states textuels/Alert nus, ~9+ pages en « Chargement… », spinner plein écran | Interaction, DS, Cohérence, Évaluations | Layout shift, « zone blanche », « trop simple » |
| C7 | **Statuts/badges non sémantiques** : `secondary/default/outline` gris ou texte brut au lieu des variants `success/warning/info/error` existants | Rôles, Utilisateurs, Dashboards, Brand | « Gris uniforme », UI morte au scan |
| C8 | **Navigation `window.location.href`** (full reload) au lieu de React Router ; **fetch() bruts** vs React Query selon les pages | Évaluations, Dashboards, A11y | Casse SPA, perte d'état, flash blanc |
| C9 | **Doublons d'implémentation** : 2 dashboards manager concurrents ; formulaires Create modale **et** page ; Remplacements Create/Edit dupliqués ; `CreateRule.tsx` mort (Inertia) | Rôles, Utilisateurs, Dashboards | Divergence garantie, dette |
| C10 | **Formulaires bruts** : labels = clés techniques (`id_region`), pas de Select pour FK, pas de validation/Form système ; **JSON brut** pour les critères de règles | Utilisateurs, Rôles, DS | Inutilisable / « dump de champs » |
| C11 | **Maquettes figées + coquilles vides** en production (données factices, « à implémenter », « Contenu à implémenter ») | Dashboards | Hors cible total, plombe le score |
| C12 | **A11y** : gris secondaire ~2.6:1, scaling texte no-op (défaut 0.9), ARIA 16/248, cibles <44px, pas de `prefers-reduced-motion`/skip-link | Accessibilité | Non conforme WCAG AA |

---

## 4. Plan priorisé (3 vagues — transverses AVANT local)

### VAGUE P0 — Fondations & cohérence (à corriger d'abord)

**P0.1 — Réconcilier les tokens couleur + dissocier marque/erreur** · *Périmètre : `css/sabc-colors.css`, `css/app.css`, Avatar, Badge, charts* · **L**
Faire de `--sabc-*` la source de vérité unique ; pointer `--primary`/`--ring`/`--accent` shadcn dessus. Introduire un `--sabc-error` distinct (ex. `#DC2626`) ≠ rouge de marque. Tokeniser **rayons (8/6/4)**, **élévation (e0→e4)**, **durées (120/160/200ms)**. *Impact : restaure la hiérarchie d'action et la sémantique partout, débloque dark/rebranding.*

**P0.2 — Monter un système de Toast unique + ConfirmDialog** · *Périmètre : `app.tsx`, nouveau `useToast`, `ConfirmDialog` Radix ; brancher les ~63 mutations ; supprimer `NotificationContext` legacy* · **M**
Remplacer les **12** `alert()`/`confirm()` natifs et les mutations silencieuses (reports exports, validate/terminer/toggle). *Impact : feedback non bloquant cohérent, fin de l'anti-pattern le plus visible.*

**P0.3 — Shell partagé : `PageContainer` + `PageHeader` + frame CRUD** · *Périmètre : nouveau shell + `DashboardPageFrame` + toutes pages Admin/Common/Epic 6* · **M**
Un seul titre normalisé (titre + breadcrumb + slot action primaire), un seul container (largeur/padding/`space-y` sur grille 8px). *Impact : résout d'un coup échelle de titre, espacement ET dark mode (C4+C5+espacement).*

**P0.4 — Dark mode via le shell** · *Périmètre : section Admin (Utilisateurs, Roles, Structure, Remplacements, Periodes…)* · **M**
Une fois les pages passées par le shell + Card/DataTable dark-ready, le dark mode est « gratuit ». Supprimer `bg-white`/`text-gray` sans équivalent dark. *Impact : fin de la rupture sombre sur ~112 pages.*

**P0.5 — `DataTable` comme primitive de liste imposée** · *Périmètre : enrichir DataTable (filtres, densité, sticky, sélection, actions hover, skeleton, pagination complète, slot `emptyState`) puis migrer Admin haut volume (Utilisateurs, Périodes, Remplacements, Structure)* · **L**
*Impact : tue la « table anémique » sur l'usage RH intensif (C3).*

**P0.6 — A11y bloquant** · *Périmètre : tokens texte, `useDisplayScale`/`app.css`, `.text-*`* · **M**
Retirer `--sabc-gray-400` des usages **textuels** (→ ≥4.5:1) ; rouge-texte foncé `#C53030` pour labels/erreurs ; **brancher réellement** `--app-desktop-font-scale` (calc × var), défaut 1, retirer les `!important` sur `.text-*`. *Impact : passe le plancher WCAG AA et réactive le zoom.*

**P0.7 — Trancher la dette de tiers** · *Périmètre : TMO/SS/RTM/SRMO/AS (coquilles) ; doublon dashboard Manager ; `Submissions/Show.tsx` vide ; `CreateRule.tsx` mort* · **L**
Masquer les routes vides OU EmptyState normalisé en attendant ; choisir `RoleManagerDashboardPage` comme source de vérité et déprécier `Manager/Dashboard.tsx` (+ champ période UUID). *Impact : retire les écrans hors cible visibles en prod.*

### VAGUE P1 — Impact élevé

**P1.1 — `EmptyState` riche réutilisable** (icône + titre + explication + CTA, variantes vide/sans-résultat/erreur) branché dans DataTable, listes et charts (garde `data.length===0`). *Transverse* · **M**
**P1.2 — Skeletons généralisés** : bannir « Chargement… », remplacer le spinner plein écran par un skeleton de shell (sidebar/header persistants). *Transverse* · **M**
**P1.3 — Badge/pills sémantiques partout** : réécrire Badge sur les tokens SABC ; remplacer tous les `secondary/default/outline` gris et statuts en texte brut (rôles, statuts actif/inactif, Tanière, gaps, remplacements à-venir/actif/terminé). *Corrige aussi le bug de statut « à-venir étiqueté Terminé ».* · **M**
**P1.4 — Couche Form** (`Form/FormField/FormMessage` react-hook-form + Radix) : remplacer les boucles `Object.keys` (labels FR + Select pour FK rôle/région/branche/manager + validation email/matricule) ; supprimer les doublons modale/page ; **remplacer le JSON brut des critères** par l'éditeur structuré (lignes nom/poids, total live 100%). · **L**
**P1.5 — Navigation SPA** : remplacer `window.location.href`/`navigateTo` par `useNavigate`/`<Link>` ; migrer les `fetch()` bruts (`Recues`, `Donnees`) vers React Query. *Transverse* · **M**
**P1.6 — Tooltip Radix accessible** : portal, `role/aria-describedby`, suppression de l'auto-hide 1000ms et des timers en closure. · **S**
**P1.7 — Cibles tactiles 44px** (Button default/icon `h-11` ou zone 44px) + `prefers-reduced-motion` + skip-link `#main`. · **S**
**P1.8 — Brancher les maquettes figées sur l'API** (Teams, Performance, Districts, Sectors, Commercial, Marketing, Objectives) avec skeleton/EmptyState/erreur ; remplacer KPI `text-5xl` par `MetricCard`. · **L**
**P1.9 — Avatars déterministes** (palette par hash, retirer le rouge marque par défaut) + `MetricCard`/`StatTile` partagés (fin des 51 stat-cards inline). *Transverse* · **M**

### VAGUE P2 — Raffinement

- **P2.1** — Header contextuel enrichi : sélecteur de période (et région pour DR), filtres facettés intégrés à DataTable, vue **board par statut** (à faire/soumis/validé) en complément des tables. · **L**
- **P2.2** — Réécrire Manager/Collaborateur (Epic 6) sur les archétypes partagés. · **L**
- **P2.3** — Palette charts unique tokenisée (`--sabc-chart-*`), aligner cardinalité light/dark, retirer les hex en dur des graphes ; implémenter les graphes « à implémenter ». · **M**
- **P2.4** — Lint `no-hardcoded-color` + grep CI (titres hors PageHeader, `Table` hors DataTable, `bg-white`/`text-gray` sans dark). · **S**
- **P2.5** — Nettoyage : fusionner doublons (Progress/ProgressBar, Status/StatusBadge/StatusDot, Filter/AdvancedFilter/SearchFilter, DataExport/Export), normaliser nommage de fichiers, supprimer dead props/routes legacy. · **M**
- **P2.6** — Dialog avec prop `size`, retirer gradients décoratifs (QuickActionsCard, hero Show/Mine), aligner ombres hero sur l'échelle. · **S**
- **P2.7** — `forced-colors`/`prefers-contrast`, live-region globale pour annonces React Query. · **M**

---

## 5. Quick wins (fort ratio impact/effort)

1. **Monter `<Toaster>` + `useToast`** au root et brancher les mutations existantes — débloque tout le feedback (P0.2). · **M**
2. **Token `--sabc-error` distinct du rouge de marque** — une ligne CSS qui restaure la sémantique partout (P0.1). · **S**
3. **`EmptyState` réutilisable** + injection `emptyState` dans DataTable — tue les zones blanches d'un coup. · **M**
4. **Réécrire Badge sur tokens sémantiques** et remplacer les `variant="secondary"` gris — tue le « gris uniforme » à grande échelle. · **M/S**
5. **Brancher `--app-desktop-font-scale`** (calc × var) + défaut 1 + retirer `!important` sur `.text-*` — réactive le scaling mort (P0.6). · **S**
6. **`#C53030` pour rouge-texte** + sortir `--sabc-gray-400` des usages textuels — passe le contraste AA. · **S**
7. **Tooltip Radix** : supprimer l'auto-hide 1000ms + portal + aria — corrige un anti-pattern UX + a11y. · **S**
8. **Remplacer `window.location.href` par `useNavigate`** dans `RoleDashboardShared`/Évaluations — restaure l'esprit SPA. · **S**

---

## 6. Annexe — Récap par famille de pages

| Famille | Note /100 | Actions clés |
|---|---|---|
| **Common · Évaluations + Axes d'amélioration** | **63** | Skeletons partout (aucun aujourd'hui) ; aligner `ToValidate.tsx` sur les tokens SABC + Avatar/StatTile + `max-w-6xl` ; homogénéiser filtres (Select shadcn) et migrer `fetch()` bruts → React Query ; toasts au lieu d'Alert+`setTimeout` ; implémenter/supprimer `Submissions/Show.tsx` (vide). |
| **Admin · Utilisateurs & Structure** | **42** | Refondre formulaires (labels FR + Select FK + validation, supprimer doublon modale/page, retirer fuites « via POST/PUT ») ; pills sémantiques (statut/rôle/Tanière/gaps) ; `ConfirmDialog` + toasts à la place de `window.confirm` ; empty states + skeletons de table ; harmoniser CRUD Structure (ajouter édition à services/districts/secteurs). |
| **Dashboards par rôle (12 rôles)** | **42** | Porter/masquer coquilles vides (TMO/SS/RTM/SRMO/AS) et brancher maquettes figées sur l'API ; éliminer le doublon dashboard Manager (+ champ UUID) ; unifier sur MetricCard/Badge/DashboardSkeleton partagés (fin des `text-5xl`, badges inline, aplats rouges) ; navigation `useNavigate`. |
| **Admin · Rôles & Remplacements** | **38** | Pills sémantiques systématiques (statuts/permissions/niveaux) ; corriger le bug de statut remplacement (à-venir≠terminé) + tabs/board par catégorie ; remplacer le **Textarea JSON** des critères par l'éditeur structuré puis supprimer `CreateRule.tsx` mort ; empty states + skeletons + toasts + `ConfirmDialog` ; factoriser doublons (formulaire rôle, Create/Edit remplacement). |
| **Admin · Reports (Report Builder)** | **34** | Réécrire sur le DS (Button/Card/Badge, retirer `red-600`/orange/vert bruts) ; feedback exports PPTX/XLSX (loading + try/catch + toast) regroupés en menu ; DragOverlay + réordonnancement optimiste ; header contextuel + statut en pill ; skeletons + empty states illustrés. |
| *(Transverse) Design System & tokens* | **~50** | Réconcilier double couche tokens + dissocier marque/erreur ; échelles rayons/élévation/durées tokenisées ; faire de DataTable la primitive de liste ; système Toast + EmptyState + Form ; refonte Tooltip Radix ; lint anti-régression (no-hardcoded-color, dark, PageHeader, DataTable). |

> **Séquencement recommandé** : exécuter P0.1→P0.3 (tokens + Toast + shell) **avant tout travail local**, car ils conditionnent l'élimination de la majorité des incohérences (C1, C2, C4, C5) et rendent le dark mode et la cohérence « gratuits » sur les vagues suivantes.

---

## 7. Complément — intégration des 6 zones initialement non couvertes

_Issu du workflow correctif. Détail complet dans [03-complement-angles-morts.md](03-complement-angles-morts.md)._

Voici la synthèse demandée.

# §A — Ce que ces 6 zones AJOUTENT au plan

Actions nouvelles uniquement (les actions transverses déjà au PLAN — tokens/rouge unifié, Toast, PageHeader/Container, DataTable, EmptyState, skeletons, Form, navigation SPA, badges sémantiques, a11y — ne sont PAS répétées ici).

## P0 — bloquant fonctionnel ou build

- **[P0/S] Supprimer le doublon de fichier case-collision** `pages/Admin/Analytics/Index.tsx` vs `index.tsx` (byte-identical). Bombe build sur FS sensible à la casse (CI/Docker Linux).
- **[P0/S] Supprimer tout le code mort** : `Admin/Evaluations/index.tsx`, `Templates.tsx` (plat), `pages/Evaluation/*` (fichiers 0 octet), `CreateTemplate.tsx.bak`. Pré-requis à toute mesure de cohérence (ils contiennent la moitié des violations C1/C7/C8 fantômes).
- **[P0/S] Trancher le module mort `Components/Analytics/`** (~80 Ko, heatmap de compétences incluse) : brancher comme onglet Analytics réel OU supprimer. Ne pas laisser en l'état.
- **[P0/L] Recâbler `Templates/Create` + `Edit`** sur `templatesApi` + React Query + `useNavigate` + `AdminEvaluationsLayout` ; retirer mock/`console.log`/`setTimeout`/`inertia-shim`/`mockUser`. **Réconcilier le modèle de données** (sections→compétences vs critères pondérés) sur le schéma backend réel. Création/édition de template aujourd'hui impossibles.
- **[P0/M] Recâbler `Templates/Show`** sur l'API réelle (retirer `setTimeout`/données fictives).
- **[P0/S] Corriger les routes cassées** `/admin/evaluation/templates` (singulier → 404) → `/admin/evaluations/templates` partout.
- **[P0/S] `password.tsx` : afficher l'erreur** au lieu du `throw error` aveugle après focus (échec silencieux — mot de passe actuel incorrect jamais affiché).
- **[P0/S] Retirer le copy de dev exposé à l'admin** : hero Anomalies (« seed data / branchement progressif en production »), et la landing `welcome.tsx` (« apps/web », « préflight migrations », NestJS/Redis).
- **[P0/S] Login : retirer la case « se souvenir de moi » factice** (`onChange={()=>{}}`) + l'`Alert` de `status` qui est du code mort ; conditionner `***REMOVED***` et le bloc comptes démo à `import.meta.env.DEV` (identifiant en clair dans le bundle prod).
- **[P0/S] Réconcilier nav ↔ routes** : groupe Notifications de `nav.tsx` (`/admin/notifications/send|history`) pointe vers 0 route → 404. Créer les routes ou retirer le groupe + **ajouter un test** liant chaque `NavItem.href` à une route déclarée.

## P1 — cohérence structurante (nouveau)

- **[P1/M] Factoriser un `ErrorLayout` unique** (slot illustration + titre + message + actions + encart) ; faire dériver 403/404/500 de `Error.tsx`. Élimine la quadruple duplication et unifie l'échelle de titre interne aux pages d'erreur.
- **[P1/M] Unifier les layouts d'auth** : UN seul `AuthLayout` (idéalement le `split` brandé SABC) réutilisé par Login/Forgot/Register ; supprimer `auth-simple-layout` / `auth-split-layout` non branchés ; trancher PNG vs `AppLogoIcon` pour le logo.
- **[P1/M] Unifier les layouts de Réglages** : un seul `AppLayout` + un seul `SettingsLayout` sur profile/password/appearance (aujourd'hui deux chromes : Apparence a la sidebar réglages, Profil/Mot de passe ne l'ont pas). Migrer `SettingsLayout` de `inertia-shim`/`usePage` vers React Router.
- **[P1/M] Fusionner `EvaluationPageLayout` (shared.tsx) dans le `PageLayout`/`PageHeader` unique** : deux shells concurrents (44 pages vs 14) = deux échelles de titre/padding.
- **[P1/S] Dériver `pageTitle` de la route** (config nav) au lieu de 23 chaînes libres hétérogènes ; supprimer le fallback full-reload du shim `inertia-shim.tsx:76` (réduire à `console.error`).
- **[P1/L] `Show.tsx` (évaluation) : réintroduire les actions admin Valider/Rejeter/Réouvrir** (régression fonctionnelle — le mock mort les avait, le vivant les a perdus ; la page admin est en lecture seule).
- **[P1/M] `History.tsx` : passer le filtre statut côté serveur** (actuellement `rows.filter` sur la page courante → la pagination ment).
- **[P1/S] Renommer/brancher les « Export rapide » menteurs** = `window.print()` (History, Show) → « Imprimer » ou brancher le vrai export du module Reports.
- **[P1/S] CriteresEditor : supprimer l'état local dupliqué** (anti-pattern `useEffect(()=>onChange,[criteres])` ↔ `useState(value)` synchronisé) ; piloter depuis les props.
- **[P1/S] Désactiver/masquer le sélecteur de période Analytics sur les onglets qui ne le consomment pas** (Anomalies/Individuel/Improvement/Tendances l'ignorent → faux filtre global).
- **[P1/S] Supprimer `import { error } from 'console'`** dans `PerformanceBarChart.tsx:7` (import Node parasite côté navigateur).
- **[P1/S] Corriger les libellés FR sans accents** : `RoleAnalysisSections` (« Roles analyses », « Canaux d'evaluation », « Aucune donnee »).
- **[P1/S] Recolorer la note globale `Show` selon le score** (vert/ambre/rouge-erreur) au lieu du rouge marque 4xl — une note 4.8/5 peinte en rouge = faux signal d'alerte.
- **[P1/S] Sortir le rouge des séries de données graphes** (`#E53E3E`/`#C62828`/`#EF4444`/`STATUS_COLORS` positionnels) : palette froide pour les volumes, mapping statut→couleur par clé sémantique (pas par index).
- **[P1/S] `welcome.tsx` : réécrire en langage métier SABC** + branding, OU rediriger `/` → `/login` ; masquer le CTA « Créer un compte » (inscription désactivée → cul-de-sac).

## P2 — finition (nouveau)

- **[P2/M] Périodes : colonne Taux → `Progress` inline + tri dates/taux** ; actions ligne → icônes/tooltips ou menu kebab.
- **[P2/M] `Form.tsx` : « Pré-conditions » texte mort → checklist live** dérivée de la sélection (✓ période ouverte, ✓ cible éligible, ✓ règle attachée).
- **[P2/S] Échelle min/max (1–5) en affichage/badge** au lieu d'`Input disabled` (RuleForm, CriteresEditor).
- **[P2/M] Assumer les onglets Analytics comme vraies routes** (`/admin/analytics/regions`…) ou au moins faire que titre + breadcrumb reflètent l'onglet actif (profondeur `?tab=` fantôme).
- **[P2/S] Labels de section dans la sidebar admin** (« ÉVALUATION », « ORGANISATION », « ADMINISTRATION ») + harmoniser feuille-vs-groupe sur la taxonomie, pas le compte d'enfants.
- **[P2/S] Discipline lexicale nav** : casse normalisée (« Tableau de bord » partout), apostrophes typographiques cohérentes.
- **[P2/S] Action « Copier la période précédente » sur Assignations** (valeur ClickUp).
- **[P2/S] Anomalies : tri colonnes + acknowledge en lot** (checkbox + action groupée) ; mettre à plat le filtre redondant (pills hero + re-décompte header).
- **[P2/S] Settings : faire un vrai index Réglages** (au lieu de 2 entrées nav → même pixel `/settings/profile`).
- **[P2/S] Encarts d'info pages d'erreur en couleur sémantique** (403 info=bleu, pas rouge marque).
- **[P2/S] `appearance-tabs` : supprimer le `<Tabs>` à un seul onglet** ; déplacer `localStorage.getItem('theme')` hors du render.
- **[P2/S] Masquer/raccourcir les UUID/`id_region` techniques exposés** (Team/Evaluations, Team/Overview) + rendre les lignes cliquables vers le détail.

---

# §B — Lignes pour l'annexe « Récap par famille »

| Famille | Note /100 | Actions clés |
|---|:---:|---|
| **Auth, Erreurs & Accueil** | 48 | Détokeniser les rouges hardcodés des SVG d'erreur (`#E53E3E`→token) ; Login : retirer case « se souvenir » factice + conditionner `***REMOVED***`/démo à DEV ; factoriser un `ErrorLayout` + un `AuthLayout` uniques ; réécrire/rediriger `welcome.tsx`. |
| **Admin · Dashboard & Analytics** | 61 | Supprimer doublon `Index.tsx`/`index.tsx` (build cassé) ; trancher le module mort `Components/Analytics/` (~80 Ko, heatmap) ; retirer copy dev « seed data » ; statuts sémantiques (pas couleurs par index) + supprimer `import { error } from 'console'`. |
| **Admin · Évaluations (core)** | 54 | Supprimer le code mort (`index.tsx`, `Templates.tsx` plat, `Evaluation/*`, `.bak`) ; enrichir `shared.tsx` en vrai PageHeader + Toaster ; réintroduire les actions admin Valider/Rejeter dans `Show` ; `History` filtre statut côté serveur + renommer l'export `window.print()`. |
| **Admin · Règles & Templates** | 41 | Recâbler `Templates/Create+Edit+Show` (mockés, non fonctionnels) sur l'API + réconcilier le modèle de données ; corriger routes `/admin/evaluation/templates` (404) ; `onError`+feedback sur assign/remove ; CriteresEditor : supprimer l'état local dupliqué. |
| **Common · Profil/Réglages/Équipe** | 41 | `password.tsx` : afficher l'erreur (supprimer le `throw` aveugle) ; unifier `AppLayout`+`SettingsLayout` sur les 3 onglets réglages ; badges sémantiques sur Team/Overview+Evaluations (le système existe, non consommé) ; Select/Switch du DS dans profile. |

**Axe transverse — Architecture de l'information & Navigation : 52/100.** Fondation saine (source de vérité nav unique, filtrage par rôle, actif via `useLocation`) mais trois maux systémiques : header contextuel **supprimé** (breadcrumbs retirés de `AppLayout`), navigation **hybride** (≈20 `window.location.href` en nav interne dont le CTA sidebar « Mes évaluations » + fallback full-reload dans le shim → perte d'état React Query, flash plein écran), et **liens morts** dans la config nav (groupe Notifications → 404). Actions clés : tuer le full-reload sur la nav interne (`useNavigate`/`<Link>`, garder `window.location` pour login/logout/401 uniquement) ; `pageTitle` dérivé de la route au lieu de 23 chaînes libres ; test de cohérence `NavItem.href` ↔ routes déclarées.
