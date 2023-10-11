#!/bin/bash
set -e

# Check if the subdirectories exist and create them if not
[ -d "/app/uploads/images" ] || mkdir -p /app/uploads/images
[ -d "/app/uploads/imports" ] || mkdir -p /app/uploads/imports

# Run migrations
npx prisma migrate deploy
# Seed db - won't run if already seeded
npx prisma db seed

# Start your Node.js application (in foreground)
exec nodemon --exec "node build/index.js"