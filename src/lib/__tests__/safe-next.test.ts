import { describe, expect, it } from "vitest";
import { safeNext } from "../safe-next";

describe("safeNext", () => {
  it("passes a same-site path through", () => {
    expect(safeNext("/en/nimda", "/en/account")).toBe("/en/nimda");
    expect(safeNext("/en/shop/order/TF-1?x=2", "/en/account")).toBe("/en/shop/order/TF-1?x=2");
  });

  it("falls back when nothing is asked for", () => {
    expect(safeNext(undefined, "/en/account")).toBe("/en/account");
    expect(safeNext("", "/en/account")).toBe("/en/account");
  });

  it("refuses anything that leaves the site", () => {
    for (const hostile of [
      "https://evil.example/steal",
      "//evil.example",            // protocol-relative: looks like a path, is not
      "/\\evil.example",           // backslash variant some parsers normalise
      "javascript:alert(1)",
      "http://evil.example",
      "/en/ok\nLocation: https://evil.example",
    ]) {
      expect(safeNext(hostile, "/en/account"), hostile).toBe("/en/account");
    }
  });
});
