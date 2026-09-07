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

## 2026-09-06 · 17:12

**Committed** `56d7d2f` on `main` — chore: update project log with recent commit details

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-06 · 17:13

**Committed** `a8f36be` on `main` — chore: update project log with recent commit details

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 03:29

**Committed** `ec9d4b0` on `main` — feat: enhance band scene rendering and controls

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 03:38

**Committed** `1ed56b6` on `main` — chore: update project log with recent commit details

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 04:09

**Working tree** — 2 files · +30 −3

- **other** — `prisma.config.ts`
- **website** — `src/app/sitemap.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 04:10

**Committed** `71e054a` on `main` — feat(prisma): improve datasource handling to prevent build failures on missing DATABASE_URL

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 04:37

**Working tree** — 22 files · +91 −15

- **media** — `public/media/band/colourways-v2/black.png`, `public/media/band/colourways-v2/bubblegum.png`, `public/media/band/colourways-v2/ember.png`, `public/media/band/colourways-v2/graphite.png`, `public/media/band/colourways-v2/midnight.png`, `public/media/band/colourways-v2/olive.png` and 9 more
- **website** — `src/app/globals.css`, `src/app/sitemap.ts`, `src/components/navigation/TerrifitHeader.tsx`, `src/components/search/SiteSearch.tsx`, `src/app/[locale]/hardware/`
- **copy and locales** — `src/i18n/website.ts`, `src/i18n/hardware.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 04:46

**Working tree** — 2 files · +120 −15

- **website** — `src/app/[locale]/layout.tsx`
- **database** — `prisma/migrations/20260907024101/`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 04:53

**Committed** `16d6cd7` on `main` — feat: add hardware page and localization support

**Reverted or committed** — 24 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 05:02

**Committed** `cc9c896` on `main` — feat: implement fallback for product listing to ensure catalog availability

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 05:04

**Committed** `14b62ca` on `main` — feat: update shop page to use listProductsOrSeed for product retrieval

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 05:08

**Committed** `45d607c` on `main` — feat: add Dockerfile and .dockerignore for containerization setup

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 05:12

**Working tree** — 2 files · +6 −0

- **other** — `.do/`, `.github/`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 09:45

**Committed** `34d9ede` on `main` — feat: add DigitalOcean deployment workflow and app specification

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 09:48

**Working tree** — 1 file · +20 −5

- **other** — `.do/app.yaml`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 09:52

**Working tree** — 3 files · +35 −5

- **other** — `.github/workflows/deploy-digitalocean.yml`
- **media** — `public/media/band/colourways-v2/sandstone.png`, `public/media/band/colourways-v2/terrifit-band-stone.png`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:00

**Committed** `211a2e8` on `main` — feat: update DigitalOcean deployment configuration and add new media assets

**Reverted or committed** — 4 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:10

**Working tree** — 5 files · +69 −17

- **other** — `.github/workflows/deploy-digitalocean.yml`
- **media** — `public/media/band/colourways-v2/stone.png`, `public/media/band/materials-v1/stone.png`
- **website** — `src/components/band/colourways.ts`
- **shop** — `src/lib/shop/__tests__/colourways.test.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:10

**Committed** `26df194` on `main` — feat: add new stone images for band colourways and materials

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:10

**Committed** `b1301a3` on `main` — feat: update DigitalOcean deployment configuration and improve type generation for Next.js

**Reverted or committed** — 3 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:15

**Working tree** — 1 file · +52 −1

- **other** — `.github/workflows/deploy-digitalocean.yml`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:15

**Committed** `2a463da` on `main` — feat: enhance DigitalOcean deployment workflow with PostgreSQL service for integration tests

**Reverted or committed** — 1 file no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:18

**Working tree** — 1 file · +23 −0

- **other** — `.github/workflows/deploy-digitalocean.yml`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:19

**Committed** `08a9639` on `main` — feat: add check for DigitalOcean access token in deployment workflow

**Reverted or committed** — 1 file no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:31

**Working tree** — 2 files · +39 −2

- **other** — `.do/app.yaml`, `Dockerfile`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:33

**Committed** `25b0560` on `main` — feat: update Dockerfile and app.yaml for Prisma migration and user permissions

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:43

**Committed** `b90c666` on `main` — feat: update Dockerfile and app.yaml for Prisma migration toolchain and deployment process

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:54

**Committed** `8e7356e` on `main` — feat: update deployment process to use `doctl apps update` for applying app spec

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:56

**Working tree** — 1 file · +11 −1

- **other** — `.do/app.yaml`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 10:56

**Committed** `3fc28a8` on `main` — feat: update migration command in app.yaml to use shell execution for compatibility

**Reverted or committed** — 1 file no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 11:11

**Working tree** — 3 files · +26 −5

- **website** — `src/app/[locale]/band/page.tsx`, `src/app/[locale]/shop/[slug]/page.tsx`
- **shop** — `src/lib/shop/catalog-store.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 11:26

**Committed** `4b21826` on `main` — feat: refactor product retrieval to use getProductOrSeed for improved error handling

**Reverted or committed** — 3 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 11:49

**Working tree** — 3 files · +10 −2

- **shop** — `src/lib/shop/catalog.ts`, `src/lib/shop/product-media.ts`, `src/lib/shop/__tests__/media-paths.test.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 11:55

**Working tree** — 4 files · +18 −2

- **media** — `public/media/shop/placeholders/charger-v1.png`, `public/media/shop/placeholders/hoodie-v1.png`, `public/media/shop/placeholders/hydration-v1.png`, `public/media/shop/placeholders/magnesium-v1.png`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 12:04

**Committed** `7b86896` on `main` — feat: update product media paths and add tests for media existence

**Reverted or committed** — 7 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 12:16

**Working tree** — 2 files · +37 −23

- **website** — `src/app/api/waitlist/route.ts`
- **shop** — `src/lib/shop/product-media.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 12:17

**Committed** `c1f846a` on `main` — feat: refactor waitlist POST handler for improved error handling and duplicate entry response

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 12:38

**Working tree** — 21 files · +594 −14

- **other** — `.env.example`, `.github/workflows/deploy-digitalocean.yml`, `next.config.ts`, `package-lock.json`, `package.json`
- **website** — `src/app/api/contact/route.ts`, `src/app/api/waitlist/route.ts`, `src/app/globals.css`, `src/components/app/AppShowcasePage.tsx`, `src/components/band/BandScrollStory.tsx`, `src/components/band/BandViewer.tsx` and 6 more
- **docs** — `docs/CLOUDFLARE.md`
- **tooling** — `scripts/sync-r2.mjs`
- **server** — `src/lib/media.ts`, `src/lib/turnstile.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 12:42

**Committed** `91e80ad` on `main` — feat: integrate Cloudflare Turnstile for enhanced security

**Reverted or committed** — 21 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 12:59

**Working tree** — 9 files · +169 −13

- **other** — `.env.example`
- **docs** — `docs/CLOUDFLARE.md`
- **website** — `src/app/api/contact/route.ts`, `src/app/api/waitlist/route.ts`, `src/components/contact/ContactExperience.tsx`, `src/components/sections/WaitlistForm.tsx`, `src/components/security/TurnstileWidget.tsx`
- **server** — `src/lib/turnstile.ts`, `src/lib/__tests__/turnstile.test.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 13:24

**Committed** `2233e0d` on `main` — feat: integrate Cloudflare Turnstile for enhanced security and implement verification checks

**Reverted or committed** — 9 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 13:30

**Working tree** — 2 files · +28 −1

- **other** — `.env.example`
- **tooling** — `scripts/sync-r2.mjs`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 13:41

**Committed** `9390eab` on `main` — feat: add USDT (TRC-20) payment method and related functionality

**Reverted or committed** — 2 files no longer differ from HEAD

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 23:52

**Working tree** — 1 file · +11 −0

- **other** — `.env.example`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 00:04

**Working tree** — 14 files · +215 −13

- **other** — `package.json`
- **website** — `src/app/[locale]/hardware/page.tsx`, `src/app/[locale]/nimda/page.tsx`, `src/app/api/checkout/route.ts`, `src/app/globals.css`, `src/components/landing/TerrifitLanding.tsx`, `src/components/shop/CartView.tsx` and 2 more
- **server** — `src/lib/admin.ts`, `src/lib/__tests__/admin-superadmin.test.ts`
- **shop** — `src/lib/shop/catalog.ts`, `src/lib/shop/payments.ts`
- **tooling** — `scripts/sync-catalog-prices.mjs`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 00:56

**Working tree** — 2 files · +336 −25

- **website** — `src/app/storefront.css`, `src/components/shop/ShopCatalog.tsx`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 01:44

**Working tree** — 5 files · +531 −43

- **website** — `src/app/[locale]/page.tsx`, `src/components/band/BandExperience.tsx`, `src/components/marketing/AnnouncementBar.tsx`, `src/components/navigation/TerrifitHeader.tsx`
- **copy and locales** — `src/i18n/storefront.ts`

<sub>Recorded automatically from session. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>

## 2026-09-07 · 01:49

**Committed** `00be403` on `main` — feat: implement admin console page with server-side authentication and data fetching

**Working tree** — 1 file · +540 −43

- **website** — `src/app/[locale]/nimda/page.tsx`

<sub>Recorded automatically from commit. Add the reasoning with `node scripts/project-log.mjs --note "…"`.</sub>
