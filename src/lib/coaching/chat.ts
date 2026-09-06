/**
 * The Coach conversation.
 *
 * Two rules shape everything here.
 *
 * The first is that the model is never the safety boundary. Anything touching
 * pain, injury, medication or a medical symptom is caught by `triage` — plain
 * code, tested, deterministic — and answered without a model call at all. A
 * system prompt is a request, not a guarantee, and "please decline medical
 * questions" is not a control you can point at when somebody trains on a torn
 * hamstring because a chatbot told them it was probably fine.
 *
 * The second is that the model is given the member's real numbers and told to
 * work from them. A coach that cannot see last week is a search engine with a
 * friendly tone, and the whole reason this is worth building is that the app
 * already knows what they lifted, how they slept and what the plan said.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type CoachContext = {
  firstName: string | null;
  /** The Map they are on, if any. */
  mapName: string | null;
  week: number | null;
  /** What the app is about to prescribe. */
  nextSession: string | null;
  /** Sessions completed in the last seven days. */
  sessionsThisWeek: number;
  /** Most recent readings, when the member has a band or a health connection. */
  restingHr: number | null;
  sleepHours: number | null;
  recovery: number | null;
};

/* -------------------------------------------------------------------------- */
/* Triage                                                                     */

export type Triage =
  | { kind: "allow" }
  | { kind: "refuse"; reason: string; reply: string };

/**
 * Phrases that move a question out of coaching and into medicine.
 *
 * Deliberately broad. A false positive costs one unnecessary "see a
 * professional"; a false negative is a training app freelancing on an injury.
 */
const MEDICAL = [
  /\b(pain|painful|hurts?|hurting|aching|ache)\b/i,
  /\b(injur\w*|torn|tore|tear|ruptur\w*|sprain\w*|fracture\w*|broken)\b/i,
  // "Strain" on its own is this app's own 0-21 effort metric, so the bare word
  // must stay askable: "what does the strain number mean" and "is a strain of
  // 14 a lot" are support questions, not medical ones. The injury sense is
  // taken only from the verb or from a named body part, which is how people
  // actually write it — "I strained my hamstring", "a groin strain".
  /\bstrained\b/i,
  /\b(muscle|groin|hamstring|calf|quad|glute|hip flexor|shoulder|chest|neck|back|oblique|abdominal)\s+(strain|pull)\b/i,
  /\bpulled (a|my) \w+/i,
  // `numb\w*` matched "number", so "what does the strain number mean" was
  // triaged as a neurological symptom. Match the words people actually use.
  /\b(numb|numbness|going numb|tingling|dizzy|dizziness|faint|fainted|fainting|blackout|passed out)\b/i,
  /\b(chest (pain|tight\w*)|palpitations|short(ness)? of breath)\b/i,
  /\b(medication|medicine|prescribed?|drugs?|steroids?|beta.?blocker)\b/i,
  /\b(diagnos\w*|symptom\w*|condition|disease|disorder|syndrome)\b/i,
  /\b(pregnan\w*|postpartum)\b/i,
  /\b(eating disorder|anorexi\w*|bulimi\w*|purge|purging)\b/i,
  /\b(should i see a (doctor|physio|gp)|is it safe for me)\b/i,
];

/** Weight-loss framing that should not be answered with a number. */
const DISORDERED = [
  /\b(starve|starving myself|not eat\w*|stop eating|skip(ping)? meals?)\b/i,
  /\b(lose \d+\s*(kg|kilos|pounds|lbs?)\s*(in|within)\s*\d+\s*(day|week)s?)\b/i,
  /\b(how (few|little) calories)\b/i,
];

const MEDICAL_REPLY =
  "That sounds like something for a clinician rather than a training app — I can't assess pain, "
  + "symptoms or anything medical, and I'd be guessing if I tried. Please get it looked at by a "
  + "doctor or physio.\n\n"
  + "If you want, I can pause your programme in the meantime so your Map doesn't run away from you "
  + "while you're sorting it out.";

const DISORDERED_REPLY =
  "I'm not going to help with that approach — very fast weight loss and skipping meals do more "
  + "damage than good, and I'm not qualified to guide it safely.\n\n"
  + "If you want to talk about training consistency, or getting stronger on the plan you're on, "
  + "I'm glad to. If food is feeling difficult at the moment, a GP or a registered dietitian is "
  + "the right person to talk to.";

/**
 * Decides whether a message can be coached at all.
 *
 * Runs before any model call, on the raw message, so the refusal is a property
 * of the system rather than of the model's mood that day.
 */
export function triage(message: string): Triage {
  if (DISORDERED.some((pattern) => pattern.test(message))) {
    return { kind: "refuse", reason: "disordered_eating", reply: DISORDERED_REPLY };
  }
  if (MEDICAL.some((pattern) => pattern.test(message))) {
    return { kind: "refuse", reason: "medical", reply: MEDICAL_REPLY };
  }
  return { kind: "allow" };
}

/* -------------------------------------------------------------------------- */
/* Prompt                                                                     */

export function systemPrompt(context: CoachContext): string {
  const known: string[] = [];
  if (context.mapName) known.push(`They are on the "${context.mapName}" Map${context.week ? `, week ${context.week}` : ""}.`);
  if (context.nextSession) known.push(`Their next prescribed session is "${context.nextSession}".`);
  // Zero sessions is the absence of a fact, not a fact: reporting it as one
  // would leave a brand-new member described as "0 sessions" instead of
  // "nothing yet", and the model would coach the number rather than ask.
  if (context.sessionsThisWeek > 0) {
    known.push(`They have completed ${context.sessionsThisWeek} session${context.sessionsThisWeek === 1 ? "" : "s"} in the last seven days.`);
  }
  if (context.restingHr != null) known.push(`Resting heart rate: ${context.restingHr} bpm.`);
  if (context.sleepHours != null) known.push(`Last night's sleep: ${context.sleepHours.toFixed(1)} hours.`);
  if (context.recovery != null) known.push(`Recovery score this morning: ${Math.round(context.recovery)} out of 100.`);

  return [
    "You are the Terrifit Coach, inside the Terrifit fitness app.",
    "",
    "You help with training: technique, programme structure, effort, consistency, and what to do",
    "on a day that has not gone to plan. You are talking to somebody who trains, not to a patient",
    "and not to a beginner who needs everything explained twice.",
    "",
    "What you know about the person you are talking to:",
    known.length ? known.map((line) => `- ${line}`).join("\n") : "- Nothing yet. They have not trained or connected anything.",
    "",
    "How to answer:",
    "- Use the numbers above. A coach who ignores what the app already knows is worthless.",
    "- Be brief. Two or three short paragraphs at most, usually less. No headers, no bullet lists",
    "  unless they genuinely asked for a list.",
    "- Give one clear recommendation rather than three options with caveats.",
    "- British English. Plain words. No exclamation marks and no motivational filler.",
    "",
    "Hard limits:",
    "- You are not a clinician. Do not diagnose, interpret symptoms, or advise on pain, injury,",
    "  medication or any medical condition. If one comes up, say it is outside what you can help",
    "  with and point them to a doctor or physio. Do not soften this and do not add a guess.",
    "- Do not prescribe calorie targets or weight-loss rates.",
    "- Do not claim the band measures anything it does not. It reads heart rate, movement and",
    "  sleep. It does not diagnose anything, and it does not count reps.",
    "- If you do not know something about them, say so and ask, rather than inventing a number.",
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* The call                                                                   */

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 700;
/** Enough conversation to stay coherent, not enough to smuggle in a long prompt. */
export const MAX_TURNS = 12;
export const MAX_MESSAGE_CHARS = 2000;

export type CoachReply = { reply: string; source: "model" | "triage" | "unavailable" };

export async function askCoach(
  message: string,
  history: ChatTurn[],
  context: CoachContext,
  signal?: AbortSignal,
): Promise<CoachReply> {
  const gate = triage(message);
  if (gate.kind === "refuse") return { reply: gate.reply, source: "triage" };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Said plainly rather than dressed up as a model outage. Somebody running
    // this without a key should be told what is missing.
    return {
      reply: "The Coach is not configured on this server yet. Your programme and check-in still work as normal.",
      source: "unavailable",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt(context),
      messages: [...history.slice(-MAX_TURNS), { role: "user", content: message }],
    }),
  }).catch(() => null);

  if (!response?.ok) {
    return {
      reply: "I could not reach the Coach just then. Try again in a moment.",
      source: "unavailable",
    };
  }

  const body = (await response.json().catch(() => null)) as
    | { content?: { type: string; text?: string }[] }
    | null;
  const text = body?.content?.filter((part) => part.type === "text").map((part) => part.text ?? "").join("").trim();

  if (!text) return { reply: "I could not reach the Coach just then. Try again in a moment.", source: "unavailable" };
  return { reply: text, source: "model" };
}
