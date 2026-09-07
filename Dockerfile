# syntax=docker/dockerfile:1

# Debian slim rather than Alpine. Prisma's query engine needs OpenSSL and a
# glibc target; on musl it needs extra binary targets and libc6-compat, and
# gets that wrong quietly — the client builds and then fails to connect at
# runtime. The image is bigger by a few tens of megabytes and correct.
ARG NODE_VERSION=24-slim

# ---------------------------------------------------------------- dependencies
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# `postinstall` runs `prisma generate`, which writes to src/generated/prisma.
# That directory is gitignored, so it has to be produced here — it is not in
# the build context. `prisma generate` needs no database.
RUN npm ci

# --------------------------------------------------------------------- builder
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Carry over the generated client; `COPY . .` cannot, it is gitignored.
COPY --from=deps /app/src/generated ./src/generated
# No DATABASE_URL. The catalogue falls back to its code-defined seed when the
# database is unreachable, so the build is self-contained — see
# `listProductsOrSeed` in src/lib/shop/catalog-store.ts.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------- runner
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Not root. App Platform does not require it; running as root anyway is a
# habit worth not having.
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# `output: "standalone"` emits a server with only the modules actually
# imported. Static assets and public/ are not included in it and are copied
# separately — miss either and the site serves HTML with no CSS.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
