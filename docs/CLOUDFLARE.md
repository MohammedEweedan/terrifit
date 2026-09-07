# Cloudflare: R2, Turnstile and WAF

Three separate things with three different prerequisites. Two of them work
today; one does not, and it is worth being precise about why.

| Feature | Needs DNS on Cloudflare? | Status |
| --- | --- | --- |
| Turnstile | No | Code is in. Add keys to switch it on. |
| R2 media | No | Code is in. Add a bucket and secrets to switch it on. |
| WAF | **Yes** | Blocked until nameservers move. |

## Why the WAF is blocked

Cloudflare's WAF, rate limiting, bot management and DDoS rules all operate on
traffic that passes **through** Cloudflare's edge. `terri.fit` currently uses
Namecheap nameservers (`dns1.registrar-servers.com`) and resolves straight to
Vercel — responses carry `server: Vercel` and no `cf-ray`. Cloudflare never sees
a request, so there is nothing for a rule to act on. No amount of dashboard
configuration changes that.

Enabling it is a DNS migration, not a code change:

1. Add `terri.fit` as a site in Cloudflare (Free tier includes the WAF managed
   ruleset and rate limiting).
2. Let Cloudflare import the existing records, then **check them against
   Namecheap by hand** — importers routinely miss `MX` and `TXT`. Getting this
   wrong silently breaks email and domain verification.
3. Change the nameservers at Namecheap to the pair Cloudflare gives you.
4. Set the `terri.fit` and `www` records to **Proxied** (orange cloud). Vercel
   keeps serving; Cloudflare sits in front.
5. In Vercel → Domains, keep the domain attached. Set Cloudflare SSL/TLS mode to
   **Full (strict)**; anything less either breaks or is not really encryption.

Only after step 4 does a WAF rule do anything.

### Rules worth having once it is proxied

- **Managed ruleset**: enable the Cloudflare OWASP core set.
- **Rate limiting** on `/api/*` — the forms are the exposed surface. The
  in-app limiter (`src/lib/rate-limit.ts`) is per-key and database-backed; an
  edge limit stops the traffic before it reaches a serverless function at all.
- **Bot Fight Mode** for the marketing pages.
- Do **not** challenge `/api/stripe/webhook` or any store callback. Stripe is
  not a browser and cannot solve a challenge; a managed rule in front of a
  webhook endpoint looks exactly like an outage.

## R2

The pages read media from `NEXT_PUBLIC_MEDIA_BASE` when it is set and from
`public/media` when it is not. The files are **never removed from the
repository** — they are the fallback, and `SmartImage`, `Shot` and the app
screenshots each retry the local path when a remote request fails.

1. Create an R2 bucket (`terrifit-media`).
2. Give it a public URL: either the `r2.dev` development URL, or — better, and
   available once DNS is on Cloudflare — a custom domain such as
   `cdn.terri.fit`, which gets edge caching and no `r2.dev` rate limits.
3. Create an R2 API token (Object Read & Write) and add four GitHub secrets:
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
4. Set `NEXT_PUBLIC_MEDIA_BASE` in Vercel to the public base URL, with no
   trailing slash and no `/media` suffix — the paths already contain it.
5. `npm run sync:r2` uploads; the deploy workflow runs it automatically and
   skips itself when the secrets are absent.

The sync compares every file's MD5 against the ETag R2 holds, so re-runs upload
only what changed rather than all 84MB.

## Turnstile

1. Create a Turnstile widget for `terri.fit` (works on any host, Cloudflare DNS
   or not).
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel.

Enforcement is keyed on the secret alone. Unset, the widget renders nothing and
the server skips the check, so the forms behave exactly as they do without
Cloudflare. Set, `/api/waitlist` and `/api/contact` reject a request with no
valid token with `403 {"error":"challenge"}`.

If Cloudflare's verifier is unreachable the check **fails open** and logs it,
matching `rateLimit()`. Taking the signup forms down for someone else's outage
is the worse failure.
