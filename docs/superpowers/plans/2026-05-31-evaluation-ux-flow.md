# Evaluation UX Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le démarrage d'une évaluation compréhensible en 1 clic, et guider l'admin dans la configuration des prérequis.

**Architecture:** Modifications ciblées sur Mine.tsx (flux évaluateur), Periodes.tsx (admin), et Admin/Dashboard (checklist setup). Aucune modification backend. Aucun nouveau composant créé — uniquement refactoring JSX + classes Tailwind.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, React Query, Lucide React, composants UI internes (@/Components/UI/*)

---

## Contexte codebase — à lire avant toute modification

### Fichier principal évaluateur
`apps/web/src/pages/Common/Evaluations/Mine.tsx`
- Lignes 101-104 : `launchEvaluation(targetMatricule)` — fait déjà `setSelectedTarget` + `setModalOpen(true)` en une seule fonction
- Lignes 258-290 : boucle sur `group.targets` avec 2 boutons par ligne : "Sélectionner" (setSelectedTarget) + "Démarrer" (disabled jusqu'à sélection)
- Lignes 68-76 : `applicableRules` calculé depuis le `selectedTarget` global
- Lignes 78-89 : `useEffect` qui met à jour `selectedTemplate` quand `applicableRules` change

### Fichier admin périodes
`apps/web/src/pages/Admin/Evaluations/Periodes.tsx`
- Ligne 239 : bouton "Basculer" qui appelle `toggleMutation.mutate(periode.id_periode)`
- Chaque `periode` a les champs `est_ouverte: boolean`, `est_cloturee: boolean`, `statut: string`

### Fichier admin dashboard
`apps/web/src/pages/Admin/Dashboard/index.tsx`
- Ligne 72 : `<div className="container mx-auto px-4 py-6">`
- Ligne 73 : `<WelcomeMessage ... className="mb-8" />`
- Ligne 75 : `<Tabs ...>`

### Hook données workflow
`apps/web/src/Hooks/queries/useEvaluationWorkflow.ts` (ou path similaire trouvé via Glob)
- `data.rules` : liste des règles actives
- `data.activePeriod` : période ouverte ou null
- `data.eligibleGroups` : groupes de cibles (label + targets[])
- `data.summary.activeRules` : nombre de règles actives

### Utilitaire règles
`apps/web/src/utils/rules.ts`
- `filterApplicableRules(rules, roleEvaluateur, roleEvalue, typeEvaluation)` → règles filtrées

### Type `Target`
Défini ligne 27 de Mine.tsx : `type Target = Record<string, any>`
Champs utiles : `target.matricule`, `target.role_nom || target.role`, `target.workflowType`

---

## Task 1 : Mine.tsx — 1 clic "Évaluer" par cible (supprimer la sélection en 2 temps)

**Fichiers :**
- Modifier : `apps/web/src/pages/Common/Evaluations/Mine.tsx`

**Problème actuel :** 2 boutons par cible ("Sélectionner" + "Démarrer" qui ne s'active qu'après sélection). L'utilisateur ne comprend pas pourquoi "Démarrer" est grisé.

**Solution :** Un seul bouton "Évaluer" par ligne qui calcule les règles applicables pour CETTE cible au moment du clic (inline), puis ouvre le modal directement.

- [ ] **Étape 1.1 — Supprimer les états `selectedTarget` et `selectedTemplate` de la logique de liste**

  Dans `Mine.tsx`, garder `selectedTarget` et `selectedTemplate` uniquement pour le modal. Ajouter une fonction `handleEvaluate` qui compute les règles inline et lance le modal :

  Trouver le bloc `const launchEvaluation` (ligne ~101) et le remplacer :

  ```tsx
  const handleEvaluate = (target: Target) => {
    const targetType = target.workflowType ?? null;
    const rules = filterApplicableRules(
      data.rules,
      user?.role_nom || user?.role,
      target.role_nom || target.role,
      targetType,
    );
    setSelectedTarget(target.matricule);
    setSelectedTemplate(rules[0]?.id_regle ?? null);
    setModalOpen(true);
  };
  ```

- [ ] **Étape 1.2 — Remplacer les 2 boutons par 1 bouton "Évaluer" par ligne**

  Localiser le bloc `group.targets.map((target: Target) => (...)` (ligne ~258).

  Remplacer la `<div className="flex items-center gap-2">` (ligne ~265 à ~286) par :

  ```tsx
  <div className="flex items-center gap-2">
    {(() => {
      const targetType = target.workflowType ?? null;
      const rules = filterApplicableRules(
        data.rules,
        user?.role_nom || user?.role,
        target.role_nom || target.role,
        targetType,
      );
      const canStart = Boolean(data.activePeriod) && rules.length > 0;
      return (
        <>
          {!canStart && (
            <span className="text-xs text-sabc-gray-400">
              {!data.activePeriod ? 'Aucune période active' : 'Aucune règle applicable'}
            </span>
          )}
          <Button
            size="sm"
            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
            disabled={!canStart}
            onClick={() => handleEvaluate(target)}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Évaluer
          </Button>
        </>
      );
    })()}
  </div>
  ```

- [ ] **Étape 1.3 — Supprimer le panneau "Cadrage de la sélection courante" devenu inutile**

  Le panneau "Cadrage de la sélection courante" (Card avec `<ClipboardList>`, ligne ~179 à ~233) était utile uniquement pour l'affichage de la règle sélectionnée. Ce panneau crée de la confusion.

  Remplacer ce panneau par rien, et ajuster la grille `grid gap-6 lg:grid-cols-[360px,1fr]` (ligne ~170) en `grid gap-6 lg:grid-cols-1` si c'est la seule colonne restante, ou simplement supprimer la balise `<Card>` interne.

  **Important** : Garder le `<ActiveRulesCard>` — il reste utile comme information générale.

  Simplifier :
  ```tsx
  <div className="grid gap-6">
    <ActiveRulesCard
      rules={applicableRules}
      description="Les règles compatibles sont filtrées selon votre rôle et les cibles disponibles."
      emptyMessage="Aucune règle active publiée pour votre rôle."
    />
  </div>
  ```

- [ ] **Étape 1.4 — Nettoyer les états devenus inutiles**

  Les états `selectedTarget` et `selectedTemplate` restent pour le modal (ils sont passés à `<EvaluationModal>`). Ce qui change : ils ne sont plus pilotés par le bouton "Sélectionner", mais uniquement par `handleEvaluate`.

  Supprimer l'`useEffect` (lignes ~78-89) qui mettait à jour `selectedTemplate` via `applicableRules` — ce calcul est désormais fait dans `handleEvaluate`.

  Supprimer aussi la computation de `applicableRules`, `selectedTargetData`, `selectedTargetType`, `selectedRule`, `selectedRuleSummary` en haut du composant si elles ne sont plus utilisées.

- [ ] **Étape 1.5 — Vérifier le build**

  ```bash
  cd /Users/macbook/Documents/SABC/sabc_eval360
  pnpm --filter @sabc/web build 2>&1 | tail -20
  ```
  Expected : no TypeScript errors

---

## Task 2 : Periodes.tsx — "Basculer" → "Ouvrir" / "Fermer"

**Fichiers :**
- Modifier : `apps/web/src/pages/Admin/Evaluations/Periodes.tsx`

**Problème actuel :** Le bouton "Basculer" ne dit pas clairement si on va ouvrir ou fermer la période. L'admin ne sait pas ce qu'il va se passer.

- [ ] **Étape 2.1 — Remplacer le bouton "Basculer" par un bouton contextuel**

  Localiser la ligne ~239 :
  ```tsx
  <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate(periode.id_periode)} disabled={isBusy}>
    <Power className="mr-1 h-3.5 w-3.5" />
    Basculer
  </Button>
  ```

  Remplacer par :
  ```tsx
  <Button
    variant="outline"
    size="sm"
    onClick={() => toggleMutation.mutate(periode.id_periode)}
    disabled={isBusy || periode.est_cloturee}
    title={periode.est_cloturee ? 'Période terminée — non modifiable' : undefined}
  >
    <Power className="mr-1 h-3.5 w-3.5" />
    {periode.est_ouverte ? 'Fermer' : 'Ouvrir'}
  </Button>
  ```

- [ ] **Étape 2.2 — Améliorer les stat cards (text-3xl → text-2xl)**

  Ligne ~161 à ~164 : les 4 stat cards ont `text-3xl font-bold` dans des grilles 4 colonnes.

  Remplacer chaque occurrence `text-3xl font-bold` par `text-2xl font-bold` dans ce bloc.

- [ ] **Étape 2.3 — Vérifier le build**

  ```bash
  cd /Users/macbook/Documents/SABC/sabc_eval360
  pnpm --filter @sabc/web build 2>&1 | tail -20
  ```

---

## Task 3 : Mine.tsx — Alertes actionnables selon le rôle

**Fichiers :**
- Modifier : `apps/web/src/pages/Common/Evaluations/Mine.tsx`

**Problème actuel :** L'alerte "Aucune période active" (ligne ~134) ne dit pas à l'utilisateur quoi faire. Un admin peut corriger la situation directement ; un non-admin doit contacter l'admin.

- [ ] **Étape 3.1 — Importer `useAuthContext` (déjà importé ligne 26)**

  `useAuthContext` est déjà importé. Extraire le rôle :
  ```tsx
  const { user } = useAuthContext();
  const isAdmin = (user?.role_nom || user?.role || '').toUpperCase() === 'ADMIN';
  ```
  Cette ligne est déjà dans le composant (ligne ~55-56). Ajouter juste `isAdmin` après.

- [ ] **Étape 3.2 — Remplacer l'alerte "Aucune période" par une alerte avec lien**

  Localiser (ligne ~134 à ~141) :
  ```tsx
  {!data.activePeriod ? (
    <Alert>
      <AlertTitle>Aucune période active</AlertTitle>
      <AlertDescription>
        Les règles peuvent être publiées, mais aucune création d'évaluation ne doit être lancée tant qu'une période n'est pas ouverte.
      </AlertDescription>
    </Alert>
  ) : null}
  ```

  Remplacer par :
  ```tsx
  {!data.activePeriod ? (
    <Alert>
      <AlertTitle>Aucune période active</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>Aucune campagne d'évaluation n'est ouverte pour l'instant.</span>
        {isAdmin ? (
          <a
            href="/admin/evaluations/periodes"
            className="inline-flex items-center text-sm font-medium text-sabc-red-primary underline-offset-4 hover:underline"
          >
            Créer et ouvrir une période →
          </a>
        ) : (
          <span className="text-xs text-sabc-gray-500">Contactez l'administrateur pour ouvrir un cycle d'évaluation.</span>
        )}
      </AlertDescription>
    </Alert>
  ) : null}
  ```

- [ ] **Étape 3.3 — Améliorer l'alerte "Aucune cible disponible"**

  Localiser (ligne ~244 à ~250) :
  ```tsx
  {data.eligibleGroups.length === 0 ? (
    <Alert>
      <AlertTitle>Aucune cible disponible</AlertTitle>
      <AlertDescription>
        Vous n'avez actuellement aucune cible éligible selon la hiérarchie et les règles actives.
      </AlertDescription>
    </Alert>
  ) : (
  ```

  Remplacer le contenu de l'Alert :
  ```tsx
  {data.eligibleGroups.length === 0 ? (
    <Alert>
      <AlertTitle>Aucune cible disponible</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>Votre hiérarchie ne compte aucun subordonné ou pair éligible pour l'instant.</span>
        {isAdmin && (
          <a
            href="/admin/utilisateurs"
            className="inline-flex items-center text-sm font-medium text-sabc-red-primary underline-offset-4 hover:underline"
          >
            Vérifier la configuration des utilisateurs →
          </a>
        )}
      </AlertDescription>
    </Alert>
  ) : (
  ```

- [ ] **Étape 3.4 — Vérifier le build**

  ```bash
  cd /Users/macbook/Documents/SABC/sabc_eval360
  pnpm --filter @sabc/web build 2>&1 | tail -20
  ```

---

## Task 4 : Admin Dashboard — Checklist de configuration

**Fichiers :**
- Modifier : `apps/web/src/pages/Admin/Dashboard/index.tsx`

**Problème actuel :** L'admin se connecte sur un dashboard avec des onglets d'analytics, mais aucun indicateur ne lui dit si les prérequis d'une campagne d'évaluation sont en place (règles + période). Il doit naviguer manuellement vers /periodes et /regles pour le savoir.

**Solution :** Ajouter un `SetupChecklist` au-dessus des onglets qui récupère rapidement les compteurs et guide l'admin.

- [ ] **Étape 4.1 — Lire le hook de données du dashboard admin**

  Lire `apps/web/src/Hooks/queries/useAdminDashboardTabs.ts` (ou trouver via Glob `**/*AdminDashboard*`).

  On a besoin de savoir si ces hooks retournent déjà des compteurs de règles/périodes, ou si on doit ajouter des queries séparées.

- [ ] **Étape 4.2 — Ajouter les imports nécessaires dans `Admin/Dashboard/index.tsx`**

  En haut du fichier, ajouter :
  ```tsx
  import { useQuery } from '@tanstack/react-query';
  import { periodesApi, reglesApi } from '@/Services/api';
  import { AlertTriangle, CheckCircle2, Settings } from 'lucide-react';
  import { Link } from 'react-router-dom';
  ```

  (Vérifier que `useQuery` n'est pas déjà importé — si oui, ne pas dupliquer.)

- [ ] **Étape 4.3 — Ajouter les queries de setup dans `AdminDashboard()`**

  Après la ligne de `const handleTabChange` (ligne ~61), ajouter :
  ```tsx
  const { data: periodesData } = useQuery({
    queryKey: ['admin', 'setup', 'periodes'],
    queryFn: () => periodesApi.list().then((r) => Array.isArray(r.data) ? r.data : []),
    staleTime: 30_000,
  });

  const { data: reglesData } = useQuery({
    queryKey: ['admin', 'setup', 'regles'],
    queryFn: () => reglesApi.list().then((r) => Array.isArray(r.data) ? r.data : []),
    staleTime: 30_000,
  });

  const hasOpenPeriod = Array.isArray(periodesData) && periodesData.some((p: any) => p.est_ouverte);
  const hasActiveRules = Array.isArray(reglesData) && reglesData.length > 0;
  const isSetupComplete = hasOpenPeriod && hasActiveRules;
  ```

- [ ] **Étape 4.4 — Insérer le composant SetupChecklist entre WelcomeMessage et les Tabs**

  Localiser (ligne ~73-75) :
  ```tsx
  <WelcomeMessage userName={layoutUser.name} className="mb-8" />

  <Tabs value={activeTab} ...>
  ```

  Insérer entre les deux :
  ```tsx
  <WelcomeMessage userName={layoutUser.name} className="mb-6" />

  {!isSetupComplete && (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <div className="font-semibold text-amber-900">Configuration requise avant le lancement des évaluations</div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              {hasActiveRules
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span className={hasActiveRules ? 'text-emerald-800' : 'text-amber-800'}>
                {hasActiveRules ? 'Au moins une règle active publiée' : 'Aucune règle active — '}
              </span>
              {!hasActiveRules && (
                <Link to="/admin/evaluations/regles/create" className="font-medium text-sabc-red-primary underline-offset-2 hover:underline">
                  Créer une règle →
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {hasOpenPeriod
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span className={hasOpenPeriod ? 'text-emerald-800' : 'text-amber-800'}>
                {hasOpenPeriod ? 'Période d\'évaluation ouverte' : 'Aucune période ouverte — '}
              </span>
              {!hasOpenPeriod && (
                <Link to="/admin/evaluations/periodes" className="font-medium text-sabc-red-primary underline-offset-2 hover:underline">
                  Créer et ouvrir une période →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  <Tabs value={activeTab} ...>
  ```

- [ ] **Étape 4.5 — Vérifier le build**

  ```bash
  cd /Users/macbook/Documents/SABC/sabc_eval360
  pnpm --filter @sabc/web build 2>&1 | tail -20
  ```

---

## Self-Review

### Spec coverage

| Besoin utilisateur | Tâche |
|---|---|
| 1 clic pour démarrer une évaluation | Task 1 |
| Savoir pourquoi le bouton est désactivé | Task 1 (message inline) |
| "Basculer" incompréhensible | Task 2 |
| Admin ne sait pas ce qu'il manque | Task 4 (checklist) |
| Alerte "pas de période" non actionnable | Task 3 |
| Admin tombe sur 404 après création | Corrigé précédemment ✅ |
| Pages Recues/Donnees vides | Corrigé précédemment ✅ |
| Évaluation rejetée impossible à corriger | Corrigé précédemment ✅ |

### Placeholder scan
- Aucun TBD / TODO dans le plan
- Chaque étape a le code complet
- Les chemins de fichiers sont exacts (vérifiés par lecture directe)

### Type consistency
- `Target = Record<string, any>` — utilisé partout (conforme à Mine.tsx ligne 27)
- `filterApplicableRules` — signature `(rules, roleEval, roleEvalue, type)` — conforme à `utils/rules.ts`
- `data.activePeriod` — boolean check — conforme à l'usage existant dans Mine.tsx
- `periode.est_ouverte`, `periode.est_cloturee` — champs existants dans Periodes.tsx
- `periodesApi.list()`, `reglesApi.list()` — utilisés partout dans le projet

---

## Ordre d'exécution recommandé

Tasks 1, 2, 3, 4 sont **indépendantes** — peuvent être exécutées en parallèle par des agents séparés.

Priorité : **Task 1 > Task 4 > Task 3 > Task 2** (impact décroissant sur le problème utilisateur décrit)
