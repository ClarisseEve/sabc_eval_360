#!/usr/bin/env bash
# =============================================================================
# restore-to-docker.sh
# Importe les dumps locaux dans les containers Docker
# Usage: ./scripts/restore-to-docker.sh [./backups/local_YYYYMMDD_HHMMSS]
# =============================================================================

set -euo pipefail

BACKUP_DIR="${1:-}"

if [ -z "$BACKUP_DIR" ]; then
    # Prendre le dernier backup si non spécifié
    BACKUP_DIR=$(ls -dt ./backups/local_* 2>/dev/null | head -1 || echo "")
fi

if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
    echo "❌  Aucun dossier de backup trouvé."
    echo "   Utilisation: $0 ./backups/local_YYYYMMDD_HHMMSS"
    echo "   Ou d'abord: ./scripts/dump-local-dbs.sh"
    exit 1
fi

echo "📦  Restauration depuis : $BACKUP_DIR"
echo ""

# ---------------------------------------------------------------------------
# Vérifier que les containers tournent
# ---------------------------------------------------------------------------
check_container() {
    docker compose ps "$1" 2>/dev/null | grep -q "running" || {
        echo "❌  Container '$1' n'est pas démarré. Lancer: docker compose up -d $1"
        return 1
    }
}

check_container mysql   || exit 1
check_container postgres || exit 1
check_container clickhouse || exit 1

# ---------------------------------------------------------------------------
# MySQL
# ---------------------------------------------------------------------------
MYSQL_SQL=$(find "$BACKUP_DIR" -name "mysql_*.sql" | head -1 || echo "")
if [ -n "$MYSQL_SQL" ]; then
    echo "▶ Restauration MySQL depuis $(basename $MYSQL_SQL)..."
    docker compose exec -T mysql mysql -u sabc_user -psecret sabc_core < "$MYSQL_SQL"
    echo "  ✅  MySQL restauré"
else
    echo "  ⏭  Pas de dump MySQL dans $BACKUP_DIR"
fi

# ---------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------
PG_SQL=$(find "$BACKUP_DIR" -name "postgres_*.sql" | head -1 || echo "")
if [ -n "$PG_SQL" ]; then
    echo ""
    echo "▶ Restauration PostgreSQL depuis $(basename $PG_SQL)..."
    docker compose exec -T postgres psql -U sabc_user sabc_business < "$PG_SQL"
    echo "  ✅  PostgreSQL restauré"
else
    echo "  ⏭  Pas de dump PostgreSQL dans $BACKUP_DIR"
fi

# ---------------------------------------------------------------------------
# ClickHouse (via CSV)
# ---------------------------------------------------------------------------
CH_CSVS=$(find "$BACKUP_DIR" -name "clickhouse_*.csv" 2>/dev/null || echo "")
if [ -n "$CH_CSVS" ]; then
    echo ""
    echo "▶ Restauration ClickHouse (CSV)..."
    for CSV_FILE in $CH_CSVS; do
        # Extraire le nom de table depuis le nom de fichier
        TABLE=$(basename "$CSV_FILE" .csv | sed 's/^clickhouse_//')
        echo "    Importing $TABLE..."
        cat "$CSV_FILE" | docker compose exec -T clickhouse \
            clickhouse-client --database sabc_analytics \
            --query "INSERT INTO sabc_analytics.$TABLE FORMAT CSVWithNames" \
            2>/dev/null || echo "    ⚠️  Erreur import $TABLE (peut-être vide ou déjà présent)"
    done
    echo "  ✅  ClickHouse restauré"
else
    echo "  ⏭  Pas de dump ClickHouse dans $BACKUP_DIR (les tables sont créées automatiquement par clickhouse-init)"
fi

echo ""
echo "✅  Restauration terminée !"
echo ""
echo "Vérification:"
echo "  make shell-mysql        → SELECT COUNT(*) FROM users;"
echo "  make shell-postgres     → SELECT COUNT(*) FROM evaluations;"
echo "  make shell-clickhouse   → SELECT COUNT(*) FROM evaluations_analytics;"
