import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { systemPrompt, triage, type CoachContext } from "../chat";

const context: CoachContext = {
  firstName: "Sam", mapName: "Strength Base", week: 3,
  nextSession: "Lower A", sessionsThisWeek: 2,
  restingHr: 54, sleepHours: 7.2, recovery: 71,
};

/**
 * The gate is the safety boundary, so it is tested like one. A system prompt
 * asking a model to decline medical questions is a request; this is a control.
 */
describe("triage", () => {
  it("refuses anything about pain", () => {
    for (const message of [
      "my knee hurts when I squat",
      "I have pain in my lower back after deadlifts",
      "shoulder is aching, should I train through it?",
    ]) {
      assert.equal(triage(message).kind, "refuse", message);
    }
  });

  it("refuses injuries, symptoms and medication", () => {
    for (const message of [
      "I think I tore something",
      "my hand goes numb on pull-ups",
      "I get dizzy standing up after a set",
      "chest tightness during cardio",
      "does creatine interact with my medication",
      "I was diagnosed with a heart condition, can I train",
      "I'm pregnant, is this Map ok",
    ]) {
      assert.equal(triage(message).kind, "refuse", message);
    }
  });

  it("refuses to help somebody starve themselves", () => {
    for (const message of [
      "how do I lose 10kg in 2 weeks",
      "what if I stop eating for a few days",
      "how few calories can I get away with",
    ]) {
      const result = triage(message);
      assert.equal(result.kind, "refuse", message);
      if (result.kind === "refuse") assert.equal(result.reason, "disordered_eating");
    }
  });

  it("points at a clinician rather than guessing", () => {
    const result = triage("my knee hurts");
    assert.equal(result.kind, "refuse");
    if (result.kind === "refuse") {
      assert.match(result.reply, /doctor|physio|clinician/i);
      // The failure mode that matters: a refusal that still offers a diagnosis.
      assert.doesNotMatch(result.reply, /it('s| is) probably|sounds like (a|an)\s+\w+itis/i);
    }
  });

  it("keeps the app's own metric askable", () => {
    // "Strain" is the 0-21 effort score this app computes. An earlier version
    // of the gate matched the bare word and refused to explain the product's
    // own feature as though it were a medical question.
    for (const message of [
      "what does the strain number actually mean",
      "why was my strain so high yesterday",
      "is a strain of 14 a lot",
    ]) {
      assert.equal(triage(message).kind, "allow", message);
    }
    // The injury senses still catch.
    assert.equal(triage("I strained my hamstring").kind, "refuse");
    assert.equal(triage("I think I have a muscle strain").kind, "refuse");
    assert.equal(triage("I've got a groin strain").kind, "refuse");
    assert.equal(triage("I pulled my calf").kind, "refuse");
  });

  it("lets ordinary coaching questions through", () => {
    for (const message of [
      "how do I stop my elbows flaring on bench",
      "should I add a fourth session this week",
      "my squat has not moved in a month, what now",
      "is it worth training if I only slept six hours",
      "what does the strain number actually mean",
    ]) {
      assert.equal(triage(message).kind, "allow", message);
    }
  });
});

describe("systemPrompt", () => {
  it("hands the model the numbers the app already has", () => {
    const prompt = systemPrompt(context);
    for (const fact of ["Strength Base", "week 3", "Lower A", "54 bpm", "7.2 hours", "71 out of 100"]) {
      assert.ok(prompt.includes(fact), `missing ${fact}`);
    }
  });

  it("says plainly when it knows nothing, rather than leaving a gap to fill", () => {
    const prompt = systemPrompt({
      firstName: null, mapName: null, week: null, nextSession: null,
      sessionsThisWeek: 0, restingHr: null, sleepHours: null, recovery: null,
    });
    assert.ok(prompt.includes("Nothing yet"));
    assert.ok(!prompt.includes("null"), "a null leaked into the prompt");
    assert.ok(!prompt.includes("undefined"), "an undefined leaked into the prompt");
  });

  it("carries the claim limits the rest of the product is held to", () => {
    const prompt = systemPrompt(context);
    assert.match(prompt, /not a clinician/i);
    assert.match(prompt, /does not count reps/i);
    assert.match(prompt, /do not diagnose/i);
  });

  it("gets the singular right so the model is not fed broken English", () => {
    assert.ok(systemPrompt({ ...context, sessionsThisWeek: 1 }).includes("1 session in"));
    assert.ok(systemPrompt({ ...context, sessionsThisWeek: 2 }).includes("2 sessions in"));
  });
});
