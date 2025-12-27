# Upgrading to Prisma 7

## What's New

- **Performance improvements**: Faster queries with rebuilt TypeScript engine
- **Better SQLite performance**: Using optimized `better-sqlite3` driver
- **Security patches**: 2+ years of updates from Prisma 4.x to 7.x
- **Automated backups**: Scheduled weekly backups + automatic pre-migration backups

## Upgrade Instructions (Docker)

The upgrade is seamless - your database and configuration remain unchanged.

### 1. Backup Your Database (Recommended)

```bash
# Stop your container
docker-compose down

# Backup your database
cp ./db/dev.sqlite ./db/dev.sqlite.backup-$(date +%Y%m%d)
```

**Note**: The container now includes automatic backups before schema migrations and weekly scheduled backups. This manual backup is just extra insurance for the upgrade itself.

### 2. Pull and Restart

```bash
# Pull the latest image
docker pull jt196/vanilla-cookbook:latest

# Start the container
docker-compose up -d
```

### 3. Verify

```bash
# Check logs for successful startup
docker logs vanilla-cookbook

# Should see "No pending migrations to apply" and "ready in XXXms"
```

That's it! Your recipes, users, and data remain untouched.

## What If Something Goes Wrong?

### Quick Rollback

```bash
# Stop current container
docker-compose down

# Restore your database backup
cp ./db/dev.sqlite.backup-YYYYMMDD ./db/dev.sqlite

# Use previous stable version
docker pull jt196/vanilla-cookbook:stable

# Update docker-compose.yml to use :stable instead of :latest
# Then restart
docker-compose up -d
```

## What Didn't Change

- ✅ Your `.env` file - no changes needed
- ✅ Your `docker-compose.yml` file - no changes needed
- ✅ Your database schema - fully compatible
- ✅ Your recipes, users, uploads - everything preserved
- ✅ Volume mounts - `./db` and `./uploads` remain the same

## New Backup Features

### Automatic Backups

The container now includes two types of automatic backups:

- **Pre-migration backups**: Created automatically before any schema migrations (`auto-backup-YYYYMMDD-HHMMSS.sqlite`)
- **Scheduled backups**: Weekly by default, every Sunday at 3am (`scheduled-backup-YYYYMMDD-HHMMSS.sqlite`)

All backups are stored in your mounted `./db` folder.

### Configuring Backups (Optional)

Edit your `.env` file to customize backup behavior:

```bash
# Change schedule (default: Sundays at 3am)
BACKUP_CRON_SCHEDULE=0 2 * * *    # Daily at 2am

# Change retention (default: 6 backups)
BACKUP_RETENTION_COUNT=12          # Keep 12 backups
```

After changing, restart the container: `docker-compose restart`

**Common schedules:**

- `0 2 * * *` - Daily at 2am
- `0 4 * * 1` - Mondays at 4am
- `0 3 1 * *` - 1st of month at 3am
- `0 */6 * * *` - Every 6 hours

## Getting Help

If you encounter issues:

1. Check [GitHub Issues](https://github.com/jt196/vanilla-cookbook/issues)
2. Create a new issue with:
   - Output of `docker logs vanilla-cookbook`
   - Your docker-compose.yml (redact sensitive info)
   - Whether rollback to `:stable` worked
