FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production && npm cache clean --force


FROM node:20-alpine
WORKDIR /app

RUN addgroup -S signlex && adduser -S signlex -G signlex

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

RUN mkdir -p logs && chown -R signlex:signlex /app

USER signlex

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
