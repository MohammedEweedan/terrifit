import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "vitest";

/**
 * The signature check, lifted verbatim from the route.
 *
 * Kept in step by the tests below rather than by exporting it — the route is a
 * server module that pulls in Prisma, and a unit test should not need a
 * database to prove an HMAC is compared correctly.
 */
async function post(body: string, header: string, secret = "whsec_test") {
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  const { POST } = await import("@/app/api/webhooks/stripe/route");
  return POST(
    new Request("https://terrifit.test/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": header },
      body,
    }),
  );
}

function sign(body: string, secret = "whsec_test", at = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${at}.${body}`).digest("hex");
  return `t=${at},v1=${v1}`;
}

const event = JSON.stringify({
  type: "payment_intent.succeeded",
  data: { object: { id: "pi_123", metadata: { order_number: "TF-NOPE00" } } },
});

describe("stripe webhook signature", () => {
  it("rejects an unsigned request", async () => {
    const response = await post(event, "");
    assert.equal(response.status, 400);
  });

  it("rejects a signature computed with the wrong secret", async () => {
    const response = await post(event, sign(event, "whsec_attacker"));
    assert.equal(response.status, 400);
  });

  it("rejects a body that was altered after signing", async () => {
    const header = sign(event);
    const tampered = event.replace("TF-NOPE00", "TF-OTHER0");
    const response = await post(tampered, header);
    assert.equal(response.status, 400);
  });

  it("rejects a valid signature that is too old to be live", async () => {
    const old = Math.floor(Date.now() / 1000) - 600;
    const response = await post(event, sign(event, "whsec_test", old));
    assert.equal(response.status, 400);
  });

  it("accepts a correctly signed, current event", async () => {
    const response = await post(event, sign(event));
    assert.equal(response.status, 200);
  });
});
