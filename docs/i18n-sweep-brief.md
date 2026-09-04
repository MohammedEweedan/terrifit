# Brief: finish the internationalisation sweep

**Status:** ready to run. Blocked on two things — see *Before this can run* below.
**Written:** 2026-09-04.
**Intended for:** a scheduled cloud agent, or whoever picks this up next.

**Goal:** no user-facing English anywhere outside the `en` locale, and no
per-key fallback to English. Ten locales: en, es, ar, fr, de, nl, pt, it, tr, ru.

---

## Before this can run

Two blockers, in order:

1. **Connect GitHub.** Creating the routine was refused with *"Connect your
   GitHub account before saving a routine that uses a GitHub repository."* Run
   `/web-setup` in Claude Code, or install the Claude GitHub App on
   `meweedan/terrifit` at <https://claude.ai/code/onboarding?magic=github-app-setup>.

2. **Push the work.** This is the one that actually matters. As of writing,
   `origin/main` is at `28e67e5 Initial commit` and there are **212 uncommitted
   files** locally. A cloud agent clones from GitHub — it would start from a
   tree with none of the app, none of the shop, and none of the i18n
   infrastructure this brief assumes exists. **Push first, or the agent will
   rebuild things that already exist and conflict on the merge.**

Once both are done, create the routine with the prompt in §5.

---

## 1. Read first, in this order

1. `AGENTS.md` — this is not the Next.js you know. Read the relevant guide in
   `node_modules/next/dist/docs/` before writing any Next.js code.
2. `mobile/src/i18n/app-screens.ts` and `mobile/src/i18n/pro.ts` — the pattern
   to follow. A typed `Record<AppLocale, Copy>`, grouped by screen, complete for
   every locale. No partials, no fallbacks.
3. `mobile/src/components/AppText.tsx` — the Arabic rules are already handled
   centrally: Kufi face substitution, zero tracking, RTL text inside an LTR
   layout, and direction applied only to text that actually contains Arabic.
   **Do not reintroduce per-style Arabic handling.**
4. `src/app/globals.css`, the `[lang="ar"]` block at the end — Arabic web
   typography (line height, tracking, bidi isolation) is already fixed there.

## 2. Job 1 — server-generated copy

**Highest value. Do this one first, and completely.**

`src/lib/health/advanced.ts` generates ~55 user-facing English sentences with
interpolated numbers: labels, notes, sleep-quality details, stress drivers, the
body-battery narrative, and insight title / body / action / evidence. The mobile
app renders them verbatim, so an Arabic member sees English on the Today screen
no matter how well the client is translated. This is the single biggest
remaining source of English in the product.

- Create `src/lib/health/advanced-copy.ts`: a typed `Record<Locale, AdvancedCopy>`
  of templates using `{name}` placeholders, plus a small `fmt(template, values)`
  helper. No template library.
- Thread a locale through the five entry points in `advanced.ts` —
  `fitnessAge`, `sleepQuality`, `stressScore`, `bodyBattery`, `insights`.
  Default to `en` so existing callers keep working.
- Thread it through `loadDashboard` in `src/lib/health/dashboard.ts`, and read it
  in `src/app/api/app/dashboard/route.ts`: accept `?locale=`, validate with
  `isLocale` from `src/i18n/config`, fall back to the user's stored `locale`
  column, then `en`.
- Update `mobile/src/api.ts` so `getDashboard` sends the app's current locale.
- Format numbers with `Intl.NumberFormat` for the active locale — not a bare
  `toLocaleString()` with no argument.

## 3. Job 2 — untranslated website sections

`src/i18n/pages/*.ts` are deep partials merged over English (see
`src/i18n/pages/merge.ts`), so a missing key silently renders English and
nothing fails. On the Arabic band page today, whole sections are English: the
battery cards, the water points, the integrations list, the in-the-box list and
the entire spec table.

- Write `scripts/i18n-coverage.mjs`: walk `src/i18n/pages/en.ts`, report every
  missing leaf key per locale, print a count, exit non-zero if any are missing.
  Add it to `package.json` as `check:pages`.
- Fill in the missing keys for all nine non-English locales. Order: `ar` first,
  then `es`, `fr`, `de`, `tr`, `ru`, `pt`, `it`, `nl`.
- Translate as a native copywriter would, not literally. House style is in the
  comment at the top of `src/i18n/pages/en.ts`: full sentences the way a coach
  would say them, no three-word fragments, no "not X, Y" constructions, and if a
  claim has a number, keep the number.
- Brand names stay English: Terrifit, Terrifuel, Terrifits, V1, Maps, Apple
  Health, Google Health Connect, PowerPack.

## 4. Job 3 — remaining hard-coded strings in the app

Find them with:

```bash
cd mobile && python3 - <<'EOF'
import re, pathlib
pat = re.compile(r'>\s*([A-Z][a-zA-Z][^<>{}\n]{6,})\s*<|(?:title|label|placeholder|body|text)=["\']([A-Z][^"\']{6,})["\']')
for base in ["app", "src/components"]:
    for f in sorted(pathlib.Path(base).rglob("*.tsx")):
        s = f.read_text(encoding="utf-8")
        hits = [(h[0] or h[1]) for h in pat.findall(s) if (h[0] or h[1]).strip()]
        if hits: print(f, len(hits))
EOF
```

The two big ones are `app/onboarding.tsx` (~31) and `app/checkout.tsx` (~21).
Add `onboarding` and `checkout` namespaces to `mobile/src/i18n/app-screens.ts`,
complete for all ten locales, and wire them the way the existing screens are.

**Do not translate `app/admin.tsx` or `app/admin-product.tsx`.** They are
internal tooling behind a role check; translating a console nobody outside the
team opens buys nothing.

## 5. The agent prompt

Paste this as the routine's message once GitHub is connected and the work is
pushed. It is written to be self-contained — a cloud agent starts cold.

> You are finishing the Terrifit internationalisation sweep. Work on a branch
> and open a PR; do not push to main. Follow `docs/i18n-sweep-brief.md` in the
> repository — it contains the full brief, the reading order, and the three jobs
> in priority order. Do Job 1 completely before starting Job 2.
>
> Verify before opening the PR — all four must pass:
> `npx tsc --noEmit` at the root, `cd mobile && npx tsc --noEmit`,
> `npm run check:i18n`, and `npm run check:pages` (the script you write in Job 2).
>
> In the PR description: what you translated, what you deliberately left in
> English and why, and the before/after counts from the detection script in §4.
> If you cannot finish all three jobs, finish Job 1 completely and scope the rest
> as remaining work — a complete Job 1 is worth more than three half-done ones.

Suggested schedule: one-off `run_once_at`, 07:00 UTC (09:00 Africa/Tripoli).
Model: `claude-sonnet-5`. Environment: `env_01Gh9Bot3Jh4FfDFUXjNSuBz`.

## 6. Done when

- `npx tsc --noEmit` passes at the root and in `mobile/`
- `npm run check:i18n` passes
- `npm run check:pages` passes with zero missing keys
- The detection script in §4 reports nothing outside the two admin screens
- Switching the app to Arabic shows no English on Today, V1, Maps, Shop or You
