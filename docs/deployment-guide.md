# Deployment Guide

## Overview

Le déploiement local et preview repose sur Docker Compose.

## Composants actifs

- Frontend : `apps/web/Dockerfile`
- API : `apps/api/Dockerfile`
- MySQL
- PostgreSQL

## Démarrage local

```bash
docker compose up -d
```

## Variables d’environnement

Initialiser `.env` à partir de `.env.example`.

## Notes

- La stack active est décrite dans `docker-compose.yml`.
- Les artefacts d’observabilité sous `docker/` sont optionnels par rapport au runtime applicatif minimal.
