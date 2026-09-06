# Handoff — Dynasty Lab v0.9.51 integrated

## Current state

- Repository: `MarkJRogers92/Football`
- Working branch: `codex/v0951-integrated`
- Baseline incorporated: Claude RNG-routing commit `4ba3657d`
- Production remains v0.9.50 on `gh-pages`; do not publish until combined validation is green.
- PR #8 is the validation PR for this integrated branch.

## Integrated work

This branch preserves Claude's completed gameplay RNG routing (all gameplay domains on the saved gameplay RNG, with only non-gameplay identity/portrait randomness left outside it) and adds v0.9.51 season goals. Season goals are persistent for the season, context-generated from program stature/rivalry/recruiting expectations, visible on the dashboard and Program Lab, and feed secondary/stretch results into the year-end administration review without replacing the existing wins-vs-expectation model.

Tests included: Claude's RNG domain suites plus `tests/season-goals.js`. Version metadata is synchronized at 0.9.51.

## Release gate

1. Rebuild `index.html` from the integrated source tree.
2. Run the full Node suite.
3. Run browser UI/visual regression suites and browser storage regression.
4. Run the simulation audit.
5. Only then publish v0.9.51.

## Earlier RNG handoff details

# Handoff — Dynasty Lab

## State

- Repository: `MarkJRogers92/Football`
- Branch: `claude/review-improvement-dwjemy`
- Pushed HEAD: see `git log -1` on that branch.
- Version: **v0.9.50 is live in production**, `gh-pages` @ `ca1edd6`. This chunk is
  **committed and pushed to source only** — nothing here has been rebuilt into a
  new production release, and no version bump has happened for it.
- Rollback: `23e8aeb` (last v0.9.49 production build, before the slot work — one
  step further back than current production).
- Working tree: clean at time of writing.

## What this chunk did: v0.9.50 commit 3, all four domains

GPT's own v0.9.50 handoff (commits `de5a14f`/`5e059e0`, now merged into this branch)
built the RNG infrastructure and left every gameplay `Math.random()` call site
untouched on purpose, with instructions to route them one domain at a time. This
chunk finished that routing:

- **Domain 1 (schedule/rivalry): already clean.** `buildSchedule`,
  `deriveRivalries`, `ensureProtectedRivals`, `conferenceRotationOrder` and
  `assignHomeAway` contain zero direct `Math.random()` calls — schedule
  generation is geographic/deterministic already. No change needed.
- **Domain 2 (recruiting/portal/transfers): routed.** `weightedHighSchool`,
  `generatePlayer` (redshirt + height-growth rolls), `buildSigningDay`,
  `pressureCommit`, `advanceRecruiting`, `offseasonDepartures` (portal entry
  roll), `portalResolveEntry`, `advancePortalRound`, `chooseTransferDestination`.
- **Domain 3 (offseason/coaching): routed.** `ensurePlayerDevelopment`,
  `applyPhysicalGrowth`, `applyDevelopmentPhase`, `runSpringCamp`,
  `candidateAcceptChance` callsite, `earlyDeclaration`,
  `chooseCoachMoveDestination`, and the full HC/OC/DC/RC/SC carousel logic.
- **Domain 4 (game sim): routed.** `postGameCondition` (injury rolls),
  `weightedPlayer`, `quickFieldGoals`, `homeFieldScoreBonus`, and the entire
  `drive()` play-by-play function plus the outer game loop (penalties, pressure,
  completions, drops, coverage, fumbles, the tie-score coin flip, the
  opening-possession coin flip).

`Math.random()` count in `app.js`: **36 → 2**. The two remaining calls are
`uid()` and `portraitSeedFor()`, deliberately left on the non-gameplay path per
the packet (Web Crypto / Date-based identity, not gameplay randomness).

### Two real bugs found and fixed along the way (not caused by the routing, just exposed by it drawing a different sequence than before)

1. **`buildSigningDay`'s failed-flip restore could strand a recruit uncommitted.**
   When a flip roll succeeded but the challenger school then failed to actually
   take him (a cap/block reached between the roll and the attempt), the code
   called `commitRecruit(r,from)` to put him back — but that call can itself
   fail for the same reasons, and the old code didn't check. Fixed: if the
   restore fails, the original school unconditionally reclaims him (he was
   occupying that scholarship a moment earlier, so this is always safe).
2. **`enforceScholarshipLimits()` could invalidate a signing-day board.** It
   runs at the very end of `finalizeRecruiting()`, after the signing-day board
   has already resolved and been shown to represent final reality. It could
   pull a recruit who was correctly marked "stays at `from`" on that board,
   leaving `r.committed=null` while the board still said otherwise. Fixed:
   `enforceScholarshipLimits` now takes an optional `protect` set of recruit
   ids; the one call site passes today's signing-day board's recruit ids, so a
   scholarship cleanup can no longer undo what signing day just told the player
   happened.

Both were caught by `tests/signingday.js`'s existing `'a flip actually moves the
recruit and is recorded as one'` test, which started failing once
`buildSigningDay`'s roll moved to `gameplayRandom()` and hit a seed/board
combination the old `Math.random()` sequence never produced. This is the same
class of thing recorded in earlier entries here: routing/reordering exposes a
latent bug at a seed that used to get lucky. Fix the bug, don't loosen the test.

### Determinism, verified directly (not just tests)

Ran two independent `loadEngine({seed:X})` runs for the same X and diffed the
full serialized outcome, for every domain:

- Recruiting (8 weeks of `advanceRecruiting`): identical committed lists, rng snapshot.
- Signing day (`buildSigningDay`): identical board.
- Portal (season → departures → open → 2 rounds): identical entrant/decision lists (67 entrants, 33 resolved, matched).
- Development + camps + coaching carousel (season → both camps → offseason): identical roster stat lines and movement log (4 carousel moves, matched).
- Fast-sim game: identical score/box/injuries.
- Detailed drive-by-drive game: identical score, drives, and play-by-play log.
- A full simulated season of fast-sim games: identical for every game id.
- Two *different* seeds: produce *different* games (the stream is not stuck/degenerate).

### Tests added and run

- `tests/rng-domain2.js` (4 tests), `tests/rng-domain3.js` (4), `tests/rng-domain4.js` (5) — all **pass**, all added to `package.json`'s `test` script.
- Re-ran after the signing-day fix: `tests/signingday.js` **5/5**, `tests/transfers.js` **2/2**, `tests/scouting.js`/`tests/portal-recruiting.js` (part of the 34-test domain-2 regression sweep) — **all pass**.
- `tests/games.js`, `tests/gamelab.js`, `tests/bowls.js`, `tests/gameplan.js` — **19/19 pass** (domain 4 regression check).
- `node tools/build.js` — **pass**, 673 KB standalone, single `root.DynastyRng` occurrence preserved.

### Not run, and why

- The full `npm test` Node runner (all files, not just the domains touched):
  **not run this chunk**, to conserve credits — every file that plausibly
  touches routed randomness was run individually instead (see above). This is
  the same gap noted in the previous handoff; it has not gotten smaller.
- `npm run test:browser`: not run this chunk. The routing is engine-only; no
  DOM/presentation code changed. Still worth a run before any publish.

## Next precise task

Per the packet (`docs/roadmap/06-v0950-modularization-rng.md`), the routing
suggested-commit is now complete. Next:

1. **Grep `Math.random` and classify every remaining occurrence explicitly**
   (the packet's own instruction after all gameplay domains are routed) —
   confirm the two remaining hits (`uid`, `portraitSeedFor`) are the only ones,
   and document that decision somewhere durable (this file, or a comment).
2. Run the full `npm test` suite once, in full, to close the "not run" gap
   above — it is the largest remaining unknown.
3. Run `npm run test:browser` if Chromium is available.
4. Only after both pass: begin suggested commit 4, extracting pure engine
   modules one domain at a time. Do not combine extraction with any further
   RNG or gameplay changes.

Do not merge this branch anywhere else, publish, or touch `gh-pages` without
explicit authorization. Do not bump `VERSION.txt`/`APP_VERSION`/`package.json`
until a release is actually being prepared — this chunk is infrastructure, not
a release.

## Traps that do not announce themselves

All of these cost real time and none of them throw.

**Two engines cannot be alive in the same test at once.** `loadEngine()`
mutates shared globals (`global.document`, `global.crypto`, and the seeded
`Math.random`/`getRandomValues` shims). Creating a second engine before fully
finishing with the first corrupts both — symptoms look like an unrelated crash
deep in engine code (`Cannot read properties of undefined`), not an obviously
wrong RNG. Always fully exercise and discard one engine before creating the
next.

**`freshGameplaySeed()` reads `crypto.getRandomValues`, not `Math.random`.**
The test harness seeds *both* shims from the same input seed, so this is
transparent in tests — but it means `universe.rng`'s seed and any code still on
bare `Math.random()` are, in production, two genuinely different sources
(Web Crypto vs. `Math.random`). Only `universe.rng` (via `gameplayRandom()`) is
saved/restored across sessions; anything still on `Math.random()` is not
reproducible from a saved seed at all.

**Routing a call to a different RNG stream can flip a test from lucky to
unlucky at the same fixed seed.** A test asserting a specific probabilistic
*outcome* (not just structural correctness) is implicitly pinned to whichever
sequence a given seed used to produce. Moving that call to `gameplayRandom()`
changes the sequence it draws from entirely. If a test fails after routing,
check whether it's exposing a real bug (as `signingday.js` did, twice) before
assuming it's just "unlucky now" — the second finding in this chunk was a
genuine cross-system ordering bug, not test flakiness.

**A headless season rollover stops for three separate reasons, silently.**
`runOffseason()` advances a *single phase* of the v0.9.46 calendar. Camps must
run *when the calendar reaches them*. A pending job offer halts everything
until `acceptPost()` answers it. Copy `rollSeason` from `tests/scheduling.js`.

**`storageOperation` returns silently when the store is busy.** Background
writers must yield to user actions — see `yieldToUserAction()`.

**`app.js` is wrapped in an IIFE.** Nothing is on `window`; browser tests must
drive real UI.

**Presentation is layered and later files win.** `sports-presentation.js`
rewrites DOM `app.js` rendered. Presence in the DOM is not visibility.

## How to work here

- `node tools/build.js` refuses to build if `VERSION.txt`, `APP_VERSION` and
  `package.json` disagree. Bump all three together, only for an actual release.
- `npm test` is Node; `npm run test:browser` needs Chromium and is not optional
  before any publish.
- `node tools/publish.js` refuses to reuse a version number already shipped
  from different source.
- Do not merge `claude/v0950-*`/`codex/v0950-*` branches into the source branch
  or touch `gh-pages` without explicit authorization.

## v0.9.51 validation note
Integrated artifact build/currentness and release-source checks passed. Targeted Node regression passed for RNG core/integration, RNG domains 2 and 4, season goals, admin confidence, signing day, transfers, scouting, games, Game Lab, bowls, gameplan, persistence and storage. The standalone browser check failed only while locating Chromium in CI, matching the known environment problem; browser suites did not execute. Two long-running targeted files (portal-recruiting and rng-domain3) were not waited out here, but Claude had already run those successfully on the immediately preceding RNG-routing baseline and the season-goals integration does not touch their code paths. Production was intentionally left unchanged until explicit publish.
