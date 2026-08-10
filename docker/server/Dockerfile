FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./
COPY server/prisma ./prisma
RUN npm ci

COPY server/. .
RUN npm run prisma:generate && npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./
COPY server/prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY build/web /build/web

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]
