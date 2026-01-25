#!/bin/bash
# Database backup script for Vanilla Cookbook
# Creates timestamped backups and manages retention

set -e

# Configuration
DB_PATH="/app/prisma/db/dev.sqlite"
BACKUP_DIR="/app/prisma/db"
BACKUP_PREFIX="scheduled-backup"
# Use env var or default to 6
MAX_BACKUPS=${BACKUP_RETENTION_COUNT:-6}

# Only backup if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Database not found at $DB_PATH, skipping backup"
    exit 0
fi

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_PREFIX}-${TIMESTAMP}.sqlite"

echo "Creating scheduled database backup: $BACKUP_PATH"
cp "$DB_PATH" "$BACKUP_PATH"
echo "✅ Backup created successfully"

# Clean up old backups (keep only MAX_BACKUPS most recent)
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}/${BACKUP_PREFIX}"*.sqlite 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    echo "Found $BACKUP_COUNT backups, keeping $MAX_BACKUPS most recent"
    # List backups sorted by time, skip the newest MAX_BACKUPS, delete the rest
    ls -t "${BACKUP_DIR}/${BACKUP_PREFIX}"*.sqlite | tail -n +$((MAX_BACKUPS + 1)) | while read -r old_backup; do
        echo "Removing old backup: $old_backup"
        rm "$old_backup"
    done
    echo "✅ Cleanup complete"
fi
