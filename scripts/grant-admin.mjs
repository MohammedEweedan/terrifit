/**
 * Grants or revokes staff access.
 *
 * Deliberately a script and not an endpoint. Staff access is the one privilege
 * that must not be reachable through the product — there is no signup path, no
 * role that confers it and no API that sets it on a fresh account. Somebody
 * with database access grants the first admin; after that the console can
 * promote others, and every one of those is written to the audit log.
 *
 *   node --experimental-strip-types scripts/grant-admin.mjs you@example.com
 *   node --experimental-strip-types scripts/grant-admin.mjs you@example.com --revoke
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const [, , email, flag] = process.argv;
const revoke = flag === "--revoke";

if (!email) {
  console.error("Usage: grant-admin.mjs <email> [--revoke]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Point it at Postgres and run this again.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
  select: { id: true, name: true, isAdmin: true },
});

if (!user) {
  console.error(`No account for ${email}. They need to sign up first.`);
  await prisma.$disconnect();
  process.exit(1);
}

await prisma.user.update({ where: { id: user.id }, data: { isAdmin: !revoke } });

// The grant itself is audited, with the actor being the account it applies to
// — there is no other identity available from a shell.
await prisma.auditLog.create({
  data: {
    actorId: user.id,
    action: revoke ? "user.admin.revoke" : "user.admin.grant",
    target: email.toLowerCase(),
    detail: JSON.stringify({ via: "cli", was: user.isAdmin }),
  },
});

console.log(`${revoke ? "Revoked" : "Granted"} staff access for ${user.name} <${email}>.`);
await prisma.$disconnect();
