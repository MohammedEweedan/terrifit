import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the pure logic — the health scoring in particular, because
 * those functions make claims about someone's body and a silent regression in
 * one would be invisible until it had already told people the wrong thing.
 *
 * Components are not tested here; they are verified by running the app.
 */
export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
