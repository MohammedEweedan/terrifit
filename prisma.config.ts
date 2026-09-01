import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer reads the connection URL from schema.prisma, and no
// longer auto-loads .env. Node's built-in loader covers local development;
// hosted environments inject DATABASE_URL directly.
try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional — the platform supplies DATABASE_URL in deployed envs.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
