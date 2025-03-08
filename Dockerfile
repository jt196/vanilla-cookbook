# Use the official Node.js runtime as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Nodemon
RUN npm install -g nodemon

# Specify base directory env variable
ENV APP_ROOT_PATH /app

# Copy the current directory contents into the container
COPY . .

# Make executable and define entrypoint file
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

# Create DB folder
RUN mkdir -p /app/prisma/db
RUN mkdir -p /app/uploads/images /app/uploads/imports

# Generate Prisma client
RUN npx prisma generate

# Generate the service worker
RUN npm run generate-sw

# Build SvelteKit app
RUN npm run build

# Expose the application's port
EXPOSE 3000
