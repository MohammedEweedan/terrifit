import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma's generated client. Not ours to lint, and it is regenerated on
    // every schema change.
    "src/generated/**",
    // The Expo app is a separate package with its own React Native rules; it
    // is type-checked by `npm run typecheck` inside mobile/.
    "mobile/**",
  ]),
]);

export default eslintConfig;
