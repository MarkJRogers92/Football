# Dynasty Lab — local upgrades handoff

**Current consolidated handoff:** `agent_docs/CLAUDE_HANDOFF_2026-11-06_DYNASTY_LAB.md`. Use its final state and recovery bundle; this document retains earlier checkpoint context.

Development started November 4, 2026; final verification recorded November 5, 2026. These changes are local and unreleased. No commit, push, merge, publication, version bump or desktop installation was performed.

## November 6 continuation

The active worktree now also includes consistent recruiting counts/search, compact Workspace filters and a dedicated phone dossier. Back preserves the selected prospect, loaded-card count, list/page scroll and keyboard focus. Removing the open My Board prospect returns to a safe list control; filter refresh and responsive transitions retain visible keyboard focus. Desktop keeps the side-by-side dossier and Table keeps inline filters.

Verification: 44 targeted recruiting/scouting tests; filter lifecycle; 33 Workspace and 35 presentation browser checks; the new phone-layout regression; and broad browser smoke 119 checks passed. The initial concurrent smoke run exceeded its 4-second desktop timing limit (4281ms); an isolated rerun passed unchanged thresholds. The earlier full engine suite below was not repeated for this UI-only addition. Run `npm run test:recruiting-phone-browser`. Previews/measurements are `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-workspace/`.

Subsequent work completed the Current/Rising/Roster outlook peer views and position shortcuts. The read-only projection separates returning/pending committed counts from current targets and future watches, and respects same-year departure/enrollment checkpoints. Verification: 47 targeted tests, class-view/legacy recruiting browser suites and 119 smoke checks passed. See the latest session entry for the exact scope and supplemental review limits. The subsequent focused Map/Shortlist/Class summary/History package is now implemented and verified (54 targeted tests, desktop/phone flow checks and 119 smoke checks). Mark requested fewer menus and condensed/clean UI; all views use one direct, scrollable strip rather than a dropdown. Existing action handlers are retained, shared evaluation hours remain on the desk, and History uses its own receipt-backed host. See the latest session entry and `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-tools/` for previews. Next: visual-density review before release scope. The recovery ZIP below is the earlier snapshot; latest edits are in the active worktree. See `latest_session_work.md` for current details.

## Resume here

- **Working directory:** `/Users/markrogers/.codex/worktrees/recruiting-weekly-desk/Football`
- **Branch:** `codex/recruiting-weekly-desk`
- **Base:** `252a784e8a55ae48d09920be396d709b8e60dd7a`, v0.14.1.
- The older original checkout `/Users/markrogers/.copilot/repos/Football` remains at `d1d2975` with Mark's existing `tools/render-meshy-trophy.py` edit. Preserve it. Do not continue this package there.
- Dependencies are a local `node_modules` symlink to the original checkout; the symlink is locally ignored. No dependency changes were needed.

## Completed work

1. **Trustworthy recruiting explanations.** `app.js` now uses `recruitPitchBreakdown` for the actual pitch as well as its explanation. Correct prestige weights are 0.42 and an additional 0.22 for Prestige priority. Academics and season record are included. Arithmetic order is preserved. A complete fixed-seed season, championships and playoff serialize identically before/after; no recruiting balance change was made.
2. **Shorter weekly desk.** A compact program header and the existing primary action lead the page. The summary names the exact blocking decision. Required choices stay accessible; optional game planning is labeled optional and lives under the briefing disclosure. Program ratings and secondary simulation controls also fold. Returning from an agenda item opens the correct disclosure and weekly view. Welcome-back messages stay visible. No simulation gates or save format changed.
3. **Honest season win charts.** `programTrendsHTML` scales to the displayed wins/expectations, with a twelve-win minimum scale. Twelve, fifteen and seventeen wins now have different proportional heights instead of all hitting the ceiling. Confidence keeps its independent 0–100 scale.
4. **Complete Game Cast scoring.** `game-cast.js` recognizes successful two-point tries and safeties, avoids double-counting during drive reconciliation, and excludes failed tries. Score cells now follow the advertised away–home order. The archive and final results are not rewritten.

The matched seed-7 phone fixture had the same two required decisions before and after. Page height fell from **4,587 to 1,851px** (about 60%); the primary action moved from y=1,185 to y=472. Its title and action fit the first 390×844 screen with zero horizontal overflow. This measurement is for that fixture, not every possible dynasty state.

## Verification

**Final state:** a fresh full `npm test` run after all four implementation groups passed **53 smoke checks and 538 Node tests, zero failures**. The targeted browser follow-up and independent review also completed. The full run finished after the original seven-minute development window; no new feature work was added after that window.

- Recruiting/desk baseline: full `npm test` passed **53 smoke checks and 536 Node tests**.
- Targeted browser runs passed for the new desk, preseason, guidance, first-season flow, postseason navigation, main browser smoke (119 checks), Game Engine postseason/cutover, UI/review polish, visual checks (35), recruiting visuals (21), and browser persistence (6 scenarios).
- Final chart/scoring regressions failed before their fixes and passed after; **13 focused tests** cover Game Cast, field replay and program charts, including rendered score order, failed conversions, archive immutability and proportional postseason win heights.
- Independent DeepSeek review found no confirmed correctness regressions in recruiting/desk code. It independently checked source arithmetic/gates, optional-choice routing, 80 seeded gameplan fixtures and exact generated-build parity. It excluded the concurrent chart/scoring changes; those received direct review and the focused regressions above.
- Final browser follow-up: Game Cast 3D replay at 390px and UI upgrades at desktop/phone widths passed.
- Build, documentation consistency and diff whitespace checks passed earlier. The source version remains 0.14.1.
- `node tools/publish.js --verify` stops at its clean-source requirement while this work remains uncommitted. This is not a publication attempt.
- **Not verified:** packaged desktop behavior and the entire browser/e2e matrix. Focused browser coverage is extensive but is not the full matrix.

## Files and continuation

- Core calculation and chart/decision rendering: `app.js`.
- Desk markup/layout/navigation: `body.html`, `dashboard-views.css`, `dashboard-views.js`, `guidance-system-ui.js`, `next-action.js`.
- Game Cast: `game-cast.js`.
- New regression files: `tests/recruit-pitch-explanation.js`, `tests/weekly-desk-browser.js`; additional cases in `tests/game-cast.js`, `tests/ui-upgrades.js`, `tests/next-action.js`.
- Existing browser checks now open the real disclosures before inspecting moved controls; their behavior assertions were retained.
- `index.html` is rebuilt output. Make future changes in source files and run `npm run build`.
- `npm run test:weekly-desk-browser` runs the desk regression. Set `DYNASTY_DESK_SCREENSHOT_DIR` only when screenshots are wanted; the default test does not depend on an absolute output folder.

Next: review this uncommitted package, keeping the recruiting fix, desk and chart/scoring corrections distinguishable. Do not commit, push or release without Mark's authorization. Once authorized, perform the version/changelog and release checks appropriate to the chosen release; package/install only if included in that authorization. Do not rerun already reliable checks without new changes or a specific unresolved concern.

For further feature work, follow the saved roadmap: recruiting workflow/count clarity, clearer program and player history, then broader visual improvements and long-save responsiveness. Avoid further balance tuning without a stated design target and measured season comparisons.

## Roadmap and evidence

All review artifacts are in `/Users/markrogers/Documents/Codex/2026-11-04/dynasty-upgrade-review/`:

- `ROADMAP.html`: the complete prioritized roadmap, with implementation status.
- `weekly-desk-desktop.png`, `weekly-desk-phone.png`: current layout previews.
- `weekly-desk-before-same-seed.png`, `weekly-desk-after-same-seed.png`, `weekly-desk-comparison.json`: matched before/after evidence.
- `pitch-parity.json`: complete-season equality proof with seed and hashes.
- `implementation-verification.json`: structured verification record.

The `source/` directory in that review folder is a read-only baseline snapshot, not the active implementation checkout.

## Recovery copy

`/Users/markrogers/Documents/Codex/2026-11-04/dynasty-upgrade-review/DYNASTY_LOCAL_UPGRADES_2026-11-04.zip` contains the changed source files, new tests, this handoff, a tracked-change patch, the roadmap, verification records and current previews. A manifest records the base commit and SHA-256 of each source file. It is a recovery copy, not a full checkout or desktop installer. The active worktree remains the source of truth.
