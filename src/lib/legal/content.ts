/**
 * The legal pages.
 *
 * Written against what the code actually does rather than from a template:
 * every processor named here appears in `src/lib/shop/payments.ts`, the address
 * lookup, or the push module, and every category of data named here maps to a
 * column in `prisma/schema.prisma`. When one of those changes, this changes.
 *
 * It is not legal advice and has not been through a solicitor. Before taking
 * money or shipping to the EU or California, have somebody qualified read it —
 * particularly the retention periods and the lawful-basis table, which are the
 * two parts a regulator actually checks.
 */

export type LegalSection = { heading: string; body: string[]; list?: string[] };

export type LegalDocument = {
  slug: "privacy" | "terms" | "health" | "refunds" | "affiliate" | "cookies";
  title: string;
  summary: string;
  /** Shown under the title so somebody can tell at a glance if it moved. */
  updated: string;
  sections: LegalSection[];
};

const UPDATED = "1 September 2026";

const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy",
  summary:
    "What we collect, why, who else sees it and how to get rid of it. Health data is the most sensitive thing you can hand an app, so this says exactly what happens to yours.",
  updated: UPDATED,
  sections: [
    {
      heading: "The short version",
      body: [
        "We collect what the product needs to work and nothing else. Your health data is used to compute your scores and is shown to you. We do not sell it, we do not use it for advertising, and no coach, creator or brand sees any of it until you specifically share it with them.",
        "You can export everything and delete your account from your account settings. Deleting removes your health records, your posts and your profile.",
      ],
    },
    {
      heading: "What we collect",
      body: ["Three groups, and you can see all of it in your account:"],
      list: [
        "Account: your name, email, a hashed password, your locale, and a public handle if you choose one.",
        "Health: heart rate, resting heart rate, heart-rate variability, sleep duration, steps, active energy, weight, respiratory rate and blood oxygen — one row per day, from Apple Health, Health Connect, a file you upload, or a paired V1 band.",
        "Commerce: orders you place, the address you gave for delivery, and your phone number if you provided one.",
      ],
    },
    {
      heading: "How your scores are worked out",
      body: [
        "Recovery, strain, sleep, your T Score, fitness age, sleep quality, load and body battery are all computed on our servers from the data above, on the fly, each time you open the app. They are not stored, so improving a formula improves your whole history rather than leaving a trail of numbers from whichever version was deployed that week.",
        "They are estimates derived from consumer sensors. They are not clinical measurements and are not a diagnosis.",
      ],
    },
    {
      heading: "Apple Health and Google Health Connect",
      body: [
        "We read from Apple Health and Health Connect only after you grant permission, and only the specific data types listed above. We never write back to them. You can revoke access at any time in iOS Settings or the Health Connect app, and the app keeps working with whatever it already has.",
        "Apple requires that HealthKit data is not used for advertising or sold to data brokers. We do neither, and we would not want to.",
      ],
    },
    {
      heading: "Who else sees it",
      body: ["Only the companies we need to run the service, each of which sees only its own slice:"],
      list: [
        "Stripe — payments. Sees your name, email, address and the amount. Card numbers go straight to Stripe and never touch our servers.",
        "PayPal and NOWPayments — the other two payment rails, if you pick one. Same principle.",
        "Ideal Postcodes, getAddress.io or OpenStreetMap — the postcode you type at checkout, to look up the address. Nothing else is sent.",
        "Expo's push service — a device token, so a notification can reach your phone. No health data is ever put in a notification body.",
      ],
    },
    {
      heading: "Who never sees it",
      body: [
        "Advertisers. Data brokers. Insurers. Employers. Coaches and creators on the platform, unless you turn on sharing for that specific person, which is off by default and revocable in one tap.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Health records and orders stay until you delete them or close your account. Orders are kept for six years after that, because tax law requires it — those records contain the order and the amount, not your health data.",
        "Analytics events are stored without your name attached and are deleted after 12 months.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under UK and EU data protection law you can ask for a copy of your data, correct it, delete it, or object to how we use it. Export and delete are buttons in your account; for anything else, email privacy@terrifit.com and we will answer within 30 days.",
        "Our lawful basis is performance of a contract for the account and orders, and your explicit consent for health data — which is why nothing is read from Apple Health until you tap allow.",
      ],
    },
    {
      heading: "Security",
      body: [
        "Passwords are hashed with scrypt. Session tokens are stored as SHA-256 hashes, so a copy of our database does not hand anybody a working session. Card details never reach our servers at all.",
      ],
    },
    {
      heading: "Children",
      body: ["Terrifit is not for under-16s and we do not knowingly collect their data."],
    },
    {
      heading: "Getting in touch",
      body: ["privacy@terrifit.com for anything on this page, or the contact form for everything else."],
    },
  ],
};

const terms: LegalDocument = {
  slug: "terms",
  title: "Terms",
  summary: "What you can expect from us and what we expect from you.",
  updated: UPDATED,
  sections: [
    {
      heading: "The agreement",
      body: [
        "Using Terrifit — the app, the website, or a V1 band — means you accept these terms. If you do not, do not use it.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "One account per person. Keep your password to yourself; you are responsible for what happens under your account. Tell us if you think somebody else has got into it.",
        "You must be 16 or older.",
      ],
    },
    {
      heading: "What Terrifit is not",
      body: [
        "It is not a medical device and it is not medical advice. Recovery, strain, sleep, fitness age and every other score are estimates from consumer sensors, not diagnoses. They cannot detect illness. If something feels wrong with your body, see a doctor rather than opening an app.",
      ],
    },
    {
      heading: "Pro",
      body: [
        "Pro is billed monthly or yearly through Stripe and renews automatically until you cancel. Cancel any time from the app; you keep Pro until the end of the period you have already paid for, and we do not pro-rate the remainder.",
        "The 14-day trial is offered once per account and converts to a paid subscription only if you choose to subscribe. We will not charge you at the end of a trial without you asking us to.",
        "If we raise the price, we will tell you before it applies to you, and you can cancel.",
      ],
    },
    {
      heading: "Things you buy",
      body: [
        "Prices are shown before you pay and are re-checked on our servers at checkout, so what you are charged is what the catalogue says regardless of what your device sends us. Delivery and tax are worked out at the last step.",
        "Supplements are food, not medicine. Read the label, and speak to a clinician if you take prescribed medication.",
      ],
    },
    {
      heading: "What you post",
      body: [
        "You keep the rights to what you post. You give us permission to show it in the app to the people you shared it with.",
        "Do not post anything illegal, abusive, or somebody else's, and do not use Terrifit to sell unlicensed medical claims. We remove content that breaks this and can close accounts that keep doing it.",
      ],
    },
    {
      heading: "When things go wrong",
      body: [
        "We aim to keep the service running but do not promise it never breaks. Where the law allows, we are not liable for indirect losses. Nothing here limits liability for death, personal injury caused by negligence, or fraud — those cannot be excluded and we would not try to.",
      ],
    },
    {
      heading: "Governing law",
      body: ["These terms are governed by the law of England and Wales."],
    },
  ],
};

const health: LegalDocument = {
  slug: "health",
  title: "Health disclaimer",
  summary:
    "Terrifit estimates. It does not diagnose. This page explains where the numbers come from and what they cannot tell you.",
  updated: UPDATED,
  sections: [
    {
      heading: "Not a medical device",
      body: [
        "Terrifit is not registered as a medical device with the MHRA, the FDA, or any other regulator, and it is not intended to diagnose, treat, cure or prevent any disease. Nothing it shows you is a substitute for a clinician.",
      ],
    },
    {
      heading: "Where the numbers come from",
      body: [
        "Fitness age is estimated from resting heart rate against population norms, adjusted for BMI and activity, using the approach behind the HUNT Fitness Study and the Uth–Sørensen–Overgaard–Pedersen estimate of VO₂ max. It is an estimate with a wide error bar, not a measurement of your cardiovascular age.",
        "Sleep quality combines duration, overnight restoration and regularity. True sleep efficiency needs time-in-bed, which most sources do not record, so it is left out rather than guessed at.",
        "Load — labelled 'load', not 'stress' — is derived from suppressed heart-rate variability alongside an elevated resting heart rate. It cannot tell a hard week at work from a hard week of training or the start of a cold. All three move it the same way.",
        "Body battery models a reservoir charged by sleep and drained by the day's load, from daily aggregates rather than continuous sampling.",
      ],
    },
    {
      heading: "What it cannot do",
      body: [
        "It cannot detect atrial fibrillation, sleep apnoea, infection, or any other condition. A low recovery score is not a diagnosis and a high one is not a clean bill of health.",
        "Consumer optical heart-rate sensors are less accurate during movement, on darker skin tones at high intensity, and in cold conditions. Treat single readings sceptically and trends seriously.",
      ],
    },
    {
      heading: "Before you start training",
      body: [
        "If you are pregnant, have a heart condition, are recovering from surgery or illness, or have not exercised in a long time, speak to a clinician before starting any programme. Stop and get help if you get chest pain, unusual breathlessness, or feel faint.",
      ],
    },
  ],
};

const refunds: LegalDocument = {
  slug: "refunds",
  title: "Refunds and disputes",
  summary: "How to get your money back, and how long it takes.",
  updated: UPDATED,
  sections: [
    {
      heading: "Physical orders",
      body: [
        "You can cancel any physical order within 14 days of it arriving, for any reason, and send it back for a full refund including standard delivery. That is your right under the Consumer Contracts Regulations and this page does not shorten it.",
        "Send it back within 14 days of telling us. Return postage is yours unless the item was faulty or we sent the wrong thing, in which case it is ours.",
      ],
    },
    {
      heading: "Supplements",
      body: [
        "Sealed supplements can be returned unopened within 14 days. Once a seal is broken we cannot resell it, so opened tubs are not refundable unless there is something wrong with the product — in which case tell us and we will sort it out.",
      ],
    },
    {
      heading: "Faulty V1 bands",
      body: [
        "V1 comes with a two-year warranty. A fault in that window gets a repair or a replacement, our choice, at no cost to you. Water damage inside the rated depth counts as a fault; a cracked screen from a drop does not.",
      ],
    },
    {
      heading: "Pro",
      body: [
        "Cancel any time and you keep Pro until the end of the period you have paid for. We do not refund part-months as a rule, but if you were charged by mistake — a renewal you did not expect, a double charge — email us and we will refund it.",
      ],
    },
    {
      heading: "How long refunds take",
      body: [
        "We process refunds within 3 working days of receiving the return. Your bank then takes 5 to 10 working days to show it, which is out of our hands.",
      ],
    },
    {
      heading: "If you are unhappy",
      body: [
        "Email support@terrifit.com first — most things are quicker to fix directly than through your bank. If we cannot agree, you can still raise it with your card issuer.",
      ],
    },
  ],
};

const affiliate: LegalDocument = {
  slug: "affiliate",
  title: "Affiliate disclosure",
  summary: "Where we make money, and where somebody else does.",
  updated: UPDATED,
  sections: [
    {
      heading: "How Terrifit makes money",
      body: [
        "Three ways: Pro subscriptions, things we make and sell ourselves such as the V1 band and its straps, and a margin on partner products in the shop.",
      ],
    },
    {
      heading: "Partner products",
      body: [
        "Anything marked 'Partner' is made by somebody else and we earn on the sale. We only list things we would use, but you should know we have a commercial interest and read the label yourself.",
      ],
    },
    {
      heading: "Creators",
      body: [
        "Creators and coaches on Terrifit may earn a share when somebody buys through them. Where that applies it is shown on the thing itself, not buried here.",
      ],
    },
    {
      heading: "What we do not do",
      body: [
        "We do not take money to change a score, rank a product higher in search, or recommend something the data does not support. Recommendations in the shop come from what you have bought and what pairs with it, not from who paid most.",
      ],
    },
  ],
};

const cookies: LegalDocument = {
  slug: "cookies",
  title: "Cookies",
  summary: "There are two, and neither follows you anywhere.",
  updated: UPDATED,
  sections: [
    {
      heading: "What we set",
      body: ["Two cookies, both strictly necessary, which is why there is no banner asking you to accept them:"],
      list: [
        "A session cookie, so you stay signed in. It is httpOnly and SameSite=Lax, so a script on another site cannot read it.",
        "A locale preference, so the site opens in the language you chose.",
      ],
    },
    {
      heading: "What we do not set",
      body: [
        "No advertising cookies, no third-party trackers, no Facebook pixel, no Google Analytics. Our analytics are first-party events stored without your name attached and used to see which pages work.",
      ],
    },
    {
      heading: "Turning them off",
      body: [
        "You can clear or block cookies in your browser. Blocking the session cookie means you cannot stay signed in, which is the only thing it does.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = [privacy, terms, health, refunds, affiliate, cookies];

export function findLegal(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug);
}
