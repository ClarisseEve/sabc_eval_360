#!/usr/bin/env bash
# =============================================================================
# dump-local-dbs.sh
# Exporte les bases locales (MySQL + PostgreSQL + ClickHouse OrbStack) vers ./backups/
# Usage: ./scripts/dump-local-dbs.sh
# =============================================================================

set -euo pipefail

BACKUP_DIR="./backups/local_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------------------------
# Configuration — adapter si vos credentials locaux diffèrent
# ---------------------------------------------------------------------------
MYSQL_HOST="${LOCAL_MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${LOCAL_MYSQL_PORT:-3306}"
MYSQL_USER="${LOCAL_MYSQL_USER:-root}"
MYSQL_PASS="${LOCAL_MYSQL_PASS:-}"
MYSQL_DB="${LOCAL_MYSQL_DB:-sabc_core}"

PG_HOST="${LOCAL_PG_HOST:-127.0.0.1}"
PG_PORT="${LOCAL_PG_PORT:-5432}"
PG_USER="${LOCAL_PG_USER:-sabc_user}"
PG_DB="${LOCAL_PG_DB:-sabc_business}"

CH_HOST="${LOCAL_CH_HOST:-127.0.0.1}"
CH_PORT="${LOCAL_CH_PORT:-8123}"       # Port HTTP OrbStack
CH_USER="${LOCAL_CH_USER:-default}"
CH_DB="${LOCAL_CH_DB:-sabc_analytics}"

echo "🗂  Backup vers : $BACKUP_DIR"

# ---------------------------------------------------------------------------
# MySQL
# ---------------------------------------------------------------------------
echo ""
echo "▶ Dump MySQL ($MYSQL_HOST:$MYSQL_PORT/$MYSQL_DB)..."
if command -v mysqldump &>/dev/null; then
    MYSQL_PASS_OPT=""
    [ -n "$MYSQL_PASS" ] && MYSQL_PASS_OPT="-p${MYSQL_PASS}"
    mysqldump -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" $MYSQL_PASS_OPT \
        --single-transaction --routines --triggers --events \
        "$MYSQL_DB" > "$BACKUP_DIR/mysql_${MYSQL_DB}.sql"
    echo "  ✅  MySQL → $BACKUP_DIR/mysql_${MYSQL_DB}.sql"
else
    echo "  ⚠️  mysqldump non trouvé. Installer MySQL client ou exporter via DataGrip."
fi

# ---------------------------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------------------------
echo ""
echo "▶ Dump PostgreSQL ($PG_HOST:$PG_PORT/$PG_DB)..."
if command -v pg_dump &>/dev/null; then
    PGPASSWORD="${LOCAL_PG_PASS:-}" pg_dump \
        -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
        --clean --if-exists \
        "$PG_DB" > "$BACKUP_DIR/postgres_${PG_DB}.sql"
    echo "  ✅  PostgreSQL → $BACKUP_DIR/postgres_${PG_DB}.sql"
else
    echo "  ⚠️  pg_dump non trouvé. Installer PostgreSQL client ou exporter via DataGrip."
fi

# ---------------------------------------------------------------------------
# ClickHouse (via HTTP interface)
# ---------------------------------------------------------------------------
echo ""
echo "▶ Dump ClickHouse ($CH_HOST:$CH_PORT/$CH_DB)..."
if command -v curl &>/dev/null; then
    TABLES=$(curl -sf "http://$CH_HOST:$CH_PORT/?user=$CH_USER&database=$CH_DB" \
        --data "SHOW TABLES FROM $CH_DB" 2>/dev/null | tr '\n' ' ' || echo "")

    if [ -z "$TABLES" ]; then
        echo "  ⚠️  ClickHouse inaccessible ou pas de tables. Vérifiez que OrbStack CH tourne sur $CH_HOST:$CH_PORT"
    else
        for TABLE in $TABLES; do
            echo "    Exporting table: $TABLE..."
            curl -sf "http://$CH_HOST:$CH_PORT/?user=$CH_USER&database=$CH_DB" \
                --data "SELECT * FROM $CH_DB.$TABLE FORMAT Native" \
                > "$BACKUP_DIR/clickhouse_${TABLE}.bin" 2>/dev/null || \
            curl -sf "http://$CH_HOST:$CH_PORT/?user=$CH_USER&database=$CH_DB" \
                --data "SELECT * FROM $CH_DB.$TABLE FORMAT CSVWithNames" \
                > "$BACKUP_DIR/clickhouse_${TABLE}.csv" 2>/dev/null || \
                echo "    ⚠️  Impossible d'exporter $TABLE"
        done
        echo "  ✅  ClickHouse → $BACKUP_DIR/clickhouse_*.csv"
    fi
else
    echo "  ⚠️  curl non trouvé."
fi

echo ""
echo "✅  Backup terminé : $BACKUP_DIR"
echo ""
echo "Prochaine étape : ./scripts/restore-to-docker.sh $BACKUP_DIR"
