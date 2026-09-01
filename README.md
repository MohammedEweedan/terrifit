# Terrifit — landing page and waitlist

Premium dark-first marketing site for the Terrifit fitness platform, with a
segmented waitlist, referral positions, demand capture, ten locales (including
RTL Arabic) and four persona sites on their own subdomains.

## Running it

```bash
npm install
npx prisma db push      # creates dev.db from prisma/schema.prisma
npx prisma generate
npm run dev             # http://localhost:3000
```

`npm run check:i18n` validates every locale dictionary against English.

The native app lives in [`mobile/`](./mobile) and is a separate package:

```bash
npm run app:ios         # first run: builds a development build and launches it
npm run app             # afterwards: starts Metro against that build
npm run app:check       # typechecks it
```

It is a development build rather than Expo Go on purpose — the App Store build
of Expo Go lags the SDK release, so it refuses SDK 57 projects until Apple
ships the matching client. See [mobile/README.md](./mobile/README.md).

It needs `npm run dev` running alongside it — the phone reads the same API the
web app does, and every score is computed server-side so the two cannot drift.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4
- Prisma 7 with a driver adapter — SQLite locally, Postgres in production
- No UI or state libraries: theme, i18n, carousel and reveals are all hand-rolled
- Expo SDK 57 + expo-router for the native app, sharing the site's API and type scale

## Architecture notes

### Internationalisation
`src/i18n/dictionaries/en.ts` is the source of truth — its shape *is* the
`Dictionary` type. Every other locale is JSON annotated as `Dictionary`, so a
missing or renamed key fails the build. A locale with no dictionary falls back
to English rather than rendering blank, which is what lets translations land one
at a time.

Country names and weekday labels are never hardcoded: they come from
`Intl.DisplayNames` and `Intl.DateTimeFormat` in the active locale.

Direction is driven by `localeMeta[locale].dir`. Layout uses logical properties
(`ps-`/`pe-`/`start-`/`end-`) throughout, so RTL needs no separate stylesheet.

### Persona subdomains
`creator.` `coach.` `nutri.` `sup.` each render their own landing page and
onboarding form with the waitlist role locked. `src/proxy.ts` maps the host to a
persona and rewrites to `/[locale]/for/[persona]`, which also stays reachable on
the main host. `siteUrl()` derives sibling links from the live host, so the same
code works on localhost, previews and production with no configuration.

Test locally with `creator.localhost:3000` (resolves to 127.0.0.1 in most
browsers).

### Theming
Dark-first. The full palette is CSS custom properties in `globals.css`; the
`.paper` bands redefine those same tokens so every existing utility keeps
working inside a light section. An inline head script applies the stored theme
and marks the document JS-capable before first paint — that flag is what arms
the scroll reveals, so content is never invisible if the bundle fails.

### Waitlist
`POST /api/waitlist` validates with Zod, rate-limits per IP (in-memory; move to
Redis for multi-instance), and returns the referral code and display position.
Re-submitting a known email returns the original place rather than an error.
Referrals credit only codes that resolve to a real entry; the raw signup order
is stored so the position maths stays auditable.

`POST /api/events` records first-party analytics — no third-party script, no
cookie, session id in `sessionStorage` only.

## Content

Photography lives in `public/media/`. Progress-photo placeholders inside the
prototype screens are deliberately abstract figures rather than stock bodies —
implying results with a stock photo is exactly what the safeguards copy promises
not to do.

**Hero video:** drop an `hero.mp4` into `public/media/` and the hero switches
from the still (with a slow push-in) to video automatically, using the still as
its poster. No code change needed.

## Production checklist

- [ ] Switch `prisma/schema.prisma` datasource to `postgresql` and the adapter in
      `src/lib/db.ts` to `@prisma/adapter-pg`
- [ ] Move rate limiting to Redis
- [ ] Wire the waitlist to a real email provider (double opt-in)
- [ ] Point the four persona subdomains at the same deployment
- [ ] Replace footer link placeholders with real legal pages
- [ ] Add `metadataBase` and an OG image
