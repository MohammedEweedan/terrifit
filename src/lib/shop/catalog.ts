/**
 * The Terrifit storefront catalogue.
 *
 * These are installation seeds, not the runtime catalogue. `catalog-store.ts`
 * copies missing launch rows into Prisma without overwriting admin edits; the
 * band page, both shops and checkout then read the database. Keeping the seed
 * here means a clean environment is useful while prices, images, colours and
 * stock remain fully editable after first boot.
 */

export const CATEGORIES = ["band", "accessories", "apparel", "fuel", "recovery", "bundles"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Variant = {
  id: string;
  label: string;
  /** Short description of the weave or size, shown under the picker. */
  note?: string;
  /** CSS background for the swatch chip — interwoven straps are two-tone. */
  swatch?: string;
  /**
   * The single colour the colourway's name is set in. Chosen to stay legible
   * on the band page's near-black hero, which is why Black is a light neutral
   * rather than #000 — a black name on a black ground reads as a missing label.
   */
  accent?: string;
  /** Overrides the product price when this option costs more. */
  priceCents?: number;
  sku: string;
  /** Art slot for this specific option, used on the band's colourway switcher. */
  image?: string;
  /** Raw yarn colours, editable in the admin console. */
  colours?: string[];
  /** Live inventory exposed for stock-aware clients and the staff console. */
  stockQuantity?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  active?: boolean;
};

export type Product = {
  launchStatus?: "available" | "upcoming" | "membership";
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  brand: string;
  /** Sold by a verified partner rather than made by Terrifit. */
  partner: boolean;
  priceCents: number;
  compareAtCents?: number;
  rating: number;
  reviews: number;
  badges: string[];
  variantLabel?: string;
  variants: Variant[];
  description: string;
  highlights: string[];
  specs: Array<[string, string]>;
  media: Array<{ src: string; alt: string; ratio?: number }>;
  stock: "in" | "low" | "preorder" | "out";
  shipsIn: string;
  /** Physical goods ship; a membership renews. Drives the checkout copy. */
  fulfilment: "ship" | "subscription";
  /** Optional recurring offer shown on the product page. */
  subscription?: { label: string; discountPercent: number };
  /** Live inventory. Products with variants expose their summed quantity. */
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  active?: boolean;
  featured?: boolean;
  sortOrder?: number;
};

/**
 * Native clients cannot paint the catalogue's CSS gradients directly. Keep the
 * gradient as the source of truth, then expose its yarn colours to the app.
 */
export function swatchColours(swatch: string | undefined): string[] {
  if (!swatch) return [];
  const found = swatch.match(/#[0-9a-f]{3,8}/gi) ?? [];
  return [...new Set(found.map((hex) => hex.toLowerCase()))].slice(0, 4);
}

/** The cross-platform woven swatch generated from admin-managed yarn colours. */
export function swatchFromColours(colours: string[]): string | undefined {
  const valid = colours.filter((colour) => /^#[0-9a-f]{6}$/i.test(colour)).slice(0, 4);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  const stops = valid.map((colour, index) => `${colour} ${index * 3}px ${(index + 1) * 3}px`).join(",");
  return `repeating-linear-gradient(48deg,${stops})`;
}

/** The launch colourways. Referenced by the Band page and the shop alike. */
export const V1_COLOURWAYS: Variant[] = [
  {
    id: "ember",
    label: "Ember",
    note: "Black and signal orange, interwoven",
    swatch: "repeating-linear-gradient(48deg,#0b0b0b 0 3px,#ff4d16 3px 6px)",
    accent: "#ff6a2a",
    sku: "TF-V1-EMB",
    image: "/media/band/colourways-v2/ember.png",
  },
  {
    id: "black",
    label: "Black",
    note: "Black on black, interwoven",
    swatch: "repeating-linear-gradient(48deg,#050505 0 3px,#242424 3px 6px)",
    accent: "#cfcfcf",
    sku: "TF-V1-BLK",
    image: "/media/band/colourways-v2/black.png",
  },
  {
    id: "graphite",
    label: "Graphite",
    note: "Dark grey and light grey, interwoven",
    swatch: "repeating-linear-gradient(48deg,#33373c 0 3px,#a7adb4 3px 6px)",
    accent: "#b6bcc4",
    sku: "TF-V1-GRP",
    image: "/media/band/colourways-v2/graphite.png",
  },
  {
    id: "midnight",
    label: "Midnight",
    note: "Black and deep navy, interwoven",
    swatch: "repeating-linear-gradient(48deg,#0d0f12 0 3px,#1f2e4d 3px 6px)",
    accent: "#6f9bef",
    sku: "TF-V1-MID",
    image: "/media/band/colourways-v2/midnight.png",
  },
  {
    id: "bubblegum",
    label: "Bubblegum",
    note: "Hot pink and off-white, interwoven",
    swatch: "repeating-linear-gradient(48deg,#ff5fa8 0 3px,#f4eee9 3px 6px)",
    accent: "#ff7ab8",
    sku: "TF-V1-BUB",
    image: "/media/band/colourways-v2/bubblegum.png",
  },
  {
    id: "stone",
    label: "Stone",
    note: "Light grey and dark grey, interwoven",
    swatch: "repeating-linear-gradient(48deg,#d3d3d3 0 3px,#a9a9a9 3px 6px)",
    accent: "#c0c0c0",
    sku: "TF-V1-STN",
    image: "/media/band/colourways-v2/stone.png",
  },
  {
    id: "olive",
    label: "Olive",
    note: "Olive green and cream, interwoven",
    swatch: "repeating-linear-gradient(48deg,#5a7d5a 0 3px,#f4eee9 3px 6px)",
    accent: "#8b9b8b",
    sku: "TF-V1-OLV",
    image: "/media/band/colourways-v2/olive.png",
  }
];


export const products: Product[] = [
  {
    slug: "terrifit-v1",
    name: "Terrifit V1",
    tagline: "The band that reads the whole day",
    category: "band",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 19900,
    rating: 4.9,
    reviews: 412,
    badges: ["New", "Founding price"],
    variantLabel: "Colourway",
    variants: V1_COLOURWAYS,
    description:
      "V1 tracks your heart rate, HRV, breathing, blood oxygen, skin temperature and movement all day and all night. It turns that into two numbers you can act on before you train: how much load you can take, and how well you have recovered. There is nothing to check and nothing buzzes.",
    highlights: [
      "15+ days of battery on a single charge",
      "IP68 rated and built for sweat, rain and the shower",
      "Five woven colours, and a strap change takes about four seconds",
      "Writes to Apple Health and Google Health Connect automatically",
    ],
    specs: [
      ["Sensors", "Optical PPG · temperature · motion"],
      ["Battery", "180 mAh · 15+ days"],
      ["Charging", "Magnetic"],
      ["Water rating", "IP68"],
      ["Offline storage", "Up to 30 days"],
      ["Connectivity", "Bluetooth LE 5.4"],
    ],
    media: [
      { src: "/media/band/colourways-v2/ember.png", alt: "The Terrifit V1 in Ember, the orange and charcoal weave shown against a dark ground", ratio: 1 },
      { src: "/media/band-product.jpg", alt: "The Terrifit V1 photographed as a product shot, sensor module and strap together", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Pre-order · ships November 2027",
    fulfilment: "ship",
  },
  {
    slug: "v1-strap-set",
    name: "V1 Strap Set",
    tagline: "All three weaves, one box",
    category: "accessories",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 8900,
    compareAtCents: 10500,
    rating: 4.8,
    reviews: 137,
    badges: ["Bundle"],
    variantLabel: "Size",
    variants: [
      { id: "s", label: "Small", note: "13–15 cm wrist", sku: "TF-STR-S" },
      { id: "m", label: "Medium", note: "15–18 cm wrist", sku: "TF-STR-M" },
      { id: "l", label: "Large", note: "18–21 cm wrist", sku: "TF-STR-L" },
    ],
    description:
      "One strap in each launch colour: Ember, Black, Graphite, Midnight and Bubblegum. Same woven yarn as the strap that comes with V1, so it takes sweat without holding onto the smell and dries flat in about twenty minutes.",
    highlights: ["All five woven colours", "Tool-free swap", "Machine washable"],
    specs: [
      ["Material", "Recycled nylon and elastane weave"],
      ["Clasp", "Anodised aluminium hook"],
      ["Care", "Machine wash cold, air dry"],
    ],
    media: [
      { src: "/media/band/colourways-v2/graphite.png", alt: "A Terrifit V1 strap in Graphite, the two-tone grey weave shown flat", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Pre-order · ships November 2027",
    fulfilment: "ship",
  },
  {
    slug: "v1-strap",
    name: "V1 Strap",
    tagline: "One weave, your colour",
    category: "accessories",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 2900,
    rating: 4.9,
    reviews: 214,
    badges: ["Five colours"],
    variantLabel: "Colourway",
    variants: [
      { id: "ember", label: "Ember", note: "Orange and charcoal interweave", swatch: "linear-gradient(135deg,#ff5a1f 0%,#ff5a1f 48%,#1b1b1d 52%,#1b1b1d 100%)", accent: "#ff7a45", sku: "TF-STR1-EMB", image: "/media/band/colourways-v2/ember.png" },
      { id: "black", label: "Black", note: "Black on black, matte clasp", swatch: "linear-gradient(135deg,#2a2a2d 0%,#2a2a2d 48%,#0d0d0f 52%,#0d0d0f 100%)", accent: "#cfd3d8", sku: "TF-STR1-BLK", image: "/media/band/colourways-v2/black.png" },
      { id: "graphite", label: "Graphite", note: "Two greys, one light one dark", swatch: "linear-gradient(135deg,#8b9099 0%,#8b9099 48%,#3a3f45 52%,#3a3f45 100%)", accent: "#b9bfc7", sku: "TF-STR1-GRA", image: "/media/band/colourways-v2/graphite.png" },
      { id: "midnight", label: "Midnight", note: "Navy and black interweave", swatch: "linear-gradient(135deg,#2b3a5c 0%,#2b3a5c 48%,#0c0f16 52%,#0c0f16 100%)", accent: "#7d93c4", sku: "TF-STR1-MID", image: "/media/band/colourways-v2/midnight.png" },
      { id: "bubblegum", label: "Bubblegum", note: "Hot pink and off-white interweave", swatch: "linear-gradient(135deg,#ff5fa8 0%,#ff5fa8 48%,#f4eee9 52%,#f4eee9 100%)", accent: "#ff7ab8", sku: "TF-STR1-BUB", image: "/media/band/colourways-v2/bubblegum.png" },
      { id: "stone", label: "Stone", note: "Light grey and dark grey, interwoven", swatch: "repeating-linear-gradient(48deg,#d3d3d3 0 3px,#a9a9a9 3px 6px)", accent: "#c0c0c0", sku: "TF-STR1-STN", image: "/media/band/colourways-v2/stone.png" },
      { id: "olive", label: "Olive", note: "Olive green and cream, interwoven", swatch: "repeating-linear-gradient(48deg,#5a7d5a 0 3px,#f4eee9 3px 6px)", accent: "#8b9b8b", sku: "TF-STR1-OLV", image: "/media/band/colourways-v2/olive.png" },
    ],
    description:
      "A single strap in whichever colour you want, so you are not buying four to change one. Same woven yarn as the strap in the box: it takes sweat without holding the smell and dries flat in about twenty minutes.",
    highlights: ["Tool-free swap", "Machine washable", "Fits every V1"],
    specs: [
      ["Material", "Recycled nylon and elastane weave"],
      ["Clasp", "Anodised aluminium hook"],
      ["Sizes", "One strap, adjustable 13–21 cm"],
    ],
    media: [
      { src: "/media/band/colourways-v2/ember.png", alt: "A single Terrifit V1 strap in Ember, the orange and charcoal weave shown flat against a dark ground", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Pre-order · ships November 2027",
    fulfilment: "ship",
  },
  {
    slug: "v1-bicep-strap",
    name: "V1 Bicep Strap",
    tagline: "Move it off your wrist",
    category: "accessories",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 3900,
    rating: 4.7,
    reviews: 88,
    badges: ["Better under load"],
    variantLabel: "Colourway",
    variants: [
      { id: "black", label: "Black", note: "Matte, disappears under a sleeve", swatch: "linear-gradient(135deg,#2a2a2d 0%,#2a2a2d 48%,#0d0d0f 52%,#0d0d0f 100%)", accent: "#cfd3d8", sku: "TF-BIC-BLK" },
      { id: "ember", label: "Ember", note: "The orange weave, wider cut", swatch: "linear-gradient(135deg,#ff5a1f 0%,#ff5a1f 48%,#1b1b1d 52%,#1b1b1d 100%)", accent: "#ff7a45", sku: "TF-BIC-EMB" },
      { id: "graphite", label: "Graphite", note: "Two-tone grey", swatch: "linear-gradient(135deg,#8b9099 0%,#8b9099 48%,#3a3f45 52%,#3a3f45 100%)", accent: "#b9bfc7", sku: "TF-BIC-GRA" },
    ],
    description:
      "Barbell work, front squats and anything on your back all push the wrist around, and a moving sensor reads badly. The bicep strap sits above the elbow where the arm is still, which is why the heart-rate trace stays clean through a heavy set.",
    highlights: ["Steadier heart rate under load", "Sits under a sleeve", "22–40 cm adjustable"],
    specs: [
      ["Material", "Perforated nylon with silicone grip"],
      ["Fit", "22–40 cm upper arm"],
      ["Care", "Rinse after training, air dry"],
    ],
    media: [
      { src: "/media/band/colourways-v2/black.png", alt: "The Terrifit V1 bicep strap in black, the wider band shown flat with its silicone grip facing up", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Pre-order · ships November 2027",
    fulfilment: "ship",
  },
  {
    // Was listed as a "PowerPack" that charged the band on-wrist. The hardware
    // ships a magnetic charger and has no such accessory, so this is now the
    // spare charger people actually lose — priced provisionally, to confirm.
    slug: "v1-charger",
    name: "V1 Charger",
    tagline: "A spare for the drawer",
    category: "accessories",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 1900,
    rating: 4.8,
    reviews: 41,
    badges: [],
    variants: [],
    description:
      "The magnetic charger that comes in the box, on its own. One goes in your bag and one stays by the bed, so a flat band is never a reason to stop wearing it.",
    highlights: ["Magnetic, clips on either way round", "USB-C", "Same charger as in the box"],
    specs: [
      ["Type", "Magnetic charging puck"],
      ["Cable", "USB-C"],
      ["In the box", "Charger and cable"],
    ],
    media: [
      { src: "/media/shop/placeholders/charger-v1.png", alt: "The Terrifit V1 magnetic charger, a small matte black puck on a braided USB-C cable, photographed on a plain ground", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Pre-order · ships November 2027",
    fulfilment: "ship",
  },
  {
    slug: "terrifit-membership",
    name: "Terrifit Membership",
    tagline: "Maps, analytics and the network",
    category: "band",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 2400,
    rating: 4.8,
    reviews: 288,
    badges: ["Monthly"],
    variantLabel: "Term",
    variants: [
      { id: "monthly", label: "Monthly", note: "Cancel any time", sku: "TF-MEM-M" },
      { id: "annual", label: "12 months", note: "Two months free", priceCents: 24000, sku: "TF-MEM-A" },
    ],
    description:
      "The whole Map library, your full history, creator channels and the coaching layer. The band does the measuring, but this is the part that tells you what to do about it.",
    highlights: ["Unlimited Map library access", "Full metric history, exportable", "Creator channels and check-ins"],
    specs: [
      ["Billing", "Monthly or annual"],
      ["Cancellation", "Any time, keeps your data"],
      ["Data export", "CSV and Apple Health"],
    ],
    media: [
      { src: "/media/shop/membership.png", alt: "Terrifit app open on a phone held in one hand, showing the recovery ring at 82 percent on a dark interface", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Starts January 2027, when the app opens",
    fulfilment: "subscription",
    subscription: { label: "Renews monthly", discountPercent: 0 },
  },
  {
    slug: "training-tee",
    name: "Field Tee",
    tagline: "Heavyweight, sweat-tested",
    category: "apparel",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 4200,
    rating: 4.7,
    reviews: 210,
    badges: [],
    variantLabel: "Size",
    variants: [
      { id: "s", label: "S", sku: "TF-TEE-S" },
      { id: "m", label: "M", sku: "TF-TEE-M" },
      { id: "l", label: "L", sku: "TF-TEE-L" },
      { id: "xl", label: "XL", sku: "TF-TEE-XL" },
    ],
    description:
      "240 gsm cotton with a bonded shoulder seam that survives a barbell session, cut long enough to stay put through overhead work.",
    highlights: ["240 gsm combed cotton", "Bonded shoulder seams", "Pre-shrunk"],
    specs: [
      ["Fabric", "240 gsm combed cotton"],
      ["Fit", "Regular, dropped shoulder"],
      ["Care", "Machine wash cold"],
    ],
    media: [
      { src: "/media/shop/placeholders/tee-v1.png", alt: "Heavyweight charcoal training t-shirt laid flat on concrete with a small orange Terrifit mark on the chest", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  {
    slug: "recovery-protein",
    name: "Recovery Protein",
    tagline: "Whey isolate, 27 g a serve",
    category: "fuel",
    brand: "TERRIFUEL",
    partner: false,
    priceCents: 4100,
    rating: 4.8,
    reviews: 524,
    badges: ["Third-party tested"],
    variantLabel: "Flavour",
    variants: [
      { id: "vanilla", label: "Vanilla", sku: "TF-PRO-V" },
      { id: "cocoa", label: "Dark cocoa", sku: "TF-PRO-C" },
      { id: "unflavoured", label: "Unflavoured", sku: "TF-PRO-N" },
    ],
    description:
      "Cold-filtered whey isolate with nothing else in it. No gums, no fillers, no proprietary blend. Every batch is tested for banned substances and the certificate is printed on the tub.",
    highlights: ["27 g protein per serve", "Banned-substance tested", "No gums or fillers"],
    specs: [
      ["Servings", "30 per tub"],
      ["Protein", "27 g per serve"],
      ["Testing", "Informed Sport, per batch"],
    ],
    media: [
      { src: "/media/shop/isolate.png", alt: "Matte black protein tub with an orange lid standing on warm off-white paper, hard side light", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
    subscription: { label: "Subscribe and save", discountPercent: 15 },
  },
  {
    slug: "pure-creatine",
    name: "Pure Creatine",
    tagline: "Monohydrate, nothing added",
    category: "fuel",
    brand: "TERRIFUEL",
    partner: false,
    priceCents: 3400,
    rating: 4.9,
    reviews: 613,
    badges: ["Third-party tested"],
    variants: [],
    description:
      "Creapure monohydrate, micronised so it actually dissolves. Five grams a day is the whole protocol. There is no loading phase worth the bloat.",
    highlights: ["100 % Creapure monohydrate", "Micronised", "80 servings"],
    specs: [
      ["Servings", "80 per jar"],
      ["Dose", "5 g daily"],
      ["Source", "Creapure, Germany"],
    ],
    media: [
      { src: "/media/shop/creatine.png", alt: "Squat white creatine jar with a matte finish and a single orange band, top-lit on paper", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
    subscription: { label: "Subscribe and save", discountPercent: 15 },
  },
  {
    slug: "daily-hydration",
    name: "Daily Hydration",
    tagline: "Electrolytes without the sugar",
    category: "fuel",
    brand: "TERRIFUEL",
    partner: false,
    priceCents: 3100,
    rating: 4.6,
    reviews: 302,
    badges: [],
    variantLabel: "Flavour",
    variants: [
      { id: "citrus", label: "Citrus", sku: "TF-HYD-C" },
      { id: "berry", label: "Berry", sku: "TF-HYD-B" },
    ],
    description:
      "1000 mg sodium, 200 mg potassium and 60 mg magnesium in one stick. Made for people who sweat through a session rather than for sipping at a desk.",
    highlights: ["1000 mg sodium per stick", "Zero sugar", "30 sticks"],
    specs: [
      ["Sticks", "30 per box"],
      ["Sodium", "1000 mg"],
      ["Sugar", "0 g"],
    ],
    media: [
      { src: "/media/shop/hydration.png", alt: "Slim cardboard box of electrolyte sticks in warm sand tones with one stick leaning against it", ratio: 1 },
    ],
    stock: "low",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  {
    slug: "triple-omega-3",
    name: "Triple Omega-3",
    tagline: "2 g EPA + DHA per serve",
    category: "recovery",
    brand: "PIONEER LABS",
    partner: true,
    priceCents: 2900,
    rating: 4.7,
    reviews: 188,
    badges: ["Verified partner"],
    variants: [],
    description:
      "Triglyceride-form fish oil at a dose that matches the research rather than the label. Oxidation values are published for every lot.",
    highlights: ["2 g EPA + DHA", "Triglyceride form", "TOTOX published per lot"],
    specs: [
      ["Servings", "60 softgels"],
      ["EPA + DHA", "2 g per serve"],
      ["Sold by", "Pioneer Labs"],
    ],
    media: [
      { src: "/media/shop/omega-3.jpg", alt: "Amber glass supplement bottle with a cream label on a warm paper background, soft directional light", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships from partner in 3–5 days",
    fulfilment: "ship",
  },
  {
    slug: "night-magnesium",
    name: "Night Magnesium",
    tagline: "Glycinate, for the sleep score",
    category: "recovery",
    brand: "NORTHSTAR",
    partner: true,
    priceCents: 3800,
    rating: 4.8,
    reviews: 241,
    badges: ["Verified partner"],
    variants: [],
    description:
      "Magnesium bisglycinate, 400 mg elemental, with nothing sedating added. If sleep efficiency is the number you are trying to move, start here.",
    highlights: ["400 mg elemental magnesium", "Bisglycinate, gentle on the gut", "No melatonin"],
    specs: [
      ["Servings", "60 capsules"],
      ["Magnesium", "400 mg elemental"],
      ["Sold by", "Northstar"],
    ],
    media: [
      { src: "/media/shop/placeholders/magnesium-v1.png", alt: "Deep navy supplement bottle with a minimal label, shot at night against a dark surface with one soft highlight", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships from partner in 3–5 days",
    fulfilment: "ship",
  },
  {
    slug: "training-shaker",
    name: "Training Shaker",
    tagline: "600 ml, no rattling ball",
    category: "accessories",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 2200,
    rating: 4.5,
    reviews: 154,
    badges: [],
    variants: [],
    description:
      "A moulded agitator instead of a wire ball, a lid that actually seals, and a body that survives being dropped on a platform.",
    highlights: ["600 ml", "Moulded agitator", "Dishwasher safe"],
    specs: [
      ["Volume", "600 ml"],
      ["Material", "Tritan, BPA-free"],
      ["Care", "Dishwasher safe"],
    ],
    media: [
      { src: "/media/shop/placeholders/shaker-v1.png", alt: "Matte black shaker bottle with an orange lid on concrete, hard shadow", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  /* --- Terrifits ---------------------------------------------------------
     The gymwear line. Named as its own label rather than filed under
     "apparel" because it is meant to be worn outside a gym, and because the
     founding-hundred gifts are Terrifits pieces — somebody wearing one is the
     cheapest advertising this brand will ever buy. Photography is still to
     shoot; MANIFEST.md names each slot. Ratings are zero because nothing has
     been reviewed yet. */
  {
    slug: "terrifits-field-tee",
    name: "Terrifits Field Tee",
    tagline: "Heavyweight, sweat-tested",
    category: "apparel",
    brand: "TERRIFITS",
    partner: false,
    priceCents: 4200,
    rating: 0,
    reviews: 0,
    badges: ["Terrifits"],
    variantLabel: "Size",
    variants: [
      { id: "xs", label: "XS", sku: "TFS-TEE-XS" },
      { id: "s", label: "S", sku: "TFS-TEE-S" },
      { id: "m", label: "M", sku: "TFS-TEE-M" },
      { id: "l", label: "L", sku: "TFS-TEE-L" },
      { id: "xl", label: "XL", sku: "TFS-TEE-XL" },
      { id: "xxl", label: "XXL", sku: "TFS-TEE-XXL" },
    ],
    description:
      "240 gsm combed cotton with a bonded shoulder seam that survives a barbell session, cut long enough to stay put through overhead work. The mark is small and on the chest; nothing else is printed on it.",
    highlights: ["240 gsm combed cotton", "Bonded shoulder seams", "Pre-shrunk"],
    specs: [
      ["Fabric", "240 gsm combed cotton"],
      ["Fit", "Regular, dropped shoulder"],
      ["Care", "Machine wash cold"],
    ],
    media: [
      { src: "/media/shop/placeholders/tee-v1.png", alt: "Heavyweight charcoal training t-shirt laid flat on concrete with a small orange Terrifit mark on the chest", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  {
    slug: "terrifits-hoodie",
    name: "Terrifits Hoodie",
    tagline: "400 gsm, brushed back",
    category: "apparel",
    brand: "TERRIFITS",
    partner: false,
    priceCents: 8900,
    rating: 0,
    reviews: 0,
    badges: ["Terrifits"],
    variantLabel: "Size",
    variants: [
      { id: "xs", label: "XS", sku: "TFS-HOOD-XS" },
      { id: "s", label: "S", sku: "TFS-HOOD-S" },
      { id: "m", label: "M", sku: "TFS-HOOD-M" },
      { id: "l", label: "L", sku: "TFS-HOOD-L" },
      { id: "xl", label: "XL", sku: "TFS-HOOD-XL" },
      { id: "xxl", label: "XXL", sku: "TFS-HOOD-XXL" },
    ],
    description:
      "400 gsm loopback cotton, brushed on the inside, with a two-panel hood that holds its shape. Heavy enough to be the only layer you need walking to the gym in February.",
    highlights: ["400 gsm loopback cotton", "Two-panel hood", "Ribbed cuffs and hem"],
    specs: [
      ["Fabric", "400 gsm loopback cotton"],
      ["Fit", "Relaxed"],
      ["Care", "Machine wash cold, dry flat"],
    ],
    media: [
      { src: "/media/shop/placeholders/hoodie-v1.png", alt: "Charcoal heavyweight hoodie photographed flat on concrete with a small orange Terrifit mark at the chest", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  {
    slug: "terrifits-training-shorts",
    name: "Terrifits Training Shorts",
    tagline: "Seven inch, lined",
    category: "apparel",
    brand: "TERRIFITS",
    partner: false,
    priceCents: 5400,
    rating: 0,
    reviews: 0,
    badges: ["Terrifits"],
    variantLabel: "Size",
    variants: [
      { id: "xs", label: "XS", sku: "TFS-SHORT-XS" },
      { id: "s", label: "S", sku: "TFS-SHORT-S" },
      { id: "m", label: "M", sku: "TFS-SHORT-M" },
      { id: "l", label: "L", sku: "TFS-SHORT-L" },
      { id: "xl", label: "XL", sku: "TFS-SHORT-XL" },
      { id: "xxl", label: "XXL", sku: "TFS-SHORT-XXL" },
    ],
    description:
      "A seven-inch inseam with a brief liner and a zip pocket that actually holds a phone still while you run. Four-way stretch woven face, matte rather than shiny.",
    highlights: ["Seven-inch inseam", "Zip pocket that holds a phone", "Four-way stretch"],
    specs: [
      ["Fabric", "88% recycled polyester, 12% elastane"],
      ["Inseam", "Seven inches"],
      ["Care", "Machine wash cold"],
    ],
    media: [
      { src: "/media/shop/placeholders/shorts-v1.png", alt: "Charcoal training shorts laid flat on concrete, zip pocket visible on the right hip", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },

  /* --- Bundles -----------------------------------------------------------
     Priced below the sum of their parts, which is the only honest reason for a
     bundle to exist. Each one answers a question somebody was going to have to
     answer anyway: what do I take, and when. */
  {
    slug: "terrifuel-daily-stack",
    name: "Terrifuel Daily Stack",
    tagline: "Protein, creatine, hydration",
    category: "bundles",
    brand: "TERRIFUEL",
    partner: false,
    priceCents: 9600,
    compareAtCents: 10600,
    rating: 0,
    reviews: 0,
    badges: ["Save $10"],
    variants: [],
    description:
      "The three things worth taking every day, in one box: whey isolate, creatine monohydrate and electrolytes. Nothing exotic, and no proprietary blend hiding the doses.",
    highlights: ["Recovery Protein, 1 kg", "Pure Creatine, 300 g", "Daily Hydration, 30 sticks"],
    specs: [
      ["Contains", "Recovery Protein, Pure Creatine, Daily Hydration"],
      ["Lasts", "About a month at one serve a day"],
      ["Testing", "Third-party tested, batch numbers on the tub"],
    ],
    media: [
      { src: "/media/shop/isolate.png", alt: "Three Terrifuel products grouped on warm paper — protein tub, creatine jar and a box of hydration sticks", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  {
    slug: "terrifuel-night-stack",
    name: "Terrifuel Night Stack",
    tagline: "Magnesium and omega-3",
    category: "bundles",
    brand: "TERRIFUEL",
    partner: false,
    priceCents: 5900,
    compareAtCents: 6700,
    rating: 0,
    reviews: 0,
    badges: ["Save $8"],
    variants: [],
    description:
      "What to take in the evening. Magnesium bisglycinate for sleep quality, and a triple-strength omega-3 for the things that take months rather than days.",
    highlights: ["Night Magnesium, 90 caps", "Triple Omega-3, 90 caps"],
    specs: [
      ["Contains", "Night Magnesium, Triple Omega-3"],
      ["Lasts", "Three months"],
      ["Testing", "Third-party tested for heavy metals"],
    ],
    media: [
      { src: "/media/shop/placeholders/magnesium-v1.png", alt: "Navy magnesium bottle and an amber omega-3 bottle photographed together at night against a dark surface", ratio: 1 },
    ],
    stock: "in",
    shipsIn: "Ships in 2 days",
    fulfilment: "ship",
  },
  {
    slug: "v1-starter-bundle",
    name: "V1 Starter Bundle",
    tagline: "Band, spare strap, charger",
    category: "bundles",
    brand: "TERRIFIT",
    partner: false,
    priceCents: 26900,
    compareAtCents: 28700,
    rating: 0,
    reviews: 0,
    badges: ["Save $18"],
    variants: [],
    description:
      "Everything you need on day one: a Terrifit V1, a second woven strap so one can be in the wash, and a spare charger for the bag.",
    highlights: ["Terrifit V1", "One extra woven strap", "Spare magnetic charger"],
    specs: [
      ["Contains", "Terrifit V1, V1 Strap, V1 Charger"],
      ["Colourway", "Chosen at checkout"],
      ["Warranty", "Two years on the band"],
    ],
    media: [
      { src: "/media/band/colourways-v2/ember.png", alt: "A Terrifit V1 with a spare woven strap and a magnetic charger arranged on a dark ground", ratio: 1 },
    ],
    stock: "preorder",
    shipsIn: "Pre-order",
    fulfilment: "ship",
  },
  {
    // Kept as an inactive launch draft until the selling price, sample weights
    // and final manufacturer SKUs are approved. It is editable in Console and
    // cannot accidentally appear in the shop at $0.
    slug: "terrifuel-starter-samples",
    name: "Terrifuel Starter Samples",
    tagline: "Creatine, L-carnitine and your choice of protein",
    category: "fuel",
    brand: "TERRIFUEL",
    partner: false,
    priceCents: 0,
    rating: 0,
    reviews: 0,
    badges: ["Bundle sample pack"],
    variantLabel: "Protein sample",
    variants: [
      { id: "whey", label: "Whey", note: "Whey protein sample", sku: "TF-SAMPLE-WHEY" },
      { id: "isolate", label: "Whey isolate", note: "Whey isolate sample", sku: "TF-SAMPLE-ISO" },
    ],
    description:
      "A sample-size creatine pack, a sample-size L-carnitine pack and one protein sample chosen by the customer. The manufacturer, allergens, serving weights and final retail price must be approved before this product is activated.",
    highlights: ["Creatine sample", "L-carnitine sample", "Choice of whey or whey isolate sample"],
    specs: [
      ["Pack", "Three single-product samples"],
      ["Protein choice", "Whey or whey isolate"],
      ["Status", "Launch draft — manufacturer details pending"],
    ],
    media: [
      { src: "/media/shop/isolate.png", alt: "Draft Terrifuel sample bundle artwork", ratio: 1 },
    ],
    stock: "low",
    shipsIn: "Draft — do not sell until approved",
    fulfilment: "ship",
    active: false,
  },
];

export function findProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

/** Resolves the variant, falling back to the first when a stale cart names one that is gone. */
export function findVariant(product: Product, variantId?: string): Variant | undefined {
  if (product.variants.length === 0) return undefined;
  return product.variants.find((variant) => variant.id === variantId) ?? product.variants[0];
}

/** Authoritative unit price. Both the cart preview and checkout call this. */
export function unitPriceCents(product: Product, variantId?: string): number {
  return findVariant(product, variantId)?.priceCents ?? product.priceCents;
}

/**
 * What to suggest next to a bag.
 *
 * Rule-based rather than "people also bought", because there is no order
 * history to mine yet and a random four-up reads as filler. The band pulls in
 * the things that attach to it; a bag without the band is offered the band.
 */
export function recommendationsFor(slugsInBag: string[], limit = 3, catalog: Product[] = products): Product[] {
  const inBag = new Set(slugsInBag);
  const hasBand = inBag.has("terrifit-v1");

  const preferred = hasBand
    ? ["v1-strap-set", "v1-charger", "terrifit-membership", "recovery-protein", "night-magnesium"]
    : ["terrifit-v1", "recovery-protein", "pure-creatine", "daily-hydration"];

  const picked = preferred
    .filter((slug) => !inBag.has(slug))
    .map((slug) => catalog.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));

  // Top up from the rest of the catalogue if the rules ran out.
  for (const product of catalog) {
    if (picked.length >= limit) break;
    if (inBag.has(product.slug) || picked.some((item) => item.slug === product.slug)) continue;
    picked.push(product);
  }

  return picked.slice(0, limit);
}

/**
 * The right photograph for one line of a bag or an order.
 *
 * A colourway is the product as far as the customer is concerned: someone who
 * chose Midnight expects to see Midnight in their bag, not a generic hero shot
 * of the Ember one. Falls back to the product's own first image.
 */
export function lineImage(
  product: Product,
  variantId?: string,
): { src: string; alt: string } {
  const variant = findVariant(product, variantId);
  if (variant?.image) {
    return { src: variant.image, alt: `${product.name} in ${variant.label}` };
  }
  const shot = product.media[0];
  return { src: shot?.src ?? "", alt: shot?.alt ?? product.name };
}
