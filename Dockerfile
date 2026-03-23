# SignLex Backend - Dockerfile
# Author: Amin Memon
#
# Multi-stage build for minimal production image.
# Usage:
#   docker build -t signlex-backend .
#   docker run -p 5000:5000 --env-file .env signlex-backend

# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production && npm cache clean --force

# ── Stage 2: Production image ──
FROM node:20-alpine
WORKDIR /app

# Security: run as non-root
RUN addgroup -S signlex && adduser -S signlex -G signlex

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs && chown -R signlex:signlex /app

USER signlex

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
