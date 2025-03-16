#!/bin/bash
set -e

# Check if the subdirectories exist and create them if not
[ -d "/app/uploads/images" ] || mkdir -p /app/uploads/images
[ -d "/app/uploads/imports" ] || mkdir -p /app/uploads/imports

# Run the production build and start the server
pnpm serve