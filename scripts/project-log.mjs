#!/usr/bin/env node
/**
 * Appends a dated entry to docs/PROJECT-LOG.md describing what changed.
 *
 * Two things call it, which between them cover everything that happens here:
 *
 *   · a Claude Code `Stop` hook, when a session finishes a turn
 *   · a git `post-commit` hook, for work done by hand
 *
 * It compares the repository against the state it recorded last time and writes
 * nothing when nothing moved, so a session spent reading — or a turn that only
 * answered a question — leaves no entry. A log that records "nothing happened"
 * fifty times a day is a log nobody reads.
 *
 * The state file lives in .claude/ and is gitignored: it is a local watermark,
 * not shared history, and committing it would make every pull a conflict.
 *
 * Usage:
 *   node scripts/project-log.mjs                 # detect and append
 *   node scripts/project-log.mjs --note "text"   # append a manual note
 *   node scripts/project-log.mjs --source commit # label the entry's origin
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOG = join(root, "docs", "PROJECT-LOG.md");
const STATE = join(root, ".claude", ".project-log-state.json");

/** Files that change constantly and say nothing about the project. */
const NOISE = [/^\.claude\//, /^docs\/PROJECT-LOG\.md$/, /\.tsbuildinfo$/, /^dev\.db/];

function git(...args) {
  try {
    // `trimEnd`, not `trim`. Porcelain status lines begin with a two-character
    // status field that is often " M" — trimming the front strips that leading
    // space off the first line only, and every path then loses a character.
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trimEnd();
  } catch {
    return "";
  }
}

function readState() {
  try {
    return JSON.parse(readFileSync(STATE, "utf8"));
  } catch {
    return { head: null, files: {} };
  }
}

function writeState(state) {
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
}

/**
 * Every file that differs from HEAD, plus its size — enough to detect a change
 * without hashing the whole tree on every keystroke.
 */
function worktree() {
  const out = git("status", "--porcelain=v1");
  const files = {};
  for (const line of out.split("\n").filter(Boolean)) {
    // "XY path", where XY is exactly two characters. A rename reads
    // "R  old -> new"; the new name is the one worth recording.
    const path = line.slice(3).replace(/^"(.*)"$/, "$1").split(" -> ").pop();
    if (NOISE.some((pattern) => pattern.test(path))) continue;
    files[path] = line.slice(0, 2).trim();
  }
  return files;
}

/** Insertions and deletions against HEAD, for a sense of scale. */
function diffStat() {
  const out = git("diff", "--shortstat", "HEAD");
  const insertions = /(\d+) insertion/.exec(out)?.[1];
  const deletions = /(\d+) deletion/.exec(out)?.[1];
  return { insertions: Number(insertions ?? 0), deletions: Number(deletions ?? 0) };
}

function stamp() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
}

/** Group changed paths by the area of the project they belong to. */
function areas(paths) {
  const map = new Map();
  for (const path of paths) {
    let area = "other";
    if (path.startsWith("mobile/")) area = "app";
    else if (path.startsWith("src/i18n/")) area = "copy and locales";
    else if (path.startsWith("src/lib/shop/")) area = "shop";
    else if (path.startsWith("src/lib/health/")) area = "health and scoring";
    else if (path.startsWith("src/components/") || path.startsWith("src/app/")) area = "website";
    else if (path.startsWith("src/lib/")) area = "server";
    else if (path.startsWith("docs/")) area = "docs";
    else if (path.startsWith("scripts/")) area = "tooling";
    else if (path.startsWith("prisma/")) area = "database";
    else if (path.startsWith("public/")) area = "media";
    if (!map.has(area)) map.set(area, []);
    map.get(area).push(path);
  }
  return map;
}

function ensureLog() {
  if (existsSync(LOG)) return;
  mkdirSync(dirname(LOG), { recursive: true });
  writeFileSync(
    LOG,
    `# Project log

Every change to Terrifit, recorded automatically.

Appended to by a Claude Code \`Stop\` hook when a session finishes a turn, and by
a git \`post-commit\` hook for work done by hand. Newest entries are at the
bottom, so the file reads in the order things happened.

Nothing is written when nothing changed. Add a note by hand with:

\`\`\`bash
node scripts/project-log.mjs --note "what you did and why"
\`\`\`

The *why* is the part worth writing. Git already knows what changed.

---
`,
  );
}

function main() {
  const args = process.argv.slice(2);
  const noteIndex = args.indexOf("--note");
  const note = noteIndex >= 0 ? args[noteIndex + 1] : null;
  const sourceIndex = args.indexOf("--source");
  const source = sourceIndex >= 0 ? args[sourceIndex + 1] : "session";

  ensureLog();

  const { date, time } = stamp();
  const head = git("rev-parse", "--short", "HEAD");
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const state = readState();
  const files = worktree();

  // A manual note is always recorded — the whole point is that the author
  // decided it mattered, whether or not a file moved.
  if (note) {
    appendFileSync(LOG, `\n## ${date} · ${time} · note\n\n${note}\n`);
    writeState({ head, files });
    console.log("Logged a note.");
    return;
  }

  const changed = Object.keys(files).filter((path) => state.files?.[path] !== files[path]);
  const removed = Object.keys(state.files ?? {}).filter((path) => !(path in files));
  const committed = state.head && head && state.head !== head;

  if (changed.length === 0 && removed.length === 0 && !committed) {
    // Silence is the correct output. Nothing moved.
    return;
  }

  const { insertions, deletions } = diffStat();
  const lines = [`\n## ${date} · ${time}`, ""];

  if (committed) {
    const subject = git("log", "-1", "--pretty=%s");
    lines.push(`**Committed** \`${head}\` on \`${branch}\` — ${subject}`, "");
  }

  if (changed.length) {
    const scale = insertions || deletions ? ` · +${insertions} −${deletions}` : "";
    lines.push(`**Working tree** — ${changed.length} file${changed.length === 1 ? "" : "s"}${scale}`, "");
    for (const [area, paths] of areas(changed)) {
      lines.push(`- **${area}** — ${paths.slice(0, 6).map((p) => `\`${p}\``).join(", ")}${paths.length > 6 ? ` and ${paths.length - 6} more` : ""}`);
    }
    lines.push("");
  }

  if (removed.length) {
    lines.push(`**Reverted or committed** — ${removed.length} file${removed.length === 1 ? "" : "s"} no longer differ from HEAD`, "");
  }

  lines.push(
    `<sub>Recorded automatically from ${source}. Add the reasoning with \`node scripts/project-log.mjs --note "…"\`.</sub>`,
  );

  appendFileSync(LOG, lines.join("\n") + "\n");
  writeState({ head, files });
}

main();
