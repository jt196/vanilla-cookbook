# Use the official Node.js runtime as the base image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the current directory contents into the container
COPY . .

# Make executable and define entrypoint file
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

# Create DB folder
RUN mkdir -p /app/prisma/db

# Generate Prisma client
RUN npx prisma generate

# Build SvelteKit app
RUN npm run build

# Expose the application's port
EXPOSE 3000
