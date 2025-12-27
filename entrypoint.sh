#!/bin/bash
set -e

# Check if the subdirectories exist and create them if not
[ -d "/app/uploads/images" ] || mkdir -p /app/uploads/images
[ -d "/app/uploads/imports" ] || mkdir -p /app/uploads/imports

# Set up cron schedule from env var (default: Sundays at 3am)
CRON_SCHEDULE="${BACKUP_CRON_SCHEDULE:-0 3 * * 0}"
echo "$CRON_SCHEDULE /app/backup-db.sh >> /var/log/cron.log 2>&1" | crontab -

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