# Latest Session Work

## v0.30.1 staff delegation fix — 2026-11-14

- The v0.30.0 publish run failed once in `tests/live-game-lock-browser.js` (`ready:false` after staff delegation). `delegateWeeklyDecisions` (`app/14-weekly-decisions.js`) returned at the first refused decision, and the optional WEEKLY_GAMEPLAN (ignored by `hasPendingWeeklyDecisions`) could be that refusal, stranding required decisions. Not reproduced in 32 browser runs or 1,100 headless weeks; fixed structurally.
- Staff now work every decision, record an existing game plan for the opponent, and fall back through non-committal policy options (`delegatedWeeklyCandidates`); committing options (promise, grant, approve, full workload) are never fallbacks. Policy lookup uses own keys only.
- Three new cases in `tests/delegation-correctness.js`. Local `npm test`: 900 pass.

## v0.30.0 national timeline, archive trims, app.js split — 2026-11-14

- National timeline in History (`history-index.js`, `nationalTimeline` in `app/15-render-program-recruiting.js`): per archived season, awards, upsets (top-10 loser; unranked winner or 12+ places lower; max 3) and national season records set that year that still stand. Derived only; no save change. Deferred browser game archives show a load button. `tests/history-index.js`, `tests/national-timeline-browser.js` (in test:browser-extended).
- Archive: new records drop `coachDeparturePressure` and round `recruitingMemory` lat/lon to 4 decimals. Season ten: playerArchive 42.8 → 41.4 MB. The seasonHistory rollup remains declined.
- `app.js` split into 18 parts under `app/`, spliced by `tools/app-source.js` at the `@app-parts` marker; build output identical apart from part header comments. Use `readAppSource()` in tests. `tests/app-parts.js` guards it.
- Ten-season recruiting soak v0.28.1 vs v0.29.1 in `docs/RECRUITING_TIMELINES.md`.
- Local `npm test`: 896 pass. Local Chromium works in this container; history browser tests pass.

## v0.29.1 recruiting timeline fixes — 2026-11-14

- Review of v0.29.0 found two bugs in `recruiting-actions.js`. (1) Cuts ran for every prospect, so the controlled program was cut (and blocked from every action) on prospects it never pursued. Cuts now only record when the program was pursuing him (targeted or holding an offer). (2) Announcements in weeks 10–12 could name week 13–14, which never comes. No date is set past `LAST_WEEK` (12); a postponement past it sets `funnel.signingDay`; v0.29.0 dates past the season come due on the final pass.
- Improvement: before a Top 3, a pursuing program with an offer, interest ≥ 65 and no unmet dealbreaker takes the fifth Top 5 spot (`funnel.added`). The card explains when you are off his list or not a finalist.
- Four new regressions in `tests/recruit-timelines.js` (21 total).
- Not changed, flag for Mark: v0.29.0 dropped the +10 board bonus from decision standings (deliberate target neutrality).

## v0.29.0 natural recruiting timelines — 2026-11-13

- The private deterministic timeline now applies to all uncommitted recruits. Readiness combines calendar, fit, competition, completed visits and stable personality; public status reveals only clues and voluntary announcements. Existing signing and flip mechanisms remain.
- Migration preserves current offers/lists/cuts/commitments, removes synthetic deadlines and staggers the current class only. Public-date changes include reasons, reopenings get time to hear from schools, and repeated evaluation cannot reroll outcomes.
- The focused 102-case recruiting checks passed across the complete run and corrected late-fixture rerun; 42 player-history/signing/rising-class regressions passed. Full repository validation and publication are pending. Local Chromium is blocked at launch by socket EPERM, so browser checks must run in CI.
- Source and save contract: `docs/RECRUITING_TIMELINES.md` and `STORAGE.md`. User authorized pushing, merging and publishing after validation.

## v0.28.1 approved logo refresh — 2026-11-13

- PR #56 integrated the approved wide logo into the title screen, setup header and navigation rail, and the stacked alternate into About. The original artwork is unchanged; phone setup progress has its own row. Both assets are precached offline.
- CI for the logo integration passed all seven jobs, including 869 unit tests, desktop/390px/320px logo checks, offline coverage, both desktop packages and simulation audit.
- Release metadata is v0.28.1 because production v0.28.0 already exists and the publisher prevents overwriting a version with different content. Publication is pending validation of this release stamp. Saves and simulation behavior are unchanged.

## v0.28.0 decisions on the stop cards, live 3D field — 2026-11-13

- Offseason stops (`offseason-stops.js`): `offseasonStopFacts` now returns `decide` ('departures', 'signing', 'portal'), and `renderOffseasonStop` adds `departuresDecideHTML` (NIL offer/release through `signNilDeal`/`cancelNilDeal`, rows sorted by risk before relief so they do not jump), `signingCutHTML` (shown only when `scholarshipSummary(t).over`, staff cut order, `pullOffer`) and `portalDecideHTML` (best `portalFit` scores; `stopPortalPursue` opens the cycle with `openPortalCycle` before the first `targetPortalCandidate`, since opening resets finalists). Moving on from the portal stop runs `stopPortalPlayOut` (the remaining `advancePortalRound`s) before the advance resolves decisions. While a stop is open its facts stay non-null after the decision is made (e.g. "Your class fits"), so the card does not vanish. With a decision on the card the move-on button is the primary one. Fixtures: `departuresRiskFixture`, `signingOverFixture`, `portalStopState`. Test `tests/offseason-decide-browser.js` (in `test:browser-extended`); `tests/world-identity-browser.js` now counts only the card's own button row.
- Live field: `mount(host,{live,fromRow,maxSnaps,rest})` in `game-cast-field.js` adds a live mode (class `.gcf-live` hides the replay chrome; shorter canvas; animates only rows from `fromRow`, at most four snaps; then a rest frame from `restScene` with the line of scrimmage and first-down line). `v2GameDayUIMountField` in `game-engine-v2-gameday-ui.js` remounts it on every live render from `v2PlayLogProjection(session.state,{playActors})`, remembers `v2InteractiveGameDay.fieldRows` (not persisted: a restored game opens at rest), and removes the 2D strip after copying its aria-label to the canvas. A pending decision renders above the field at every width (`fieldBelow`; CI at 1280x800 pushed the scoreboard off screen otherwise); `tests/gameday-calls-browser.js` checks the decision still fits and the field is live.
- Art: the v0.27 note that CONFERENCE RACE and DEVELOPMENT had no art was stale (both are in `KICKER`). The Around Your Program briefing (`living-world.js`) had none: `DynastyArt.briefKey(kind)` in `program-art.js` maps matchup/callback/following/team/league to pennant, ribbon-rosette, binoculars, roster-jersey and globe. Binoculars and globe are new in `tools/blender/props.py`. Test in `tests/rival-ceremonies.js`. The coach headset still only marks Staff (there is no single Coach's Desk heading to put it on).
- Full validation, every step on its own (80 steps: build, verify, `npm test`, audit, every browser, extended and storage suite, desktop smoke under xvfb): 79 passed. `fun-features-browser` still expected only conference, bowl, national and rivalry ceremonies; v0.27's awards ceremony is now in its list, and it passes. Briefing suites rerun after the art: living-world, brand-identity, accessibility, phone-floor pass.
- Not done: the field is not timed with a person; NIL for portal targets and promises stay on the full portal screen.

## v0.27.0 Blender art, turntables, awards ceremony — 2026-11-12

- Seven sprites `assets/awards/rivalry-{axe,jug,barrel,anvil,spade,bucket,cannon}.webp`, so every noun in `TROPHY_NOUNS` (`app.js`) has art; `DynastyArt.rivalryKey` in `program-art.js` maps them (shield is still the fallback). Built without Meshy (credits spent): modelled in code with Blender 5.0.1 as a Python module and rendered with Cycles, see `tools/blender/README.md`. Re-run `npm run build` after changing anything under `assets/` (`sw.js` lists it).
- The Wire: `KICKER` in `program-art.js` now covers FACILITIES (hard-hat), LOST/CUT/FLIPPED (compass), PAYOFF (dumbbell), MILESTONE (milestone-marker), RECORD WATCH/SCHOOL RECORD/NATIONAL RECORD (podium), COACH ARRIVAL (headset) and RECRUITING FALLOUT (envelope-letter). New sprites from `tools/blender/props.py`; shared helpers moved to `tools/blender/lib.py` (re-rendering the rivalry set reproduces the committed files). Still without art: CONFERENCE RACE and DEVELOPMENT, which are living-world stories, not Wire items.
- Season story rail (`storyCard` in `gameday-season-presentation.js`) shows `DynastyArt.kickerKey(s.kicker)` art (`.dl-art-kicker`, styled in `gameday-season-presentation.css`); player story kickers arrive lowercase (`role battle`), `kickerKey` upper-cases. 20 more `body.html` h3 headings got `dl-art-h3` art; only the four stat leader cards and Scheme-Fit Leaders / Program Production / Transfer Portal are left plain on purpose. New props: balance-scale, chalkboard, coaching-tree, seedling, cornerstone, file-cabinet. Checked: `v0112-presentation-browser`, `phone-floor-browser`, `accessibility-browser`, `npm run test:fast` (550/550).
- Turntables: `assets/turntables/*.webp` (12 strips, 36 x 192px, by `tools/blender/turntable.py`; the four Meshy rivalry trophies and Player of the Year come from the release `dynasty-assets-2026-11-11` GLBs). `DynastyArt.TURNS`/`turnSrc`; `turn(key)` in `ceremonies.js` falls back to the still. CSS `.cer-turn` in `brand-identity.css` (`--s` 132px, 96px on phones).
- Awards ceremony: `DynastyCeremonySnapshot` adds `kind:'awards'` from `universe.awards[year]` entries whose `team` is the controlled program (set by `finalizeSeasonHonors` in the offseason review). Tests in `tests/rival-ceremonies.js`.
- `forge.config.js` now ignores `.blender-venv/` (the Football environment creates it at the repo root; a desktop package would otherwise include Blender).
- Cloud environment "Football" (personal) installs Blender into `.blender-venv/` at session start; API keys were not copied to it.

## v0.26.0 portal day, quarter scores, art — 2026-11-12

- Portal day (handoff item 3, portal half): `offseasonPortal` in `app.js` opens `universe.portalDay={year,board,revealed}` and `portalDayNote` records each outcome touching the coach (kinds out, returned, left, in; sorted in that order), including commitments placed by `resolvePortalCommitments` during the advance. `offseason-stops.js` adds a `spring` stop that announces them (`revealNextPortal`, `portalRevealHTML`); `offseasonStopAfterAdvance` (called by `next-action.js` right after the advance) opens it straight after the portal resolves. Presentation only. Fixture: `__DL_TEST__.portalDayFixture()`; test `tests/portal-day-stop-browser.js`.
- Quarter scores: `v2RecordDriveArchive` stores `drive.q` (period of the drive's score, 5+ is overtime). `gameLineScore(g)` in `app.js` returns per-period points only when every scoring drive has `q` and the drives sum to the final score; legacy-engine and pre-0.26 archives show the old "not recorded" note. Shown in the v2 recap and the game summary; scoring rows say the quarter. Test `tests/line-score-browser.js`.
- Art: coin toss (live Game Day card), goalposts (fourth_down decision card), money bag (Facilities & Boosters head), locker room (Transfer Watch), ring turntable `assets/ring-turn-v1.webp` (36 x 192px frames, `.cer-ring` on the national title ceremony, rendered by `tools/procedural-art`).


## v0.25.0 art on every screen — 2026-11-12

38 sprites in `assets/awards/` (34 Meshy text-to-3D with PBR refine, 4 modelled in code), registered in `program-art.js` `DynastyArt.FILES`. Meshy task ids and prompts: `docs/art-pack-2026-11-12.json` (GLBs not committed). Renderer for both kinds: `tools/procedural-art` (three.js r169 in Playwright, camera yaw 35 pitch 24, 512px then 256px WebP q82). Placements: `.section-head.has-art` headers in `body.html` on 11 more screens; `dl-art-h3` icons on 16 card headings; `DynastyArt.kickerKey` icons in The Wire (`renderWeeklyHub`, the image adds no text so kicker text matching still works); `medalKey` on the top three leader rows (`statLeaderRows`); `stopKey` art on the offseason stop card; helmet on Draft Night; new milestone keys. Phone `.section-head.has-art` is a wrapping row (it had stacked and centred). Unused in the UI so far: coin-toss, goalposts and money-bag (money-bag marks BOOSTERS items in The Wire). Meshy credits are spent (16 left).


## v0.24.0 signing day in the offseason — 2026-11-11

Item 3 of the handoff, for signing day: `offseason-stops.js` (`mySigningDayLeft`, `signingDayMineFirst`, `signingRevealHTML`) announces the coach's contested signing day entries inside the signing stop, reusing `revealNextSigning` from `app.js`. Outcomes are still decided in `buildSigningDay`. `__DL_TEST__.signingDayFixture` builds a board where the coach is contested (every entry holds, so no commitment moves); `tests/signing-day-stop-browser.js` covers it. The transfer portal half of item 3 is not done: the portal stop still routes to the Offseason screen.

## v0.23.0 timeouts, art, release build — 2026-11-11

Continuation of the "What is left" list in `agent_docs/HANDOFF_2026-11-11_v0.22.0.md`. Done: the desktop smoke test (`xvfb-run -a node tests/desktop-smoke.js` after `node node_modules/electron/install.js`; it passes), timeouts (`createTimeoutDecision` in `game-engine-v2-gameday.js`, behind `session.driveCall`), the fast and slow unit tiers, and test hooks only under `navigator.webdriver` or Node (`dynastyTestHooksEnabled` in `app.js`; covered by `tests/release-build-browser.js`). Added the art pack's 256px sprites as `assets/awards/*.webp` through `program-art.js` (`DynastyArt`).

Not done: signing day and the portal resolved one name at a time.

**Start here:** `agent_docs/HANDOFF_2026-11-11_v0.22.0.md` (state, decisions, what is left, traps) and `docs/RELEASE_GAMEPLAN_2026-11-11.md` (review and plan).

## v0.22.0 install, offline, report — 2026-11-11

Sixth release of `docs/RELEASE_GAMEPLAN_2026-11-11.md`; its "Status at v0.22.0" section lists what shipped and what was left out across all six. `manifest.webmanifest`, `pwa.js` (registers the worker on http and https only), `tools/sw-template.js` and the generated `sw.js` (written by `tools/build.js` with the version and the asset list; CI now checks `index.html sw.js` are current), a Content-Security-Policy meta tag built in `tools/build.js`, and Report a problem and Credits in `title-menus.js`. `tools/publish.js` copies the manifest and worker beside the page.

`sw.js` is generated: run `npm run build` after a version bump or after adding a file under `assets/`, and commit it.

Fifty per-version checkpoint files moved from `docs/` to `docs/archive/`; nothing outside `docs/` referred to them.

## v0.21.0 phones and accessibility — 2026-11-11

Fifth release of `docs/RELEASE_GAMEPLAN_2026-11-11.md`. `phone-a11y.css` (loaded last by `tools/build.js`) sets a 44px control floor and a 12px text floor under `max-width:720px`. Its text rules use `!important` on explicit selectors, so before adding one, check it does not match text that is already larger: build without the file and compare (the method is in the commit that added it). `axe-core` is a dev dependency; `tests/accessibility-browser.js` and `tests/phone-floor-browser.js` are in `test:browser-extended` and `npm run test:accessibility`.

Corrections to the review in the game plan: the "25 unnamed controls on This Week" and "three h1 per screen" findings were wrong. The controls had names my first scan did not read, and only one h1 is visible at a time.

Also fixed here: `tests/visual.js` and `tests/adminconfidence.js` still expected wording changed in v0.17.2 and v0.20.0. The unit suite was run in full after each release; the full browser suites had not been, which is how these were missed.

## v0.20.0 a world you care about — 2026-11-11

Fourth release of `docs/RELEASE_GAMEPLAN_2026-11-11.md`. `mascots.js` (`DynastyMascots`, keyed by school id, loaded before the engine), `offseason-stops.js` (stops before departures, signing and the portal; reached from the Next button's controller in `next-action.js` through `globalThis.DynastyOffseasonStop`), the new-dynasty defaults in `acceptNewDynastySetup` (staff recruiting on, confidence at least 60), and `adminReviewSummary` in `app.js`.

Two things to know. The Next button's clicks are handled by `next-action.js`, which stops propagation; a handler set on `#hubAdvance` in `app.js` never runs once guidance is installed. And engine extensions are block scoped: a function declared in one is not visible from `app.js`, so cross-module calls go through a global.

`tests/helpers/start-new-dynasty.js` turns staff recruiting off unless a test passes `{staffRecruiting:true}`, so the existing suites still exercise a hand-run board. Only `tests/world-identity-browser.js` covers the new default.

Not done from the plan: program names were not changed (the name is the key in saves, schedules and about a thousand test references), signing day and the portal are not yet resolved one name at a time, and the stops do not ask for a decision inside the card; they route to the screen that holds it.

## v0.19.0 Game Day worth coaching — 2026-11-11

Third release of `docs/RELEASE_GAMEPLAN_2026-11-11.md`. Drive calls and key third-down defensive calls live in `game-engine-v2-gameday.js` (`DRIVE_CALLS`, `DEFENSE_CALLS`, `snapCall`, `createDriveDecision`, `createDefenseDecision`) and reach the play model through an optional `call` argument on `profileOutcome` in `game-engine-v2-adapter.js`. A missing call changes nothing, including the order of random draws. Sessions ask for calls only when created with `calls:true`; `v2GameDayUIPrepare` passes that for Coach It Live and not for Coach big moments, and `universe.liveGameDay.calls` records it so a saved game replays the way it was played.

The live screen (`game-engine-v2-gameday-ui.js`, `game-engine-v2-gameday.css`): typed decision card with trade-offs, `v2GameDayUIField`, `v2GameDayUIConsequence`, and `#gamelab.v2-live`, which hides everything but the game.

Not done from the plan: timeouts, and the animated 3D field (`game-cast-field.js`) on the live screen; the live field is a 2D strip. The plan's "6 to 10 minutes at default pace" was not timed with a person.

## v0.18.0 a dynasty that lasts — 2026-11-11

Second release of `docs/RELEASE_GAMEPLAN_2026-11-11.md`. Compressed, chunked export (`saveJsonParts`, `gzipBlob`, `saveFileText` in `app.js`), the crash screen (`crash-guard.js`, loaded first by `tools/build.js`), save size in Dynasty & Saves and a quota warning (`app-health.js`), and `tools/long-save-measure.js`.

Decided against more pruning: at seven seasons the save is rosters 33 MB (fixed), box scores 28 MB and retired careers 27 MB, and the per-season growth that is left is history a player can open. A second box-score tier would have saved about 0.7 MB a season of 9. Compression takes 299 MB to 34.9 MB at season 30.

Also re-took two engine golden hashes and the no-rules kick curve in `tests/play-model.js` and `tests/game-cast-field.js`; they pinned the pre-v0.17.2 fourth-down rule and should have moved with it.

Not verified: export on a phone, in-memory size at season 30 in a browser, weekly save time at season 30 in a browser.

## v0.17.2 visible fixes — 2026-11-11

First release of `docs/RELEASE_GAMEPLAN_2026-11-11.md`. Fixes the confirmed defects from that review: postgame panel clipping (`game-engine-v2-presentation.css`), field-goal range (`fieldGoalInRange` and `defaultFourthDown` in `game-engine-v2.js`, now the only place the rule lives), the week label (`seasonStageLabel`, header, save line, title screen all name the week being prepared), singular stat lines, the duplicate final, the "drive detail unavailable" line and phone toast placement.

Verified: `tests/field-goal-range.js`, `tests/gameday-clipping-browser.js` (1440, 1280, 390), the Game Engine 2 unit suites and the calibration report. `tools/game-engine-v2-compare.js` now samples 480 games; a 120-game sample moved mean points by 2 between runs of the same rules. Three calibration limits were widened (points 3 to 3.5, made field goals 0.5 to 0.75, home margin 1.5 to 2) because the legacy simulator still kicks from 55 yards at 82% overall.

## v0.17.1 Mac downloads — 2026-11-10

v0.17.0 was published to production and released with desktop ZIPs (macOS arm64 + Windows). v0.17.1 changes only the desktop distribution and the web About panel: a universal macOS build (lipo-checked in CI), an update check that reads the releases list (GitHub's /releases/latest ignores prereleases), install steps appended to every release by `release.yml`, and a download link in About. Release with the same three workflows; the attach workflow now names the Mac ZIP `macOS-universal`.

## v0.17.0 release preparation — 2026-11-10

The owner asked for a version bump and publication after PR #45 merged at `83cb2216f9f34dd4014742df84f05a618afc6be6` (review fixes, quick-sim margin calibration, recruiting-driven league parity, early-season ranking prior, routine fourth downs, recruiting effort, play-by-play actor names, name/jersey/class-year generation and polish). This preparation changes only version metadata, release notes and the generated standalone build. Publish production with the Publish Dynasty Lab workflow, create the v0.17.0 prerelease with Create GitHub Release, and attach desktop ZIPs from the passed `[release-ci]` Validate run for the exact release commit.

## v0.16.0 release preparation — 2026-11-08

The owner authorized production publication and macOS/Windows downloads after PR #44 merged at `4396e2c1360cd63ff40db93be1fb570c0a676016`. This release carries both Claude's merged play model/facilities/large-save work and the correctness/engagement improvements. The feature tree passed all seven PR CI jobs (run `42532996910`), including Node/build, main and extended browser suites, audit and packaged desktop smoke tests on both platforms.

This preparation updates version metadata, release notes and the generated standalone artifact; gameplay behavior is unchanged from PR #44. Production is still v0.15.2 until the manual Publish Dynasty Lab workflow succeeds. Create the v0.16.0 prerelease and attach desktop artifacts from a passed validation run for the exact release commit. Do not reuse old-version binaries or overwrite v0.15.2. Historical candidate/validation reports below describe their original delivery points.


## Unreleased isolated handoff candidate — 2026-11-08

The local `codex/dynasty-lab-correctness-current-20261108` worktree builds on Claude's merged PR #43 (`6e226c2`) and retains the D1–D4 correctness repairs. Its next stage adds factual, persistent homegrown first-start history; a three-stop first-Saturday tour plus optional full tour; saved medical delegation instructions; optional big-moments coaching with deterministic saved-action replay; and preparation/yearbook accessibility. This is an unpushed candidate, not a new release. See `docs/DYNASTY_ENGAGEMENT_2026-11-08.md` for final test results and the working native Chromium/loopback-HTTP validation route.


## Unreleased on top of v0.15.2 — deeper play model, facilities and boosters (2026-11-08, branch `claude/cool-knuth-aomwcv`)

Not released: the version is still 0.15.2 and the CHANGELOG entry is "Unreleased". Release only on the owner's explicit say-so.

**Play model** (`game-engine-v2.js`, `game-engine-v2-adapter.js`, new `game-conditions.js`)
- A game carries `state.rules` (`{version, penalties, returns, pressure, conditions}`). **No `rules` = the exact v0.15.2 behavior** (`tests/play-model.js` pins a digest of the committed engine; the old attribution digest in `tests/game-cast-field.js` is checked with `rules:false`). `adapter.profileOutcome` dispatches to `legacyProfileOutcome` or `profileOutcomeRules`; `createShadowGame` turns rules on unless `rules:false`; callers pass `year`/`week` (and `neutral` for postseason) so the conditions match the calendar.
- A live game is stored as seed + action list and rebuilt by replay, so `universe.liveGameDay` now stores `rules`; a save without it replays with `rules:false`. Do not change engine draw order for games with rules without thinking about that.
- Penalty outcomes (`outcome.penalty`) replace the snap in `applyScrimmage` -> `applyPenalty`. The event's `team` is the OFFENSE (so drive logic is unchanged) and `against` is the penalized side. Declined penalties are not drawn at all. Weights are in `PENALTY_TYPES` (engine) and `PENALTY_SCALE`/crowd factors (adapter); tuned with a scratch harness against the legacy model (5.4 flags and 41 yards per team, scoring within 2%).
- `kickoffTo` is exported and used by `game-engine-v2-gameday.js`; returns and return TDs (`touchdown` event with `kind:'return'`) are attributed to the depth chart's KR/PR. New player stat keys `returns`, `returnYds`, `returnTD`; new team box keys in `EXTRA_BOX_KEYS` (optional, so old archives still validate).
- Weather never touches the gameplay stream; `DynastyGameConditions.forGame` is a pure function of home program + year + week.
- Calibration report regenerated (`npm run calibrate:game-engine-v2`); remember to re-stamp after any engine/adapter/compare edit.

**Facilities and boosters** (`facilities-boosters.js`, `facilities-boosters.css`, host `#facilitiesBoosters` in `body.html`)
- Pure factory `makeFacilitySystem(env)` plus browser wiring, modeled on `staff-assignments.js`. State on the controlled team only: `team.facilityPlan` (`fund`, `goodwill`, `levels`, `projects`, `campaigns`, `nilBonus`, `log`). Created lazily; sanitized on every read.
- Wraps `resetNilSeason` (the season rollover hook: goodwill, completions, annual gifts), `nilBudgetFor` (campaign gifts sent to NIL), and `TAB_RENDERERS.program`. `recruiting-actions.js` takes an optional `env.hoursBonus` for Football Ops. Campaign outcomes are hash-based, never `gameplayRandom`.
- Every program has a plan. AI programs run `aiSeason` from the same `resetNilSeason` wrapper (fixed rule, hash-based tie-break, quiet: no events, no log). `globalThis.__FACILITIES_AI_OFF` disables it for soak baselines. Upkeep (`UPKEEP_PER_LEVEL=.9`) and `facilityGain` (+1 at rating 90+) came out of the soak: see `docs/SOAK_FACILITIES_2026-11-08.md`.

**Verification run so far** (Node 22 here, CI uses 24): full `npm test` 802/802 before the facilities tests were added (these pass separately: 10/10), the Game Day / recording / postseason / cast / weekly-desk browser suites, `one-more-saturday-browser`, `gameday-season-presentation-browser`, and the new `facilities-boosters-browser` at desktop and phone width. Not yet run: the complete `test:browser-extended` matrix, storage, audit, long-run/soak with the new systems, desktop packaging.

**Soak done** (`tools/facilities-soak.js`, 20 seasons, seeds 7 and 11): no stalls or invariant problems, no save growth beyond the existing archive growth, faithful reload, play-model rates on target. It found AI facility saturation, fixed with upkeep and diminishing returns. Weak and mid-tier controlled programs were also soaked (not locked out; they keep pace with the league). Electron is 44.10.2; the remaining `npm audit` items are in Electron Forge (build tooling, needs a major upgrade). A 20-season save was loaded in real Chromium and the real Electron shell (`tests/long-save-browser.js`, `tests/long-save-desktop.js`, `LONG_SAVE=<file>`). That found the first desktop save of a huge import taking 6 to 13 minutes (one giant bridge message); `desktop/staging.js` plus `saveInBatches` in `storage.js` fixed it (13 s). Packaged Mac/Windows smoke passed on CI at `ba20f57`. Forge is upgraded to 8.0.1 (audit 30 to 15). Remaining: an ordinary desktop save of a mature dynasty takes about 21 s at season 20 (main-process backup, write and prune; splitting the core was measured and does not help), and it grows with the dynasty.

## v0.15.2 published — 2026-11-08

All four reviewed fixes and three upgrades are merged and published. Portal commitments survive resolution; returned entrants regain a roster spot; successful desk edits autosave; custom playbooks affect the controlled team's weekly simulation; class reports load alumni and use appearances/starts; staff recommend portal prospects on a compact scouting board; first college starts can produce a factual recruiting callback.

- PR #42 merged at `b12699e7441cdc480ea53cda08c300f115094bcb`. The final head `2d64a84b975a03b6ab1b040dc4300cc26455b98c` adds the recovered blocked-commitment regression to candidate `7afa20c`. Its test-file blob `f6e427d9ce887aafa7e87cf4453227a9d06a9558` exactly matches the handoff patch. The merged tree has no file differences from the tested head.
- Final PR validation `42458989643` and merge validation `42459719832` passed, including engine/presentation, both browser suites, IndexedDB, audit, and packaged Mac/Windows checks.
- Production publisher `42459730687` passed. Pages deployment `42461642777` passed at `78123d697f162bdf2632b3aad38885b8c30f8ef9`. Root HTML blob `cf4712aeaa8ece14fda1b4efef4cdb2599e6aa59` matches the merged source exactly. The plain live URL displayed v0.15.2 in the title and main menu: https://markjrogers92.github.io/Football/
- Release workflow `42459758170` created tag `v0.15.2` at the merge commit. Attachment workflow `42460608890` published Mac ARM64 and Windows x64 ZIPs plus SHA256SUMS from merge validation. Release: https://github.com/MarkJRogers92/Football/releases/tag/v0.15.2
- Mac ZIP SHA-256: `df4618140da8bcf88543d299a5c12f07063e4441928c055064156adcef221497`. Windows ZIP SHA-256: `220222c55d0b37fd6b6642cf7dbae02ced6c2bafb1a023548b6f537e8cdd85d4`.
- Existing local checkouts, installed apps and real saves were not changed. No local v0.15.2 checkout was established in this continuation; resume from the GitHub tag or current default branch. No remaining release gate is known; a long-dynasty soak beyond the completed suites was not run in this continuation.

## v0.15.1 — Portal Desk, player arcs, staff assignments, playbook, tour, long-dynasty speed (2026-11-08, PR #41)

- `portal-desk.js` (portal hours, actions, odds, rival counters by hash), `player-arcs.js` (desk summary on `recruitingMemory.desk`, class cards graded vs same-year league classes, PAYOFF hub items), `staff-assignments.js` (`team.staffAssignments`; territory bonus via `territoryBonus` env hook in recruiting-actions, camp bonus via a `resolveDevelopmentCoaching` wrapper), `situational-playbook.js` (rules in `game-engine-v2.js`: `playbookFourthDown`/`playbookTwoPoint`/`playbookClock`; inert without `state.playbook`), `tutorial.js` (`universe.tutorial`).
- Postseason stage snapshots no longer clone `playerArchive`/`gameArchive` (trim on rollback, key order kept). `compactHistoryArchive` runs at rollover (horizon 3). The 256 MB desktop limit applies to the core only; archives are chunked.
- `TAB_RENDERERS` captures render functions at app.js time; a wrapper must also update the map (see player-arcs).
- Engine edits need the calibration fingerprint re-stamped (`tools/game-engine-v2-calibration-stamp.js`); `npm run calibrate:game-engine-v2` rebaselines the legacy `old` row too, which has drifted since 0.9.56.

## Recruiting news and tooling (branch `claude/pensive-gates-g6e24q`, after v0.15.0, included in v0.15.1)

- News: `recruiting-actions.js` keeps a per-season ledger on the controlled program (`team.recruitingSeason`: hours, actions, won/lost/cut/flipped entries, rival moves, answered), written by `perform` (`noteSpend`) and the weekly pass (`noteWeek`). `newsItems` turns the week just played (`team.recruitingLastWeek.funnel` / `.flipped`, now objects not names) into LOST / CUT / FLIPPED hub items via `DynastyRecruitingNews`, wired into `buildWeeklyHub` in `app.js`; `deskSummary` feeds the season review (`DynastyRecruitingSeason`, `season-review.js`). Decisions carry `listed` and `offered` so the explanation is built from records, never guessed.
- Staff plan: offers now also go to any target whose Top 5 or Top 3 includes the program (`onHisList`).
- Tooling: `tools/recruiting-calibrate.js` and `tools/recruiting-soak.js`, tested by `tests/recruiting-calibration-tools.js`, documented in `docs/RECRUITING_CALIBRATION.md` (policies, how to read the output, the v0.15.0 baseline, caveats). The scratch scripts from the v0.15.0 work are gone; use these.
- Soak finding: the desk adds about 30 KB per season to a save and nothing measurable to memory (a game with the desk removed produces byte-identical saves). The save does grow about 15 MB per season in the full runtime (about 12.8 MB in the bare engine): that is the existing archive growth in `docs/SAVE_SIZE_MEASUREMENT.md`, not the desk.

## v0.15.0 — Recruiting Desk (2026-11-08, branch `claude/pensive-gates-g6e24q`, PR #40)

- Goal from the owner: recruiting should be an active weekly decision like the NCAA games, not passive scouting. Scope agreed: Phase 1 = recruiting hours + action menu + neglect cooling, separate from evaluation hours; staff can run it. Not built yet: stage funnel / Top 5 cuts / decision dates, hidden motivations and dealbreakers, rival reactions, recruiter assignments (see the design in the CHANGELOG "Unreleased" entry's follow-ups below).
- New `recruiting-actions.js` (pure factory `makeRecruitingActionSystem` + browser wiring) and `recruiting-actions.css`, registered in `tools/build.js` and `tools/harness.js`. `app.js` gained two overridable hooks (`recruitEffort`, `userMayCommit`) used by `advanceRecruiting`, `finalizeRecruiting` and `placeUnsignedElites`; with the module absent the engine is bit-identical to before (verified by hashing a seeded 11-week run before/after). The weekly pass keeps the original RNG draw order.
- Calibration (scratch harness, not committed): full seasons x 9 seeds x low/mid/high programs x policies idle/casual/staff/skilled/legacy. Constants live at the top of `recruiting-actions.js`. Finding worth knowing: in the old system a board of 25 top prospects landed only ~0.3-0.8 of them, because signing day hands over targets only while the class has room and interest is already 68+.
- Tests: `tests/recruiting-actions.js` (28, rules + engine), `tests/recruiting-actions-browser.js` (desktop + phone). Both are in `package.json`.
- Phase 2 (same branch): hidden second priority and dealbreakers in `recruiting-actions.js` (`motivesFor`, `dealbreakerUnmet`, `intel`, `knownBlock`, `learn`). Constants at the top: `SECOND_AT=2`, `DEALBREAKER_AT=4`, `DEALBREAKER_RATE=30`, `DEALBREAKER_FLOOR=50`, `SECOND_FIT=.7`, `DEALBREAKER_PITCH=-6`. Dealbreakers apply to the controlled program only (rivals are unchanged) and are off for migrated saves (`recruitingActions.migrated`). The pitch menu prices a topic by what he has told you (`pitchProjection` default) while a real pitch uses the true fit (`{actual:true}`), which is the discovery reward. Recalibrated over 9 seeds x 3 tiers: shape unchanged (legacy ~ casual ~ staff, idle slightly lower, skilled +1.2 to +3.1 blue chips).
- Phase 3 (same branch): rival reactions in `recruiting-actions.js` (`generateRivals`, `rivalHeat`, `rivalPressure`, `answerRivals`, `rivalMoves`, `liveMoves`, `unansweredMoves`). State is `recruit.rivalWatch={season,stages,events}`. Constants at the top of the rival section: `RIVAL_BASE` (3/4/4 per rival per week), `RIVAL_HEAT` (3/5/7), `RIVAL_MIN_WEEK`, fade ages. Heat feeds `recruitPitch` for that rival only; `rivalPressure` is subtracted from interest through `recruitEffort`'s `cool`. Lesson from calibration: pitch heat alone moved interest <1 point a week and made ignoring rivals free, so pressure was added; with it, casual play ~ the old behavior, skilled play (answers moves) keeps its edge. `answered` stores the week answered and can be 0 in the preseason, so use `isAnswered`, never truthiness. Browser test injects moves through `DynastyRecruitingActions.addRivalEvent` and `DynastyRecruitingDesk.recruit/team`.
- Phase 4 (same branch): the decision funnel and flip defense. Funnel state is `recruit.funnel={season,decisionWeek,top5,top3,cut,decided}`; `runFunnel` runs before the weekly pass inside the `advanceRecruiting` wrapper (cuts, then due decisions), `holds` gates the weekly commit roll through the new `recruitHolds` hook in `app.js` (the draw still happens, so the seeded stream is unchanged and the module-absent hash is identical), and `recruitKeepBoost` feeds `pressureCommit`. Constants: `FUNNEL_*`, `TOP_WIDE/NARROW`, `CUT_*_BEFORE`, `INTEREST_PIVOT=55`/`INTEREST_WEIGHT=.45` (your standing), `SAFETY_INTEREST=65` (the slot you keep if offered and liked), `STAFF_OFFER_AT=55`, `KEEP`. Calibration lessons: ranking you by raw pitch against 120 programs was far too punishing (skilled low programs fell from 3.8 to 0.2 blue chips) because the work you do lives in his interest; a recruit with no room among his finalists must fall back to the best program that has room or he never decides; and the hold on random commits is itself a large advantage, so the interest pivot was raised to 55 to keep skilled mid programs near +1.8. Low-prestige casual and staff play ends up below the old behavior; that is documented in the changelog. Calibration scripts are scratch and not committed.
- Follow-ups worth doing: per-position recruiter assignments, and a "keep warm" action for committed recruits (flip defense).

## v0.14.5 — 2026-11-07

- From owner playtest feedback: a coached (Coach It Live) game was discarded and re-simulated when the week advanced. Live games now record at the final whistle, any advance finishes and records the same game, and the live game is kept in the save as its seeded action log (`universe.liveGameDay`) and rebuilt after reload. New `tests/live-game-lock-browser.js`.
- Decision Room (`decision-room.js/.css`): required weekly decisions open in a dialog with the involved players side by side, the staff pick and every option. New `tests/decision-room-browser.js`.
- Optional setup reminders on This Week (recruiting board, scouting hours, training focus, featured plans) via new guidance items; never blocking.
- Calmer layouts (`calm-layout.css`): Game Day hero is the matchup only, no boxes inside boxes, hidden empty/duplicate panels. Game Day visible words 675 -> 387.
- Validation here: npm test 650/650, test:browser, test:browser-extended and test:browser-storage all passed locally (Chromium 1243).

## v0.14.4 candidate (unpublished) — 2026-11-07

- Branch `claude/eager-albattani-agpo72` from `84a7770`. Canonical handoff: `agent_docs/HANDOFF_2026-11-07_v0.14.4.md`. Nothing published or installed; no real saves touched.
- Fixed soak defects D1 (load-time academic defaults no longer draw gameplay RNG), D2 (desktop storage prunes unreferenced chunk generations, keeping everything retained backups need), D3 (oversized-save message), H1 (recruiting search test asserts the real match count) and P1 (incremental story-ID index replaces full event-log scans).
- D1 verified with the soak drivers (seed 7, 2 seasons, `CHECKPOINTS=2 HOLD_WEEKS=3`, then `fork-check.js` from the native save): all three held weeks are identical between the uninterrupted and reloaded sessions, including RNG position. Remaining state differences are only defaults a load fills in (AI-team academic fields, `portalCycle`, `careerHistory`, `jobOffers`, `setup`, `setupCompleted`) plus the version string, matching the soak report's prefill control.
- Presentation: postseason on the Season card, week strip and ticker; stage names in the status bar; rank arrow reset per season; History counts a finished season before review and adds a Dynasty Arc chart; transfer portal paging.
- Validation in a Linux cloud container (Node 22, Chromium 1243): `npm test` 644/644 at the soak-fix commit and 650/650 at the final candidate; 20 affected browser suites passed. Packaged desktop, Windows, Safari and the full CI matrix were not run here.

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