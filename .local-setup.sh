#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Installing base packages..."
npm i

echo "Generating Prisma client and types..."
npx prisma generate

echo "Building the database..."
npx prisma migrate deploy

echo "Seeding the database..."
npx prisma db seed

echo "Generating the service worker..."
npm run generate-sw

echo "Setup complete!"
