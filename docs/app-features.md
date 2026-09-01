# Terrifit — app features

**Status:** the feature set the site currently promises. Anything not listed
here should not appear in marketing copy.
**Last updated:** 2026-08-31.

Terrifit is three products sharing one account: a **social app** for the
wellness side of someone's life, a **wearable** that measures it, and a **shop**
that sells the things it runs on. Everything below is organised that way.

---

## 1. Account

| Feature | State | Where |
|---|---|---|
| Email + password sign-up | **Built** | `POST /api/auth/signup` |
| Sign in / sign out | **Built** | `POST /api/auth/login`, `/api/auth/logout` |
| Session cookies, 30 days, SHA-256 stored | **Built** | `src/lib/auth.ts` |
| Roles: athlete, creator, coach, partner | **Built** | on the user record |
| Profile: DOB, sex, height, weight, units, goal, activity level, training days, bio | **Built** | `PATCH /api/profile` |
| Public handle | **Built** | unique, claimed on the profile |
| Password reset by email | Not built | needs a mail provider |
| Email verification | Not built | column exists, flow does not |
| Two-factor | Not built | |

Passwords use scrypt from the Node standard library. Sessions are opaque random
tokens; only their hash is stored, so a database dump cannot be replayed as a
login. Every session for a user can be revoked at once (used after a password
change).

---

## 2. Health data

### Bringing data in

| Source | State | Format |
|---|---|---|
| Apple Health export | **Built** | `export.xml`, streamed by regex, folded per day |
| Google Health Connect | **Built** | JSON export |
| Samsung Health, Garmin, Strava, Fitbit, Oura, Whoop | **Built** | CSV or JSON export |
| InBody scan sheets | **Built** | CSV, column aliases recognised |
| Generic spreadsheet | **Built** | any CSV with a date column and recognisable headers |
| Live OAuth sync | **Partial** | connections are recorded as `pending`; the handshake needs each provider's credentials |

The parser (`src/lib/health/import.ts`) sniffs the format, maps whatever columns
it recognises, converts everything to SI and to a UTC day, and ignores the rest.
Re-importing the same export upserts on `(user, day, source)`, so nothing
doubles. A file that produces nothing recognisable is recorded as a failed
import with a reason rather than silently discarded.

### What is stored

- **Daily metrics** — resting heart rate, HRV, sleep minutes, steps, active
  kcal, weight, respiratory rate, SpO₂. One row per day per source; the app
  picks a winner at read time rather than destroying the others on write.
- **Body scans** — weight, body fat %, skeletal muscle, lean mass, body water,
  visceral fat level, BMR, InBody score, plus the original row.
- **Connections** — which app, its status, when it connected and when it was
  revoked. Revoked connections are kept so the member can see the history.

### Privacy

Health metrics are private by default. `Profile.shareWithCreators` is the
master switch; per-creator grants sit on top of it. Nothing is shared with a
creator until both are on, and revoking empties the creator's view immediately.

---

## 3. The band (V1)

Measured continuously, no session to start:

- Heart rate, 100 Hz, 24 hours a day
- Heart-rate variability, taken during deepest sleep
- Respiratory rate
- Blood oxygen, overnight
- Skin temperature, against the wearer's own baseline
- Sleep stages and sleep need
- **Strain** — cardiovascular load, 0–21
- **Recovery** — one morning score from HRV, RHR, sleep and respiratory rate
- **T Score** — how much of the day was actually spent moving, out of 100.
  Fills through the day, resets at midnight, shown on the band above the time.
- Rep counting, tempo, range of motion and rest timing from the IMU
- Automatic session detection across 80+ activities

Hardware detail is in [v1-band-blueprint.md](./v1-band-blueprint.md).

---

## 4. The apps

The same account, the same numbers, two front ends. Scores are computed on the
server (`src/lib/health/dashboard.ts`) and sent down whole, so the web app and
the phone can never disagree about a recovery score, and improving a formula
ships to both without an App Store review.

| Surface | State | Where |
|---|---|---|
| Web app — Today, Trends, Body | **Built** | `/[locale]/app` |
| iOS + Android app (Expo) — Today, Trends, Body | **Built** | `mobile/` |
| `GET /api/app/dashboard` — latest scores, 90 days of history | **Built** | cookie or bearer |
| `GET /api/app/body` — 60 most recent body scans | **Built** | cookie or bearer |
| Native sign-in returning a bearer token | **Built** | `{ client: "native" }` on login/signup |
| Push notifications, offline cache, band pairing | Not built | |

### The four numbers

- **Readiness** — HRV, resting heart rate, sleep and respiratory rate, weighted
  .45 / .25 / .20 / .10 against the person's own rolling 30-day baseline. When
  an input is missing its weight is redistributed across the rest rather than
  scored as a zero.
- **Strain** — a 0–21 log curve off active energy. Carries a caveat on screen:
  without continuous heart rate this is an estimate, not the band's number.
- **Sleep** — time asleep against sleep need.
- **T Score** — movement across the whole day, against absolute targets set by
  the member's stated activity level.

### Why this number

Every score expands into the arithmetic that produced it: each input's reading,
the baseline it was compared against, the share of the score it carried and the
sub-score it earned — plus a list of what the day was missing. This is the one
thing the incumbents do not do, and it is the reason to switch.

### The native app

Expo SDK 57 with expo-router; three tabs. The session token lives in the device
keychain, never AsyncStorage.

It runs as a **development build**, not in Expo Go: the App Store build of Expo
Go only runs the SDK it was compiled against, and lags each SDK release by
however long Apple's review takes, so it rejects an SDK 57 project with "requires
a newer version of Expo Go". `npm run app:ios` from the repo root builds and
launches it; `npm run app` attaches to it afterwards. Point it at a non-local
backend with `EXPO_PUBLIC_API_URL`.

---

## 5. Maps (training programmes)

A Map has four layers, identical whoever wrote it:

**Block** (4–6 weeks, one adaptation) → **Week** (volume and intensity, adjusted
by last week's recovery) → **Session** (warm-up, main lift, accessories,
finisher, with a time and strain estimate) → **Exercise**.

Every exercise carries a demo from two angles, three coaching cues, two common
faults, a tempo, and substitutions for missing equipment.

- **Auto-regulated loads.** Percentages come off a training max that updates
  from what was completed, not what was planned.
- **Recovery-aware.** Two poor mornings in a row trims volume automatically.
- **Plate maths.** Shows the loaded bar in the gym's own plates, kg or lb.
- **Full history**, searchable by movement, with a rolling 1RM estimate.
- **With a V1 on:** rep counts, tempo, range-of-motion consistency, rest
  discipline, fatigue flags mid-set, and session strain.

---

## 6. Social

### Feeds

| | Public feed | Private feed |
|---|---|---|
| Price | Free | Set by the creator |
| Discovery | Surfaced across Terrifit by goal and level | Subscribers only |
| Content | Posts, clips, photo sets, one free sample session per Map | Programming breakdowns, technique deep-dives, members-only livestreams, early access to Maps |
| Reshares | Yes, by other creators | No |

Both live on one profile, so a follower is one tap from subscribing.

### Channels and messaging

- **Group channels** — everyone on the same Map in the same week
- **Direct messages** — with the member's current Map and week beside the thread
- **Scheduled check-ins** — the same questions weekly, answers land in a queue
- **Voice notes and form review** — audio over a member's video
- **Announcements** — all subscribers, one channel, or only those falling behind
- **Saved replies**

### Shared figures

With consent, a creator sees adherence, recovery trend, sleep, volume, 1RM
change and check-in streak. Off by default, granted per creator, revocable in
one tap.

---

## 7. Creator business

- 80 % revenue share on Maps, subscriptions and channels
- Monthly payouts on the 5th, $50 minimum, rolled over otherwise
- Bank transfer, Wise or Stripe Connect in 40+ countries
- Refunds deducted at cost, never with a penalty
- Map builder with a 340+ movement library, versioned publishing
- Reusable video library, live sessions, check-in queue, storefront, analytics
- Additional commission on partner products

---

## 8. Shop

| Feature | State |
|---|---|
| Catalogue with categories and sorting | **Built** |
| Product pages with variants and subscriptions | **Built** |
| Cart, persisted to localStorage, synced across tabs | **Built** |
| Slide-over bag with recommendations | **Built** |
| Checkout: contact, delivery, payment | **Built** |
| Server-side pricing (prices never come from the browser) | **Built** |
| Orders and order items in the database | **Built** |
| Order receipt page | **Built** |
| Stripe Checkout (card, Apple Pay, Google Pay) | **Built**, needs `STRIPE_SECRET_KEY` |
| PayPal Orders v2 | **Built**, needs `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` |
| Crypto via NOWPayments | **Built**, needs `NOWPAYMENTS_API_KEY` |
| Invoice for teams and gyms | **Built**, offline rail |
| Sandbox mode when a rail has no credentials | **Built** — order recorded, nothing charged, said so on screen |
| Payment webhooks marking orders paid | Not built |
| Shipping rates by destination | Not built — flat $9, free over $75 |
| Tax by destination | Not built — flat 5 % estimate, labelled as an estimate |

`shop.` is a subdomain of the same app: `shop.terrifit.com/en/cart` and
`terrifit.com/en/shop/cart` are one set of routes on two hosts.

---

## 9. Site-wide search

One index built from the copy modules and the product catalogue, so it can never
drift from the pages. Covers pages, products, Maps, band features and specs, app
integrations and support answers. ⌘K, Ctrl+K or `/` opens it; `/[locale]/search`
is the shareable, no-JavaScript version.

---

## 10. Internationalisation

Ten locales: English, Spanish, Arabic (RTL), French, German, Dutch, Portuguese,
Italian, Turkish, Russian.

- English is TypeScript and its shape *is* the type. A missing key in another
  locale fails the build.
- Country names come from `Intl.DisplayNames`, never a translation table.
- The slogan stays English everywhere — it is a pun on the brand name, like a
  wordmark.
- Display type hyphenates and breaks rather than overflowing, so every locale
  gets the same type size.

---

## 11. Not built yet

Worth being explicit, because none of this should appear in copy:

- The feed itself (posting, following, reshares) — designed, not implemented
- Channels, direct messages, check-in queue
- The Map builder and the Map runtime
- Band pairing, firmware and the sync pipeline
- Push notifications and offline caching in the native app
- Payment webhooks, refunds, order status transitions
- Creator payouts
- Password reset, email verification
- Live OAuth sync with health providers
