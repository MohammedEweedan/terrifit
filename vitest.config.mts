import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

/**
 * Unit tests for the pure logic — the health scoring in particular, because
 * those functions make claims about someone's body and a silent regression in
 * one would be invisible until it had already told people the wrong thing.
 *
 * Components are not tested here; they are verified by running the app.
 *
 * `.env` is loaded because the webhook test drives the real route handler,
 * which reads the order back after verifying the signature. That read is part
 * of what the test is for — a handler that accepts a signature and then cannot
 * use the event is not actually working.
 */
export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
    env: loadEnv("test", process.cwd(), ""),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
