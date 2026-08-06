# Leçons

## `git add -A` sur ce dépôt : ne jamais l'utiliser

**Contexte.** Plusieurs sessions travaillent parfois en parallèle sur ce dépôt.
Le répertoire de travail contient donc régulièrement des modifications en cours
qui ne sont pas les miennes.

**Ce qui s'est passé.** Deux commits d'analytique ont été créés avec
`git add -A`. Ils ont absorbé le travail en cours d'une autre session : une
refonte de `apps/web/src/pages/Common/Evaluations/Edit.tsx`, un nouveau fichier
`e2e/ux-audit.spec.ts` et une cinquantaine de captures dans `artifacts/`. Ce
code inachevé a fait passer la CI au rouge, alors que le travail réellement
commité était vert (backend, frontend, builds Docker, tests d'intégration).

**Règle.** Toujours passer des chemins explicites à `git add`, jamais `-A` ni
`.`. Avant de committer, lire `git status --short` et ne stager que les fichiers
que l'on a soi-même modifiés.

**Signal d'alerte.** Un `git diff --cached --stat` qui liste des fichiers hors
du périmètre annoncé dans le message de commit : c'est le symptôme direct de ce
problème.
