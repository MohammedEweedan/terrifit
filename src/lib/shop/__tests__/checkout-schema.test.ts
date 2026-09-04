import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";

const base = {
  name: "Test",
  email: "a@b.com",
  line1: "120 Corp Street",
  city: "Coventry",
  postcode: "CV1 1GU",
  country: "GB",
  paymentMethod: "card" as const,
};

describe("checkoutSchema items", () => {
  it("accepts a null variantId, which is how a client holds 'no variant'", () => {
    // This was a real 422: the app sends `variantId: line.variantId`, which is
    // null for anything unvariated, and every cart containing a charger or a
    // membership was rejected with no indication of why.
    const parsed = checkoutSchema.safeParse({
      ...base,
      items: [{ slug: "v1-charger", variantId: null, quantity: 1 }],
    });
    assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
    assert.equal(parsed.data.items[0].variantId, undefined);
  });

  it("still accepts an omitted variantId", () => {
    const parsed = checkoutSchema.safeParse({
      ...base,
      items: [{ slug: "v1-charger", quantity: 1 }],
    });
    assert.ok(parsed.success);
  });

  it("keeps a real variant id", () => {
    const parsed = checkoutSchema.safeParse({
      ...base,
      items: [{ slug: "terrifit-v1", variantId: "ember", quantity: 1 }],
    });
    assert.ok(parsed.success);
    assert.equal(parsed.data.items[0].variantId, "ember");
  });

  it("handles a mixed cart, which is the case that broke", () => {
    const parsed = checkoutSchema.safeParse({
      ...base,
      items: [
        { slug: "terrifit-v1", variantId: "ember", quantity: 1 },
        { slug: "v1-charger", variantId: null, quantity: 1 },
      ],
    });
    assert.ok(parsed.success);
  });

  it("still rejects a variant id that is not a string", () => {
    const parsed = checkoutSchema.safeParse({
      ...base,
      items: [{ slug: "v1-charger", variantId: 42, quantity: 1 }],
    });
    assert.ok(!parsed.success);
  });
});
