# syntax=docker/dockerfile:1.7

# ─── builder ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

RUN npm prune --omit=dev

# ─── runtime ─────────────────────────────────────────────────────────────
FROM gcr.io/distroless/nodejs22-debian12 AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json                     ./package.json
COPY public                           ./public

USER nonroot
EXPOSE 9000

CMD ["dist/index.js"]
