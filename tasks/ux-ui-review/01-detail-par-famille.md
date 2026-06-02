# Annexe A — Détail par famille de pages

_Critique méliorative page par page produite par les experts-propriétaires (reviewers ayant abouti)._


## Admin · Reports (Report Builder) — **34/100**

> Famille fonctionnelle mais clairement "trop simple" — exactement le reproche client. Trois fichiers minces (Index liste, Builder drag-and-drop, SectionCard) construits quasi entièrement en HTML brut + Tailwind hardcodé, qui ignorent presque totalement la librairie de 40 composants mûrs disponible (Button, Card, Badge, Skeleton, Toast, Dialog). Aucun header contextuel, aucun feedback (confirm() natif, zéro toast), états vides/chargement/erreur pauvres, statuts en texte gris. C'est une feature livrée vite, pas un écran au niveau ClickUp.


### `apps/web/src/pages/Admin/Reports/Index.tsx`

**État actuel** — Page liste des rapports : titre h1, bouton 'Nouveau rapport' rouge, formulaire de création inline (input + Créer/Annuler), puis liste de cartes-lignes (titre, nb sections + statut en texte, boutons Éditer/Supprimer). Container max-w-4xl centré, pas de sidebar/header contextuel propre à la vue.


**Forces**
- Structure logique et lisible : création inline plutôt qu'un modal lourd, pattern simple et rapide
- Bouton primaire correctement placé en haut à droite (cohérent ClickUp : 1 action primaire à droite)
- Un état vide existe (icône FileText + message), ce qui vaut mieux qu'un tableau blanc
- Gestion isLoading présente


**Problèmes**
- Cartes-lignes = boîtes plates : titre + méta grise, aucune pill de statut sémantique (statut affiché en texte 'Statut : brouillon'), pas d'avatar/auteur/date, pas d'action révélée au hover
- Couleur de marque en bg-red-600 / focus:border-red-500 (rouge Tailwind brut) au lieu du token --sabc-red-primary et du composant Button
- Rayons mélangés : rounded-lg sur cartes/bouton principal, rounded sur input et boutons du formulaire inline
- Aucun toast après création/suppression ; suppression via confirm() natif
- État vide non illustré et sans CTA cliquable (texte invite à créer mais n'offre pas le bouton) ; loading = texte 'Chargement…' au lieu de skeletons
- Pas de header contextuel : pas de breadcrumb, pas de compteur, pas de recherche/filtre par statut, pas de sélecteur de vue


**Écart vs cible ClickUp** — Fort. Pas de header contextuel, cartes plates sans pill ni hover, rouge hardcodé hors design system, statuts en texte gris (anti-pattern 'gris uniforme'), aucun feedback non bloquant.


**Actions**
  - 🔴 P0 · `M` · *correction* — Remplacer tous les <button> bruts par Button (primary/outline/ghost) et les <div> cartes par Card ; supprimer bg-red-600 au profit du token de marque
  - 🟠 P1 · `S` · *correction* — Transformer le statut texte 'Statut : brouillon' en Badge/pill sémantique
  - 🟡 P2 · `M` · *amelioration* — Ajouter un header contextuel : breadcrumb + compteur + recherche/filtre par statut
  - 🟠 P1 · `M` · *amelioration* — Enrichir les cartes (auteur, date de modif, nb sections en pill) et révéler Éditer/Supprimer au hover (transition 120-200ms)
  - 🟠 P1 · `M` · *correction* — Remplacer confirm() natif par un Dialog de confirmation + Toast succès/erreur sur create/delete
  - 🟠 P1 · `S` · *amelioration* — Enrichir l'état vide (illustration + titre + CTA bouton) et remplacer 'Chargement…' par des Skeleton de cartes


### `apps/web/src/pages/Admin/Reports/Builder.tsx`

**État actuel** — Éditeur de rapport : barre du haut avec 'Retour aux rapports' (gauche) + boutons export PowerPoint (orange) / Excel (vert) (droite), titre h1, liste de SectionCard réordonnables par drag-and-drop (dnd-kit), bouton 'Ajouter une section' en dashed avec sélecteur de type (grille 2 colonnes). max-w-3xl centré.


**Forces**
- Drag-and-drop bien implémenté (dnd-kit, sensors clavier + pointer, arrayMove, opacity sur isDragging) — interaction premium réelle
- Bouton 'Ajouter une section' en dashed avec hover rouge : affordance d'ajout claire
- Sélecteur de type en grille avec hover rouge inversé et transition-colors
- Gestion isLoading et état 'Rapport introuvable' présents


**Problèmes**
- Deux boutons export en orange et vert vifs concurrents cassent la hiérarchie chromatique (accent doit être parcimonieux)
- Exports = mutations sans état loading/success/erreur : téléchargement silencieux, échec totalement silencieux (pas de catch ni toast)
- Pas de header contextuel : titre non éditable depuis le header, pas de breadcrumb, pas de pill de statut, pas d'action primaire 'Publier'
- Pas de skeleton de sections au chargement ('Chargement…' texte)
- Aucun état vide quand le rapport n'a aucune section (juste le bouton d'ajout, sans message d'accueil)
- Exports en boutons bruts au lieu de Button/DropdownMenu existants ; largeur max-w-3xl divergente de l'Index (max-w-4xl)


**Écart vs cible ClickUp** — Fort. Header non contextuel, deux couleurs vives non-marque dominent la barre, aucun feedback sur les exports, pas d'état vide ni skeleton de sections.


**Actions**
  - 🔴 P0 · `M` · *correction* — Ajouter feedback sur les exports : Button loading + Toast succès/erreur + gestion du catch (échec silencieux actuel)
  - 🟠 P1 · `M` · *correction* — Regrouper PPTX/XLSX dans un DropdownMenu/ActionMenu 'Exporter' en Button secondary, retirer orange+vert vifs concurrents
  - 🟠 P1 · `M` · *amelioration* — Construire un vrai header contextuel : breadcrumb, titre éditable inline, pill statut, action primaire 'Publier', Button ghost à icône pour 'Retour'
  - 🟠 P1 · `S` · *amelioration* — Remplacer 'Chargement…' par des Skeleton de SectionCard matchant les dimensions finales
  - 🟡 P2 · `S` · *amelioration* — Ajouter un état vide dédié quand 0 section (illustration + 'Commencez par ajouter une section')
  - 🟡 P2 · `L` · *amelioration* — Aperçu/preview du rendu par type de section (KPIs, tendances) plutôt qu'un textarea générique


### `apps/web/src/Components/Admin/Reports/SectionCard.tsx`

**État actuel** — Carte de section draggable : poignée GripVertical + label de type en petites majuscules, bouton supprimer (Trash2), input titre soulignée, textarea contenu. shadow-sm, rounded-lg, border gris. Sauvegarde via onUpdate à chaque frappe.


**Forces**
- Poignée de drag claire (GripVertical, cursor-grab/grabbing)
- Label de type en uppercase tracking-wide gris : hiérarchie typo de méta correcte
- Utilise le token --sabc-red-primary sur les focus (bon réflexe de marque)
- Layout interne propre, espacements cohérents (mb-3, p-4, gap-2)


**Problèmes**
- Boîte plate : tous les types (KPIs, tendances, recommandations) rendent le MÊME textarea générique, aucune différenciation ni champ adapté
- Type affiché en simple label texte, pas en pill colorée ni icône
- Aucun feedback de sauvegarde alors que onUpdate tire à chaque keystroke (pas de debounce, pas d'indicateur 'enregistré')
- Suppression immédiate sans confirmation depuis la carte
- Incohérence de token de marque avec Index.tsx (ici sabc-red-primary, là-bas red-600 brut)
- <div> manuel au lieu du composant Card du DS (dérive d'ombre/rayon inter-écrans)


**Écart vs cible ClickUp** — Moyen. La plus soignée des trois mais reste une boîte plate sans rendu différencié par type ni feedback de sauvegarde ; type en texte au lieu de pill.


**Actions**
  - 🟠 P1 · `S` · *correction* — Aligner la couleur de marque sur le même token que le reste de la famille (corriger sabc-red-primary vs red-600 brut)
  - 🟠 P1 · `L` · *amelioration* — Différencier le rendu par type : icône + pill colorée et éditeurs adaptés (sélecteur de KPIs, période pour tendances) au lieu d'un textarea unique
  - 🟡 P2 · `M` · *amelioration* — Ajouter un indicateur de sauvegarde (debounce + micro-état 'Enregistré')
  - 🟡 P2 · `S` · *amelioration* — Construire la carte sur le composant Card du DS pour cohérence d'ombre/rayon inter-écrans


**Incohérences internes à la famille**
- Incohérence de token de marque DANS la famille : Index.tsx utilise bg-red-600 / focus:border-red-500 (rouge Tailwind brut), alors que SectionCard.tsx utilise focus:border-sabc-red-primary (token SABC). Deux rouges potentiellement différents sur la même feature.
- Incohérence de rayons : Index mélange rounded-lg (cartes/bouton) et rounded (input/boutons du formulaire) sans logique ; le DS attend ~8/6/4px cohérents.
- Aucun des trois fichiers n'importe la librairie UI (Button, Card, Badge, Skeleton, Toast, Dialog, DropdownMenu existent mais sont ignorés) — toute la famille est en HTML+Tailwind brut, garantissant une dérive visuelle vs les autres écrans.
- Feedback hétérogène et globalement absent : Index utilise confirm() natif pour supprimer, Builder fait des exports silencieux, aucun Toast nulle part — alors qu'un composant Toast existe.
- Largeurs de container divergentes (Index max-w-4xl, Builder max-w-3xl) sans raison fonctionnelle claire.
- Statuts traités en texte gris ('Statut : brouillon') dans Index alors que le DS impose des pills sémantiques — anti-pattern 'gris uniforme'.


**Top actions de la famille**
- P0 — Réécrire la famille sur le design system : remplacer tous les <button>/<div> bruts par Button, Card, Badge ; supprimer les rouges hardcodés (red-600) au profit du token de marque. Cause racine du 'trop simple'.
- P0 — Donner du feedback aux exports PPTX/XLSX du Builder : état loading sur le bouton + Toast succès/erreur (succès ET échec actuellement silencieux).
- P1 — Statuts en pills sémantiques partout (liste, section) au lieu de texte gris ; remplacer confirm() natif par un Dialog + Toast.
- P1 — Header contextuel sur les deux pages : breadcrumb, compteur/recherche côté liste ; titre éditable + pill statut + action primaire 'Publier' + export regroupé dans un menu côté Builder.
- P1 — États de chargement réels (Skeleton matchant les dimensions) et états vides illustrés avec CTA, en remplacement des textes 'Chargement…' et du message d'invite non cliquable.


---

## Admin · Utilisateurs & Structure — **42/100**

> Famille fonctionnelle mais clairement dans la zone "trop simple" que le client rejette : ce sont des CRUD honnêtes (tables triables côté composant, modales propres, mutations React Query avec invalidation) mais visuellement plates et génériques. Header non contextuel (juste un H1+sous-titre dans le flux), KPI en boîtes muettes, badges non sémantiques, zéro état vide illustré ni skeleton (Suspense renvoie un DashboardSkeleton générique qui ne matche pas la table), formulaires bruts générés par boucle sur des clés techniques (`id_region`, `role_nom`) sans labels lisibles ni validation, et `window.confirm` natif pour les suppressions. La base composant (Button, Card, Dialog, Table) est correcte, mais l'assemblage n'exploite ni la densité ni la richesse attendues d'un outil RH ClickUp-like.


### `apps/web/src/pages/Admin/Utilisateurs/Index.tsx`

**État actuel** — Liste paginée des utilisateurs avec recherche debounced (350ms), table 7 colonnes, modales Create/Edit inline générées par boucle sur les clés du formulaire, pagination maison (fenêtre +/-2). Cellule nom affiche nom+email sur deux niveaux.


**Forces**
- Recherche debounced propre avec reset de page
- Pagination avec fenêtre de pages et compteur 'X–Y sur N', plus riche que la pagination prev/next du DataTable
- Cellule nom à deux niveaux (nom fort + email méta) = amorce de hiérarchie
- Gestion d'erreur de mutation affichée dans la modale
- Empty state distingue 'aucun résultat' vs 'aucun utilisateur'


**Problèmes**
- Header non contextuel : le H1 'Gestion des utilisateurs' est dans le flux de contenu, pas un vrai header de vue (pas de breadcrumb, pas de filtres au niveau header). Le pageTitle AppLayout duplique le titre.
- Badge rôle en 'secondary' (gris) et statut en 'default'/'outline' : aucun codage sémantique. Un rôle ADMIN, un compte inactif et un actif se ressemblent au scan = anti-pattern 'gris uniforme'.
- Formulaires modale = boucle sur Object.keys(initialCreateForm) : labels = clés techniques brutes ('id_region','role_nom','type_region','manager_matricule'), aucun Select pour rôle/région/branche alors que ce sont des FK, aucun helper text, aucune validation par champ.
- Pas de filtres (statut, rôle, région) — seulement une recherche texte. Table RH intensive sans facettes.
- Aucun skeleton matchant la table : Suspense -> DashboardSkeleton générique, layout shift au chargement.
- Pas d'avatars/initiales colorés : la colonne nom est purement textuelle.
- Pas de sélection multiple ni d'actions groupées (désactiver/exporter en masse).
- Pas de tri par colonne (la Table UI ne porte pas TanStack ici, c'est une table brute).
- Actions 'Voir'/'Modifier' toujours visibles en boutons outline plutôt que révélées au hover ou regroupées dans un menu '...'.
- Densité figée, pas de toggle compact/confortable.
- Doublon de logique : Create/Edit existent à la fois en modale (ici) ET en pages dédiées (Create.tsx/Edit.tsx).


**Écart vs cible ClickUp** — Fort. ClickUp attend un header contextuel avec sélecteur de vue + filtres, des pills de statut sémantiques, des avatars, actions au hover, et idéalement une vue cartes/board en alternative. Ici on a une table anémique + un titre statique.


**Actions**
  - 🔴 P0 · `M` · *correction* — Remplacer les boucles Object.keys par des champs nommés avec labels FR lisibles et Select pour role/region/branche/manager
  - 🟠 P1 · `S` · *correction* — Statuts et rôles en pills sémantiques (Actif=vert, Inactif=gris, rôles teintés) au lieu de Badge secondary/default
  - 🟠 P1 · `M` · *amelioration* — Ajouter une barre de filtres (rôle, statut, région) dans un header contextuel sticky avec l'action primaire à droite
  - 🟠 P1 · `S` · *correction* — Skeleton de table dédié (lignes grises matchant les colonnes) au lieu du DashboardSkeleton générique
  - 🟡 P2 · `S` · *amelioration* — Avatar/initiales coloré déterministe dans la colonne nom
  - 🟡 P2 · `L` · *amelioration* — Ajouter tri colonne + sélection multiple + actions groupées (migrer vers DataTable enrichi)
  - 🟠 P1 · `S` · *correction* — Toast de confirmation après création/modification (actuellement la modale se ferme sans feedback)


### `apps/web/src/pages/Admin/Utilisateurs/Show.tsx`

**État actuel** — Fiche utilisateur : header nom+email, 4 cartes KPI (Rôle/Statut/Score/Subordonnés), carte Détails 2 colonnes (360px,1fr) + table des subordonnés directs. Bouton Désactiver.


**Forces**
- Layout deux colonnes (détails fixe + contenu fluide) pertinent
- KPI groupés en haut, structure lisible
- Réutilise useSuspenseQuery pour les subordonnés


**Problèmes**
- Cartes KPI = 'boîtes plates' : label gris + valeur, sans icône, sans tendance, sans couleur sémantique. Anti-pattern composant trop simple.
- 'Score moyen N/A' et 'Statut' en texte brut, pas de pill ni de jauge de score.
- Bouton 'Désactiver' en variant outline (gris) sans confirmation ni état destructif : action critique non signalée, pas de window.confirm ni Dialog, déclenche la mutation au clic direct.
- Aucun feedback après désactivation (pas de toast, pas d'état optimiste visible).
- Table subordonnés sans empty state ('Aucun subordonné'), sans lien vers chaque fiche.
- Badges Actif/Admin en default/outline non sémantiques.
- Pas de skeleton spécifique ni de gestion d'erreur si l'utilisateur n'existe pas (404).


**Écart vs cible ClickUp** — Moyen-fort. Une fiche profil ClickUp-like aurait une Stat Card standardisée (icône+valeur+delta), des pills de statut, un avatar large, et des actions destructives confirmées. Ici tout est neutre et plat.


**Actions**
  - 🔴 P0 · `S` · *correction* — Confirmer la désactivation via Dialog (pas un clic direct sur bouton outline) et utiliser variant destructive
  - 🟠 P1 · `M` · *amelioration* — Transformer les 4 KPI en Stat Cards (icône + valeur + libellé), score en jauge/progress
  - 🟠 P1 · `S` · *correction* — Pills sémantiques pour Statut/Actif/Admin + avatar large dans le header
  - 🟡 P2 · `S` · *amelioration* — Empty state 'Aucun subordonné direct' + lignes cliquables vers la fiche
  - 🟠 P1 · `S` · *correction* — Toast de confirmation après désactivation


### `apps/web/src/pages/Admin/Utilisateurs/Create.tsx`

**État actuel** — Page de création doublon de la modale Index : formulaire 2 colonnes généré par boucle sur initialForm, bouton Créer désactivé tant que les champs requis sont vides.


**Forces**
- Validation de présence des champs requis sur le bouton
- Navigation vers la fiche après création


**Problèmes**
- Doublon strict de la modale Create de Index.tsx : deux sources de vérité pour le même formulaire, risque de divergence.
- Labels = clés techniques brutes (initialForm keys), aucun champ français, aucun Select pour role/region/branche.
- Sous-titre expose un détail d'implémentation à l'utilisateur : 'Création réelle via POST /admin/utilisateurs' (fuite technique dans l'UI).
- Aucune validation de format (email, matricule), aucun message d'erreur par champ.
- Pas de gestion d'erreur de mutation affichée (contrairement à la modale qui, elle, affiche createError).
- Pas de toast de succès.


**Écart vs cible ClickUp** — Fort. Aucun système de Form (labels/validation/erreurs). Le client veut 'recherché' : ici c'est un dump de champs texte.


**Actions**
  - 🟠 P1 · `M` · *correction* — Supprimer le doublon : une seule source (modale OU page) pour Create
  - 🔴 P0 · `S` · *correction* — Retirer la fuite technique 'via POST /admin/...' du sous-titre
  - 🔴 P0 · `M` · *correction* — Champs nommés FR + Select pour FK + validation email/matricule + messages d'erreur par champ
  - 🟠 P1 · `S` · *correction* — Afficher l'erreur de mutation et un toast de succès


### `apps/web/src/pages/Admin/Utilisateurs/Edit.tsx`

**État actuel** — Page d'édition : formulaire 2 colonnes généré par boucle sur les clés de l'objet form, synchronisé via useEffect sur data.


**Forces**
- Synchronisation form<-data via useEffect
- Navigation retour vers la fiche après update


**Problèmes**
- Doublon strict de la modale Edit de Index.tsx.
- Labels = clés techniques brutes.
- Bouton Enregistrer non désactivé pendant isPending (clics multiples possibles) alors que le texte change en 'Enregistrement...'.
- Aucune gestion d'erreur de mutation affichée (alors que la modale Index affiche updateError).
- Fuite technique dans le sous-titre 'via PUT /admin/...'.
- Pas de Select pour role/region/branche/statut/manager.
- Pas de toast de succès.


**Écart vs cible ClickUp** — Fort, mêmes raisons que Create.


**Actions**
  - 🟠 P1 · `S` · *correction* — Désactiver le bouton Enregistrer pendant isPending
  - 🟠 P1 · `M` · *correction* — Supprimer le doublon avec la modale Index
  - 🔴 P0 · `M` · *correction* — Retirer la fuite technique du sous-titre + champs nommés FR + Select pour FK
  - 🟠 P1 · `S` · *correction* — Afficher erreur de mutation + toast de succès


### `apps/web/src/pages/Admin/Utilisateurs/Gaps.tsx`

**État actuel** — Audit qualité des données : charge jusqu'à 1000 users, détecte les gaps (manager/téléphone/email/région/branche absents, compte inactif), 3 cartes de comptage + table filtrée par recherche.


**Forces**
- Idée produit utile (data quality)
- 3 cartes de synthèse (audités/avec gaps/total gaps)
- Recherche multi-champs incluant les gaps eux-mêmes


**Problèmes**
- Colonne 'Gaps' = simple texte joint par virgule (gaps.join(', ')) au lieu de pills sémantiques rouges/ambre par type de gap — anti-pattern statuts en texte brut.
- Cartes de synthèse plates, aucun code couleur (les 'avec gaps' devraient alerter en ambre/rouge).
- Aucun empty state quand zéro gap (cas idéal 'Toutes les données sont complètes' avec illustration).
- limit:1000 en dur = pas de pagination, risque de perf et de table interminable.
- Pas de tri ni de filtre par type de gap.
- Pas de lien vers la fiche/l'édition de l'utilisateur pour corriger le gap (le but de l'audit est l'action, ici c'est un cul-de-sac).
- Pas de skeleton.


**Écart vs cible ClickUp** — Fort. Une vue d'audit ClickUp-like rendrait chaque gap en pill cliquable menant à la correction, avec sévérité colorée et tri.


**Actions**
  - 🟠 P1 · `M` · *correction* — Pills sémantiques par type de gap (ambre/rouge) + action 'Corriger' vers Edit
  - 🟠 P1 · `S` · *correction* — Empty state positif quand aucun gap
  - 🟡 P2 · `S` · *amelioration* — Cartes de synthèse colorées sémantiquement (alerte si gaps>0)
  - 🟡 P2 · `M` · *amelioration* — Filtre par type de gap + tri colonne


### `apps/web/src/pages/Admin/Structure/index.tsx`

**État actuel** — Vue consolidée : 4 cartes de comptage (Régions/Services/Districts/Secteurs) + carte 'Répartition par région' avec TruncatedList (preview 8) rendant des lignes bordées.


**Forces**
- TruncatedList avec modale 'voir tout' = bon pattern de densité contrôlée
- Vue d'ensemble synthétique en tête
- Calcul du nb de services par région inline


**Problèmes**
- 4 cartes KPI plates sans icône ni lien : on ne peut pas cliquer 'Régions' pour aller à la page régions.
- Sous-titre expose 'branchée sur les données NestJS' = fuite technique.
- Lignes de région = boîte plate (nom + 'Tanière/Non tanière' + compteur), pas de hiérarchie de statut ; 'Tanière' devrait être une pill.
- Aucun empty state si structure vide.
- Pas de skeleton.
- Incohérence de rayon : lignes en rounded-lg alors que les Cards sont en rounded-xl/2xl ailleurs.
- Pas de visualisation hiérarchique (HierarchyTree existe dans le DS mais n'est pas utilisé) alors que c'est une 'structure organisationnelle'.


**Écart vs cible ClickUp** — Moyen-fort. Une vue structure ClickUp-like proposerait des Stat Cards cliquables + un arbre/board hiérarchique, pas une liste de boîtes plates.


**Actions**
  - 🟠 P1 · `S` · *amelioration* — Rendre les 4 KPI cliquables vers leurs pages respectives + icônes
  - 🔴 P0 · `S` · *correction* — Retirer la fuite technique 'données NestJS' du sous-titre
  - 🟠 P1 · `S` · *correction* — Pill pour Tanière/Non tanière + empty state structure vide
  - 🟡 P2 · `L` · *amelioration* — Utiliser HierarchyTree pour une vraie vue hiérarchique


### `apps/web/src/pages/Admin/Structure/regions.tsx`

**État actuel** — CRUD régions : table (Code/Nom/Type/Utilisateurs/Actions) + Dialog create/edit partagé. Suppression désactivée si utilisateurs>0.


**Forces**
- Garde-fou métier : suppression bloquée si utilisateurs rattachés
- Dialog partagé create/edit avec Select pour le type
- Affichage du _count.utilisateurs


**Problèmes**
- Type 'Tanière/Non tanière' en texte brut, pas de pill.
- Suppression via window.confirm natif (anti-pattern, incohérent avec les Dialog du DS).
- Aucun empty state 'Aucune région'.
- Pas de skeleton.
- Pas de recherche/filtre alors que les autres pages structure en ont parfois ; incohérence interne.
- Header de carte porte l'action primaire au lieu d'un header de vue contextuel.
- Suppression désactivée sans tooltip expliquant pourquoi (bouton grisé silencieux).


**Écart vs cible ClickUp** — Moyen. CRUD propre mais générique, pills et confirmations à la hauteur manquent.


**Actions**
  - 🟠 P1 · `S` · *correction* — Remplacer window.confirm par un Dialog de confirmation destructif cohérent
  - 🟠 P1 · `S` · *correction* — Pill pour le type Tanière + empty state
  - 🟡 P2 · `S` · *amelioration* — Tooltip sur le bouton Supprimer grisé expliquant le blocage
  - 🟠 P1 · `S` · *correction* — Toast de confirmation create/update/delete


### `apps/web/src/pages/Admin/Structure/services.tsx`

**État actuel** — CRUD services : table (Service/Région/Utilisateurs/Districts/Actions), Dialog create avec Select région. Suppression bloquée si users ou districts>0.


**Forces**
- Cellule service à deux niveaux (nom + id méta)
- Garde-fous de suppression
- Select région dans la modale


**Problèmes**
- Pas d'édition (seulement create + delete), incohérent avec regions qui édite.
- window.confirm natif.
- Aucun empty state.
- Pas de skeleton.
- Compteurs Utilisateurs/Districts en texte brut, pas de badge.
- Pas de recherche/filtre.
- Fallback de clé `${id_service}-${index}` suggère des id_service non uniques côté données (drapeau à investiguer).


**Écart vs cible ClickUp** — Moyen. Même registre générique que regions, plus l'asymétrie create/edit.


**Actions**
  - 🟠 P1 · `M` · *amelioration* — Ajouter l'édition pour cohérence avec regions
  - 🟠 P1 · `S` · *correction* — Dialog de confirmation au lieu de window.confirm + toasts
  - 🟠 P1 · `S` · *correction* — Empty state + skeleton


### `apps/web/src/pages/Admin/Structure/districts.tsx`

**État actuel** — CRUD districts : table (District/Service/Région/Utilisateurs/Secteurs/Actions), Dialog create avec Select service. Pas d'édition.


**Forces**
- Cellule district à deux niveaux
- Garde-fous de suppression (users ET secteurs)
- Select service listant 'service - région'


**Problèmes**
- Pas d'édition (create+delete seulement), asymétrie avec regions.
- window.confirm natif.
- Aucun empty state, pas de skeleton.
- Compteurs en texte brut.
- Pas de recherche/filtre malgré un volume potentiellement élevé.
- Lecture défensive nb_utilisateurs ?? utilisateurs_count révèle un contrat API instable (deux noms de champs possibles).


**Écart vs cible ClickUp** — Moyen.


**Actions**
  - 🟠 P1 · `M` · *correction* — Ajouter l'édition + harmoniser le contrat API (un seul nom de champ compteur)
  - 🟠 P1 · `S` · *correction* — Dialog confirmation + toasts au lieu de window.confirm
  - 🟠 P1 · `M` · *correction* — Empty state + skeleton + recherche


### `apps/web/src/pages/Admin/Structure/secteurs.tsx`

**État actuel** — CRUD secteurs : table (Secteur/Service/District/Région/Utilisateurs/Actions), Dialog create avec Select service puis district dépendant (reset à la sélection service). Pas d'édition.


**Forces**
- Selects en cascade service->district bien gérés (reset du district au changement de service)
- Gestion 'Aucun district' via valeur sentinelle __none__
- Cellule secteur à deux niveaux


**Problèmes**
- Pas d'édition, asymétrie avec regions.
- window.confirm natif.
- Aucun empty state, pas de skeleton.
- 'Direct service' affiché en texte pour district vide, pourrait être une pill discrète.
- Pas de recherche/filtre.
- Compteur utilisateurs en texte brut.


**Écart vs cible ClickUp** — Moyen.


**Actions**
  - 🟠 P1 · `M` · *amelioration* — Ajouter l'édition pour cohérence
  - 🟠 P1 · `S` · *correction* — Dialog confirmation + toasts
  - 🟠 P1 · `S` · *correction* — Empty state + skeleton


**Incohérences internes à la famille**
- Asymétrie CRUD majeure dans Structure : regions.tsx propose create ET edit (Dialog partagé), mais services/districts/secteurs ne proposent que create + delete. Comportement incohérent pour des entités sœurs.
- Double implémentation des formulaires utilisateur : Index.tsx contient des modales Create/Edit complètes ET il existe des pages Create.tsx/Edit.tsx autonomes qui font la même chose. Deux sources de vérité, risque de divergence (ex : l'erreur de mutation est affichée dans les modales mais pas dans les pages).
- Confirmation de suppression incohérente : toutes les pages Structure utilisent window.confirm() natif (anti-pattern, hors DS), alors que Show.tsx désactive sans aucune confirmation, et qu'aucune n'utilise le Dialog du design system pour confirmer.
- Badges non sémantiques partout : statuts, rôles, types (Tanière), gaps sont rendus soit en Badge gris générique (secondary/default/outline) soit en texte brut. Aucune page n'utilise un code couleur sémantique cohérent.
- États vides absents sur quasi toutes les tables : seule Index.tsx (utilisateurs) gère un empty state (et uniquement textuel). Toutes les tables Structure et la table subordonnés de Show n'ont aucun message vide.
- Chargement incohérent : Index utilisateurs passe par Suspense+DashboardSkeleton (générique, ne matche pas la table) ; les pages Structure n'ont aucun état de chargement visible.
- Fuites techniques dans les sous-titres orientés utilisateur : Create/Edit utilisateurs ('via POST/PUT /admin/...') et Structure index ('données NestJS'). Registre développeur, pas produit.
- Header non contextuel partout : chaque page met un H1+sous-titre dans le flux de contenu plutôt qu'un vrai header de vue avec filtres/breadcrumb/action primaire ; le pageTitle AppLayout duplique souvent ce titre.
- Labels de formulaire incohérents : utilisateurs exposent les clés techniques brutes (id_region, role_nom), tandis que Structure utilise de vrais labels FR ('Nom du district', 'Service commercial'). Deux standards dans la même famille.
- Contrat API instable trahi par le code défensif (nb_utilisateurs ?? utilisateurs_count, key avec -index) dans services/districts/secteurs.


**Top actions de la famille**
- Refondre les formulaires utilisateur (Create/Edit/modales) : champs nommés FR + Select pour les FK (rôle, région, branche, manager) + validation, et supprimer la double implémentation modale/page — c'est le plus gros écart 'trop simple' P0.
- Introduire un système de pills/badges sémantiques cohérent (statuts actif/inactif, rôles, types, gaps) et l'appliquer à toutes les pages de la famille pour tuer le 'gris uniforme'.
- Remplacer tous les window.confirm natifs et le 'Désactiver' sans confirmation par un Dialog de confirmation destructif du DS, et ajouter des toasts de succès/erreur sur toutes les mutations.
- Ajouter empty states illustrés (avec CTA) et skeletons de table matchant les colonnes sur toutes les tables de la famille (aujourd'hui quasi absents).
- Harmoniser le CRUD Structure : ajouter l'édition à services/districts/secteurs pour aligner sur regions, et passer chaque page sous un header contextuel avec filtres/recherche.


---

## Admin · Rôles & Remplacements — **38/100**

> Famille fonctionnelle mais nettement "trop simple" au sens du reproche client : ce sont des écrans CRUD bruts (KPI cards plates, tables anémiques sans tri/filtre/densité, modales basiques) où le seul accent rouge est le bouton primaire. Le péché capital transverse : tous les statuts et métadonnées passent par Badge variant="secondary"/"default"/"outline" qui rendent en gris ou quasi-noir, alors que le composant Badge expose des variants sémantiques success/warning/info/error inutilisés — l'UI paraît morte au scan. Aucun état vide, aucun skeleton, aucun toast de confirmation, des window.confirm/alert natifs, et un fichier mort (CreateRule.tsx, Inertia) qui pollue la famille. Les fondations (layout, Card, Button, Dialog) sont correctes, mais le rendu reste celui d'un back-office générique, loin de la cible ClickUp-like.


### `apps/web/src/pages/Admin/Roles/index.tsx`

**État actuel** — Page liste des rôles : header titre + 2 actions (Permissions outline, Nouveau rôle rouge), 4 KPI cards (Total/Tanière/Non tanière/Inter-branches), table avec recherche client-side et modale de création inline. Suppression via window.confirm natif.


**Forces**
- Header contextuel correct : titre + sous-titre + action primaire rouge bien isolée (1 seule, conforme à la règle accent)
- Recherche multi-champs réactive (code/nom/description/branche) via useMemo
- TruncatedTableBody pour limiter le rendu (previewCount 10) — bon réflexe densité
- Colonne Permissions condensée en groupe de mini-badges (Auto/Pairs/Subs/Cross) : lecture rapide des capacités


**Problèmes**
- KPI cards = boîtes plates : label gris + chiffre, aucune icône, aucune tendance, aucun accent, aucun hover — exactement l'anti-pattern 'boîte plate' refusé
- Tous les badges en variant='secondary' (gris) : niveau, permissions, statut — gris uniforme, l'UI ne porte aucun sens chromatique au scan
- Table anémique : pas de tri par colonne, pas de filtre par branche/niveau/permission, densité figée, pas d'actions de ligne révélées au hover (boutons Voir/Supprimer toujours visibles, pas d'affordance ...)
- Aucun état vide : si roles=[] la table est une zone blanche sans message ni CTA
- Aucun skeleton : useAdminRoles sans fallback de chargement structurel (risque écran/layout vide pendant le fetch)
- Suppression destructive via window.confirm() natif — pas de Dialog de confirmation, anti-pattern UX et hors charte
- Pas de toast de confirmation après création/suppression (l'utilisateur doute du succès)
- Bouton primaire stylé en className brut bg-sabc-red-primary plutôt que via variant='primary' du Button (incohérence d'API)
- Bouton Supprimer en variant='outline' gris au lieu de variant='error'/'destructive' : action dangereuse non signalée visuellement


**Écart vs cible ClickUp** — Loin de la cible. ClickUp-like attend : KPI cards riches (icône+valeur+delta), table avec tri/filtres/densité réglable/actions au hover, statuts en pills sémantiques, et au minimum un sélecteur de vue (table/cartes). Ici on a un tableau HTML stylé sans vie. Accent rouge correctement parcimonieux, mais c'est le seul critère réellement tenu.


**Actions**
  - 🔴 P0 · `S` · *correction* — Remplacer tous les Badge secondary par variants sémantiques (niveau=info, permissions actives=primary/success, statut)
  - 🔴 P0 · `M` · *correction* — Ajouter un EmptyState (illustration+titre+CTA 'Créer le premier rôle') quand filteredRoles est vide, distinguer sans-résultat de recherche
  - 🟠 P1 · `S` · *correction* — Ajouter un skeleton de table pendant le chargement (réutiliser Skeleton variant table)
  - 🟠 P1 · `M` · *correction* — Remplacer window.confirm de suppression par un Dialog de confirmation destructif + bouton error
  - 🟠 P1 · `S` · *amelioration* — Ajouter toast de succès/erreur après create/delete (primitive Toast existante)
  - 🟡 P2 · `M` · *amelioration* — Enrichir les KPI cards : icône lucide, accent, hover, et lien vers liste filtrée
  - 🟡 P2 · `L` · *amelioration* — Tri par colonne + filtre par branche/niveau + actions de ligne révélées au hover (migrer vers DataTable)


### `apps/web/src/pages/Admin/Roles/create.tsx`

**État actuel** — Formulaire de création de rôle (route /admin/roles/create) : une seule Card 'Informations du rôle' en grille 2 colonnes (code, nom, branche, niveau via 2 Select, description, 4 checkboxes de permissions), header avec bouton Retour, actions Annuler/Créer en bas.


**Forces**
- Grille responsive md:grid-cols-2 propre, espacements cohérents (gap-4)
- Désactivation du bouton Créer tant que champs requis manquants + état isPending ('Création...')
- Branche/code auto-uppercase à la saisie : bonne micro-attention
- Réutilise le layout partagé AdminRolesLayout (cohérence d'en-tête)


**Problèmes**
- Doublon fonctionnel total avec la modale de création de index.tsx (même initialForm, même mutation copiée-collée) : deux chemins de création divergeront
- Aucune validation inline ni messages d'erreur de champ : pas de FormMessage, pas de gestion d'erreur API affichée (contrairement à la modale de index qui, elle, montre errorMessage)
- Champ branche en Input texte libre uppercase au lieu d'un Select de branches existantes — saisie non contrainte, source d'incohérences de données
- Permissions en checkboxes natives sans regroupement visuel ni explication : 'Peut évaluer ses pairs' sans contexte
- Aucun toast ni feedback de succès (navigation silencieuse vers la fiche)
- Bouton primaire en className brut au lieu de variant='primary'


**Écart vs cible ClickUp** — Formulaire fonctionnel mais plat. Cible attend un système de Form (label/erreur/aide), des champs contraints (Select branches), et un feedback. Ici c'est une grille d'inputs sans couche d'orchestration form.


**Actions**
  - 🟠 P1 · `M` · *amelioration* — Factoriser le formulaire de rôle en composant partagé utilisé par la modale ET la page create
  - 🟠 P1 · `S` · *correction* — Afficher les erreurs API et validation de champ (réutiliser le pattern errorMessage déjà présent dans index)
  - 🟠 P1 · `M` · *correction* — Remplacer l'Input branche libre par un Select alimenté par les branches existantes
  - 🟡 P2 · `S` · *amelioration* — Ajouter toast de confirmation à la création


### `apps/web/src/pages/Admin/Roles/show.tsx`

**État actuel** — Fiche rôle : layout 2 colonnes (carte Détails 360px + carte Utilisateurs affectés). Header avec nom/description, boutons Retour et 'Basculer auto-évaluation'. Détails en lignes label:valeur, permissions en badges, table d'utilisateurs.


**Forces**
- Layout asymétrique lg:grid-cols-[360px,1fr] pertinent (résumé fixe + contenu large)
- Badges de permissions avec variant conditionnel default/outline : un effort vers l'état visible (le seul écran à le faire)
- Structure claire détails vs utilisateurs


**Problèmes**
- Détails affichés en simple liste 'label: valeur' texte — pas de definition list stylée, pas de pills, pas de hiérarchie : densité pauvre, paraît brut
- Badges de permissions toujours présents même quand faux (juste outline) : ambigu, on ne distingue pas 'capacité absente' d'un simple style
- Bouton 'Basculer auto-évaluation' : action obscure, isolée, sans confirmation ni toast, en outline gris (affordance faible pour une mutation)
- Table Utilisateurs : pas de tri, pas de recherche, statut en texte brut (user.statut) au lieu d'une pill sémantique, pas d'avatar/initiales
- Aucun état vide si role.utilisateurs=[] : table vide muette
- Aucun skeleton de chargement (useAdminRole sans fallback)
- Pas de chips colorées pour le niveau (T/NT) comme dans la liste — incohérence avec index.tsx


**Écart vs cible ClickUp** — Fiche détail trop 'fiche technique'. Cible attend : en-tête avec avatar/contexte, métadonnées en pills, KPI de l'usage du rôle, table utilisateurs avec avatars et statuts colorés. Ici c'est une page de debug.


**Actions**
  - 🟠 P1 · `M` · *correction* — Statut utilisateur en pill sémantique + avatar/initiales colorées dans la table
  - 🟠 P1 · `S` · *correction* — États vides pour la table utilisateurs + skeleton pendant le chargement
  - 🟡 P2 · `S` · *correction* — Confirmation + toast pour 'Basculer auto-évaluation', et clarifier le libellé/affordance du bouton
  - 🟡 P2 · `M` · *amelioration* — Restyler le bloc Détails en grille de métadonnées avec pills (niveau, portée) plutôt que liste texte


### `apps/web/src/pages/Admin/Roles/permissions.tsx`

**État actuel** — Page règles d'évaluation : 4 KPI cards (Rôles/Règles/Actives/Cross-branch), table des règles (nom, nb critères, statut, action Basculer), modale de création avec un Textarea de JSON brut pour les critères.


**Forces**
- Header de carte avec action primaire alignée à droite (flex justify-between) : pattern propre
- Recherche client-side sur les règles
- Statut en Badge avec variant conditionnel default/outline (léger effort sémantique)


**Problèmes**
- ANTI-PATTERN MAJEUR : saisie des critères via un Textarea de JSON brut ('Le champ critères attend un JSON valide') — UX inacceptable pour un back-office RH, expose l'utilisateur à des erreurs de parsing
- KPI cards plates identiques à index (boîtes label+chiffre)
- Statut 'Active' en variant='default' (quasi-noir) au lieu de success vert ; 'Inactive' en outline gris — code couleur sémantique absent
- Colonne Critères = simple nombre, aucun aperçu/expansion des critères ni de leurs poids
- Action 'Basculer' sans confirmation ni toast, libellé ambigu
- Aucun état vide si rules=[] ; aucun skeleton de chargement
- Doublon conceptuel avec CreateRule.tsx (fichier mort) qui propose, lui, un éditeur de critères structuré : la bonne UX existe ailleurs mais n'est pas câblée


**Écart vs cible ClickUp** — Très loin. Le JSON brut est l'antithèse d'un 'composant recherché mais efficace'. Cible : éditeur de critères ligne par ligne (nom/poids avec jauge, total live à 100%), statut en pill verte/grise, table avec expansion.


**Actions**
  - 🔴 P0 · `L` · *correction* — Remplacer le Textarea JSON par un éditeur de critères structuré (lignes nom+poids, total live, validation 100%)
  - 🔴 P0 · `S` · *correction* — Statut règle en pill sémantique (Active=success vert, Inactive=gris)
  - 🟠 P1 · `S` · *correction* — État vide + skeleton sur la table des règles
  - 🟡 P2 · `M` · *amelioration* — Confirmation + toast sur Basculer, et aperçu/expansion des critères dans la table


### `apps/web/src/pages/Admin/Roles/CreateRule.tsx`

**État actuel** — FICHIER MORT non routé (absent de app.tsx). Legacy Inertia : importe useForm/Head de inertia-shim, post('/admin/roles/rules'), props auth injectées. Contient pourtant l'éditeur de critères structuré (nom/description/poids, total live, validation 100%, sélection de rôles en cartes cliquables).


**Forces**
- Éditeur de critères bien plus abouti que permissions.tsx : total des poids calculé en live, alerte AlertTriangle si !=100%, ajout/suppression de critères
- Sélection de rôles en cartes cliquables avec état actif rouge (border-sabc-red-primary bg-sabc-red-light) : pattern de sélection recherché
- Icônes lucide (Save/Plus/Trash2) qui structurent les actions


**Problèmes**
- Code mort : non importé dans app.tsx, dépend d'une stack Inertia abandonnée (CLAUDE.md indique Laravel/Inertia déprécié) — dette et confusion pour la famille
- Validation par alert() natif ('La somme des poids... doit être 100%') — anti-pattern
- Sélection de rôle via carte cliquable contenant un Checkbox qui utilise onChange (et non onCheckedChange) : handler probablement cassé sur le composant Checkbox Radix
- bg-sabc-red-light comme fond de sélection : rouge en zone large, frôle l'anti-pattern 'rouge en décor'
- Incohérence d'architecture totale avec le reste de la famille (React Query + react-router)


**Écart vs cible ClickUp** — Paradoxe : contient les meilleurs patterns d'édition de la famille (critères structurés, sélection en cartes) mais dans un fichier mort/legacy. La logique devrait être portée dans permissions.tsx.


**Actions**
  - 🟠 P1 · `M` · *correction* — Supprimer le fichier mort OU porter son éditeur de critères structuré vers permissions.tsx puis le retirer
  - 🟠 P1 · `S` · *correction* — Si réactivé : remplacer alert() par feedback inline et corriger onChange->onCheckedChange du Checkbox


### `apps/web/src/pages/Admin/Remplacements/index.tsx`

**État actuel** — Liste des remplacements : agrège actifs/à venir/historique via useSuspenseQuery (3 fetch parallèles), 3 KPI cards, table fusionnée dédupliquée avec recherche, actions Voir/Modifier/Terminer par ligne. Statut Actif/Terminé.


**Forces**
- Agrégation propre des 3 sources + déduplication par id
- useSuspenseQuery : intègre le chargement au boundary Suspense (mieux que les autres écrans de la famille)
- Recherche multi-champs (titulaire/remplaçant/rôle)
- Action conditionnelle 'Terminer' affichée seulement si actif


**Problèmes**
- Fusionner actif/à-venir/historique en une seule table fait perdre la sémantique des 3 catégories — un board/tabs par statut (à venir / actif / terminé) serait bien plus lisible (vue ClickUp attendue)
- Statut en Badge default (quasi-noir) vs outline : Actif devrait être success vert, à-venir info bleu, Terminé gris — sémantique absente
- Période affichée en chaîne brute 'date_debut → date_fin' sans formatage localisé ni mise en forme
- Table anémique : pas de tri (par date/statut), pas de filtre par catégorie, densité figée, 3 boutons texte par ligne toujours visibles (pas de hover/menu ...)
- Aucun état vide explicite (le Suspense gère le loading mais pas le 'aucun remplacement')
- Action 'Terminer' = mutation directe sans confirmation ni toast (action métier importante)
- Dépend de la donnée est_actif pour le statut alors qu'à-venir et historique sont fusionnés : un remplacement à venir non actif sera étiqueté 'Terminé' à tort — bug de libellé de statut


**Écart vs cible ClickUp** — Cible forte ici : la donnée se prête à une vue board par statut ou des tabs. À la place, table grise unique. Bug sémantique de statut (à venir traité comme terminé) est disqualifiant sur le critère pills.


**Actions**
  - 🔴 P0 · `M` · *correction* — Corriger le calcul de statut : distinguer à-venir / actif / terminé (ne pas déduire de est_actif seul)
  - 🔴 P0 · `S` · *correction* — Statuts en pills sémantiques (Actif=success, À venir=info, Terminé=gris)
  - 🟠 P1 · `S` · *correction* — Confirmation + toast sur 'Terminer'
  - 🟠 P1 · `S` · *correction* — État vide illustré + CTA quand aucun remplacement
  - 🟡 P2 · `L` · *amelioration* — Proposer tabs/board par catégorie + tri par date + dates formatées localisées


### `apps/web/src/pages/Admin/Remplacements/Create.tsx`

**État actuel** — Formulaire de création : Card unique grille 2 colonnes (Select titulaire, Select remplaçant filtré, dates début/fin, service, durée calculée readonly, motif). Rôle/région déduits du titulaire.


**Forces**
- Déduction intelligente rôle/région depuis le titulaire (UX qui réduit la saisie)
- Remplaçant filtré pour exclure le titulaire : prévention d'erreur
- Durée calculée en live et affichée en readonly
- Désactivation conditionnelle du bouton + état isPending


**Problèmes**
- Durée plafonnée silencieusement à Math.max(30, ...) : un remplacement de 5 jours affichera '30 jour(s)' sans explication — confusion utilisateur, règle métier cachée
- Selects de matricules avec potentiellement des centaines d'entrées (limit:1000) sans recherche/combobox : scroll inutilisable à grande échelle
- Aucune validation de cohérence des dates (fin avant début possible)
- Aucun message d'erreur API affiché, aucun toast de succès
- Pas de skeleton/disabled pendant le chargement des users (Select vide si data pas encore là)
- Bouton primaire en className brut au lieu de variant


**Écart vs cible ClickUp** — Formulaire correct mais Selects non cherchables sur gros volumes = anti-pattern densité RH. Cible attend un Combobox de recherche d'agents (avec avatar/rôle) et feedback de validation.


**Actions**
  - 🟠 P1 · `L` · *correction* — Remplacer les Select de matricules par un Combobox cherchable (recherche par nom/matricule)
  - 🟠 P1 · `S` · *correction* — Expliquer/afficher la règle de durée min 30j (helper text) plutôt que plafonner silencieusement
  - 🟠 P1 · `M` · *correction* — Validation dates (fin>=début) + erreurs API affichées + toast succès
  - 🟡 P2 · `S` · *amelioration* — Utiliser variant='primary' du Button au lieu du className brut


### `apps/web/src/pages/Admin/Remplacements/Edit.tsx`

**État actuel** — Formulaire d'édition quasi identique à Create (remplaçant, dates, service, motif, durée) hydraté depuis useSuspenseQuery, titulaire/rôle figés. Bouton Enregistrer.


**Forces**
- Hydratation propre du form depuis la donnée via useEffect
- Réutilise la même grille que Create (cohérence visuelle des deux formulaires)
- Titulaire/rôle correctement verrouillés (non éditables)


**Problèmes**
- Duplication massive du formulaire avec Create.tsx (mêmes champs, même grille, même logique durée) — devrait être un composant partagé
- Bouton Enregistrer : pas de disabled lié à isPending (le texte change en 'Enregistrement...' mais le bouton reste cliquable, double-submit possible)
- Mêmes problèmes que Create : durée plafonnée silencieuse, dates non validées, pas de toast, Select non cherchable
- Aucune indication de chargement des users (Select remplaçant peut être vide)
- Ordre des champs différent de Create (durée placée en 2e position ici) : micro-incohérence inter-écrans


**Écart vs cible ClickUp** — Mêmes écarts que Create. La non-factorisation crée un risque de divergence et déjà une micro-incohérence d'ordre des champs.


**Actions**
  - 🟠 P1 · `M` · *amelioration* — Factoriser un RemplacementForm partagé entre Create et Edit
  - 🟠 P1 · `S` · *correction* — Ajouter disabled={isPending} au bouton Enregistrer (prévenir double-submit)
  - 🟡 P2 · `S` · *correction* — Aligner l'ordre des champs sur Create + toast de succès


### `apps/web/src/pages/Admin/Remplacements/Show.tsx`

**État actuel** — Fiche remplacement : 3 cartes (Informations générales, Titulaire, Remplaçant) en grille 2 colonnes. Header avec Retour/Modifier/Terminer. Données en lignes label:valeur, statut en Badge.


**Forces**
- Bonne organisation tripartite (contexte / titulaire / remplaçant)
- Statut en Badge conditionnel default/outline
- Mise en page lg:grid-cols-2 équilibrée avec colonne droite empilée


**Problèmes**
- Données en liste 'label: valeur' texte brut — aucune hiérarchie, aucune pill, aucun avatar pour titulaire/remplaçant : paraît une fiche technique de debug
- Statut 'Actif' en default (quasi-noir) au lieu de success vert — sémantique absente, incohérent avec ce qu'attend la cible
- Action 'Terminer' sans confirmation ni toast (mutation métier importante déclenchée d'un clic)
- Aucun skeleton (Suspense au boundary mais pas de fallback structurel local)
- Dates affichées par slice(0,10) brut sans formatage localisé
- Pas de timeline/visualisation de la période (début→fin→durée) alors que la donnée s'y prête
- Téléphone/email affichés 'N/A' en texte gris : aucune action (mailto/tel), opportunité manquée


**Écart vs cible ClickUp** — Fiche trop brute. Cible attend en-tête avec avatars des deux agents, statut en pill, période en visualisation, et coordonnées actionnables. Ici, dump de champs.


**Actions**
  - 🟠 P1 · `M` · *correction* — Statut en pill sémantique (success/gris) + avatars titulaire/remplaçant
  - 🟠 P1 · `S` · *correction* — Confirmation + toast sur Terminer
  - 🟡 P2 · `M` · *amelioration* — Formater les dates en localisé + ajouter une visualisation de période/durée
  - 🟡 P2 · `S` · *amelioration* — Rendre email/téléphone actionnables (mailto/tel)


**Incohérences internes à la famille**
- Deux conventions de nommage de fichiers coexistent dans la famille : Roles/ en lowercase (create.tsx, show.tsx, permissions.tsx, index.tsx) vs Remplacements/ en PascalCase (Create.tsx, Edit.tsx, Show.tsx) + index.tsx. À uniformiser.
- Roles a une création EN MODALE (index.tsx) ET une création EN PAGE (create.tsx) avec code dupliqué à l'identique : deux UX concurrentes pour la même action, qui vont diverger.
- Remplacements duplique intégralement son formulaire entre Create.tsx et Edit.tsx (mêmes champs, même grille, même calcul de durée) sans composant partagé — et l'ordre des champs diffère déjà entre les deux.
- Usage des Badge totalement incohérent et systématiquement non sémantique : la famille n'utilise jamais les variants success/warning/info/error pourtant disponibles, tout passe par secondary/default/outline (gris ou quasi-noir). C'est l'incohérence visuelle dominante.
- Les boutons primaires sont stylés en className brut 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark' au lieu du variant='primary' du Button — sur les 6+ écrans, contournant l'API du composant et risquant la divergence en dark mode.
- Chargement traité différemment selon l'écran : Remplacements utilise useSuspenseQuery (loading au boundary), Roles utilise useAdmin* sans fallback structurel. Aucun des deux n'a de skeleton local.
- Confirmations destructives incohérentes : Roles/index utilise window.confirm natif ; Remplacements (Terminer) ne confirme pas du tout ; aucun Dialog de confirmation réutilisable.
- Aucun écran de la famille n'émet de toast après une mutation (create/update/delete/terminer/toggle) — feedback de succès absent partout.
- CreateRule.tsx est un vestige Inertia mort (non routé) qui contredit l'architecture React Query + react-router du reste de la famille, tout en contenant paradoxalement le meilleur éditeur de critères.


**Top actions de la famille**
- Remplacer systématiquement les Badge secondary/default par des pills sémantiques (statuts Actif/À venir/Terminé, Active/Inactive, permissions, niveaux) sur toute la famille — c'est le levier #1 pour tuer le 'gris uniforme' et rapprocher de la cible ClickUp (P0, effort global M).
- Corriger le bug de statut des remplacements (à-venir étiqueté Terminé car déduit de est_actif seul) et migrer la liste vers des tabs/board par catégorie (P0).
- Remplacer le Textarea de JSON brut des critères (permissions.tsx) par l'éditeur structuré déjà écrit dans CreateRule.tsx (nom/poids/total live à 100%), puis supprimer le fichier mort (P0).
- Ajouter partout : états vides illustrés + CTA, skeletons de chargement, et toasts de confirmation après chaque mutation ; remplacer window.confirm/alert natifs par des Dialog de confirmation (P0/P1).
- Factoriser les doublons : formulaire de rôle partagé entre la modale index et la page create ; formulaire de remplacement partagé entre Create et Edit ; uniformiser le nommage des fichiers et l'usage de variant='primary' (P1).


---

## Common · Évaluations (flux collaborateur) + Axes d'amélioration — **63/100**

> Famille fonctionnellement riche et globalement cohérente (tokens SABC, pills sémantiques, cards à plusieurs niveaux), mais qui plafonne au niveau "bonne base ClickUp-like" sans atteindre le premium : aucun skeleton screen (tout est "Chargement…" texte ou "…"), pas de toast — le feedback passe par des Alert inline et un setTimeout(3s) de redirection, navigation par window.location.href (full reload) qui casse l'esprit SPA, empty states textuels sans illustration ni CTA, et un header non contextuel (titre h1 dans le contenu, pas de barre d'action primaire + breadcrumb). ToValidate.tsx est le maillon faible : codé en gris/vert/rouge Tailwind bruts hors design system, il jure avec le reste de la famille.


### `apps/web/src/pages/Common/Evaluations/index.tsx`

**État actuel** — Tableau de bord d'accueil : Alert période, carte de progression (3 tuiles KPI), CTA central, grille de 5 liens rapides en cartes-icônes.


**Forces**
- Accent rouge maîtrisé (icônes/CTA), reste en neutres
- Tuiles KPI sémantiquement colorées (ambre brouillons, vert soumis)
- Liens rapides avec hover -translate-y + bordure rouge, transitions correctes
- Alert période ouverte/fermée bien différenciée


**Problèmes**
- Aucun état de chargement : useEvaluationWorkflowData() consommé sans isLoading, les KPI affichent 0 puis sautent (layout shift) à l'arrivée des données
- Les <a href> provoquent des full reloads au lieu d'une navigation React Router (CTA, liens rapides)
- Header non contextuel : simple h1+p dans le flux, pas de barre d'action primaire ni breadcrumb
- Pas d'empty state illustré quand 0 cible : seulement l'Alert grise
- CTA centré (justify-center) inhabituel pour un layout dense type ClickUp — l'action primaire devrait être ancrée en header


**Écart vs cible ClickUp** — Header générique (anti-pattern 11) et absence de skeleton (anti-pattern 5). Sinon proche de la cible sur l'accent et les cartes. Manque le sélecteur de vue / la logique header-contextuel.


**Actions**
  - 🟠 P1 · `M` · *correction* — Ajouter un skeleton structurel (3 tuiles + grille de liens) pendant le chargement du workflow
  - 🟠 P1 · `S` · *correction* — Remplacer les <a href> par <Link> React Router pour éviter les full reloads
  - 🟡 P2 · `S` · *amelioration* — Promouvoir le CTA en header contextuel (titre + action primaire à droite) au lieu d'un bouton centré


### `apps/web/src/pages/Common/Evaluations/Mine.tsx`

**État actuel** — Hero card (badge+titre+sous-titre / encart période), 4 MetricTiles, ActiveRulesCard, liste de cibles éligibles en cartes, historique récent, QuickActions. Ouvre EvaluationModal.


**Forces**
- Cartes cibles à plusieurs niveaux (nom/rôle/action Évaluer) avec désactivation contextuelle et raison affichée
- Bonne densité d'information et regroupement par type de cible
- Logique de disponibilité (période + règle applicable) explicite à l'utilisateur


**Problèmes**
- Aucun isLoading : pas de skeleton, contenu vide puis pop-in
- Cartes cibles sans avatar/initiales ni progression — la grille de design exige avatar + pill statut + jauge sur une carte 'collaborateur à évaluer' (composant trop simple ici)
- Navigation Historique via window.location.href (full reload)
- Hero card en shadow-lg + border-none : ombre plus marquée que l'échelle subtile recommandée, incohérent avec les autres cards de la page
- Pas de hover/actions révélées sur les lignes d'historique (juste un bouton Voir statique)
- Liste plate sans pagination/tri alors que l'historique peut être long (slice 12 arbitraire)


**Écart vs cible ClickUp** — Cards cibles 'recherchées mais incomplètes' : il manque avatar coloré déterministe + jauge de complétion pour atteindre le '2'. Pas de skeleton. Ombre hero non conforme à l'échelle d'élévation.


**Actions**
  - 🟠 P1 · `M` · *amelioration* — Enrichir la carte cible : Avatar (initiales colorées) + pill statut + barre de progression de l'évaluation
  - 🟠 P1 · `M` · *correction* — Ajouter skeleton screens pour les tuiles et les listes pendant le chargement
  - 🟡 P2 · `S` · *correction* — Aligner l'ombre du hero sur l'échelle (shadow subtile) et retirer le border-none isolé
  - 🟡 P2 · `S` · *correction* — Remplacer window.location.href par navigate() React Router


### `apps/web/src/pages/Common/Evaluations/Pending.tsx`

**État actuel** — Hero card + 4 MetricTiles + Tabs (par type) regroupant brouillons/soumis par statut avec chips colorées et TruncatedList, puis bloc 'à valider'. QuickActions.


**Forces**
- Regroupement par statut avec chips sémantiques (ambre brouillon, bleu soumis) et bordure gauche accentuée — card recherchée
- Tabs pour segmenter par type d'évaluation : bonne densité maîtrisée
- TruncatedList (preview 5 + modal) pour gérer le volume
- Code couleur statut documenté en STATUS_META, cohérent avec les tuiles


**Problèmes**
- Aucun isLoading : pas de skeleton
- Deux sections de feedback (chip de groupe + Badge sur item) redondantes visuellement pour la même info statut
- Navigation par window.location.href dans renderEvaluationItem (full reload)
- Empty states = Alert grise sans CTA (anti-pattern 4 partiel)
- Pas d'actions révélées au hover sur les lignes — bouton toujours visible, pas de surlignage de ligne


**Écart vs cible ClickUp** — Très proche de la cible sur les pills/regroupement. Bloque sur skeleton absent et empty states sans illustration/CTA. La double indication de statut (chip+badge) dilue la lisibilité au scan.


**Actions**
  - 🟠 P1 · `M` · *correction* — Skeleton pour tuiles + listes (matcher dimensions finales)
  - 🟡 P2 · `S` · *amelioration* — Empty states avec icône + CTA ('Démarrer une évaluation') au lieu d'Alert grise
  - 🟡 P2 · `S` · *amelioration* — Dédupliquer l'indication de statut (chip de groupe OU badge de ligne, pas les deux)


### `apps/web/src/pages/Common/Evaluations/Recues.tsx`

**État actuel** — Header h1, 3 StatTiles, card de filtres (Select shadcn + 2 <select> natifs), liste de cartes d'évaluations reçues. fetch() brut avec token localStorage.


**Forces**
- Empty state avec icône (Inbox) + message — meilleur que les Alert grises ailleurs
- Pills type + statut sémantiques sur chaque carte
- Bouton Réinitialiser conditionnel propre
- Filtres groupés et labellisés


**Problèmes**
- INCOHÉRENCE MAJEURE : mélange Select shadcn (Période) et <select> HTML natifs (Type, Statut) sur la même barre de filtres — rendus et comportements différents
- fetch() manuel + token en localStorage au lieu du service api/React Query standard (Donnees fait pareil ; Historique/Mine utilisent les hooks) — incohérence d'architecture data
- Chargement = texte 'Chargement…' centré, pas de skeleton
- Empty state sans CTA ni distinction premier-usage / filtre-vide
- Header non contextuel, pas d'action primaire
- Pas de tri ni densité réglable sur la liste (table anémique vs usage RH intensif)


**Écart vs cible ClickUp** — Filtres hétérogènes (anti-pattern incohérence composants) et table sans tri/densité (anti-pattern 10). Loading texte au lieu de skeleton.


**Actions**
  - 🔴 P0 · `S` · *correction* — Remplacer les <select> natifs par le composant Select shadcn pour homogénéiser la barre de filtres
  - 🟠 P1 · `M` · *correction* — Migrer le fetch() brut vers evaluationsApi + React Query (cohérence + gestion d'erreur)
  - 🟠 P1 · `M` · *amelioration* — Skeleton de liste + empty state avec CTA et distinction sans-résultat/premier-usage


### `apps/web/src/pages/Common/Evaluations/Donnees.tsx`

**État actuel** — Quasi-jumeau de Recues : header, 5 StatTiles, filtres mixtes Select+<select>, liste de cartes avec ActionButton contextuel par statut et motif de rejet inline.


**Forces**
- ActionButton contextuel (Reprendre/Corriger/Voir) selon le statut — action contextuelle bien pensée
- Motif de rejet affiché inline en encart ambre — bon traitement d'erreur métier
- 5 tuiles couvrant tout le cycle de statut, sémantiquement colorées
- Empty state avec icône


**Problèmes**
- Même incohérence Select shadcn vs <select> natif que Recues
- Même fetch() brut + localStorage hors architecture standard
- Bouton 'Reprendre' en bg-amber-500 et 'Corriger' en rouge SABC : l'ambre comme couleur d'action concurrence l'accent rouge (devrait être neutre/outline, l'action primaire restant rouge)
- 5 tuiles dépassent le repère 'max 5-7 KPI' mais sur petit écran (md:grid-cols-3) la 4e/5e tuile se réorganisent mal
- Chargement texte, pas de skeleton
- Header non contextuel


**Écart vs cible ClickUp** — Identique à Recues sur filtres/loading. En plus, l'ambre utilisé comme couleur de bouton enfreint 'accent maîtrisé' (l'action primaire unique doit être rouge, le reste neutre).


**Actions**
  - 🔴 P0 · `S` · *correction* — Homogénéiser les filtres (Select shadcn) — identique à Recues
  - 🟠 P1 · `S` · *correction* — Neutraliser le bouton Reprendre (outline) pour réserver le rouge à l'action primaire
  - 🟡 P2 · `M` · *amelioration* — Factoriser Recues+Donnees (StatTile, filtres, carte liste quasi identiques) en composants partagés
  - 🟠 P1 · `M` · *amelioration* — Skeleton + empty state CTA


### `apps/web/src/pages/Common/Evaluations/Historique.tsx`

**État actuel** — Hero card avec filtres Select (statut/période/type) + compteur, corps avec liste divisée (divide-y), pagination prev/next, gestion isLoading/isError/empty.


**Forces**
- SEULE page de la famille avec gestion explicite isLoading + isError + empty distincts
- Filtres 100% Select shadcn (cohérent, contrairement à Recues/Donnees)
- Liste dense en divide-y avec note/badge/action, pagination présente
- Compteur de résultats


**Problèmes**
- isLoading = texte 'Chargement…' (pas de skeleton structurel)
- Liste en <div> divide-y plutôt qu'une vraie Table avec tri par colonne (pas de tri, densité figée)
- Pagination minimaliste (prev/next, pas de page-size ni saut de page)
- navigate() React Router ici (bien) mais le reste de la famille fait window.location.href — incohérence interne de navigation
- Header en Card shadow-lg border-none : même ombre trop marquée que Mine/Pending


**Écart vs cible ClickUp** — La meilleure page sur les états (loading/error/empty séparés) mais la liste reste une 'table anémique' (pas de tri/densité). Loading texte au lieu de skeleton.


**Actions**
  - 🟠 P1 · `L` · *amelioration* — Convertir la liste en DataTable (tri colonne, densité réglable, sticky header)
  - 🟠 P1 · `S` · *correction* — Skeleton de table pendant le chargement
  - 🟡 P2 · `S` · *amelioration* — Enrichir la pagination (sélecteur page-size, indication X-Y sur N)


### `apps/web/src/pages/Common/Evaluations/Show.tsx`

**État actuel** — Détail riche : barre d'actions (retour/éditer/PDF), hero gradient avec statut+période, cartes évaluateur/évalué (avatars), bloc score 3 colonnes (note globale/cadre/dates), ActiveRulesCard, grille de critères en cartes, commentaire global.


**Forces**
- Page la plus 'recherchée' de la famille : hiérarchie typo claire, avatars colorés (variant warning pour l'évalué), jauge de score, critères en cartes avec code couleur note (vert/ambre/rouge) et icône commentaire
- Fenêtre d'édition 72h affichée dynamiquement — micro-info contextuelle de qualité
- Bloc score 3 colonnes dense et lisible
- Tooltips natifs (title) sur les cartes critères


**Problèmes**
- Aucun isLoading : useEvaluation(id) sans skeleton — la page se construit avec evaluation=undefined (risque de flash/blank)
- Hero gradient (from-white via-white to-sabc-red-light/40) : gradient décoratif gratuit, flagué anti-pattern 13 'sur-décoration'
- 'Télécharger un PDF' = window.print() : affordance trompeuse (ce n'est pas un export PDF réel)
- Navigation Retour/Éditer via window.location.href (full reload)
- Critères en title= natif : tooltip non accessible, tronqué, incohérent avec un futur Tooltip Radix
- Pas de gestion d'erreur (évaluation introuvable / 404)


**Écart vs cible ClickUp** — Très proche du premium sur la richesse des composants, mais le gradient hero et l'absence de skeleton/erreur l'empêchent de scorer plein. Le 'PDF' factice est un piège UX.


**Actions**
  - 🟠 P1 · `M` · *correction* — Ajouter skeleton de détail + état d'erreur 404 explicite
  - 🟡 P2 · `S` · *correction* — Retirer le gradient décoratif du hero au profit d'un fond neutre + accent maîtrisé
  - 🟠 P1 · `M` · *correction* — Implémenter un vrai export PDF ou renommer/clarifier le bouton (window.print n'est pas un téléchargement)
  - 🟡 P2 · `M` · *amelioration* — Migrer la navigation vers React Router et les tooltips vers Tooltip accessible


### `apps/web/src/pages/Common/Evaluations/Edit.tsx`

**État actuel** — Formulaire de saisie : bandeau offline/sync, barre d'actions (brouillon/soumettre), panneau infos clés (template/évalué/progression), cycle actif, retour manager, ActiveRulesCard, saisie critères (boutons note 1-5 + textarea), commentaire global, alertes de feedback.


**Forces**
- Auto-save IndexedDB + sync offline avec bandeau dédié : feature avancée bien matérialisée
- Jauge de progression live, boutons note 1-5 en pills rouges contextuelles avec hover
- Validation des commentaires obligatoires sous seuil (bordure rouge + désactivation Soumettre) — feedback inline précis
- Loading sur les boutons (saveMutation.isPending) bien géré


**Problèmes**
- Aucun skeleton de chargement initial de l'évaluation (formulaire vide avant données)
- Feedback de succès/erreur via Alert empilées en bas de page + setTimeout(3000) de redirection : devrait être un toast non bloquant (anti-pattern feedback)
- Navigation Retour via window.location.href
- Sélecteur de note = 5 boutons ronds custom (h-9 w-9 rounded-full) : composant ad hoc, pas un Slider/RadioGroup du DS — incohérent avec le système de form
- Beaucoup d'Alert utilisées comme conteneurs de 'conseil'/info, banalisant le composant Alert
- Le bandeau offline et l'alerte 'commentaires requis' peuvent s'empiler et pousser le contenu (densité hero variable)


**Écart vs cible ClickUp** — Riche et fonctionnel, mais le feedback post-action n'est pas un toast et la redirection setTimeout est fragile. Skeleton manquant. Le picker de note mériterait un composant DS standardisé.


**Actions**
  - 🟠 P1 · `M` · *correction* — Remplacer les Alert de feedback + setTimeout par des toasts sémantiques (succès/erreur) non bloquants
  - 🟠 P1 · `M` · *correction* — Skeleton du formulaire pendant le chargement de l'évaluation
  - 🟡 P2 · `M` · *amelioration* — Standardiser le sélecteur de note (composant Rating/RadioGroup du DS) réutilisable
  - 🟡 P2 · `S` · *correction* — Navigation React Router au lieu de window.location.href


### `apps/web/src/pages/Common/Evaluations/ToValidate.tsx`

**État actuel** — Liste de validation manager : header, 2 stats (total/en retard), liste de cartes cliquables (avatar initiales, badges période/critères/visibilité, note colorée, ancienneté, CTA Valider), ouvre ValidationModal. Empty state avec coche.


**Forces**
- Carte de validation riche : avatar initiales, méta multi-niveaux, pills, note colorée, indicateur d'urgence (bordure gauche rouge >3j)
- Carte entière cliquable + CTA Valider avec stopPropagation — bonne ergonomie
- Stat 'en retard' qui passe en rouge SABC conditionnellement


**Problèmes**
- INCOHÉRENCE DESIGN SYSTEM MAJEURE : page codée en text-gray-900/500/400, text-green-600/yellow-600/red-600, bg-sabc-red-light en dur — n'utilise quasiment PAS les tokens SABC (sabc-gray, sabc-success/warning/error) contrairement à tout le reste de la famille. Rendu et dark mode divergents
- Avatar fait main (w-10 h-10 rounded-full bg-sabc-red-light) au lieu du composant Avatar utilisé dans Show/Edit — incohérence de composant
- Aucun isLoading (useEvaluationWorkflowData)
- Empty state = caractère HTML &#10003; (coche) au lieu d'une icône lucide + pas de CTA
- Stats en 2 cartes seulement, sans icône (StatTile non réutilisé) — incohérent avec Pending/Donnees/Recues
- max-w-5xl alors que le reste de la famille est en max-w-6xl — largeur de page incohérente


**Écart vs cible ClickUp** — Maillon le plus faible : couleurs hors design system (anti-pattern incohérence inter-écrans), avatar et stats ad hoc, empty state pauvre. La structure de carte est bonne mais l'exécution rompt l'unité de la famille.


**Actions**
  - 🔴 P0 · `M` · *correction* — Remplacer toutes les classes text-gray/green/yellow/red brutes par les tokens SABC (sabc-gray, sabc-success/warning/error)
  - 🟠 P1 · `S` · *correction* — Utiliser le composant Avatar et StatTile partagés (supprimer les versions ad hoc)
  - 🟠 P1 · `S` · *correction* — Aligner la largeur de page sur max-w-6xl et l'empty state sur le pattern icône+CTA
  - 🟠 P1 · `S` · *correction* — Ajouter isLoading/skeleton pour la liste de validations


### `apps/web/src/pages/Common/Evaluations/Submissions/Show.tsx`

**État actuel** — Fichier VIDE (0 ligne) — composant mort/non implémenté présent dans l'arborescence.



**Problèmes**
- Fichier vide importé potentiellement par une route : risque d'écran blanc total si routé (aucun layout, aucun contenu)
- Dette : présence d'un placeholder jamais terminé dans le flux collaborateur


**Écart vs cible ClickUp** — Hors cible total : un écran vide est l'anti-pattern absolu (pas de header, pas de contenu, pas d'état).


**Actions**
  - 🔴 P0 · `M` · *correction* — Implémenter la page (réutiliser le détail de Show.tsx) ou la supprimer + retirer la route associée


### `apps/web/src/pages/Common/AxesAmelioration/index.tsx`

**État actuel** — Page polymorphe par scope (individual/manager/director/admin) via DashboardPageFrame : MetricCards, AnalyticsFiltersCard, radar, listes axes/recommandations, tables équipe, drill-down hiérarchique, recherche utilisateur (admin).


**Forces**
- Architecture par rôle propre, réutilise des cards d'analytics dédiées (forte densité maîtrisée)
- Radar + bar charts + tables : vues multiples pertinentes pour l'analytics
- MetricCards avec border-l-4 accentuée par sémantique
- Filtres riches (recherche, rôle, niveau, priorité, région) en Select cohérents + recherche admin avec icône
- Drill-down collaborateur et coupe hiérarchique : vraie profondeur d'analyse


**Problèmes**
- Aucun isLoading global : les useQuery multiples (admin en a ~8) n'affichent pas de skeleton — la page se remplit par à-coups (pop-in successif, layout shift)
- EmptyState partagé = simple boîte en bordure pointillée + texte, SANS illustration ni CTA (anti-pattern 4/12) — répété partout dans la page
- Couleurs de barres en HEX en dur (#C62828, #1D4ED8, #C62828) au lieu des tokens chart SABC — incohérence avec --sabc-chart-* et le dark mode
- 6 niveaux de cards empilées sans hiérarchie de section claire pour les rôles director/admin : risque de mur de cartes peu scannable
- MetricCard label en uppercase tracking-[0.18em] : valeur arbitraire hors échelle, et l'uppercase très espacé nuit à la lecture rapide
- Pas de header contextuel avec action primaire (DashboardPageFrame fournit titre/sous-titre mais pas d'action)


**Écart vs cible ClickUp** — Vues multiples et densité conformes, mais l'absence de skeleton sur une page très data-lourde et l'EmptyState pauvre sont les écarts majeurs. Les couleurs de charts en dur cassent la cohérence chromatique du DS.


**Actions**
  - 🟠 P1 · `L` · *correction* — Ajouter des skeletons par card/section pour les nombreuses requêtes (surtout scope admin)
  - 🟠 P1 · `M` · *amelioration* — Refondre EmptyState (icône + titre + CTA) et l'appliquer à toutes les sections vides
  - 🟡 P2 · `S` · *correction* — Remplacer les couleurs de barres en HEX par les tokens --sabc-chart-*
  - 🟡 P2 · `L` · *amelioration* — Structurer les vues director/admin en sections repliables/onglets pour réduire le mur de cartes


**Incohérences internes à la famille**
- Navigation incohérente : Historique et AxesAmelioration utilisent navigate()/Link React Router, mais index/Mine/Pending/Show/Edit utilisent window.location.href (full reload) — deux paradigmes de navigation dans la même famille.
- Architecture data incohérente : Mine/Pending/Show/Edit/Historique passent par les hooks React Query (useEvaluationWorkflowData/useEvaluation/evaluationsApi), tandis que Recues et Donnees font des fetch() bruts avec token localStorage.
- Composants de filtre incohérents : Recues et Donnees mélangent le Select shadcn (période) et des <select> HTML natifs (type/statut) sur la même barre ; Historique et AxesAmelioration utilisent 100% Select shadcn.
- Tokens couleur : ToValidate.tsx est codé en text-gray/green/yellow/red Tailwind bruts hors design system, alors que toutes les autres pages utilisent les tokens sabc-* — divergence de rendu et de dark mode.
- Largeur de page : ToValidate en max-w-5xl, toutes les autres en max-w-6xl.
- États de chargement : seule Historique gère isLoading+isError+empty distincts ; les pages basées sur le workflow hook (index/Mine/Pending/ToValidate) n'ont AUCUN état de chargement ; aucune page n'utilise de skeleton screen (uniquement 'Chargement…' ou '…').
- Ombres hero : Mine/Pending/Historique utilisent Card shadow-lg border-none (ombre marquée) là où les cards internes restent en shadow subtile — pas d'échelle d'élévation unifiée.
- Composants ad hoc dupliqués : StatTile/MetricTile sont redéfinis localement dans Mine, Pending, Recues, Donnees (4 implémentations quasi identiques) ; ToValidate refait avatar et stats à la main au lieu des composants partagés.
- Empty states hétérogènes : Recues/Donnees ont icône+texte, Pending/Mine utilisent des Alert grises, ToValidate un caractère HTML coche, AxesAmelioration la boîte pointillée EmptyState — aucun ne propose de CTA.
- Feedback post-action : Edit utilise des Alert empilées + setTimeout(3s) ; aucune page n'utilise de toast, alors que le DS expose un composant Toast.


**Top actions de la famille**
- Introduire des skeleton screens partout (aucune page n'en a) et brancher isLoading sur les pages workflow (index/Mine/Pending/ToValidate) qui n'ont aucun état de chargement — c'est l'écart le plus visible vs la cible premium.
- Aligner ToValidate.tsx sur le design system : remplacer text-gray/green/yellow/red bruts par les tokens SABC, réutiliser Avatar/StatTile, passer en max-w-6xl — c'est l'incohérence inter-écrans la plus flagrante.
- Homogénéiser les barres de filtres de Recues/Donnees (supprimer les <select> natifs au profit du Select shadcn) et unifier l'architecture data (migrer les fetch() bruts vers React Query).
- Remplacer le feedback inline + setTimeout d'Edit par des toasts sémantiques non bloquants, et unifier la navigation sur React Router (supprimer les window.location.href).
- Implémenter ou supprimer Submissions/Show.tsx (fichier vide = écran blanc potentiel) et refondre l'EmptyState partagé en pattern icône+titre+CTA appliqué à toute la famille.


---

## Dashboards par rôle (DR, CDTT, CSC, CDV, CDS, TMO, SS, RTM, SRMO, AS, Manager, Collaborateur) — **42/100**

> La famille est scindée en trois tiers de maturité radicalement inégaux qui cohabitent dans une même navigation : (A) un socle "production" data-driven et soigné — les pages Dashboard de DR/CSC/CDV/CDS/CDTT (re-exports de RoleDirector/RoleManagerDashboardPage) plus Manager et Collaborateur — qui approche réellement la cible ClickUp (MetricCards à liseré, skeletons structurels, EmptyState, badges sémantiques, Recharts thémés) ; (B) une couche "maquette" figée (Teams, Performance, Districts, Sectors, Commercial, Marketing, Objectives, CDS/Performance) bourrée de données factices, de chiffres text-5xl façon plaquette, de tableaux bruts sans tri/filtre/hover et de graphiques "à implémenter" ; (C) des coquilles vides (TMO, SS, RTM, SRMO, AS) avec une seule Card "Contenu à implémenter", strictement hors cible. Le verdict global est tiré vers le bas par la cohabitation : un même rôle (ex. CDS) offre un Dashboard premium et une page Performance qui ressemble à un slide PowerPoint. Le socle prouve que l'équipe sait faire ; le reste n'a pas été porté.


### `apps/web/src/Components/Dashboard/RoleDashboardShared.tsx`

**État actuel** — Bibliothèque partagée des dashboards production (DashboardPageFrame, MetricCard, EmptyState, ActiveRulesCard, QuickActionsCard, helpers de badges/types/dates). Consommée par tous les Dashboard/index data-driven.


**Forces**
- MetricCard recherchée : label en small-caps tracking, valeur 2xl bold, caption méta, liseré gauche accentué sémantiquement (rouge/info/success/warning) — exactement la stat-card attendue
- getStatusBadgeVariant/getPriorityBadgeVariant centralisent un mapping sémantique cohérent (success/info/warning), dark mode pris en charge partout
- getEvaluationTypeMeta apporte une ancre visuelle (icône+teinte) par type d'évaluation, vrai niveau 'recherché'
- DashboardPageFrame fournit un header contextuel : titre + sous-titre + pill 'Période active', non statique


**Problèmes**
- navigateTo() fait window.location.href = path : full reload au lieu de navigation React Router, casse l'expérience SPA (perte d'état, flash blanc) sur toutes les Actions rapides et le bouton Évaluer
- QuickActionsCard utilise bg-gradient-to-r from-sabc-red-primary/5 : gradient décoratif gratuit, anti-pattern 'sur-décoration' de la cible
- EmptyState est un simple cadre pointillé + texte : pas d'illustration/icône ni de CTA, ne distingue pas premier-usage / filtré / erreur (niveau partiel vs cible)
- Couleurs de charts en dur (#C62828, #1D4ED8) dans les pages consommatrices au lieu des tokens --sabc-chart-*


**Écart vs cible ClickUp** — Proche de la cible sur les stat-cards et le header contextuel ; s'en écarte par l'EmptyState non illustré/sans CTA, le gradient décoratif et surtout la navigation full-reload non-SPA.


**Actions**
  - 🔴 P0 · `S` · *correction* — Remplacer navigateTo(window.location.href) par useNavigate de React Router
  - 🟠 P1 · `M` · *amelioration* — Enrichir EmptyState : prop icône + titre + description + CTA optionnel, 3 variantes (vide/filtré/erreur)
  - 🟡 P2 · `S` · *amelioration* — Retirer le gradient de QuickActionsCard, revenir à un fond neutre avec accent rouge sur le titre uniquement
  - 🟡 P2 · `S` · *amelioration* — Brancher les couleurs Recharts sur les tokens --sabc-chart-* au lieu des hex en dur


### `apps/web/src/Components/Dashboard/RoleManagerDashboardPage.tsx (CSC, CDV, CDS, Manager-like)`

**État actuel** — Dashboard manager data-driven : 4 MetricCards, BarChart score/type, RadarChart axes, table membres consolidée (TeamMemberAnalyticsTableCard), carte Alertes, ActiveRulesCard, QuickActions. Re-exporté par CSC/Dashboard, CDV/Dashboard, CDS/Dashboard.


**Forces**
- Densité de données riche et hiérarchisée : 4 KPI + 2 graphes + table + alertes, sans surcharge
- Table membres avec Progress de score, badges d'axes sémantiques priorisés, action 'Évaluer' contextuelle au hover — proche de la 'card/table recherchée' de la cible
- Tooltip Recharts custom thémé (rounded-xl, border, shadow) cohérent avec le DS
- Alertes construites dynamiquement (validation en attente, couverture manquante, baisse de perf) avec badges de sévérité


**Problèmes**
- Aucun sélecteur de période ni filtre dans le header : le manager ne peut pas changer le cycle évalué (la pill période est en lecture seule), alors que la cible attend filtres/sélecteur de vue
- Pas de vues multiples (table uniquement pour l'équipe) ; aucun board par statut alors que le suivi 'à faire/soumis/validé' est central en RH
- Table d'équipe sans tri par colonne ni densité réglable ni sticky header : 'table anémique' partielle malgré la richesse des cellules
- Le chargement repose sur Suspense+DashboardSkeleton au niveau de la page index, mais la carte Alertes/validations n'a pas d'état de chargement granulaire si refetch
- barSize/fill en dur (#C62828) dupliqué entre Manager et Director


**Écart vs cible ClickUp** — Bonne base ClickUp-like sur la densité et la table riche ; écart sur l'absence de filtres/sélecteur de période dans le header et de vues multiples (board par statut).


**Actions**
  - 🟠 P1 · `M` · *amelioration* — Ajouter un sélecteur de période actif dans le header (Select alimenté par les périodes ouvertes)
  - 🟠 P1 · `M` · *amelioration* — Activer tri par colonne + sticky header + densité réglable sur TeamMemberAnalyticsTableCard
  - 🟡 P2 · `L` · *amelioration* — Proposer une vue board par statut d'évaluation (à faire/soumis/validé) en complément de la table
  - 🟡 P2 · `S` · *amelioration* — Factoriser la palette de barres dans un constant partagé thémé


### `apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx (DR)`

**État actuel** — Dashboard directeur régional : 4 MetricCards, BarChart perf par rôle (double axe), BarChart horizontal par niveau, HierarchyChainCard, RadarChart axes, historique évaluations données, table périmètre complet, validations à arbitrer, ActiveRulesCard, QuickActions.


**Forces**
- Très dense et analytique : double-axe score/couverture, répartition par niveau hiérarchique en barres horizontales, chaîne hiérarchique — pertinent pour un pilotage régional
- Table périmètre avec colonne Niveau + Évaluations, réutilise la table riche partagée
- Empty states présents sur chaque graphe et liste (cohérence interne avec le socle)


**Problèmes**
- Grille grid-cols-2 sur mobile pour les 4 KPI (vs sm:grid-cols-2 ailleurs) : incohérence de breakpoint avec le Manager qui force 2 colonnes dès le plus petit écran, KPI tassés sur petit mobile
- Aucun filtre région/période dans le header alors qu'un DR pilote justement par région : la cible attend des sélecteurs contextuels
- BarChart 'Performance par rôle' superpose deux séries (score 0-5 et couverture 0-100) sur des axes distincts sans légende explicite ni libellé d'unité visible — lecture ambiguë
- Listes 'évaluations données' et 'validations' en cartes empilées sans pagination ni tri (slice(0,5/6)), pas de lien 'voir tout' clair


**Écart vs cible ClickUp** — Densité analytique conforme à la cible, mais header sans filtres (région/période) et lisibilité du double-axe à améliorer ; vues multiples absentes.


**Actions**
  - 🟠 P1 · `S` · *correction* — Harmoniser la grille KPI sur sm:grid-cols-2 xl:grid-cols-4 comme le Manager
  - 🟠 P1 · `M` · *amelioration* — Ajouter filtres région + période dans le header du DR
  - 🟡 P2 · `S` · *amelioration* — Ajouter légende explicite et libellés d'unité sur le BarChart double-axe
  - 🟡 P2 · `M` · *amelioration* — Remplacer les slices par des listes paginées avec lien 'Voir tout'


### `apps/web/src/pages/Collaborateur/Dashboard.tsx`

**État actuel** — Dashboard collaborateur bespoke (React Query) : 3 KPI (score global avec barre, progression vs période, nb à compléter), table 'à compléter' avec CTA Reprendre, table 'reçues', bouton Voir tout.


**Forces**
- Vraies données + refetch 60s, hiérarchie typo correcte, barres de progression et badges statut (Brouillon/Soumis/Validé) sémantiques
- CTA contextuel par ligne ('Reprendre' lié à l'édition) — table avec action, niveau recherché
- Score global présenté avec jauge rouge SABC — accent maîtrisé


**Problèmes**
- Réimplémente ses propres badges statut inline (StatutBadgeACompleter/Recue) au lieu du composant Badge + getStatusBadgeVariant partagé : divergence de rendu vs les dashboards manager (incohérence inter-écrans)
- Loading = simple texte 'Chargement…' centré, pas de DashboardSkeleton structurel (contrairement aux pages index) : layout shift à l'arrivée des données
- Aucun état d'erreur explicite (isError non géré, fallback générique 'Impossible de charger')
- Tables sans tri/filtre/sticky ; rayons rounded-lg sur badges alors que la cible attend ~4px pour les pills, et bouton avec couleurs en dur bg-sabc-red-primary plutôt que variant Button


**Écart vs cible ClickUp** — Fonctionnel et plutôt propre, mais sous la cible à cause du chargement non-skeleton, des badges/boutons non factorisés et de l'absence d'états d'erreur et de tri.


**Actions**
  - 🟠 P1 · `S` · *correction* — Remplacer le 'Chargement…' par DashboardSkeleton et gérer isError
  - 🟠 P1 · `S` · *correction* — Utiliser le composant Badge partagé + getStatusBadgeVariant au lieu des badges inline
  - 🟡 P2 · `S` · *amelioration* — Utiliser variant primary du Button au lieu des classes bg-sabc-red en dur
  - 🟡 P2 · `M` · *amelioration* — Ajouter tri/filtre sur les deux tables d'évaluations


### `apps/web/src/pages/Manager/Dashboard.tsx`

**État actuel** — Dashboard manager legacy bespoke (différent du RoleManagerDashboardPage) : filtre période par UUID texte libre, 4 KPI, table subordonnés, LineChart 6 mois, table validations paginée. Branché sur /api/dashboard/manager.


**Forces**
- Pagination réelle sur les validations, refetch 30s, LineChart Recharts, indicateur de jours d'attente avec seuil rouge
- Barre de progression du taux de complétion
- Gère isLoading/isError sur le bloc principal


**Problèmes**
- DOUBLON FONCTIONNEL avec RoleManagerDashboardPage : deux dashboards manager concurrents au design et endpoints différents (/api/dashboard/manager vs useRoleDashboardData) — incohérence interne majeure
- Filtre période = champ texte libre demandant un UUID brut ('Ex : 550e8400-...') : anti-pattern UX grave, inutilisable pour un manager réel
- Badge de statut affiche la valeur brute 'green'/'orange'/'red' comme libellé (statut_couleur) au lieu d'un label métier — pills non sémantiques en mots techniques
- Loading = texte 'Chargement…', pas de skeleton ; KPI cards plates (icône+chiffre+label) sans liseré ni caption, moins riches que MetricCard du socle
- Couleurs de lignes LineChart en dur (#48BB78/#ED8936), classes statutBadgeClass redéfinies localement (vert/orange/rouge Tailwind bruts) vs tokens SABC


**Écart vs cible ClickUp** — Sous la cible : champ UUID inutilisable, badges techniques, KPI plates, pas de skeleton ; en plus c'est un doublon du dashboard manager moderne qui sème la confusion.


**Actions**
  - 🔴 P0 · `L` · *correction* — Décider de la source de vérité : déprécier ce dashboard au profit de RoleManagerDashboardPage, ou le migrer dessus
  - 🔴 P0 · `M` · *correction* — Remplacer le champ UUID par un Select de périodes (libellés lisibles)
  - 🟠 P1 · `S` · *correction* — Afficher des libellés métier dans les badges de statut au lieu de 'green/orange/red'
  - 🟠 P1 · `M` · *amelioration* — Utiliser DashboardSkeleton et MetricCard partagés pour aligner sur le socle


### `apps/web/src/pages/DR/Teams.tsx + DR/Performance.tsx`

**État actuel** — Pages secondaires DR à données 100% factices codées en dur (teamsData, performanceData). KPI en text-5xl, tables Avatar+Badge+barre de perf, top performers.


**Forces**
- Avatars avec initiales colorées (bg-sabc-red-light), badges de rôle, barres de progression : composants pas totalement plats
- Mise en page en grille 3 colonnes lisible


**Problèmes**
- Données mockées en dur : aucune connexion API, donc aucun état vide/chargement/erreur — anti-pattern disqualifiant
- KPI géants text-5xl façon plaquette marketing, hors échelle typo des MetricCards du socle (incohérence inter-écrans flagrante)
- Tables brutes <Table> sans tri/filtre/hover/actions de ligne/sticky : 'table anémique'
- Badges de rôle utilisent un fond plein coloré (bg-sabc-red-primary, bg-sabc-accent) en aplat saturé : rouge SABC utilisé en décor, pas en accent
- getRoleBadgeColor mappe plusieurs rôles sur la même couleur (rouge pour CDTT et RTM) sans logique sémantique documentée
- Statut 'actif' en Badge vert constant : pas d'information réelle
- Header local (h1 + Badge région) sans action primaire ni breadcrumb


**Écart vs cible ClickUp** — Très loin de la cible : maquette statique, KPI surdimensionnés, tables sans interaction, accent rouge en aplat décoratif, zéro état de données.


**Actions**
  - 🔴 P0 · `L` · *correction* — Brancher sur l'API réelle (hiérarchie/analytics région) avec skeleton + EmptyState + erreur
  - 🟠 P1 · `M` · *correction* — Remplacer les KPI text-5xl par les MetricCards partagées
  - 🟠 P1 · `M` · *amelioration* — Remplacer les tables brutes par TeamMemberAnalyticsTableCard (tri/hover/actions)
  - 🟡 P2 · `S` · *amelioration* — Passer les badges de rôle en pills teintées claires au lieu d'aplats rouges saturés


### `apps/web/src/pages/CDTT/Commercial.tsx + CDTT/Marketing.tsx + CDV/Sectors.tsx + CSC/Districts.tsx + CSC/Performance.tsx`

**État actuel** — Pages secondaires à données factices : listes CSC/RTM/TMO/districts/secteurs avec KPI text-5xl, tables brutes, barres de perf, badge statut. CSC/Performance ajoute un BarChart mock et 3 cartes 'indicateurs' avec shadow.


**Forces**
- Structure de liste lisible, barres de progression inline, DropdownMenu d'actions présent sur CSC/Districts (Voir détails/Modifier)
- CSC/Performance tente un BarChart réel et des cartes KPI


**Problèmes**
- Toutes les données sont mockées en dur : aucun état vide/chargement/erreur (disqualifiant)
- KPI text-5xl en couleurs concurrentes (rouge + accent + success) côte à côte : 'si tout est coloré, rien ne ressort', hiérarchie d'accent détruite
- CSC/Performance : cartes 'bg-white p-4 rounded-lg shadow' codées à la main au lieu du composant Card — incohérence de rayon/ombre ; et BarChart avec backgroundColor:'var(--sabc-red-primary)' mélangé à un dataset type:'line' douteux
- CSC/Districts : DropdownMenuItem contient un <a href='#'> avec ses propres px-4 py-2 (double padding imbriqué dans l'item) — structure cassée, liens morts
- CSC/Districts utilise un SVG inline 'trois points' au lieu de l'icône lucide/ActionMenu existant
- Headers locaux sans action primaire ; CSC/Performance mélange text-gray-900 (Tailwind brut) et text-sabc-gray-* selon les pages (incohérence de tokens)


**Écart vs cible ClickUp** — Hors cible : maquettes figées, KPI saturés multicolores, cartes/ombres faites main hors composant, actions de ligne en liens morts, tokens de gris incohérents.


**Actions**
  - 🔴 P0 · `L` · *correction* — Brancher ces listes sur les endpoints hiérarchie/analytics réels avec skeleton/EmptyState/erreur
  - 🟠 P1 · `S` · *correction* — Remplacer cartes 'bg-white shadow' faites main par le composant Card
  - 🟠 P1 · `S` · *correction* — Réparer le DropdownMenu de CSC/Districts (items cliquables réels via ActionMenu, supprimer href='#')
  - 🟠 P1 · `M` · *amelioration* — Réduire à un seul KPI accentué rouge, les autres en neutre, et passer aux MetricCards
  - 🟡 P2 · `S` · *amelioration* — Uniformiser les tokens de gris (sabc-gray-*) et retirer les text-gray-* bruts


### `apps/web/src/pages/CDS/Performance.tsx + CDS/Objectives.tsx + CDV/Performance.tsx`

**État actuel** — Pages perso/objectifs à données factices. CDS/Performance : jauge SVG circulaire faite main, classement, barres par catégorie, et 'Graphique d'évolution (à implémenter)'. CDS/Objectives : cartes d'objectifs avec Progress et badges catégorie/statut. CDV/Performance : 3 KPI + placeholder graphe.


**Forces**
- CDS/Performance : jauge circulaire SVG soignée, barres par catégorie, classement Top 20% — vrai effort visuel
- CDS/Objectives : cartes d'objectif relativement recherchées (titre/description/Progress/échéance/2 badges), utilise le composant Progress et des libellés de statut/catégorie
- Helpers getStatusLabel/getCategoryLabel produisent des libellés métier lisibles (bon, contrairement au Manager)


**Problèmes**
- Données mockées : aucun état vide/chargement/erreur
- Placeholders 'Graphique d'évolution de la performance (à implémenter)' en clair dans l'Ut — zone morte assumée (CDS/Performance, CDV/Performance) : anti-pattern 'zone blanche'
- CDS/Performance : stroke='#E53E3E' en dur dans le SVG, et toutes les catégories forcées à bg-sabc-red-primary : barres toutes rouges, aucune différenciation, accent en décor
- CDV/Performance : KPI text-5xl multicolores + carte graphe vide, page quasi vide de sens
- Badges catégorie/statut en aplats pleins colorés (bg-sabc-red-primary/info/accent) plutôt qu'en pills teintées claires de la cible
- Headers locaux sans action primaire ni filtre période


**Écart vs cible ClickUp** — Effort visuel notable (jauge, cartes objectifs) mais plombé par les données factices, les graphes 'à implémenter', les aplats rouges et l'absence d'états — sous la cible.


**Actions**
  - 🔴 P0 · `M` · *correction* — Implémenter réellement les graphes d'évolution (Recharts LineChart) ou retirer les placeholders
  - 🟠 P1 · `L` · *correction* — Brancher score/objectifs sur l'API analytics individuelle avec états vide/chargement/erreur
  - 🟡 P2 · `S` · *amelioration* — Différencier les couleurs de barres par catégorie via tokens chart, jauge thémée par token
  - 🟡 P2 · `S` · *amelioration* — Passer badges catégorie/statut en pills teintées claires


### `apps/web/src/pages/TMO/Activities.tsx, TMO/Performance.tsx, SS/Events.tsx, SS/Assistants.tsx, RTM/Campaigns.tsx, RTM/Operators.tsx, SRMO/Campaigns.tsx, SRMO/Operators.tsx, AS/Events.tsx, AS/Reports.tsx`

**État actuel** — Coquilles vides : une ou deux Cards contenant un paragraphe gris ('Contenu à implémenter' / 'Aucun rapport disponible'). Aucune donnée, aucun KPI, aucun graphe.


**Forces**
- Encapsulées dans AppLayout (sidebar/header hérités cohérents), donc le shell reste correct


**Problèmes**
- Pages totalement non implémentées : 'Contenu à implémenter' visible en production — disqualifiant
- Aucun KPI, table, graphe, état vide structuré ni CTA : 'boîte plate' absolue, exactement le 'trop simple' rejeté par le client
- Texte en text-gray-600 brut (Tailwind), hors tokens SABC
- AS/Reports et AS/Events ré-implémentent un faux empty state textuel ('Aucun rapport disponible') sans illustration ni CTA
- Aucun header contextuel digne (juste un h1 ou un CardTitle), pas d'action primaire


**Écart vs cible ClickUp** — Totalement hors cible : ce sont des placeholders, pas des écrans. Aucun critère ClickUp satisfait.


**Actions**
  - 🔴 P0 · `L` · *correction* — Implémenter le contenu réel (liste/KPI/graphe selon le rôle) branché API, ou masquer ces routes tant que vides
  - 🟠 P1 · `M` · *correction* — À défaut de contenu, afficher un EmptyState illustré normalisé avec titre + explication + CTA
  - 🟡 P2 · `S` · *amelioration* — Remplacer les text-gray-600 bruts par les tokens sabc-gray-*


**Incohérences internes à la famille**
- Trois tiers de maturité cohabitent dans la même nav : production data-driven (Dashboard/index, Manager, Collaborateur), maquettes figées (Teams/Performance/Districts/Sectors/Commercial/Marketing/Objectives), coquilles vides (TMO/SS/RTM/SRMO/AS). Un même rôle (CDS) a un Dashboard premium ET une page Performance slide-PowerPoint.
- Doublon de dashboard manager : Manager/Dashboard.tsx (endpoint /api/dashboard/manager, champ UUID, KPI plates) coexiste avec RoleManagerDashboardPage (useRoleDashboardData, MetricCards) — deux designs et deux backends pour la même intention.
- KPI incohérents : le socle utilise MetricCard (valeur 2xl, label small-caps, liseré accent) ; les pages mock utilisent des chiffres text-5xl multicolores centrés. Deux langages de stat-card opposés.
- Badges incohérents : socle = composant Badge + variant sémantique (success/info/warning) ; Collaborateur = badges inline maison ; Manager legacy = libellés techniques 'green/orange/red' ; pages mock = aplats pleins bg-sabc-red/accent. Quatre traitements de pill différents.
- Tokens de gris incohérents : la plupart des pages utilisent sabc-gray-*, mais CSC/Performance, TMO, SS, RTM, SRMO emploient text-gray-* Tailwind bruts.
- Chargement incohérent : les pages index ont DashboardSkeleton (via Suspense) ; Manager et Collaborateur n'ont qu'un texte 'Chargement…' ; les pages mock n'ont aucun état (données en dur).
- Navigation incohérente : QuickActions et Évaluer font des full-reload (window.location.href) alors que le reste de l'app est une SPA React Router.
- Header incohérent : socle = DashboardPageFrame (titre+sous-titre+pill période) ; pages mock = h1 local + Badge région ; stubs = simple CardTitle. Aucune n'expose de filtre/sélecteur de vue ni d'action primaire à droite.


**Top actions de la famille**
- Trancher la dette de tiers : porter (ou masquer en attendant) les coquilles vides TMO/SS/RTM/SRMO/AS et brancher les maquettes figées (Teams, Performance, Districts, Sectors, Commercial, Marketing, Objectives) sur les API réelles avec skeleton + EmptyState + erreur — c'est ce qui plombe le score.
- Éliminer le doublon de dashboard manager : choisir RoleManagerDashboardPage comme source de vérité et déprécier/migrer Manager/Dashboard.tsx (et supprimer le champ période UUID inutilisable).
- Unifier le langage des composants transverses sur le socle : MetricCard partagée partout (fin des KPI text-5xl), composant Badge + getStatusBadgeVariant partout (fin des badges inline, libellés techniques et aplats rouges), DashboardSkeleton partout (fin des 'Chargement…').
- Corriger la navigation non-SPA : remplacer navigateTo(window.location.href) et le bouton Reprendre par useNavigate React Router.
- Doter chaque header de rôle d'un sélecteur de période (et région pour le DR) et d'une action primaire à droite, pour atteindre le header contextuel ClickUp ; enrichir EmptyState (illustration + CTA, 3 variantes).


---
