# ============ BUILD STAGE ============
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY ../package-lock.json ./
RUN npm install

# Generate Prisma client from schema
COPY src/prisma/schema.prisma ./prisma/
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .
RUN npm run build
# Removed: RUN npm prune --production

# ============ PRODUCTION STAGE ============
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm install --only=production

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health/liveness || exit 1

CMD ["node", "dist/main.js"]