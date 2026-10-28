# Deploiement Railway (API) + Vercel (frontend)

## Topologie

| Composant  | Hebergement | Source                                  |
|------------|-------------|-----------------------------------------|
| Frontend   | Vercel      | Root Directory `apps/web`, `apps/web/vercel.json` |
| API NestJS | Railway     | Root Directory `/apps/api`, `Dockerfile`|
| MySQL      | Railway     | template MySQL, ou MariaDB embarque dans le conteneur API (voir plus bas) |
| PostgreSQL | Railway     | template PostgreSQL                     |
| Redis      | Railway     | template Redis                          |

Le navigateur appelle directement le domaine public Railway de l'API; l'origine
Vercel est autorisee par CORS via `FRONTEND_URL` (liste separee par des virgules).

## Service API: reglages Railway (Settings)

| Rubrique | Valeur |
|----------|--------|
| Source > Root Directory | `/apps/api` |
| Source > Branch | `dever` |
| Build > Builder | Dockerfile (detecte automatiquement dans `/apps/api`) |
| Build > Custom Build Command | **vide** |
| Deploy > Custom Start Command | **vide** (l'image lance migrations puis `node dist/src/main.js`) |
| Deploy > Healthcheck Path | `/api/health/live` |
| Networking > Port cible du domaine public | identique a `PORT` (8080) |
| Scale > Replicas | 1 |

Ne pas utiliser de fichier `railway.json`: Railway n'accepte plus de nouveaux
services en configuration-as-code depuis le 28 aout 2026.

## Variables

Coller `.env.railway.example` dans *Variables* > *Raw Editor*, remplacer les
`CHANGE_ME` et adapter les noms des services references (`MySQL`, `Postgres`,
`Redis`). Generer le secret JWT: `openssl rand -base64 48`.

Cote Vercel (Production + Preview): `VITE_API_URL=https://<domaine-api>.up.railway.app/api`, puis
redeployer le site (variable figee au build).

## MySQL embarque (si aucun service MySQL n'est disponible)

Avec `WITH_MARIADB=true` (build) et `EMBEDDED_MYSQL=true` (runtime), l'image
API installe MariaDB 10.11 (compatible MySQL), le demarre sur `127.0.0.1:3306`,
cree la base `sabc_core` et l'utilisateur `sabc_user`, puis exporte
`DATABASE_URL` avant les migrations. Ne pas definir `DATABASE_URL` dans Railway.

1. Attacher un volume au service API, monte sur `/data`
   (clic droit sur le service > *Attach Volume*). Sans volume, toutes les
   donnees MySQL sont perdues a chaque redeploiement.
2. Definir `EMBEDDED_MYSQL_PASSWORD` (lettres, chiffres, `_`, `-`).
3. Redeployer: le build doit afficher l'installation de `mariadb-server`.

Limites: MariaDB partage les 1 Go de memoire du service (pool InnoDB a 128M
par defaut) et n'est pas accessible depuis l'exterieur du conteneur. Pour un
acces SQL ponctuel, utiliser la console Railway du service:
`mariadb --socket=/run/mysqld/mysqld.sock sabc_core`.

## Premier demarrage

L'entrypoint applique les migrations MySQL (Prisma) puis PostgreSQL a chaque
demarrage; elles sont idempotentes. Pour une instance de demonstration, activer
une seule fois `RUN_SEED=true` et `ALLOW_DEMO_SEED=true` avec un
`SEED_PASSWORD` fort, puis remettre `RUN_SEED=false`. Ne jamais utiliser
`SEED_MODE=reset` sur une base contenant des donnees reelles.

## Verifications

- `https://<domaine-api>/api/health/live` renvoie 200.
- `https://<domaine-api>/api/health` renvoie `mysql`, `postgres` et `cache` a `ok`.
- Connexion depuis le site Vercel sans erreur CORS dans la console.

## Points d'attention

- **Une seule replique**: les taches planifiees ne sont pas verrouillees entre instances.
- **Memoire 1 Go**: suffisant pour l'API; surveiller l'onglet Metriques lors des exports PPTX/DOCX volumineux.
- **Sauvegardes**: activer les backups des volumes MySQL et Postgres.
