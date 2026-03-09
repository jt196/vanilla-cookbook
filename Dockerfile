# Use the official Node.js runtime as the base image
FROM node:20

# Install build dependencies for native modules (better-sqlite3), cron and gosu
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    cron \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Set global bin directory for pnpm
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Set git version
ARG GIT_VERSION=unknown
ENV GIT_VERSION=${GIT_VERSION}

# Specify base directory env variable
ENV APP_ROOT_PATH=/app

# Set sensible body size limit (SvelteKit default of 512kb is too small for recipe imports)
ENV BODY_SIZE_LIMIT=5242880

# Copy the current directory contents into the container
COPY . .

# Ensure runtime folders exist
RUN mkdir -p /app/prisma/db /app/uploads/images /app/uploads/imports /pnpm

# Make scripts executable
RUN chmod +x /app/scripts/docker/entrypoint.sh /app/scripts/backup/backup-db.sh

# Approve build scripts for better-sqlite3 and prisma
RUN pnpm config set enable-pre-post-scripts true || true

# Generate Prisma client
# Generate the service worker
# Build SvelteKit app
RUN pnpm build

# Set ownership of runtime-writable paths and executables
# (node_modules/build artifacts only need world-read, not node ownership)
RUN chown -R node:node /app/prisma/db /app/uploads /app/scripts /app/build /pnpm \
    && chmod -R a+rX /app

ENTRYPOINT ["/app/scripts/docker/entrypoint.sh"]

# Expose the application's port
EXPOSE 3000
