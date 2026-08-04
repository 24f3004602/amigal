# ============ BUILD STAGE ============
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

# Prisma schema is inside src/prisma in your repo
COPY src/prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build
RUN npm prune --production

# ============ PRODUCTION STAGE ============
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health/liveness || exit 1

CMD ["node", "dist/main.js"]
