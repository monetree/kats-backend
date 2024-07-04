# Use the official Node.js image as a base image
FROM node:20-alpine

# Create and change to the app directory
WORKDIR /app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy local code to the container image
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Run the web service on container startup
CMD ["npm", "start"]
