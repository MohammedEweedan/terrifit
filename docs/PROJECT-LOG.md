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
