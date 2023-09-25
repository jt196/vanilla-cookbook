#!/bin/bash
set -e

# Create db if it doesn't exist
npx prisma db push

# Run migrations
npx prisma migrate deploy

# Conditionally run the seed script
node /app/prisma/seed.js

# Start your Node.js application (in foreground)
exec nodemon --exec "npm start"