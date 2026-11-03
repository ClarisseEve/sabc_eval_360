# Reprise audit et vérification complète

## Formulaire d’évaluation — restauration et justifications

- [x] Restaurer la présentation du formulaire conforme aux captures : informations clés, cycle actif, cadre d’évaluation, saisie des critères et progression.
- [x] Exiger un commentaire sous le niveau requis du template (sans assouplir un seuil de règle plus strict) et pour une note maximale de 5, côté interface et côté API.
- [x] Séparer le commentaire final en deux zones : points forts et compétences non acquises ou à améliorer, avec conservation du commentaire global historique.
- [x] Ajouter/mettre à jour les tests ciblés frontend et API, puis lancer typechecks et builds concernés.

### Revue

Le formulaire reprend la disposition des captures. Les commentaires de critère bloquent la soumission sous le niveau requis (ou le seuil de règle plus strict) et à la note maximale, avec validation serveur. Les deux commentaires de synthèse ont des colonnes dédiées; `commentaire_global` est maintenu sous forme lisible pour les anciens consommateurs et les anciens commentaires restent éditables.

Vérifications : 8 tests frontend et 61 tests API ciblés réussis, typechecks et builds NestJS/React réussis. La migration PostgreSQL a été appliquée à une table `evaluations` dans un schéma jetable; la présence des deux colonnes a été vérifiée et le schéma supprimé.

- [x] Reconstituer la passation et inventorier les changements locaux existants.
- [ ] Rendre les migrations MySQL et PostgreSQL reproductibles sur bases vierges.
- [ ] Aligner le seed, les identifiants de période et les contrats API/BDD.
- [ ] Rendre l'image API et le routage frontend Docker réellement démarrables.
- [ ] Ajouter une commande racine de vérification statique complète.
- [ ] Activer les tests unitaires et d'intégration utiles dans la CI.
- [ ] Exécuter builds, typecheck, lint non destructif, tests, migrations et smoke tests.
- [ ] Documenter le lancement local, Docker et les limites restantes.

## Revue finale

À compléter après la matrice de vérification.

## Remarques de l'encadreur — imports, hiérarchie et plateforme

### Phase 1 — Imports Excel

- [x] Définir et documenter deux modèles Excel tabulaires : utilisateurs et templates/compétences.
- [x] Ajouter le téléchargement de ces modèles et un import ADMIN avec aperçu avant validation.
- [x] Valider les lignes, références (rôle, région, manager) et contraintes métier avant toute écriture.
- [x] Ignorer les doublons/lignes invalides sans écrasement implicite ; importer les lignes valides et afficher les erreurs avec numéros de ligne.
- [x] Enregistrer les utilisateurs dans MySQL et les templates dans PostgreSQL en réutilisant les services et validations existants.
- [x] Tester les cas valides, invalides, doublons et erreurs de référence.

### Phase 2 — Affectation hiérarchique

- [x] Remplacer la saisie libre du matricule du manager à la création par une sélection de managers éligibles.
- [x] Rendre explicite la hiérarchie DR → subordonnés et permettre de vérifier les affectations depuis l'interface.
- [x] Réutiliser les validations existantes contre les cycles et les incohérences de rôle/région.
- [x] Vérifier que l'import utilisateur applique les mêmes validations lors de l'affectation d'un manager.
- [x] Ajouter des tests API ciblés et valider le frontend par typecheck/build.

### Phase 3 — Occurrences et consultation par période/type

- [x] Permettre à l'ADMIN de configurer la cadence trimestrielle ou semestrielle d'une année et ses périodes.
- [x] Limiter une personne évaluatrice à une soumission de chaque type pour la même personne et la même période, sans empêcher plusieurs pairs/managers évaluateurs.
- [ ] Calculer les moyennes par compétence et type, notamment pour plusieurs pairs/managers, et les afficher avec une décimale.
- [ ] Ajouter les filtres par période et type dans la fiche utilisateur et la comparaison d'évolution.

### Phase 4 — Exports et écrans de consultation

- [x] Inclure le niveau requis dans l'export des données brutes d'évaluation.
- [x] Retirer score, tri et ordre de la liste des utilisateurs.
- [ ] Distinguer les compétences au niveau requis ou au-dessus de celles à améliorer ; conserver les filtres période/type.
- [ ] Vérifier l'affichage des commentaires pour les auto-évaluations, pairs et managers.
- [ ] Augmenter la lisibilité des informations du template, vérifier l'action « Ouvrir » des périodes et améliorer le panneau de notifications.

### Garde-fous et validation

- [ ] Laisser intacts les conflits préexistants dans `analytics.service.ts` et `Gaps.tsx`.
- [ ] Ne pas inclure les changements déjà indexés ou non liés à ce chantier dans un commit.
- [ ] Exécuter les tests ciblés, typechecks/builds concernés et valider les migrations PostgreSQL sur une base jetable avant toute modification SQL.

### Revue

Plan établi à partir des remarques de l'encadreur et de l'état local observé le 30/10/2026. Imports Excel validés par l'utilisateur : modèles téléchargeables, aperçu, import partiel des lignes valides, erreurs explicites et aucun écrasement des doublons. Phases 1 et 2 réalisées. Validations initiales : build/typecheck API et frontend, 29 tests API ciblés et 144 tests frontend verts. L'avancement ultérieur de la phase 3 est décrit ci-dessous. Les conflits préexistants restent hors périmètre.

Avancement Phase 3 : cadence annuelle configurable (trimestrielle, maximum 4 périodes ; semestrielle, maximum 2), avec dates de périodes toujours gérées manuellement. La création d'évaluation vérifie atomiquement, sous verrou PostgreSQL, l'absence d'une autre évaluation du même évaluateur, de la même cible, du même type et de la même période. Les doublons historiques restent intacts. Vérifications : 69 tests API ciblés, typechecks et builds API/frontend réussis ; migration cadence appliquée dans un schéma PostgreSQL jetable puis supprimé. Les moyennes et filtres de consultation de la Phase 3, ainsi que les autres demandes de la Phase 4, restent à faire.

Avancement Phase 4 : la liste ADMIN des utilisateurs n'affiche plus le score moyen et n'envoie plus de paramètres de tri ; l'API trie alors par nom. L'export CSV/XLSX des évaluations inclut désormais le niveau requis provenant du critère du template, immédiatement après la note obtenue ; une donnée absente reste vide. Tests ciblés, typechecks et builds vérifiés.

## Descriptions des scores dans les templates

- [x] Initialiser les descriptions 1 à 5 avec « Description du score N ».
- [x] Afficher les cinq champs de niveau horizontalement dans l'éditeur ADMIN.
- [x] Afficher les descriptions avec les choix de note dans le formulaire d'évaluation.
- [x] Tester normalisation, valeurs par défaut, typecheck et builds.

Validation : 131 tests frontend réussis, typecheck et build frontend réussis.
Le conteneur frontend a été reconstruit et répond sur `http://localhost:5173`;
l'API répond toujours sur `/api/health`. Aucun commit effectué.

## Sous-tâche périodes et schedulers

- [x] Rendre l'ouverture d'une période atomique et conditionnée par son état, ses dates et l'absence d'une autre période ouverte.
- [x] Revalider les invariants de période lors de la création et de la soumission d'une évaluation.
- [x] Uniformiser les schedulers sur le calendrier `Africa/Douala` et ajouter le coupe-circuit `SCHEDULER_ENABLED`.
- [x] N'activer les crons que sur `api-1` dans le déploiement à deux répliques.
- [x] Ajouter et exécuter les tests ciblés, puis valider le typecheck et le build API.

Validation de cette sous-tâche : 6 suites ciblées / 53 tests verts, typecheck et
build API verts, configuration Compose scale valide. Le run API complet compte
400 tests verts et un échec hors périmètre dans `regles.service.spec.ts` (test
historique incompatible avec l'immuabilité désormais imposée aux règles actives).

## Évaluation du personnel par l'administrateur

- [x] Exposer les collaborateurs actifs dans le formulaire ADMIN.
- [x] Filtrer les règles par rôle évalué pour l'ADMIN.
- [x] Autoriser la création ADMIN sans contourner les contrôles de cible et de période.
- [x] Ajouter des tests ciblés frontend et backend.
- [x] Exécuter typecheck, builds et tests ciblés.
- [ ] Déployer et committer uniquement les fichiers de cette fonctionnalité, sur demande.

### Revue

Les collaborateurs ADMIN sont limités aux comptes actifs et disponibles, hors compte ADMIN lui-même. La création vérifie toujours la période ouverte et la règle active/cible. Typecheck complet, build frontend/API, test ciblé frontend (6) et test API (46) réussis.
