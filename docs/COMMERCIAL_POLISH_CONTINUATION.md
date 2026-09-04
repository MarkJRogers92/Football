# Dynasty Lab — commercial polish pass: continuation note

**Branches:** `claude/commercial-polish-pass` (as requested) and
`claude/dynasty-lab-handoff-6a0kc9` (session branch) carry identical history.
Based on `ac2e4fe` (v0.9.13, the validated checkpoint). Version was NOT bumped;
the build still reports v0.9.13.

**Latest code SHA:** `61b67c4` (Game Center). The docs commit after it changes no code.

**Preview:** https://markjrogers92.github.io/Football/preview/commercial-polish-pass/
Production was not touched.

## Completed modules (one commit each, all pushed)

1. `Audit commercial UI and UX polish` — `docs/COMMERCIAL_POLISH_AUDIT.md`
2. `Polish flagship Dynasty Lab dashboard` — single program masthead, plan + wire
   command center, urgency-ordered hub tiles, promoted tiles collapse to one-line links,
   Game Center button in the result aside, Top 15 team marks + highlighted row.
3. `Normalize Dynasty Lab visual system` — tokens, flat card variants, button/chip
   families, table rules, portrait frames, grouped tabs, compact 390px header.
4. `Polish player and recruit profiles` — sectioned personnel file / scouting dossier.
5. `Polish recruiting presentation` — chips, gold stars, weighted rank/interest,
   column fit at 1280px.
6. `Polish Game Center presentation` — scoreboard, segmented section control.

## Validation

`npm test` (53 smoke + 76 node) and `npm run test:browser` (133 checks across the three
Chromium suites) pass on `61b67c4`. Desktop 1280px and 390px were checked by Playwright
screenshot at every module. No real iPhone Safari testing was performed.

## Where the polish lives

- `polish.css` — the whole pass, in commented sections (dashboard, design system,
  profiles, recruiting, Game Center). Loaded last by `tools/build.js`.
- `body.html` — dashboard section restructured (`.program-masthead`, `.command-grid`,
  `.hub-wire`); `#classSummary` gets `card--compact`.
- `sports-presentation.js` — `.program-masthead` hero selector, `hub-promoted` /
  `hub-quiet` classes, `data-sports-final` button, `top15()` marks, `gamecenter()`
  scoreboard. Everything reads rendered DOM only.
- `visual-identity.js` — stamps `data-team-mark` on `.masthead-mark`.
- `visual-identity.css`, `team-branding.css` — the old two-card hero rules were removed.
- `app.js` — markup-only: profile body sections, recruit commit/wavering chips, gold
  `.stars`, `interest-val`, Top 15 `.target` row.

## Next recommended module

Recruiting, second pass: 48px recruit portraits in the row, a scout-confidence meter,
and collapsing class summary + signing class + battles into one header band above the
table. Then shell navigation: group the 14 tabs (Program / Season / Recruiting /
Offseason / History) and add a first-run path from the Dashboard.

## Known limitations

- Hub tiles are ordered by CSS `order` per type, not by the engine's `importance`
  values; the engine still slices the first 9 in insertion order (see handoff item A).
- Roster, Staff, Season, Stats and Development tabs only received the shared design
  system; no screen-specific hierarchy work.
- Staff cards still shout specialties in tracked caps and have no coach portraits.
- The 390px header is still three rows (title, program picker, five save buttons).
- Reusable variant classes (`card--elevated/alert/hero/compact`, `btn-quiet/danger`,
  `pill--*`) exist but are applied only where this pass touched.
