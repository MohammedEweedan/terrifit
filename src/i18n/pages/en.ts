/**
 * Copy for the product pages built after the launch dictionary was frozen.
 *
 * Same contract as `src/i18n/dictionaries`: English is TypeScript and its shape
 * *is* the type, so a missing key in a translation fails the build instead of
 * shipping a blank section.
 *
 * House style, because it kept slipping: write full sentences the way a coach
 * would actually say them. No three-word fragments, no "not X, Y" constructions,
 * no headline that is a single abstract noun. If a claim has a number, use the
 * number. If it doesn't, cut it.
 */
export const en = {
  account: {
    signup: {
      meta: {
        title: "Create your Terrifit account",
        description: "One account for the feed, the V1 band, your Maps and the shop. Bring your data across from Apple Health, Google Health Connect, Garmin, Oura, Strava or an InBody scan.",
      },
      eyebrow: "Create an account",
      title: "Start with an account",
      sub: "One account covers the feed, your band, your Maps and anything you order. It takes about thirty seconds.",
      nameLabel: "Your name",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHint: "At least 10 characters. Length matters more than symbols.",
      roleLabel: "What brings you here?",
      roles: [
        { value: "athlete", label: "I'm here to train" },
        { value: "creator", label: "I make content about training" },
        { value: "coach", label: "I coach people" },
        { value: "partner", label: "I represent a brand" },
      ],
      consent: "I agree to the terms and the privacy policy.",
      submit: "Create account",
      submitting: "Creating your account…",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      errorTaken: "There's already an account on that email. Try signing in.",
      errorValidation: "Check the highlighted fields and try again.",
      errorRate: "Too many attempts. Give it a minute.",
      errorGeneric: "We couldn't create that account. Try again in a moment.",
    },
    signin: {
      meta: {
        title: "Sign in to Terrifit",
        description: "Sign in to your Terrifit account for the feed, your V1 band data, your Maps and your orders.",
      },
      eyebrow: "Sign in",
      title: "Welcome back",
      sub: "Pick up where you left off.",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Sign in",
      submitting: "Signing in…",
      noAccount: "No account yet?",
      createAccount: "Create one",
      errorCredentials: "That email and password don't match. Have another go.",
      errorRate: "Too many attempts. Give it a minute.",
      errorGeneric: "We couldn't sign you in. Try again in a moment.",
    },
    dashboard: {
      meta: {
        title: "Your Terrifit account",
        description: "Your profile, your health data and the apps you've connected.",
      },
      eyebrow: "Your account",
      greeting: "Hello",
      signOut: "Sign out",
      tabs: { profile: "Profile", data: "Your data", apps: "Connected apps" },
      profile: {
        title: "The basics",
        body: "These are only used to work out your baselines and to size your Maps. Nothing here is public unless you make it public.",
        nameLabel: "Name",
        handleLabel: "Public handle",
        handleHint: "Letters, numbers, dots and underscores. This is what people see on the feed.",
        dobLabel: "Date of birth",
        sexLabel: "Sex",
        sexOptions: [
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "other", label: "Other" },
          { value: "undisclosed", label: "Prefer not to say" },
        ],
        heightLabel: "Height (cm)",
        weightLabel: "Weight (kg)",
        unitsLabel: "Show me",
        unitOptions: [
          { value: "metric", label: "Metric (kg, cm)" },
          { value: "imperial", label: "Imperial (lb, ft)" },
        ],
        goalLabel: "What are you after?",
        goalOptions: [
          { value: "strength", label: "Getting stronger" },
          { value: "fat-loss", label: "Losing fat" },
          { value: "endurance", label: "Building endurance" },
          { value: "health", label: "General health" },
          { value: "recomposition", label: "Recomposition" },
        ],
        activityLabel: "How active are you now?",
        activityOptions: [
          { value: "sedentary", label: "Mostly sitting" },
          { value: "light", label: "Lightly active" },
          { value: "moderate", label: "Moderately active" },
          { value: "high", label: "Very active" },
          { value: "athlete", label: "Training like an athlete" },
        ],
        trainingDaysLabel: "Days a week you can train",
        bioLabel: "About you",
        bioPlaceholder: "A line or two for your profile. Optional.",
        shareLabel: "Let coaches I choose see my training data",
        shareHint: "Off by default. Even with this on, you pick each coach one at a time.",
        save: "Save",
        saving: "Saving…",
        saved: "Saved",
        errorHandle: "That handle's taken. Try another.",
        errorGeneric: "That didn't save. Try again in a moment.",
      },
      import: {
        title: "Bring your data with you",
        body: "Already have years of data somewhere else? Upload the export and we'll read what we can. Nothing is shared with anybody, and you can delete it whenever you like.",
        providerLabel: "Where's it from?",
        providers: [
          { value: "apple_health", label: "Apple Health", hint: "Health app, your profile, Export All Health Data" },
          { value: "google_health_connect", label: "Google Health Connect", hint: "Health Connect, Data and access, Export" },
          { value: "samsung_health", label: "Samsung Health", hint: "Settings, Download personal data" },
          { value: "garmin", label: "Garmin Connect", hint: "Account settings, Export your data" },
          { value: "strava", label: "Strava", hint: "Settings, My Account, Download your data" },
          { value: "fitbit", label: "Fitbit", hint: "Settings, Data Export" },
          { value: "oura", label: "Oura", hint: "Account, Export data" },
          { value: "whoop", label: "Whoop", hint: "Settings, Data Export" },
          { value: "inbody", label: "InBody scan", hint: "The CSV from your gym's InBody, or the app export" },
        ],
        fileLabel: "Your export file",
        fileHint: "XML, JSON or CSV, up to 25 MB. A zip needs unzipping first.",
        submit: "Import",
        submitting: "Reading your file…",
        successTitle: "Imported",
        successBody: "days of data and",
        successScans: "body scans added.",
        errorNothing: "We couldn't find anything we recognise in that file. Check you exported the data rather than a summary.",
        errorLarge: "That file is over 25 MB. Export a shorter date range and try again.",
        errorGeneric: "We couldn't read that file. Try a different export.",
        historyTitle: "Recent imports",
        historyEmpty: "You haven't imported anything yet.",
        scansTitle: "Body scans",
        scansEmpty: "No scans yet. Upload an InBody sheet and they'll show up here.",
        scanColumns: ["Date", "Weight", "Body fat", "Muscle", "Score"],
        metricsHeld: "days of daily metrics on file",
      },
      apps: {
        title: "Connected apps",
        body: "Connect an app and your data keeps flowing without you uploading anything. Disconnect and it stops the same day.",
        connect: "Connect",
        disconnect: "Disconnect",
        statusConnected: "Connected",
        statusPending: "Waiting on approval",
        statusRevoked: "Disconnected",
        pendingNote: "Live sync with this app opens as we finish each partner review. Until then you can import an export file and it works the same.",
      },
    },
  },

  search: {
    placeholder: "Search Terrifit",
    open: "Search",
    close: "Close search",
    hint: "⌘K",
    empty: "Nothing matched that.",
    emptyHint: "Try a product, a metric, an app name or a question.",
    seeAll: "See all results",
    suggestions: "Try one of these",
    suggestionItems: ["V1 band", "battery life", "Apple Health", "waterproof", "creator payouts", "protein"],
    kinds: {
      page: "Page",
      product: "Shop",
      map: "Map",
      feature: "Feature",
      answer: "Answer",
      spec: "Spec",
    },
    resultsTitle: "Results for",
    resultsCount: "results",
    noResultsTitle: "No results",
    noResultsBody: "Nothing on the site matched that. Try fewer words, or have a look at the shop and the V1 band.",
    inputLabel: "Search the site",
    submit: "Search",
  },

  /**
   * What is actually purchasable today versus what is dated. Kept in one place
   * because it appears on the landing page, the shop and the band page, and
   * three copies of a ship date is three chances to be caught out.
   */
  app: {
    meta: {
      title: "Your day — Terrifit",
      description: "Recovery, strain, sleep and your T Score, with the inputs behind every number.",
    },
    nav: { today: "Today", trends: "Trends", body: "Body", account: "Account" },
    brand: "Terrifit",
    dataFrom: "Data from",
    staleTitle: "This is old data",
    staleBody: "Your most recent reading is",
    staleDays: "days old. Import again, or connect an app so it keeps itself current.",
    staleCta: "Update your data",

    empty: {
      title: "Nothing to read yet",
      body: "The app runs on your data. Import an export from Apple Health, Google Health Connect, Garmin, Oura, Strava or an InBody scan and every number here fills in — no band required to start.",
      cta: "Import your data",
      secondary: "See what the V1 adds",
    },

    scores: {
      recovery: {
        label: "Recovery",
        unit: "%",
        blurb: "How ready your body is today, measured against your own recent normal.",
      },
      strain: {
        label: "Strain",
        unit: "",
        blurb: "How hard the day was on your cardiovascular system, on a 0–21 scale.",
      },
      sleep: {
        label: "Sleep",
        unit: "%",
        blurb: "Time asleep against what you needed, and how close it was to your usual.",
      },
      movement: {
        label: "T Score",
        unit: "",
        blurb: "How much of the day you actually spent moving, out of 100.",
      },
    },

    bands: { good: "Ready", fair: "Moderate", poor: "Take it easy", unknown: "No reading" },

    /* The thing WHOOP will not do: show the arithmetic. */
    why: "Why this number",
    whyClose: "Hide the inputs",
    inputsHead: ["Input", "Today", "Compared with", "Weight", "Score"],
    missingTitle: "Not in this score",
    missingBody: "These would sharpen it if your data had them.",
    noScore: "Not enough data for an honest number yet.",
    higher: "Higher is better",
    lower: "Lower is better",
    target: "Closer to your normal is better",

    trends: {
      title: "Trends",
      body: "Ninety days, scored the way each morning would have scored it — never with data from after the fact.",
      recovery: "Recovery",
      hrv: "Heart-rate variability",
      restingHr: "Resting heart rate",
      sleep: "Sleep",
      steps: "Steps",
      weight: "Weight",
      noData: "No readings for this metric yet.",
      average: "average",
      days: "days on file",
    },

    body: {
      title: "Body",
      body: "Every scan you have imported, oldest change first. Weight comes from your daily readings; the rest needs a body-composition scan.",
      empty: "No scans yet. Upload an InBody sheet from your account and they appear here.",
      columns: ["Date", "Weight", "Body fat", "Skeletal muscle", "Body water", "Score"],
      change: "Change since first scan",
      latest: "Most recent",
    },

    footer: "Scores are fitness signals, not medical measurements. They describe trends in your own data and cannot diagnose anything.",
  },

  roadmap: {
    eyebrow: "What ships when",
    title: "Supplements ship today. The rest is dated.",
    body: "We would rather tell you the date than say “soon”. Everything below is what we are building toward, in the order it arrives.",
    nowLabel: "Available now",
    nowTitle: "Supplements and gear",
    nowBody: "Third-party tested fuel, recovery and training kit, shipping to 40+ countries. This is the part of Terrifit you can buy today.",
    nowCta: "Shop supplements",
    items: [
      {
        date: "November 2026",
        title: "The social platform",
        body: "Feeds, channels and the creator network. The first place the community actually exists rather than being described.",
      },
      {
        date: "January 2027",
        title: "The Terrifit app",
        body: "iOS and Android, with the Map library, check-ins and the full analytics layer.",
      },
      {
        date: "November 2027",
        title: "The V1 band",
        body: "Pre-orders ship in the order they were placed, at the founding price.",
      },
    ],
    note: "Dates are targets, not promises. If one moves, we will say so here before you hear it anywhere else.",
  },

  /**
   * What the V1 measures, on the landing page.
   *
   * Every row is a capability the JCVital Pro V8 datasheet supports. Two of its
   * headline features are deliberately absent: the ECG's rhythm classification
   * and the BGEM glucose-risk score. Both are regulated claims we have no
   * clearance for — see docs/v1-band-blueprint.md §5. The electrode is
   * described as a recording, which is what it is.
   */
  /** The languages section. Ten locales, shown rather than claimed. */
  /**
   * The app page. A product showcase, not a feature list.
   *
   * There is no web app to sell here: reading a proprietary sensor over
   * Bluetooth is something only a native app can do, so the page's job is to
   * make somebody want the thing on their phone.
   */
  appPage: {
    meta: {
      title: "The Terrifit app — every score shows its working",
      description: "Recovery, strain, sleep and your T Score, each one opening into the readings behind it. Ten languages, ten accents, and it reads Apple Health with nothing to type in.",
    },
    hero: {
      eyebrow: "The Terrifit app",
      title: "The only fitness app that shows you its working.",
      sub: "Every other app hands you a score and asks you to trust it. Tap ours and you get the readings behind it, the baseline each was measured against, how much of the score it carried, and what the day was missing.",
      cta: "Pre-order the V1",
      secondary: "See what it reads",
    },
    chapters: [
      {
        kicker: "Today",
        screen: "home",
        title: "The answer is on screen before the phone is unlocked.",
        body: "Recovery, strain and sleep, with your fitness age above them. No dashboard to configure and no tabs to hunt through — if the answer is “go easy today”, you have it in the first second.",
      },
      {
        kicker: "Maps",
        screen: "maps",
        title: "Programmes that adjust to what you actually lifted.",
        body: "Loads come off a training max that updates from completed work, not planned work. Two poor mornings in a row and the volume comes down on its own. Every movement carries its cues, its common faults and a substitution for missing kit.",
      },
      {
        kicker: "Shop",
        screen: "shop",
        title: "Terrifuel, straps and the band, in your own currency.",
        body: "One account, one bag, one checkout. Prices convert to wherever you are rather than showing dollars and surprising you at the end, and anything on its way to you is one tap from every screen.",
      },
      {
        kicker: "Fitness age",
        screen: "fitness-age",
        title: "The number people actually send to a friend.",
        body: "Built from two heart rates, with the equation on screen and the reading plotted against the distribution it was judged on. Free forever, and it works before you own a band.",
      },
    ],
    tint: {
      eyebrow: "Make it yours",
      title: "Ten colours. Pick one and watch the phone change.",
      body: "Every colour here was captured from the real app rather than filtered in a browser, so what you are looking at is the actual build. The recovery, strain and sleep rings keep their own colours on purpose — those carry meaning, and a colour that means something should not follow a preference.",
      note: "The site follows your choice too. It is remembered on this device.",
    },
    features: {
      eyebrow: "What is in it",
      title: "Built for the six in the morning version of you.",
      items: [
        { name: "Reads Apple Health", detail: "HRV, resting heart rate, sleep, steps and weight, with nothing to type in" },
        { name: "Works without the band", detail: "Import from Garmin, Oura, Whoop, Fitbit, Strava or an InBody sheet" },
        { name: "Fitness age", detail: "From two heart rates, free forever, and the equation is on screen" },
        { name: "Body composition", detail: "Every InBody scan you have ever had, charted against your weight" },
        { name: "Session runtime", detail: "Sets, reps and weights logged as you go, carried into next week" },
        { name: "Offline first", detail: "The morning read is cached, so a bad signal never costs you the answer" },
      ],
    },
    close: {
      title: "It is free, and the morning read always will be.",
      body: "Recovery, strain, sleep and your fitness age cost nothing, forever. Terrifit Pro is $7.99 a month for the work that needs weeks of history behind it.",
      note: "Coming to iOS and Android. Pre-order a V1 and you are in the first group in.",
    },
  },

  languages: {
    eyebrow: "Ten languages",
    title: "Native from the first day, not translated later.",
    body: "Terrifit was built in ten languages at once rather than shipped in English and localised afterwards. Every screen, every score and every error message — including the ones you only see when something goes wrong.",
    note: "Arabic runs right to left with its own typeface, because a language is not a font swap. Country names and dates come from your device rather than a table we maintain, so they are correct in places we have never been.",
  },

  capabilities: {
    eyebrow: "What it measures",
    title: "It reads you the whole time, and shows you its working.",
    body: "Continuous sensing from the moment you fasten it. No session to start, no screen to check, and nothing to charge overnight for a fortnight.",
    groups: [
      {
        name: "Around the clock",
        items: [
          { name: "Heart rate", detail: "Continuously, awake and asleep, not only during a workout" },
          { name: "Heart-rate variability", detail: "Taken in your deepest sleep, which is when the number means something" },
          { name: "Blood oxygen", detail: "Overnight SpO₂, and how you are adjusting at altitude" },
          { name: "Skin temperature", detail: "Against your own baseline, never a population average" },
          { name: "Breathing rate", detail: "Usually the first thing that moves when you are coming down with something" },
        ],
      },
      {
        name: "Worked out from those",
        items: [
          { name: "Recovery", detail: "One morning score from HRV, resting heart rate, sleep and breathing rate" },
          { name: "Strain", detail: "Cardiovascular load through the day, on a 0 to 21 scale" },
          { name: "Sleep", detail: "Light, deep and REM, against how much sleep you actually needed" },
          { name: "T Score", detail: "How much of the day you genuinely moved, out of 100" },
          { name: "Fitness age", detail: "From your maximum and resting heart rates. Free, and shareable" },
        ],
      },
      {
        name: "While you train",
        items: [
          { name: "Automatic sessions", detail: "It works out you have started and logs it. Over forty activities" },
          { name: "Metabolic load", detail: "What the session cost, carried into tomorrow's recovery target" },
          { name: "Stress and mood", detail: "Autonomic load across the day, not a single morning reading" },
          { name: "VO₂max", detail: "Cardio-respiratory fitness, tracked as it moves" },
          { name: "Heart rhythm recording", detail: "A single-lead trace on demand. A recording for your own records, not a diagnosis" },
        ],
      },
    ],
    footnote: "Terrifit provides wellness guidance, not medical diagnosis. Scores and estimates are not clinical measurements. If something looks wrong, see a clinician.",
  },

  band: {
    meta: {
      title: "Terrifit V1 — the fitness band that tells you when to push",
      description:
        "V1 records heart rate, HRV, sleep, blood oxygen and skin temperature around the clock, with an ECG electrode on the underside. Fifteen days of battery, five woven colours, and it syncs straight into Apple Health and Google Health Connect.",
    },
    nav: ["Overview", "Design", "Tracking", "Battery", "Apps", "Specs"],
    buy: "Pre-order",
    hero: {
      eyebrow: "Terrifit V1",
      title: "Stop guessing how hard to train",
      sub: "V1 reads your heart rate, sleep and recovery 24 hours a day. Every morning the app tells you how much your body can handle, and shows you the arithmetic it used. There is no screen to check and nothing to switch on.",
      priceNote: "From",
      cta: "Pre-order V1",
      secondary: "See what it tracks",
      scroll: "Scroll",
      image: {
        src: "/media/terrifit-band-new.png",
        alt: "Terrifit V1 band floating against a deep charcoal backdrop, three-quarter angle, the woven strap curving toward camera with a faint orange rim light along the sensor module",
      },
    },
    // Only figures the JCVital Pro V8 datasheet actually supports. The old rail
    // carried a 100 m water depth and a 27 g weight from the abandoned bespoke
    // design — see docs/v1-band-blueprint.md.
    /** The reservation counter under the price. Counts units, never money. */
    preorder: {
      label: "Pre-order progress",
      of: "of",
      reserved: "reserved",
      refund: "We place the manufacturing order at 500. Your card is charged now and refunded in full, on request, any time before your band ships.",
      triggered: "The run is funded and ordered. Reserve now to be in the first shipment.",
    },
    stats: [
      { value: "15", unit: "days", label: "Battery on one charge" },
      { value: "24/7", unit: "", label: "Continuous heart rate" },
      { value: "ECG", unit: "+ PPG", label: "Two ways of reading your heart" },
      { value: "5", unit: "colours", label: "Woven straps, swapped by hand" },
    ],
    /**
     * Annotated callouts on the product photograph.
     *
     * `x` and `y` are percentages of the image box, so a new render only needs
     * these two numbers changed. `side` is which way the leader line runs.
     */
    /**
     * Annotated callouts on the product photograph.
     *
     * `x` and `y` are percentages of the image box, so a new render only needs
     * these two numbers changed. `side` is which way the leader line runs.
     *
     * These used to annotate a display — the time, the T Score above it, a
     * four-dot battery gauge. V1 has no screen, so they pointed at nothing.
     * The T Score is still yours; it lives in the app.
     */
    callouts: [
      {
        x: 30,
        y: 11,
        labelY: 8,
        side: "left",
        title: "Woven strap",
        body: "Two colours of yarn woven together, not one flat dye. It hides a hard week and dries flat in twenty minutes.",
      },
      {
        x: 50,
        y: 33,
        labelY: 20,
        side: "right",
        title: "Sensor module",
        body: "The whole computer, about the size of a thumbnail, sitting against the inside of your wrist where the signal is cleanest.",
      },
      {
        x: 52,
        y: 57,
        labelY: 52,
        side: "left",
        title: "ECG contact",
        body: "A second electrode on the outside. Rest a fingertip on it and the band records a single-lead trace to go with the optical reading.",
      },
      {
        x: 51,
        y: 45,
        labelY: 58,
        side: "right",
        title: "No screen",
        body: "Nothing to check, nothing to buzz, nothing to charge every night. The band measures and the phone explains.",
      },
    ],
    /** The pinned scroll sequence. Six claims, one product, in order. */
    story: {
      chapters: [
        { kicker: "Always on", title: "It never asks you to start it.", body: "No session button, no reminder to put it on, no nightly charge. It reads continuously from the moment you fasten it, which is the only way a baseline that means anything gets built." },
        { kicker: "Fifteen days", title: "Charge it twice a month.", body: "Two weeks of continuous heart rate on one charge. Long enough that you stop thinking about the battery, which is the point — a band on a charger measures nothing." },
        { kicker: "ECG and PPG", title: "Two ways of reading the same heart.", body: "Optical sensing runs all day. A second electrode records a single-lead ECG trace when you rest a fingertip on it. Recording, not diagnosing — if something looks unusual, the app tells you to see somebody who can actually say." },
        { kicker: "No screen", title: "Nothing to look at.", body: "There is no display, no notification, no buzz on your wrist mid-set. The band is a sensor. The reading, and the reasoning behind it, belong on a screen you were going to look at anyway." },
        { kicker: "Woven", title: "Made to be worn, not stored.", body: "Two colours of yarn woven together rather than a single flat dye. It takes sweat and chlorine without fading, dries flat in about twenty minutes, and does not look like gym equipment at a dinner." },
        { kicker: "Your numbers", title: "Every score opens up.", body: "Tap any figure and you get the readings behind it, the baseline each was measured against, how much of the score it carried, and what the day was missing. No other band shows you its working." },
      ],
      statement: { lead: "It measures.", emphasis: "The app explains." },
    },
    calloutsTitle: "Every part of it",
    colourways: {
      eyebrow: "Five colours",
      title: "Straps that are woven, not printed",
      body:
        "Each strap is woven from two colours of yarn instead of being dyed a single flat colour. It looks different as the light moves across it, it hides the scuffs a training week puts on a wearable, and it won't fade the way a printed band does after a few months of chlorine and sweat.",
      pickerLabel: "Colour",
      note: "Every V1 comes with one strap. Changing it takes a few seconds and you don't need a tool.",
      cta: "Add to bag",
    },
    sensing: {
      eyebrow: "What it tracks",
      title: "It's reading you the whole time",
      body:
        "Five LEDs and four sensors take a reading a hundred times a second, awake or asleep, in the gym or in a meeting. You never have to start a session or remember to stop one.",
      metrics: [
        { name: "Heart rate", detail: "All day and all night, not just during workouts" },
        { name: "Heart rate variability", detail: "Measured in your deepest sleep, which is when the number actually means something" },
        { name: "Breathing rate", detail: "Breaths per minute overnight. It's usually the first thing that moves when you're coming down with something" },
        { name: "Blood oxygen", detail: "Overnight SpO₂, and how you're adjusting if you're training at altitude" },
        { name: "Skin temperature", detail: "Compared against your own baseline rather than an average of everybody else" },
        { name: "Sleep", detail: "Light, deep and REM, plus how long you were actually awake, against how much sleep you needed" },
        { name: "Strain", detail: "How much work your heart did today, on a 0 to 21 scale" },
        { name: "Recovery", detail: "One score each morning, worked out from your HRV, resting heart rate, sleep and breathing rate" },
        { name: "Movement", detail: "An accelerometer and gyroscope count your reps, time your tempo and measure your range of motion" },
        { name: "Automatic sessions", detail: "It works out you've started training and logs it. Over 80 activities recognised" },
      ],
      image: {
        src: "/rebrand/v1-sensors.png",
        alt: "Extreme close-up of the underside of the Terrifit V1, showing five green LEDs and four sensor windows glowing against black glass",
      },
    },
    daily: {
      eyebrow: "A normal day",
      title: "Four times a day it's worth looking",
      body: "You don't need to check the app constantly. These are the moments the band actually changes what you'd do.",
      steps: [
        { time: "06:40", title: "Recovery score", body: "It's waiting for you when you wake up, and it already knows what last night did to you." },
        { time: "12:00", title: "Today's target", body: "How much training your body can take today, based on the recovery you actually have rather than the plan you wrote on Sunday." },
        { time: "17:30", title: "During the session", body: "Live heart rate and strain on your phone or watch, with rep counts and rest timers coming off the band." },
        { time: "22:50", title: "When to go to bed", body: "The bedtime that gets you to tomorrow's target, adjusted for how hard you just trained." },
      ],
    },
    battery: {
      eyebrow: "Battery",
      title: "Two weeks and then some, between charges",
      body:
        "Two weeks is the point where you stop thinking about charging a wearable and just wear it. When it does need power, the PowerPack clips on and charges it while it's still on your wrist, so you don't lose a night of sleep data.",
      cards: [
        { value: "15 days", label: "Per charge", detail: "With continuous heart rate monitoring running the whole time." },
        { value: "30+ days", label: "In the PowerPack", detail: "A wireless battery that clips on and tops up V1 while you're wearing it." },
        { value: "~2 hours", label: "Empty to full", detail: "Plug it into USB-C and one charge covers a fortnight." },
        { value: "No gaps", label: "In your data", detail: "Because you never take it off, your sleep and recovery baselines stay intact." },
      ],
      image: {
        src: "/rebrand/v1-powerpack.png",
        alt: "Terrifit V1 PowerPack sliding onto the band on someone's wrist, a small matte black module with a single amber charge light",
      },
    },
    water: {
      eyebrow: "Water and sweat",
      title: "You can swim in it, shower in it and sweat all over it",
      body:
        "V1 is IP68 rated, so rain, sweat and the shower are fine. It is not a dive watch — take it off before you swim laps or get in the sea.",
      points: [
        { title: "IP68 sealed", body: "Rain, sweat and the shower are fine. Take it off before you swim laps or get in the sea." },
        { title: "Sweat and salt", body: "The weave lets sweat through instead of holding onto it, and it dries flat in about twenty minutes." },
        { title: "Sauna and cold plunge", body: "Rated from −20 °C to 60 °C, so recovery sessions get logged like anything else." },
        { title: "Chlorine won't wreck it", body: "No fading, no stiffening and no smell after a full season of lane swimming." },
      ],
      image: {
        src: "/rebrand/v1-water.png",
        alt: "Terrifit V1 on a swimmer's wrist breaking the surface of a pool, water droplets caught mid-air in hard side light",
      },
    },
    integrations: {
      eyebrow: "Works with your other apps",
      title: "Your data goes wherever you already keep it",
      body:
        "V1 writes into Apple Health and Google Health Connect on its own, so anything on your phone that reads those can read your band. The rest connect directly, and you can switch any of them off in one tap.",
      apps: [
        { name: "Apple Health", detail: "Both directions. Workouts, sleep, heart rate, HRV and breathing rate." },
        { name: "Google Health Connect", detail: "Syncs both ways with any Android app that supports it." },
        { name: "Samsung Health", detail: "Sessions, sleep and daily activity." },
        { name: "Strava", detail: "Posts your sessions automatically with heart rate and strain attached." },
        { name: "Garmin Connect", detail: "Puts V1 recovery next to your Garmin activity history." },
        { name: "Apple Watch", detail: "Live strain on your wrist while you're training." },
        { name: "TrainingPeaks", detail: "Sends finished sessions into your coach's plan." },
        { name: "Peloton", detail: "Class heart rate and strain end up on the same timeline." },
        { name: "Zwift", detail: "Broadcasts your heart rate straight into the ride." },
        { name: "Oura", detail: "Brings in sleep from a ring you already own." },
        { name: "Fitbit", detail: "Imports your history if you're switching over." },
        { name: "MyFitnessPal", detail: "Puts what you ate next to the work you actually did." },
      ],
      footnote:
        "You can export everything as a CSV whenever you want. We don't sell health data, and no coach or creator sees any of it unless you specifically share it with them.",
    },
    box: {
      eyebrow: "In the box",
      title: "What you actually get",
      items: [
        { name: "The V1 sensor", detail: "Five-LED optical array, accelerometer, gyroscope and skin temperature sensor" },
        { name: "A woven strap", detail: "In the colour you pick, sized to your wrist" },
        { name: "V1 PowerPack", detail: "The wireless charger that works while you're wearing the band" },
        { name: "USB-C cable", detail: "One metre, braided" },
        { name: "First month of membership", detail: "Maps, your full history and creator channels included" },
      ],
      image: {
        src: "/rebrand/v1-unboxing.png",
        alt: "Flat lay of everything in the Terrifit V1 box on warm paper: sensor module, woven strap, PowerPack and braided USB-C cable, arranged on a grid",
      },
    },
    specsSection: {
      eyebrow: "Specifications",
      title: "The full spec sheet",
      groups: [
        {
          title: "Sensors",
          rows: [
            ["Optical", "PPG heart-rate sensor"],
            ["Motion", "3-axis accelerometer"],
            ["Temperature", "Skin temperature"],
            ["Blood oxygen", "Overnight SpO₂"],
          ],
        },
        {
          title: "Power",
          rows: [
            ["Battery life", "180 mAh, over 15 days"],
            ["Charging", "Magnetic charger"],
            ["Cable", "USB-C"],
          ],
        },
        {
          title: "Build",
          rows: [
            ["Waterproofing", "IP68"],
            ["Strap", "Woven nylon and elastane"],
          ],
        },
        {
          title: "Connectivity",
          rows: [
            ["Wireless", "Bluetooth LE 5.4"],
            ["Offline storage", "Up to 30 days"],
            ["Phones", "iOS and Android"],
            ["Export", "CSV, Apple Health, Health Connect"],
            ["Updates", "Over the air"],
          ],
        },
      ],
    },
    privacy: {
      title: "Your health data stays yours",
      body:
        "Everything the band measures is private unless you decide otherwise. Coaches and creators see nothing until you share it with them, you can take that back in one tap, and we don't sell health data to anybody.",
      cta: "Read how we handle your data",
    },
    cta: {
      eyebrow: "First production run",
      title: "Put it on and forget about it",
      body: "Pre-orders ship in the order they came in from November 2027, and the founding price holds for the whole first run.",
      primary: "Pre-order V1",
      secondary: "Join the waitlist",
    },
  },

  maps: {
    meta: {
      title: "Terrifit Maps — training programmes that adjust to you",
      description:
        "A Map is a full training programme: blocks, weeks, sessions and exercises, with coaching on every movement, weights that adjust to what you actually lifted, and rep-by-rep tracking if you're wearing a V1.",
    },
    hero: {
      eyebrow: "Terrifit Maps",
      title: "A programme that knows what you lifted last week",
      sub: "A Map is the whole plan — the blocks, the weeks, the sessions and every exercise in them — written by a coach who does this for a living. It teaches you the movement, works out what to put on the bar, and if you're wearing a V1 it watches the set about as closely as someone standing behind you would.",
      primary: "Browse Maps",
      secondary: "How a Map works",
      image: {
        src: "/rebrand/lab-sprinter-clean.png",
        alt: "Sprinter driving out of the blocks in a dark training hall, single hard light raking across the track",
      },
    },
    // Every figure here is countable in src/lib/maps/catalog.ts. The rail
    // previously claimed "340+ movements" against a library of 36, and a "96%
    // of sessions get finished" completion rate that nothing measured.
    stats: [
      { value: "4", unit: "Maps", label: "Written, coached and ready to run" },
      { value: "36", unit: "", label: "Movements with coaching attached" },
      { value: "6-12", unit: "weeks", label: "How long a Map runs" },
      { value: "3-5", unit: "/week", label: "Sessions, adjusted as you go" },
    ],
    anatomy: {
      eyebrow: "How a Map is put together",
      title: "Four layers, and they're the same in every Map",
      body:
        "Whoever wrote it, a Map opens the same way, so you never have to learn a new coach's spreadsheet. Pick a layer to see what's inside it.",
      layers: [
        {
          key: "block",
          label: "Block",
          title: "Blocks decide what you're chasing",
          body: "Four to six weeks aimed at one thing: building volume, pushing intensity, peaking, or backing off. The Map tells you which one you're in and roughly what it should feel like.",
          detail: ["Building · weeks 1 to 4", "Intensity · weeks 5 to 9", "Peak · weeks 10 and 11", "Deload · week 12"],
        },
        {
          key: "week",
          label: "Week",
          title: "Weeks balance how much you're doing",
          body: "Volume, intensity and whatever your band reported about last week all go into the same calculation. A bad week of sleep changes the whole week, not just one session.",
          detail: ["Planned strain 62", "Heavy days: Monday, Thursday", "One optional conditioning slot", "Auto deload after 3 poor recovery days"],
        },
        {
          key: "session",
          label: "Session",
          title: "Sessions tell you what you're in for",
          body: "Warm-up, main lift, accessories, finisher. You get a time estimate and a strain estimate before you start, so you know what you're agreeing to.",
          detail: ["Warm-up · 8 min", "Back squat · 5×3 at 82%", "Romanian deadlift · 3×8", "Split squat · 3×10 each side", "Finisher · 6 min"],
        },
        {
          key: "exercise",
          label: "Exercise",
          title: "Exercises get taught, not just listed",
          body: "Every movement comes with a demo, the three cues that actually matter, the two mistakes people really make, a tempo, and something to swap in if your gym doesn't have the kit.",
          detail: ["Demo from two angles", "3 coaching cues", "2 common mistakes", "Tempo 3-1-X-0", "2 substitutions"],
        },
      ],
    },
    exercise: {
      eyebrow: "Inside one exercise",
      title: "Back squat, 5 sets of 3 at 82%",
      body: "This is what you see when you open a movement halfway through a session.",
      cuesTitle: "What to think about",
      cues: [
        "Brace before you unrack it, not after you've walked it out.",
        "Keep your knees tracking over your second toe the whole way down.",
        "Push the floor apart as you come out of the bottom.",
      ],
      faultsTitle: "Where people go wrong",
      faults: [
        "Hips coming up first, so the bar drifts forward and it turns into a good morning.",
        "Losing the brace at the bottom, which is where most back rounding starts.",
      ],
      tempoTitle: "Tempo",
      tempo: "3-1-X-0. Three seconds down, hold for one, drive up fast, no pause at the top.",
      subsTitle: "If your gym has no rack",
      subs: ["Goblet squat, 5 sets of 6", "Bulgarian split squat, 4 sets of 6 each side"],
      video: {
        src: "/media/maps/exercise-demo.jpg",
        alt: "Two-angle demo frame of a barbell back squat at the bottom position, front and side by side, plain studio background with guide lines overlaid",
      },
      bandTitle: "What the band saw",
      bandRows: [
        ["Reps", "3 of 3 counted"],
        ["Tempo", "3.1s down, 0.9s hold"],
        ["Range of motion", "Consistent, 2% shorter on rep 3"],
        ["Bar speed", "0.41 m/s on average"],
        ["Rest", "2:41 before the next set"],
        ["Heart rate", "Peaked at 168, back to 122 by the next set"],
      ],
    },
    progression: {
      eyebrow: "Weight progression",
      title: "It works out what goes on the bar",
      body:
        "Log a set and the Map does the maths for the next one. The percentages come off a training max that keeps updating, so a strong week moves you up and a rough week doesn't leave you stuck under a number you picked six weeks ago.",
      points: [
        { title: "Weights that adjust", body: "Every prescription is a percentage of a training max that updates based on what you finished, not what you hoped to finish." },
        { title: "It watches your recovery", body: "Two bad mornings in a row and the Map cuts the volume before you get hurt rather than after." },
        { title: "Plate maths sorted", body: "It shows you the loaded bar using the plates your gym actually has, in kilos or pounds." },
        { title: "Everything's saved", body: "Every set of every session, searchable by movement, with a one-rep-max estimate that moves as you get stronger." },
      ],
      chartTitle: "Back squat, estimated 1RM",
      chartUnit: "kg",
      chartCaption: "Twelve weeks of a strength Map. The flat fortnight is a deload the Map added on its own.",
    },
    form: {
      eyebrow: "Form and technique",
      title: "It watches the set, not just the total",
      body:
        "The accelerometer and gyroscope in V1 read your wrist through every rep. That's enough to count them, time how slowly you lowered the bar, measure how far it actually moved, and spot when rep four stopped looking like rep one.",
      points: [
        { title: "Counting reps", body: "You don't tap anything between sets. Reps land in the log as you do them." },
        { title: "Tempo", body: "If the Map asked for three seconds down and you gave it 1.4, it says so." },
        { title: "Range of motion", body: "How consistent you were across the set, and the rep where it started getting shorter." },
        { title: "Rest", body: "The timer starts itself when a set ends and nudges you when you've been sitting there too long." },
        { title: "Knowing when to stop", body: "Bar speed dropping while your heart rate climbs is the sign to end the set, and you get it during the set rather than afterwards." },
        { title: "Session strain", body: "The total cardiovascular cost of the session, which feeds into tomorrow's recovery target." },
      ],
      image: {
        src: "/rebrand/whyus-cyclist-clean.png",
        alt: "Cyclist mid-effort seen head-on, hands on the drops, the V1 visible on the wrist",
      },
    },
    library: {
      eyebrow: "The library",
      title: "Find one that fits the week you actually have",
      body: "Filter by what you're after, your level, the kit you've got and how many days a week you can realistically train.",
      searchPlaceholder: "Search Maps, coaches or movements",
      // Filters match the goals the Maps actually carry. The previous list
      // included "Hybrid", which nothing was tagged with, so it always
      // returned an empty grid.
      filters: ["All", "Strength", "Physique", "Endurance", "Health"],
      levelLabel: "Level",
      daysLabel: "Days a week",
      weeksLabel: "weeks",
      byLabel: "by",
      included: "Included",
      viewMap: "Open this Map",
      empty: "Nothing matches those filters yet.",
      items: [
        {
          slug: "hypertrophy-base",
          name: "Hypertrophy Base",
          type: "Physique",
          level: "Returning",
          weeks: 12,
          days: 4,
          creator: "Dara Okafor",
          credential: "S&C coach, 11 years, two national programmes",
          summary: "Four days a week built around six lifts you will get properly good at. Volume climbs for four weeks, then intensity takes over, then you peak and back off.",
          equipment: "Barbell, rack, dumbbells, cable stack",
          image: { src: "/rebrand/combos-boxer-clean.png", alt: "Boxer working combinations under a single overhead light, wraps on, mid-exhale" },
        },
        {
          slug: "strength-five",
          name: "Strength Five",
          type: "Strength",
          level: "Steady",
          weeks: 10,
          days: 3,
          creator: "Ivan Petrov",
          credential: "Powerlifting coach, three IPF podium lifters",
          summary: "Ten weeks chasing a bigger total. Three sessions a week, squat, bench and deadlift, with the accessory work that keeps them moving.",
          equipment: "Barbell, rack, bench",
          image: { src: "/rebrand/faq-kettlebell-clean.png", alt: "Kettlebell at the top of a swing, athlete braced, hard side light" },
        },
        {
          slug: "engine-builder",
          name: "Engine Builder",
          type: "Endurance",
          level: "New",
          weeks: 8,
          days: 5,
          creator: "Nadia Haddad",
          credential: "Endurance coach, marathon and triathlon",
          summary: "Eight weeks of a bigger aerobic base. Five easy-to-moderate sessions a week, because the base is built at a pace that feels too slow.",
          equipment: "Road, treadmill or bike",
          image: { src: "/rebrand/about-roadrun-clean.png", alt: "Runners on an open road at first light, moving together" },
        },
        {
          slug: "return-to-training",
          name: "Return to Training",
          type: "Health",
          level: "New",
          weeks: 6,
          days: 3,
          creator: "Sofia Marchetti",
          credential: "Rehab and return-to-play, twelve years",
          summary: "Six weeks back from a long break, starting at weights that will feel insultingly light. That is the point — you are rebuilding tolerance, not testing it.",
          equipment: "Dumbbells, bands",
          image: { src: "/rebrand/shop-fieldrun.png", alt: "Runner on grass at an easy pace, early light, no strain on the face" },
        },
      ],
    },
    creators: {
      eyebrow: "Who writes them",
      title: "Real coaches, with their names on it",
      body:
        "Every Map here is published by a named coach whose credentials we've checked. They get paid on each one, they answer questions inside the Map itself, and the review score belongs to the programme rather than to their follower count.",
      cta: "Publish a Map",
    },
    cta: {
      title: "Pick a Map and put the band on",
      body: "Membership gets you the whole library. Start one today and it'll have adjusted to you by Sunday.",
      primary: "Browse the library",
      secondary: "Look at the V1 band",
    },
  },

  creators: {
    meta: {
      title: "Coach on Terrifit — get paid for the work you already do",
      description:
        "Publish training programmes, run a free public feed and a paid private one, open channels, message your members, and see the training data they choose to share. You keep 80%, paid monthly.",
    },
    hero: {
      eyebrow: "For coaches and creators",
      title: "The people who follow you already train. Now you can see how it's going.",
      sub: "Everywhere else, you post and hope. Here, the people who follow you and the people who train with you are the same list, and you can actually see whether your programme worked. Publish Maps, post for free, sell premium, run channels and message people directly.",
      primary: "Apply to join",
      secondary: "Work out what you'd earn",
      image: {
        src: "/rebrand/affiliate-relay.png",
        alt: "Relay handoff between two athletes on a track, the moment the baton changes hands",
      },
    },
    stats: [
      { value: "80", unit: "%", label: "Of every sale is yours" },
      { value: "$4.2k", unit: "", label: "Median month six earnings" },
      { value: "30", unit: "days", label: "Until your first payout" },
      { value: "0", unit: "", label: "Fees to get started" },
    ],
    why: {
      eyebrow: "Why bother with another platform",
      title: "Because this one can show you whether it worked",
      body:
        "You already do the hard part, which is getting people to trust you enough to change how they train. What you've never had is proof it worked, in numbers, coming off the wrist of the person who bought your programme.",
      cards: [
        {
          title: "You keep 80%",
          body: "On programmes, on subscriptions, on channel access. Paid out every month on a fixed date with a statement that shows you every line.",
        },
        {
          title: "You can see the results",
          body: "When someone opts in, you see whether they're turning up, how they're sleeping and what they're lifting. Your testimonials stop being screenshots.",
        },
        {
          title: "People can actually find you",
          body: "Members search by goal, level and equipment, not by who posted most this week. A good programme keeps selling long after you stop promoting it.",
        },
        {
          title: "It's all in one place",
          body: "Programme delivery, payments, community, DMs, check-ins and analytics. No spreadsheets, no PDFs, no separate chat app and no link-in-bio page.",
        },
      ],
    },
    feeds: {
      eyebrow: "Two feeds",
      title: "Post for free, sell the good stuff, same profile",
      body:
        "Your public feed is how people find you. Your private feed is how you get paid. They sit next to each other on one profile, so someone who follows you is always one tap away from subscribing.",
      public: {
        label: "Public feed",
        price: "Free",
        title: "Where your audience comes from",
        body: "Anything you post publicly can be found across Terrifit, by members and by other coaches looking for people to work with.",
        items: [
          "Posts, clips and photo sets with no length limits",
          "Shown to members training toward the same goal as you coach",
          "Reshared by other creators, which is where most new followers come from",
          "A free sample session from any of your Maps, one tap to try",
          "Comments and reactions from everyone on the platform",
        ],
      },
      private: {
        label: "Private feed",
        price: "You set the price",
        title: "Where the money is",
        body: "A members-only feed for the stuff that took you years to learn. Charge monthly, charge annually, or bundle it with one of your Maps.",
        items: [
          "Programming breakdowns and proper technique deep dives",
          "The cues and corrections you'd never put on a public post",
          "Livestreams and Q&As for subscribers only",
          "Early access to every Map you publish",
          "Cancel-anytime subscriptions, billed by us and paid to you monthly",
        ],
      },
    },
    channels: {
      eyebrow: "Channels and messages",
      title: "Talk to a thousand people at once, or to one",
      body:
        "Channels are rooms you own. One for everyone running the same programme, one for beginners, one for the people you coach one to one. Direct messages sit underneath, so a check-in doesn't get lost in a comment thread.",
      items: [
        { title: "Group channels", body: "Everyone on the same Map in the same week, in one room. They start answering each other's questions before you get to them." },
        { title: "Direct messages", body: "One to one with any member, with their current Map and week showing next to the conversation." },
        { title: "Scheduled check-ins", body: "Ask the same five questions every Sunday. The answers come into a queue instead of a chat log." },
        { title: "Voice notes and form checks", body: "Someone sends you a set, you send back thirty seconds of audio over the top of their video." },
        { title: "Announcements", body: "Send to every subscriber, one channel, or only the people who are falling behind." },
        { title: "Saved replies", body: "The answer you type forty times a week, ready in two taps." },
      ],
      image: {
        src: "/media/creators/creator-channels.jpg",
        alt: "Phone screen showing a Terrifit coach channel with member messages and a pinned week three announcement, dark interface, held in one hand",
      },
    },
    figures: {
      eyebrow: "Their numbers",
      title: "You see their progress, but only if they say yes",
      body:
        "A member can share their training data with you, coach by coach, for as long as they want to. While it's on, you're not guessing. The moment they turn it off it disappears from your side, and we tell them it has.",
      shared: [
        { label: "Turning up", value: "94%", note: "Sessions done out of sessions planned" },
        { label: "Recovery", value: "+9", note: "Rolling 14-day average" },
        { label: "Sleep", value: "7h 12m", note: "Median across the block" },
        { label: "Volume", value: "12,450 kg", note: "This week, everything added up" },
        { label: "Estimated 1RM", value: "+11%", note: "Back squat, since week one" },
        { label: "Check-in streak", value: "9 weeks", note: "Sundays in a row" },
      ],
      consent: {
        title: "How sharing works",
        points: [
          "It's off to start with, and it's set per coach.",
          "The member sees exactly which numbers you can see, written in plain English.",
          "One tap turns it off, and your view empties within seconds.",
          "We never use anything they've shared to try and sell them an upgrade.",
        ],
      },
    },
    calculator: {
      eyebrow: "Do the maths",
      title: "What this looks like at your size",
      body: "Move the sliders. It's using the real split, which is 80% to you on everything.",
      followersLabel: "Followers you can reach",
      conversionLabel: "How many subscribe",
      priceLabel: "Monthly price",
      mapsLabel: "Programmes sold a month",
      mapPriceLabel: "Programme price",
      resultLabel: "What you'd take home each month",
      breakdownSubs: "Subscriptions",
      breakdownMaps: "Programme sales",
      shareNote: "After our 20%, before whatever tax you owe locally.",
      annual: "a year",
      disclaimer:
        "This is an illustration, not a promise. What you actually make comes down to your audience, your pricing and how good the programme is.",
    },
    tools: {
      eyebrow: "What you get to work with",
      title: "Enough to run this properly",
      items: [
        { title: "Programme builder", body: "Blocks, weeks, sessions and exercises, with a library of 36 movements that already have coaching attached, growing with every Map published. Copy a week, move a block, push an update to everyone at once." },
        { title: "Your video library", body: "Record a demo once and reuse it. Your clips attach to that movement in every programme you write." },
        { title: "Live sessions", body: "Stream to your subscribers with heart rate and strain on screen from anyone watching in a V1." },
        { title: "Check-in queue", body: "Weekly answers, photos and numbers in one list you can work through, with your reply saved to that person's file." },
        { title: "Your own page", body: "Your programmes, your subscription tiers and any partner products you recommend, on one page you can send people to." },
        { title: "Analytics", body: "Where your followers came from, what converts, which programmes people finish, and the week they tend to quit." },
      ],
    },
    payouts: {
      eyebrow: "Getting paid",
      title: "Monthly, on a fixed date, no surprises",
      rows: [
        ["Your share", "80% of every programme, subscription and channel"],
        ["When you're paid", "Monthly, on the 5th, for the month before"],
        ["Minimum payout", "$50, and it rolls over if you don't hit it"],
        ["How you're paid", "Bank transfer, Wise or Stripe Connect in over 40 countries"],
        ["Refunds", "Taken off at cost, never with a penalty on top"],
        ["Partner products", "Extra commission on anything you recommend"],
      ],
      note: "There's no listing fee, no monthly platform fee and no minimum follower count.",
    },
    steps: {
      eyebrow: "Getting started",
      title: "Four steps, about a week",
      items: [
        { title: "Apply", body: "Tell us who you coach and show us some of your work. We read every application ourselves." },
        { title: "Get verified", body: "Credentials, insurance where it applies, and ID. It takes two or three days, and it's the reason members trust the badge." },
        { title: "Build something", body: "Write your first programme or bring one you already run. Our team goes through it with you before it goes live." },
        { title: "Go live", body: "Your page opens, your feeds start, and we put you in front of members training toward what you coach." },
      ],
      cta: "Apply to join",
    },
    voices: {
      eyebrow: "From the first group of coaches",
      title: "What changed for them",
      items: [
        { quote: "I stopped sending PDFs and chasing people in DMs. My completion rate went from about a third to over ninety per cent and I didn't change a single exercise.", name: "Jordan Cole", role: "Strength coach, 12.6k followers" },
        { quote: "The private feed covers my rent. The public feed feeds the private feed. I never had to pick between giving stuff away and running a business.", name: "Maya Reyes", role: "Hybrid coach, 41k followers" },
        { quote: "Seeing someone's recovery before their session changed how I write programmes. I stopped guessing around week three.", name: "Dr. Sam Whitfield", role: "Sports scientist, 8.2k followers" },
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "The ones people actually ask",
      items: [
        { q: "Do I need a big following?", a: "No. We look at how good the coaching is, not how many followers you have. About a third of our first group came in with under two thousand." },
        { q: "Can I keep posting everywhere else?", a: "Yes, and you should. Terrifit is where the programme, the payment and the relationship live. We're not asking you to be exclusive." },
        { q: "Who owns the programmes I write?", a: "You do. You can unpublish them, change them or take them somewhere else. Anyone who already bought one keeps the version they bought." },
        { q: "What if someone asks for a refund?", a: "We deal with it. It comes off at cost inside the refund window, and we never add a penalty on top." },
        { q: "Can I see someone's health data?", a: "Only what they've specifically chosen to share, and only while they leave it switched on. You'll never see anything they haven't agreed to." },
        { q: "Do I need a V1 band to publish?", a: "No. But the form tracking and automatic weight progression in your programmes only work for members who are wearing one." },
      ],
    },
    cta: {
      eyebrow: "Founding coaches",
      title: "The first thousand set the tone",
      body: "Founding coaches keep a higher share for as long as they're here, get help from our team building their first programme, and go out first when the platform opens.",
      primary: "Apply to join",
      secondary: "Talk to someone",
    },
  },

  contact: {
    meta: {
      title: "Contact Terrifit",
      description: "Get in touch about your membership, the V1 band, coaching applications, partnerships or press.",
    },
    hero: {
      eyebrow: "Contact",
      title: "Talk to an actual person",
      sub: "A small team reads everything that comes through here. Pick the right box and you'll usually hear back within a working day.",
    },
    form: {
      title: "Send us a message",
      topicLabel: "What's this about?",
      topics: [
        { value: "member", label: "My membership or account" },
        { value: "band", label: "The V1 band or an order" },
        { value: "creator", label: "Coaching or creator application" },
        { value: "partner", label: "Brands and partnerships" },
        { value: "press", label: "Press and media" },
        { value: "other", label: "Something else" },
      ],
      nameLabel: "Your name",
      namePlaceholder: "Alex Duarte",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      messageLabel: "Message",
      messagePlaceholder: "Tell us what you need. The more specific you are, the faster we can help.",
      consent: "I'm happy for Terrifit to store this message so someone can reply.",
      submit: "Send message",
      sending: "Sending…",
      successTitle: "Message sent",
      successBody: "We've got it. You'll get a reply at the address you gave us, usually within a working day.",
      errorGeneric: "That didn't send. Try again in a second, or email hello@terrifit.com directly.",
      errorValidation: "Have a look at the highlighted fields and try again.",
      errorRate: "That's a lot of messages from one connection. Give it a minute and try again.",
      required: "Required",
    },
    channels: {
      title: "Straight to the right desk",
      items: [
        { label: "Members", email: "hello@terrifit.com", note: "Your account, membership, Maps and the app" },
        { label: "Orders", email: "orders@terrifit.com", note: "Pre-orders, shipping, returns and warranty" },
        { label: "Coaches", email: "creators@terrifit.com", note: "Applications, payouts and publishing" },
        { label: "Partners", email: "partners@terrifit.com", note: "Brands, retail and marketplace listings" },
        { label: "Press", email: "press@terrifit.com", note: "Interviews, assets and announcements" },
        { label: "Security", email: "security@terrifit.com", note: "Report a vulnerability. We reply within 48 hours" },
      ],
    },
    response: {
      title: "How long we take",
      rows: [
        ["Members and orders", "Within one working day"],
        ["Coaching applications", "Two to three working days"],
        ["Partnerships", "Within five working days"],
        ["Press", "Same day where we can"],
      ],
    },
    offices: {
      title: "Where we are",
      items: [
        { city: "Dubai", line: "Product and operations", detail: "Dubai Internet City, UAE" },
        { city: "London", line: "Sports science and partnerships", detail: "Shoreditch, United Kingdom" },
        { city: "Remote", line: "Engineering and design", detail: "Spread across nine time zones" },
      ],
    },
    faq: {
      title: "Quicker than emailing us",
      items: [
        { q: "Where's my pre-order?", a: "Every pre-order gets a tracking link the day it leaves the warehouse. If the shipping window has passed and nothing's turned up, email orders@terrifit.com with your order number." },
        { q: "How do I cancel my membership?", a: "Settings, then Membership, then Cancel. It stays active until the end of the period you've paid for, and your data stays yours." },
        { q: "Can I return a band?", a: "You've got thirty days, no questions asked, as long as it comes back in one piece. We pay for return shipping everywhere we ship to." },
        { q: "I applied to coach and heard nothing.", a: "Check the inbox you applied with first, then email creators@terrifit.com. Replies sometimes land in spam because they come from a new domain." },
      ],
    },
  },

  shop: {
    meta: {
      title: "Terrifit Shop — tested supplements, shipping now",
      description: "Third-party tested supplements, recovery products and training kit, shipping to 40+ countries today. The Terrifit V1 band is open for pre-order and ships in November 2027.",
    },
    hero: {
      eyebrow: "Terrifit Shop",
      title: "Supplements now. Hardware from November.",
      sub: "The supplements, recovery products and training kit ship today — ours, and a short list from partners we've checked. The V1 band and its accessories are open for pre-order and ship in November 2027.",
    },
    searchLabel: "Search the shop",
    searchPlaceholder: "Protein, straps, the band…",
    departmentsLabel: "Departments",
    itemOne: "item",
    itemMany: "items",
    trust: [
      { title: "Free delivery over $75", body: "Tracked, to 40+ countries" },
      { title: "30-day returns", body: "We pay the return shipping" },
      { title: "2-year warranty", body: "On everything we make" },
      { title: "Secure checkout", body: "Card, wallets and crypto" },
    ],
    categories: {
      all: "Everything",
      band: "Band and membership",
      accessories: "Accessories",
      // The two sub-brands are named rather than described: Terrifuel is the
      // supplement line, Terrifits the gymwear.
      apparel: "Terrifits",
      fuel: "Terrifuel",
      recovery: "Recovery",
      bundles: "Bundles",
    },
    sortLabel: "Sort",
    sort: { featured: "Featured", priceLow: "Price: low to high", priceHigh: "Price: high to low", rating: "Best rated" },
    resultCount: "products",
    empty: "Nothing in here yet.",
    partnerBadge: "Partner product",
    originalBadge: "Made by Terrifit",
    stock: { in: "Ships today", low: "Nearly gone", preorder: "Pre-order", out: "Out of stock" },
    addToBag: "Add to bag",
    added: "Added",
    viewProduct: "View",
    from: "From",
    save: "Save",
    reviewsLabel: "reviews",
    product: {
      back: "Back to the shop",
      overview: "About it",
      highlights: "The short version",
      specs: "Specifications",
      shippingTitle: "Shipping and returns",
      shippingBody: "Tracked delivery to over 40 countries, free over $75. You've got thirty days to send anything back unopened and we cover the return label.",
      warrantyTitle: "Warranty",
      warrantyBody: "Two years on anything we make, covering anything that fails in normal use.",
      partnerNote: "Sold and shipped by a partner we've checked out. We may earn a commission, and it never changes what you pay.",
      chooseLabel: "Choose",
      quantity: "How many",
      oneTime: "Buy once",
      subscribeLabel: "Send it every month",
      subscribeSave: "save",
      relatedTitle: "Goes with this",
      addToBag: "Add to bag",
    },
    cart: {
      title: "Your bag",
      open: "Open bag",
      close: "Close",
      empty: "There's nothing in your bag.",
      emptyBody: "Most people start with the V1 band.",
      emptyCta: "Look at the band",
      item: "item",
      items: "items",
      subtotal: "Subtotal",
      savings: "You're saving",
      shipping: "Shipping",
      shippingFree: "Free",
      shippingAt: "Worked out at checkout",
      total: "Total",
      remove: "Remove",
      checkout: "Checkout",
      viewBag: "See the full bag",
      continue: "Keep shopping",
      freeShippingProgress: "away from free delivery",
      freeShippingReached: "Delivery is free",
      each: "each",
      subscription: "Monthly",
      recommendTitle: "Add before you go",
      recommendAdd: "Add",
      mapsTitle: "Training is included",
      mapsBody: "Membership opens the whole Map library, so you do not need to buy a programme separately.",
      mapsCta: "See the Maps",
    },
    checkout: {
      title: "Checkout",
      step1: "Your details",
      step2: "Delivery",
      step3: "Payment",
      emailLabel: "Email",
      emailHint: "We'll send your receipt and tracking here.",
      nameLabel: "Full name",
      addressLabel: "Address",
      address2Label: "Flat, apartment, unit (optional)",
      cityLabel: "City",
      postcodeLabel: "Postcode",
      countryLabel: "Country",
      phoneLabel: "Phone, for the courier",
      methodLabel: "How do you want to pay?",
      methods: {
        card: { label: "Card", note: "Visa, Mastercard and Amex" },
        apple_pay: { label: "Apple Pay", note: "One tap with Face ID. Your card details never leave your phone." },
        google_pay: { label: "Google Pay", note: "Pay with a card saved to your Google account." },
        paypal: { label: "PayPal", note: "Your PayPal balance or a card linked to it" },
        crypto: { label: "Crypto", note: "USDT, USDC, BTC and ETH through our payment processor" },
      },
      summaryTitle: "What you're buying",
      subtotal: "Subtotal",
      shipping: "Delivery",
      tax: "Tax",
      taxNote: "Estimated. Your region decides the final figure",
      total: "Total",
      place: "Place order",
      placing: "Placing your order…",
      terms: "Placing this order means you're happy with our terms of sale and privacy policy.",
      backToBag: "Back to the bag",
      emptyTitle: "There's nothing here to buy.",
      emptyCta: "Go to the shop",
      unavailable: "We can't take that payment method yet. Pick another one and we'll get this through.",
      errorGeneric: "We couldn't place that order. Nothing's been charged, so try again in a moment.",
      errorValidation: "A few details need fixing before we can take this.",
      errorRate: "Too many tries. Give it a minute and go again.",
      required: "Required",
      testMode: "Sandbox mode. No card gets charged and nothing ships.",
    },
    order: {
      title: "That's gone through",
      body: "We've got your order. A receipt is on its way to your inbox, and you'll get a tracking link as soon as it ships.",
      numberLabel: "Order",
      emailLabel: "Confirmation sent to",
      totalLabel: "Total paid",
      methodLabel: "Paid with",
      itemsLabel: "What's coming",
      nextTitle: "What happens now",
      next: [
        "A receipt lands in your inbox within a minute.",
        "Pre-orders ship in the order they came in.",
        "You get a tracking link the day your parcel leaves us.",
        "If you bought a membership, it starts as soon as you open the app.",
      ],
      support: "Something wrong with this order?",
      supportCta: "Get in touch",
      continue: "Keep shopping",
      notFound: "We couldn't find that order.",
      notFoundBody: "Check the link in your confirmation email, or get in touch and give us the order number.",
      pending: "Waiting for payment",
      paid: "Paid",
    },
  },
};

export type PagesCopy = typeof en;
