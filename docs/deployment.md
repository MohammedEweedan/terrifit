# DigitalOcean deployments and migration locks

GitHub Actions verifies the change, publishes the image, and renders
`.do/app.yaml` with the same full commit SHA for the `web` service and the
`migrate` job. The workflow queues new production rollouts and waits for the
current one to finish. Registry push deployments are disabled; updating the
rendered spec is the deployment trigger. The `latest` tags in the source spec
are only for bootstrapping an app before its first CI rollout.

The pre-deploy job runs `migrate-deploy.mjs` from `/app/migrate`. Its `DIRECT_URL`
binding points at the managed cluster directly, independently of any pooler
the application uses in `DATABASE_URL`. Prisma CLI operations prefer
`DIRECT_URL` in `prisma.config.ts`. Do not point either migration connection at
a transaction pooler: advisory locks belong to database sessions.

Prisma 7 waits ten seconds for its PostgreSQL migration advisory lock. If
another migration holds it, the command exits with P1002 even though the
database is reachable. The wrapper retries **only** that specific lock timeout,
up to six attempts, with 5–20 seconds between attempts. Locking remains enabled.
SQL migration failures, authentication errors and other connection timeouts
fail immediately, preserving the deployment gate.

The failure reported on 2026-09-08 at 09:26 UTC was advisory-lock contention.
A later manual deployment (`0cc504c5-5d9c-4a14-99ce-281c85638dab`) was already
active when inspected, and its migration log at 10:12:45 UTC reported six
migrations and no pending migrations. The historical lock owner cannot be
identified from the failure log alone.

## If lock retries are exhausted

1. Inspect deployment history and the `migrate` job's logs. Wait for a legitimate
   migration to finish before starting another rollout. Cancelling a GitHub
   runner does not itself cancel work already dispatched to App Platform.
2. Confirm the migration job uses the **direct cluster connection**, not a
   connection pool, and has no `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK` setting.
3. From a trusted direct database session, inspect the lock holder and waiters:

   ```sql
   SELECT a.pid, a.application_name, a.state, a.backend_start,
          a.xact_start, a.query_start, a.wait_event_type, a.wait_event,
          l.granted
   FROM pg_locks AS l
   JOIN pg_stat_activity AS a ON a.pid = l.pid
   WHERE l.locktype = 'advisory'
     AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
     AND l.classid = 0
     AND l.objid = 72707369
     AND l.objsubid = 1;
   ```

4. If a holder is an abandoned pooler session, have the database operator verify
   its ownership and end that specific stale session. An advisory unlock on
   another connection cannot release it. Do not terminate active migrations,
   disable advisory locking, or mark migrations as applied to bypass a timeout.
5. Redeploy the intended commit after the holder has released the lock. The
   pre-deploy job will apply pending migrations before the new web image runs.

Run `npm run test:deploy` for isolated checks of retry behavior, failure exit
codes, cancellation, direct connection selection and consistent image tags.
These tests use a temporary CLI fixture and do not connect to any database.

References: [Prisma 7 advisory locking](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production#advisory-locking),
[Prisma direct connections](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer),
[PostgreSQL lock inspection](https://www.postgresql.org/docs/16/view-pg-locks.html),
[DigitalOcean app spec](https://docs.digitalocean.com/products/app-platform/reference/app-spec/).
