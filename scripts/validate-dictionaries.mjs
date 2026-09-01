/**
 * Structural check for locale dictionaries.
 *
 * TypeScript already fails the build on a missing key, but it reports one
 * error at a time and truncates deep paths. This lists every difference at
 * once, which is what you want when adding a locale.
 *
 * Usage: node --experimental-strip-types scripts/validate-dictionaries.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../src/i18n/dictionaries/en.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "i18n", "dictionaries");

function* paths(value, prefix = "") {
  if (Array.isArray(value)) {
    yield `${prefix}[${value.length}]`;
    for (const item of value) {
      if (item && typeof item === "object") yield* paths(item, `${prefix}[]`);
    }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      yield* paths(child, prefix ? `${prefix}.${key}` : key);
    }
  } else {
    yield prefix;
  }
}

const expected = new Set(paths(en));
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const locale = file.replace(/\.json$/, "");
  const actual = new Set(paths(JSON.parse(readFileSync(join(dir, file), "utf8"))));
  const missing = [...expected].filter((p) => !actual.has(p));
  const extra = [...actual].filter((p) => !expected.has(p));

  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${locale}`);
    if (missing.length) console.error(`   missing (${missing.length}): ${missing.join(", ")}`);
    if (extra.length) console.error(`   extra   (${extra.length}): ${extra.join(", ")}`);
  } else {
    console.log(`✓ ${locale} — ${expected.size} paths match`);
  }
}

process.exit(failed ? 1 : 0);
