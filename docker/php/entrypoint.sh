#!/bin/sh
# =============================================================================
# SABC Eval360 - Container Entrypoint
# Tâches d'initialisation au démarrage du container
# =============================================================================

set -e

cd /var/www/html

echo "[entrypoint] Running package:discover..."
php artisan package:discover --ansi 2>/dev/null || true

echo "[entrypoint] Creating storage symlink..."
php artisan storage:link --force 2>/dev/null || true

echo "[entrypoint] Starting supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
