#!/bin/bash
set -e

# Start your Node.js application (in background)
npm start &

# Conditionally run the seed script
node /app/prisma/seed.js

# Keep the container running
wait $!