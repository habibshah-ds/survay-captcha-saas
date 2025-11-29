# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Prune dev dependencies
RUN npm prune --production

# ==========================================
# Production stage
# ==========================================
FROM node:20-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create app directory
WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S captcha -u 1001 && \
    chown -R captcha:nodejs /app && \
    mkdir -p /app/logs && \
    chown -R captcha:nodejs /app/logs

# Switch to non-root user
USER captcha

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command (can be overridden for worker)
CMD ["node", "src/server.js"]
