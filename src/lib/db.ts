import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma";

/**
 * Prisma 7 connects through a driver adapter. SQLite keeps local development
 * dependency-free; swapping to Postgres means changing the datasource provider
 * in schema.prisma and this adapter to `@prisma/adapter-pg`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Hot reload in dev would otherwise open a new connection pool per edit.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
