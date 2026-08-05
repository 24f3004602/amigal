# ============ BUILD STAGE ============
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Generate Prisma client from schema
COPY src/prisma/schema.prisma ./prisma/
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .
RUN npm run build

# ============ PRODUCTION STAGE ============
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm install --omit=dev

# Copy the custom generated Prisma Client directory from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 4000

# FIX: Use $PORT env var so healthcheck matches whatever Railway assigns
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/health/liveness || exit 1

CMD ["node", "dist/main.js"]