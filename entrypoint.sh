#!/bin/bash
set -e

# Start your Node.js application (in background)
npm start &

# Run migrations
npx prisma migrate deploy

# Conditionally run the seed script
node /app/prisma/seed.js

# Keep the container running
wait $!