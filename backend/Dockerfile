# DEVOPS-001: Multi-stage Docker build for Backend API
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for TypeScript build)
# Note: Using npm install instead of npm ci because package-lock.json is not present
# For production, consider generating package-lock.json with: npm install --package-lock-only
RUN npm install && \
    npm cache clean --force

# Copy application source
COPY . .

# Build TypeScript code
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production && \
    npm cache clean --force

# Copy compiled code from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy migrations and other necessary files
COPY --chown=nodejs:nodejs migrations ./migrations
COPY --chown=nodejs:nodejs database ./database

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
