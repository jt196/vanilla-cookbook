#!/bin/bash
set -euo pipefail

APP_USER="${APP_USER:-node}"
APP_GROUP="${APP_GROUP:-node}"
PUID="${PUID:-1000}"
PGID="${PGID:-1000}"
CRON_SCHEDULE="${BACKUP_CRON_SCHEDULE:-0 3 * * 0}"

run_as_app() {
  if [ "$(id -u)" -eq 0 ]; then
    gosu "$APP_USER:$APP_GROUP" "$@"
  else
    "$@"
  fi
}

ensure_directories() {
  mkdir -p /app/prisma/db /app/uploads/images /app/uploads/imports
}

sync_user_ids() {
  if [ "$(id -u)" -ne 0 ]; then
    return
  fi

  resolved_group="$APP_GROUP"
  resolved_user="$APP_USER"

  existing_group_for_gid="$(getent group "$PGID" | cut -d: -f1 || true)"
  if [ -n "$existing_group_for_gid" ]; then
    resolved_group="$existing_group_for_gid"
  else
    current_gid="$(getent group "$APP_GROUP" | cut -d: -f3)"
    if [ "$current_gid" != "$PGID" ]; then
      groupmod -o -g "$PGID" "$APP_GROUP"
    fi
  fi

  existing_user_for_uid="$(getent passwd "$PUID" | cut -d: -f1 || true)"
  if [ -n "$existing_user_for_uid" ]; then
    resolved_user="$existing_user_for_uid"
  else
    current_uid="$(id -u "$APP_USER")"
    if [ "$current_uid" != "$PUID" ]; then
      usermod -o -u "$PUID" "$APP_USER"
    fi
  fi

  usermod -g "$resolved_group" "$resolved_user"
  APP_USER="$resolved_user"
  APP_GROUP="$resolved_group"

  chown -R "$PUID:$PGID" /app/prisma/db /app/uploads
}

setup_backups() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "⚠️  Running without root; scheduled backups disabled (cron requires root setup)."
    return
  fi

  echo "$CRON_SCHEDULE /app/scripts/backup/backup-db.sh >> /tmp/cron.log 2>&1" | crontab -u "$APP_USER" -
  service cron start
  echo "✅ Cron started for scheduled database backups (schedule: $CRON_SCHEDULE)"
}

check_writable() {
  local path="$1"
  local label="$2"

  if [ -e "$path" ]; then
    if run_as_app test -w "$path"; then
      echo "  ✅ $label: writable"
    else
      echo "  ❌ $label: NOT WRITABLE - recipes may fail to save!"
      echo "     Path: $path"
      echo "     Fix: set PUID/PGID or run chown on mounted volumes"
    fi
  else
    echo "  ⚠️  $label: does not exist yet (will be created)"
  fi
}

create_migration_backup_if_needed() {
  DB_PATH="/app/prisma/db/dev.sqlite"
  if [ ! -f "$DB_PATH" ]; then
    return
  fi

  if run_as_app pnpm prisma migrate status 2>&1 | grep -q "following migration.*not yet been applied"; then
    BACKUP_PATH="/app/prisma/db/migration-$(date +%Y%m%d-%H%M%S).sqlite"
    echo "⚠️  Pending migrations detected. Creating automatic backup: $BACKUP_PATH"
    run_as_app cp "$DB_PATH" "$BACKUP_PATH"
    echo "✅ Backup created successfully"
  fi
}

ensure_directories
sync_user_ids
setup_backups

echo "🔍 Checking folder permissions..."
check_writable "/app/prisma/db" "Database folder"
check_writable "/app/prisma/db/dev.sqlite" "Database file"
check_writable "/app/uploads" "Uploads folder"
check_writable "/app/uploads/images" "Images folder"
echo ""

create_migration_backup_if_needed

if [ "$(id -u)" -eq 0 ]; then
  exec gosu "$APP_USER:$APP_GROUP" pnpm serve
else
  exec pnpm serve
fi
