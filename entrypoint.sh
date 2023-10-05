#!/bin/bash
set -e

# Run migrations
npx prisma migrate deploy
# Seed db - won't run if already seeded
npx prisma db seed

# Start your Node.js application (in foreground)
exec nodemon --exec "node build/index.js"