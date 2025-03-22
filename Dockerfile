# Use the official Node.js runtime as the base image
FROM node:20

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Set global bin directory for pnpm
ENV PNPM_HOME=/root/.pnpm
ENV PATH=$PNPM_HOME:$PATH

# Set git version
ARG GIT_VERSION=unknown
ENV GIT_VERSION=${GIT_VERSION}

# Specify base directory env variable
ENV APP_ROOT_PATH=/app

# Copy the current directory contents into the container
COPY . .

# Make executable and define entrypoint file
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

# Create DB folder
RUN mkdir -p /app/prisma/db
RUN mkdir -p /app/uploads/images /app/uploads/imports

# Generate Prisma client
# Generate the service worker
# Build SvelteKit app
RUN pnpm build

# Expose the application's port
EXPOSE 3000
