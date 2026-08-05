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
