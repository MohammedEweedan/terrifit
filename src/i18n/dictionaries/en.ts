/**
 * The English dictionary is the source of truth for the site's copy.
 * Every other locale is type-checked against its shape, so a missing or
 * renamed key fails the build rather than shipping an empty string.
 */
export const en = {
  meta: {
    title: "Terrifit — wellness social app, the V1 band and tested supplements",
    description:
      "Terrifit is the social app for the wellness side of your life, the V1 band that tracks your sleep, recovery and training, and a shop of supplements and gear that have actually been tested.",
    ogAlt: "Terrifit — the wellness social app, the V1 band and the shop",
  },

  nav: {
    theMap: "The Map",
    checkIns: "Check-ins",
    creators: "For creators",
    safeguards: "Safeguards",
    join: "Join the waitlist",
    joinShort: "Join",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    language: "Language",
    skipToContent: "Skip to content",
  },

  hero: {
    eyebrow: "Wellness, wearables and fuel",
    headline: "Don’t do great, do terrific.",
    sub:
      "A social app for everything you do for your body, the V1 band that tracks how you are actually doing, and a shop of supplements and gear we use ourselves.",
    primaryCta: "Join the waitlist",
    secondaryCta: "Explore Terrifit",
    reassurance: "One email when your market opens. Nothing else.",
    liveLabel: "On the waitlist",
    countriesLabel: "Markets registered",
    creatorLabel: "Founding creator places left",
  },

  trustBar: {
    items: [
      { value: "Live", label: "A feed of people training the way you want to" },
      { value: "24/7", label: "Heart rate, sleep and recovery from the V1 band" },
      { value: "Tested", label: "Every supplement in the shop, batch by batch" },
      { value: "60%", label: "Of every sale goes to the creator who earned it" },
    ],
  },

  mapAnatomy: {
    eyebrow: "The Map",
    headline: "Not a PDF. A living plan.",
    body:
      "A Map is a structured transformation plan with a version history, required check-ins and a real coach attached. It adapts as you progress, and every change is recorded.",
    tabs: {
      training: {
        label: "Training",
        headline: "A schedule, not a spreadsheet",
        body:
          "Sessions, exercises, demonstration video and prescribed loads — logged as you complete them, so adherence is measured rather than claimed.",
      },
      nutrition: {
        label: "Nutrition",
        headline: "Targets with guidance behind them",
        body:
          "Daily targets, meal guidance and the reasoning behind them. Written by the coach who sold the Map, not generated from a calculator.",
      },
      checkins: {
        label: "Check-ins",
        headline: "The accountability loop",
        body:
          "Weekly submissions covering photos, measurements, recovery and adherence. Your coach responds, and the Map adjusts.",
      },
      supplements: {
        label: "Supplements",
        headline: "Disclosed, always",
        body:
          "Recommendations with tracked purchase links. Every affiliate relationship and creator commission is labelled on the page.",
      },
      milestones: {
        label: "Milestones",
        headline: "Progress with a shape",
        body:
          "Weekly objectives and milestones that make a twelve-week block legible from week one.",
      },
    },
    sample: {
      mapTitle: "12-Week Hypertrophy Base",
      coach: "Coach · verified S&C",
      week: "Week 5 of 12",
      adherence: "Adherence",
      nextSession: "Next session",
      sessionName: "Lower — Posterior chain",
      version: "v3 · updated 2 days ago",
      supportLine: "Includes weekly check-in review for 12 weeks",
    },
  },

  prototypes: {
    eyebrow: "Interface",
    headline: "A precision instrument you read at a glance.",
    body:
      "Large numerals, one clear hierarchy and almost no motion. Built for a dark gym floor and just as sharp in daylight.",
    tabs: {
      feed: { label: "Feed", caption: "Your daily header sits above the feed, not buried in a tab." },
      map: { label: "Map", caption: "Everything the Map contains, and exactly what support is included." },
      checkin: { label: "Check-in", caption: "Submit in under two minutes. Choose who sees it." },
      dashboard: { label: "Coach", caption: "Every client, ranked by who needs attention this week." },
      progress: { label: "Progress", caption: "Private by default. Explained, never diagnosed." },
    },
  },

  checkIns: {
    eyebrow: "Weekly check-in",
    headline: "Progress photos, on your terms.",
    body:
      "Photographs, weight, measurements, recovery, adherence and a written reflection. You decide who sees each check-in — and that decision is per check-in, not buried once in settings.",
    visibilityTitle: "Who can see this check-in",
    visibility: {
      private: { label: "Private", note: "Only you" },
      coach: { label: "Coach only", note: "You and the coach on this Map" },
      friends: { label: "Selected friends", note: "People you name, individually" },
      community: { label: "Community", note: "One community you belong to" },
      public: { label: "Public", note: "Anyone on Terrifit" },
    },
    faceBlurLabel: "Blur my face",
    faceBlurOn: "On",
    faceBlurOff: "Off",
    faceBlurNote:
      "Face detection runs with your explicit consent and can be switched off entirely.",
    warningTitle: "We will not pretend otherwise",
    warningBody:
      "Screenshots cannot be fully prevented on any platform. Blurring, private visibility and reporting reduce risk — they do not eliminate it. Share only what you are willing to have leave the app.",
    dragHint: "Drag to preview blur strength",
  },

  creators: {
    eyebrow: "For coaches, nutritionists and creators",
    headline: "Make your passion generate income.",
    body:
      "Followers are not a business. Terrifit gives you verified credentials, structured products to sell, and the tooling to actually monitor the people who bought them.",
    economicsTitle: "What you keep",
    economics: [
      { item: "Map sales", you: "60%", platform: "40% platform" },
      { item: "Paid subscriptions", you: "75%", platform: "25% platform" },
      { item: "Livestreams and tips", you: "75%", platform: "25% platform" },
      { item: "Paid communities", you: "Commission applies", platform: "Rate published before launch" },
      { item: "Affiliate products", you: "Your share of 10–15%", platform: "Brand-funded commission" },
    ],
    economicsFootnote:
      "Percentages are of gross revenue before payment processing, taxes and app-store fees, which are itemised separately on every payout statement.",
    toolsTitle: "The dashboard behind it",
    tools: [
      "Every customer on every Map, with live adherence",
      "Missing check-ins surfaced before the client goes quiet",
      "At-risk and inactive customers ranked by urgency",
      "Client questions in one queue, not five inboxes",
      "Required Map adjustments and upcoming milestones",
      "Revenue, refunds and aggregate Map effectiveness",
    ],
    obligationTitle: "The obligation, stated plainly",
    obligationBody:
      "If a Map includes ongoing support, you are expected to monitor those customers. The product page must state the level and duration of that support before anyone pays. We enforce this.",
    foundingTitle: "Founding creator benefits",
    founding: [
      "Reduced platform commission for your first twelve months",
      "Priority credential verification before public launch",
      "Featured placement in your market at launch",
      "Direct input into the creator dashboard roadmap",
      "Founding badge on your professional profile, permanently",
    ],
    cta: "Apply as a creator",
  },

  community: {
    eyebrow: "Communities and livestreams",
    headline: "Where the work gets shared.",
    body:
      "Topic communities, individual gyms, local groups, and communities built around a single Map or challenge. Public or private, free or paid, with real moderation.",
    items: [
      { title: "Communities", body: "Posts, discussions, resources, events, rankings and paid membership." },
      { title: "Livestreams", body: "Subscriber-only, ticketed or public. Chat, polls, tipping and replays." },
      { title: "Anonymity", body: "Operate under your real name, or a Reddit-style handle. Your choice, per account." },
      { title: "Consultations", body: "Bookable sessions with verified coaches and nutritionists." },
    ],
    phaseNote: "Communities ship with launch. Livestreams follow immediately after.",
  },

  progress: {
    eyebrow: "Progress and health",
    headline: "Your data. Private by default.",
    body:
      "Adherence, strength, cardio, sleep, recovery, activity, measurements and body composition — in one private dashboard, with weekly, bi-weekly and monthly comparisons.",
    metricsTitle: "Tracked",
    metrics: [
      "Map adherence and streaks",
      "Weight and body measurements",
      "Strength and cardio performance",
      "Sleep, recovery and resting heart rate",
      "Steps, activity and calories",
      "InBody-style composition",
    ],
    integrationsTitle: "Connects with",
    integrations: ["Apple Health", "Health Connect", "Supported wearables", "Manual logging"],
    disclaimerTitle: "Scores explain themselves",
    disclaimerBody:
      "Health scores and body-age estimates always show their inputs and their limitations. They are fitness signals, not medical diagnoses, and Terrifit will never present them as such.",
  },

  safeguards: {
    eyebrow: "Safeguards",
    headline: "The parts most fitness apps skip.",
    body: "Built in from the first release, not added after the first incident.",
    items: [
      {
        title: "Verified qualifications",
        body: "Coaches and nutritionists are verified before they can sell. Credentials are shown with their issuing body.",
      },
      {
        title: "Guidance, not medical advice",
        body: "A clear, enforced line between fitness coaching and medical advice — in product copy and in moderation policy.",
      },
      {
        title: "Health-data encryption",
        body: "Health data is encrypted and internal access is restricted and audited. Administrative actions are logged.",
      },
      {
        title: "Progress-photo protection",
        body: "Face blurring, per-check-in visibility, and active enforcement against harassment and sexualised misuse.",
      },
      {
        title: "Disclosed affiliates",
        body: "Every affiliate link, sponsorship and creator commission is disclosed at the point it appears.",
      },
      {
        title: "Export and deletion",
        body: "Take your data with you, or delete the account outright. Purchase records and Map versions are retained as required.",
      },
      {
        title: "Refunds and disputes",
        body: "Published refund policy, a real dispute process, and delayed payouts where a dispute is open.",
      },
      {
        title: "Age safeguards",
        body: "Age restrictions and parental safeguards applied per market, with no unsupported transformation claims anywhere.",
      },
    ],
  },

  waitlist: {
    eyebrow: "Waitlist",
    headline: "Claim your place.",
    body:
      "Tell us who you are and what you actually want. It decides what we build first, and which market opens first.",
    roleLabel: "I'm joining as",
    roles: {
      athlete: { label: "Athlete", note: "I want to train with a Map" },
      coach: { label: "Coach", note: "I train clients" },
      nutritionist: { label: "Nutritionist", note: "I advise on nutrition" },
      creator: { label: "Creator", note: "I build a fitness audience" },
      brand: { label: "Brand", note: "Supplements, apparel or equipment" },
    },
    fields: {
      name: "Name",
      namePlaceholder: "How you want to be addressed",
      email: "Email",
      emailPlaceholder: "you@example.com",
      country: "Market",
      countryPlaceholder: "Select your market",
      handle: "Main social handle",
      platform: "Platform",
      platformPlaceholder: "Where is your audience?",
      handlePlaceholder: "Username or profile link",
      audience: "Audience size",
      audiencePlaceholder: "Select a range",
      credentials: "Qualifications",
      credentialsPlaceholder: "Certifications, issuing body, years practising",
      brandName: "Brand name",
      brandNamePlaceholder: "Registered brand name",
      brandWebsite: "Website",
      brandWebsitePlaceholder: "https://",
      brandCategory: "Category",
      brandCategoryPlaceholder: "Select a category",
      features: "What matters most to you",
      featuresNote: "Pick as many as apply — this is the demand signal we build against.",
    },
    platforms: { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X", facebook: "Facebook", twitch: "Twitch", strava: "Strava", podcast: "Podcast", website: "Website", other: "Somewhere else" },
    audienceRanges: ["Under 1,000", "1,000 – 10,000", "10,000 – 100,000", "100,000 – 1M", "Over 1M"],
    brandCategories: ["Supplements", "Apparel", "Equipment", "Accessories", "Digital products"],
    features: {
      maps: "Buying or selling Maps",
      checkins: "Weekly check-ins and coach feedback",
      coaching: "Direct coach messaging",
      communities: "Communities",
      livestreams: "Livestreams and tipping",
      marketplace: "Affiliate product marketplace",
      health: "Health and wearable data",
      anonymity: "Anonymous participation",
    },
    consent:
      "I agree to be emailed about the Terrifit launch. I can unsubscribe at any time.",
    submit: "Join the waitlist",
    submitCreator: "Apply for a founding place",
    submitting: "Submitting…",
    success: {
      title: "You're in.",
      positionLabel: "Your position",
      referralTitle: "Move up the list",
      referralBody:
        "Every person who joins with your link moves you up ten places. Founding creator places are allocated from the top.",
      copy: "Copy link",
      copied: "Copied",
      share: "Share",
      roleNoteCreator:
        "Credential verification opens before public launch. We'll email you when your review slot is ready.",
      roleNoteBrand:
        "Brand identity and compliance checks are required before any product listing goes live. We'll be in touch with the requirements.",
    },
    errors: {
      required: "This field is required",
      email: "Enter a valid email address",
      consent: "Please accept to continue",
      duplicate: "That email is already on the list.",
      generic: "Something went wrong. Please try again.",
      network: "Could not reach the server. Check your connection and try again.",
    },
    referredBanner: "You were invited. Your friend moves up ten places when you join.",
  },

  faq: {
    eyebrow: "Questions",
    headline: "Before you ask.",
    items: [
      {
        q: "When does the V1 ship?",
        a: "We place the manufacturing order once 500 units are reserved, rather than promising a date we might miss. The counter on the band page is the real number, read straight from the order table. Your card is charged when you order and refunded in full, on request, any time before your band ships.",
      },
      {
        q: "What does it actually measure?",
        a: "Heart rate continuously, day and night. Heart-rate variability, blood oxygen, breathing rate, skin temperature and sleep staging. From those it builds your recovery, strain, sleep and T Score. Fifteen days on a charge, and no screen to check.",
      },
      {
        q: "How is this different from a Whoop or an Oura?",
        a: "They give you a number. Tap ours and you get the readings behind it, the baseline each was measured against, how much of the score it carried, and what the day was missing. Nobody else shows you their working, which means nobody else can be checked.",
      },
      {
        q: "Who manufactures the band?",
        a: "It is built on a medical-grade platform from a manufacturer that holds ISO 13485 and has shipped to more than a hundred countries, in Terrifit packaging with Terrifit strap colourways. The scoring is entirely ours. We would rather tell you that than have you work it out.",
      },
      {
        q: "Do I need a subscription?",
        a: "No. The morning read is free forever — recovery, strain, sleep and your fitness age — because an app that charges you to find out whether to train today is a bad app. Terrifit Pro is $7.99 a month, or $70 a year, for everything that needs weeks of history behind it: sleep quality, load, body battery, your T Score and the insights drawn across them.",
      },
      {
        q: "Does Terrifit sell supplements?",
        a: "Yes. Terrifuel is our own line, not an affiliate arrangement — we choose the formulas, we are liable for them, and every tub carries a batch number and third-party test. Where we do list a partner product, the commission is disclosed on the product itself.",
      },
      {
        q: "What is a Map?",
        a: "A training programme with a coach's name on it: blocks, weeks, sessions and exercises, with the loads adjusting to what you actually completed rather than what was planned. Two poor mornings in a row and the volume comes down on its own. Membership opens the whole library.",
      },
    ],
  },

  footer: {
    tagline: "Don’t do great, do terrific.",
    productTitle: "Product",
    product: ["The Map", "Weekly check-ins", "For creators", "Communities", "Progress"],
    companyTitle: "Company",
    company: ["About", "Careers", "Press", "Contact"],
    legalTitle: "Legal",
    legal: ["Privacy", "Terms", "Refunds and disputes", "Affiliate disclosure", "Cookies"],
    disclaimer:
      "Terrifit provides fitness guidance and coaching tools. It does not provide medical advice, diagnosis or treatment. Health scores and body-age estimates are estimates, not clinical measurements. Speak to a qualified clinician before beginning any programme.",
    rights: "All rights reserved.",
    languageLabel: "Language",
  },
  // Sample data for the prototype screens. Localised like everything else, so
  // the Arabic build renders genuinely mirrored screens rather than an
  // English screenshot inside an RTL page.
  mock: {
    date: "Wed 12 Mar",
    greeting: "Morning, Sara",
    streakUnit: "day streak",
    mapProgress: "Map progress",
    nextWorkout: "Next workout",
    nextWorkoutValue: "Lower · 17:30",
    checkInDue: "Check-in",
    checkInDueValue: "Due Sunday",
    recovery: "Recovery",

    feedAuthor: "Nadia K.",
    feedRole: "Verified coach",
    feedTime: "2h",
    feedCaption:
      "Week 8. Same number on the scale, different body. Full breakdown inside the Map.",
    feedTag: "Transformation",
    likes: "1,284",
    comments: "96",
    photoHidden: "Progress photo — visibility controlled by the athlete",

    mapPrice: "149 USD",
    mapRating: "4.8",
    mapReviews: "212 reviews",
    mapSections: ["Training schedule", "Nutrition targets", "Supplement guidance", "Weekly check-ins"],
    mapSupport: "Weekly check-in review · 12 weeks",
    mapCta: "Continue Map",

    checkInTitle: "Week 5 check-in",
    photoFront: "Front",
    photoSide: "Side",
    photoBack: "Back",
    weight: "Weight",
    weightValue: "78.4 kg",
    waist: "Waist",
    waistValue: "82 cm",
    sleep: "Sleep",
    sleepValue: "7h 10m",
    visibility: "Visible to",
    visibilityValue: "Coach only",
    submitCheckIn: "Submit check-in",

    dashboardTitle: "Needs attention",
    dashboardSub: "12 of 84 clients",
    clients: [
      { name: "Omar H.", map: "12-Week Base", status: "Missing check-in", tone: "bad", adherence: 41 },
      { name: "Lena R.", map: "Recomp 16", status: "At risk", tone: "warn", adherence: 63 },
      { name: "Yusuf A.", map: "12-Week Base", status: "On track", tone: "good", adherence: 94 },
      { name: "Maya T.", map: "Strength 8", status: "On track", tone: "good", adherence: 88 },
    ],
    revenue: "This month",
    revenueValue: "8,420 USD",
    revenueDelta: "+18%",

    progressTitle: "This week",
    ringAdherence: "Adherence",
    ringRecovery: "Recovery",
    ringSleep: "Sleep",
    comparisons: [
      { label: "Weight", value: "−3.2 kg" },
      { label: "Waist", value: "−4.0 cm" },
      { label: "Back squat", value: "+12.5 kg" },
      { label: "Resting HR", value: "−4 bpm" },
    ],
    vsLastMonth: "vs. last month",
    privateBadge: "Private",
  },
  // Extra labels used by the interactive Map anatomy panel.
  mapPanel: {
    sessionsThisWeek: "Sessions this week",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    nextCheckIn: "Next check-in",
    checkInItems: ["Photos", "Weight", "Measurements", "Recovery", "Reflection"],
    supplementName: "Creatine monohydrate",
    supplementDose: "5 g daily",
    disclosure: "Affiliate link · commission disclosed",
    milestones: [
      { week: "Week 4", label: "Baseline strength retest", done: true },
      { week: "Week 8", label: "Mid-point photos", done: false },
      { week: "Week 12", label: "Final retest and review", done: false },
    ],
  },
  // Short phrases for the scrolling strip under the hero.
  marquee: [
    "Verified coaches",
    "Structured Maps",
    "Weekly check-ins",
    "Coach feedback",
    "Private by default",
    "Face blurring",
    "Map version history",
    "Creator payouts",
    "Real accountability",
  ],

  statement: {
    lead: "Most fitness apps count your workouts.",
    emphasis: "Terrifit makes someone accountable for them.",
  },

  finalCta: {
    eyebrow: "Founding cohort",
    headline: "It closes when it's full.",
    sub: "Join the waitlist and tell us which market to open first. Founding creator places are allocated from the top of the list.",
    primary: "Join the waitlist",
    secondary: "Apply as a creator",
    note: "One email when your market opens. Nothing else.",
  },

  // Persona sites. Each lives on its own subdomain and carries its own
  // landing page and onboarding, but shares the design system and dictionary.
  personaCommon: {
    stepsTitle: "How onboarding works",
    applyCta: "Start your application",
    otherSites: "Terrifit for",
    sites: {
      main: "Athletes",
      creator: "Creators",
      coach: "Coaches",
      nutritionist: "Nutritionists",
      brand: "Brands",
    },
    backToMain: "Main site",
    whatYouKeep: "What you keep",
  },

  personas: {
    creator: {
      eyebrow: "Terrifit for creators",
      headline: "Turn an audience into a business you own.",
      sub: "Sell structured Maps, run paid communities and livestreams, and keep 60% of what you earn — with the tooling to actually support the people who bought.",
      points: [
        {
          title: "Sell structure, not shoutouts",
          body: "A Map is a real product: training, nutrition, check-ins, milestones and a version history your customers can see.",
        },
        {
          title: "Keep 60%",
          body: "40% platform commission on Map sales. Processing, taxes and app-store fees are itemised separately, never hidden inside it.",
        },
        {
          title: "Know who is slipping",
          body: "Adherence, missed check-ins and at-risk customers surfaced before they go quiet and churn.",
        },
      ],
      steps: [
        { title: "Apply", body: "Tell us about your audience, your market and what you want to sell." },
        { title: "Verify", body: "Identity, and where you coach, credentials. Reviewed before public launch." },
        { title: "Build your first Map", body: "We help you structure it, price it, and set the support you are committing to." },
      ],
    },

    coach: {
      eyebrow: "Terrifit for coaches",
      headline: "Stop running a coaching business out of a chat app.",
      sub: "Programmes, check-ins, feedback, payments and client monitoring in one place — with your credentials verified and visible on your profile.",
      points: [
        {
          title: "Every client, one dashboard",
          body: "Live adherence, missing check-ins and open questions, ranked by who actually needs you this week.",
        },
        {
          title: "Verified credentials",
          body: "Your certification and its issuing body shown on your profile. Verification happens before you can sell anything.",
        },
        {
          title: "Get paid properly",
          body: "One-off or subscription Maps, scheduled payouts, and a published refund and dispute policy behind them.",
        },
      ],
      steps: [
        { title: "Apply", body: "Tell us how you coach, and how many clients you currently carry." },
        { title: "Verify your certification", body: "Certification and issuing body, reviewed before public launch." },
        { title: "Move your clients across", body: "We help you convert existing programmes into Maps and import your roster." },
      ],
    },

    nutritionist: {
      eyebrow: "Terrifit for nutritionists",
      headline: "Nutrition guidance that survives contact with the week.",
      sub: "Targets, meal guidance and weekly check-ins tied to real measurements — with a clear, enforced line between guidance and medical advice.",
      points: [
        {
          title: "Targets with reasoning",
          body: "Daily targets and meal guidance you write, attached to the Map your client is actually training on.",
        },
        {
          title: "Measured, not guessed",
          body: "Weight, measurements, InBody-style composition and adherence, reviewed on a weekly cycle.",
        },
        {
          title: "A clear professional line",
          body: "Guidance is never presented as diagnosis. That boundary is enforced in the product and in moderation policy.",
        },
      ],
      steps: [
        { title: "Apply", body: "Tell us about your practice and where you are registered." },
        { title: "Verify your registration", body: "Registration body and qualifications reviewed before you can advise." },
        { title: "Publish your first plan", body: "A standalone nutrition Map, or nutrition attached to a coach's training Map." },
      ],
    },

    brand: {
      eyebrow: "Terrifit for brands",
      headline: "Reach people mid-transformation, not mid-scroll.",
      sub: "List products, work with verified creators, and pay commission only on completed sales. Checkout, fulfilment and the customer relationship stay yours.",
      points: [
        {
          title: "Affiliate, not marketplace",
          body: "Checkout stays on your site. Terrifit sends tracked traffic and takes a 10–15% commission on completed sales.",
        },
        {
          title: "Verified creators",
          body: "Work with coaches and nutritionists whose credentials have actually been checked, not self-declared.",
        },
        {
          title: "You keep control",
          body: "Inventory, shipping, customer support, returns and product claims remain entirely yours.",
        },
      ],
      steps: [
        { title: "Apply", body: "Tell us about your brand, your categories and the markets you ship to." },
        { title: "Identity and compliance checks", body: "Company verification and product-claim review before any listing goes live." },
        { title: "Connect tracking", body: "Tracked links, codes or server-to-server attribution — then go live with creators." },
      ],
      responsibilities:
        "Brands remain responsible for inventory, product compliance, shipping, customer support, returns and refunds, product claims and jurisdictional restrictions. Terrifit acts as an affiliate and does not manage any of them.",
    },
  },
  howItWorks: {
    eyebrow: "How it works",
    headline: "Four steps. Every week. Indefinitely.",
    body:
      "The loop is the product. Everything else on Terrifit exists to make these four steps happen reliably, and to prove they happened.",
    steps: [
      {
        title: "Find a coach you can actually check",
        body: "Credentials are verified before anyone can sell, and reviews come from people who finished the Map — not from people who bought it.",
      },
      {
        title: "Buy the Map",
        body: "One payment or a subscription. The product page states exactly what support is included and for how long, before you pay.",
      },
      {
        title: "Train it, and log it",
        body: "Sessions, loads and nutrition targets recorded as you complete them, so adherence is measured rather than claimed.",
      },
      {
        title: "Check in, and get adjusted",
        body: "Photos, measurements and a written reflection each week. Your coach responds, and the Map changes in response.",
      },
    ],
  },

  loop: {
    eyebrow: "The loop",
    headline: "Why it compounds.",
    body:
      "Each stage pays for the next. Discovery earns a purchase, the purchase creates accountability, accountability produces proof, and proof drives the next discovery. A feed alone does none of that.",
    nodes: [
      "Discover",
      "Follow",
      "Buy a Map",
      "Train",
      "Check in",
      "Get coached",
      "Share proof",
      "Build a streak",
    ],
  },

  audiences: {
    eyebrow: "Who it is for",
    headline: "Five sides of one market.",
    body:
      "Athletes, coaches, nutritionists, creators and brands each get their own home on Terrifit, with onboarding built for what they actually need to do.",
    visit: "Visit site",
    athleteBody:
      "Train on a Map built by someone whose credentials have been checked, and keep a private record of what actually changed.",
  },

  roadmap: {
    eyebrow: "Roadmap",
    headline: "What ships, and when.",
    body: "Market by market, in this order. The waitlist decides which market goes first.",
    phases: [
      {
        label: "Phase 1",
        title: "The core loop",
        items: [
          "Profiles and verified credentials",
          "Social feed and follows",
          "Maps: creation and purchase",
          "Private weekly check-ins",
          "Creator customer dashboards",
          "Coach–client messaging",
          "Payments and creator payouts",
        ],
      },
      {
        label: "Phase 2",
        title: "Community and scale",
        items: [
          "Topic communities",
          "Creator subscriptions",
          "Coach Pro tooling",
          "Affiliate marketplace",
          "Consultation booking",
          "Livestreams and tipping",
        ],
      },
      {
        label: "Phase 3",
        title: "Data and reach",
        items: [
          "Apple Health and Health Connect",
          "Advanced health analytics",
          "Recommendation algorithms",
          "Brand campaigns and placement",
          "Challenges and rankings",
          "International payout expansion",
        ],
      },
    ],
  },
};

export type Dictionary = typeof en;
