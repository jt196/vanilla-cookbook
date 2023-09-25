#!/bin/bash
set -e

# Run migrations
npx prisma migrate deploy

# Conditionally run the seed script
node /app/prisma/seed.js

# Start your Node.js application (in foreground)
exec npm start