# Documentation du Système d'Authentification SABC Eval360

## Vue d'ensemble
L'authentification SABC Eval360 repose sur Laravel + Inertia. L'utilisateur est redirigé vers le tableau de bord correspondant à son rôle, et toutes les routes sensibles sont protégées par le middleware `role` (RoleBasedAccess).

## Flux de connexion
1. L'utilisateur soumet ses identifiants via `auth/Login`.
2. `AuthenticatedSessionController@store` authentifie, régénère la session puis retourne directement la page Inertia du dashboard adapté au rôle.
3. Les routes d'accès sont sécurisées par `role:...` pour empêcher toute navigation non autorisée.

## Redirection et sécurité
- **Redirection serveur** : le contrôleur renvoie directement la page Inertia du dashboard (pas de redirection client).
- **Fallback** : la route `/dashboard` redirige vers `dashboard.admin` (contrôleur `DashboardController`).
- **Contrôle d'accès** : le middleware `RoleBasedAccess` valide le rôle et renvoie vers le dashboard autorisé si nécessaire.

## Résolution des pages Inertia
Les composants Inertia sont chargés depuis `resources/js/Pages`. Un resolver normalise quelques segments de casse (`Admin`, `Common`, `Roles`, `Structure`) pour éviter les erreurs sur des systèmes sensibles à la casse.

## Routes d'authentification
- `GET /login` + `POST /login`
- `GET /logout` (toléré) + `POST /logout`
- `GET /forgot-password` (page d'orientation vers le support IT)
- `GET /register` (inscription désactivée, création par l'admin)
- `GET /reset-password/{token}` + `POST /reset-password`

## Rôles pris en charge
- ADMIN
- DR, CDTT, CSC, CDV, CDS (branche commerciale)
- RTM, SRMO, TMO, SS, AS (branche marketing)

## Notes
- La page de debug `auth-debug` est supprimée (obsolète). La route `/test-auth` reste disponible pour diagnostics.
- Pour limiter les erreurs de résolution, standardiser la casse des dossiers Pages reste recommandé.
- Ajouter des tests automatisés d'accès par rôle et de redirection reste prioritaire.
