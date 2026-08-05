# ============ BUILD STAGE ============
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Keep the same path as the repo so `prisma` resolves the schema identically in
# dev and in the image. Copies the whole dir, so migrations/ ships too.
COPY src/prisma ./src/prisma/
RUN npx prisma generate --schema=./src/prisma/schema.prisma

COPY . .
RUN npm run build

# ============ PRODUCTION STAGE ============
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src/prisma ./src/prisma

USER nodejs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health/liveness || exit 1

CMD ["node", "dist/main.js"]