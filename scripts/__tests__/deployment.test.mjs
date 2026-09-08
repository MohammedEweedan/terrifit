import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertMigrationConnection, migrateWithRetry, runPrisma } from "../migrate-deploy.mjs";
import { pinDeploymentImages } from "../prepare-deploy.mjs";

const lockFailure = {
  code: 1,
  output: "Error: P1002\nContext: Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)). Timeout: 10000ms.",
};

test("waits for advisory lock contention and returns the successful retry", async () => {
  const waits = [];
  let runs = 0;
  const code = await migrateWithRetry({
    run: async () => ++runs < 3 ? lockFailure : { code: 0, output: "Migrations applied" },
    wait: async (ms) => { waits.push(ms); },
    log: () => {},
  });
  assert.equal(code, 0);
  assert.equal(runs, 3);
  assert.deepEqual(waits, [5_000, 10_000]);
});

test("fails without retrying SQL, generic timeout, and authentication errors", async () => {
  for (const output of [
    "Error: P3018 A migration failed to apply.",
    "Error: P1002 The database server was reached but timed out.",
    "Error: P1000 Authentication failed.",
  ]) {
    let runs = 0;
    const code = await migrateWithRetry({
      run: async () => { runs += 1; return { code: 7, output }; },
      wait: async () => assert.fail("Unrelated migration failures must not be retried"),
      log: () => {},
    });
    assert.equal(code, 7);
    assert.equal(runs, 1);
  }
});

test("a persistent lock stops after six attempts and leaves deployment failed", async () => {
  let runs = 0;
  const waits = [];
  const code = await migrateWithRetry({
    run: async () => { runs += 1; return lockFailure; },
    wait: async (ms) => { waits.push(ms); },
    log: () => {},
  });
  assert.equal(code, 1);
  assert.equal(runs, 6);
  assert.deepEqual(waits, [5_000, 10_000, 15_000, 20_000, 20_000]);
});

test("cancelling during backoff cannot start another migration", async () => {
  const controller = new AbortController();
  let runs = 0;
  await assert.rejects(migrateWithRetry({
    signal: controller.signal,
    run: async () => { runs += 1; return lockFailure; },
    wait: async () => { controller.abort(); },
    log: () => {},
  }), { name: "AbortError" });
  assert.equal(runs, 1);
});

test("migration connections retain locking and prefer the direct URL over a pooler", () => {
  const direct = "postgresql://user:password@localhost:5432/terrifit";
  const pooled = `${direct}?pgbouncer=true`;
  assert.throws(() => assertMigrationConnection({}), /require/);
  assert.throws(() => assertMigrationConnection({ DATABASE_URL: pooled }), /cannot use PgBouncer/);
  assert.throws(() => assertMigrationConnection({ DATABASE_URL: direct, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" }), /retain migration locking/);
  assert.doesNotThrow(() => assertMigrationConnection({ DATABASE_URL: pooled, DIRECT_URL: direct }));
  assert.doesNotThrow(() => assertMigrationConnection({ DATABASE_URL: direct }));
});

test("runs the installed CLI and captures both output streams and the actual exit code", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "terrifit-migrate-"));
  try {
    const cli = join(cwd, "node_modules/prisma/build");
    await mkdir(cli, { recursive: true });
    await writeFile(join(cli, "index.js"), `
      const assert = require("node:assert/strict");
      assert.deepEqual(process.argv.slice(2), ["migrate", "deploy"]);
      console.log("CLI started");
      console.error(${JSON.stringify(lockFailure.output)});
      process.exitCode = 4;
    `);
    const printed = [];
    const result = await runPrisma({ cwd, write: (chunk) => printed.push(chunk.toString()) });
    assert.equal(result.code, 4);
    assert.match(result.output, /CLI started/);
    assert.match(result.output, /P1002/);
    assert.match(printed.join(""), /pg_advisory_lock/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("the deployed service and migration always resolve to the same immutable image", async () => {
  const source = await readFile(new URL("../../.do/app.yaml", import.meta.url), "utf8");
  const sha = "a".repeat(40);
  const pinned = pinDeploymentImages(source, sha);
  assert.equal(pinned.match(new RegExp(`tag: ${sha}`, "g"))?.length, 2);
  assert.doesNotMatch(pinned, /tag: latest/);
  assert.match(pinned, /exec node migrate-deploy\.mjs/);
  assert.match(pinned, /key: DIRECT_URL/);
  assert.throws(() => pinDeploymentImages(source, "latest"), /full Git commit SHA/);
  assert.throws(() => pinDeploymentImages(source.replace("tag: latest", "tag: stale"), sha), /inconsistent rollout/);
});

test("deployment cancellation terminates the running CLI", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "terrifit-migrate-cancel-"));
  const controller = new AbortController();
  try {
    const cli = join(cwd, "node_modules/prisma/build");
    await mkdir(cli, { recursive: true });
    await writeFile(join(cli, "index.js"), `
      setInterval(() => {}, 1000);
      console.log("ready");
    `);
    await assert.rejects(runPrisma({
      cwd,
      signal: controller.signal,
      write: () => controller.abort(),
    }), { name: "AbortError" });
  } finally {
    controller.abort();
    await rm(cwd, { recursive: true, force: true });
  }
});
