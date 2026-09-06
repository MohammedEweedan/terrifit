# Project log

Every change to Terrifit, recorded automatically.

Appended to by a Claude Code `Stop` hook when a session finishes a turn, and by
a git `post-commit` hook for work done by hand. Newest entries are at the
bottom, so the file reads in the order things happened.

Nothing is written when nothing changed. Add a note by hand with:

```bash
node scripts/project-log.mjs --note "what you did and why"
```

The *why* is the part worth writing. Git already knows what changed.

---

## 2026-09-04 · 21:21

**Working tree** — 5 files · +8 −7

- **shop** — `src/lib/shop/launch-offer.ts`, `src/lib/shop/preorder.ts`, `src/lib/shop/offer-constants.ts`
- **tooling** — `scripts/arcads.mjs`, `scripts/project-log.mjs`

<sub>Recorded automatically from test. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-04 · 21:22 · note

Set up the automatic project log. Records session work via a Claude Code Stop hook and hand-made commits via a git post-commit hook. Also added scripts/arcads.mjs, which generates ad scripts from the site's own copy and refuses to emit regulated or fabricated-testimonial claims.

## 2026-09-04 · 21:47

**Working tree** — 7 files · +253 −25

- **website** — `src/app/globals.css`, `src/components/landing/TerrifitLanding.tsx`, `src/components/landing/Capabilities.tsx`
- **copy and locales** — `src/i18n/dictionaries/en.ts`, `src/i18n/pages/en.ts`
- **shop** — `src/lib/shop/carriers.ts`, `src/lib/shop/seventeentrack.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-04 · 22:04

**Working tree** — 11 files · +1068 −106

- **app** — `mobile/app/pro.tsx`, `mobile/src/i18n/pro.ts`, `mobile/src/stats.tsx`
- **website** — `src/app/api/fitness-age/route.ts`, `src/components/shop/ShopCatalog.tsx`, `src/components/tools/FitnessAgeCalculator.tsx`, `src/app/[locale]/track/`, `src/app/api/shop/`, `src/components/shop/TrackOrder.tsx`
- **health and scoring** — `src/lib/health/dashboard.ts`, `src/lib/health/plan.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-04 · 22:18

**Working tree** — 6 files · +1184 −132

- **app** — `mobile/src/i18n/commerce.ts`
- **media** — `public/media/app/home-dark.png`, `public/media/app/maps-dark.png`, `public/media/app/shop-dark.png`
- **copy and locales** — `src/i18n/marketing.ts`
- **website** — `src/components/landing/Languages.tsx`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-04 · 22:28

**Working tree** — 5 files · +1293 −134

- **app** — `mobile/app/fitness-age.tsx`, `mobile/src/components/AgeDial.tsx`
- **server** — `src/lib/theme.ts`, `src/lib/accents.ts`
- **website** — `src/components/ui/AccentPicker.tsx`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-04 · 23:05

**Working tree** — 11 files · +1530 −147

- **website** — `src/app/[locale]/[destination]/page.tsx`, `src/app/[locale]/dashboard/body/page.tsx`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/dashboard/page.tsx`, `src/app/[locale]/dashboard/trends/page.tsx`, `src/components/app/AppNav.tsx` and 3 more
- **server** — `src/lib/destinations.ts`, `src/lib/search/index.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-04 · 23:14

**Working tree** — 1 file · +1595 −147

- **media** — `public/media/app/accents/`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-05 · 14:00

**Committed** `52def70` on `main` — Add dashboard pages with user authentication and data loading

**Working tree** — 9 files · +1719 −258

- **app** — `mobile/src/components/HeadlineMetric.tsx`, `mobile/src/headline.tsx`
- **website** — `src/app/[locale]/dashboard/body/page.tsx`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/dashboard/page.tsx`, `src/app/[locale]/dashboard/trends/page.tsx`
- **health and scoring** — `src/lib/health/advanced.ts`
- **media** — `public/media/app/shots/`
- **server** — `src/lib/accent-store.ts`

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-05 · 14:00

**Committed** `99ac242` on `main` — feat(i18n): update navigation labels and add app page content

**Reverted or committed** — 50 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-05 · 14:00

**Committed** `c953918` on `main` — chore: update project log with recent commit details

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-05 · 14:01

**Committed** `5512fa3` on `main` — chore: update project log with recent commit details

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 10:54

**Working tree** — 64 files · +584 −888

- **other** — `.gitignore`, `.env.example`
- **app** — `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/profile.tsx`, `mobile/app/onboarding.tsx`, `mobile/src/api.ts`, `mobile/src/health.ts`, `mobile/app/coach.tsx` and 4 more
- **database** — `prisma/schema.prisma`, `prisma/migrations/20260905120000_coaching_plans/`
- **website** — `src/app/[locale]/app/page.tsx`, `src/app/[locale]/dashboard/page.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/shop/page.tsx`, `src/app/api/app/maps/[id]/sessions/[sessionId]/route.ts` and 24 more
- **copy and locales** — `src/i18n/pages/ar.ts`, `src/i18n/pages/en.ts`, `src/i18n/storefront.ts`, `src/i18n/website.ts`
- **health and scoring** — `src/lib/health/__tests__/advanced.test.ts`
- **shop** — `src/lib/shop/__tests__/carriers.test.ts`, `src/lib/shop/__tests__/mrr.test.ts`, `src/lib/shop/catalog-store.ts`, `src/lib/shop/__tests__/shipping.test.ts`, `src/lib/shop/product-media.ts`
- **server** — `src/lib/theme.ts`, `src/lib/announcement-store.ts`, `src/lib/app-downloads.ts`, `src/lib/coaching/`, `src/lib/referral-client.ts`
- **docs** — `docs/hero-image-prompt.json`, `docs/product-image-prompts.json`, `docs/product-refinement.md`
- **media** — `public/media/shop/placeholders/`
- **tooling** — `scripts/verify-coaching.mjs`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 12:24

**Working tree** — 39 files · +2135 −1230

- **app** — `mobile/app.json`, `mobile/app/session/[map]/[id].tsx`, `mobile/package-lock.json`, `mobile/package.json`, `mobile/src/components/Screen.tsx`, `mobile/src/i18n/screens.ts` and 6 more
- **other** — `package-lock.json`
- **website** — `src/app/globals.css`, `src/components/creators/CreatorsExperience.tsx`, `src/components/creators/EarningsCalculator.tsx`, `src/components/marketing/AvailableNow.tsx`, `src/app/api/app/activities/`
- **copy and locales** — `src/i18n/dictionaries/ar.json`, `src/i18n/dictionaries/de.json`, `src/i18n/dictionaries/en.ts`, `src/i18n/dictionaries/es.json`, `src/i18n/dictionaries/fr.json`, `src/i18n/dictionaries/it.json` and 12 more
- **database** — `prisma/migrations/20260906094414_outdoor_activities/`
- **server** — `src/lib/maps/__tests__/`, `src/lib/maps/progression.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 13:12

**Working tree** — 8 files · +4112 −1325

- **app** — `mobile/app/orders.tsx`, `mobile/app/settings.tsx`, `mobile/src/components/AppHeader.tsx`, `mobile/src/market.ts`, `mobile/src/__tests__/`, `mobile/src/components/CoachButton.tsx`
- **website** — `src/components/band/BandExperience.tsx`
- **server** — `src/lib/maps/catalog.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 15:57

**Working tree** — 23 files · +4772 −1422

- **app** — `mobile/app/product/[slug].tsx`, `mobile/src/components/HealthSync.tsx`
- **other** — `package.json`
- **website** — `src/app/api/app/shop/route.ts`, `src/app/[locale]/band/design/`, `src/components/band/BandViewer.module.css`, `src/components/band/BandViewer.tsx`, `src/components/band/band-model.ts`, `src/components/band/band-scene.ts` and 1 more
- **shop** — `src/lib/shop/cart.tsx`, `src/lib/shop/catalog.ts`, `src/lib/shop/orders.ts`, `src/lib/shop/preorder.ts`, `src/lib/shop/launch.ts`
- **docs** — `docs/band-colourway-prompts.json`, `docs/ecosystem-strategy.md`
- **media** — `public/media/V8-1200-900-020.webp`, `public/media/band/`, `public/media/hero.mp4`, `public/media/logo.png`, `public/media/sensors.avif`
- **copy and locales** — `src/i18n/launch.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 17:12

**Committed** `732d73e` on `main` — feat: add LaunchRoadmap component for displaying current and future product availability

**Working tree** — 1 file · +4739 −1375

- **website** — `src/components/marketing/AvailableNow.tsx`

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 17:12

**Committed** `7ba2131` on `main` — feat(coaching): implement session proposal engine and state management

**Reverted or committed** — 134 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>
