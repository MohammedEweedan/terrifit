/**
 * The Map library.
 *
 * A Map is content, not user data, so it lives here rather than in the
 * database — the same reasoning as the shop catalogue. Only somebody's
 * progress through one is a row (see `MapEnrollment`).
 *
 * Every Map opens the same way — block, week, session, exercise — so nobody
 * has to learn a new coach's spreadsheet to read one.
 */

export type Exercise = {
  name: string;
  /** "5×3", "3×8 each side" — written the way a coach would say it. */
  scheme: string;
  /** Percentage of one-rep max, when the movement is loaded against one. */
  intensity?: string;
  /** The one thing that goes wrong on this movement more than any other. */
  cue: string;
  restSeconds: number;
  /** Which muscles are actually doing the work. */
  targets?: string[];
  /** The movement, in the order it happens. */
  technique?: string[];
  /** What goes wrong, and what it looks like when it does. */
  mistakes?: string[];
  /** How to make this lift go up over the block. */
  progression?: string;
  /** Demonstration media. Falls back to a designed placeholder when absent. */
  media?: { image?: string; video?: string; alt: string };
};

export type Session = {
  id: string;
  name: string;
  /** Which day of the week it lands on, 1 = Monday. */
  day: number;
  minutes: number;
  /** Expected strain, on the same 0–21 scale the app scores. */
  strain: number;
  focus: string;
  exercises: Exercise[];
};

export type Block = {
  key: string;
  label: string;
  /** Inclusive 1-based week range within the Map. */
  weeks: [number, number];
  intent: string;
};

export type TrainingMap = {
  id: string;
  name: string;
  tagline: string;
  /** Who wrote it, and what makes them worth listening to. */
  coach: {
    name: string;
    credential: string;
    /** Account handle, so a member can actually reach them. */
    handle: string;
    bio: string;
  };
  goal: "strength" | "hypertrophy" | "endurance" | "health";
  weeks: number;
  sessionsPerWeek: number;
  /** new | returning | steady | advanced — the floor, not a ceiling. */
  level: string;
  equipment: string[];
  summary: string;
  blocks: Block[];
  /** One week of sessions, repeated with progression across the block. */
  sample: Session[];
  accent: string;
};

export const MAPS: TrainingMap[] = [
  {
    id: "hypertrophy-base",
    name: "Hypertrophy Base",
    tagline: "Twelve weeks of putting size on",
    coach: {
      name: "Dara Okafor",
      credential: "S&C coach, 11 years, two national programmes",
      handle: "daraokafor",
      bio: "Eleven years putting size on people who thought they had stopped responding. Two national programmes, and a strong preference for six lifts done properly over thirty done badly.",
    },
    goal: "hypertrophy",
    weeks: 12,
    sessionsPerWeek: 4,
    level: "returning",
    equipment: ["Barbell", "Rack", "Dumbbells", "Cable stack"],
    summary:
      "Four days a week, built around six lifts you will get properly good at. Volume climbs for four weeks, then intensity takes over, then you peak and back off. If you are wearing a V1 it counts the reps and tells you when the bar slowed down enough to stop.",
    accent: "#ff5a1f",
    blocks: [
      { key: "build", label: "Building", weeks: [1, 4], intent: "Get the volume up and the movements clean." },
      { key: "intensity", label: "Intensity", weeks: [5, 9], intent: "Less volume, heavier bar, same quality." },
      { key: "peak", label: "Peak", weeks: [10, 11], intent: "Find out what you can actually do." },
      { key: "deload", label: "Deload", weeks: [12, 12], intent: "Back off so the work lands." },
    ],
    sample: [
      {
        id: "lower-a",
        name: "Lower A",
        day: 1,
        minutes: 62,
        strain: 14.2,
        focus: "Squat pattern",
        exercises: [
          {
            name: "Back squat",
            scheme: "5×3",
            intensity: "82%",
            cue: "Knees track over the middle toe on the way down, not on the way up.",
            restSeconds: 180,
            targets: ["Quads", "Glutes", "Adductors", "Trunk"],
            technique: [
              "Bar on the rear delts, hands as narrow as your shoulders allow without pain.",
              "Brace before you unrack, not after — take a breath into the belly and hold it.",
              "Sit between your feet rather than back, knees travelling forward over the middle toe.",
              "Descend to where your pelvis stops tucking under. That depth, every rep.",
              "Drive the whole foot into the floor and stand up with the chest where it started.",
            ],
            mistakes: [
              "Knees collapsing inward out of the hole — usually the weight, occasionally the cue.",
              "The hips rising before the chest, which turns a squat into a good morning.",
              "Depth changing rep to rep, which makes the numbers mean nothing.",
            ],
            progression: "Add 2.5kg when all five sets move at the same speed. If the last rep of set five is slower than the first rep of set one, stay where you are another week.",
            media: { alt: "Back squat at the bottom position, viewed from the side, knees tracking over the middle of the foot and the trunk braced" },
          },
          { name: "Romanian deadlift", scheme: "3×8", intensity: "65%", cue: "Push the hips back until you feel the hamstrings, then stop. The bar does not need to touch the floor.", restSeconds: 120 },
          { name: "Bulgarian split squat", scheme: "3×10 each side", cue: "Front shin stays vertical. If it drifts, shorten the stance.", restSeconds: 90 },
          { name: "Standing calf raise", scheme: "4×12", cue: "Two seconds down. The stretch is the point, not the bounce.", restSeconds: 60 },
        ],
      },
      {
        id: "upper-a",
        name: "Upper A",
        day: 2,
        minutes: 58,
        strain: 12.6,
        focus: "Horizontal press and pull",
        exercises: [
          {
            name: "Bench press",
            scheme: "5×4",
            intensity: "80%",
            cue: "Shoulder blades pinned to the bench before the bar leaves the rack.",
            restSeconds: 180,
            targets: ["Chest", "Front delts", "Triceps"],
            technique: [
              "Pull the shoulder blades together and down, and keep them there for the whole set.",
              "Feet flat and driving into the floor — the press starts from the ground.",
              "Lower to the bottom of the sternum with the elbows at roughly forty-five degrees.",
              "Touch, do not bounce, then push yourself away from the bar.",
            ],
            mistakes: [
              "Elbows flared to ninety degrees, which is how shoulders get sore.",
              "Losing the upper-back position halfway through the set.",
              "Bouncing the bar off the chest to save a rep that was not there.",
            ],
            progression: "Add 2.5kg when you finish all five sets without the last rep grinding. Upper body moves slower than legs — expect half the rate of progress on the squat.",
            media: { alt: "Bench press at the chest, shoulder blades retracted, elbows at forty-five degrees to the torso" },
          },
          { name: "Chest-supported row", scheme: "4×10", cue: "Pull to the bottom of the ribs, not the collarbone.", restSeconds: 90 },
          { name: "Incline dumbbell press", scheme: "3×10", cue: "Elbows at forty-five degrees. Flared is how shoulders get sore.", restSeconds: 90 },
          { name: "Face pull", scheme: "3×15", cue: "Pull apart as well as back.", restSeconds: 60 },
        ],
      },
      {
        id: "lower-b",
        name: "Lower B",
        day: 4,
        minutes: 60,
        strain: 13.8,
        focus: "Hinge pattern",
        exercises: [
          {
            name: "Deadlift",
            scheme: "4×3",
            intensity: "85%",
            cue: "Take the slack out of the bar before you pull. You should hear it.",
            restSeconds: 210,
            targets: ["Hamstrings", "Glutes", "Spinal erectors", "Lats"],
            technique: [
              "Bar over the middle of the foot before you bend — it should not move toward you.",
              "Grip, then drop the hips until the shoulders sit just in front of the bar.",
              "Pull the slack out until the bar meets the plates. You will hear the click.",
              "Push the floor away rather than lifting the bar; hips and shoulders rise together.",
              "Stand tall without leaning back at the top.",
            ],
            mistakes: [
              "Jerking the bar off the floor from a loose start, which is where backs get hurt.",
              "Hips shooting up first, leaving the weight on the lower back.",
              "The bar drifting away from the shins on the way up.",
            ],
            progression: "This is the lift to be most patient with. Add 5kg a fortnight rather than weekly, and stop the set the moment the bar path changes.",
            media: { alt: "Deadlift setup from the side, bar over the middle of the foot, shoulders just in front of the bar" },
          },
          { name: "Front squat", scheme: "3×6", intensity: "70%", cue: "Elbows up. The moment they drop the bar goes forward.", restSeconds: 150 },
          { name: "Hip thrust", scheme: "3×12", cue: "Ribs down. Arching the back is not the same as extending the hip.", restSeconds: 90 },
          { name: "Hanging leg raise", scheme: "3×10", cue: "Curl the pelvis at the top. Swinging legs do nothing.", restSeconds: 75 },
        ],
      },
      {
        id: "upper-b",
        name: "Upper B",
        day: 5,
        minutes: 55,
        strain: 11.9,
        focus: "Vertical press and pull",
        exercises: [
          { name: "Overhead press", scheme: "5×4", intensity: "78%", cue: "Head moves through the window once the bar clears your forehead.", restSeconds: 180 },
          { name: "Weighted pull-up", scheme: "4×6", cue: "Full hang at the bottom every rep. Half reps build half a back.", restSeconds: 150 },
          { name: "Dumbbell lateral raise", scheme: "3×15", cue: "Lead with the elbow, not the hand.", restSeconds: 60 },
          { name: "Barbell curl", scheme: "3×10", cue: "Elbows stay at your sides. Swinging is a shoulder exercise.", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: "strength-five",
    name: "Strength Five",
    tagline: "Ten weeks chasing a bigger total",
    coach: {
      name: "Ivan Petrov",
      credential: "Powerlifting coach, three IPF podium lifters",
      handle: "ivanpetrov",
      bio: "Three IPF podium lifters and a completely boring approach: small jumps, made every week, for longer than you think is necessary.",
    },
    goal: "strength",
    weeks: 10,
    sessionsPerWeek: 3,
    level: "steady",
    equipment: ["Barbell", "Rack", "Bench"],
    summary:
      "Three days, five lifts, and a very boring plan that works. Squat, bench and deadlift move up in small steps you can actually make every week, with enough accessory work to keep your shoulders and lower back in one piece.",
    accent: "#e8b23c",
    blocks: [
      { key: "base", label: "Base", weeks: [1, 4], intent: "Groove the lifts at weights you can hit every time." },
      { key: "load", label: "Loading", weeks: [5, 8], intent: "Add weight weekly until it stops being easy." },
      { key: "test", label: "Test", weeks: [9, 10], intent: "Open light, then find a new best." },
    ],
    sample: [
      {
        id: "squat-day",
        name: "Squat day",
        day: 1,
        minutes: 70,
        strain: 15.1,
        focus: "Squat",
        exercises: [
          { name: "Back squat", scheme: "4×5", intensity: "80%", cue: "Same depth every rep. Consistency is what the numbers mean.", restSeconds: 240 },
          { name: "Pause squat", scheme: "3×3", intensity: "70%", cue: "Two full seconds at the bottom, no bouncing out.", restSeconds: 180 },
          { name: "Back extension", scheme: "3×12", cue: "Squeeze at the top rather than swinging past it.", restSeconds: 90 },
        ],
      },
      {
        id: "bench-day",
        name: "Bench day",
        day: 3,
        minutes: 64,
        strain: 12.2,
        focus: "Bench",
        exercises: [
          { name: "Bench press", scheme: "4×5", intensity: "80%", cue: "Drive your feet into the floor. The press starts from the ground.", restSeconds: 240 },
          { name: "Close-grip bench", scheme: "3×6", intensity: "70%", cue: "Hands just inside shoulder width — narrower wrecks wrists.", restSeconds: 150 },
          { name: "Dumbbell row", scheme: "4×10", cue: "No twisting. If your torso rotates the weight is too heavy.", restSeconds: 90 },
        ],
      },
      {
        id: "pull-day",
        name: "Pull day",
        day: 5,
        minutes: 68,
        strain: 14.6,
        focus: "Deadlift",
        exercises: [
          { name: "Deadlift", scheme: "5×3", intensity: "82%", cue: "Hips and shoulders rise together. If the hips shoot first, lighten it.", restSeconds: 240 },
          { name: "Deficit deadlift", scheme: "3×5", intensity: "65%", cue: "Stand on a 5cm plate. Same setup, longer pull.", restSeconds: 180 },
          { name: "Farmer's carry", scheme: "4×40m", cue: "Tall and quiet. Stomping means it is too heavy.", restSeconds: 90 },
        ],
      },
    ],
  },
  {
    id: "engine-builder",
    name: "Engine Builder",
    tagline: "Eight weeks of a bigger aerobic base",
    coach: {
      name: "Nadia Haddad",
      credential: "Endurance coach, marathon and triathlon",
      handle: "nadiahaddad",
      bio: "Marathon and triathlon. Most people run their easy days too hard and their hard days too easy; almost everything I do is fixing that.",
    },
    goal: "endurance",
    weeks: 8,
    sessionsPerWeek: 5,
    level: "new",
    equipment: ["Running shoes", "Bike or rower (optional)"],
    summary:
      "Mostly easy running with two hard sessions a week, which is the split every good endurance plan has used for forty years. The easy days are meant to feel easy — if your heart rate says otherwise, the plan slows you down.",
    accent: "#45c98a",
    blocks: [
      { key: "base", label: "Base", weeks: [1, 3], intent: "Time on feet. Nothing hard yet." },
      { key: "threshold", label: "Threshold", weeks: [4, 6], intent: "Two quality sessions, everything else easy." },
      { key: "sharpen", label: "Sharpen", weeks: [7, 8], intent: "Shorter, faster, fully recovered." },
    ],
    sample: [
      {
        id: "easy-1",
        name: "Easy run",
        day: 1,
        minutes: 40,
        strain: 6.4,
        focus: "Aerobic base",
        exercises: [
          { name: "Easy run", scheme: "40 min", cue: "You should be able to hold a conversation. If you cannot, slow down.", restSeconds: 0 },
        ],
      },
      {
        id: "threshold",
        name: "Threshold",
        day: 2,
        minutes: 48,
        strain: 13.4,
        focus: "Lactate threshold",
        exercises: [
          { name: "Warm-up", scheme: "12 min easy", cue: "Do not skip this one. Threshold work on cold legs is how calves tear.", restSeconds: 0 },
          { name: "Threshold blocks", scheme: "4×6 min", cue: "Comfortably hard — the pace you could hold for an hour if you had to.", restSeconds: 90 },
          { name: "Cool-down", scheme: "8 min easy", cue: "Keep moving. Stopping dead is what makes tomorrow sore.", restSeconds: 0 },
        ],
      },
      {
        id: "long",
        name: "Long run",
        day: 6,
        minutes: 85,
        strain: 12.8,
        focus: "Endurance",
        exercises: [
          { name: "Long run", scheme: "85 min", cue: "Start slower than feels right. The last twenty minutes are the session.", restSeconds: 0 },
        ],
      },
    ],
  },
  {
    id: "return-to-training",
    name: "Return to Training",
    tagline: "Six weeks back from a long break",
    coach: {
      name: "Sofia Marchetti",
      credential: "Rehab and return-to-play, twelve years",
      handle: "sofiamarchetti",
      bio: "Twelve years getting people back from injury and long breaks. The first six weeks are about turning up, not about load.",
    },
    goal: "health",
    weeks: 6,
    sessionsPerWeek: 3,
    level: "new",
    equipment: ["Dumbbells", "Bands", "A floor"],
    summary:
      "For coming back after months off, an injury, or a stretch of life getting in the way. Three short sessions a week, full-body, deliberately easier than you think you need. The point is turning up six weeks running, not what you lift in week one.",
    accent: "#9aa2ab",
    blocks: [
      { key: "reintroduce", label: "Reintroduce", weeks: [1, 2], intent: "Move well, finish every session feeling better than you started." },
      { key: "rebuild", label: "Rebuild", weeks: [3, 4], intent: "Add load once the movements are automatic." },
      { key: "bridge", label: "Bridge", weeks: [5, 6], intent: "Look like normal training again." },
    ],
    sample: [
      {
        id: "full-a",
        name: "Full body A",
        day: 1,
        minutes: 35,
        strain: 7.2,
        focus: "Squat and push",
        exercises: [
          { name: "Goblet squat", scheme: "3×10", cue: "Sit between your feet, not behind them.", restSeconds: 75 },
          { name: "Push-up", scheme: "3×8", cue: "On your hands or on a bench — the shape matters, the height does not.", restSeconds: 75 },
          { name: "Dead bug", scheme: "3×8 each side", cue: "Lower back stays flat on the floor the whole time.", restSeconds: 60 },
        ],
      },
      {
        id: "full-b",
        name: "Full body B",
        day: 3,
        minutes: 35,
        strain: 7.0,
        focus: "Hinge and pull",
        exercises: [
          { name: "Dumbbell RDL", scheme: "3×10", cue: "Hamstrings, not lower back. Stop where the stretch stops.", restSeconds: 75 },
          { name: "One-arm row", scheme: "3×10 each side", cue: "Pull the elbow past your ribs.", restSeconds: 75 },
          { name: "Side plank", scheme: "3×30s each side", cue: "Hips stacked and lifted. Sagging is just lying down.", restSeconds: 60 },
        ],
      },
      {
        id: "full-c",
        name: "Full body C",
        day: 5,
        minutes: 32,
        strain: 6.6,
        focus: "Carry and conditioning",
        exercises: [
          { name: "Suitcase carry", scheme: "4×30m each side", cue: "Do not lean away from the weight.", restSeconds: 60 },
          { name: "Step-up", scheme: "3×10 each side", cue: "Drive through the top foot; do not push off the floor.", restSeconds: 75 },
          { name: "Easy walk", scheme: "10 min", cue: "Finish able to do it again tomorrow.", restSeconds: 0 },
        ],
      },
    ],
  },
];

export function findMap(id: string): TrainingMap | undefined {
  return MAPS.find((map) => map.id === id);
}

/** The block a given week falls in, for the "you are here" line in the app. */
export function blockForWeek(map: TrainingMap, week: number): Block | undefined {
  return map.blocks.find((block) => week >= block.weeks[0] && week <= block.weeks[1]);
}

/**
 * Maps worth showing someone, best fit first. Goal is the strong signal;
 * experience only breaks ties, because telling a beginner they cannot start
 * something is how people stop opening the app.
 */
export function recommendMaps(goal?: string | null, experience?: string | null): TrainingMap[] {
  const rank = (map: TrainingMap) => {
    let score = 0;
    if (goal && map.goal === goal) score += 2;
    if (goal === "fat-loss" && map.goal === "endurance") score += 1;
    if (goal === "recomposition" && map.goal === "hypertrophy") score += 1;
    if (experience && map.level === experience) score += 1;
    return score;
  };
  return [...MAPS].sort((a, b) => rank(b) - rank(a));
}
