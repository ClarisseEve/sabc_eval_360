# API Contracts — App (Laravel/Inertia)

## Overview

This file documents HTTP routes exposed by the main Laravel application. The app serves Inertia pages and JSON endpoints. Authentication is session-based (`auth` middleware) for web routes and Sanctum for API routes.

## Base Paths

- Web routes: `/` (session auth)
- API routes: `/api/*` (Sanctum)

## Authentication

- **Web**: session (middleware `auth`)
- **API**: `auth:sanctum`
- **Role-based access**: `role:*` middleware on dashboard/admin routes

## API (Sanctum) Routes

| Method | Path              | Auth    | Description                        |
| ------ | ----------------- | ------- | ---------------------------------- |
| GET    | `/api/user`       | Sanctum | Returns current authenticated user |
| GET    | `/api/auth/check` | Sanctum | Auth status check for frontend     |

> Note: user management API routes are present but commented out in `routes/api.php`.

## Web Auth Routes

| Method | Path                      | Auth  | Description                                         |
| ------ | ------------------------- | ----- | --------------------------------------------------- |
| GET    | `/login`                  | Guest | Login page                                          |
| POST   | `/login`                  | Guest | Login submit                                        |
| GET    | `/register`               | Guest | Registration page (creation via admin; placeholder) |
| GET    | `/forgot-password`        | Guest | Forgot password page                                |
| GET    | `/reset-password/{token}` | Guest | Password reset page                                 |
| POST   | `/reset-password`         | Guest | Password reset submit                               |
| GET    | `/confirm-password`       | Auth  | Password confirmation page                          |
| POST   | `/confirm-password`       | Auth  | Password confirmation submit                        |
| GET    | `/logout`                 | Auth  | Logout (GET tolerated)                              |
| POST   | `/logout`                 | Auth  | Logout                                              |

## Web Diagnostic Routes

| Method | Path                | Auth | Description                  |
| ------ | ------------------- | ---- | ---------------------------- |
| GET    | `/test-auth`        | Auth | Session/auth diagnostic JSON |
| GET    | `/test-redirection` | Auth | Role redirect test page      |

## Dashboards (Role-Based)

| Method | Path               | Auth | Roles | Description                                 |
| ------ | ------------------ | ---- | ----- | ------------------------------------------- |
| GET    | `/dashboard`       | Auth | Any   | Main dashboard redirect                     |
| GET    | `/admin/dashboard` | Auth | ADMIN | Admin dashboard                             |
| GET    | `/dr/dashboard`    | Auth | DR    | Directeur Régional                          |
| GET    | `/cdtt/dashboard`  | Auth | CDTT  | Chef Département Trade                      |
| GET    | `/csc/dashboard`   | Auth | CSC   | Chef Service Commercial                     |
| GET    | `/cdv/dashboard`   | Auth | CDV   | Chef District Vente                         |
| GET    | `/cds/dashboard`   | Auth | CDS   | Chef de Secteur                             |
| GET    | `/rtm/dashboard`   | Auth | RTM   | Regional Trade Marketing                    |
| GET    | `/tmo/dashboard`   | Auth | TMO   | Trade Marketing Operator                    |
| GET    | `/srmo/dashboard`  | Auth | SRMO  | Superviseur Régional Marketing Opérationnel |
| GET    | `/ss/dashboard`    | Auth | SS    | Superviseur Sponsoring                      |
| GET    | `/as/dashboard`    | Auth | AS    | Assistant Sponsoring                        |

## Evaluations (Common)

Base: `/common/evaluations`

| Method | Path                            | Auth | Description             |
| ------ | ------------------------------- | ---- | ----------------------- |
| GET    | `/common/evaluations`           | Auth | Evaluations home        |
| GET    | `/common/evaluations/mine`      | Auth | My evaluations by role  |
| GET    | `/common/evaluations/pending`   | Auth | Evaluations to complete |
| GET    | `/common/evaluations/create`    | Auth | Create evaluation page  |
| GET    | `/common/evaluations/details`   | Auth | JSON details for modal  |
| GET    | `/common/evaluations/{id}`      | Auth | View evaluation         |
| GET    | `/common/evaluations/{id}/edit` | Auth | Edit evaluation         |
| PUT    | `/common/evaluations/{id}`      | Auth | Update evaluation       |
| POST   | `/common/evaluations`           | Auth | Create evaluation       |

## Admin — Analytics

| Method | Path                          | Auth | Roles | Description                                       |
| ------ | ----------------------------- | ---- | ----- | ------------------------------------------------- |
| GET    | `/admin/analytics/{section?}` | Auth | ADMIN | Analytics dashboard section (server-side dataset) |

## Admin — Remplacements

Base: `/admin/remplacements`

| Method | Path                             | Auth | Roles | Description       |
| ------ | -------------------------------- | ---- | ----- | ----------------- |
| GET    | `/admin/remplacements`           | Auth | ADMIN | List replacements |
| GET    | `/admin/remplacements/create`    | Auth | ADMIN | Create page       |
| POST   | `/admin/remplacements`           | Auth | ADMIN | Store             |
| GET    | `/admin/remplacements/{id}`      | Auth | ADMIN | Show              |
| GET    | `/admin/remplacements/{id}/edit` | Auth | ADMIN | Edit              |
| PUT    | `/admin/remplacements/{id}`      | Auth | ADMIN | Update            |
| DELETE | `/admin/remplacements/{id}`      | Auth | ADMIN | Delete            |

## Admin — Roles & Rules

Base: `/admin/roles`

| Method | Path                              | Auth | Roles | Description            |
| ------ | --------------------------------- | ---- | ----- | ---------------------- |
| GET    | `/admin/roles`                    | Auth | ADMIN | List roles             |
| GET    | `/admin/roles/permissions`        | Auth | ADMIN | Permissions page       |
| POST   | `/admin/roles/permissions/update` | Auth | ADMIN | Update permissions     |
| GET    | `/admin/roles/create`             | Auth | ADMIN | Create role            |
| POST   | `/admin/roles`                    | Auth | ADMIN | Store role             |
| GET    | `/admin/roles/{id}`               | Auth | ADMIN | Show role              |
| GET    | `/admin/roles/{id}/edit`          | Auth | ADMIN | Edit role              |
| PUT    | `/admin/roles/{id}`               | Auth | ADMIN | Update role            |
| DELETE | `/admin/roles/{id}`               | Auth | ADMIN | Delete role            |
| GET    | `/admin/roles/rules/create`       | Auth | ADMIN | Create evaluation rule |
| POST   | `/admin/roles/rules`              | Auth | ADMIN | Store evaluation rule  |
| POST   | `/admin/roles/rules/update`       | Auth | ADMIN | Update evaluation rule |

## Admin — Structure

Base: `/admin/structure`

| Method | Path                              | Auth | Roles | Description        |
| ------ | --------------------------------- | ---- | ----- | ------------------ |
| GET    | `/admin/structure`                | Auth | ADMIN | Structure overview |
| GET    | `/admin/structure/regions`        | Auth | ADMIN | Regions list       |
| POST   | `/admin/structure/regions`        | Auth | ADMIN | Create region      |
| PUT    | `/admin/structure/regions/{id}`   | Auth | ADMIN | Update region      |
| DELETE | `/admin/structure/regions/{id}`   | Auth | ADMIN | Delete region      |
| GET    | `/admin/structure/services`       | Auth | ADMIN | Services list      |
| POST   | `/admin/structure/services`       | Auth | ADMIN | Create service     |
| PUT    | `/admin/structure/services/{id}`  | Auth | ADMIN | Update service     |
| DELETE | `/admin/structure/services/{id}`  | Auth | ADMIN | Delete service     |
| GET    | `/admin/structure/districts`      | Auth | ADMIN | Districts list     |
| POST   | `/admin/structure/districts`      | Auth | ADMIN | Create district    |
| PUT    | `/admin/structure/districts/{id}` | Auth | ADMIN | Update district    |
| DELETE | `/admin/structure/districts/{id}` | Auth | ADMIN | Delete district    |
| GET    | `/admin/structure/secteurs`       | Auth | ADMIN | Secteurs list      |
| POST   | `/admin/structure/secteurs`       | Auth | ADMIN | Create secteur     |
| PUT    | `/admin/structure/secteurs/{id}`  | Auth | ADMIN | Update secteur     |
| DELETE | `/admin/structure/secteurs/{id}`  | Auth | ADMIN | Delete secteur     |

## Admin — Evaluations

| Method | Path                                         | Auth | Roles | Description                  |
| ------ | -------------------------------------------- | ---- | ----- | ---------------------------- |
| GET    | `/admin/evaluations/history`                 | Auth | ADMIN | Evaluations history          |
| GET    | `/admin/evaluations/management`              | Auth | ADMIN | Evaluations management       |
| GET    | `/admin/evaluations/templates`               | Auth | ADMIN | Templates index (new)        |
| GET    | `/admin/evaluations/templates/create`        | Auth | ADMIN | Templates create             |
| GET    | `/admin/evaluations/templates/{id}/edit`     | Auth | ADMIN | Templates edit               |
| GET    | `/admin/evaluation/templates`                | Auth | ADMIN | Templates index (legacy)     |
| GET    | `/admin/evaluation/templates/create`         | Auth | ADMIN | Templates create (legacy)    |
| POST   | `/admin/evaluation/templates/store`          | Auth | ADMIN | Templates store (legacy)     |
| GET    | `/admin/evaluation/templates/{id}/edit`      | Auth | ADMIN | Templates edit (legacy)      |
| PUT    | `/admin/evaluation/templates/{id}`           | Auth | ADMIN | Templates update (legacy)    |
| GET    | `/admin/evaluation/templates/{id}/duplicate` | Auth | ADMIN | Templates duplicate (legacy) |

## Admin — Utilisateurs

Base: `/admin/utilisateurs`

| Method | Path                                   | Auth | Roles | Description               |
| ------ | -------------------------------------- | ---- | ----- | ------------------------- |
| GET    | `/admin/utilisateurs`                  | Auth | ADMIN | Users list                |
| GET    | `/admin/utilisateurs/gaps`             | Auth | ADMIN | Performance gaps analysis |
| GET    | `/admin/utilisateurs/create`           | Auth | ADMIN | Create user               |
| POST   | `/admin/utilisateurs`                  | Auth | ADMIN | Store user                |
| GET    | `/admin/utilisateurs/{matricule}`      | Auth | ADMIN | Show user                 |
| GET    | `/admin/utilisateurs/{matricule}/edit` | Auth | ADMIN | Edit user                 |
| PUT    | `/admin/utilisateurs/{matricule}`      | Auth | ADMIN | Update user               |

## Settings

| Method | Path                   | Auth | Description         |
| ------ | ---------------------- | ---- | ------------------- |
| GET    | `/settings/profile`    | Auth | Profile page        |
| PATCH  | `/settings/profile`    | Auth | Update profile      |
| DELETE | `/settings/profile`    | Auth | Delete account      |
| GET    | `/settings/password`   | Auth | Password page       |
| PUT    | `/settings/password`   | Auth | Update password     |
| GET    | `/settings/appearance` | Auth | Appearance settings |

## Metrics

| Method | Path       | Auth | Description        |
| ------ | ---------- | ---- | ------------------ |
| GET    | `/metrics` | None | Prometheus metrics |
