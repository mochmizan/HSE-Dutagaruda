#!/usr/bin/env bash
set -euo pipefail

# Automated PostgreSQL Backup Script for viaannn K3 Inspection Platform
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

PG_CONTAINER="${PG_CONTAINER:-viaannn-postgres}"
PG_USER="${POSTGRES_USER:-viaannn}"
PG_DB="${POSTGRES_DB:-viaannn}"

OUT_FILE="$BACKUP_DIR/${PG_DB}_${TIMESTAMP}.sql.gz"
echo "[backup] Dumping database '$PG_DB' to $OUT_FILE ..."
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" | gzip > "$OUT_FILE"

find "$BACKUP_DIR" -type f -name "${PG_DB}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[backup] Completed successfully: $OUT_FILE"
