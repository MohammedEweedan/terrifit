# Terrifit ecosystem: current audit and implementation direction

Updated 6 September 2026. This supersedes wearable-first rollout assumptions in older briefs. The existing visual language and native screen designs remain the foundation.

## What changed during the usage-limit pause

The working tree now contains GPS outdoor activities and an activity history/API; a live BLE session link; set-bout detection; double-progression suggestions backed by tests; a contextual Coach chat route and native conversation screen; expanded website translations; a shared announcement store; native country-name fallbacks and currency controls; and an Available Now section replacing the old dated roadmap. The website suite passes all 141 tests and the native TypeScript check passes at the audit baseline.

These improve the software's ability to earn repeat use before hardware exists. Preserve them. A BLE heart-rate stream and inferred work bouts are not a validated rep counter or a complete manufacturer integration. The Coach's model path needs configured credentials and production validation; deterministic session adjustments already work separately.

## Conflicts found

- The homepage still presents the Band before the app.
- The seed/runtime shop has $229 Band, $89 strap pack, $29 strap, $39 bicep strap, and a separate $24/$240 membership product. The actual Pro plan already uses $7.99/$70. These must agree.
- Hardware reservations count pending and sandbox orders. Only settled, non-sandbox, non-refunded demand is manufacturing validation.
- Supplement subscriptions are a discount flag, while current shop payment code creates one-time payments. A frequency selector alone would not implement recurring billing.
- No Scale device model or manufacturer adapter exists. BodyScan already provides useful composition storage to extend, rather than building an isolated scale dashboard.
- Coach chat's documented hourly limit was supplied in seconds to a milliseconds API.
- Community creation is not implemented; existing private messaging is a separate feature and should remain available to members.
- New storefront copy currently covers English and Arabic; the existing translated page dictionaries are broader. Avoid replacing those translations with English.

## Product and launch order

1. **Software:** workout and progress tracking, Maps, nutrition logging, weekly check-ins, goals, measurements, creator tools and membership. Training must work with no hardware attached. Imported or manual data stays labelled by source; missing measurements stay unavailable.
2. **Consumer brand:** Terrifuel, Terrifit Apparel and Terrifit Accessories. Use one account, bag, order history, identity and product photography system. Products with unconfirmed pricing, supply or packs must be labelled upcoming rather than accepting invented orders.
3. **Hardware:** Band and Scale first appear as forthcoming integrations. Open paid pre-orders only after an explicit launch decision; manufacture against settled demand and confirmed supplier terms. No forecast triggers an inventory purchase.

Model: Software → Brand → Audience → Paid pre-orders → Manufacturing → Hardware ecosystem.

## Approved pricing (USD)

| Product | Price |
| --- | ---: |
| Membership / month | $7.99 |
| Membership / year | $70 |
| Terrifit Band | $240 |
| Terrifit Scale | $75 |
| Replacement strap | $15 |
| Three-strap pack | $40 |
| Bicep band | $20 |
| Two-colour bicep pack | $30 |
| Band + Scale (proposed) | about $299 |
| Band + annual membership (proposed) | about $299 |
| Band + Scale + annual membership (proposed) | about $349 |
| Athlete Bundle (proposed) | about $399 |

Proposed bundles need margin and fulfilment approval before becoming purchasable SKUs. Athlete Bundle: Band, Scale, annual membership, bicep band and three replacement straps.

## Demand and cash discipline

The user's scenarios are arithmetic, not forecasts: 2,000 Bands and 600 Scales collect $525,000; 5,000 Bands and 1,500 Scales collect $1,312,500 before fees, refunds, taxes and fulfilment obligations. Track paid units, cancelled/refunded units, gross collected cash and outstanding fulfilment obligations separately. Do not call collected pre-order money available operating cash. Manufacturing, freight, duties, refunds, warranty replacements, processor reserves, support and contingencies need a funded reserve before a manufacturing commitment.

## Technical boundaries

- Keep manufacturer IDs, connection lifecycle, units and normalization behind a device adapter. Screens consume Terrifit domain records, not vendor payloads.
- Store timestamps, device/source identifiers, idempotency keys and measurement provenance. Never mix BIA estimates with clinical readings without identifying the source.
- Band and Scale are independently connected under one account; disconnecting one preserves the other and the user's historical measurements.
- Body interpretation compares sufficient like-for-like measurements across explicit periods. No data means no claim, not a zero or a simulated improvement.
- Subscription replenishment uses customer-selected cadence and labelled serving assumptions, not personalised dosage advice. Discount: 5%. Persist cadence through the bag, order and billing provider.
- Recurring provider calls, renewal webhooks, cancellation and fulfilment must work before claiming automatic repeat delivery. Stripe Checkout does not support mixed intervals in one subscription; provider integration must account for independently scheduled items: https://docs.stripe.com/billing/subscriptions/mixed-interval
- Only creators/coaches create communities. Members may join communities and use private messaging. Enforce creation permissions on the server.

## Commercial focus

Measure the software loop first: signup → first logged workout → another workout within a week → four-week retention. Track shop conversion, contribution margin, repeat orders, customer acquisition cost and referrals by acquisition source. Hardware intent is a separate funnel: interested → paid → still paid after refunds → fulfilled. Use cohort evidence to expand the range; more SKUs and screens do not establish product-market fit.
