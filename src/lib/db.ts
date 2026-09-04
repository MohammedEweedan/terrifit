import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

/**
 * Prisma 7 connects through a driver adapter. Postgres in every environment, so
 * what runs locally is what runs in production — under SQLite the type coercion
 * differences only ever surfaced after a deploy.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Point it at Postgres, e.g. postgresql://user@localhost:5432/terrifit",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function client(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Constructed on first use rather than on import. Importing a route module —
 * which a unit test does constantly — should not need a live database, and the
 * missing-URL error should name the request that actually wanted one.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, property, receiver) => Reflect.get(client(), property, receiver),
  set: (_target, property, value, receiver) => Reflect.set(client(), property, value, receiver),
  has: (_target, property) => Reflect.has(client(), property),
});
