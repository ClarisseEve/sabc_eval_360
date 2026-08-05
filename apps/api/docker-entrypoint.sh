#!/bin/sh
# Applique le schéma des deux bases avant de démarrer l'API.
# RUN_MIGRATIONS=false pour piloter les migrations depuis un job externe.
# RUN_SEED=true pour peupler une base neuve (jamais en production).
set -e

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

exec "$@"
