# Terrifit product refinement

Updated 6 September 2026. These changes refine the original Terrifit experience: the wordmark, orange identity, display typography, photography, genuine app captures, native gauges and five-tab navigation remain the design reference.

## What is implemented

- The website remains a collection of real routes: Home, App, Band, Maps, Shop, Coaching and Membership, with existing account, checkout and support routes.
- Website light/dark selection is shared by header and footer, remembered across visits, and respects the system preference before the visitor chooses. The palette resolves before paint. App captures keep their original appearance.
- Mobile navigation has a logo centered independently of its controls, with borderless locale and menu buttons. Its language picker stays within the viewport in both writing directions.
- The App page has a product navigation bar, a real app capture beside the hero, platform actions, a four-chapter walkthrough, interactive colour previews, daily-use detail, hardware requirements, pricing context, FAQ and a persistent mobile action. Short viewports and reduced-motion preferences use a regular scrolling walkthrough. English and Arabic App page copy are included.
- The launch form preserves platform and referral attribution, saves a real signup and shows the returned invitation link. Sharing is initiated by the user.
- Guided Coach uses the actual next Map session. It proposes a shorter session, explains the change, requires acceptance, persists the change and supports undo. Pain or recorded constraints produce a pause proposal. The session runtime reads accepted proposals. Revisions reject conflicting or outdated actions; an event history records changes.
- Native Home keeps DailySignal first, adds the Coach entry and weekly progress, and marks older readings. Weekly sharing uses completed-session and active-day counts, without health readings. Core onboarding is four steps; measurements, activities, market and band pairing remain optional. Appearance stays available in the existing Profile controls.
- Sleep imports exclude awake/in-bed samples, merge overlapping asleep intervals and group by the local end date.

## Launch configuration

`APP_STORE_URL` must point to an HTTPS `apps.apple.com` listing. `PLAY_STORE_URL` must point to an HTTPS `play.google.com` listing. With no listing configured, the platform buttons offer launch updates. Set these at build time and rebuild the website when listings become public; the App route is prerendered. `.env.example` contains placeholders only.

The new coaching tables are in `20260905120000_coaching_plans`. The migration has been applied locally. A deployment needs `prisma migrate deploy` and the generated Prisma client, as well as the existing production setup.

## Product direction

The next release should prove that people return to complete their next workout. Recruit a small cohort with a clear training goal and measure that behaviour before expanding the superapp surface or buying broad acquisition.

Measure the funnel by source and platform: App page visit → launch interest/store click → signup/install → first completed session → a second session → active training in weeks two and four. Track both the number of retained people and conversion percentages. The website now records platform click and launch signup events; install attribution and a cohort reporting dashboard still need implementation.

Use the weekly summary as the initial sharing mechanism. Measure whether shared links lead to activated users. Rewarding empty invitations or signups alone would not establish useful growth. Keep private health readings out of the default share and avoid requiring a purchase before someone experiences training value.

## AI coach structure

The shipped Coach implementation is deterministic guided coaching, not an LLM or a human coach. Do not advertise it as AI chat.

An eventual AI layer should sit above the existing proposal/apply boundary. It can explain supported training decisions and collect context, while the server validates the structured proposal. Begin with one training coach and a defined training use case. Add specialist experiences only after there is evidence of demand and an evaluated scope for each.

Before enabling model-generated recommendations, build evaluation cases for insufficient data, stale readings, unavailable equipment, missed sessions, conflicting inputs, pain and health constraints. Track accepted changes, undo rate, failed proposals, subsequent workout completion, latency and cost. Preserve model/prompt versions and the reason for every applied change. Keep approval and undo in the interface.

## Verification and remaining work

- Production Next.js build and TypeScript: pass, 421 generated pages.
- Focused ESLint and whitespace checks: pass.
- Native TypeScript and iOS/Android bundle exports: pass. Native screens have not been visually verified on a device in this pass.
- Native unit suite: 46 tests pass, including three sleep aggregation cases.
- Website unit suite: 100 pass; five previously failing assertions remain in fitness-age floating-point equality, carrier fallback and legacy membership prices. The five new coaching engine cases pass.
- Local coaching integration: authentication, empty state, proposal, acceptance, runtime application, undo, stale revision rejection, pain pause, stale-session rejection and event history pass.
- Browser signup verification: the iOS source and referral survived navigation, the inviter received credit, and an invitation link appeared. Disposable database entries were removed afterward.
- Browser review covered desktop, 390px and 320px layouts, both website themes, RTL navigation, real capture colour changes, and the launch signup path.

This does not establish product-market fit or guarantee virality. Store publication, native device testing, broader localisation of new coaching/conversion copy, model integration and cohort measurement remain release work. Existing hardware, delivery and marketing claims also need reconciliation against what will actually be available for the launch market.
