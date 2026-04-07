# Data Models — Active Runtime

## Overview

Le runtime actif repose sur deux bases :

- MySQL `sabc_core`
- PostgreSQL `sabc_business`

## MySQL — Core

Le périmètre versionné par Prisma couvre actuellement :

- `branches`
- `regions`
- `roles`
- `utilisateurs`

Référence : `apps/api/prisma/schema.prisma`

## PostgreSQL — Business

Les tables métier exploitées par l’API incluent notamment :

- `evaluations`
- `periodes_evaluation`
- `regles_evaluation`
- `templates`
- `template_role_periode`
- `notifications`
- `remplacements_temporaires`

## Analytics

Les analytics actifs sont calculés par les services NestJS à partir des données core et business. ClickHouse n’est plus requis dans la chaîne locale active.
