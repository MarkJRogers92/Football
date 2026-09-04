# Dynasty Lab — Commercial Polish Audit

Base: `ac2e4fe` (v0.9.13). Reviewed as a $20–30 sports-management game, desktop 1280px and 390px.
Target feel: OOTP-style depth with a broadcast / front-office presentation. Scope is
presentation only — no simulation, storage, schema, save-format or recruiting-mechanics changes.

Method: Playwright screenshots of Dashboard (preseason + week 3), Recruiting board, Recruit
Profile, Roster, Player Profile, Season, Game Center, Staff, Game Lab at both widths, plus a
read of `styles.css`, `visual-identity.css`, `sports-*.css`, `team-branding.css`,
`recruit-presentation.css` and `body.html`.

## Ranked issues

Columns: Visual impact / UX impact / Effort / Regression risk.

| # | Issue | Vis | UX | Effort | Risk | Status |
|---|-------|-----|----|--------|------|--------|
| 1 | **Dashboard has no single hero.** Program card, Dynasty Status card, broadcast strip and Command Center compete at equal weight. Record/rank are split from team identity; next matchup appears twice (broadcast strip + NEXT UP hub tile); the last result appears twice (LAST RESULT aside + FINAL tile). No 5-second read. | High | High | Medium | Small | DONE |
| 2 | **Hub tiles are undifferentiated.** Every weekly-hub item is the same 94px box with a coloured left edge; urgent (wavering commit, injury) sits beside informational (rankings) and completed (final). Weekly plan is a box inside the Command Center box. | High | High | Small | Small | DONE |
| 3 | **Typography has no scale.** Eyebrows run 9/10/11px, hero-rail labels are 7px (illegible), card `h3` is 15px against a 22px page `h2`, stat values vary 18–56px ad hoc. Nothing is tokenised so every surface picks its own sizes. | High | Med | Small | Small | DONE |
| 4 | **Decoration reads SaaS, not sports.** Sheen `::before` on every card, radial gradients on hero cards, decorative concentric circles, glow shadows on tabs and marks. Depth comes from effects instead of hierarchy. | High | Low | Small | Small | DONE |
| 5 | **Player profile body is a flat wall.** Hero is good; below it, scouting, development, health, promises and career are equal-weight key/value rows with no section rhythm. Mobile hero rail collapses to a 2×2 grid where the position chip wastes a cell. | High | High | Medium | Small | DONE |
| 6 | **Recruit profile has a layout bug and no dossier structure.** Desktop Close button renders full-width under the identity row. Hometown/HS/Distance/Interest are four identical cards; the race and pitch are fine but nothing frames the page as a scouting dossier. | High | Med | Small | Small | DONE |
| 7 | **Recruiting board is a 14-column spreadsheet.** 44px portraits, every cell the same weight, stars/rank/interest not scannable, commitment state buried in the Interest column. Three stacked cards (class summary, signing class, battles) precede the table. | Med | High | Medium | Medium | PARTIAL |
| 8 | **Game Center has no scoreboard.** The score is a 24px text headline "A 10 — 23 B"; winner is not marked; FINAL/pregame lines are plain paragraphs; section tabs are generic buttons. | High | Med | Medium | Small | DONE |
| 9 | **Status UI is inconsistent.** `.pill`, `.scheme-badge`, `.battle-school`, plan-count pill and uppercase-tracked text ("FULLY INSTALLED", specialty lines on Staff) all mean "status" with different treatments; health/morale are colour-only text. | Med | Med | Small | Small | DONE |
| 10 | **Shell and mobile chrome are heavy.** 14 flat tabs overflow at 1280 and 390 with only an edge fade; on 390px the topbar wraps five save/load buttons into two rows (~110px) above a status strip, so the first screen shows almost no game. | Med | High | Medium | Medium | PARTIAL |

Also noted, not ranked: Staff cards have no portraits and shout their specialties in tracked
caps; Season "Latest Results" rows carry no team marks; Top 15 / Snapshot lists on the
Dashboard are the same `.rankrow` style as everything else.

## Plan

Phase 2 addresses 1, 2 and part of 4 (Dashboard). Phase 3 addresses 3, 4, 9 and the CSS
half of 10 (design system tokens, card variants, chips, tables, portrait frames). Phase 4
addresses 5 and 6. Phase 5 addresses 7. Phase 6 addresses 8.

Status legend: DONE / PARTIAL / NOT STARTED — updated at the end of the pass.

## Outcome notes

- **7 (Recruiting) PARTIAL** — row hierarchy, chips, stars, targeted-row edge and column
  fit are done. Not done: recruit portraits are still 40px, the class summary / signing
  class / battles stack still precedes the table, and scout confidence has no visual.
- **10 (Shell) PARTIAL** — tabs are grouped with separators and the 390px header is
  compact. Not done: a real grouped or two-level navigation and a first-run path.
- Everything landed in `polish.css` (loaded last by `tools/build.js`) plus small markup
  changes in `body.html`, presentation JS in `sports-presentation.js` and
  `visual-identity.js`, and markup-only edits in `app.js` (profile sections, recruit
  chips, Top 15 highlight). No simulation, storage or save-format code changed.
