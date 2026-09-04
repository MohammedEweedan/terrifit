# Terrifit V1 — sourcing, unit economics and the V2 question

**Status:** V1 is a white-labelled JCVital Pro V8 from J-Style / Youhong Medical,
repackaged and rebranded. It is not a bespoke design.
**Last updated:** 2026-09-04.
**Supersedes:** the bespoke hardware blueprint dated 2026-08-31, which is
preserved in §7 as the V2 design intent.

The strategy changed for one reason. The bespoke path needed **$758,000 of NRE
and a 50,000-unit first run** — roughly $4.1M of capital — before a single band
shipped, to validate a product nobody had held. The white-label path buys the
same category entry for a fraction of that, and defers the bespoke design until
there is demand evidence to justify it.

---

## 1. What V1 actually is

The **JCVital Pro V8**, from Shenzhen Youhong Technology / Guangdong Youhong
Medical (trading as J-Style, Joint Chinese Ltd), sold as the Terrifit V1 in
Terrifit packaging with Terrifit strap colourways.

Everything in this table comes from the supplier's 2026-04 catalogue and must be
confirmed against a real datasheet before it appears in marketing copy.

| | |
|---|---|
| Form factor | Woven-strap band, sensor module on the outside of the wrist |
| Battery life | **15 days** with continuous heart rate monitoring on |
| Core sensing | Always-on PPG + **ECG electrodes** |
| ECG readings | Sinus rhythm, high heart rate, low heart rate, AFib indication |
| Continuous metrics | Heart rate, SpO₂, HRV, skin temperature, sleep staging |
| Derived (supplier) | Stress & mood, BioAge & Recovery Index, VO₂max, BGEM glucose-risk score |
| Activity | Multi-sport mode with metabolism management, 40+ sports |
| Display | **None.** The module is unbranded metal — there is no screen |
| Connectivity | Bluetooth LE to phone; supplier cloud optional |
| Integration | **Documented SDK and cloud API**, offered as standard |
| Straps | Woven, customisation supported — cream, orange, brown and black shown |

### What changed against the bespoke blueprint

Three things, and two of them are upgrades:

1. **ECG is new.** The bespoke V1 was PPG-only. The V8 adds a medical-grade ECG
   electrode pair with rhythm classification. This is the single biggest
   capability gain, and also the single biggest regulatory liability — see §5.
2. **Battery went up**, 14+ days estimated to 15 days rated.
3. **The screen is gone.** This is the real loss. The bespoke design carried a
   0.42″ mono OLED showing the time, the T Score and a four-dot battery gauge,
   and a meaningful amount of the brand story was built on it — "side-glance
   time", "four-dot battery", the T Score living on the wrist. **All of that
   copy is now false and has been removed from the site.** The T Score survives
   as a Terrifit-computed number in the app; it just is not on the band.

### What we do not yet know

Every one of these must be answered before a pre-order page takes money:

- Does the SDK expose **raw IMU**, or only the classified activity output? The
  rep counting, tempo and range-of-motion claims depend entirely on this. **[quote]**
- Does the SDK expose **raw PPG / RR intervals**, or only the supplier's derived
  HRV? Terrifit's recovery model needs the inputs, not somebody else's score. **[quote]**
- Water rating. The bespoke spec claimed IP68 + 10 ATM. The V8's rating is
  **not stated in the catalogue** and the site now claims nothing until it is. **[quote]**
- Firmware update path — can we ship firmware, or does it come from J-Style? **[quote]**
- Can the supplier cloud be **bypassed entirely** so data goes phone → Terrifit
  API only? If not, the privacy copy has to change. **[quote]**
- MOQ, unit price at MOQ, and packaging tooling cost. **[quote]**

---

## 2. The unit economics, parameterised

We do not have a quote yet, so this is a model rather than a budget. Drop the
real landed cost into `C` and every figure below follows.

Let **C** = landed cost per unit (unit price + freight + duty + packaging).
Retail is held at **$229**, unchanged from the bespoke plan.

| Landed cost `C` | Gross margin at $229 | Margin dollars |
|---:|---:|---:|
| $70 | 69.4 % | $159 |
| $85 | 62.9 % | $144 |
| $100 | 56.3 % | $129 |
| $120 | 47.6 % | $109 |
| $140 | 38.9 % | $89 |

For orientation only: the bespoke design landed at **$66.57 at 50,000 units**
and **$83.90 at 10,000**. A white-label unit at a 1,000–2,000 MOQ will almost
certainly land above both, because we are buying somebody else's margin as well
as their hardware. **The trade is margin for capital, and that is the correct
trade at this stage.** A 50 % margin on 800 units sold is a business. A 64 %
margin on 50,000 units nobody ordered is a warehouse.

### Capital required, both paths

| | Bespoke V1 (abandoned) | White-label V1 |
|---|---:|---:|
| Tooling, fixtures, certification NRE | $758,000 | $0 — supplier holds it |
| Packaging design + tooling | included above | **[quote]**, budget $4–12k |
| First run | 50,000 units | 500–2,000 **[quote]** |
| Inventory capital | $3,328,500 | `C` × MOQ |
| **Total before first sale** | **≈ $4.09M** | **≈ $50k–$250k** |

At a $100 landed cost and a 1,000-unit MOQ that is **$100,000 of inventory plus
packaging** — an order of magnitude inside what pre-orders can plausibly fund,
which is the entire point of the change.

### What the supplier already holds, so we do not pay for it

From the catalogue's qualification page: ISO 13485, ISO 9001, ISO 14001, medical
device production and sales licences, and third-party audits from RBA, BSCI,
Sedex, TUV, SGS and BV. They claim 100+ countries served and 2,000k units/month
capacity.

**This does not transfer to us.** See §5 — it de-risks manufacturing, not
market access.

---

## 3. Packaging — the one thing we actually design

With the electronics fixed, packaging and strap colourways are the entire
physical brand surface. Budget the design effort here rather than spreading it.

- **Outer sleeve** — Terrifit charcoal, signal-orange foil mark, matte laminate.
- **Tray** — moulded pulp, not vac-formed PET. It reads better and it is cheaper
  in small runs.
- **What is in it** — band, one woven strap fitted, USB-C charge cable/cradle,
  a fold-out card that is a genuine first-run setup guide, not a compliance leaflet.
- **The card matters more than it looks.** It is the only Terrifit-authored
  object in the box and it is what a pre-order buyer photographs.
- **Strap colourways** — Ember, Black, Graphite, Midnight, Bubblegum. The
  supplier's stock woven range (cream, orange, brown, black) covers three of
  these directly; Midnight and Bubblegum are **[quote]** on custom dye lots.

Regulatory marking on the box — CE, UKCA, FCC ID, WEEE, importer address — is
**not optional** and is covered in §5.

---

## 4. The SDK path

The catalogue states "SDK & Cloud Platform Support" on every JCVital product,
and the companion-app feature list it ships with maps closely onto what the
Terrifit app already does — sleep staging, HR, SpO₂, HRV, stress, temperature,
activity, VO₂max, BioAge.

The integration shape we want:

```
V8 band ──BLE──▶ Terrifit app (mobile/src/ble.ts)
                      │
                      └──▶ POST /api/app/band  ──▶ Terrifit scoring
                                                    (src/lib/health/dashboard.ts)
```

Data goes band → our app → our API. The supplier cloud is not in the path.

`mobile/src/ble.ts` and `ble-decode.ts` already exist against the bespoke
protocol and will need rewriting to the vendor SDK — assume that work is real
but bounded, on the order of two weeks once the SDK documentation is in hand.

**The scoring stays ours.** This is the part that matters commercially: J-Style
sells the same hardware to anybody, so the sensors are not a moat. Terrifit's
recovery model, the T Score, and the "show the arithmetic behind every number"
expansion are the product. The band is an input device.

That is also the honest reason the app work was not wasted.

---

## 5. Regulatory — read this before writing any band copy

**Putting your name on somebody else's device usually makes you the legal
manufacturer.** Under EU MDR and UK MDR, and in most FDA readings, a white-label
reseller who brands the device as their own takes on manufacturer obligations.
J-Style's ISO 13485 and Chinese registrations do not transfer.

Three tiers of risk, in order:

1. **ECG / AFib detection — highest.** In the US, an ECG feature with rhythm
   classification is a regulated function; Apple and Samsung both went through
   FDA De Novo/510(k) for it. In the EU it is at minimum Class IIa under MDR.
   **Recommendation: do not market ECG or AFib at launch.** Ship the hardware
   with the feature dormant or described purely as "heart rhythm recording, not
   a diagnostic", and revisit with regulatory counsel. Marketing AFib detection
   without clearance is the fastest way to turn a pre-order book into a refund
   event and an FDA warning letter.
2. **BGEM non-invasive glucose risk — high.** Non-invasive glucose is the single
   most scrutinised claim in consumer wearables, and the FDA has issued specific
   public warnings about smartwatches claiming to measure blood glucose. Even
   framed as "risk assessment", this invites enforcement.
   **Recommendation: switch it off and never mention it.**
3. **BioAge, recovery, stress, VO₂max — low.** These are wellness claims and are
   fine, provided the existing "estimates, not clinical measurements"
   disclaimer stays on screen. It currently does.

Non-negotiable before shipping to a customer:
- FCC ID and CE/UKCA marks present on the device or box (supplier should supply;
  **confirm the certificates name a model we can legally rebrand**) **[quote]**
- Importer of record named on the packaging for EU/UK
- WEEE and battery-directive registration in each market sold
- Product liability insurance — you are the manufacturer now
- A published returns and warranty policy that a pre-order buyer can read

---

## 6. Pre-orders as the funding and validation instrument

This is the plan and it is a good one, with three conditions attached.

**What makes it work:** a pre-order is the only demand signal that costs the
buyer something. A thousand waitlist rows tell you nothing; forty paid
pre-orders tell you the price is right and the story lands.

**Condition 1 — do not spend the money.** Pre-order revenue is a liability until
the unit ships. Hold it. If the MOQ is not reached, refund it. Every consumer
hardware disaster of the last decade is the same story: deposits spent on
operations, then no product.

**Condition 2 — publish a real date and a real refund policy.** "Ships when we
hit 500 units, full refund on request until it ships, no questions" is both
honest and more persuasive than a fixed date you might miss.

**Condition 3 — say it is sourced.** Not in small print. A short, confident line
— *V1 is built on a medical-grade platform from a manufacturer that has shipped
to 100+ countries, in Terrifit packaging, running Terrifit's scoring* — is a
stronger position than being caught at it later. The people who would care
already recognise the form factor.

**Suggested gate:** open pre-orders at $229 with a founding price, set the
manufacturing trigger at the real MOQ, and show the count honestly on the page.
That number replaces the fabricated "24,891 members" the site used to carry.

---

## 7. V2 — the bespoke design, deferred

Nothing in the original blueprint was wrong. It was early. It is preserved here
as the design intent for V2, to be built **only after V1 validates demand**.

The V2 case rests on the thing the V8 took away: **the screen**. A screenless
band that shows the time and one number — the T Score — at a glance, with a
four-dot battery gauge, is a genuinely differentiated object and it is what the
brand was written around.

| | V2 design intent |
|---|---|
| Display | 0.42″ mono OLED, 128 × 32 — time + T Score + 4 battery dots |
| Sensing | 100 Hz PPG, 5 LEDs / 4 photodiodes, overnight SpO₂, skin temp |
| Battery | 14+ days typical, 11 days worst case |
| Water | IP68 and 10 ATM (100 m) |
| Weight | 27 g with strap, 19 g module only |
| Module | 41.5 × 24.0 × 10.6 mm |
| Radio | Bluetooth LE 5.3 |
| Landed cost | $66.57 at 50,000 units, $83.90 at 10,000 |
| NRE | $758,000 — tooling $95k, fixtures $140k, certification $185k, OLED $60k, remainder mechanical and strap setup |

**The trigger to start V2:** V1 sells through its first run at full margin, and
retention on the app holds above the benchmark. Not before. The bespoke path
only makes sense against demand you have already proven, and at that point the
$758k is a financing conversation rather than a bet.

---

## 8. Open questions, ranked

1. Does the SDK expose raw IMU and RR intervals? Everything about rep counting
   and our own recovery model depends on it.
2. Unit price at what MOQ, landed where?
3. Which certificates exist, for which model number, and may we rebrand under them?
4. Can the supplier cloud be removed from the data path entirely?
5. Custom strap dye lots for Midnight and Bubblegum — cost and minimum?
6. Who owns firmware, and what is the update mechanism?
7. Warranty terms from the supplier, and how they map to what we offer buyers.
