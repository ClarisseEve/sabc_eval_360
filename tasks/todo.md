# Reprise audit et vérification complète

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
