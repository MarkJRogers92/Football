# Dynasty Lab — v0.9.32 play-by-play Watch Mode preview

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `codex/v0932-play-by-play-watch` (based on validated
v0.9.31 source `codex/v0931-variable-drives` at `d0c2759`)
Production branch: `gh-pages`
Production: v0.9.31 at https://markjrogers92.github.io/Football/

## Current release

v0.9.32 makes Watch Mode a play-by-play broadcast. Each generated call appears
before its possession outcome is revealed; the running score changes only when
the drive completes, and the lower feed becomes a set of completed-drive recaps.
Play/pause, next play, speed, skip and replay all remain available.

New detailed games attach the play strings the engine already generated to each
immutable drive. They survive browser save/load and portable export/import and
reopen in Game Center. Older games have no invented history and use the existing
drive-only fallback. The measured cost was 5,148 bytes in the seeded game, about
62 KB for twelve watched regular-season games. IndexedDB remains schema 3 and
game archive version remains 1. Preview target:
https://markjrogers92.github.io/Football/preview/v0932/

Production deliberately remains v0.9.31 until this preview is reviewed.

Validation is complete: 53 smoke scenarios plus 136 Node tests; 125
desktop/iPhone end-to-end checks; 14 presentation checks; 21 recruiting-visual
checks; and six real-browser persistence scenarios all passed with no console
errors. No new long multi-season calibration was run.

## Previous release

v0.9.31 varies detailed games from 18–30 possessions based on tempo and game
flow. Its validated preview was promoted unchanged to production.

## Previous release

v0.9.30 adds Broadcast Watch Mode: play/pause, next drive, speed controls, skip
to final and rewatching detailed archived games without rerolling their result.

## Previous release

v0.9.29 is the production presentation-motion pass. Game Lab matchups receive a
brief broadcast entrance, Game Center scores count into the final, and detailed
games have a playable possession replay with a moving football, running score
and scoring flash. All animation respects `prefers-reduced-motion`.

## Previous release

v0.9.28 fixes a real bug found by a 7-season headless soak test (not by hand
play): an ignored job offer froze career progression forever while the rest of
the game kept running. `simWeek`, `simSeason` and `simulateUserDetailed` now
block on `hasPendingCareerChoice()`, the same pattern the Coach's Desk already
used for weekly decisions. The one non-obvious part: `simSeason`'s fast-forward
loop needed its own guard, or a blocked `simWeek` would leave it spinning
forever rather than hanging cleanly. See WORKLOG.

If you soak-test again: reserve it for a batch that changes
offseason/tenure/career state. The v0.9.29 motion pass does not justify one.

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
- 134/134 Node tests, including the immutable drive-replay markup check;
- 148/148 desktop + iPhone-layout browser checks (113 + 14 + 21 across the
  three Chromium suites), including all 24 recorded possessions, playback,
  Game Center fit and mobile page overflow;
- zero console errors throughout. No storage audit, multi-season calibration
  or real iPhone Safari run; v0.9.29 changes presentation only.

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

Read `STORAGE.md` before altering saves. v0.9.29 changes no stored state.
v0.9.28 changes no stored state.
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

### B) Live-league save size — measured in v0.9.27, not yet built
See `docs/SAVE_SIZE_MEASUREMENT.md`. The hypothesis recorded here previously
(events + seasonHistory, ~4 MB/season) was measured and disproved. Real growth
is 11.4 MB/season, 80% of it `gameArchive` + `playerArchive`. Measure IndexedDB
before optimising anything.


### C) ~~14-tab coherence~~ — done (v0.9.26)
The weekly plan (v0.9.13), the Coach's Desk decision cards (v0.9.14/15) and
the polish pass (v0.9.17) covered the worst of it. What remains is the tab
surface itself — grouping, or a first-run path.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `WORKLOG.md`. v0.9.29 is production from
`codex/v0929-game-center-motion`. For later work, check `git branch -r` for
anything newer, work in a bounded branch, run one proportionate final
validation pass, publish a preview first, and promote only after review.
