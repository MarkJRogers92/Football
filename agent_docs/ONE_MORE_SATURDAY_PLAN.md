# One More Saturday implementation plan

**Goal:** Give Dynasty Lab a deliberate football identity and a rewarding weekly loop that is easy to leave and resume.

**Authorization:** Mark approved all seven proposed improvements and unattended implementation, with subagents allowed. Continue without intermediate approvals. Work on `codex/one-more-saturday` from `07abb2c` in the existing isolated implementation clone.

**Architecture:** Reuse the existing Midnight & Brass identity, guidance, game archive, season moments, follow system, and persistence. Keep simulation rules and random state unchanged. Extend existing views rather than introducing navigation or a second news feed.

**Tech stack:** Standalone HTML assembled by `tools/build.js`, plain JavaScript and CSS, Node tests, Playwright browser checks, Electron packaging.

## Accepted design

1. Give the weekly desk, scouting board, game presentation, and season history distinct compositions within the existing navigation.
2. Replace software/laboratory terminology with natural football language, retaining concise explanations where actions affect recorded results.
3. Make the weekly rhythm legible: changes, meaningful choices, game, consequences. Preserve existing required decisions; allow quiet weeks and existing delegation. Three to five minutes is a design target, not a measured promise.
4. Give every completed game a compact, factual payoff: score, standout, consequence, and next opponent. Provide a clear optional stopping point without a modal or acknowledgement gate.
5. Extend re-entry with last result, current priority, pending choice, preserved view context, and truthful saving/saved/failure status. Do not promise midgame persistence or change the native save format.
6. Make the dynasty's accumulated history visible through existing history/yearbook/follow surfaces: recorded classes, recurring people, and rivalry meetings. Never infer recruitment, a first achievement, or causation from missing evidence.
7. Quiet routine presentation: remove gratuitous repeated motion, button sweeps and glows, reduce generic repeated card treatment, preserve earned milestone ceremonies and reduced-motion support.

## Constraints

- No balance, gameplay RNG, save-schema, dependency, difficulty, or forced weekly task changes.
- Preserve existing functionality, canonical entity links, keyboard access, phone layouts, and factual-history guarantees.
- Do not edit the original checkout's unrelated trophy work, other worktrees, installed game, or user saves.
- Keep stable DOM IDs and data attributes when changing visible labels; update exact-copy tests to match intentional wording without weakening assertions.
- Agents own disjoint files; controller owns build wiring, package scripts, integration, documentation, and final commits. Do not regenerate index.html concurrently.
- Use real test fixtures; report browser launch restrictions honestly if they remain.

## Tasks

### A. Football compositions and restraint (items 1, 7)

Owner: visual worker. Modify `brand-identity.css` and narrowly scoped presentation CSS only. Use existing semantic roots and page structures. Retain the palette and useful charts. Give the weekly desk a front-page hierarchy, recruiting a compact scouting-sheet treatment, Game Day a field/scoreboard focus, and History an almanac layout. Remove routine entrance replay, button light sweeps and attention pulses; retain state feedback and meaningful ceremonies. Check phone, desktop, contrast, focus, reduced motion, and long names.

### B. Weekly rhythm and postgame payoff (items 3, 4)

Owner: weekly-flow worker. Extend `season-moments-adapter.js`, `season-moments.js`, and their focused tests; any new CSS goes in a dedicated small stylesheet for controller wiring. Reuse the existing highlights card and optional disclosure instead of adding a competing summary. Surface one top performer, one supported consequence, and the next scheduled opponent; keep other highlights optional. Show a clear stopping-point line whose saving state comes from task C. Make regular/bowl/playoff/bye/season-rollover behavior factual and program-scoped. Keep advances and real blockers unchanged.

### C. Re-entry, preferences, and honest save status (item 5)

Owner: session worker. Own storage/checkpoint sections in `app.js`, `guidance-system-ui.js`, relevant guidance model functions, and new session-specific helpers/tests as needed. Extend existing welcome-back summary; preserve safe view/filter context without touching gameplay state. Track scheduled, saving, saved, disabled/unsaved, and failed states from real persistence completion. Never let status observation overwrite unrelated messages or fabricate a successful save. Coordinate an explicit read-only status API with task B. Do not modify the live-game engine or promise midgame resume.

### D. Accumulated dynasty history (item 6)

Owner: history worker. Extend `world-history-presentation-adapter.js`, `world-history-presentation.js`, `world-history-presentation.css` and focused tests, or create a narrow read-only extension if existing architecture requires it. Keep additions within existing History, linking to canonical program/player/game profiles. Prefer bounded chronological season summaries, actual signing-class progression where identities are recorded, and recent rivalry meetings. Account for deferred archives, old saves, partial history, and same-name people. Return any yearbook integration request to controller to avoid task B file overlap.

### E. Plain football language and integration (item 2)

Owner: controller. Change visible labels in `body.html`, `client-shell.js`, `game-hud.js`, `game-engine-v2-gameday-ui.js`, and other directly related presentation copy. Preserve stable selectors and internal engine names. Use “This Week,” “Game Day,” “Player Development,” and “Finish Game” where appropriate. Shorten routine explanatory boilerplate while retaining the live-game recording boundary. Integrate workers, build once, register meaningful tests, update canonical documentation, and prepare a reviewable runnable result.

## Acceptance and verification

- Pre-change version/build plumbing, 53 smoke checks, and 314 core tests passed. The full baseline run was stopped after it slowed substantially; it is not a complete baseline pass. Targeted failing behavior tests precede new logic, and a fresh complete final suite will run with bounded concurrency on the stable integrated source.
- Pure-model tests for date/phase/program isolation, absent data, ties/close losses, and correct archive reads.
- Persistence tests prove the saved indicator follows successful writes and survives failures/retries/slot or world switches.
- Browser checks at desktop and phone widths: clear weekly action, playable delegated flow, no required recap dismissal, factual postgame facts, canonical links, re-entry state, no overflow, and no console errors.
- Review final desktop/phone screenshots when browser execution is available. If local Chrome remains blocked, use available supported browser capabilities and document the exact unverified surface.
- Full `npm test`, build consistency, existing affected browser suites, whitespace check, and one independent whole-change review. Fix confirmed findings and rerun only affected checks, plus a final full suite when product code changed.
- No public publishing, merge, or installed-app replacement is required. Produce the tested source and, if feasible, an updated local Mac package with an exact continuation path.

## Review focus

- A reloaded or older save must never show another program's or a future season's recap.
- Saving queued work, completed persistence, failed persistence, and autosave disabled are visibly distinct.
- Navigation restoration must not mutate simulation, spend resources, or activate hidden controls.
- History must use IDs and authoritative stored events, handle deferred archives explicitly, and avoid expensive repeated full scans.
- Optional highlights and contextual history remain optional and keyboard reachable; normal advancement must not gain a new blocker.

## Preflight ownership check

| Tasks | Shared interface | Decision |
|---|---|---|
| A / B / C / D | Shared visual tokens and page roots | A owns the identity stylesheet; other workers add component classes, no edits to A's file. |
| B / C | Stopping point and persistence | C exposes a read-only save-status API; B consumes it without initiating persistence. |
| B / D | Season moments and history | B owns season-moments files; D owns world-history files. Controller handles any cross-link. |
| C / E | app.js and copy | C exclusively owns app.js until completion; E makes copy changes afterward. |
| All / E | Build and tests | E alone edits build wiring, package scripts, and generated index.html. |
| A | Presentation versus game rules | CSS only; no gameplay changes. |
| B | New payoff versus existing highlights | Replace/restructure the existing highlights surface; do not add a second recap feed. |
| C | Clear saved state versus save compatibility | Observe real writes; no schema migration or live-session serialization. |
| D | Personal history versus unsupported narrative | Display recorded facts and omit unsupported claims. |
| E | Natural copy versus stable behavior | Preserve IDs, data attributes, action handlers, and honest commit boundary. |

Ruling: Mark's unattended instruction authorizes the concrete design above and implementation without another plan-approval pause. Local commits are reviewable; publishing and installation remain outside this pass.

Ruling: Stop the slow initial full sweep once the pre-change smoke/build and 314 core checks have passed, and continue implementation. Run the entire final test list with bounded concurrency after integration rather than holding all workers on an additional long baseline. The interrupted sweep is not reported as a complete pass.

## Progress

- [x] Pre-change checks recorded; full initial sweep interrupted, not counted as final evidence.
- [x] A: football compositions and restraint.
- [x] B: weekly rhythm and postgame payoff.
- [x] C: re-entry and honest saved state.
- [x] D: accumulated dynasty history.
- [x] E: football copy and integration.
- [x] Final verification, independent review, and handoff.

Final evidence: 638/638 Node tests and 53/53 smoke checks pass; build, documentation, signature and ZIP checks pass. Native Safari desktop/phone and cold re-entry were reviewed. Automated Chrome remains blocked before page load. The source and Mac playtest package stay local on the feature branch.
