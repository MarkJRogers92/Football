# v0.9.53 Recruiting and Development Polish — Implementation Status

Updated: September 6, 2026

Branch: `codex/v0953-recruiting-development-polish`

Source baseline: `83815856c04cf6b00442e47958b25c79eb6848c9` (`codex/v0952-program-goals-polish`)

Production baseline: v0.9.52. Release-candidate source is now v0.9.53. Production publishing is not authorized by this workstream.

## Scope and working rules

Implementation follows the September 6 recruiting/development polish handoff. Work is divided into bounded commits that can be resumed by another model. Existing simulation mechanics and save keys are preserved unless a later milestone explicitly requires additive state.

Scouting and development-intelligence features must preserve uncertainty. Player-facing recommendations may use current scouting ranges, confidence, visible recruiting context, staff evaluation and already-observed camp/season receipts, but must not expose or rank directly from hidden `trueNow`, hidden upside, hidden development profile, hidden volatility or hidden trait values.

## Completed checkpoint: Milestone A — Archetype foundation

- Added player-facing metadata for all 69 canonical archetypes.
- Added 10 clearer display-only labels while retaining every internal `p.style` key.
- Added helper functions for labels, descriptions, strengths, and interactive chips.
- Added an Archetype Guide dialog with strengths and the existing simulation-role explanation.
- Wired the guide into roster and scouting presentation.
- Added focused regression coverage proving complete metadata, canonical-key preservation, and zero RNG consumption.

Focused validation at checkpoint: `node --test tests/archetypes.js tests/scouting.js` — 6/6 passing.

## Completed checkpoint: Milestone B — Development report capture

- Added compact before/after snapshots for development-relevant fields.
- Spring and Fall reports retain exact overall, perceived-rating, upside-read, seven-trait, body, familiarity, scouting-confidence, health, and wear deltas.
- Reports retain player and team training focuses.
- Spring development joins Fall camp in compact per-player camp history.
- Added team and position-group summary helpers.

Focused validation at checkpoint: `npm run test:development` — 9/9 passing.

## Completed checkpoint: Milestone C — Development Results Center

- Added Spring/Fall results switcher.
- Added team-growth KPIs, movement distribution, position-group summaries and observed training-focus outcomes.
- Added filters/sorting for position, improvement, regression and physical changes.
- Added compact results table and detailed player before/after panel.
- Added responsive layouts and focused HTML/result-data regression coverage.

Focused validation at checkpoint: `npm run test:development` — 10/10 passing. Standalone build completed successfully.

## Completed checkpoint: Milestone D — Global Next Action navigator

Commit: `6102d638a824ade90d138fa21f3198209f714980`

- Reuses the existing Weekly Command Center advance control as a navigator rather than an automatic action executor.
- Unresolved Coach's Desk decisions outrank ordinary checklist navigation.
- Otherwise opens the first unfinished item already produced by `weeklyPlan()`.
- Does not auto-sim games, bowls, playoffs, camps or offseason phases, so it cannot silently skip a gate.
- Added pure regression coverage for decision priority, unfinished-item ordering and all-clear state.

## Completed checkpoint: Milestone E — Bounded manual recruit scouting

Commit: `1fea3ac82b8fc91f78d17ad5adcfe47b98f13a18`

- Added weekly Evaluation Hours derived from recruiting/evaluation staff quality and bounded to 8–14 hours.
- Quick Film costs 1 hour; Full Evaluation costs 3 hours.
- Hours reset with the week and do not roll over.
- Manual evaluation tightens the existing domain ranges/confidence through the existing scouting engine; it never reveals true ratings.
- Added scouting receipts and profile/board controls.
- Prevents manual scouting of prospects committed elsewhere.
- Additive state is stored on ordinary team/recruit records and therefore follows the existing save/export path.

Focused pure-module checks passed before push for cost, weekly reset, confidence/range movement and commitment blocking.

## Completed checkpoint: Milestone F — Fallible Staff Verdict

Commit: `f2135443113a3bb0d8851b4a3edf35a545b302f9`

- Added staff labels from Pass through Priority Take.
- Verdicts summarize current scouting-domain ranges, report confidence, evaluation staff quality and a deterministic staff-specific bias.
- Added conviction levels that strengthen as evaluation improves.
- Shows best current reads and the largest unresolved area.
- Explicitly labels the verdict as staff opinion rather than hidden truth.
- Added an anti-cheat regression: changing hidden true rating/upside while holding the scouting report fixed must leave the verdict unchanged.

## Completed checkpoint: Milestone G — Recruit Compare

Commit: `c195819438f58761d0bcf996fb24d095aa775847`

- Added a three-prospect compare tray.
- Compare cards use current staff verdict, evaluation stage, confidence, strengths/risk, interest, geography, visible rank/stars and priority.
- Added anti-cheat coverage proving compare output does not change when hidden true talent changes under a fixed scouting report.

## Completed checkpoint: Milestone H — Roster Outlook & Staff Shortlist

Commit: `5667c87c53a4651a48dc0acde8dce45a3144fb61`

- Added projected position needs using returning eligibility, current commitments and positional roster targets.
- Added an eight-player staff shortlist above the full recruiting table.
- Recommendations prioritize actual roster holes, then current staff evaluation, interest, pipeline and distance.
- Hidden true talent and hidden scheme-trait values are excluded from shortlist scoring.
- Shortlist cards can add/remove a prospect from the board and use the same bounded scouting actions.
- Added pure regression coverage for roster-need arithmetic, need-vs-grade ranking, commitment exclusion and hidden-rating independence.

## Completed checkpoint: Milestone I — Lightweight scouting presentation

Latest source commits include `5a2ecc8ff651aa2c62dcf33d4eb3b3cd480e49b1`, `9f7fbc37a67a764e56a4ceff7c44cd4405c237e4`, and `92c2b055b613271f0b515d9e41079e54962199a0`.

- Preliminary Staff Verdict, Compare and Staff Shortlist views no longer create persistent `manualScouting` state merely by being rendered.
- Preliminary verdicts use the existing visible `scout`, `scoutUp` and confidence summary until detailed `scoutingDomains` actually exist.
- Detailed scouting domains are created only when the player explicitly targets/evaluates a prospect through the existing evaluation path.
- Added regressions proving preliminary browsing is read-only and that a real scouting action is the point where persistent detailed state begins.

## Completed checkpoint: Milestone J — Delayed scouting receipts and recruiting recap

- A recruit committed to the controlled program now freezes a compact signing receipt inside `recruitingMemory` containing only the staff-visible signing belief: visible current/upside reads, Staff Verdict, confidence, evaluation stage, hours spent, rank/stars and interest.
- Receipt snapshots never store hidden `trueNow`, hidden upside, hidden growth profile or hidden trait values.
- Enrolled players are compared later against observed staff ratings, confidence, games, starts and awards.
- Early evidence can produce provisional `Diamond Watch` / `Bust Watch` labels; final `Diamond`, `Bust`, `Hit`, `Miss` and `As Scouted` labels require at least two seasons, 12 games and stronger confidence.
- Added a costly-misread flag for mature Bust/Miss outcomes that consumed a full evaluation or carried a high signing verdict.
- Roster rows can show scouting-receipt badges.
- Recruiting now gains a Scouting Receipts recap with settled outcomes, developing/watch cases, costly misreads and notable player receipts.
- The final scouting extension refreshes the tab router after all recruiting/roster render wrappers are installed so tab navigation reaches the complete UI chain.
- Added pure regression coverage for receipt immutability, maturation gates, diamond/bust outcomes, team recap arithmetic and hidden-rating independence.

## Completed checkpoint: Milestone K — Progressive development tendency clues

Source slice: `c91600fae5d33079ab9ba13f963de3de4a002989` through `b9da0f9697ebe0f34b6965d03a0b129e4ae0a380`.
Latest synced standalone checkpoint: `45178951085f707390bf967a075827e431a40050`.

- Added a pure development-tendency system that reads only accumulated Spring/Fall camp receipts plus current staff confidence.
- Possible evidence-backed labels include `Steady Riser`, `Accelerating`, `Camp Surge`, `Uneven Progress`, `Plateau Watch`, `Gradual Progress`, and `Development Concern`.
- The system refuses to call a pattern with fewer than two observations or low staff confidence.
- Roster rows can show concise tendency badges once evidence is meaningful.
- Development & Camp gains an `Observed Growth Patterns` staff panel with the evidence count and confidence behind every label.
- The UI explicitly states that labels do not reveal a hidden development curve or ceiling.
- Added regression coverage for evidence thresholds, steady/accelerating/volatile/plateau patterns, team summaries and hidden-field independence.
- The final extension refreshes the Roster and Development tab-router callbacks after wrapping their renderers.

## Completed checkpoint: Milestone L — Browser startup readiness regression

Source commits: `848b1d8615db055bc88b5be4117c5affb6c12976`, `ae3729dbab0604d8c9cb8774c11df1738d3e2355`, and `bea0ed3ccc3bd85ed894312209e8cb7dc4caf354`.

- The first clean Milestone K validator passed all 289 engine/presentation tests and successfully located Chrome, then failed in the browser suite because Playwright clicked the statically visible `#titleNew` before async school loading/event binding finished.
- Browser startup helpers now wait for the title-team picker to be populated before clicking New Dynasty. This uses an actual application-readiness signal instead of a timing sleep.
- The readiness fix has been applied to the main browser smoke test, visual regression suite, and recruiting visual suite.
- The standalone sync after the test-only changes completed successfully; no source/build mismatch was introduced.
- A fresh full validator is running on commit `bea0ed3ccc3bd85ed894312209e8cb7dc4caf354`. Do not cancel it with additional source pushes while the long engine suite is executing.
- If the later IndexedDB browser-storage suite shows the same startup race, apply the identical `#titleTeam option` readiness guard there before changing application logic.

### Read-only Recruiting performance audit

- Staff Shortlist remains the clearest performance target: each Recruiting render scans the recruit pool and computes one staff verdict per uncommitted prospect before sorting to eight recommendations.
- Scouting Receipts performs one recruit-pool scan to freeze controlled commitments and one roster scan for the recap; this is linear and currently less concerning than shortlist verdict computation.
- Compare only computes verdicts for the up-to-three selected prospects.
- Do not optimize shortlist ranking by narrowing the candidate pool without regression coverage, because that could change roster-need recommendations and recruiting behavior.

## Standalone build handling during this workstream

The repository's validator requires committed `index.html` to exactly match `npm run build`. Because this session cannot clone GitHub through the shell, a temporary branch-only workflow `.github/workflows/sync-v0953-build.yml` was added to build and commit the generated standalone artifact after source pushes. It is guarded against bot recursion.

The temporary build-sync workflow was removed from the release-candidate tree after local build tooling became available. It was development plumbing, not a production feature.

## Validation status

- Validator run `34022762903` completed after 22m52s: all 289 engine/presentation tests passed and Chrome was located, but the browser suite timed out waiting for the title-team picker.
- Local browser console inspection found the concrete startup failure: `ReferenceError: recruitStaffVerdict is not defined` while initializing `scouting-receipts.js`.
- Root cause was extension scope, not async school loading. The app runs in strict mode, and `recruitStaffVerdict` plus companion UI helpers were block-scoped inside the scouting-actions browser branch, making them invisible to sibling shortlist and receipt extension blocks.
- The shared browser bindings now live in the enclosing app closure. The build inserts one combined extension block in declared dependency order, and the version/build regression executes all five extensions in a strict-mode harness to catch another startup-scope failure.
- A focused local browser run confirmed 113/113 primary browser checks and 35/35 visual-identity checks after the startup fix. The remaining recruiting-visual failure was isolated to lazy painting of a newly inserted signing-card portrait below the viewport; signing cards now paint their bounded set of at most six portraits immediately.
- Re-running the focused recruiting visual test exposed a separate 171px mobile overflow in the expanded Scout cell. The mobile recruiting card now gives Scout the full row and allows verdict text/actions to wrap; the focused suite now passes 21/21 with 0px page overflow.
- Validator run `34029118162` then reached all 113 primary browser assertions; its only failure was a pre-existing nondeterministic coach-offer check because the test still mocked `Math.random` after gameplay had migrated to the seeded RNG. The browser-only test hook now resets the actual gameplay RNG to a known low first draw before sending the offer.
- Validator run `34031688279` passed engine and all browser/visual suites, then exposed stale IndexedDB test assumptions: it explicitly reopened schema 3 after the app had created schema 4 and still addressed the first archive chunk with the pre-save-slot numeric key. The persistence check now opens the existing database at its current version, reads `main:0`, and uses the same title readiness signal as the other browser suites.
- The same persistence scenario now explicitly confirms replacement of an occupied save slot after importing a portable save, matching the current three-slot safety prompt instead of silently dismissing it in Playwright.
- GitHub Actions run `34033119393` passed completely on `2acd965`, including engine, browser, persistence and simulation-audit stages. The branch has advanced to release-candidate preparation: v0.9.53 version alignment, release/validation/publish notes and removal of the temporary build-sync workflow.
- Do not publish v0.9.53 until full validation is green or any real failures are diagnosed and fixed.

## Next bounded slices

1. Rebuild the standalone artifact at v0.9.53 and run focused release checks.
2. Push the release-candidate checkpoint and require one final clean GitHub validation run.
3. After green validation, create and verify a versioned preview only; production remains v0.9.52 until separately authorized.
