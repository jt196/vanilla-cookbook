#!/bin/bash
set -e

# Generate Prisma client
# npx prisma generate

# Run migrations
# npx prisma migrate deploy

# Conditionally run the seed script
# node /app/prisma/seed.js
npx prisma migrate deploy

# Start your Node.js application (in foreground)
exec nodemon --exec "node build/index.js"