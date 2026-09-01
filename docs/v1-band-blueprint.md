# Terrifit V1 — hardware blueprint and manufacturing cost estimate

**Status:** design intent for the first production run.
**Last updated:** 2026-08-31.
**Scope:** the band, the strap, the PowerPack and the retail box. Firmware and
app are covered in [app-features.md](./app-features.md).

Everything below is an engineering estimate, not a quotation. Component prices
are indicative for a 50,000-unit build with a Shenzhen-based ODM and will move
with the memory and passives market. Anything marked **[quote]** must be
replaced with a real supplier number before this becomes a budget.

---

## 1. What it is

A screenless-except-for-a-strip, always-on wrist wearable. No touchscreen, no
notifications, no app-on-wrist. It measures continuously and shows two things at
a glance: the time and the T Score.

| | |
|---|---|
| Worn | Wrist or bicep (bicep sleeve is a later SKU) |
| Weight | 27 g with strap, 19 g module only |
| Module | 41.5 × 24.0 × 10.6 mm |
| Battery life | 14+ days typical, 11 days worst case (100 Hz PPG + overnight SpO₂ + auto-detection) |
| Water | IP68 and 10 ATM (100 m) |
| Operating range | −20 °C to 60 °C |
| Radio | Bluetooth LE 5.3 |

---

## 2. Stack-up

Bottom (skin side) to top:

```
┌──────────────────────────────────────────────┐
│ 7  Anodised aluminium bezel + strap lugs     │  6063-T5, Type II anodise
│ 6  OLED strip window (PMMA, AR-coated)       │  visible band 26 × 5 mm
│ 5  0.42" mono OLED, 128 × 32                 │  time + T Score + 4 battery dots
│ 4  Rigid-flex PCB, 6 layer                   │  SoC, PMIC, IMU, radio, antenna
│ 3  Li-Po pouch cell, 115 mAh                 │  custom footprint, PCM on cell
│ 2  Wireless charging receiver coil + magnets │  PowerPack docks here
│ 1  Optical window (sapphire) + sensor array  │  5 LED / 4 photodiode, potted
└──────────────────────────────────────────────┘
       glass-filled nylon carrier, ultrasonically welded to the bezel
```

### Optical array (layer 1)

Seen from the skin, the array sits inside a 14 mm circle:

```
        (IR)        LEDs      · green 525 nm ×2   — heart rate, HRV
     PD ▫  ●  ▫ PD            · red 660 nm        — SpO₂
        ●  ◎  ●               · infrared 940 nm   — SpO₂, perfusion
     PD ▫  ●  ▫ PD            · amber 590 nm      — low-perfusion fallback
        (grn)      ◎ = skin temperature thermopile
```

Four photodiodes at 90° reject motion artefact by differencing opposing pairs —
this is what makes rep counting and bar-speed estimates usable during lifting,
where a single-PD design mostly reports noise.

### Sensors

| Function | Part class | Sampling |
|---|---|---|
| PPG analogue front end | 8-channel AFE, integrated LED driver | 100 Hz continuous |
| Motion | 6-axis accel + gyro, 16 g / 2000 dps | 50 Hz, 400 Hz in-session |
| Skin temperature | Digital thermopile, ±0.1 °C | 1 Hz |
| Capacitive touch | On-SoC, single pad under the bezel | wake / cycle display |
| Haptics | 6 mm LRA | rest timers, session start and stop |

---

## 3. Bill of materials

Unit costs at 50,000 units, USD, delivered to the assembly line.

### Electronics

| Item | Est. unit | Notes |
|---|---:|---|
| BLE SoC (Cortex-M33 + radio, 1 MB flash) | 2.60 | **[quote]** nRF5340 class |
| PPG analogue front end | 3.20 | **[quote]** multi-channel, integrated drivers |
| LEDs ×5 and photodiodes ×4 | 1.30 | binned for wavelength consistency |
| 6-axis IMU | 1.10 | |
| Skin temperature sensor | 0.85 | |
| PMIC, charger, protection | 2.40 | includes wireless-charge rectifier |
| 0.42" mono OLED, 128 × 32 | 3.10 | **[quote]** the single biggest swing item |
| LRA + driver | 1.20 | |
| Rigid-flex PCB, 6 layer | 3.60 | ENIG, controlled impedance for the antenna |
| Passives, crystals, connectors, shielding | 1.10 | |
| Li-Po pouch cell, 115 mAh | 1.80 | custom footprint, IEC 62133 certified |
| Wireless charging coil + retention magnets | 0.90 | |
| **Electronics subtotal** | **23.15** | |

### Mechanical

| Item | Est. unit | Notes |
|---|---:|---|
| Aluminium bezel, CNC + anodise | 4.20 | 6 min cycle, Type II, 4 colourways |
| Glass-filled nylon carrier, moulded | 1.10 | 2 parts |
| Sapphire optical window | 0.75 | |
| PMMA display window, AR coated | 0.45 | |
| Gaskets, o-rings, adhesives, potting | 1.10 | the 10 ATM rating lives here |
| Woven strap — jacquard, cut and sew | 2.80 | recycled nylon / elastane, 4 colourways, 3 sizes |
| Clasp hardware, anodised | 1.30 | |
| **Mechanical subtotal** | **11.70** | |

### Assembly, test and pack

| Item | Est. unit | Notes |
|---|---:|---|
| SMT, AOI, conformal coat | 2.90 | |
| Optical calibration per unit | 1.60 | reference phantom, 22 s cycle |
| Final assembly + ultrasonic weld | 2.10 | |
| Pressure and leak test, 100 % | 1.10 | 12 bar, 60 s dwell |
| Functional and RF test | 0.85 | |
| Retail box, tray, printed matter | 2.40 | recycled board, no plastic |
| **Assembly subtotal** | **10.95** | |

### In the box

| Item | Est. unit |
|---|---:|
| V1 PowerPack (500 mAh, USB-C, housing, PCB, assembly) | 8.60 |
| Braided USB-C cable, 1 m | 0.90 |
| **Accessories subtotal** | **9.50** |

### Landed cost

| | USD |
|---|---:|
| BOM + assembly | 55.30 |
| Yield and scrap at 96 % first-pass | 2.30 |
| Freight, duty, insurance | 2.10 |
| Warranty reserve, 3 % of retail | 6.87 |
| **Landed cost per unit** | **66.57** |

At a **$229** retail price that is a **70.9 % gross margin** before payment
processing, returns and fulfilment — roughly in line with the category, and the
reason the membership matters: hardware margin alone does not fund the platform.

---

## 4. Non-recurring engineering

| Item | Est. USD |
|---|---:|
| Injection mould tooling, 3 parts, 2 cavities | 95,000 |
| CNC fixtures, anodising line setup, 4 colours | 28,000 |
| Rigid-flex tooling, stencils, test coupons | 18,000 |
| OLED NRE and minimum order commitment | 60,000 |
| Strap: loom setup, dye lots, 4 colourways | 22,000 |
| Test fixtures — ICT, RF, optical, leak | 140,000 |
| Certification — FCC, CE/RED, UKCA, IC, RCM, SRRC, Bluetooth QDID, IP68/10 ATM, ISO 10993 biocompatibility | 185,000 |
| EVT / DVT / PVT builds, 3 × 300 units | 210,000 |
| **Total NRE** | **758,000** |

Amortised over the first 50,000 units that is **$15.16** a unit, taking the
effective first-run cost to **$81.73** and the first-run margin to **64 %**.

---

## 5. Volume sensitivity

| Units | BOM + assembly | Landed | NRE per unit | Effective cost | Margin at $229 |
|---:|---:|---:|---:|---:|---:|
| 10,000 | 71.40 | 83.90 | 75.80 | 159.70 | 30 % |
| 50,000 | 55.30 | 66.57 | 15.16 | 81.73 | 64 % |
| 250,000 | 46.10 | 56.20 | 3.03 | 59.23 | 74 % |

The 10,000-unit column is why a first run below about 25,000 units is a
marketing exercise rather than a business. If the founding cohort does not clear
that, the honest options are a higher launch price or a delayed run — not a
thinner product.

---

## 6. Cost risks

1. **The OLED strip.** At $3.10 it is 13 % of electronics BOM and the least
   commoditised part. A monochrome segment display would take about $2.40 out
   but loses the T Score arc. Decide before tooling.
2. **The 10 ATM rating.** 100 m costs roughly $1.80 a unit more than 5 ATM in
   sealing, potting and test time. It is worth it: swimming is the single most
   common reason a wearable comes off, and a band that comes off measures nothing.
3. **Four photodiodes.** A two-PD design saves about $0.60 and loses in-session
   rep counting, which is a headline feature of Maps. Not negotiable.
4. **Aluminium.** A moulded bezel would save $3.10 a unit. It would also feel
   like a $60 product.

---

## 7. Open questions before PVT

- Bicep sleeve as a launch SKU or a follow-on?
- Does the T Score arc need its own segment, or is it drawn on the 128 × 32?
- One strap size with an elastic weave, or three cut lengths? Three is $0.40
  more a unit and considerably fewer returns.
- Recycled-content claim on the strap: get the supplier attestation on file
  before it appears anywhere on the site.
