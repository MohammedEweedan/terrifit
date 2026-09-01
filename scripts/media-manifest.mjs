/**
 * Regenerates public/media/MANIFEST.md.
 *
 * Every photograph on the new pages is a slot with a filename and an alt
 * description written before the art exists. This walks the copy module and the
 * product catalogue and writes them out as a brief, so whoever is generating or
 * shooting the images has the list, the aspect ratio and the description in one
 * place — and so the list cannot drift from what the pages actually request.
 *
 *   node --experimental-strip-types scripts/media-manifest.mjs
 */
import { writeFileSync, existsSync } from "node:fs";
import { en } from "../src/i18n/pages/en.ts";
import { products, V1_COLOURWAYS } from "../src/lib/shop/catalog.ts";

const slots = [];
const add = (group, src, alt, ratio, note) => {
  if (!src) return;
  slots.push({ group, src, alt, ratio, note });
};

const band = en.band;
add("Band page", band.hero.image.src, band.hero.image.alt, "3:2", "Hero. Also used on the shop's V1 product page.");
add("Band page", band.sensing.image.src, band.sensing.image.alt, "1:1", "Sticky beside the sensing list.");
add("Band page", band.battery.image.src, band.battery.image.alt, "11:10", "");
add("Band page", band.water.image.src, band.water.image.alt, "21:10", "Full-bleed, text sits over the lower third.");
add("Band page", band.box.image.src, band.box.image.alt, "43:50", "Flat lay, strict grid.");

for (const option of V1_COLOURWAYS) {
  add(
    "Colourways",
    option.image,
    `Terrifit V1 in ${option.label} — ${option.note}. Three-quarter view against a deep charcoal backdrop, strap curved to show the two-tone weave.`,
    "27:20",
    "Cross-faded with the others: identical camera, lighting and crop.",
  );
}

add("Maps page", en.maps.hero.image.src, en.maps.hero.image.alt, "3:2", "");
add("Maps page", en.maps.exercise.video.src, en.maps.exercise.video.alt, "8:5", "Two angles side by side.");
add("Maps page", en.maps.form.image.src, en.maps.form.image.alt, "5:4", "");
for (const map of en.maps.library.items) {
  add("Map cards", map.image.src, map.image.alt, "7:5", `Card for “${map.name}”.`);
}

add("Creators page", en.creators.hero.image.src, en.creators.hero.image.alt, "43:50", "");
add("Creators page", en.creators.channels.image.src, en.creators.channels.image.alt, "18:25", "");

for (const product of products) {
  for (const shot of product.media) {
    add("Shop", shot.src, shot.alt, "1:1", `${product.name}.`);
  }
}

add(
  "Hero",
  "/media/hero-loop.mp4",
  "Looping clip, 8–12 seconds, of an athlete training while wearing the V1 — the band visible on the wrist at least twice. Dark gym, single hard light source, no cuts, no on-screen text. Silent; it plays muted.",
  "16:9",
  "Also supply /media/hero-loop.webm. Under 4 MB each; the still is no longer used.",
);

const groups = [...new Set(slots.map((slot) => slot.group))];
const missing = slots.filter((slot) => !existsSync(new URL(`../public${slot.src}`, import.meta.url)));

const lines = [
  "# Media manifest",
  "",
  "Every image slot on the site, with the filename it expects and the shot it was",
  "written for. Until a file exists the page renders a labelled placeholder naming",
  "it, so nothing is broken and nothing is guessed at.",
  "",
  "Regenerate with `node --experimental-strip-types scripts/media-manifest.mjs`.",
  "",
  `**${slots.length} slots · ${missing.length} still to produce.**`,
  "",
  "Shoot notes that apply to everything: dark, high-contrast, one dominant light",
  "source, no lens flare, no stock-photo smiling. Product on seamless charcoal or",
  "warm paper. People mid-effort, never posing.",
  "",
];

for (const group of groups) {
  lines.push(`## ${group}`, "", "| File | Ratio | Have it | Description |", "|---|---|---|---|");
  for (const slot of slots.filter((entry) => entry.group === group)) {
    const have = existsSync(new URL(`../public${slot.src}`, import.meta.url)) ? "yes" : "—";
    const description = [slot.alt, slot.note].filter(Boolean).join(" ").replace(/\|/g, "\\|");
    lines.push(`| \`${slot.src}\` | ${slot.ratio} | ${have} | ${description} |`);
  }
  lines.push("");
}

writeFileSync(new URL("../public/media/MANIFEST.md", import.meta.url), lines.join("\n"));
console.log(`wrote public/media/MANIFEST.md — ${slots.length} slots, ${missing.length} missing`);
