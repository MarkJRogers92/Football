# Dynasty Lab — player identity batches in progress

Active source branch: `codex/player-identity-batches`, based on `ba26de1`.
Read [the all-position roadmap](docs/PLAYER_IDENTITY_ROADMAP.md) first.
Then read [the strategy integrity audit](docs/STRATEGY_INTEGRITY_AUDIT.md), which
maps game, stats, scouting and matchup surfaces to actual engine behavior and
sets the repair order. Recruit scouting continuity is the first critical defect.
User requested small committed/pushed batches for easy Claude/chat takeover,
covering every position, ratings, descriptions and actual statistical behavior.
Production remains v0.9.39. These are source checkpoints, not a new release.
Batch 0: roadmap saved. Batch 1 now makes quick-sim QB rushing share depend on
the actual QB style, speed and versatility plus scheme context. It does not yet
change Watch play attribution. Remaining batches
and acceptance criteria are in the roadmap; do not claim the full overhaul done.
Focused validation: `node --test tests/playeridentity.js tests/games.js` passes
all 7 tests, including both real game engines' existing reconciliation coverage.

Batch 2 complete: shared style opportunity multipliers now direct RB carries,
RB/WR/TE targets and production, defensive tackles/rush/coverage/takeaways, and
offensive-line negative protection events. Ratings remain in each efficiency
formula. Specialist opportunities already belong to the K1/P1 role starters;
their outcome tuning and Watch's actual-play attribution remain later batches.

## Previous production checkpoint

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `codex/v0939-game-consistency`
Production branch: `gh-pages`
Production: v0.9.39 at https://markjrogers92.github.io/Football/

## Current work

The user authorized publishing the existing quick-sim home-field patch first.
That patch is now production (still v0.9.37), from source branch
`codex/v0937-homefield-release`, commit `9f33ae3`; production was verified
byte-identical to that build. It adds the fan-support-based homeFieldScoreBonus.

v0.9.39 is the subsequent production release. v0.9.38 was already used for
Claude's storage measurement work, so its number is not reused here.

- Shared completeScheduledGame writes schedule results and settles rivalry
  consequences for both quick games and Watch/instant detailed games.
- Rivalry settlement guards the series, fan effects and event together, using
  the existing lastYear values. Advancing past an already-played current-week
  rivalry settles it if an older detailed-game save had skipped the hook.
- Detailed games now use the same dynamic home-field helper as quick games.
  Neutral sites get no crowd bonus; recorded score adjustments still reconcile.
- Restored the v0.9.36 title/Continue/Load regression coverage and bowl-aware
  browser-storage count. Kept the newer version-label test and Game Lab fixes.

No new save fields, archive rewrites, schema migration, or historical inference.
Validation: version-label check and 53 smoke checks passed. Of 152 Node tests,
151 passed in the full run; the remaining name-collision assertion was corrected
and passed its targeted rerun. All 164 desktop/mobile browser checks and 8 real
browser persistence scenarios passed. See WORKLOG for the two test-fixture fixes.
The preserved preview is https://markjrogers92.github.io/Football/preview/v0939/.
The user approved production promotion on September 4, 2026, and the live files
were verified after publication. Next feature candidate remains bounded
captains/mentorship.

## Previous release

v0.9.37 merges two parallel v0.9.36 releases — GPT's and this branch's — after
both cut from v0.9.35 and this branch's publish overwrote GPT's in production.

**Read this before publishing again:** the actual defect was publishing to a
shared target without first checking whether that version number was already
taken on `gh-pages`. Check `git log origin/gh-pages` for the version you are
about to publish, every time.

GPT's gameplan design won on merit and supersedes v0.9.35's: directional prep
(stop the run / protect the pass / pressure the QB, each giving one thing and
costing another) instead of an intensity slider, and wear deferred to game
time via `wearPending`/`wearApplied` instead of charged when the card is
answered. This branch's Game Lab freshness fix rebased cleanly on top.

## Previous release

v0.9.36 fixes a player-reported inconsistency: the Game Lab's lower panels
showed the last game run through *its* buttons while the card above them
showed the current next game, with no week label on either. A dashboard sim of
your own game now clears the stale detail, a game played through the Game Lab
keeps it (`simWeek` skips already-played games — that asymmetry is the whole
fix), and the box is stamped with season/week.

Note for anyone working here: the two engines are not interchangeable. A
dashboard-simmed game has a box score but `drives: []` and no play-by-play;
only `detailedGame` produces those. The Game Lab is the only way to generate
that detail, so it is not redundant with Game Center.

## Previous release

v0.9.35 reconciles v0.9.34 (GPT's title screen — New/Continue/Load Dynasty)
the same way v0.9.29-32 was reconciled: extract changed source files out of
the live build using byte-identical unchanged neighbors as anchors, verify
the rebuild matches production exactly. If you do this again: **polish.css
is the last CSS file before `</style>` and cannot be verified by prefix
matching** — extract it using the `</style></head><body>` boundary directly,
first time, not after a failed byte-diff points you at it.

Two things reconciling this exposed, fixed here: the title screen's
background image (`assets/title-stadium-v1.jpg`) lives on `gh-pages` but was
never committed to the repo — pulled and committed. This is the project's
first dependency on an external file rather than a single self-contained
HTML page; worth a deliberate look, not something to quietly keep growing.
And all four browser test files needed a `startNewDynasty()` helper since
`#userTeam` no longer exists until a dynasty is started from the title screen.

Also fixed: full scout in the weekly gameplan (v0.9.33) had no real cost
outside an active scheme installation, which is nearly always — reported
directly by the player as "why wouldn't you always do it." Added an
unconditional starter-wear cost alongside the existing conditional
familiarity cost.

## Previous release

v0.9.33 adds program history (all-time record + coaching lineage on the
Program tab, for whichever program is selected) and the weekly gameplan (a
Coach's Desk card that scouts the upcoming opponent for a small in-game edge,
costing real scheme-install progress only while a program is mid-transition).
Both closed out items on IDEAS.md.

## Previous: reconciliation, not a feature

v0.9.29-32 shipped from a parallel GPT/codex session directly to `gh-pages`
with no source ever pushed to any branch or PR — the only record was the
built `index.html` in gh-pages history. Reconciled by exact extraction (see
CHANGELOG/WORKLOG for method); the rebuild is byte-identical to what was live.
Added: Game Center drive-by-drive replay / watch mode. This branch's own
v0.9.21-28 work is untouched and still fully present.

**If this happens again:** check `git fetch origin gh-pages` vs your branch's
VERSION.txt before assuming production matches source. `tools/build.js`'s
file-concatenation is exploitable for exactly this kind of reconciliation —
diff each source file against the live bundle with `String.indexOf` before
assuming any of them changed.

## Previous release

v0.9.28 fixes a real bug found by a 7-season headless soak test (not by hand
play): an ignored job offer froze career progression forever while the rest of
the game kept running. `simWeek`, `simSeason` and `simulateUserDetailed` now
block on `hasPendingCareerChoice()`, the same pattern the Coach's Desk already
used for weekly decisions. The one non-obvious part: `simSeason`'s fast-forward
loop needed its own guard, or a blocked `simWeek` would leave it spinning
forever rather than hanging cleanly. See WORKLOG.

If you soak-test again: this confirms multi-season headless runs find things
single-season tests structurally cannot. Worth doing again after the next
batch of features that touches offseason/tenure/career state.

## Previous release

v0.9.27 adds the coaching tree (Staff tab; producing a head coach is worth up
to two prestige a season, credited once per coach via `t.coachTreeCredited`),
a `no-cache` meta on the built page because GitHub Pages holds HTML for ten
minutes, and **roadmap B's measurement**.

## Roadmap B: measured, and the roadmap was wrong

Read `docs/SAVE_SIZE_MEASUREMENT.md` before doing anything here. The roadmap
said growth was ~4 MB/season driven by `universe.events` and `seasonHistory`.
Measured over six seasons: growth is **11.4 MB/season**, `events` is **2.0%**
of the save, `seasonHistory` grows 0.33 MB/season, and the real drivers are
`gameArchive` (41.8%) and `playerArchive` (22.9%) — 80% of growth between them.
Implementing the roadmap as written would have cost the wire and the story
surface to reclaim under 3%.

Next step is **another measurement, not an optimisation**: those are
`packUniverse` numbers and the browser already chunks/defers `playerArchive`,
so instrument `saveBrowser` and read back real IndexedDB record sizes first.

## Previous release

v0.9.26 closes roadmap milestone C: fourteen flat tabs become five groups
(Program, Team, Recruiting, Games, Staff & Offseason). The tab buttons are
untouched — same markup, same `data-tab` values — so `go()`, hub tiles and
weekly-plan steps all still resolve; grouping is a visibility layer on top.

If you add a tab, add it to `TAB_GROUPS` or it will never be visible. And note
`setActiveTab()` syncs the group on every activation: a programmatic jump with
`el.click()` works on a hidden button, so without that sync a hub tile would
open a tab with the wrong group highlighted.

## Previous release

v0.9.25 adds academic eligibility. Standing drifts weekly toward
`academicTarget()` (program support + player iq - wear); below 30 the player is
ineligible for two weeks, enforced in `gameAvailable()` so no selection path can
route around it. A new Coach's Desk card trades academic standing against scheme
familiarity, with no option that is simply correct.

Carry this forward if you touch the curve: standing equilibrates about **8
below** target under the weekly drag, so the target range decides whether the
floor is reachable at all. The first tuning bottomed out near 38 against a floor
of 30 and the feature would have shipped inert. See WORKLOG.

## Previous release

v0.9.24 makes signing day a live event. Contested commitments are resolved
inside `buildSigningDay()` during `finalizeRecruiting` and revealed one name at
a time; revealing is pure presentation and changes no outcome, which is the
invariant to protect if this is ever extended. It also fixed a pre-existing
bug: `r.challenger` was never cleared on commitment, so a recruit who flipped
to his challenger kept naming that school as his challenger, and the WAVERING
pill and the weekly plan's "Hold X" step both fired on recruits nobody was
chasing.

## Previous release

v0.9.23 adds bowl season and a fanbase that answers to results. A `bowlReady`
phase sits between the conference round and the playoff; every six-win team
outside the playoff field plays one more game. `simPlayoff()` deliberately
plays the bowls itself if called from `bowlReady`, so bowls cannot be skipped
and the thirteen existing test files that call it directly still work.

`fan_support` now moves once a season and decays toward a per-program
`fanBaseline`, and it drives home-field advantage — previously a flat 2.2 for
all 120 programs, now `2.2 + (fan_support-60)*0.03`, deliberately centred so a
median program is unchanged. `gameSim` is the most load-bearing function in the
engine; that centring is why this is a spread around current behaviour rather
than a league-wide rebalance, and a test pins the median to 2.2.

## Previous release

v0.9.22 closes the hole v0.9.21 opened: the administration could end a tenure
and the run had nowhere to go. A closed tenure now archives to
`universe.careerHistory`, and up to three programs at or below a ceiling
derived from your resume will hire you. The career record carries across
posts. Two guards are load-bearing and easy to break: a closed tenure stops
accruing seasons until a post is taken, and switching the controlled program
by hand closes the old tenure as "stepped away" rather than misattributing
its seasons. See WORKLOG for both.

## Previous release

v0.9.21 adds the three stakes features from `IDEAS.md`: rivalries (derived
from the schedule, with persistent series and trophies), the administration
(a preseason expectation and a confidence score that judges the player on the
same formula `carousel()` uses on AI coaches), and NIL as a finite per-season
budget spent on retention or recruiting. Read `IDEAS.md` for the remaining
nine ideas and WORKLOG for the two assumptions that turned out wrong during
implementation.

Known trade-off worth carrying forward: rivals are the nearest conference
school **that is actually on the schedule**, because the round-robin plays
eight of eleven opponents. That means a program's true geographic neighbour is
sometimes not its rival. 114 of 120 programs are paired.

## Previous release

v0.9.20 completes roadmap milestone A with the story surface: record-chase
alerts on the wire, and a career chronology in the player profile. Both read
data the game already stored. The record chase works because season records
are rewritten only at year end (`finalizeSeasonHonors`), so a running stat
line compared against them is a real chase against a prior year's mark; see
WORKLOG for why that single fact shaped the design. Milestone A is done.

## Previous release

v0.9.19 ranks the weekly hub ("the wire") by importance instead of insertion
order. Every tile now carries a numeric importance on the same 0–100 scale
`universe.events` uses — previously only the coach-fallout and familiar-face
tiles did, so the sort the roadmap asked for would have compared `undefined`
on most of a normal week. See CHANGELOG/WORKLOG for the per-tile values. The
CSS `order` grouping by tile type in `polish.css` is unchanged.

## Previous release

v0.9.18 reconciles three previously-diverged GPT/codex feature branches
(v0.9.14–v0.9.16, only in their own previews before this) onto the
commercial polish pass (v0.9.17). All three feature branches are now fully
part of the main line — nothing is orphaned.

- **The Coach's Desk** (v0.9.14): the Weekly Command Center can open up to
  three state-backed coaching decisions in a controlled-team week (workload,
  redshirt threshold, playing-time concern, recruiting priority choice).
  Reuses existing rotation/morale/trust/promise/visit systems.
- **Player Agency / Locker Room** (v0.9.15): players can now initiate five
  Coach's Desk conversations (playing time, transfer concerns, role
  requests, redshirt, position change). Shares `universe.weeklyDecisions`
  and the event ledger with the Coach's Desk; capped cadence so it never
  becomes a constant interruption.
- **Scouting Intelligence** (v0.9.16): recruit and player profiles show five
  position-specific scouting domains as ranges with confidence labels,
  derived from existing attributes. Confidence responds to evaluation
  exposure; belief snapshots are preserved at meaningful checkpoints
  (first evaluation, signing day, first fall camp, end of freshman season).
  Hidden true ratings remain hidden.
- The player profile no longer shows raw Speed/Power/Technique/IQ grades
  (removed by the scouting-intel branch itself, kept removed here) — showing
  an exact number next to a deliberately-uncertain scouted range would have
  undermined the feature.

## Validation checkpoint

- 53/53 engine smoke checks;
- 86/86 Node tests across all suites (10 new: `weeklydecisions.js`,
  `playeragency.js`, `scouting.js`);
- 134 desktop + iPhone-layout browser checks (99 + 14 + 21 across the three
  Chromium suites);
- direct Playwright pass of the merged UI at every real conflict site:
  player profile (scouting panel + polish section layout together), recruit
  profile (same), and a live-driven Dashboard state showing an actual
  Coach's Desk decision card rendering inside the polish pass's `.plan-card`.
  Zero console errors throughout.

## How the merge was done

Three commits, sequential (v0.9.14 → v0.9.15 → v0.9.16, each built on the
last), rebased as one chain onto v0.9.17. 10 of 13 conflicts across the
three commits were mechanical (version files, generated `index.html`,
`CONTINUATION.md` — always taken as "ours" and rewritten wholesale
regardless). 3 were real, all in `app.js`, all the same shape: the polish
pass's `profile-sections` layout on one side, scouting-intelligence's new
panels/behavior on the other, woven together by hand rather than picking
one side. See `WORKLOG.md`'s v0.9.18 entry for the specific reasoning,
including the Speed/Power/Technique/IQ removal call.

## Not addressed in this release

Hub tile order still follows CSS `order` per type rather than the engine's
`importance` values (recommended milestone A below). Roster/Season/Stats
tabs still have only the shared design system, no screen-specific hierarchy
work. The 390px header is still three rows. These are cosmetic gaps, not
simulation gaps.

## Storage guardrail

Read `STORAGE.md` before altering saves. v0.9.33 adds `t.allTimeRecord` and
`t.gameplan`, additive. v0.9.29-32 (GPT) added Game Center
watch-mode presentation only, no new persisted fields as far as reconciliation
could tell — verify against STORAGE.md if anything looks off.
v0.9.28 changed no stored state.
v0.9.27 added `t.coachTreeCredited`,
additive. v0.9.26 changed no stored state at all.
v0.9.25 added `p.academicStanding`,
`p.academicPlan` and `p.academicHold`, additive. v0.9.24 added `universe.signingDay`,
additive. v0.9.23 added `universe.bowls`,
`t.bowlResult` and `t.fanBaseline`, all additive. v0.9.22 added `universe.careerHistory`,
`universe.jobOffers` and `closed` on `universe.tenure`, all additive.
v0.9.21 added only additive fields
(`t.rivalry`, `t.adminConfidence`, `t.mandate`, `t.nilSpent`, `universe.tenure`,
`nilDeal` on players and recruits), all backfilled in `normalizeUniverse`;
IndexedDB stays at schema 3. v0.9.20 added no save-format change of
its own (`importance` is an additive field on hub tiles, which are rebuilt
every week). v0.9.18 was a merge of already-shipped
additive changes — no new save-format changes of its own. IndexedDB remains
schema 3. Scouting/decision/agency state uses additive fields on existing
player/recruit/universe records with no IndexedDB version bump.

## Next roadmap sequence

### A) ~~Hub priority + story surface~~ — done (v0.9.19 + v0.9.20)
Both halves shipped. Any new wire tile type needs an `importance` on the
0–100 scale to rank correctly among the others.

### B) Live-league save size — fully measured (v0.9.27 + v0.9.38), not yet built
See `docs/SAVE_SIZE_MEASUREMENT.md`. Growth is +11.5 MB/season (~188 MB by
season 15). v0.9.38 checked the one open caveat from the original
measurement — that resident IndexedDB might be smaller than the portable
export because of chunking/deferral — directly, against real `storage.js` +
`fake-indexeddb`. It is not smaller; chunking only affects load timing, not
bytes on disk. `gameArchive` is the largest, fastest-growing store (41-42%)
and the recommended first target if this is ever built: roll old seasons'
play-level detail down to box-score granularity after N seasons.


### C) ~~14-tab coherence~~ — done (v0.9.26)
The weekly plan (v0.9.13), the Coach's Desk decision cards (v0.9.14/15) and
the polish pass (v0.9.17) covered the worst of it. What remains is the tab
surface itself — grouping, or a first-run path.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `WORKLOG.md`. v0.9.37 is production and all
known feature branches are reconciled into the main line — check
`git branch -r` for anything new before assuming that's still true. Work in
a new bounded branch, validate fully (`npm test` + `npm run test:browser`),
update CHANGELOG/WORKLOG/STORAGE/CONTINUATION, publish a preview first, then
promote only after review.
