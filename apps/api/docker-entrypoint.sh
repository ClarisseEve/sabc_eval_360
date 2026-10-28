#!/bin/sh
# Applique le schéma des deux bases avant de démarrer l'API.
# RUN_MIGRATIONS=false pour piloter les migrations depuis un job externe.
# RUN_SEED=true pour peupler une base neuve (jamais en production).
# EMBEDDED_MYSQL=true démarre un MariaDB local (image construite avec
# WITH_MARIADB=true) et dérive DATABASE_URL; les données vivent dans
# EMBEDDED_MYSQL_DATADIR, à placer sur un volume persistant.
set -e

MYSQL_SOCKET=/run/mysqld/mysqld.sock
MARIADB_PID=""

start_embedded_mysql() {
  datadir="${EMBEDDED_MYSQL_DATADIR:-/data/mysql}"
  password="${EMBEDDED_MYSQL_PASSWORD:?EMBEDDED_MYSQL_PASSWORD est requis avec EMBEDDED_MYSQL=true}"
  # Le mot de passe est injecté dans une URL et du SQL: alphabet restreint.
  case "$password" in
    *[!A-Za-z0-9_-]*)
      echo "[entrypoint] EMBEDDED_MYSQL_PASSWORD: lettres, chiffres, _ et - uniquement." >&2
      exit 1
      ;;
  esac
  if ! command -v mariadbd >/dev/null 2>&1; then
    echo "[entrypoint] MariaDB absent de l'image: reconstruire avec WITH_MARIADB=true." >&2
    exit 1
  fi

  mkdir -p "$datadir" /run/mysqld
  chown -R mysql:mysql "$datadir" /run/mysqld
  if [ ! -d "$datadir/mysql" ]; then
    echo "[entrypoint] Initialisation de MariaDB dans $datadir..."
    mariadb-install-db --user=mysql --datadir="$datadir" --skip-test-db >/dev/null
  fi

  echo "[entrypoint] Démarrage de MariaDB embarqué..."
  mariadbd --user=mysql --datadir="$datadir" \
    --bind-address=127.0.0.1 --port=3306 --socket="$MYSQL_SOCKET" \
    --innodb-buffer-pool-size="${EMBEDDED_MYSQL_BUFFER_POOL:-128M}" \
    --performance-schema=OFF \
    --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci &
  MARIADB_PID=$!

  attempts=0
  until mariadb-admin --socket="$MYSQL_SOCKET" ping --silent >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ] || ! kill -0 "$MARIADB_PID" 2>/dev/null; then
      echo "[entrypoint] MariaDB n'a pas démarré." >&2
      exit 1
    fi
    sleep 1
  done

  # root s'authentifie par socket Unix: aucun mot de passe root à gérer.
  mariadb --socket="$MYSQL_SOCKET" <<SQL
CREATE DATABASE IF NOT EXISTS sabc_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sabc_user'@'127.0.0.1' IDENTIFIED BY '$password';
ALTER USER 'sabc_user'@'127.0.0.1' IDENTIFIED BY '$password';
GRANT ALL PRIVILEGES ON sabc_core.* TO 'sabc_user'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

  export DATABASE_URL="mysql://sabc_user:${password}@127.0.0.1:3306/sabc_core"
}

if [ "${EMBEDDED_MYSQL:-false}" = "true" ]; then
  start_embedded_mysql
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Application des migrations MySQL + PostgreSQL..."
  pnpm db:migrate:all
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  if [ "$NODE_ENV" = "production" ] && [ "${ALLOW_DEMO_SEED:-false}" != "true" ]; then
    echo "[entrypoint] RUN_SEED ignoré: NODE_ENV=production (forcer avec ALLOW_DEMO_SEED=true)."
  else
    echo "[entrypoint] Seed de la base..."
    pnpm db:seed
  fi
fi

if [ -z "$MARIADB_PID" ]; then
  exec "$@"
fi

# Avec MariaDB embarqué, ce shell reste PID 1 pour arrêter proprement les deux
# processus: l'API d'abord, puis MariaDB (évite une récupération InnoDB).
"$@" &
APP_PID=$!
trap 'kill -TERM "$APP_PID" 2>/dev/null || true' TERM INT
status=0
wait "$APP_PID" || status=$?
# wait rend la main dès réception du signal: attendre la fin réelle de l'API.
if kill -0 "$APP_PID" 2>/dev/null; then
  wait "$APP_PID" || status=$?
fi
mariadb-admin --socket="$MYSQL_SOCKET" shutdown >/dev/null 2>&1 || true
wait "$MARIADB_PID" 2>/dev/null || true
exit "$status"
