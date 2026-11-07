# Dynasty Lab — handoff: Claude → GPT (2026-11-07)

This is context for checking and continuing Mark's work. **Mark's newest request and current project instructions take precedence over this document.** Verify against the actual source before trusting any claim here.

## Where the work is

- Repository: `markjrogers92/football`, branch **`claude/gracious-rubin-mfi574`** (pushed). No pull request has been opened.
- Base: `252a784` (v0.14.1). Source version is still **0.14.1**; nothing was released, published, packaged or installed. `CHANGELOG.md` has an **Unreleased** section describing everything below.
- Commits on the branch, oldest first:
  1. `174e44c` — restores the uncommitted 2026-11-06 recruiting-desk package from the Codex handoff bundle (all 46 manifest hashes matched; rebuilt `index.html` was byte-identical; `npm test` 541 passed).
  2. `5ac743a` — Visual identity v2 "Midnight & Brass".
  3. `9d506e5` — Season pulse helmets; stop CSS-uppercasing real labels (a test reads `innerText`).
  4. `e700656` — Cohesion and fun pass.
  5. `cee6f4c` — Sound, storylines, legacy, Rivalry Week, highlights, yearbook.
- Docs to read first: `VISUAL_IDENTITY.md` (architecture and source-of-truth table for every new visual), `CHANGELOG.md` › Unreleased, `agent_docs/latest_session_work.md` (top three entries). The earlier Codex handoff is `agent_docs/CLAUDE_HANDOFF_2026-11-06_DYNASTY_LAB.md`.

## Mark's direction (keep honoring it)

- Fewer menus, condensed and clean; one consistent menu language. Do not add dropdown/menu hierarchies.
- A real visual identity, more pictures/graphs, effects — but readable.
- Make it fun: "turn a $5 game into a $30 game".
- Player storylines must be **smart, evidence-based, never random**; league-wide stories wanted.
- **Difficulty settings are explicitly deferred** — do not start them without Mark. The setup screen says difficulty needs real simulation support, and earlier guidance says no balance tuning without a defined target and measurements (`tools/longrun.js`).
- Working agreement from earlier handoffs: plain explanations; preserve unrelated edits; never weaken tests or change timing thresholds to get a pass; run affected checks after changes and broad checks once stable; edit sources and rebuild `index.html` with `npm run build` (never hand-edit `index.html`).

## Architecture rules used for everything new

- **Presentation only.** No simulation, balance, save-shape or gameplay-RNG changes. Every new data read goes through a read-only *engine-extension adapter* (listed in `engineExtensionFiles` in `tools/build.js`, so it shares `app.js`'s closure) that copies values out; DOM modules read only the adapter or rendered DOM.
- Tests check that features never advance time or draw randomness by comparing `window.__DL_TEST__.preseasonDebug()` before and after.
- No `Math.random` in new code (confetti, noise buffers, choices are deterministic).
- Device-level data (sound preferences, legacy) lives in `localStorage` (`dynastyLabSound`, `dynastyLabLegacy`), never in the dynasty save.
- Modal ceremonies and sound stay off under `navigator.webdriver` unless a test opts in (`DynastyCeremonies.autoplay=true`, `DynastySound.enableForTests()`), so they cannot block other browser tests.
- `brand-identity.css` is loaded last in the cascade. Rival Watch uses the **`rvw-`** class prefix — `rw-` belongs to the recruiting workspace (a collision broke `recruiting-tools-browser` once).

## What was built (by file)

| Feature | Files |
|---|---|
| Identity: Barlow Condensed (OFL, vendored in `assets/fonts/`), brass accent, team colour, chalk play texture, unified tabs/segmented controls, motion with reduced-motion support | `brand-identity.css`, `brand-visuals.js` |
| Dashboard helmet + season strip, matchup helmets, Season pulse helmets, Program Lab radar/gauge/goals ring/win pace, roster portraits + estimate-range bars (25–99), stat-leader bars | `brand-visuals.js`, `brand-snapshot-adapter.js`, `roster-depth-experience.js`, `app.js` (`statLeaderRows`, `leaderShare`) |
| One navigation map: page-tab groups = sidebar sections (Home, Program, Recruiting, Season, World) | `app.js` `TAB_GROUPS`, `client-shell.js`, `game-hud.js`, `body.html`; test group helpers updated |
| Face chips on decisions and leaders | `app.js` `playerFaceChip`, `decisionFacesHTML` |
| Hidden duplicate status line; plain subtitles; "How to read this" keys | `brand-identity.css`, `body.html`, `brand-visuals.js` `LEGENDS` |
| Coach It Live + live win-chance estimate/graph | `gameday-momentum.js` (pure), `game-engine-v2-gameday-ui.js`, `body.html` `#coachLiveGame` |
| Rival Watch (archetype from real coach ratings, fact-tied pressure lines) | `rival-snapshot-adapter.js`, `rival-watch.js` |
| Ceremonies (national, conference, bowl, rivalry, signing day, draft) | `ceremony-snapshot-adapter.js`, `ceremonies.js` |
| Synthesized sound | `sound.js` (`renderWav(cue)` renders a cue for review) |
| Storylines + award race | `storyline-snapshot-adapter.js`, `storylines.js` |
| Legacy page (achievements, records across saves, hall of fame, challenges) | `legacy-snapshot-adapter.js`, `legacy.js`, `body.html` `#legacy` |
| Rivalry Week ribbon, highlights card, printable yearbook | `season-moments-adapter.js`, `season-moments.js` |

## Verification

Commands (Chromium in this environment: `CHROMIUM_PATH=/opt/pw-browsers/chromium`):

```sh
npm run build
npm test
npm run test:browser
npm run test:browser-extended
```

New tests: `tests/brand-visuals.js`, `tests/gameday-momentum.js`, `tests/rival-ceremonies.js`, `tests/storylines.js`, `tests/legacy.js` (Node, in `npm test`); `tests/brand-identity-browser.js`, `tests/fun-features-browser.js`, `tests/season-features-browser.js` (browser, in `test:browser-extended`).

Results recorded so far:
- After `e700656`: `npm test` passed (all Node tests); `npm run test:browser` passed. The extended run had three failures, all addressed in `cee6f4c`: `recruiting-tools-browser` (the `rw-` class collision, fixed), `roster-depth-experience-browser` (a protected formation-view sentence had been cut; restored), and `weekly-desk-browser` (passes in isolation; that run overlapped with screenshot jobs).
- On `cee6f4c` before commit, in isolation: `recruiting-tools-browser`, `roster-depth-experience-browser`, `weekly-desk-browser`, `fun-features-browser` and `season-features-browser` all passed.
- **Full matrices on `cee6f4c`:** see the status line at the end of this file.
- Known timing sensitivity: avoid running browser suites in parallel with other heavy browser jobs; an earlier session documented an unchanged 4-second desktop timing check that can fail under contention.

## Known gaps and honest limits

- Signing Day and Draft Night ceremonies are covered by unit tests only (reaching them needs a full offseason run in a browser).
- Storylines are thin in a new dynasty's first season (generated starting players have no history or recruit origin); history-based arcs appear from season two. Walk-on and captain arcs were not invented because the game does not model them.
- Win chance is a labelled presentation estimate (score, time, possession, field position, home field); it is not the simulation's own probability.
- Highlights list play-by-play only for coached/watched games (simmed games keep no play log); every game shows box-score performers.
- Legacy and sound preferences are per device (`localStorage`), not synced.
- The yearbook prints via the browser print dialog; there is no image export (canvas export of file:// assets would be tainted).
- Matchup surfaces share one visual language but are still separate components (tests depend on each).
- Not verified: packaged desktop app, real iPhone/Safari, release pipeline (`node tools/publish.js --verify` requires committed clean source and a release decision).

## Suggested next steps (confirm with Mark first)

1. Review the full-matrix results for `cee6f4c` and fix anything red without weakening tests.
2. Play a two-season browser run to see history-based storylines, Signing Day and Draft Night ceremonies, and Legacy records/hall of fame in practice; screenshot desktop and phone.
3. Listen to the sound cues (`DynastySound.renderWav`) and tune; swap in recorded audio only if Mark wants.
4. Remaining ideas Mark liked but not yet built: official-visit weekends, hot-seat meetings with the AD, helmet/uniform editor, shareable image export. Difficulty stays deferred.
5. Release only on Mark's explicit authorization: version bump, changelog, clean-source checks, publish/desktop packaging as requested.

## Status of the final test run on `cee6f4c`

Pending at the time of writing (Node suite running). Claude will update this line when it completes.
