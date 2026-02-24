#!/bin/bash
set -e

# Check if the subdirectories exist and create them if not
[ -d "/app/uploads/images" ] || mkdir -p /app/uploads/images
[ -d "/app/uploads/imports" ] || mkdir -p /app/uploads/imports

# ─────────────────────────────────────────────────────────────────────────────
# Permission checks - log warnings if folders/files aren't writable
# ─────────────────────────────────────────────────────────────────────────────
echo "🔍 Checking folder permissions..."

check_writable() {
    local path="$1"
    local label="$2"
    if [ -e "$path" ]; then
        if [ -w "$path" ]; then
            echo "  ✅ $label: writable"
        else
            echo "  ❌ $label: NOT WRITABLE - recipes may fail to save!"
            echo "     Path: $path"
            echo "     Fix: Check volume mount permissions (chmod/chown)"
        fi
    else
        echo "  ⚠️  $label: does not exist yet (will be created)"
    fi
}

check_writable "/app/prisma/db" "Database folder"
check_writable "/app/prisma/db/dev.sqlite" "Database file"
check_writable "/app/uploads" "Uploads folder"
check_writable "/app/uploads/images" "Images folder"

echo ""

# Set up cron schedule from env var (default: Sundays at 3am)
CRON_SCHEDULE="${BACKUP_CRON_SCHEDULE:-0 3 * * 0}"
echo "$CRON_SCHEDULE /app/scripts/backup/backup-db.sh >> /var/log/cron.log 2>&1" | crontab -

# Start cron for scheduled backups
service cron start
echo "✅ Cron started for scheduled database backups (schedule: $CRON_SCHEDULE)"

# Auto-backup database before migrations if there are pending changes
DB_PATH="/app/prisma/db/dev.sqlite"
if [ -f "$DB_PATH" ]; then
    # Check if there are pending migrations
    if pnpm prisma migrate status 2>&1 | grep -q "following migration.*not yet been applied"; then
        BACKUP_PATH="/app/prisma/db/migration-$(date +%Y%m%d-%H%M%S).sqlite"
        echo "⚠️  Pending migrations detected. Creating automatic backup: $BACKUP_PATH"
        cp "$DB_PATH" "$BACKUP_PATH"
        echo "✅ Backup created successfully"
    fi
fi

# Run the production build and start the server
pnpm serve
