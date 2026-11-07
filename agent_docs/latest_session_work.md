# Latest Session Work

## v0.14.3 published — 2026-11-07

- Goal completed for the approved seven-part experience pass: all changes and the earlier living-world/recruiting/Midnight & Brass integration are merged through PR #35. Product source is `e104abdc02afc8edc28802fc2a1d29e79f6afa95` on `claude/review-improvement-dwjemy`; its tree exactly matches tested head `2dbf1d7b05829d3333c32ebd8f959759c073ef1f` (`000bf88cb5b73d4b4735796bfe1df4906c728626`).
- Full PR run `42362194464` passed every job: 642 Node tests, 53 smoke checks, both complete browser matrices, real IndexedDB/storage, simulation audit and packaged Mac/Windows save/replacement/restart smoke. Post-merge validation `42363011668` also passed. The production publisher `42363068367` reran complete validation successfully and published v0.14.3.
- Pages deployment `42364725302` passed at `5061eced95f384324e765d4bb57ffdd6f9db5562`. Published HTML Git blob `a454c1644b045539b1c34b4bfcdb26421f229313` exactly equals source; SHA-256 `005d00a397ae3280835a9693e0381b08982ef6ba557a23821a15ab416d3a7ba7`. The plain production URL showed v0.14.3 in native Safari. A disposable private dynasty saved and opened a populated All Recruits board; the private test window was closed.
- Release fixes: scouting budget/workload/availability reads are pure, preserving exact rollback state; real evaluations initialize/reset and spend the weekly budget. The opening save captures All Recruits before rows render, and unmatched scopes also default All; explicit saved My Board choices still restore. Regressions failed before these fixes and passed afterward. Existing phone/focus, exact spending, whole-world rollback and hidden-information checks remain. Browser copy assertions/deferred-paint waits were corrected; Windows final disposable-profile cleanup uses the existing bounded handle-release retries.
- Release checkout: `/Users/markrogers/.copilot/repos/Football/.session-artifacts/living-world`, branch `codex/merged-v0143`, tracking the real GitHub default branch through `origin`. The earlier local remote remains `local-source`. Historical missing tree/blob objects were restored and SHA-verified; full Git fsck passed. Outer checkout edits, installed applications and real user saves remain preserved.
- Mac ARM64 ZIP: `out/Dynasty-Lab-v0.14.3-macOS-arm64.zip`, SHA-256 `80985baff8608a99bc10397fbe208b79a625fce3b5738c3b12349705fc489426`. Its game HTML and desktop main/preload/storage match source byte-for-byte; version, archive scope, deep/strict ad-hoc signature and ZIP checks passed. Cached Electron 44.3.0 matches the lockfile.
- Windows x64 ZIP: `out/Dynasty-Lab-v0.14.3-Windows-x64.zip`, SHA-256 `419c58000dc713aefae945ac310a5c00a62add73c2ec57cea08f7b70627c5b05`. It uses the passed CI artifact with portable ZIP paths; game HTML/native entry points match after CRLF normalization. Version and ZIP integrity checks passed.
- Release resources: `https://github.com/MarkJRogers92/Football/releases/tag/v0.14.3`; Mac/Windows/source ZIPs, plain-text handoff and `SHA256SUMS`. The canonical handoff is `HANDOFF_2026-11-07_v0.14.3.md`. These final documentation changes leave game HTML unchanged.
- Next milestone is the bounded long-save campaign in `OPENCODE_LONG_RUN_HANDOFF.md`, using tag `v0.14.3`. It has not yet run; no claim of a bug-free long dynasty is made. Local Chrome remains restricted in this coding shell; full cloud Chrome and native Safari evidence above are verified.

## One More Saturday local candidate

- Goal: implement Mark’s seven approved improvements for deliberate football presentation, a rewarding short-session weekly loop, factual postgame payoff, safe re-entry and accumulated personal history.
- Implementation commit is `9a22c45` on `codex/one-more-saturday` from `07abb2c` in `/Users/markrogers/.copilot/repos/Football/.session-artifacts/living-world`. The unreleased candidate remains version 0.14.2; no version bump, public deployment, merge or installed-app replacement is part of this pass.
- Presentation and copy: compact program masthead and open weekly desk; scouting-sheet Recruiting; field/scoreboard Game Day; almanac History. Routine entrances, button sweeps, pulses, ticker movement and weekly flips are quiet; earned ceremonies remain. Visible labels use This Week, Game Day, Player Development, Camp Results and Finish Game. New routes start at the header; clicking the current route preserves its position.
- Weekly flow: the existing highlights card is the visible stopping point after a final, with one standout, a supported consequence and the actual next opponent. Secondary contributors/plays/replay are optional. It is outside the full briefing; it never appears without a final or requires acknowledgement. Existing game and career decision gates remain authoritative.
- Persistence: a separate read-only `DynastySessionStatus` API and `dynasty:save-status` event report pending/saving/saved/unsaved/failed against real writes and the current slot/world/program. Weekly choices, management controls and validated detailed/live game commits checkpoint without advancing time. Open profile dialogs leave management writes pending until close. Retry Save is separate from the news channel. Live previews and rollback failures never checkpoint; unfinished live games are not persisted.
- Re-entry: the existing welcome summary adds last result, priority and pending choice after 15 minutes away. Bounded device preferences restore top tab (including Legacy), dashboard/recruiting subview, recruiting filters, Workspace/Table mode, prospect selection and allowlisted selects. Keys include slot, seed, storage archive identity and program. Restoration invokes view APIs, never gameplay clicks or management actions.
- History: six visible recorded seasons and one closed People/classes/rivalry disclosure with bounded signing receipts, school-season development, returning players and actual rival meetings. IDs and canonical profiles are used; partial/deferred records are explicit. A fresh history view uses one timeline status instead of repeated empty trophy, honors and zero-record panels.
- Independent review found a false Saved indication after same-week management and completed detailed/live games. The fix was independently rechecked with real disposable IndexedDB, including cold reload, in-flight writes, live preview and rollback. No further material finding was reported.
- Native Safari QA at 390×844 and 1280×900: weekly action/decision layout, Recruiting and its tighter phone spacing, Game Day, compact History and optional personal-history disclosure. A real choice changed pending→saved; a subsequent week produced a factual 24–26 final/1–1 record/next opponent with no result splash; recruiting targets, class view, mode and selected prospect survived cold reload. These were isolated private-browser test saves; the preview was closed afterward.
- Automated browser limitation: `npm run test:one-more-saturday-browser` aborts Chrome before page load with SIGABRT (cleanup EPERM), so the automated desktop/phone matrix remains unexecuted. Existing affected browser assertions were preserved or updated for intentional labels/restraint, and a new real-week/cold-re-entry browser suite is available.
- Final verification: `npm test -- --test-concurrency=2` passed version/build plumbing, 53/53 smoke checks and 638/638 Node tests, zero failures/cancellations/skips/todos (Node portion 396.9s). Final standalone script compilation, whitespace and documentation checks passed. The earlier 636/637 run exposed a test-clock race, not lost progress; per-test debounce clocks and a separate 899/900ms check fixed it while retaining real IndexedDB and all transition/stored-data assertions. The session suite passed 22/22 independently.
- Mac playtest package: `out/Dynasty-Lab-One-More-Saturday-macOS-arm64.zip` (SHA-256 `bc77c370ba63c61c84936942bb39aecdfd97be7fd0d3daf398408fe1ae5efb56`). The normal Forge command could not resolve GitHub; the package was built offline with the existing cached Electron 44.3.0 matching the lockfile. Packaged HTML, desktop main/preload/native storage and offline fonts match final source byte-for-byte. Deep/strict code-signature verification and ZIP integrity checks passed. This verifies package contents/signature, not a native-app runtime playthrough.

## v0.14.2 integration candidate — 2026-11-06

- Goal: integrate the reviewed Midnight & Brass, recruiting-desk and living-world work into the current game branch and produce a playable Mac build. No difficulty or simulation-balance changes.
- GitHub default branch remains `252a784`; Claude branch remains `eee7195`. Compared all 483 baseline files by Git blob SHA: the only difference from local reconstructed baseline `fe69239` was Claude's final handoff test-results update, now preserved. Remote integration will use Claude's actual commit as parent, preserving its history.
- Source version is 0.14.2. Short optional briefing, persistent player/coach following, next-opponent callbacks and history corrections are included with Claude's existing presentation changes. Following remains device-local, scoped by world seed; save schema and gameplay RNG are unchanged.
- Mark supplied successful Mac Terminal output for `test:living-world-browser`, `test:fun-features-browser`, and `test:season-features-browser` against implementation `5e27f24`. This clears the earlier browser launch blocker for those checks; it is not a packaged-app or manual visual pass.
- Fresh v0.14.2 verification: `npm test` passed 582 Node tests and 53 smoke checks, zero failures; clean-source reproducible-build verification passed. Local commit `3b7a199` and GitHub candidate `2dc70df` have identical tree `ad4e6a008eb897fbcbbf24476062d5be88c339ad`.
- PR #35 includes the living-world delta with Claude's real commit `eee7195` as its parent. GitHub PR run `42342382087` passed every job: core tests, primary and extended browser suites, browser storage, audit, and Mac/Windows packages. The duplicate push run `42342377233` failed only in `ui-upgrades-browser.js`, waiting for a ticker without having arranged an eligible headline.
- Investigation confirmed `game-hud.js` intentionally ignores setup/decision confirmations; a fresh gated dynasty need not have a ticker yet. Test-only commit `21389d5` (local `9b2d19c`) supplies two eligible status-line fixtures before checking phone layout. Assertions and 10-second timeouts are unchanged. Product code and the Mac build are unchanged. Follow-up PR run `42343226831` passed Mac/Windows packages and audit but timed out in a different check, `tests/recruiting-filters-browser.js:28` (searching for a prospect outside the displayed 220 rows). Its cause is unverified; other jobs are still running and merge remains pending.
- A local Mac arm64 ZIP was built with cached Electron 44.3.0 (matching the lockfile), ad-hoc signed and verified. Packaged HTML, app version, desktop entry points and offline fonts match the candidate. Deliverable: `out/Dynasty-Lab-0.14.2-macOS-arm64.zip` in the original checkout; SHA-256 `0a6385414944818c67dab7eb5da3d028a1602a3fc1e8a8c1e257df366ae273d1`. Local runtime smoke cannot bind localhost in this session; GitHub's Mac smoke confirmed native saving, replacement/restart, restore and clean shutdown. No app installation or public web deployment occurred.
- Known upstream issue: recruiting-phone focus assertion intermittently fails late in extended browser runs; it passed three isolated reruns in Claude's handoff. Preserve the assertion and investigate if reproduced.
- Original checkout's trophy-rendering edit and other worktrees remain untouched. Previous reviewed implementation is retained at `5e27f24`.
- Mark requested an OpenCode long-run testing handoff and code packet. `agent_docs/OPENCODE_LONG_RUN_HANDOFF.md` defines a staged seeded campaign, real native/IndexedDB persistence and cold restarts, archive/history invariants, test-tool caveats, and evidence/reporting requirements. Existing 20-season size measurements versus the current 256 MiB native snapshot guard are explicitly an investigation target, not a confirmed current ceiling.

## Visual identity v2 "Midnight & Brass" (Claude, 2026-11-07)

- Restored the 2026-11-06 handoff bundle onto base `252a784` (all 46 manifest hashes matched), rebuilt (`index.html` byte-identical), ran `npm test` (541 pass) and the three focused recruiting browser suites (pass), then committed it on `claude/gracious-rubin-mfi574`.
- Added a presentation-only identity layer: `brand-identity.css` (last in the cascade), `brand-visuals.js` (DOM + pure geometry), `brand-snapshot-adapter.js` (read-only engine extension), vendored Barlow Condensed in `assets/fonts/`. Details and the source-of-truth table are in `VISUAL_IDENTITY.md`.
- Small source changes outside the new files: `app.js` stat leader rows carry `--lead` and zero-stat defenders are no longer listed; `roster-depth-experience.js` cards show the v1 portrait and an estimate-range bar; `tools/build.js` wires the new files; `package.json` registers `tests/brand-visuals.js` and `tests/brand-identity-browser.js`.
- Version unchanged at 0.14.1; CHANGELOG has an *Unreleased* section. No release, publish, packaging or install.
- Follow-up (same day): one navigation map (tab groups = sidebar sections; tests' group helpers and `tests/browser.js` membership check updated to the new map), face chips, hidden duplicate status line, plain subtitles, in-place keys, Coach It Live win chance, Rival Watch and Ceremonies. See `VISUAL_IDENTITY.md` › Cohesion and fun pass. Not yet exercised end to end: Signing Day and Draft Night ceremonies (covered by unit tests only).
- Third pass (same day): synthesized sound, evidence-based storylines + award race, Legacy (achievements/records/hall of fame/challenges in localStorage, outside saves), Rivalry Week ribbon + rivalry trophy ceremony, last-game highlights, printable yearbook. Fixed a `rw-` class collision (Rival Watch now `rvw-`) that broke `recruiting-tools-browser`, restored the formation note that `roster-depth-experience-browser` protects, and fixed a ceremony baseline race during long synchronous sims. Difficulty settings deliberately deferred.

## Final handoff for Claude (2026-11-06)

- Start with `agent_docs/CLAUDE_HANDOFF_2026-11-06_DYNASTY_LAB.md`, the consolidated current continuation packet. It supersedes older handoff summaries; the detailed session entries below remain supporting evidence.
- Final closure check: an in-memory rebuild exactly matched `index.html`; diff whitespace checks passed. No implementation changed after the last passed focused-view verification. Existing reliable suites were not unnecessarily repeated.
- Current recovery bundle: `/Users/markrogers/Documents/Codex/2026-11-06/claude-handoff/DYNASTY_LAB_CLAUDE_BUNDLE_2026-11-06.zip`, with source hashes, tracked patch and focused-view previews. Copies of the Markdown handoff and bundle are in Downloads.
- No commit, push, merge, publication, packaging or install was performed. Original-checkout trophy edit remains untouched. Mark's current direction is fewer menus, condensed/clean UI and one flat direct-view strip.

## Focused recruiting supporting views (2026-11-06)

- Mark's design direction: fewer menus, condensed and clean. Implemented one flat, single-row strip of direct Current/Rising/Outlook/Map/Shortlist/Class summary/History buttons. It scrolls horizontally on phones; no additional Tools dropdown or nested menu was retained. The current prospect desk stays the default.
- `recruiting-class-views.js` routes existing mounted components to focused views. Map retains its star filter and canonical profile links. Shortlist retains ranking/reasons, targeting and scouting actions; removed the duplicated roster-need tiles because Outlook is its own view. Class summary groups `classSummary`, signing board and signing-day controls.
- History now has a dedicated `#recruitingHistory` host in `body.html`. The existing scouting-receipt and historical class renderers populate it. Fresh games explain the empty state; recorded signing receipts produce the same school-specific, maturity-gated history. History no longer nests inside Class summary. No invented records or mechanics/save changes.
- Shared evaluation hours are shown compactly in the existing Workspace/Table toolbar, read from the canonical scouting-budget strip. The full budget explanation remains in Class summary. Scholarship-summary guidance routes to Class summary; current-board guidance still opens Current. Return-to-Agenda context stays reachable across views.
- Navigation preserves mounted filters, map choice, prospect selection, loaded cards, inner list scroll and history disclosure state. View changes leave calendar/targets/random state unchanged. Narrowed the class-view observer to direct panel additions and canonical Summary rebuilds so map tooltip/portrait changes do not cause navigation repaint work.
- Verification: new browser assertions failed before implementation. Final focused-views browser passed desktop and phone sizes: one-row direct navigation, first phone prospect under y=600, real map profile action, shortlist scouting exactly one hour, canonical targeting, live visible budget, empty/positive signing history, immutable receipt, retained state and zero root overflow. 54 targeted recruiting/scouting/history/map/outlook tests passed; phone dossier, peer-class, preseason and recruiting portrait suites passed (21 portrait checks). Broad browser smoke passed 119, zero failures. Build/diff checks passed. Native read-only reviewer found no confirmed scoped regression; it did not rerun tests. Entire engine/browser matrices, desktop packaging and actual-device Safari were not rerun.
- Run `npm run test:recruiting-tools-browser` (also in extended browser checks). Optional screenshot directory: `DYNASTY_TOOLS_SCREENSHOT_DIR`. Current previews are `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-tools/` (desk/map/shortlist/summary/history at 390 and 1280 wide). The History preview uses a controlled browser-test receipt fixture; fresh production data stays empty until actual receipts exist.
- Next: review visual density across the focused views against the fewer-menus goal before choosing release scope. Larger living-recruiting, connected-history and measured long-save work remain roadmap candidates, not automatic balance changes.
- All changes remain local/uncommitted on `codex/recruiting-weekly-desk`. No commit, push, publication, installation or version bump. Continue in the active worktree; the old ZIP is the November 4 snapshot and does not include subsequent work.

## Recruiting class views and roster outlook (2026-11-06)

- Added peer Current / Rising / Roster outlook views in `recruiting-class-views.js`, integrated by `tools/build.js`. Existing modules stay mounted; each class keeps its filters, pagination and selection. Year labels derive from the current universe. Switching views does not advance the calendar or random state.
- Expanded the read-only `DynastyRecruitingNeeds` bridge with year, targets, rising watches and same-year departure/signing checkpoint flags. No hidden ratings, mutable roster objects, new save fields or simulation changes were added.
- `rosterOutlook` in `recruiting-needs.js` derives each position's current roster, eligibility exits, returning count, pending commitments, projected/target depth, current targets and future watches. Targets/watches are not added to projected depth. Processed departures and enrolled recruits are not counted twice; old-year checkpoints are ignored. The on-screen explanation states the projection's limits.
- Position shortcuts apply the existing current/rising filters and open the appropriate class. Current-board/scholarship guidance now reveals Current even after a Rising visit; board guidance focuses the visible Workspace/list rather than the hidden canonical table.
- Verification: 47 targeted recruiting/scouting/outlook tests passed. Final outlook and documentation checks passed (7, including overlap with the targeted set). New class-view browser passed at desktop/phone sizes, proving filter/selection retention, shared scouting hours spent once, position shortcuts, correct watched counts and guidance navigation. Existing phone, rising-class, roster-needs, recruiting-filter and guidance browser suites passed. Broad browser smoke passed 119 checks, zero failures. Build and diff checks passed. Entire engine/browser matrices, packaged desktop and actual Safari devices were not rerun.
- Review: first read-only reviewer timed out. A smaller source review reported no confirmed critical issue in arithmetic, same-year guards, view actions or observer structure; its structured completion was rejected for report formatting, so this is supplemental source-review evidence, not an accepted automated validation result. No reviewer files were changed.
- Run `npm run test:recruiting-class-views-browser`; also included in extended browser checks. New count tests are `tests/recruiting-outlook.js` and part of the normal Node test command. Optional screenshot directory: `DYNASTY_CLASS_SCREENSHOT_DIR`. Current previews: `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-class-views/` (390/1280-wide Rising and outlook captures).
- The subsequent focused supporting-view package is complete in the entry above. Living rival recruiting and balance changes remain later roadmap work.
- Continue in `/Users/markrogers/.codex/worktrees/recruiting-weekly-desk/Football`, branch `codex/recruiting-weekly-desk`. All earlier work remains uncommitted and unreleased. No push, publication, installation or version bump was performed. The old recovery ZIP is still the November 4 snapshot.

## Compact recruiting workspace and phone dossier (2026-11-06)

- Continued in the existing `codex/recruiting-weekly-desk` worktree. Earlier uncommitted work is preserved. No commit, push, publication, installation or version bump occurred.
- Recruiting clarity: Workspace hides the inactive table count; Table restores it. Search uses the canonical full-pool query, with consistent cross-view resets, labeled name/school/city search and a 40-character limit.
- Compact layout: Workspace reparents the existing filter strip into persistent native `#rwFilters` details; Table keeps inline controls. Open state survives canonical filter refreshes and the summary reports active advanced filters. Search remains visible outside the disclosure.
- Phone layout at <=700px: compact heading/mode/search/board controls; cards open the existing staff-facing dossier as a separate view. `Back to prospects` restores loaded-card count, list/page scroll and keyboard focus. Desktop retains its side-by-side layout. No new scouting handlers, mechanics, hidden ratings or save fields were introduced.
- Independent read-only review identified focus cases addressed here: removing the open prospect from My Board now returns to a safe list control instead of the next Remove button; canonical filter replacement/reparenting retains focus; responsive transitions move focus to a visible selected card/Back control. New browser cases reproduce and verify these paths.
- Verification: 44 targeted recruiting/filter/scouting/rising-class tests passed. Recruiting filter lifecycle passed, Workspace browser checks passed 33, presentation checks passed 35, and the new phone-layout regression passed (including real scouting, two-target board removal, keyboard opening, Back, empty results and resize). Broad browser smoke passed 119 checks on rerun. Initial concurrent smoke run exceeded the unchanged 4-second desktop timing limit at 4281ms; an isolated rerun passed both desktop/phone timing checks. Build and diff checks passed. The full engine suite was not repeated for this presentation-only batch; the earlier 538-test run remains a prior checkpoint.
- Run `npm run test:recruiting-phone-browser` for the new regression; it is included in `test:browser-extended`. Optional screenshots: `DYNASTY_RECRUIT_SCREENSHOT_DIR=/absolute/output/path`. Current previews and measurements are under `/Users/markrogers/Documents/Codex/2026-11-06/recruiting-workspace/`.
- The subsequent class/outlook and focused supporting-view packages are complete in the entries above. The y<600 first-prospect target is covered by the phone regression; broader actual-device Safari testing and packaged desktop validation remain unverified.
- The November 4 recovery ZIP is an earlier snapshot and does not include this continuation. Continue from the active worktree.

## Unreleased recruiting explanation + shorter weekly desk (2026-11-04)

- Authorized scope: fix the confirmed recruiting explanation drift, then implement the first shorter weekly desk slice. No commit, push, publication or desktop install was authorized or performed.
- Active worktree: `/Users/markrogers/.codex/worktrees/recruiting-weekly-desk/Football`, branch `codex/recruiting-weekly-desk`, based on verified v0.14.1 commit `252a784e8a55ae48d09920be396d709b8e60dd7a`. Source version remains 0.14.1; these edits are unreleased.
- Original checkout remains `/Users/markrogers/.copilot/repos/Football` at `d1d2975`; its existing `tools/render-meshy-trophy.py` edit was preserved. Do not implement from that older checkout or the extracted review snapshot.
- Recruiting: `recruitPitchBreakdown` now supplies the real pitch calculation, preserving contribution order and weights. Explanation prestige is 0.42 plus 0.22 for Prestige priority; academics and season record are included. Focused regressions failed before the fix and pass after it. A fixed-seed complete season serializes identically before/after (see `pitch-parity.json` in the review directory).
- Desk: compact program header; existing primary advance/review action and exact blocking title first; required choice cards remain open. Program ratings/secondary simulation and the full briefing are native disclosures. Optional gameplan cards are in the briefing and labeled optional; they retain the real decision handlers. Guidance navigation opens the needed disclosure and returns to the weekly view. Welcome-back information remains visible outside the fold.
- Tests: `npm test` passed (53 smoke checks, 536 Node tests). Focused browser runs passed: weekly desk, preseason, guidance, first-season flow, postseason next-action, main browser smoke (119), Game Engine postseason and cutover, review polish, UI upgrades, visual checks (35), browser persistence (6 scenarios), recruiting visuals (21). The entire browser/e2e matrix and packaged desktop were not run. After final copy/format cleanup, 26 focused tests, the weekly desk browser check and guidance browser check also passed.
- Release verification: `node tools/publish.js --verify` stopped at the clean-source requirement because the work is intentionally uncommitted. Documentation consistency (4 checks), build and `git diff --check` passed. Release verification must be rerun after a separately authorized commit/release workflow.
- Browser tests that inspect the moved secondary controls now open the actual disclosures first; existing behavioral assertions remain. The new desk regression is in `test:browser-extended` and has its own `test:weekly-desk-browser` command.
- Review/roadmap and evidence: `/Users/markrogers/Documents/Codex/2026-11-04/dynasty-upgrade-review/ROADMAP.html`. Same-seed phone comparison: 4587 -> 1851px tall; primary action y=1185 -> 472px, required summary entirely in the first 844px viewport, no horizontal overflow. See `weekly-desk-comparison.json`, paired same-seed screenshots, and current phone/desktop screenshots in that directory. These measurements describe this fixture, not every possible dynasty state.
- Final follow-through: fixed the win-chart ceiling (12/15/17 wins are proportional), Game Cast's missing made two-point/safety scoring entries, and its reversed away–home score cells. Added failing-then-passing regressions; 13 targeted chart/Game Cast/field tests passed. These are presentation fixes; archives and simulation outcomes are untouched.
- Final verification recorded November 5: fresh full `npm test` after chart/scoring corrections passed 53 smoke checks and 538 Node tests (zero failures). Game Cast replay, UI upgrades and weekly desk browser follow-ups passed. See the standalone handoff and recovery ZIP for continuation.
- Independent DeepSeek review found no confirmed recruiting/desk regressions. It checked calculation order, blocker routing, optional-choice access and build integration, plus 80 seeded optional-gameplan fixtures. It did not review the concurrent chart/scoring additions.
- Next: use `HANDOFF_2026-11-04_LOCAL_UPGRADES.md` for the exact resume point and final verification. Review the unreleased diff and current screenshots, then choose release/commit scope. Larger recruiting/history upgrades remain roadmap work. No balance or save-schema changes were made.

## v0.14.1 — Visual pass (2026-11-04)

- Game Day review method: script `watch -> skip to end -> every tab` at 1440 and 390 wide; measured dialog content height against dialog
  height, controls' bounding boxes against the dialog's, unlabeled controls, leaked placeholders and version labels. Game Day is the
  strongest screen; findings were layout (phone header, Watch view fit), not bugs.
- `game-cast.css`: `.gcf-controls` is `position:sticky;bottom:0` inside the dialog scroller; `app.js` sets `dialog.dataset.gameTab` so CSS can
  hide `#gameDialogMeta` in Watch. The scoreboard is built in `sports-presentation.js` from the dialog meta line (venue is
  "<home team> · <city>", filtered against the home name). Phone rules are at the end of `polish.css`.
- `renderGateNote` in `app.js` is the shared "why is this locked" renderer (Game Lab and dashboard hero).
- `table-folding.js` now also folds whole blocks on phones (`BLOCKS`); Roles & Depth has no extension render steps, so it wraps
  `TAB_RENDERERS.depth` instead of `extendRender`.
- Do not fabricate quarter scores: archived drives store points and result but not the quarter, and the Watch clock labels are reconstructed
  by `game-cast-field.js` `timeline()`. Real quarter scores need the engine to record the quarter per scoring drive.
- An overlap detector (leaf elements' bounding boxes intersecting inside one cell) found 22 overlaps in the old phone training rows and 0 after
  the fix; run it against `git show HEAD:index.html` to prove a detector can fail before trusting it.
- Corrected earlier claim: the ticker already paused on hover and respected reduced motion.
- Working agreement from the owner: skip the full local gate for UI batches; run targeted suites for what changed plus the PR's CI.


## v0.14.0 — A contested rising class (2026-11-04)

- `app.js`: `applyEarlyCommitments` (constants `EARLY_COMMIT_POOL=150`, `EARLY_COMMIT_CHANCE`, `EARLY_COMMIT_PROTECTED=.25`,
  `EARLY_COMMIT_MARGIN=4`) runs inside `offseasonPreseason` AFTER `rollRecruitClass(); recruitClassCounts={}` and after the per-team
  `t.commits=[]` reset, because `commitRecruit` writes both. Calling it earlier silently loses the counts. `rollRecruitClass` tags
  promoted prospects `fromRisingClass` and moves a watched prospect's `manualScouting[userId].season` to the new year so Film Reviewed
  survives (the record is season-scoped; `scoutingDomains` itself already carried).
- `scouting-actions.js`: the button handler uses `findRecruitAnyClass` (current class then `risingClass`) and exports `scoutingHoursInfo`.
  `rising-class.js` renders the verdict, evidence level, rival standing (`standingFor`, cached per prospect and week) and the scouting
  buttons for watched rows.
- Harness: extension variables (`recruitScoutingRecord`, `scoutingHoursInfo`, `recruitStaffVerdict`) exist only with
  `loadEngine({ fullRuntime: true })`; export them behind `typeof x === 'undefined'` or the default harness throws at load.
- Measured, not assumed: about 33 early commits per rollover; protection depends on the user's program (prestige 92: 9% watched vs 28%
  unwatched locked early; a weak program: 29% vs 28%). 10-season runs on three seeds match v0.13.1 on prestige spread, talent and save size.
- Open: no in-season AI pursuit of the rising class, no visit action for rising prospects, and the rising list is only top 600.


## v0.13.1 — Playthrough polish (2026-11-04)

- Method that worked: a scripted browser playthrough (`new dynasty -> resolve weekly decisions -> #simWeek` six times) then a sweep of
  every tab at 1440 and 390 recording page height, horizontal overflow, console errors and leaked placeholders. `#simWeek` is disabled
  until `[data-decision][data-choice]` buttons are clicked; copy that loop from `tests/browser.js`.
- Findings fixed: Game Lab actions gated with no explanation (`renderDetailedGateNote` in `app.js` uses the existing
  `guidanceActionEligibility('detailed-game')` blocker message); the Development training table (`#trainingBody`) was 80% of that page
  (`table-folding.js`, extend `FOLDS` to fold other long tables); internal milestone labels leaking into Game Lab copy; ticker clutter.
- Test pitfall (cost one failed gate): about 30% of fresh dynasties open with no required Coach's Desk decision (only the weekly game
  plan, `hasPendingWeeklyDecisions` ignores `WEEKLY_GAMEPLAN`), so `#simWeek` is enabled and Game Lab is not gated. Any browser test that
  needs a gated week must sim forward until `#simWeek` is disabled; assert the invariant (note visible iff gated) instead of assuming.
  Twelve lucky passes in a row is not evidence: measure the rate (`flake2.js`-style loop over fresh dynasties).
- False alarms worth knowing: the word "regular" in Program/Game Lab text is ordinary prose; the ticker showing an item twice is the
  intentional doubled reel for a seamless marquee loop, not a duplicate.
- Not fixed: the phone training-plan row has the *Current read* bar overlapping its text. Other long pages that could fold the same way:
  Depth (4,000px desktop, 10,000px phone), Recruiting (7,000px), History and Program on a phone (about 5,300px).


## v0.13.0 release record (2026-11-03)

- Merged as PR #27 (69b39d4), web published (run 41584185384), GitHub Release v0.13.0 created (see below).
- Added `.github/workflows/release.yml` (PRs #28, #29) because cloud sessions get 403 on release writes. The first run (41610456276) died
  silently with exit 141: the script runs under `set -o pipefail` and the notes extraction was `git show | awk '...{exit}'`, so the
  early-exiting awk can SIGPIPE `git show`. Not reproducible locally (timing), which is why the local test passed. Rule: under
  pipefail never pipe into a reader that can exit early (`awk exit`, `grep -q`, `head`); capture output or let awk read everything. The fix
  was tested by running the real `run:` step with `bash -e -o pipefail`, `gh` stubbed, against the real commit.
- `get_job_logs` with `return_content` is how to read a failed Actions step from a cloud session.

## v0.13.0 — Multi-year recruiting (2026-11-03)

- Started from a game review (browser screenshots at 1440 and 390 wide plus the headless sim). Findings and what was done:
  the Workspace's "220 prospects" was the display cap not the pool; the Workspace search only searched on-screen rows; a v0.12.28
  CSS `order` rule had put the recruiting filter strip below the map; Season tab showed `regular · Week 0`; up to three toasts stacked
  over phone content; the Roster page was 32,032px on a phone (the full table is one card per player).
- Rising class: `generateRisingClass`, `toggleRisingWatch`, `rollRecruitClass` in `app.js` (constants `RECRUIT_POOL_SIZE`,
  `RISING_CLASS_SIZE=600`, `WATCHLIST_LIMIT=15`, `WATCH_RELATIONSHIP=12`, `WATCH_INTEREST=8`); the new class is `rising + fresh.slice(600)`
  so the distribution is unchanged. UI is `rising-class.js/.css` (engine extension, after `recruiting-filters.js`). No save migration was
  written on purpose: the owner said current saves can be discarded; `normalizeUniverse` only defaults `risingClass` to `[]`.
- Recruiting filters: `state` and `query` run before the 220-row cap; Workspace reads `data-total`/`data-matching` off `[data-recruit-pool]`
  and drives the pool filter through `DynastyLabRecruitingFilters.setState`.
- Roster page folding in `roster-depth-experience.js` (`applyRosterFolding`); any test that clicks `#rosterBody` must open the table first
  (`[data-rd-table-toggle]`); browser.js, visual.js and player-identity-browser.js were updated.
- Measured: prestige sd narrows on the v0.12.28 base too (16.8 -> 14.5-14.8 over 10 seasons, three seeds); v0.12.29 adds about 0.4. Not
  changed. If a long game should keep dynasties alive, the lever is the prestige update in `offseasonReview`
  (`target=meanWins+(prestige-meanPrestige)/9`, delta clamped to +-3) and `program_ceiling`.
- The longrun "stall after 2034" was the hot seat: the user team went 3-9, confidence 0, `hasPendingCareerChoice()` true. Not an engine bug.
- Pitfalls hit: `git add -A -- . ':!node_modules'` fails on an ignored path and silently skips the commit; `pgrep -f` inside a Monitor
  matches the monitor's own command line; `verify:release` refuses a dirty tree, so commit before `validate:full`.


## v0.12.29 — Fuller recruiting classes (2026-11-03)

- Prompted by "recruiting didn't seem like many recruits". Measured first (`tools/diag3.js`, plus ad-hoc cycle scripts): the pool is 2,800
  a year, only about 1,520 sign, class size is `scholarshipCapacity` and swung 12.7 / 22.7 / 23.0 / 12.4 / 18.7 / 15.5 / 21.4 across cycles
  (cohort echo through `projectedReturning`), unsigned prospects were as good as signed ones (149 unsigned 4-5 stars in one cycle), and the
  walk-on top-up was almost entirely K and P because `generateRecruitPool` excluded them.
- `app.js`: `generateRecruitPool` adds K/P (`SPECIALIST_EVERY=31`, capped 86); `playerFromRecruit` / `recruitOriginLabel` shared by enrollment
  and `takeLatePlayer`; `offseasonPreseason` captures `latePool` before the pool regenerates and fills walk-on gaps from it
  (`universe.lateMarket`, `p.lateAddition`); `scholarshipCapacity` blends toward `CLASS_TARGET=20` (`CLASS_SMOOTHING=.5`, floor 14);
  `placeUnsignedElites` runs inside `finalizeRecruiting` before the forced fill (`recruitCycle.elites`).
- `recruiting-filters.js`: `recruitingPoolSummary()` adds the "Pool N · committed · uncommitted/unsigned" line (`data-recruit-pool`).
- Measured after: 0 unsigned 4-5 stars over 8 cycles, classes 15.0-23.0, trueNow mean and save size tracked the base over a 7-season run. Prestige
  sd narrowed slightly faster (14.7 vs 15.3, one seed): worth a second seed.
- Known, pre-existing, not touched: `tools/longrun.js` (seed 7, Chicago Metropolitan) stops advancing after 2034 on the untouched v0.12.28
  base as well. Likely a career gate on the controlled team in the headless run; not investigated.
- Tooling note: `pgrep -f` inside a Monitor matches its own command line and never exits; poll the output file instead.

## v0.12.28 — Calmer Command Center (2026-10-29)

- Review of the running game (screenshots at 1440 and 390 wide) found a 4,600px dashboard, three
  stacked headers for one Game Lab matchup, and layered status messages. This pass fixes those.
- `dashboard-views.js/.css`: classifies the dashboard's direct children (cards arrive from several
  modules) into week / stories / league and shows one at a time. Nothing is moved or re-rendered.
  Tests that need the stories cards call `DynastyDashboardViews.show('stories')` first.
- Game Lab: `.gameday-event-hero:not([hidden]) ~ #nextGameCard{display:none}`. The card stays in the
  DOM because `sports-presentation.js` reads its `.gameday-data`.
- Root cause of the dim Game Day hero: `interaction-polish.js` `watch()` observed `class` on the
  element it animates, so every replay re-triggered itself. Fixed by ignoring `dl-motion-*` changes.
- `app.js` weekLine says "Opening week" at week 0 (the HUD only flips on `Week N`).
- Recruiting Workspace cards gain portraits (`DynastyLabPortraits.paint`) and a confidence bar parsed from the Scout cell.
- `game-settings.js`: `universe.settings` {boardPatience, injuryRate, recruitingEdge}; lookup `gameSetting()` and defaults live in
  `app.js` because the engine reads them (extensions are absent from the non-full test harness). Neutral defaults = identical RNG stream.
- `career-milestones.js`: derived from `tenure.seasons` + `careerHistory`; `tenureDigest()` in `app.js` is stored on closed posts.
  `universe.milestones` maps id -> season first reached. Review records now include `champ`/`confChamp`.
- Measured, not tuned: ten seasons on seed 7 gave 8 distinct champions, 2 back-to-back, 5 of 10 titles from preseason top-10 prestige and
  9.4/10 top-10 retention, so no dynasty-persistence change was made.

## v0.12.27 — Smooth trophy turn (2026-10-28)

- v0.12.26 stepped 96 frames at 4 fps and read as jerky on the installed Mac app. Now 192
  frames (the original 96 plus 96 rendered half a step later with `--yaw 1.875`), driven by
  `title-trophy.js` with a per-frame crossfade, 30s per turn.

## v0.12.26 — New title trophy, slow turntable (2026-10-28)

- Replaced the v0.12.25 model with the owner's Meshy image-to-3D trophy (task
  `d180affe-…`, the same model as the Drive export `college_football_trophy_game_mesh`),
  rendered with its shipped PBR textures (Cycles, CPU, `pip install bpy`).
- 96-frame turntable in a 12x8 WebP sheet, 24s per turn, stepped by two nested
  transforms in `polish.css` (`.trophy-reel` rows, `.trophy-sheet` columns). The old
  single-strip `background-position` percentages drifted between frames; the transform
  steps land exactly.
- Season Review still regenerated from the same render (`trophy-still-v3.png`).

## v0.12.25 — Trophy turntable (2026-10-27)

- The title trophy is a genuine 360-degree turntable now: a symmetric Meshy model
  (football on a gold cup) re-shaded to gold, lit in Blender and pre-rendered to 36
  frames (`assets/trophy-turn-v2.webp`, 373 KB). It turns once every 12s, keeps the
  float, and stops under reduced motion. Season Review uses a matching still.
- Retired `assets/title-trophy-v1.png` and the asymmetric first model, whose football
  sat in front of the cup and broke a full rotation.
- `tools/render-meshy-trophy.py` re-shades the GLB (Meshy ships a grey material),
  splits the plinth and renders stills or turntables. `tests/trophy-turn-browser.js`
  covers sheet, size, spin and reduced motion on desktop and iPad widths.

## v0.12.24 — Championship trophy and team helmets (2026-10-27)

- Presentation-only release. Trophy and helmet were generated with Meshy
  (text-to-3D preview + PBR refine), rendered to transparent sprites with three.js.
- Title screen trophy (`polish.css`, `body.html`); Season Review champion trophy
  (`season-review.js/css`); Game Lab hero helmets (`gameday-season-presentation.js/css`).
- Helmet atlas: `tools/build-helmet-atlas.py <side-render.png>` recolors one helmet per team
  (shell = primary, facemask = secondary) into a lossy WebP atlas. A 256-colour PNG was tried
  first and posterized the shells; WebP fixed it. Logos are overlaid in CSS from the logo atlas.
- The first Meshy helmet carried a brand-like mark and crackle texture; it was regenerated
  with a plain-panel prompt. Known weakness: the lower shell shadows very dark on every team.
- Meshy credits spent: about 150 across trophy and both helmets.
- Validated before the PR: `npm test` 497/497 and `npm run test:browser` green (dev dependencies
  installed with `npm ci --ignore-scripts` in the cloud container).

## v0.12.23 — Dynasty persistence, first measured step (2026-10-26)

- Baseline measured first: prestige held its ranking almost perfectly (top-10
  retention 9.8/10), yet preseason top-10 programs won only 20% of titles (seed 7)
  and 40% (seed 11) — standing was sticky but did not convert into results.
- Change: recruit pitch weights prestige 0.32 → 0.42 (Prestige priority bonus
  0.18 → 0.22). No new fields; prestige stays derived from existing state.
- A/B, ten seasons: seed 7 blueblood titles **2/10 → 5/10**, back-to-back 1 → 2,
  distinct champions 9 → 8. Seed 11: 4/10 unchanged, back-to-back 0 → 1, distinct
  champions 9 → 8. Partial effect, reported as such.
- `tools/league-health.js` now reports distinct champions, most titles by one
  program, back-to-back titles, blueblood titles and top-10 prestige retention.
- Archive policy unchanged: old seasons are kept in full.

## v0.12.22 — Portal outcomes, roster needs, long soak (2026-10-26)

- **Portal realism.** A program needs two open slots at the position and a player
  competitive with its room; a prior relationship still opens a door. Unplaced
  entrants return to school (65%) or leave football (35%, archived "No landing
  spot"). Measured 29.6% (seed 7) and 31.5% (seed 11) unplaced over three seasons,
  matching the ~30% real-world D-I figure. First-offseason rate skews high — recorded
  as a known limitation.
- **Recruiting needs card** (`recruiting-needs.js`): thin position groups from
  returning players + commitments against `POS_COUNTS`. Read-only bridge
  `globalThis.DynastyRecruitingNeeds`; no save fields, simulation or randomness.
- **Twenty-season soak**: `tools/save-size.js` now drives the interactive offseason,
  throws if a season does not advance, and honours `SEED` (it previously hardcoded
  seed 7). Seed 7 reaches 206.6 MB at season 20, with the player archive at 93.9 MB
  and overtaking the game archive around season 13. Findings in
  docs/SOAK_20_SEASONS.md.
- **Notarisation blocked**: no Developer ID identity or App Store Connect key exists
  on this machine; requirements and steps in docs/NOTARIZATION.md.
- **Dynasty persistence is not started** — it changes simulation balance and needs
  its own measured design using the soak data.

## v0.12.21 — Kicking-game repair

- The health metrics found the defect: walk-on fill picked positions at random, so
  thin kicker/punter depth grew 0 → 7 → 38 team-seasons and 11–22 programs a season
  had no second kicker or punter.
- `offseasonPreseason` now repairs critical depth (`CRITICAL_FLOOR` QB/K/P of 2)
  before general need, swapping the weakest surplus player for a walk-on at the
  missing position and recording the cut. Measured after: **K/P thin 36→0 (seed 7)
  and 47→0 (seed 11)**; QB 7→9 and LB 5→10 soft-depth deficits remain and are not
  unplayable.
- `tests/roster-repair.js` covers a gutted kicking game, the whole league, and
  determinism. Registered in `npm test`.

## v0.12.20 — League-health metrics and the rollup verdict

- `tools/league-health.js` reports portal churn, positional shortages, walk-on
  dependence and blue-chip concentration. Measured on three seasons of two seeds:
  466 transfers with no unplaced entrants, thin depth concentrated at kicker and
  punter (45–58 team-seasons), ~82% of rosters never signed through a class, and
  ~16% of blue chips reaching the ten strongest classes. Written up in
  docs/LEAGUE_HEALTH_2026-10-25.md, including the kicker/punter repair gap.
- `tools/save-size.js` now breaks the archive down by field. The playerArchive
  rollup is **not worth doing**: 3.8 season rows per career carrying real
  production, and only ~2.9 MB of 114 MB belongs to stateless careers. Verdict and
  numbers in docs/SAVE_SIZE_MEASUREMENT.md. No save-shape change shipped.

## v0.12.19 — Hall of Fame browsing and repository hygiene

- Hall of Fame now shows a count ("Showing 24 of 64 inductees"), a Players/Coaches
  category filter and a "Show all" control. Induction got stricter in v0.12.17, but
  a long dynasty still passed the old 24-row cap, leaving most inductees unreachable.
  Covered on desktop and 390px mobile in `tests/history-accuracy-browser.js`.
- `.session-artifacts/` (local evidence runs) is ignored instead of appearing as
  untracked work.
- This handoff no longer opens with v0.12.11 release notes.
- v0.12.18 history and offseason work shipped by PR #13 (merged 4157493, full CI
  40297216363). Details: [history_offseason_handoff.md](history_offseason_handoff.md).

## Current state

- Version `0.12.23` in `VERSION.txt`, `APP_VERSION`, `package.json` and the
  generated `index.html`.
- Default branch `claude/review-improvement-dwjemy`; released source `f57e770`
  (`v0.12.21`), merged by PR #16 after full CI 40430159066.
- [Release v0.12.21](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.21)
  is the current desktop Alpha (macOS arm64 + Windows x64 from validation run
  40430159066). Installed `/Applications/Dynasty Lab.app` is CI-built v0.12.21
  (ZIP hash and signature verified, 17 save files untouched); backups are kept at
  `~/Applications/Dynasty Lab 0.12.9.app` … `0.12.20.app`.
- Earlier releases: [v0.12.16](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.16)
  (run 40259042984), [v0.12.15](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.15)
  (run 40256022466), [v0.12.14](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.14)
  (run 40253412593).
- Production publish for 0.12.19 is the `Publish Dynasty Lab` workflow run
  40421035607; the live site serves 0.12.19.
- Premium client roadmap milestones A-J remain shipped. Do not re-run them.

## What this version adds

- **Hall of Fame browsing (0.12.19)** (`history-index.js`): inductee count,
  players/coaches filter and `Show all`. Induction got stricter in 0.12.17, but a
  long dynasty still exceeded the old 24-row cap and the rest were unreachable.
  Desktop + mobile coverage in `tests/history-accuracy-browser.js`.
- **Playbook search** (`app.js` `encyclopediaSearch`/`encyclopediaOpen`,
  `globalThis.DynastyEncyclopedia` bridge, `game-hud.js`): two characters list
  matching programs, coaches and players above the section matches; Enter or a
  click opens the program, coach profile or player dossier. Read-only over
  collections already in memory; it never loads a deferred archive.
- **Save storage reporting** (`app-health.js`): Options shows the device storage
  the dynasty's saves use and warns at 70% of the browser quota.
- **Desktop health** (`desktop/main.js`, `desktop/preload.js`): update notice
  against the latest GitHub release, renderer/preload/console errors appended to
  `dynasty-lab-errors.log` in the app's data folder, external links restricted to
  this project's GitHub pages/releases.
- **Release hygiene (0.12.11)**: Options reads the packed app's real
  `Saves` folder size over IPC, and `tests/docs-consistency.js` fails when the
  version file, changelog, README, agent context or roadmap disagree.
- **League health pass (0.12.17)**: `tools/league-health.js` reports ten-season
  distributions; findings in docs/LEAGUE_HEALTH_2026-10-25.md. Titles, prestige,
  rosters, injuries and recruiting measured healthy on two seeds. Hall of Fame
  selectivity fixed (254 → 64 inductees after ten seasons).
- **Archived-career summary (0.12.16)**: careers with no recorded games are
  archived as a summary record (identity, reads, draft, awards, career totals,
  exit). Measured before changing anything: those careers were 27.9% of the
  archive's bytes.
- **Ten-season measurement**: 115.4 MB at season ten; `playerArchive` 42.9 MB
  and the only accelerating component — see docs/SAVE_SIZE_MEASUREMENT.md.
- **Conference history (0.12.15)**: final standings for any archived season,
  ordered by league record, with the program card behind each row. Derived from
  the stored season records.
- **Hall of Fame (0.12.14)**: retired players qualify on major awards, a
  first-round draft result and career production; coaches on national titles,
  conference titles and Coach of the Year. Reasons are printed, induction is
  derived per read from the archive, and no save field is added.
- **History index (0.12.13)**: History lists every recorded coach (searchable by
  name, program or role; opens the coach profile) and the national champion
  timeline (opens the read-only program card). Both are read-only.
- **Read-only search (0.12.12)**: a program result opens a read-only program card
  and never writes `#userTeam` (the earlier build could switch control and be
  recorded as "stepped away"). Entity rows are capped at six, the scan is cached
  while the highlight moves, and the desktop usage walk is asynchronous.

## Known limitation

Search reads `universe.playerArchive` directly. While a browser archive is
deferred, graduated players are not listed; opening one (which loads the archive)
still works from the Archive tab. The roadmap's history packet should add an
on-demand "search archived careers" row rather than loading 20 MB per keystroke.
- **Measurement** (`tools/save-size.js`): per-component save growth; see the
  2026-10-25 update in docs/SAVE_SIZE_MEASUREMENT.md.

## Known gaps

- **Long-dynasty size**: compaction has shipped since v0.9.49 and works
  (gameArchive +2.3 MB/season in steady state). The fastest-growing component is
  now `playerArchive` (+4.1 MB/season): retired players keep full season
  histories. 79.2 MB at six seasons, ~6-7 MB/season steady state.
- **Encyclopedia remainder**: no coach index, conference/season pages, national
  timeline or Hall of Fame. Search covers in-memory entities only.
- **Desktop distribution**: ad-hoc signature, no notarisation, no auto-update
  (the update notice links to the release page).

## Verification

- `npm run verify:release` PASS on the released source.
- `node tests/version.js`, `node tests/smoke.js` (53/53) PASS.
- `node --test tests/encyclopedia-search.js tests/saveslots.js tests/release-guard.js`
  23/23 PASS.
- `node tests/encyclopedia-search-browser.js` PASS at 1280x900 and 390x844
  (program opens, player dossier opens, no console errors, no overflow).
- Five-season audit and six-season save measurement recorded in
  docs/SAVE_SIZE_MEASUREMENT.md.

## Next entry point

docs/roadmap/STATUS.md named the history packet; its search slice is now shipped,
so the next bounded work is the coach index plus conference/season pages, or the
playerArchive rollup.