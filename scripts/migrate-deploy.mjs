import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

// Prisma's advisory lock wait is fixed at ten seconds. Retrying this specific
// failure is safe: no migration starts until Prisma owns the lock. Keep every
// other failure fatal, especially failed SQL migrations and connection errors.
export function isAdvisoryLockTimeout(output) {
  return /\bP1002\b/.test(output)
    && /Timed out trying to acquire a postgres advisory lock/i.test(output);
}

export function assertMigrationConnection(env) {
  const value = env.DIRECT_URL || env.DATABASE_URL;
  if (!value) throw new Error("Migrations require DIRECT_URL or DATABASE_URL.");
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Migrations require a direct PostgreSQL connection.");
  }
  if (url.searchParams.get("pgbouncer") === "true") {
    throw new Error("Migrations cannot use PgBouncer. Set DIRECT_URL to the database's direct connection.");
  }
  if (env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK) {
    throw new Error("Remove PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: deployments must retain migration locking.");
  }
}

export function runPrisma({ cwd, signal, env = process.env, write = (chunk) => process.stdout.write(chunk) }) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      cwd, env, signal, stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const capture = (chunk) => {
      write(chunk);
      // Bound memory even if a migration prints unusually large output.
      output = (output + chunk.toString()).slice(-64 * 1024);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.once("error", reject);
    child.once("close", (code) => resolveResult({ code: code ?? 1, output }));
  });
}

export async function migrateWithRetry({
  run,
  signal,
  attempts = 6,
  wait = (ms) => delay(ms, undefined, { signal }),
  log = console.log,
}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    signal?.throwIfAborted();
    log(`[migrate] Attempt ${attempt}/${attempts}; PostgreSQL advisory locking is enabled.`);
    const result = await run();
    if (result.code === 0 || !isAdvisoryLockTimeout(result.output)) return result.code;
    if (attempt === attempts) {
      log("[migrate] Advisory lock is still held. Inspect the active migration and pg_locks before retrying; see docs/deployment.md.");
      return result.code;
    }
    const waitMs = Math.min(attempt * 5_000, 20_000);
    log(`[migrate] Another database session holds the migration lock; retrying in ${waitMs / 1_000}s.`);
    await wait(waitMs);
  }
  throw new Error("Migration attempts must be positive.");
}

async function main() {
  const controller = new AbortController();
  let interruptedCode;
  const interrupt = (signal) => {
    interruptedCode = signal === "SIGINT" ? 130 : 143;
    controller.abort();
  };
  const onTerm = () => interrupt("SIGTERM");
  const onInt = () => interrupt("SIGINT");
  process.once("SIGTERM", onTerm);
  process.once("SIGINT", onInt);
  try {
    // App Platform injects the direct connection. Local usage may load .env.
    try { process.loadEnvFile(".env"); } catch { /* Optional outside production. */ }
    assertMigrationConnection(process.env);
    process.exitCode = await migrateWithRetry({
      signal: controller.signal,
      run: () => runPrisma({ cwd: process.cwd(), signal: controller.signal }),
    });
  } catch (error) {
    console.error(interruptedCode ? "[migrate] Deployment interrupted." : `[migrate] ${error.message}`);
    process.exitCode = interruptedCode ?? 1;
  } finally {
    process.removeListener("SIGTERM", onTerm);
    process.removeListener("SIGINT", onInt);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
