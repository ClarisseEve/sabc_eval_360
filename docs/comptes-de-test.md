# Comptes de test

Comptes créés par `pnpm --dir apps/api db:seed`. Ils servent aux essais manuels
et aux tests de bout en bout.

## Mot de passe

Tous les comptes partagent la valeur de `SEED_PASSWORD` définie dans votre
`.env`. Aucun mot de passe n'est stocké dans le dépôt : le seed refuse de
s'exécuter si la variable est absente.

## Identifiant

Le champ de connexion accepte indifféremment le **matricule** ou l'**e-mail**.

## Un compte par rôle

| Rôle  | Matricule | Intitulé                                      |
|-------|-----------|-----------------------------------------------|
| ADMIN | `A0001`   | Administrateur (`admin@sabc.local`)           |
| DR    | `D1010`   | Directeur régional                            |
| CDTT  | `X0002`   | Chef de département trade                     |
| CSC   | `C0007`   | Chef de service commercial                    |
| CDV   | `V0005`   | Chef de district vente                        |
| CDS   | `S1110`   | Chef de secteur                               |
| RTM   | `M0008`   | Regional trade marketing                      |
| TMO   | `T1210`   | Trade marketing operator                      |
| SRMO  | `O0012`   | Superviseur régional marketing opérationnel   |
| SS    | `P0014`   | Superviseur sponsoring                        |
| AS    | `A0016`   | Assistant superviseur sponsoring              |

Ces onze comptes sont ceux que parcourt le job `Browser end-to-end tests` de la
CI : leur existence et leur rôle sont donc vérifiés à chaque exécution.

## Que tester avec quel rôle

- **`A0001` (ADMIN)** — administration complète : utilisateurs, structure,
  règles, modèles, périodes, rapports et l'ensemble des onglets analytiques.
- **`S1110` (CDS)** — parcours d'évaluation le plus riche : file à compléter,
  file à valider, équipe et heatmap de compétences.
- **`D1010` (DR)** — vue consolidée d'une région et chaîne hiérarchique.
- **`X0002` (CDTT)** — bascule entre les périmètres commercial et marketing.
- **`T1210` (TMO)** — vue opérationnelle : progression personnelle, benchmarks
  face aux pairs et axes d'amélioration.

## Volume des données

Le seed crée environ 145 utilisateurs répartis sur les régions et les trois
branches (commercial, marketing, sponsoring), avec des périodes, des règles et
des évaluations validées — de quoi alimenter tous les écrans analytiques.

Par défaut `SEED_MODE=if-empty` : les données ne sont recréées que si la base
est vide. Utiliser `SEED_MODE=reset` pour repartir de zéro, ce qui **efface les
données existantes**.
