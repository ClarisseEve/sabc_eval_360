# Annexe C — Complément : 6 zones initialement non couvertes

_Reviewers qui avaient échoué au 1er passage, relancés en sortie texte (workflow wf_71d6dec1-83b)._



<!-- famille:Auth & Erreurs & Accueil -->

# Critique UX/UI — Famille « Auth, Erreurs & Accueil »

## Verdict global : 48/100

Une famille **fonctionnelle mais inégale et incohérente**. Le `Login` est le plus abouti (et le seul réellement travaillé), mais il porte déjà 4 des incohérences transverses. Les pages d'erreur sont visuellement « jolies » au premier coup d'œil grâce à leurs illustrations SVG maison, mais elles trahissent la marque (rouge hardcodé `#E53E3E` ≠ rouge SABC réel `#C8102E`), ne gèrent aucun dark mode, et utilisent une échelle typographique encore différente. La `welcome.tsx` est un **placeholder de développeur** (texte « apps/web », « préflight migrations ») qui n'a rien à faire en page publique d'une app de marque. Quatre layouts d'auth coexistent dont **trois ne sont jamais branchés** par les pages réelles. C'est une zone qui « marche » mais qui, mise côte à côte, ressemble à 4 mains différentes. Loin du standard ClickUp : pas de système, pas de tokens unifiés, pas de soin produit sur l'accueil.

---

## 1. `pages/Auth/Login.tsx` — 60/100

### État actuel
Page autoportante (n'utilise AUCUN des layouts d'auth du dossier `Layout/auth/`). Logo SABC centré, carte `max-w-lg`, liste de 4 comptes de démo cliquables, champ identifiant + mot de passe avec toggle visibilité, case « se souvenir de moi », bouton pleine largeur, footer copyright.

### Forces
- La meilleure page de la zone : hiérarchie lisible (logo → titre → comptes → formulaire → CTA), spacing globalement sur grille 8px (`space-y-5`, `mb-6`, `mt-8`).
- Détails soignés : toggle mot de passe avec `aria-label` dynamique correct, `autoFocus`, `loading` sur le bouton, états d'erreur par champ.
- Le sélecteur de comptes de démo est une bonne idée d'onboarding interne.

### Problèmes
- **[C1] Triple rouge incohérent — preuve directe.** `border-sabc-error` (#D32F2F, ligne 18 de `index.css`) pour les erreurs de champ, `text-sabc-red-primary` (#C8102E) pour les liens, et l'app shadcn a `--primary: oklch(0.205 0 0)` (noir). Trois rouges + un « primary » noir cohabitent. Les liens « Mot de passe oublié » et « Créer un compte » sont en rouge marque : **du rouge non-action en quantité**, ce qui dilue le signal d'action primaire (le bouton « Se connecter » qui devrait être LE seul rouge dominant).
- **Couleurs en hexadécimal magique dans le JSX** : `text-[#424242]`, `text-[#9E9E9E]` (lignes 110-111, 233). On bypasse totalement le système de tokens — exactement ce qui entretient C1/C4.
- **`bg-sabc-red-dark` pour 3 badges sur 4** (DR/CDS/TMO) : les badges de rôle utilisent des nuances de rouge marque au lieu de **pills sémantiques neutres**. Un badge de rôle n'est ni une action ni une alerte → viole la discipline du rouge.
- **[C2] Mutation silencieuse + état mort.** La case « Se souvenir de moi » est `checked={false}` / `onChange={() => {}}` (lignes 201-202) : **contrôle factice, ne fait rien**. À retirer ou implémenter. Le state `status` (ligne 30) n'est jamais positionné → l'`Alert` de succès est du code mort.
- **Échec d'auth non « toasté »** : l'erreur 401 s'affiche uniquement sous le champ identifiant. Acceptable, mais aucun feedback non bloquant global (C2).
- **Mot de passe pré-rempli `'***REMOVED***'`** (ligne 26) : pratique en démo mais c'est un identifiant en clair dans le bundle de prod. À conditionner à `import.meta.env.DEV`.
- **Densité** : le bloc « comptes de démo » prend autant de place que le formulaire lui-même. En prod cela devrait être repliable / masqué hors DEV.
- **`shadow-lg border-0`** : ombre non tokenisée (échelle e0→e4 attendue).

### Écart vs ClickUp
ClickUp/Linear : carte d'auth minimale, un seul accent, micro-illustration de marque discrète. Ici le rouge est partout (liens + badges + bordures d'erreur) → pas de discipline d'accent. Pas de dark mode.

### Actions
- **P0/S — correction** : retirer la case « se souvenir de moi » factice (ou l'implémenter).
- **P0/S — correction** : conditionner `***REMOVED***` et le bloc démo à `import.meta.env.DEV`.
- **P1/S — correction** : remplacer `text-[#424242]`/`text-[#9E9E9E]` par tokens (`text-foreground`/`text-muted-foreground`).
- **P1/M — amélioration** : passer les liens en neutre/`muted` (réserver le rouge au CTA), badges de rôle en pills neutres sémantiques.
- **P1/S — amélioration** : supprimer l'`Alert` de `status` mort, et router les erreurs serveur génériques vers le futur système de Toast.

---

## 2. `pages/welcome.tsx` — 22/100

### État actuel
Landing publique. Hero « SABC Eval360 est maintenant porté par la stack active NestJS », paragraphe mentionnant `apps/web`, `apps/api`, MySQL/PostgreSQL/Redis, et une aside « Stack active » listant Frontend/Backend/Data/Opérations.

### Forces
- Mise en page propre (grille `1.2fr / 0.8fr`, spacing cohérent).
- Branchement auth conditionnel correct (dashboard si connecté, sinon login/register).

### Problèmes
- **Contenu = notes de développeur, pas une page produit.** « porté par la stack active NestJS », « Préflight, migrations SQL, healthchecks », `<code>apps/web</code>` dans une **page publique de marque**. C'est un README déguisé en landing. Inacceptable pour une app SABC.
- **Zéro identité SABC** : palette `stone-*` (gris chaud neutre), CTA `bg-stone-950` (noir). **Aucun rouge SABC, aucun logo.** La page d'accueil ne ressemble pas au reste de l'app → rupture de marque totale (renforce C1/C4 : 3e échelle de titre `text-6xl`, 3e palette).
- **Lien « Créer un compte »** alors que `Register.tsx` annonce « Inscription désactivée » : incohérence de parcours — on propose une action qui mène à un cul-de-sac.
- Pas de responsive pensé au-delà du `lg:grid-cols` (pas d'illustration, page très vide sur mobile).

### Écart vs ClickUp
Une landing ClickUp = proposition de valeur claire, visuel de produit, accent de marque. Ici on a une fiche technique interne. Écart maximal.

### Actions
- **P1/M — correction** : réécrire le contenu en langage métier SABC (« Évaluation 360° des équipes commerciales »), retirer toute mention technique (`apps/web`, NestJS, Redis…).
- **P1/S — correction** : appliquer logo + accent rouge SABC, aligner l'échelle de titre sur le reste.
- **P2/S — correction** : masquer le CTA « Créer un compte » (inscription désactivée) → un seul CTA « Se connecter ».
- **P2/M — amélioration** : ajouter un visuel/illustration de marque et un état mobile soigné. (Alternative pragmatique : rediriger `/` vers `/login` si l'accueil public n'a pas de raison d'être.)

---

## 3. Pages d'erreur `403 / 404 / 500 / Error.tsx` — 50/100

### État actuel
Quatre pages quasi identiques en structure : illustration SVG maison (bouclier, « 404 », serveur, triangle), titre `text-4xl`, message, 2 boutons (Accueil / Précédente ou Actualiser), encart d'info, footer « SABC Évaluation 360° - Erreur XXX ».

### Forces
- **Effort réel sur les illustrations SVG** : c'est rare et louable, ça évite le 404 anémique typique.
- Structure cohérente entre les 4 pages, boutons d'action pertinents (retour accueil + précédente, refresh sur 500).
- Bonne idée du composant `Error.tsx` générique paramétrable (status/title/message).

### Problèmes
- **[C1] Rouge de marque trahi — preuve.** TOUS les SVG codent `stopColor="#E53E3E"` en dur (403 l.28, 404 l.28, 500, Error). Or le **vrai** rouge SABC est `#C8102E` (`index.css` l.5) et le rouge erreur `#D32F2F`. Les illustrations affichent donc un **3e rouge fantôme** qui n'existe dans aucun token. La marque est littéralement fausse à l'écran.
- **Mélange rouge + orange `#FF9800` partout** dans les SVG : l'orange n'est pas une couleur sémantique définie du système (statut « retard » attendu = ambre, pas cet orange). Décoratif arbitraire.
- **[C5] Dark mode cassé** : `bg-sabc-gray-50` en dur, `text-sabc-gray-900`, SVG aux couleurs fixes. En dark mode → fond clair forcé, contraste cassé. Aucune variante.
- **[C4] 3e/4e échelle typographique** : titres en `text-4xl` (403/404/500) vs `text-3xl` + code `text-6xl` (Error.tsx). Incohérent entre les pages d'erreur elles-mêmes.
- **[C7] Encarts non sémantiques** : 403 utilise `bg-sabc-red-light` (rouge marque) pour un encart d'info de sécurité → mélange marque/sémantique. 500 et Error utilisent `bg-sabc-accent-light` (orange). Aucun token de statut cohérent.
- **`border-opacity-20`** : utilitaire Tailwind v3 déprécié en v4 (devrait être `border-sabc-red-primary/20`).
- **Duplication massive** : 4 fichiers répètent header/boutons/footer. Aucun layout d'erreur partagé (pendant qu'il existe 4 layouts d'AUTH inutilisés — ironie de C4).
- **[C8] partiel** : 403/404/Error utilisent `window.history.back()` (OK, natif) mais 500 fait `window.location.reload()` (full reload, acceptable pour un refresh). Les `Link href="/"` passent bien par React Router (vérifié dans le shim) → ce point-là est sain.

### Écart vs ClickUp
ClickUp : page d'erreur = EmptyState illustré + 1 action primaire claire, tokenisé, dark-mode-aware. Ici les illustrations sont là mais les couleurs hors-système et l'absence de dark mode cassent la cohérence.

### Actions
- **P0/S — correction** : remplacer tous les `#E53E3E`/`#FF9800` hardcodés des SVG par `currentColor` ou des variables CSS (`var(--color-sabc-red-primary)`), pour que la marque soit exacte et dark-mode-aware.
- **P1/M — correction** : factoriser un `ErrorLayout` unique (illustration slot + titre + message + actions + encart) et faire dériver 403/404/500 de `Error.tsx`. Élimine la duplication et unifie l'échelle de titre.
- **P1/S — correction** : tokens dark-mode (`bg-background`/`text-foreground`) au lieu de `sabc-gray-*` en dur.
- **P2/S — amélioration** : encarts d'info en couleur sémantique cohérente (info=bleu, pas rouge marque pour le 403).

---

## 4. Layouts d'auth `Layout/auth/*` — 35/100

### État actuel
Quatre fichiers : `auth-layout.tsx` (wrapper → simple), `auth-simple-layout.tsx`, `auth-card-layout.tsx`, `auth-split-layout.tsx`.

### Forces
- `auth-split-layout` est élégant (panneau latéral sombre + citation) — pattern Linear/Vercel.
- `auth-card-layout` est propre et utilisé par `ForgotPassword`/`Register`.

### Problèmes
- **Prolifération non gouvernée** : 4 layouts, dont `auth-simple` et `auth-split` ne sont **importés par aucune page réelle** (Login est autoportant, ForgotPassword/Register utilisent `card`). Dette morte qui aggrave C4.
- **[C1/tokens]** : ces layouts utilisent `bg-muted`, `bg-background`, `text-muted-foreground` (tokens shadcn/oklch) tandis que `Login.tsx` utilise `bg-sabc-gray-50` et des hex en dur. **Deux familles de tokens sur la même famille de pages.** C'est la preuve vivante de la double couche C1.
- `auth-split-layout` dépend de `usePage().props.quote` / `.name` (héritage Inertia) — données qui n'existent probablement plus dans le shim React Router → panneau citation potentiellement vide.
- Logo via `AppLogoIcon` `fill-current text-black` : pas de variante dark, et **incohérent avec le `Login` qui utilise le PNG `/images/logos/sabc-logo.png`**. Deux représentations du logo.

### Actions
- **P1/S — correction** : supprimer les layouts non utilisés (`auth-simple` si non branché, ou inversement faire passer `Login` par un layout partagé).
- **P1/M — amélioration élégante** : unifier — UN seul `AuthLayout` (idéalement le `split` avec branding SABC), réutilisé par Login/Forgot/Register, sur la même famille de tokens que le reste de l'app. Décider PNG vs `AppLogoIcon` une fois pour toutes.

---

## Synthèse problèmes transverses présents dans la zone

| Code | Présent | Preuve dans la zone |
|------|:------:|---------|
| **C1** rouge marque == rouge erreur + double token | **OUI (fort)** | SVG erreur `#E53E3E` ≠ token marque `#C8102E` ≠ erreur `#D32F2F`; Login mélange `bg-muted`/oklch (layouts) vs `sabc-gray`/hex `#424242` |
| **C2** pas de Toast, mutations silencieuses | **OUI** | Login « se souvenir » `onChange={()=>{}}` factice; `status` Alert code mort; pas de toast sur 401 |
| C3 DataTable / tables brutes | N/A | pas de tables dans cette zone |
| **C4** pas de PageHeader, échelles de titre divergentes | **OUI (fort)** | titres `text-4xl` (errs) vs `text-3xl` (Error.tsx) vs `text-6xl` (welcome) vs `text-2xl` (Login); 4 layouts auth concurrents |
| **C5** dark mode cassé | **OUI** | toutes les pages d'erreur en `bg-sabc-gray-50`/SVG hardcodés; Login en `bg-sabc-gray-50` |
| C6 EmptyState/skeletons | Partiel | pas de loading state sur Login au-delà du bouton (acceptable ici) |
| **C7** badges non sémantiques | **OUI** | badges de rôle Login en `bg-sabc-red-dark`; encart 403 en rouge marque pour de l'info |
| **C8** window.location / fetch brut | **Partiel/sain** | `Link` GET → React Router (OK, vérifié); seuls `history.back()`/`location.reload()` natifs, acceptables |
| C10 formulaires bruts | Léger | Login utilise Label/Input maison mais pas de système Form/validation; labels OK (français) |

## Top priorités P0 de la zone
1. **P0/S** — Détokeniser les rouges hardcodés des SVG d'erreur (`#E53E3E` → token `#C8102E`/`currentColor`). La marque est littéralement fausse à l'écran.
2. **P0/S** — Login : retirer la case « se souvenir » factice + conditionner `***REMOVED***`/bloc démo à DEV.
3. **P1/M** — Réécrire `welcome.tsx` (contenu produit + branding SABC) ou la rediriger vers `/login`.
4. **P1/M** — Factoriser un `ErrorLayout` unique et UN seul `AuthLayout` sur une famille de tokens unique.

Fichiers concernés (absolus) :
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Auth/Login.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Auth/ForgotPassword.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Auth/Register.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/welcome.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Errors/{403,404,500,Error}.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Layout/auth/{auth-layout,auth-simple-layout,auth-card-layout,auth-split-layout}.tsx`
- Tokens : `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/index.css` (`--color-sabc-red-primary: #C8102E`, `--color-sabc-error: #D32F2F`) vs `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/css/app.css` (`--primary: oklch(0.205 0 0)`).


---


<!-- famille:Admin Dashboard & Analytics -->

# Critique UX/UI — Famille « Admin · Dashboard & Analytics »

## Verdict global : 61/100

Surface la plus mature du produit côté data-viz : graphes Recharts soignés (tooltips custom, gradients, domaines bornés `[0,5]`/`[0,100]`, donut avec total centré), KPI tokenisés, `EmptyState` systématiquement câblé, skeletons de chargement, `ErrorBoundary` + `Suspense` par onglet, navigation React Router propre avec état persisté en query param (`?tab=`, `?periode=`). C'est nettement au-dessus du reste de l'app. **Mais** trois problèmes graves plombent la note : (1) un module Analytics entier (~80 Ko, heatmap de compétences, drawer, filtres avancés) est **du code mort jamais monté** ; (2) un **doublon de page case-collision** (`Index.tsx` == `index.tsx`, byte-identical) ; (3) l'écart au langage cible ClickUp reste structurel — **pas de PageHeader partagé, pas de sélecteur de vue, filtres incohérents (3 implémentations différentes), tables semi-brutes sans tri/densité/sticky**. On a de beaux graphes posés sur une charpente non standardisée.

---

## Page 1 — `pages/Admin/Dashboard/index.tsx` (Tableau de bord)

**État actuel.** Hub d'accueil : WelcomeMessage, checklist de configuration conditionnelle (règles + période ouverte), bande KPI (5 cartes via `AdminOverviewMetricsSection`), 2 cartes d'état (anomalies / campagne), grille de 6 accès rapides.

**Forces.**
- La **checklist de setup** (lignes 99-136) est un vrai pattern d'onboarding : états verts/ambre + CTA contextuels (`Créer une règle →`). Excellent réflexe produit.
- KPI en `Suspense` + `KpiSkeleton` structurel (5 blocs `animate-pulse`, pas un spinner) — conforme à la cible.
- Accès rapides en cards à niveaux (icône/titre/caption) avec hover `-translate-y-0.5`.

**Problèmes.**
- **Hiérarchie de titre cassée (C4).** La page n'a **aucun `<h1>`** : elle ouvre directement sur `WelcomeMessage` puis des `<h2 className="text-base">`. La page Analytics voisine, elle, a un `<h1 className="text-2xl">`. Deux pages sœurs, deux échelles de titre → preuve directe de C4.
- **Carte « campagne » morte.** La 2ᵉ carte d'état (l. 171-185) n'est pas un `Link` alors que la carte anomalies l'est : asymétrie d'affordance, l'utilisateur clique dans le vide.
- **Rouge marque == rouge critique (C1).** L'icône anomalies passe en `bg-red-100 text-red-600` quand `anomalyTotal > 0` (l. 158), tandis que les accès rapides utilisent `text-sabc-red-primary`. Le même rouge sert d'accent de marque ET de signal critique → exactement C1.
- **Densité sous le plafond.** 5 KPI + 2 cartes d'état, mais aucune mini-tendance/sparkline : le dashboard d'accueil est informatif mais statique (pas de « delta vs période précédente » alors que la donnée existe côté trend).
- **Responsive.** `xl:grid-cols-6` pour 6 accès rapides → en `md` on tombe à 3 colonnes, lisible, mais les KPI `md:grid-cols-3 xl:grid-cols-5` pour 5 items créent une ligne orpheline en `md` (3+2).

**Écart vs ClickUp.** Pas de header contextuel (titre + breadcrumb + action primaire à droite). C'est un « portail de liens » plus qu'un cockpit ; ClickUp mettrait une action primaire (ex. « Ouvrir une période ») ancrée en haut à droite.

**Actions.**
- **P0 / S — correction.** Rendre la carte campagne cliquable (Link vers `/admin/evaluations/periodes`) ou retirer l'affordance hover, pour aligner les deux cartes.
- **P1 / S — correction (C1).** Remplacer le rouge des signaux critiques par un token `--sabc-danger` distinct du rouge marque (cartes anomalies, badges sévérité). Voir section transverse.
- **P1 / M — amélioration (C4).** Introduire un `PageHeader` partagé (`<h1>` + sous-titre + slot action) et l'utiliser ici ET sur Analytics pour unifier l'échelle.
- **P2 / S — amélioration.** Ajouter des deltas/sparklines aux 5 KPI (donnée déjà dans `trendData`).

---

## Page 2 — `pages/Admin/Analytics/Index.tsx` + `index.tsx` (Analytics 360°)

**État actuel.** Shell à 7 onglets (`overview`, `regions`, `roles`, `anomalies`, `individual`, `improvement`, `tendances`), lazy-loadés, avec sélecteur de période global, badge de compteur sur l'onglet anomalies, `Suspense` → `DashboardSkeleton` par onglet.

**Forces.**
- **Architecture d'onglets exemplaire** : `React.lazy` par tab, état dans l'URL (`setSearchParams replace`), badge `destructive`/`secondary` contextuel sur Anomalies. C'est le bon niveau.
- Le sélecteur de période propage un `dateRange` aux 3 premiers tabs.

**Problèmes — dont deux bloquants.**
- **P0 — Doublon de fichier case-collision.** `Index.tsx` et `index.tsx` sont **byte-identical** (vérifié `diff` = IDENTICAL DUPLICATE). Sur un FS sensible à la casse (CI Linux, Docker) c'est deux modules ; sur macOS l'un masque l'autre. Bombe à retardement de build + route ambiguë. **À supprimer immédiatement.**
- **Filtre période = `<select>` natif brut (C10).** Lignes 110-122 : `<select>` HTML nu, alors que `RegionsSections` et `ImprovementPlanSections` utilisent le `Select` shadcn stylé. Trois conventions de filtre coexistent dans la même famille : `<select>` natif (Analytics shell + TendancesTab), `Select` shadcn (Regions, Improvement), et boutons-pills (Anomalies). Incohérence directe C10.
- **Pas de sélecteur de vue ni de barre de filtres unifiée.** ClickUp pose une barre de contrôle persistante (vue + filtres + densité). Ici chaque onglet réinvente ses propres contrôles à des emplacements différents (TendancesTab met ses 2 selects en haut à gauche, RegionsTab dans une card, etc.).
- **Le sélecteur de période ne s'applique qu'à 3 onglets** (overview/regions/roles). Anomalies, Individuel, Improvement, Tendances l'ignorent silencieusement → l'utilisateur croit filtrer globalement mais ne filtre pas. Faux signal d'UX.

**Écart vs ClickUp.** Le shell est proche (tabs + état URL), mais il manque le header contextuel discipliné et la barre de filtres unique. La densité dépend de l'onglet, sans gabarit commun.

**Actions.**
- **P0 / S — correction.** Supprimer le doublon `Index.tsx`/`index.tsx`, garder un seul nom et vérifier la route.
- **P1 / S — correction (C10).** Remplacer le `<select>` période par le `Select` shadcn (déjà importable, utilisé 2 tabs plus loin).
- **P1 / M — amélioration.** Désactiver ou masquer le sélecteur de période sur les onglets qui ne le consomment pas, ou le faire consommer partout, pour supprimer le faux filtre.

---

## Composant transverse — `Components/Analytics/` (module de second-niveau)

**État actuel — code mort.** `AnalyticsKpiOverview`, `AnalyticsFilterPanel` (17 Ko), `CompetencyHeatmapSection`, `RoleCompetencyDetailsSection` (12 Ko), `UserInsightsDrawer`, `useAnalyticsData` (12 Ko), `mockData.ts` (17 Ko)… **vérifié : aucun import hors du dossier lui-même.** ~80 Ko de composants analytiques (dont une heatmap de compétences, le composant le plus « recherché » de toute la famille) ne sont **montés nulle part**.

**Problème.** Soit c'est une fonctionnalité abandonnée (à supprimer), soit une feature prête mais jamais branchée (régression produit majeure : la heatmap de compétences est exactement le type de « vue riche » que la cible ClickUp réclame, et elle dort). Dans les deux cas : dette + confusion pour le prochain dev.

**Actions.**
- **P1 / M.** Décider : brancher `CompetencyHeatmapSection` + `AnalyticsKpiOverview` comme onglet réel d'Analytics 360°, **ou** supprimer le dossier et son `mockData`. Ne pas laisser en l'état.

---

## Onglet — `DashboardTab` + `OverviewSections`

**État actuel.** 4 KPI cards, `PerformanceTrendSection` (ComposedChart aire+barre+ligne, 3 mini-stats, ReferenceLine à 3.5), `StatusDistributionSection` (donut + barres de proportion + total centré), `ChannelBreakdownSection`, `RegionalActivitySection`, `TopRolesSection`.

**Forces.** Le meilleur travail data-viz du repo : tooltip custom partagé, `ReferenceLine` de seuil, donut à total central, barres horizontales triées. C'est « recherché mais efficace ».

**Problèmes.**
- **Couleurs de statut codées en dur, non sémantiques (C1/C7).** `STATUS_COLORS = ['#48BB78', '#D69E2E', '#FF9800', '#3182CE']` (l. 26) : ordre positionnel, pas de mapping statut→couleur. Un statut « retard » peut hériter du vert selon son index. Les pills `<Badge variant="info">` (l. 268) sont toutes bleues quel que soit le statut → C7 (badges non sémantiques).
- **Rouge marque dans les graphes (C1).** `#E53E3E` (= rouge erreur shadcn) sert de couleur de série « Score moyen »/« Évaluations » dans 4 graphes. Le rouge de données se confond avec le rouge d'alerte des anomalies.
- **`md:grid-cols-2 xl:grid-cols-4` pour 4 KPI** : ligne orpheline absente ici (4 = pair), OK. Mais `xl:grid-cols-3` avec Trend en `col-span-2` + Status laisse Status très étroit pour un donut + liste → un peu serré en `xl`.

**Actions.**
- **P1 / S — correction (C7).** Mapper les statuts par clé sémantique (succès=vert, soumis=bleu, retard=ambre, brouillon=gris) au lieu de l'index positionnel ; appliquer la même map aux `Badge`.
- **P2 / M — amélioration.** Sortir `#E53E3E` des séries de données ; réserver le rouge à l'accent, utiliser une palette froide pour les volumes.

---

## Onglet — `AnomaliesTab` + `AnomaliesSections`

**État actuel.** Le plus riche : hero « Centre de supervision » avec filtres-pills, 4 summary cards, « Priorités immédiates », « Signaux récurrents » (Progress bars), table opérationnelle avec actions (Acknowledge, Lancer détection, Rafraîchir).

**Forces.** Vraie qualité : sévérités tokenisées (`SEVERITY_CONFIG`), `Table` shadcn (pas une `<table>` brute !), lignes teintées par gravité (`bg-red-50/40`), actions par ligne, état de chargement par bouton (`animate-spin`), libellés métier traduits (`formatTypeLabel`). C'est le seul onglet vraiment proche ClickUp.

**Problèmes.**
- **Mutations silencieuses (C2).** `acknowledgeMutation` / `runDetectionMutation` n'ont **pas de `onError`** ni de toast de succès. Si l'acknowledge échoue, l'UI invalide la query et… rien. Aucun système de toast monté — C2 confirmé sur la surface la plus critique.
- **Texte de dev en prod.** Le hero parle de « valider que les **seed data** alimentent bien les calculs… avant le branchement progressif des bases en production » (l. 148-151). Copy de dev exposée à l'admin final.
- **Pas de tri/densité sur la table.** La `Table` est stylée mais reste statique : pas de tri colonne, pas de pagination, pas de sélection multiple pour acknowledge en lot (C3 partiel — la table est belle mais « anémique » en interactions).
- **Filtre redondant.** Pills de filtre dans le hero **et** re-décompte dans le header de table ; le filtre `info` n'apparaît pas dans « Priorités immédiates » (filtré `!== 'info'`) ce qui peut désorienter.

**Actions.**
- **P0 / S — correction (C2).** Ajouter `onError` + toast succès/échec sur les deux mutations. Bloquant : action destructive sans feedback.
- **P0 / S — correction.** Retirer le copy « seed data / branchement progressif » du hero.
- **P2 / M — amélioration (C3).** Tri colonnes + acknowledge en lot (checkbox + action groupée).

---

## Onglet — `TendancesTab`

**État actuel.** 2 filtres (`<select>` natifs), ComposedChart bi-axe (score/complétion) + `ChartExportButton`, table résumé.

**Forces.** Bi-axe propre, `connectNulls`, deltas colorés vert/rouge dans la table, bouton d'export (PNG/SVG/PDF).

**Problèmes.**
- **Table 100% brute (C3).** `<table>` HTML nue (l. 162) — pas la `Table` shadcn utilisée dans Anomalies/Improvement. Incohérence de composant à l'intérieur de la même famille : preuve directe de C3 (DataTable jamais importé, tables brutes coexistant avec tables stylées).
- **Filtres `<select>` natifs (C10)** — encore une 3ᵉ implémentation de filtre.
- **`alert()` natif dans l'export (C2).** `ChartExportButton` fait `alert('Aucun SVG trouvé')` (l. 47) → C2 confirmé (alert natif bloquant).
- **`ChartExportButton` hors design system (C1).** Couleurs `border-gray-200`, `text-gray-600` (gris Tailwind par défaut) au lieu des tokens `sabc-gray-*` utilisés partout ailleurs → dérive de tokens. Et dropdown maison non accessible (pas de `role="menu"`, pas de gestion clavier).
- **Δ Score en `text-green-600`/`text-red-600`** : vert/rouge OK mais codés en Tailwind brut, pas tokenisés.

**Actions.**
- **P1 / S — correction (C3).** Migrer la table résumé vers la `Table` shadcn.
- **P1 / S — correction (C2).** Remplacer le `alert()` de l'export par un toast.
- **P2 / S — correction (C1).** Re-tokeniser `ChartExportButton` sur `sabc-gray-*`.

---

## Onglet — `RegionsTab` / `RoleAnalysisTab` / `IndividualSearchTab` / `ImprovementPlansTab`

**État actuel.** Regions : `Select` shadcn + 2 graphes barres + table distribution. RoleAnalysis : 3 summary cards + 2 barres horizontales colorées par seuil + table détail (`TruncatedTableBody`, delta vs moyenne). IndividualSearch : recherche + `TruncatedList` + fiche 360° (cartes hiérarchie/scores/axes). Improvement : 3 `Select` shadcn + totals + breakdown + table décision.

**Forces.**
- **Bonne réutilisation** de cards spécialisées (`HierarchyChainCard`, `ScoresByTypeCard`, `EvaluationHistoryTableCard`).
- RoleAnalysis : **coloration par seuil** (`completion >= 80 ? success : >= 50 ? warning : primary`) — sémantique correcte ici.
- ImprovementRows : `Badge variant="success"/"destructive"` enfin sémantiques + boutons valider/rejeter par ligne.

**Problèmes.**
- **Accents non traduits (`é` manquants).** `RoleAnalysisSummarySection` : « Roles analyses », « Canaux d'evaluation », EmptyState « Aucune donnee… » (l. 91-93, 109, 143). Texte FR sans accents → bâclé, visible à l'écran.
- **Mutations valider/rejeter sans feedback (C2)** dans ImprovementPlansTab (même pattern qu'Anomalies).
- **`avgScore` rouge marque** dans `RoleScoreChartSection` : `ROLE_COLORS[0] = '#E53E3E'` → 1er rôle toujours en rouge marque (C1).
- **États de chargement texte (C6).** IndividualSearch : `AdminSearchLoadingSection` = « Chargement des détails… » (texte), `SearchSections` = « Chargement des utilisateurs… ». Pas de skeleton structurel pour le détail individuel (C6).
- **RegionsTab : auto-sélection** de la 1ʳᵉ région via `useEffect` — OK, mais aucun état vide explicite si `regions` est vide (le `RegionSelectionSection` afficherait un Select vide).
- **Improvement : breakdown bar `fill="#C62828"`** (encore un rouge en dur différent de `#E53E3E` et de `--sabc-red-primary`) → **3 rouges hex distincts** dans la famille (`#E53E3E`, `#C62828`, `#EF4444` dans Tendances). Preuve nette de la double/triple couche de tokens (C1).

**Actions.**
- **P1 / S — correction.** Corriger tous les libellés sans accents (Roles analysés, Canaux d'évaluation, données…).
- **P0 / S — correction (C2).** `onError` + toast sur valider/rejeter Improvement.
- **P1 / S — correction (C1).** Unifier les hex rouge (`#E53E3E`/`#C62828`/`#EF4444`) sur un seul token.
- **P2 / M — amélioration (C6).** Skeleton structurel pour la fiche individuelle au lieu du texte « Chargement… ».

---

## Bug de code repéré (hors UX pur, mais bloque le build propre)

`Components/Charts/PerformanceBarChart.tsx` ligne 7 :
```ts
import { error } from 'console';
```
Import Node `console` dans un composant **navigateur** — auto-import parasite jamais utilisé. Casse potentiellement le bundle / pollue. **P1 / S — correction.** À supprimer.

---

## Synthèse des problèmes transverses C1–C10 dans cette zone

| Code | Présent | Preuve |
|------|---------|--------|
| **C1** rouge marque == rouge erreur + multi-tokens | **OUI, fort** | `#E53E3E` (séries data + alertes), `#C62828` (Improvement), `#EF4444` (Tendances), `text-sabc-red-primary` — 3+ rouges hex pour la même intention ; `bg-red-100 text-red-600` pour anomalies sur le Dashboard |
| **C2** pas de Toast, alert()/mutations silencieuses | **OUI, fort** | Acknowledge/runDetection/validate/reject **sans `onError`** ni toast ; `alert()` dans `ChartExportButton` |
| **C3** DataTable=0, tables brutes | **OUI, partiel** | `<table>` HTML brute dans `TendancesTab` vs `Table` shadcn dans Anomalies/Improvement/Roles ; aucune table avec tri/densité/sticky |
| **C4** pas de PageHeader, échelles de titre divergentes | **OUI** | Dashboard sans `<h1>` (ouvre sur `<h2 text-base>`) vs Analytics `<h1 text-2xl>` |
| **C5** dark mode | **Partiel** | La plupart des sections ont `dark:` mais les graphes Recharts utilisent des hex fixes (`#fff`, `#FFFFFF` tooltip de `PerformanceBarChart`) → tooltips/fonds blancs en dark |
| **C6** pas d'EmptyState riche / skeletons | **Partiel** | `EmptyState` câblé partout (bien) **mais** minimaliste (texte + bordure dashed, pas d'illustration ni CTA) ; `AdminSearchLoadingSection` = texte « Chargement… » au lieu de skeleton |
| **C7** statuts/badges non sémantiques | **OUI** | `StatusDistributionSection` : `STATUS_COLORS` par index positionnel ; `<Badge variant="info">` (bleu) pour tous les statuts |
| **C8** window.location / fetch brut | **NON (bon point)** | React Router (`Link`, `useSearchParams`) + React Query partout dans cette zone |
| **C10** formulaires/filtres bruts | **OUI** | 3 implémentations de filtre coexistent : `<select>` natif (Analytics shell, Tendances), `Select` shadcn (Regions, Improvement), pills (Anomalies) |

**Bonus dette (hors C1-C10) :** module `Components/Analytics/` entier en code mort (~80 Ko, dont la heatmap de compétences) ; doublon `Index.tsx`/`index.tsx` ; import `console` parasite ; copy de dev (« seed data ») exposée.

---

## Top priorités (ordonnées)

1. **P0/S** — Supprimer le doublon `pages/Admin/Analytics/Index.tsx` vs `index.tsx` (build cassé sur FS sensible à la casse).
2. **P0/S** — Toasts + `onError` sur toutes les mutations (acknowledge, runDetection, validate, reject) ; remplacer `alert()` de l'export (C2).
3. **P0/S** — Retirer le copy de dev « seed data / branchement progressif » du hero Anomalies.
4. **P1/M** — Trancher le sort du module `Components/Analytics/` (brancher la heatmap ou supprimer).
5. **P1/M** — `PageHeader` partagé + unifier le composant de filtre sur `Select` shadcn (C4, C10).
6. **P1/S** — Unifier les hex rouge sur un token unique distinct du rouge danger (C1) ; corriger les libellés sans accents ; supprimer `import { error } from 'console'`.
7. **P2/M** — Statuts sémantiques (C7), skeletons structurels pour la fiche individuelle (C6), tri/sélection en lot sur la table anomalies (C3).

**Fichiers clés concernés :**
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Analytics/Index.tsx` + `index.tsx` (doublon)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Dashboard/index.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Dashboard/Admin/Tabs/AnomaliesTab.tsx`, `TendancesTab.tsx`, `ImprovementPlansTab.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Dashboard/Admin/Sections/AnomaliesSections.tsx` (copy dev l.148-151), `OverviewSections.tsx` (STATUS_COLORS l.26), `RoleAnalysisSections.tsx` (libellés sans accents l.91-93), `ImprovementPlanSections.tsx` (#C62828 l.145)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Charts/ChartExportButton.tsx` (alert + tokens gris bruts), `PerformanceBarChart.tsx` (import console l.7)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Analytics/` (module mort entier)


---


<!-- famille:Admin Évaluations (core) -->

# Critique UX/UI — Famille « Admin · Évaluations (core) »

## Verdict global : **54/100**

Deux applications cohabitent dans ce dossier. D'un côté, une **génération « ancienne »** (mock data, `inertia-shim`, `window.location`) survit en fichiers morts. De l'autre, une **génération « actuelle »** (React Query + Suspense, `AdminEvaluationsLayout`, API NestJS réelle) est correctement branchée et déjà honnête sur le plan composants. Le socle vivant (Management/History/Periodes/Show/Form) est **propre, cohérent entre lui, sémantiquement bien plus mûr** que le reste de l'app — c'est la meilleure famille auditée jusqu'ici sur les statuts (C7 largement résolu en local) et les états vides. Mais il reste **loin de la cible ClickUp** : pas de vrai header contextuel partagé, tables anémiques (C3), aucun toast (C2), formulaires à labels OK mais sans système de validation, et surtout **du code mort dangereux** qui fausse toute lecture de cohérence.

**Point dur à régler avant tout** : `index.tsx`, `Templates.tsx` (fichier plat) et tout `pages/Evaluation/` ne sont **importés nulle part** dans `app.tsx`. Ce sont des fantômes en mock data. Ils ne doivent ni guider le design, ni être « améliorés » — ils doivent être **supprimés**.

---

## Cartographie vivant / mort (preuve)

Routes réelles dans `app.tsx` :
- `/admin/evaluations/periodes` → `Periodes.tsx` ✅ vivant
- `/admin/evaluations/management` → `Management.tsx` ✅ vivant
- `/admin/evaluations/history` → `History.tsx` ✅ vivant
- `/admin/evaluations/:id` → `Show.tsx` ✅ vivant
- `/admin/evaluations/form` → `Form.tsx` ✅ vivant
- Templates → `Templates/Index.tsx` (sous-dossier) ✅ vivant

**Fichiers morts (aucun import) :**
- `Admin/Evaluations/index.tsx` (576 l.) — mock data, `Link` d'`inertia-shim`, badges hex hard-codés.
- `Admin/Evaluations/Templates.tsx` (265 l., fichier plat) — doublon mort du sous-dossier `Templates/` vivant.
- `pages/Evaluation/Index.tsx` + `Create/Edit/Show.tsx` (3 fichiers **0 octet**).
- `CreateTemplate.tsx.bak`.

> **[P0 / S — CORRECTION]** Supprimer ces fichiers. Tant qu'ils existent, n'importe quel dev peut les rebrancher par erreur, et ils polluent le verdict de cohérence transverse (ils contiennent à eux seuls la moitié des violations C1/C7/C8 de la zone).

---

## Page par page

### 1. `Management.tsx` — Pilotage global *(vivant)*

**État actuel.** Header maison (titre + sous-titre + 3 actions à droite), 4 KPI cards, table « Périodes en cours » (6 lignes), puis 3 cartes (Statuts / Canaux / Actions rapides) avec `Progress` colorées sémantiquement.

**Forces.**
- Données **réelles** via `useSuspenseQuery` sur 3 endpoints analytics. Plus aucun mock.
- `getStatusPresentation` / `getChannelPresentation` produisent des **pills sémantiques propres** (emerald/sky/amber distincts du rouge marque) — **C7 résolu ici**, exemplaire.
- Cap KPI respecté (4 < 7), icônes Lucide cohérentes.
- Empty states textuels présents partout (« Aucune donnée. », « Aucune période disponible. »).

**Problèmes.**
- *Hiérarchie / redondance* : la barre d'actions duplique exactement les `quickActions` de la 3ᵉ carte (Périodes/Historique). Deux fois la même navigation à 30 cm d'écart.
- *Densité* : la ligne 173–176 entasse 4 cards KPI sur une seule ligne JSX illisible — dette de lisibilité, pas visuelle, mais symptôme de composant non factorisé (`<KpiCard>`).
- *Table anémique (C3)* : « Périodes en cours » = `slice(0,6)`, **pas de tri, pas de lien par ligne, pas de hover, pas de sticky**. Une période cliquée ne mène nulle part alors que `Periodes.tsx` existe.
- *Décoratif gratuit* : `bg-gradient-to-r ... to-sabc-red-primary/5` sur le CardHeader — rouge marque détourné en ornement de fond, contraire à la discipline « rouge = action/critique uniquement » (**C1**).
- *Statut période en texte brut* : colonne « Statut » rend `'Ouverte'/'Fermée'/'Planifiée'` en **string nue**, alors que la même page sait faire des pills 20 lignes plus bas. Incohérence interne.

**Écart cible ClickUp.** Pas de header contextuel partagé (breadcrumb absent), pas de sélecteur de vue, table sans interactions. C'est un « dashboard de pilotage » correct mais statique.

**Actions.**
- [P1 / M — AMÉLIORATION] Rendre la table périodes cliquable (ligne → `/admin/evaluations/periodes` filtré) + pill de statut réutilisant `getStatusPresentation`.
- [P2 / S — AMÉLIORATION] Supprimer la duplication actions/quickActions (garder les quickActions, alléger le header à la seule action primaire « Nouvelle évaluation »).
- [P2 / S — CORRECTION] Retirer le gradient rouge décoratif du header (**C1**).
- [P2 / S] Extraire `<KpiCard icon title value tone>` et factoriser les 4 + ceux de Periodes.

---

### 2. `History.tsx` — Historique *(vivant)*

**État actuel.** Header maison, carte « Filtres » contenant **un seul `<select>` natif**, table paginée (30/page) avec `StatusBadge`, pagination maison fenêtrée.

**Forces.**
- Pagination serveur réelle + composant `Pagination` propre (fenêtre ±2, états disabled corrects).
- `StatusBadge` sémantique (gris/accent/vert/rouge), normalisation `valide→validé`.
- Empty state présent. `formatPerson`/`formatDate` robustes (gère `N/A`).

**Problèmes.**
- *Composant trop simple (C3 + C10)* : filtre = `<select>` HTML natif brut au lieu du `Select` shadcn utilisé dans `Form.tsx`. **Incohérence intra-famille flagrante** : deux pages voisines, deux composants de sélection différents. Et une carte entière (« Filtres » + CardHeader) pour un seul dropdown = gâchis vertical.
- *Filtrage trompeur* : le filtre statut s'applique **côté client sur la page courante uniquement** (`rows.filter`), pas côté serveur. L'utilisateur filtre « Rejeté » et ne voit que les rejetés *de la page 1*. Bug UX réel.
- *Export menteur* : « Export rapide » = `window.print()`. Le label promet un export, l'action lance l'impression navigateur. **C2/C10** — incohérent avec le module Reports (commits 8.x) qui fait du vrai PPTX/XLSX.
- *Table C3* : pas de tri colonnes, pas de densité, pas de sticky header sur 30 lignes, hover non stylé.
- *Doublon de titre* : « Évaluations (N) » en CardTitle alors que le header annonce déjà « N évaluations au total » — deux compteurs, deux sémantiques (filtré vs total), aucune explication.

**Écart cible.** Filtres riches attendus (multi-critères type/période/région comme le mock mort tentait, mais en vrai), tri, densité. Là c'est une liste paginée mono-filtre.

**Actions.**
- [P1 / M — CORRECTION] Passer le filtre statut **côté serveur** (param API) — sinon la pagination ment.
- [P1 / S — CORRECTION] Remplacer le `<select>` natif par `<Select>` shadcn (aligner sur Form.tsx).
- [P1 / S — CORRECTION] Renommer « Export rapide » → « Imprimer », ou brancher le vrai export du module Reports.
- [P2 / M — AMÉLIORATION] Fusionner header + filtres dans une **vraie toolbar contextuelle** (recherche + multi-filtres + densité), supprimer la carte « Filtres » dédiée.

---

### 3. `Periodes.tsx` — CRUD périodes *(vivant)*

**État actuel.** La page **la plus aboutie** de la zone : KPI x4, recherche, table CRUD complète, `Dialog` shadcn pour create/edit avec pré-remplissage intelligent (`buildSuggestedForm`), gestion d'erreur intra-modal.

**Forces.**
- `buildSuggestedForm` : nomenclature auto P{AA}{SS}, anti-collision, date début future, durée 90 j dans la fenêtre 7–180. **Vraie intelligence métier, UX premium.**
- Erreur de sauvegarde **reste dans le modal** (`modalError`) sans le fermer — exactement le bon pattern.
- Bouton « Ouvrir/Fermer » désactivé + `title` explicatif si période clôturée. États d'action soignés.
- Empty state présent, dates formatées, taux affiché.

**Problèmes.**
- *C2* : `window.confirm('Supprimer cette période ?')` natif pour une suppression destructive. Aucun `AlertDialog`, aucun toast de confirmation post-action — le `feedback`/`error` sont des **bandeaux statiques** non auto-dismiss qui ne disparaissent jamais (pas de timer ~5s).
- *Feedback non sémantiquement distinct* : le bandeau erreur réutilise `bg-sabc-red-light` + `text-sabc-red-primary` = **rouge marque == rouge erreur (C1)**, exactement le diagnostic transverse.
- *Table C3* : pas de tri (utile sur dates/taux), pas de hover, 3 boutons texte par ligne = barre d'actions lourde qui devrait passer en menu `...` au hover ou icônes seules avec tooltips.
- *Recherche dans la card* : `Input` de recherche dans le CardContent au lieu d'une toolbar de table cohérente avec les autres pages.
- *Colonne « Taux »* : nombre brut `42%` sans mini-barre de progression, alors que `Progress` est déjà importé ailleurs dans la famille.

**Écart cible.** Proche, mais la destruction sans `AlertDialog` et les bandeaux non-toast sont les deux écarts ClickUp majeurs.

**Actions.**
- [P0 / M — CORRECTION] Remplacer `window.confirm` par `AlertDialog` shadcn + monter un système de **Toast** pour feedback/error auto-dismiss (**C2**).
- [P1 / S — CORRECTION] Différencier visuellement bandeau erreur du rouge marque (ambre/rouge-erreur distinct) — **C1**.
- [P2 / S — AMÉLIORATION] Colonne Taux → `Progress` inline + tri sur dates/taux.
- [P2 / S] Actions ligne → icônes + tooltips ou menu kebab au hover.

---

### 4. `Show.tsx` — Détail d'une évaluation *(vivant)*

**État actuel.** La page la plus **riche visuellement** : hero card en dégradé, deux cartes profils (Avatar), synthèse admin (note globale en gros, audit temporel, alertes commentaires/validation), `ActiveRulesCard`, liste des critères notés avec commentaires.

**Forces.**
- Vraie hiérarchie de lecture : hero → acteurs → synthèse → critères. Layout `md:grid-cols-[340px,1fr]` propre.
- Empty states corrects (Alert « Pas de critères », « Aucun commentaire »).
- Réutilise `buildEvaluationContext`, `ActiveRulesCard`, `formatEvaluationType` — **bonne factorisation transverse**.
- Avatars sémantiques (évaluateur neutre / évalué `variant="warning"`).

**Problèmes.**
- *C1 partout* : hero `from-white ... to-sabc-red-light/40`, encart note globale `bg-sabc-red-light/60` + `text-sabc-red-primary` **en grand 4xl**. La note globale — qui peut être excellente — est peinte en **rouge marque**, contredisant frontalement « rouge = critique ». Une note de 4.8/5 affichée en rouge envoie un faux signal d'alerte.
- *Aucune action admin réelle* : une page admin de détail **sans bouton Valider/Rejeter/Réouvrir**. Seuls « Retour », « Vue utilisateur », « Export rapide » (= `window.print()` encore). Le mock mort `index.tsx` proposait Valider/Rejeter ; le vivant les a **perdus**. Régression fonctionnelle majeure pour un admin.
- *Badges critères en `secondary` gris uniforme* : section, poids, note → tous gris (**C7 local**), alors que la note /5 mériterait un ton selon le score.
- *Export menteur* (C2/C10), idem History.

**Écart cible.** Visuellement c'est presque ClickUp, mais l'absence d'actions sur la décision en fait une fiche **morte** (lecture seule) là où l'admin attend de pouvoir agir.

**Actions.**
- [P0 / M — CORRECTION] Recolorer la note globale en **neutre + ton sémantique selon score** (vert/ambre/rouge-erreur), retirer le rouge marque décoratif du hero et de l'encart (**C1**).
- [P1 / L — AMÉLIORATION] Réintroduire les actions admin (Valider / Rejeter / Réouvrir) en zone primaire, conditionnées au statut, avec `AlertDialog` + toast.
- [P2 / S] Note /5 par critère en pill sémantique.

---

### 5. `Form.tsx` — Création d'évaluation *(vivant)*

**État actuel.** Formulaire 3 champs (`Select` période / cible / règle) + colonne « Récapitulatif » live + carte « Pré-conditions », filtrage des règles applicables selon rôle/type.

**Forces.**
- **Utilise `Select` shadcn pour les FK** (période, cible, règle) — **C10 résolu ici**, contrairement à History.
- Logique métier solide : `filterApplicableRules`, auto-sélection 1ʳᵉ option, type déduit du bucket éligible.
- Récapitulatif live à droite = excellent feedback de saisie. Effets de réinitialisation de règle corrects.

**Problèmes.**
- *Gestion d'erreur C1* : encart erreur en `bg-sabc-red-light` + `text-sabc-red-primary` (rouge marque == erreur).
- *Pas de système de validation (C10)* : `disabled` booléen brut, aucun message par champ, aucun feedback de succès (toast) avant la redirection. Si `create` réussit sans `id`, redirige silencieusement vers `/evaluations`.
- *Labels OK mais pas de composant `Form`* : `<label>` + `Select` à la main, pas de `FormField`/`FormMessage`. Cohérent visuellement mais non systématisé.
- *Carte « Pré-conditions » = texte mort* : 3 phrases statiques. Devrait être un **checklist live** (✓ période ouverte, ✓ cible éligible, ✓ règle attachée) reflétant l'état réel de la sélection.
- *Header maison* (encore) : titre + sous-titre + bouton retour, pas le `PageHeader` partagé (**C4**).

**Écart cible.** Bon formulaire fonctionnel, mais sans validation système ni feedback de succès, et la colonne pré-conditions rate l'occasion d'un vrai guidage.

**Actions.**
- [P1 / S — CORRECTION] Encart erreur distinct du rouge marque (**C1**) + toast de succès post-création.
- [P2 / M — AMÉLIORATION] Transformer « Pré-conditions » en checklist dérivée de l'état (validation live).
- [P2 / S] Migrer vers `Form`/`FormField` pour messages par champ.

---

### 6. `shared.tsx` — `AdminEvaluationsLayout`

**État actuel.** Wrapper de 27 lignes : `AppLayout` + `Head` + `<div className="space-y-6 p-6">`.

**Problèmes.**
- *C4 confirmé* : ce « shared » ne fournit **ni PageHeader, ni breadcrumb, ni zone d'action standardisée**. Résultat : **chaque page réimplémente son propre header** (`flex justify-between` + `h1 text-2xl` + actions), d'où la redondance et les micro-divergences. Le titre passé en prop sert uniquement au `<Head>`, jamais affiché — chaque page re-écrit son `<h1>`.
- C'est le **bon endroit** pour corriger C4 et C2 d'un coup (header + slot toast).

**Actions.**
- [P0 / M — CORRECTION] Enrichir en `PageHeader` réel : `title` (affiché), `breadcrumb`, slot `actions`. Supprimer les 6 `<h1 text-2xl>` dupliqués des pages.
- [P1 / S] Monter le `<Toaster>` ici une fois pour toute la famille (**C2**).

---

### 7. Fichiers morts — `index.tsx`, `Templates.tsx` (plat), `Evaluation/`

Non routés. Bourrés de mock data, `inertia-shim` `Link`, `bg-sabc-red-primary` sur badges de **type** (auto-éval en rouge marque, C1), `window.confirm` implicite, spinner plein écran `Chargement` (C6), `<select>`/`<input>` natifs (C10), full-reload `Link` (C8).

> **[P0 / S — CORRECTION] Supprimer.** Ne pas auditer plus loin, ne pas améliorer. Leur seule présence fausse la cohérence et invite à la régression.

---

## Synthèse problèmes transverses (C1–C10) dans la zone

| Code | Présent ? | Preuve dans le vivant |
|------|-----------|------------------------|
| **C1** rouge marque == rouge erreur / décoratif | **OUI, systémique** | `Periodes` bandeau erreur `bg-sabc-red-light/text-sabc-red-primary` ; `Show` note globale 4xl en rouge marque + hero gradient rouge ; `Form` erreur idem ; `Management` gradient header rouge |
| **C2** aucun Toast, alert/confirm natifs | **OUI** | `Periodes` `window.confirm` + bandeaux feedback non auto-dismiss ; aucun `<Toaster>` ; toutes mutations sans toast |
| **C3** tables anémiques, 0 tri/filtre/densité/sticky/hover | **OUI, toutes les tables** | `Management`, `History`, `Periodes` : aucune n'a tri/densité/sticky ; aucun usage de DataTable |
| **C4** pas de PageHeader/PageContainer partagé | **OUI** | `shared.tsx` n'expose pas de header → 6 `<h1 text-2xl>` réimplémentés à la main |
| **C5** dark mode | partiel | code vivant n'a quasi aucune classe `dark:` (sera cassé) ; fichiers morts ont du `dark:` éparpillé |
| **C6** pas d'EmptyState riche / skeletons | partiel | empty states **textuels** présents (mieux que le reste de l'app) mais **non illustrés + sans CTA** ; Suspense sans skeleton structurel |
| **C7** statuts non sémantiques | **résolu en grande partie** | `Management`/`History` ont de vraies pills sémantiques ✅ ; reste : statut période en texte brut (`Management`), badges critères gris (`Show`) |
| **C8** window.location / fetch bruts | résolu dans le vivant | code vivant = React Router + React Query ✅ ; uniquement les **fichiers morts** utilisent `inertia-shim`/full reload |
| **C10** formulaires bruts | **mitigé** | `Form` utilise `Select` FK ✅ ; mais `History` `<select>` natif, aucune page n'a de système `Form`/`FormMessage`/validation |

---

## Top priorités (ordonnées)

1. **[P0/S]** Supprimer le code mort (`index.tsx`, `Templates.tsx` plat, `pages/Evaluation/*`, `.bak`). Pré-requis à toute mesure de cohérence.
2. **[P0/M]** `shared.tsx` → vrai `PageHeader` + `<Toaster>` monté une fois (résout C4, ouvre la voie à C2).
3. **[P0/M]** Découpler rouge marque / rouge erreur / score (C1) : bandeaux d'erreur, note globale `Show`, gradients décoratifs.
4. **[P0/M]** `Periodes` : `AlertDialog` au lieu de `window.confirm` + toasts auto-dismiss (C2).
5. **[P1/L]** `Show` : réintroduire les actions admin Valider/Rejeter (régression fonctionnelle vs ancien mock).
6. **[P1/M]** `History` : filtre statut **côté serveur** + `Select` shadcn + renommer/brancher l'export.
7. **[P1/M]** Tables → tri/hover/densité/sticky (C3), idéalement via un DataTable partagé.

**Fichiers concernés (chemins absolus) :**
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/shared.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Management.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/History.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Periodes.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Show.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Form.tsx`
- À supprimer : `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/index.tsx`, `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Templates.tsx`, `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/CreateTemplate.tsx.bak`, `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Evaluation/` (dossier entier).


---


<!-- famille:Admin Règles & Templates -->

# Critique UX/UI — Famille « Admin · Règles & Templates »

## Verdict

**Note : 41 / 100.**

Le sous-domaine est **schizophrène**. D'un côté, **Règles** (Index/Create/Edit/RuleForm + CriteresEditor) est un travail sérieux, branché sur l'API, avec une matrice de compatibilité ClickUp-like intelligente et un éditeur de critères structuré (pas de JSON brut — bonne surprise). De l'autre, **Templates** est une coquille : `Index`/`Assignations` sont réels, mais **`Create`, `Edit` et `Show` sont des maquettes mortes** — données fictives codées en dur, `setTimeout`, `console.log` au submit, `alert()`, un `AppLayout` et un `inertia-shim` qui n'appartiennent plus à l'architecture, et des liens de retour vers une route inexistante (`/admin/evaluation/templates`, au singulier). Concrètement : **un admin ne peut ni créer, ni éditer, ni consulter un template**. C'est un trou fonctionnel béant maquillé en page finie, ce qui est pire qu'une page vide honnête.

La note est tirée vers le bas non par l'esthétique (correcte) mais par la **fausse complétude** et l'**incohérence structurelle** entre deux moitiés du même menu.

---

## RÈGLES

### `Regles/Index.tsx` — Matrice de compatibilité

**État actuel.** Header titre + sous-titre, toggle de vue (Matrice/Liste), 4 KPI, et soit une matrice rôle×rôle cliquable par type d'évaluation (tabs), soit une table catalogue. Modal piloté par cellule pour créer/éditer/activer/supprimer. Branché sur React Query + `useSuspenseQuery`, mutations avec invalidation propre.

**Forces.**
- La **matrice cliquable** est la meilleure idée de tout le périmètre : dense, scannable, vraiment ClickUp/Linear dans l'esprit. Sticky sur la première colonne, légende explicite, diagonale auto-évaluation signalée, tooltips par cellule.
- Sémantique de couleur **correcte** sur les cellules : vert = actif, ambre = inactif, gris = inexistant. C8 et C7 sont respectés ici.
- Modal contextuel pré-remplissant le couple+type vers Create : excellent flux.

**Problèmes.**
- **Esthétique/cohérence (P1) :** le toggle de vue et les tabs de type utilisent `bg-sabc-red-primary` pour l'état actif. Or le rouge marque sert déjà au bouton primaire « Nouvelle règle » juste à côté. Résultat : **3 zones rouges simultanées** dans le header, l'œil ne sait plus où est l'action. Le langage cible impose le rouge pour l'action primaire OU l'actif, pas les deux dans la même bande. → C1. Passer les états actifs de toggle/tabs sur un neutre froid (fond gris-200 + texte gray-900) et réserver le rouge au seul bouton primaire.
- **Header (P1, C4) :** double titre. `AdminEvaluationsLayout title="Règles d'évaluation"` ET un `<h1>` redondant dans le body. Pas de PageHeader partagé : breadcrumb absent, le `<h1 className="text-2xl">` est répété à la main dans 4 pages avec une échelle non tokenisée.
- **Table catalogue (vue Liste) (P1, C3) :** table brute `<table>` sans tri, sans filtre, sans densité, sans sticky header, sans actions au hover — alors que l'onglet Templates juste à côté utilise le composant `<Table>` de la DataTable. **Incohérence directe au sein du même module.** Les deux toggles « Liste » devraient partager le même composant.
- **États vides (P2, C6) :** « Aucune règle d'évaluation définie. » centré, sans illustration ni CTA. La matrice a au moins une légende, mais la liste vide est anémique.
- **Chargement (P2, C6) :** `useSuspenseQuery` sans boundary visible ici — à vérifier que le fallback Suspense est un skeleton structurel et non un spinner plein écran.
- **Densité KPI :** 4 cartes correctes, sous le cap 5-7. RAS.

**Écart cible.** Faible-moyen. La matrice est au niveau, la vue liste est en retard d'une génération de composant.

### `Regles/RuleForm.tsx` + `Create.tsx` + `Edit.tsx`

**État actuel.** Formulaire long en cartes empilées : Infos générales, Contexte (3 Select FK), Contraintes, Visibilité, Analytics, Critères. Create/Edit câblent l'API, gèrent les erreurs serveur dans un bandeau rouge, pré-remplissage depuis l'URL.

**Forces.**
- **Vrais `Select` pour les FK rôles/type** (C10 respecté ici, contrairement à la moyenne du projet).
- Découpage en sections thématiques lisible, gestion d'erreur serveur présente.
- Le contexte est pré-rempli depuis la matrice : continuité de flux remarquable.

**Problèmes.**
- **Composants trop simples (P1, C10) :** les `<textarea>` (description) et surtout **toutes les checkboxes sont des `<input type="checkbox">` natifs** stylés à la main (`rounded border-sabc-gray-200`), alors qu'un composant `<Checkbox>` shadcn existe (utilisé dans Templates/Create). Encore une incohérence intra-module : Règles utilise du natif, Templates du composant. Uniformiser sur `<Checkbox>` et `<Textarea>`.
- **Validation (P1, C10) :** pas de système de Form (react-hook-form/zod). Les `errors` sont un `Record<string,string>` injecté manuellement, l'astérisque `*` n'est pas relié à une validation client. Le bouton submit n'est jamais désactivé sur invalidité (contrairement à Templates qui le fait). Le total des poids des critères peut être ≠ 100 % et rien ne bloque côté form.
- **Hiérarchie (P2) :** 7 cartes de même poids visuel empilées → mur uniforme. Pas de stepper ni d'ancrage. Sur un form aussi long, l'absence de sommaire latéral ou de progression nuit. Cible ClickUp : panneau sticky de récap + sections ancrées.
- **Champ Échelle (P2) :** affiché en `Input disabled` (1 à 5) — donne l'illusion d'un champ éditable grisé alors que c'est juste de l'affichage. Utiliser un texte/badge, pas un input désactivé.
- **Header de retour (P2, C4) :** RuleForm refait SON header avec bouton Retour + `<h1>`, dans une page déjà titrée par le layout → 3e variante de header dans le module.

### `CriteresEditor.tsx`

**État actuel.** Liste de cartes-critères avec barre de pondération totale (vert si =100, rouge sinon), min 5 critères, champs structurés (libellé, poids, section, niveau, seuil commentaire, axe, tags).

**Forces.**
- **PAS de JSON brut** — c'est l'écueil annoncé et il est évité. Éditeur visuel propre, barre de progression de pondération couleur-sémantique : bon feedback. Tags en input CSV correct.

**Problèmes.**
- **Anti-pattern React (P0, S) :** `useEffect(() => onChange(criteres), [criteres, onChange])` couplé à `useState(value)` synchronisé par un autre `useEffect`. C'est un **état dupliqué** (le parent détient déjà `data.criteres`). Risque de boucle de rendu / désync. Lever l'état local, piloter directement depuis les props.
- **Bouton « Ajouter un critère » (P1, C1) :** `bg-sabc-accent` (une 3e couleur d'accent !) alors que tout le reste du module est rouge/neutre. Introduit une 4e teinte d'action. Aligner sur le système.
- **Esthétique (P2) :** barre de pondération à `bg-sabc-accent` quand <100 — encore l'accent parasite. Devrait être ambre (en cours) → vert (atteint) → rouge (dépassé), strictement sémantique.
- **Échelle figée (P2) :** min/max en inputs disabled, comme dans RuleForm. Idem, à remplacer par un affichage.

---

## TEMPLATES

### `Templates/Index.tsx`

**État actuel.** La **seule page Templates correcte**. Header, 3 KPI sémantiques (publiés=vert, brouillons=ambre), recherche, vraie DataTable `<Table>`, badges sémantiques (`success`/`warning`/`secondary`), menu d'actions `DropdownMenu`, feedback inline avec auto-dismiss.

**Forces.**
- Utilise le **composant Table partagé** (C3 résolu ici) et des **badges sémantiques** (C7 résolu). Menu kebab propre. Bandeaux feedback/erreur avec timeout ≈ pseudo-toast.

**Problèmes.**
- **C2 (P1, S) :** suppression via `window.confirm('Supprimer ce template ?')` natif. Plus, le feedback est un bandeau maison auto-dismiss, pas un vrai système de Toast monté. À migrer vers Toast + dialog de confirmation.
- **Recherche (P2) :** `<input>` brut au lieu du composant `Input` ; pas de debounce, pas d'icône loupe intégrée.
- **États vides/chargement (P2, C6) :** vide = simple `<p>` centré (pas d'EmptyState illustré + CTA). `useSuspenseQuery` → vérifier skeleton.
- **Liens (P2) :** « Voir » route vers `?id=` en query au lieu d'un path param REST `/templates/:id` — incohérent avec « Modifier » qui utilise `/:id/edit`.

### `Templates/Assignations.tsx` — Matrice template/rôle/période

**État actuel.** Sélecteur de période, bandeau read-only si période ouverte, table rôle→`<select>` template publié→statut. Branché sur l'API (`useQuery`).

**Forces.**
- **Logique métier solide :** verrouillage en lecture seule sur période ouverte, n'offre que les templates *publiés*, assignation/désassignation via le même select. Concept correct.

**Problèmes.**
- **Composants natifs partout (P1, C10) :** le sélecteur de période et chaque cellule sont des `<select>` HTML natifs — pas le composant `Select`. Rupture visuelle nette avec RuleForm qui, lui, utilise `<Select>`. **Troisième incohérence de composant FK dans le même domaine.**
- **Table (P1, C3) :** `<table>` brute avec `border border-sabc-gray-200` sur chaque cellule → rendu « tableur Excel » daté, à l'opposé de la DataTable de l'Index Templates voisin.
- **C2 / mutations silencieuses (P0, S) :** `assignMutation` et `removeMutation` n'ont **aucun `onError`** et aucun feedback de succès. L'admin change une assignation et **rien ne confirme ni n'alerte** en cas d'échec. Sur une action structurante (qui template évalue qui), c'est inacceptable.
- **Statut (P2, C7) :** pills `bg-green-100/text-green-700` en couleurs Tailwind crues au lieu des tokens `sabc-success`, et incohérentes avec les `<Badge variant>` de l'Index.
- **Chargement (P2, C6) :** `Chargement…` texte brut. Header sans bouton primaire (le select de période est à droite, OK, mais pas d'action « Tout assigner » / « Copier période précédente » qui serait l'attendu ClickUp).
- **Layout du header :** le `<select>` de période sert de filtre primaire mais n'est pas dans une barre de filtres structurée.

### `Templates/Create.tsx` & `Templates/Edit.tsx` — ⚠️ MAQUETTES MORTES

**État actuel.** **Non fonctionnelles.** `mockUser` codé en dur, `initialTemplateData`/sections fictives, `handleSubmit` qui fait `console.log` et **ne soumet rien**, `alert()` de validation, `<AppLayout>` + `<Head>` + `<Link>` issus de `@/lib/inertia-shim` (vestige Laravel/Inertia banni par le CLAUDE.md), liens « Retour/Annuler » vers `/admin/evaluation/templates` (**route au singulier — 404**).

**Problèmes — par sévérité.**
- **P0 (L) — Aucune persistance.** Création et édition impossibles. C'est le défaut #1 du périmètre. À recâbler sur `templatesApi` (create/update) + React Query, navigation `useNavigate`, suppression de tout le mock.
- **P0 (S) — Routes cassées.** `/admin/evaluation/templates` n'existe pas (le module est `/admin/evaluations/templates`). Tous les retours sont morts.
- **P0 (S) — Architecture interdite.** `inertia-shim`, `AppLayout`, `Head`, `mockUser` : ces pages **n'utilisent même pas** `AdminEvaluationsLayout` comme les autres. Incohérence de layout totale (C4, C8).
- **P1 (M) — Modèle de données divergent.** Create/Edit modélisent *sections → compétences (libellé/obligatoire)*, alors que `Show` et l'API parlent de *critères pondérés*, et `Assignations` de templates « publiés ». **Trois modèles mentaux incompatibles** dans un même module. À réconcilier sur le schéma backend réel.
- **P1 (S) — C2 :** `alert()` de validation.
- **P2 — `CardFooter` importé jamais utilisé**, `Select` importé du mauvais chemin (`/Select/Select` vs `/Select` ailleurs), `sectionIndex`/`compIndex` inutilisés.

### `Templates/Show.tsx` — ⚠️ MAQUETTE MORTE

**État actuel.** `setTimeout(800ms)` qui pose des **données fictives** (« Évaluation 360° Standard », critères Leadership/Communication…). Aucun appel API. `inertia-shim`, `AppLayout`, spinner plein écran `animate-spin`.

**Problèmes.**
- **P0 (M) — Données mockées.** N'affiche jamais le vrai template. Le bouton Modifier route vers la maquette Edit également morte.
- **P1 (S) — C6 :** spinner `border-t-2` plein écran (anti-pattern explicitement proscrit), à remplacer par skeleton structurel.
- **P1 (S) — C8 :** `<Link>` inertia + `AppLayout`, hors architecture.
- **P2 — C7 :** `getStatusBadge` réinvente les badges avec `className="bg-sabc-success"` au lieu des `variant` sémantiques utilisés dans l'Index.

---

## Synthèse des problèmes transverses (preuves)

| Code | Présent | Preuve dans ma zone |
|---|---|---|
| **C1** rouge marque = rouge action partout | **Oui** | Index Règles : toggle + tabs + bouton primaire tous en `bg-sabc-red-primary` simultanément. CriteresEditor : `bg-sabc-accent` (4e teinte). |
| **C2** pas de Toast, alert/confirm natifs | **Oui** | Templates/Index `window.confirm`; Templates/Create+Edit `alert()`; Assignations **mutations sans aucun feedback ni onError**. |
| **C3** DataTable non adoptée vs tables brutes | **Oui (partiel)** | Index Templates utilise `<Table>` ; mais Règles/Index (vue liste), Règles matrice, et Assignations utilisent des `<table>` brutes. |
| **C4** pas de PageHeader partagé, échelles de titre | **Oui** | Double titre (layout + `<h1>`) sur Règles ; RuleForm refait un 3e header ; pas de breadcrumb. |
| **C6** pas d'EmptyState/skeleton, spinners | **Oui** | Show.tsx spinner plein écran ; Assignations `Chargement…` ; états vides = `<p>` centrés sans CTA. |
| **C7** badges non sémantiques | **Partiel** | Index Templates OK (variant) ; mais Assignations `bg-green-100` cru, Show réinvente les badges. |
| **C8** `window.location` / fetch bruts | **Partiel** | Règles/Templates Index OK (React Query + navigate) ; mais Show/Create/Edit en `inertia-shim` hors React Router/Query. |
| **C10** formulaires bruts, FK sans Select | **Oui** | Checkboxes natives + textareas dans RuleForm/CriteresEditor ; `<select>` natifs dans Assignations ; aucune validation Form système. |

*(C5 dark mode et C9 non vérifiables sur ce périmètre sans run ; non signalés faute de preuve directe.)*

---

## Plan d'action priorisé

**P0 — bloquant fonctionnel**
1. **(L) Recâbler Templates/Create + Edit** sur `templatesApi`, React Query, `useNavigate`, `AdminEvaluationsLayout`. Supprimer mock/`console.log`/`alert`/`inertia-shim`. Réconcilier le modèle de données (sections/compétences vs critères pondérés) sur le backend réel.
2. **(M) Recâbler Templates/Show** sur l'API réelle, retirer `setTimeout`/mock, skeleton au lieu du spinner.
3. **(S) Corriger les routes** `/admin/evaluation/templates` → `/admin/evaluations/templates` partout.
4. **(S) Assignations : ajouter `onError` + feedback** sur assign/remove (correction, pas amélioration : mutation structurante silencieuse).
5. **(S) CriteresEditor : supprimer l'état local dupliqué** (anti-pattern useEffect↔props).

**P1 — cohérence & composants**
6. **(M) PageHeader/PageContainer partagé** (titre tokenisé + breadcrumb + slot action) ; retirer les doubles `<h1>`.
7. **(S) Discipliner le rouge** : états actifs toggle/tabs en neutre froid ; supprimer `bg-sabc-accent` du CriteresEditor.
8. **(M) Unifier les composants** : `<Checkbox>`, `<Textarea>`, `<Select>`, `<Input>`, `<Table>` partout (Assignations + vue liste Règles) — éliminer natifs.
9. **(M) Système de Form + validation** (poids =100 %, min 5, FK requis) ; désactiver submit sur invalidité dans Règles comme dans Templates.
10. **(S) Toasts** au lieu de `confirm`/`alert`/bandeaux maison.

**P2 — finition**
11. EmptyState illustrés + CTA ; skeletons structurels.
12. Badges 100 % sémantiques via `variant` (Assignations, Show).
13. Échelle min/max en affichage (pas en input disabled).
14. Action « Copier la période précédente » sur Assignations (valeur ClickUp).
15. Recherche Templates : composant `Input` + icône + debounce ; routes REST cohérentes (`/templates/:id`).

**Fichiers concernés (chemins absolus)**
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Regles/Index.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Regles/RuleForm.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Regles/Create.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Regles/Edit.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Evaluations/CriteresEditor.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Templates/Index.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Templates/Assignations.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Templates/Create.tsx` *(maquette morte)*
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Templates/Edit.tsx` *(maquette morte)*
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Admin/Evaluations/Templates/Show.tsx` *(maquette morte)*


---


<!-- famille:Common Profil/Réglages/Équipe -->

# Critique UX/UI — Famille « Common · Profil / Réglages / Équipe »

## Verdict global : 41/100

Cette famille est le **ventre mou de cohérence** de l'app. On y trouve deux systèmes de layout concurrents qui ne se parlent pas, une navigation de réglages fantôme (présente sur une page, absente sur deux), une page `appearance.tsx` encore branchée sur des vestiges Inertia/Laravel, et des pages Équipe qui réimplémentent à la main des KPI et des tables anémiques alors qu'un système de Badge sémantique existe déjà dans le repo et n'est pas utilisé. Le tout « marche » mais ne ressemble en rien à un produit unifié type ClickUp/Linear : il manque le squelette commun (PageHeader, settings shell, table riche, états de chargement/erreur). Les fondations design existent (Badge à 9 variantes, tokens `sabc-*`) mais ne sont pas consommées — c'est de la dette de cohérence, pas d'un manque d'outillage.

---

## 1. `pages/Common/Profile.tsx` et `pages/Common/Settings.tsx`

### État actuel
Deux fichiers de **6 lignes**, redirections pures vers `/settings/profile`. C2 — Settings redirige aussi vers `profile`, donc le « point d'entrée Réglages » n'a pas de page d'accueil propre : il atterrit sur l'onglet Profil sans contexte.

### Forces
- Redirection via `<Navigate replace>` (React Router) — propre, pas de full reload. **Bon point** : ces deux fichiers échappent à C8.

### Problèmes
- `Settings → /settings/profile` est un raccourci paresseux. Un menu « Réglages » devrait soit ouvrir un index listant les sections (Profil / Sécurité / Apparence / Notifications), soit au minimum avoir une route canonique distincte. Là, deux entrées de navigation différentes (« Profil » et « Réglages ») mènent au même pixel — confusion d'information architecture.

### Actions
- **P2 / S — amélioration** : faire de `Settings` un vrai index (ou conserver la redirection mais garantir que la nav de gauche reflète la section active, voir §4).

---

## 2. `pages/Settings/profile.tsx`

### État actuel
La page la plus aboutie de la famille (9.8K). Carte « infos organisationnelles » en lecture seule, bandeau info bleu, formulaire infos perso + préférences (checkboxes notifications, select langue), bouton Enregistrer avec état `processing` et message de succès inline. **N'utilise PAS `SettingsLayout`** — elle est posée directement dans `AppLayout` avec un simple `container max-w-2xl`. Donc **aucune navigation entre les onglets de réglages** : on est sur Profil sans pouvoir aller vers Mot de passe / Apparence depuis la page.

### Forces
- Distinction lecture seule vs éditable claire (carte grise + bandeau « contactez l'administrateur »).
- Feedback de succès présent (`recentlySuccessful`) et gestion d'erreur affichée.
- `accent-sabc-red-primary` sur les checkboxes : usage correct du rouge de marque.

### Problèmes
- **Layout incohérent (C4)** : pas de `PageHeader` partagé, pas de `SettingsLayout`. La hiérarchie de titre est portée par `CardTitle` (`text-base` ici, `text-2xl` ailleurs dans Team) — **3 échelles de titre divergentes confirmées** dans la seule zone Common.
- **`<select>` natif brut (C10)** : ligne 203-212, le select langue utilise `border-gray-300 focus:border-red-500 focus:ring-red-500` — couleurs Tailwind brutes hors tokens, et ce n'est pas le composant `Select` du DS (qui existe et est utilisé ailleurs). Incohérent avec les `Input` du DS juste au-dessus.
- **Checkboxes natives** au lieu d'un `Switch`/`Checkbox` du DS — pour des préférences on/off, ClickUp/Linear utiliseraient des toggles. Composant « trop simple ».
- **Feedback non standardisé (C2)** : succès en `<p>` inline + erreur en bloc rouge maison. Pas de Toast. Le bloc d'erreur rouge (`bg-red-50 text-red-700`) **réutilise le rouge** — ambiguïté visuelle avec le rouge de marque du bouton juste au-dessus (C1).
- **Couleurs hardcodées mélangées** : `text-gray-700` (ligne 200) vs `text-sabc-gray-800` partout ailleurs → double convention de tokens (C1).
- **Pas d'état de chargement initial** : `user` peut être `null`, le form s'initialise à `''` sans skeleton (C6).
- **Responsive** : `max-w-2xl` centré est correct, mais sans shell de réglages la page paraît flottante sur grand écran.

### Écart vs cible ClickUp
Forte. ClickUp : settings shell persistant à gauche, header contextuel « Mon profil » + breadcrumb, toggles, Toast de confirmation, sauvegarde optimiste. Ici : carte isolée, select natif, message inline éphémère.

### Actions
- **P0 / M — correction** : envelopper dans `SettingsLayout` (ou un nouveau shell unifié) pour restaurer la navigation entre onglets. C'est le bug structurel n°1 de la zone.
- **P1 / S — correction** : remplacer `<select>` natif par `Select` du DS et les checkboxes par `Switch`/`Checkbox` DS.
- **P1 / S — correction** : remplacer le bloc d'erreur rouge + le `<p>` succès par un Toast (résout C1 ambiguïté + C2).
- **P2 / S** : harmoniser `text-gray-700` → `text-sabc-gray-700`.

---

## 3. `pages/Settings/password.tsx`

### État actuel
Trois champs password, bouton Enregistrer, message succès inline. Même pattern que profile, **également sans `SettingsLayout`**.

### Forces
- Gestion fine du focus sur erreur (focus `current_password` vs `password` selon le message backend) — détail soigné.
- `useRef` + React Router-friendly.

### Problèmes
- **`throw error` après le focus (ligne 44)** sans aucun affichage utilisateur : la mutation **échoue silencieusement** côté UI (C2 flagrant). L'erreur est relancée mais rien n'est rendu → l'utilisateur ne voit jamais « mot de passe actuel incorrect ». **Régression fonctionnelle réelle.**
- **Aucune validation client (C10)** : pas de vérification `password === password_confirmation` avant submit, pas d'indicateur de robustesse, pas de règles min. Champs bruts.
- **Pas de `SettingsLayout`** (C4) — même problème de navigation fantôme que profile.
- Pas de toggle « afficher le mot de passe » — attendu sur un produit moderne.

### Écart vs cible ClickUp
Forte. Manque : validation live, force du mot de passe, feedback d'erreur, reveal toggle.

### Actions
- **P0 / S — correction** : afficher l'erreur (Toast ou message inline) avant/au lieu de `throw` aveugle. Échec silencieux = inacceptable.
- **P1 / S — correction** : validation client (confirmation match + longueur min) avec messages.
- **P0 / M** : intégrer `SettingsLayout`.
- **P2 / S — amélioration** : reveal toggle + jauge de robustesse.

---

## 4. `pages/Settings/appearance.tsx` + `Layouts/settings/layout.tsx` + `appearance-tabs.tsx`

### État actuel
**Le point le plus alarmant : deux systèmes de layout coexistent.**
- `appearance.tsx` importe `AppLayout` depuis `@/Layouts` (avec prop `breadcrumbs`, API Inertia) et `SettingsLayout` (`@/Layouts/settings/layout`).
- `profile.tsx`/`password.tsx` importent `AppLayout` depuis `@/Components/Layout/app/AppLayout` (prop `user`, `pageTitle`, `notifications`) et **n'utilisent pas du tout `SettingsLayout`**.

→ Les **trois onglets de la même section Réglages ont deux chrome différents** : Apparence a une sidebar de navigation Réglages, Profil et Mot de passe ne l'ont pas. Incohérence visible à l'œil nu en naviguant.

`SettingsLayout` lui-même :
- Utilise `usePage()` et `Link` depuis `@/lib/inertia-shim` → **vestige Laravel/Inertia** (C8). `url.startsWith` au lieu de `useLocation` React Router.
- **Couleurs hardcodées `bg-[#E53E3E]` / `hover:bg-[#FED7D7]` / `text-[#424242]`** (lignes 54-56) → exactement C1 (rouge marque = hex brut hors tokens) **et** l'item actif est en rouge plein, ce qui viole la règle « rouge = action primaire / actif uniquement » de façon discutable (un item de nav actif en rouge plein écrase la hiérarchie ; Linear utilise accent + barre indicatrice, pas un bloc rouge plein).
- Onglet « Notifications » (`/settings/notifications`) pointe vers une route probablement inexistante (placeholder).

`appearance-tabs.tsx` :
- Composant `<Tabs>` avec **un seul onglet « Thème »** → un TabsList à un seul élément est un anti-pattern (composant inutilement complexe pour zéro choix).
- Bon usage des tokens (`border-sabc-red-primary bg-sabc-red-primary/5`) et dark mode pris en compte (`dark:border-sabc-gray-700`) — **meilleur élève dark mode de la zone** (C5 partiellement épargné ici).
- `localStorage.getItem('theme')` lu directement dans le render (ligne 15) → effet de bord en render, devrait être dans le hook de thème.
- `rounded-xl` (ligne 59) vs `rounded-md`/`rounded-lg` ailleurs → échelle de rayons non respectée.

### Écart vs cible ClickUp
Critique. Deux chromes pour une même section = échec de cohérence transverse. Le titre est en anglais (« Appearance settings ») alors que tout le reste est en français.

### Actions
- **P0 / M — correction** : **unifier sur UN seul `AppLayout` + UN seul `SettingsLayout`**. Migrer profile/password/appearance vers le même couple. C'est la correction structurante de toute la famille.
- **P0 / S — correction** : remplacer `usePage`/`@/lib/inertia-shim` par `useLocation`/`Link` React Router dans `SettingsLayout` (C8).
- **P1 / S — correction** : `bg-[#E53E3E]` → token ; item actif en accent + indicateur, pas bloc rouge plein (C1).
- **P1 / S** : libellés en français (« Apparence ») dans `appearance.tsx`.
- **P2 / S — amélioration** : supprimer le `<Tabs>` à un seul onglet dans `appearance-tabs`.

---

## 5. `pages/Common/Team/Overview.tsx`

### État actuel
Header titre+sous-titre, 4 cards KPI (Total / Actifs / Indisponibles / Sans manager), table des subordonnés directs avec `TruncatedTableBody` (preview 10). `useSubordonnes` est un `useSuspenseQuery` → chargement délégué à un Suspense parent.

### Forces
- Empty state présent (texte centré « Aucun subordonné trouvé »).
- KPI cards lisibles, dans le cap 5-7.
- Truncation à 10 lignes = bon réflexe densité.

### Problèmes
- **Table anémique (C3)** : `Table` brut, **aucun tri, filtre, densité, sticky header, action au hover, sélection**. Le `DataTable` riche du repo n'est pas importé. C'est exactement le pattern « 41 tables brutes vs 0 importeur » du diagnostic.
- **Badges non sémantiques (C7) — preuve directe** : ligne 67, `<Badge variant={user.est_actif ? 'default' : 'outline'}>`. Or le composant Badge expose `success`, `warning`, `error`, `info`… Actif devrait être `success`, Indisponible `warning`, Inactif `secondary`/`error`. La zone **réimplémente du gris uniforme alors que le système sémantique existe**.
- **Empty state pauvre (C6)** : juste du texte, pas d'illustration ni de CTA. Pas de skeleton (le Suspense parent affiche probablement un spinner plein écran — C6).
- **Pas d'état d'erreur** : `useSuspenseQuery` propage à un ErrorBoundary parent ; rien de spécifique à la page.
- **KPI cards faites main** : `<Card><CardContent className="p-4">…` répété 4× au lieu d'un composant `StatCard` partagé → divergence avec les KPI du Dashboard Admin.
- Titre `text-2xl font-bold` ici vs `CardTitle text-base` dans profile → C4.
- Région affichée en `id_region` brut (« N/A » sinon) → donnée technique exposée.

### Écart vs cible ClickUp
Forte. ClickUp afficherait avatars, statuts colorés, tri/filtre, recherche, sélecteur de vue (table/cartes). Ici table statique gris uniforme.

### Actions
- **P1 / M — correction** : migrer vers `DataTable` (tri/filtre/sticky/hover) — résout C3 sur cette page.
- **P1 / S — correction** : Badges sémantiques (`success`/`warning`/`secondary`) — résout C7, effort minimal.
- **P2 / S — amélioration** : composant `StatCard` partagé pour les 4 KPI.
- **P2 / M** : EmptyState illustré + skeleton structurel.

---

## 6. `pages/Common/Team/Evaluations.tsx`

### État actuel
Quasi-clone d'Overview : header, 4 KPI (Total / En attente / Soumises / Validées), table des évaluations d'équipe filtrée par appartenance des subordonnés. Filtrage cross-DB côté client (`subordonnesSet`).

### Forces
- Logique de filtrage robuste (gère `evalue`/`evaluateur` en objet ou matricule).
- `useMemo` correct, empty state présent.

### Problèmes
- **C7 le plus grave de la zone** : ligne 83, `<Badge variant={evaluation.statut === 'valide' ? 'default' : 'outline'}>{evaluation.statut}</Badge>`. On a des statuts métier (`brouillon`, `en_attente`, `soumis`, `valide`) qui correspondent **exactement** à la grille sémantique cible (brouillon=gris, soumis=bleu, retard=ambre, succès=vert) — et tout est rendu en `default`/`outline` gris. **Le statut brut `en_attente` est même affiché sans mise en forme** (snake_case visible par l'utilisateur). Pills sémantiques attendues, pile-poil le cas d'usage de C7.
- **C3** : même table brute sans tri/filtre. Pour une liste d'évaluations, l'absence de filtre par statut/période est un manque fonctionnel net.
- **`id_evaluation` (UUID) affiché en première colonne** : un UUID brut comme colonne ID = bruit visuel inutile (C10 — clé technique exposée).
- **Pas de lien vers le détail** : les lignes ne sont pas cliquables vers la page évaluation → cul-de-sac de navigation.
- **Duplication structurelle avec Overview** : header + grille KPI + table dupliqués à l'identique → devrait être un layout/section partagé.
- Empty state et skeleton : mêmes lacunes C6 qu'Overview.

### Écart vs cible ClickUp
Forte. Une liste d'évaluations dans ClickUp = pills de statut colorées, filtres, tri, lignes cliquables, sélecteur de vue board/table. Ici table morte.

### Actions
- **P1 / S — correction** : mapping statut → Badge sémantique (`brouillon`→secondary, `en_attente`→warning, `soumis`→info, `valide`→success) + labels lisibles. Résout C7, effort trivial, fort impact.
- **P1 / M — correction** : DataTable + filtre par statut/période + lignes cliquables vers le détail.
- **P2 / S** : masquer/raccourcir l'UUID (tooltip plutôt que colonne).
- **P2 / S — amélioration** : factoriser le shell « page Équipe » (header+KPI) partagé entre Overview et Evaluations.

---

## Synthèse des problèmes transverses C1–C10 dans la zone

| Code | Présent ? | Preuve |
|------|-----------|--------|
| **C1** (rouge marque = rouge erreur + double tokens) | **Oui** | `SettingsLayout` `bg-[#E53E3E]`/`#FED7D7`/`#424242` en hex brut ; bloc d'erreur `bg-red-50` sous un bouton rouge marque (profile) ; `text-gray-700` vs `text-sabc-gray-*`. |
| **C2** (pas de Toast, mutations silencieuses) | **Oui (critique)** | `password.tsx` `throw error` sans aucun rendu → échec silencieux ; profile = succès/erreur inline maison, pas de Toast. |
| **C3** (DataTable non utilisé, tables brutes) | **Oui** | Team/Overview et Team/Evaluations : `Table` brut sans tri/filtre/densité/sticky/hover. |
| **C4** (pas de PageHeader/PageContainer, 3 échelles de titre) | **Oui** | `CardTitle text-base` (profile) vs `h1 text-2xl` (Team) ; aucun PageHeader partagé ; pas de shell réglages sur profile/password. |
| **C5** (dark mode cassé) | **Partiel** | `appearance-tabs` gère le dark (`dark:border-…`) mais `SettingsLayout` et les KPI cards Team n'ont aucune variante dark. |
| **C6** (pas d'EmptyState riche ni skeletons) | **Oui** | Team : empty states texte seul, pas d'illustration/CTA ; `useSuspenseQuery` → spinner parent, pas de skeleton structurel ; profile sans skeleton initial. |
| **C7** (statuts/badges non sémantiques) | **Oui (flagrant)** | Team/Evaluations et Overview : `default`/`outline` gris alors que le DS Badge expose `success`/`warning`/`info`/`error` non consommés. Statut `en_attente` affiché en snake_case brut. |
| **C8** (navigation full reload / fetch bruts, vestiges Inertia) | **Oui** | `SettingsLayout` et `appearance.tsx` importent `@/lib/inertia-shim` (`usePage`, `Head`, `Link` Inertia) ; `appearance.tsx` sur layout `@/Layouts` Inertia. (Les redirects Common, eux, sont propres.) |
| **C10** (formulaires bruts) | **Oui** | `<select>` natif + checkboxes natives (profile) ; aucune validation client (password) ; UUID/`id_region` techniques exposés (Team). |

C9 hors périmètre (non listé). **Non concernés** : la zone n'a pas de board/graphe.

---

## Top priorités (ordre d'exécution recommandé)

1. **P0 / S — `password.tsx` : afficher l'erreur** (supprimer le `throw` aveugle). Bug fonctionnel, correction immédiate.
2. **P0 / M — Unifier le layout de Réglages** : un seul `AppLayout` + `SettingsLayout` sur profile/password/appearance, migré React Router (résout C4 + C8 + chrome incohérent en un coup).
3. **P1 / S — Badges sémantiques** sur Team/Evaluations + Team/Overview (résout C7, effort trivial, le système existe déjà).
4. **P1 / S — Tokeniser `SettingsLayout`** (`#E53E3E` → token, item actif accent+indicateur) — résout C1.
5. **P1 / S — Select/Switch du DS** dans profile (résout C10 form).
6. **P1 / M — DataTable** sur les deux pages Équipe (résout C3) + lignes cliquables.
7. **P2 — StatCard partagé, EmptyState illustré, skeletons, factorisation du shell Équipe.**

Fichiers concernés (chemins absolus) :
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Common/Profile.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Common/Settings.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Settings/profile.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Settings/password.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Settings/appearance.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Layouts/settings/layout.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/appearance-tabs.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Common/Team/Overview.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Common/Team/Evaluations.tsx`
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Common/Evaluations/shared.tsx` (EvaluationPageLayout, point d'unification possible)


---


<!-- axe:Architecture de l'information & Navigation -->

# Axe transverse — Architecture de l'information & Navigation

## Verdict

**52 / 100.** La fondation est saine — *une seule* source de vérité pour la navigation (`config/nav.tsx`), filtrage par rôle propre, état actif réactif via `useLocation`, badges contextuels (évaluations en attente). C'est au-dessus de la moyenne des bases que je revois. Mais l'AI souffre de trois maux systémiques qui plombent la note : un **contexte de page amputé** (breadcrumbs supprimés, titre = simple chaîne libre non normalisée), une **navigation schizophrène** (React Router *et* `window.location` full-reload qui coexistent et se contredisent), et une **profondeur/retrouvabilité incohérente** (Analytics noyé dans des `?tab=` invisibles à la sidebar, liens morts en nav, deux coquilles de layout concurrentes). Ce n'est pas une AI ClickUp/Linear : c'est une sidebar correcte posée sur un système de routage hybride non assumé.

---

## Constats systémiques

### S1 — Le header contextuel n'existe pas (régression assumée)
`AppLayout.tsx` ligne 5 et 74 : `// Suppression de l'import des breadcrumbs` / `// Suppression de la section des breadcrumbs`. Le composant `Breadcrumb.tsx` existe encore mais a **0 importeur** hors `Settings/appearance.tsx`. Le grain de design cible (« HEADER CONTEXTUEL par vue : titre + breadcrumb + filtres + 1 action primaire à droite ») est donc **absent par construction**. Le header (`Header.tsx`) ne porte que : titre + thème + notifs + avatar. Aucun fil d'Ariane, aucune action primaire contextuelle, aucun emplacement de filtres. Sur une app à hiérarchie profonde (`/admin/structure/secteurs`, `/admin/evaluations/regles/:id/edit`), l'utilisateur n'a **aucun repère de profondeur ni de remontée**. C'est le défaut #1.

### S2 — Le titre de page est une chaîne libre, jamais dérivée de la route
`pageTitle` est une `string` passée à la main dans chaque page (23 occurrences, valeurs hétérogènes : `"Analytics 360°"`, `"Paramètres - Profil"`, `"Mon Tableau de Bord"`, `"Dashboard Manager"`). Conséquences : casse incohérente (« Mon Tableau de Bord » vs « Tableau de bord »), titres dupliquant la hiérarchie à la main (`"Paramètres - Profil"` simule un breadcrumb dans une chaîne), et **aucune garantie** que le titre corresponde à l'entrée de sidebar active. Le titre devrait être **dérivé de la table de routes / config nav**, pas re-saisi par page. C'est le pendant de C4.

### S3 — Deux coquilles de layout concurrentes
`AppLayout` (44 pages) **et** `EvaluationPageLayout` (`pages/Common/Evaluations/shared.tsx`, 14 pages, utilisé aussi par les dashboards Manager/Collaborateur). Deux enveloppes = deux échelles de titre, deux gabarits d'en-tête, deux comportements de padding. C'est exactement la fragmentation que la grille commune interdit. Il faut **un** `PageLayout` partagé avec un slot `header` (titre + breadcrumb + actions), pas deux shells parallèles.

### S4 — Navigation hybride : React Router vs `window.location` (full reload)
20 occurrences de `window.location.href` / `globalThis.location.href` dont une majorité sont de la **navigation interne applicative** qui devrait être client-side :
- `Sidebar.tsx:380` déconnexion → `globalThis.location.href = '/login'`
- Le CTA primaire **« Mes évaluations »** de la sidebar (`Sidebar.tsx:337`) est un `<a href="/evaluations/mine">` brut → **full reload sur l'action la plus importante de la sidebar**, alors que tous les autres items passent par `<Link>`.
- `RoleDashboardShared.tsx:59`, `EvaluationModal.tsx:62`, `Mine.tsx:264`, `Show.tsx:89/98`, `Pending.tsx:141/322`, `Edit.tsx:121/169` → navigation entre vues d'évaluation **en rechargement complet**.

Pire : le shim `inertia-shim.tsx:72-78` masque le problème — si `_navigate` n'est pas encore monté, il **fallback silencieusement sur `globalThis.location.href`**. La couche d'abstraction censée unifier la nav réintroduit elle-même le full-reload. Résultat UX : perte d'état React Query, re-fetch complet, flash de `PageLoader` plein écran, scroll réinitialisé — l'antithèse de ClickUp. C'est C8, démontré.

### S5 — Liens morts et redirections fantômes dans la source de vérité de nav
`config/nav.tsx:191-199` déclare pour l'ADMIN un groupe **Notifications** avec `/admin/notifications/send` et `/admin/notifications/history`. **Aucune de ces deux routes n'existe dans `app.tsx`** (grep : 0). Un admin qui clique tombe sur le `404` (`path="*"`). La config de nav et la table de routes ne sont pas tenues en cohérence — il n'y a aucun garde-fou (test, type partagé) liant `NavItem.href` aux routes déclarées.

### S6 — Analytics : profondeur cachée dans des `?tab=` non navigables
La sidebar expose 6 sous-entrées Analytics (`/admin/analytics?tab=regions|roles|anomalies|individual|improvement|tendances`) mais une **seule route** `/admin/analytics` les sert toutes (app.tsx:273). L'`isHrefActive` (Sidebar.tsx:82-88) gère bien le match de query, donc l'actif fonctionne — mais ce sont **6 destinations distinctes empilées sur une page unique à onglets internes**, sans breadcrumb pour situer l'onglet, sans titre dérivé de l'onglet (le titre reste `"Analytics 360°"` figé). La retrouvabilité d'un onglet précis dépend entièrement de l'état interne de la page, invisible au système de routage et au header. C'est de la profondeur fantôme.

### S7 — Libellés et regroupement : incohérences fines mais visibles
- Casse incohérente entre nav et titres (S2).
- Apostrophe typographique mélangée : `'Axes d'amélioration'` (nav.tsx:157, apostrophe courbe) vs `'Plans d\'amélioration'` / `'Gaps d\'évaluation'` (droites échappées). Détail, mais signe d'absence de discipline lexicale.
- Regroupement asymétrique : « Remplacements » et « Axes d'amélioration » sont des **items feuilles top-level** tandis que « Utilisateurs » (2 enfants) ou « Rôles » (2 enfants) sont des groupes — la logique « feuille vs groupe » suit le nombre d'enfants, pas une taxonomie. Pas de **labels de section** (« GESTION », « ANALYSE », « ADMINISTRATION ») pour structurer une sidebar admin qui compte ~9 groupes : mur d'items plat, scan difficile. La cible ClickUp impose des groupes labellisés.

### S8 — Le composant Breadcrumb, même mort, est hors charte
`Breadcrumb.tsx` utilise un `<a href>` brut (full reload, S4 again), des couleurs `text-gray-400/500/900` **hors tokens SABC** (pas de `sabc-gray-*`, donc cassé en dark mode — C5), et une prop `name` là où le reste de l'app utilise `title`. S'il est ressuscité tel quel, il réimporte trois dettes d'un coup.

---

## Problèmes transverses C1–C10 confirmés dans ma zone

| Code | Présent | Preuve |
|------|:---:|--------|
| **C4** (pas de PageHeader/PageContainer ; échelles de titre divergentes) | **OUI — central** | `AppLayout` n'a aucun header contextuel (breadcrumb supprimé l.74) ; `pageTitle` = string libre, 23 valeurs hétérogènes ; deux shells `AppLayout` + `EvaluationPageLayout` (S1, S2, S3). |
| **C8** (window.location full reload vs React Router ; fetch bruts) | **OUI — central** | 20 × `window.location.href` en nav interne ; CTA sidebar « Mes évaluations » en `<a href>` brut (l.337) ; fallback full-reload dans le shim (l.76) (S4). |
| **C5** (dark mode cassé) | **OUI — local** | `Breadcrumb.tsx` câblé sur `text-gray-*` hors tokens, sans variante dark (S8). |
| C2 (toasts) | Hors zone, mais touche | Déconnexion (Sidebar) et nav post-action se font sans aucun feedback ; la nav avale les transitions silencieusement. À traiter avec l'axe feedback. |

C1, C3, C6, C7, C10 ne relèvent pas de l'AI/navigation.

---

## Actions concrètes

### P0 — corrections (bloquant la cohérence de nav)

1. **[Correction] Tuer le full-reload sur la navigation interne.** `S/M`. Remplacer les ~12 `window.location.href` de navigation applicative par `useNavigate()` / `<Link>`. Cas prioritaire : CTA sidebar « Mes évaluations » (`Sidebar.tsx:337`) → `<Link>`. Conserver `window.location` **uniquement** pour login/logout (changement de session) et l'intercepteur 401 (`api.ts`). Supprimer le fallback `globalThis.location.href` du shim (`inertia-shim.tsx:76`) ou le réduire à un `console.error` — il masque des bugs de montée du router.

2. **[Correction] Réconcilier nav ↔ routes.** `S`. Soit créer les routes `/admin/notifications/send` et `/history`, soit retirer le groupe Notifications de `nav.tsx`. Ajouter un **test** qui vérifie que chaque `NavItem.href` non-`#` (après `resolveHref`) matche une route déclarée — interdire la régression S5.

3. **[Correction] PageHeader partagé + breadcrumb réactivé.** `M`. Créer `<PageHeader title breadcrumb actions />` et le câbler dans `AppLayout` (slot header). Dériver titre + fil d'Ariane de la **route active** (mapping route→{title, parents} adossé à `config/nav.tsx`), pas de `pageTitle` saisi à la main. Réécrire `Breadcrumb.tsx` avec `<Link>` + tokens `sabc-gray-*` + variante dark.

### P1 — corrections / améliorations structurantes

4. **[Correction] Fusionner `EvaluationPageLayout` dans le `PageLayout` unique.** `M`. Un seul shell, un slot header, un seul barème de padding/titre (S3). Migrer les 14 pages.

5. **[Amélioration] Sortir les onglets Analytics du `?tab=` fantôme** OU les assumer comme vraies routes (`/admin/analytics/regions`, `/roles`, …) avec un layout à onglets de premier rang. `M`. Au minimum : faire que le titre du header reflète l'onglet actif et qu'un breadcrumb « Analytics › Anomalies » situe l'utilisateur (S6).

6. **[Amélioration] Labels de section + taxonomie de sidebar.** `S`. Grouper la nav admin sous des en-têtes (« ÉVALUATION », « ORGANISATION », « ADMINISTRATION ») ; harmoniser feuille-vs-groupe sur une logique métier, pas sur le compte d'enfants (S7).

### P2 — finitions

7. **[Correction] Discipline lexicale.** `S`. Casse normalisée (« Tableau de bord » partout), apostrophes typographiques cohérentes, prop `title` (pas `name`) dans Breadcrumb (S7).

8. **[Amélioration] Garde-rail de profondeur.** `S`. Vérifier que chaque vue à 3+ niveaux (`/admin/evaluations/regles/:id/edit`) affiche un breadcrumb complet et un bouton retour client-side — supprimer les `window.location.href = '/evaluations/pending'` de retour (Show.tsx:89).

---

**Fichiers concernés (chemins absolus) :**
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Layout/app/AppLayout.tsx` (header amputé, l.5/74)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Layout/app/Header.tsx` (pas de breadcrumb/action contextuelle)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/Layout/app/Sidebar.tsx` (CTA `<a href>` l.337, logout `globalThis.location` l.380)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/config/nav.tsx` (liens morts Notifications l.184-201, onglets `?tab=` l.122-153)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/app.tsx` (routes manquantes, Analytics route unique l.273)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/Components/UI/Breadcrumb/Breadcrumb.tsx` (orphelin, hors tokens/dark, `<a href>`)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/lib/inertia-shim.tsx` (fallback full-reload l.72-82)
- `/Users/macbook/Documents/SABC/sabc_eval360/apps/web/src/pages/Common/Evaluations/shared.tsx` (second shell `EvaluationPageLayout`)


---
