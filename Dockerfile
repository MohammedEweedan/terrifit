# syntax=docker/dockerfile:1

# Debian slim rather than Alpine. Prisma's query engine needs OpenSSL and a
# glibc target; on musl it needs extra binary targets and libc6-compat, and
# gets that wrong quietly — the client builds and then fails to connect at
# runtime. The image is bigger by a few tens of megabytes and correct.
ARG NODE_VERSION=24-slim
# Kept in step with the client the app was built against.
ARG PRISMA_VERSION=7.10.0

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

# -------------------------------------------------------------------- migrator
# The migration toolchain, installed on its own.
#
# Cherry-picking `node_modules/prisma` and `node_modules/@prisma` out of the
# full tree does not work: npm hoists transitive dependencies to the top level,
# so `@prisma/config` looks for `effect` and does not find it. Installing
# prisma alone resolves its own tree, and lands at about 250MB against 851MB
# for the whole of node_modules.
FROM node:${NODE_VERSION} AS migrator
WORKDIR /migrate
ARG PRISMA_VERSION
RUN npm init -y > /dev/null \
    && npm install --no-audit --no-fund --omit=dev "prisma@${PRISMA_VERSION}"

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
#
# `--create-home` matters: without a home directory anything that wants a
# cache — npm above all — dies with `EACCES: mkdir '/home/nextjs'`, which
# reads like a filesystem problem rather than a missing flag.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --create-home nextjs

# `output: "standalone"` emits a server with only the modules actually
# imported. Static assets and public/ are not included in it and are copied
# separately — miss either and the site serves HTML with no CSS.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The generated Prisma client, which standalone does not trace.
#
# The server chunks import `../src/generated/prisma`, but the tracer copies
# nothing for it — `src/generated` is gitignored and produced at install time,
# and it falls outside what Next follows. Left out, the container starts fine
# and then throws on the first query that touches the database, which looks
# like a database problem and is not.
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Everything the pre-deploy migration job needs, because App Platform runs
# that job from this same image. It used to run `npx prisma migrate deploy`,
# and with no prisma here npx went to the npm registry at container start —
# slow at best, and it failed outright on a user with no home directory.
# `prisma migrate deploy` reads the schema and the migrations folder, so both
# have to be present; it does not open the app's own client.
# The migration toolchain, kept in its own directory so it cannot collide with
# the standalone server's own node_modules. Invoked as build/index.js rather
# than through `node_modules/.bin/prisma`: that is a symlink, Docker's COPY
# dereferences it into a real file in .bin/, and its relative
# `require("./cli.js")` then resolves against the wrong directory.
COPY --from=migrator --chown=nextjs:nodejs /migrate/node_modules ./migrate/node_modules
# The schema and config live *beside* that tree, not at /app. `prisma.config.ts`
# imports "prisma/config", which Node resolves from the config file's own
# directory upward — from /app it would look in /app/node_modules, which holds
# the standalone server's traced deps and no prisma. Everything the migration
# needs sits under /app/migrate and the job runs with that as its directory.
COPY --chown=nextjs:nodejs prisma ./migrate/prisma
COPY --chown=nextjs:nodejs prisma.config.ts ./migrate/prisma.config.ts
COPY --chown=nextjs:nodejs scripts/migrate-deploy.mjs ./migrate/migrate-deploy.mjs

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
