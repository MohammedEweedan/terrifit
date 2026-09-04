# Launch runbook — taking pre-orders

**Status:** the code is ready. What remains is credentials, one legal review and
one photography shoot.
**Last updated:** 2026-09-04.
**Check your progress:** `node --experimental-strip-types scripts/preflight.mjs --live`

---

## 1. The four blockers preflight reports

All four are environment variables. None is a code change.

| Variable | Why it blocks | Where it comes from |
|---|---|---|
| `DATABASE_URL` | No database, no orders | Postgres — Neon, Supabase or RDS |
| `STRIPE_SECRET_KEY` | No card, Apple Pay or Google Pay | Stripe dashboard, **`sk_live_`** |
| `STRIPE_WEBHOOK_SECRET` | **Orders never become paid.** The webhook is the only thing in the codebase allowed to mark an order paid — a browser saying "it worked" is a claim, not evidence | Stripe → Developers → Webhooks |
| `RESEND_API_KEY` + `EMAIL_FROM` | No order confirmations, no password resets | Resend |
| `NEXT_PUBLIC_SITE_URL` | Reset links, report links, sitemap and robots all point at the wrong host | Your domain |

Also set `ALLOW_SANDBOX_CHECKOUT=false`. Without it, a deployment missing Stripe
keys will *grant* Pro and record orders as sandbox rather than refusing — which
is correct in development and gives the product away in production.

Never set `TERRIFIT_DEMO_DATA` in production. It seeds ninety days of fabricated
health history onto a new account.

### Stripe webhook setup

Point a webhook at `https://<your-domain>/api/webhooks/stripe` and subscribe to:

- `checkout.session.completed`, `payment_intent.succeeded` → marks orders paid
- `payment_intent.payment_failed` → marks them failed
- `charge.refunded` → marks them refunded, which also releases the reservation
- `invoice.paid`, `customer.subscription.deleted` → drives Terrifit Pro

Test with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, place
a sandbox order, and confirm the row moves to `paymentStatus: "paid"`. **Do not
open pre-orders until you have watched that happen once.**

---

## 2. How the pre-order actually works

`src/lib/shop/preorder.ts` is the whole model, and it encodes three rules:

1. **The money is a liability until the unit ships.** Nothing counts a
   pre-order as revenue; `reserved` counts units, never currency.
2. **The run is triggered by a number, not a date.** `MANUFACTURING_TRIGGER`
   is 500. The band page shows real progress toward it, queried from the order
   table. There is deliberately no way to seed or override that number.
3. **A refund is available until it ships, no reason required.** Stated on the
   product page and in `/legal/refunds`, from one source.

**Operationally, this obliges you to hold the money.** Put pre-order receipts in
a separate account and do not spend them on operations. If the trigger is not
reached, refund everyone. Every consumer-hardware disaster of the last decade is
the same story: deposits spent early, then no product.

Raise `MANUFACTURING_TRIGGER` once you have the real MOQ from J-Style. It is set
to 500 as a placeholder that matches the blueprint's low-volume assumption.

---

## 3. Before a customer can legally receive a band

From `docs/v1-band-blueprint.md` §5. These are not optional and none is a code
change.

- [ ] **Do not market ECG or AFib.** Rhythm classification is a regulated
      function; Apple and Samsung both went through FDA De Novo. The app already
      words it as "heart rhythm recording, not a diagnosis" — keep it that way
      until you have counsel.
- [ ] **Switch BGEM glucose off and never mention it.** Non-invasive glucose has
      drawn specific FDA warnings.
- [ ] Confirm the FCC ID and CE/UKCA certificates name a model you may rebrand
- [ ] Importer of record on the packaging for EU/UK
- [ ] WEEE and battery-directive registration per market
- [ ] Product liability insurance — white-labelling makes you the manufacturer
- [ ] Published warranty terms

Budget roughly $15–40k and a few weeks with a regulatory consultant.

---

## 4. The photography blocker

**Every band render shows a screen the V8 does not have.** All five
`public/media/terrifit-band-*.png` files display an OLED strip reading
"TSCORE 88%" with a four-dot battery gauge. The copy and callouts have been
rewritten around a screenless band; the photography has not.

Nine other image slots are empty and render a labelled placeholder — run
`npm run media:manifest` for the list. The ones that matter for launch are the
three Terrifits pieces and the two remaining Terrifuel products, because they
are the things the founding-hundred offer gives away.

---

## 5. Launch sequence

1. Set the five environment variables; `preflight --live` goes green
2. Run the Stripe webhook end-to-end once on a test order
3. Shoot the band renders without a screen; shoot the Terrifits three
4. Legal review of `/legal/refunds` and `/legal/terms` against the pre-order model
5. Set `MANUFACTURING_TRIGGER` to the real MOQ
6. Publish, and put the reservation counter on the band page in front of traffic
7. Watch the first hundred: pre-order conversion, D30 retention, free→Pro

Financial model and scenarios: see the projection artifact.
