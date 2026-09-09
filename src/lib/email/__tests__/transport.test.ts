import { afterEach, describe, expect, it } from "vitest";
import { emailConfigured, emailTransport } from "../send";
import { newSignIn, preorderConfirmed, signInCode } from "../templates";

const KEYS = ["SMTP_HOST", "RESEND_API_KEY", "EMAIL_FROM"] as const;

describe("email transport selection", () => {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });
  const set = (values: Partial<Record<(typeof KEYS)[number], string>>) => {
    for (const k of KEYS) delete process.env[k];
    for (const [k, v] of Object.entries(values)) process.env[k] = v;
  };

  it("prefers SMTP when a host is configured", () => {
    set({ SMTP_HOST: "smtp.example.com", RESEND_API_KEY: "re_x", EMAIL_FROM: "hi@terri.fit" });
    expect(emailTransport()).toBe("smtp");
  });

  it("falls back to Resend when there is no SMTP host", () => {
    set({ RESEND_API_KEY: "re_x", EMAIL_FROM: "hi@terri.fit" });
    expect(emailTransport()).toBe("resend");
  });

  it("is unconfigured without a from address, whatever else is set", () => {
    // Every relay rejects a message with no From. Treating this as configured
    // turns a setup mistake into a hard failure at signup.
    set({ SMTP_HOST: "smtp.example.com" });
    expect(emailTransport()).toBe("none");
    expect(emailConfigured()).toBe(false);
  });

  it("is unconfigured when nothing is set", () => {
    set({});
    expect(emailTransport()).toBe("none");
  });
});

describe("email templates", () => {
  it("puts the code in the subject, where people actually read it", () => {
    const message = signInCode("481920", 10);
    expect(message.subject).toContain("481920");
    expect(message.text).toContain("10 minutes");
  });

  it("offers the only action that helps on an unexpected sign-in", () => {
    const message = newSignIn({
      when: "Mon, 09 Sep 2026 10:00:00 GMT",
      device: "iPhone",
      approximateLocation: "Dubai",
      resetLink: "https://terri.fit/en/reset",
    });
    expect(message.text).toContain("change your password");
    expect(message.html).toContain("https://terri.fit/en/reset");
  });

  it("says plainly that a pre-order has not shipped", () => {
    const message = preorderConfirmed({
      number: "TF-1042", item: "Terrifit V1", total: "$199", shipTarget: "November 2027",
    });
    expect(message.text).toContain("has not shipped");
    expect(message.text).toContain("November 2027");
    expect(message.text.toLowerCase()).toContain("refundable");
  });
});
