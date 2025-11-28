# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package.json for runtime scripts if needed (though we run node dist/main)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Use non-root user (node user comes with the image)
USER node

# Expose port
EXPOSE 3001

# Start application
CMD ["dumb-init", "node", "dist/src/main.js"]
