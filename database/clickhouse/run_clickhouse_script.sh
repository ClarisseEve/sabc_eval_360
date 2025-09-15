#!/bin/bash

# Script pour exécuter des commandes ClickHouse via Docker
# Usage: ./run_clickhouse_script.sh <fichier_sql>

# Vérifier si un fichier SQL est fourni
if [ -z "$1" ]; then
  echo "Usage: $0 <fichier_sql>"
  echo "Exemple: $0 create_analytics_tables.sql"
  exit 1
fi

# Nom du conteneur Docker ClickHouse (à ajuster selon votre configuration)
CONTAINER_NAME="clickhouse-server"

# Fichier SQL à exécuter
SQL_FILE=$1

# Vérifier si le fichier existe
if [ ! -f "$SQL_FILE" ]; then
  echo "Le fichier $SQL_FILE n'existe pas."
  exit 1
fi

echo "Exécution du script SQL $SQL_FILE dans le conteneur ClickHouse..."

# Copier le fichier SQL dans le conteneur
docker cp "$SQL_FILE" "$CONTAINER_NAME:/tmp/$(basename $SQL_FILE)"

# Exécuter le script SQL dans le conteneur
docker exec -i "$CONTAINER_NAME" clickhouse-client --user admin --password admin --database sabc_analytics --multiquery --queries-file "/tmp/$(basename $SQL_FILE)"

echo "Script SQL exécuté avec succès."
