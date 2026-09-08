import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads the connection URL from schema.prisma, and no
// longer auto-loads .env. Node's built-in loader covers local development;
// hosted environments inject DATABASE_URL directly.
try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional — the platform supplies DATABASE_URL in deployed envs.
}

/**
 * The datasource is attached only when a URL exists.
 *
 * This file is loaded by *every* Prisma command, and `env("DATABASE_URL")`
 * throws the moment it is evaluated if the variable is missing. That took down
 * `prisma generate`, which runs from `postinstall` and never opens a
 * connection — it only reads the schema. On Vercel the install step died with
 * `PrismaConfigEnvError` before the build had begun, which reads like a broken
 * config rather than a missing setting.
 *
 * Commands that genuinely need a database — `migrate`, `db push`, `studio` —
 * still fail without it, but they fail at the point the connection is wanted
 * and say so plainly.
 */
// CLI operations need a session that stays on one PostgreSQL backend. Keep a
// direct URL available when the application's DATABASE_URL uses a pooler.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  ...(url ? { datasource: { url } } : {}),
});
