# WORKLOG

## Strategy integrity batch 6 — actual Watch defenders

Detailed plays now choose defenders from the same role, archetype and rating
weights used by defensive allocation. The recorded actor receives each pressure,
sack, tackle, tackle for loss, interception or pass breakup immediately, and the
Watch log names that player. Detailed box scores consume those exact defensive
lines instead of redistributing defense after the final whistle.

The existing drive play-by-play strings hold the extra names, so no archive or
save field was added. Focused game tests verify every named defender owns the
corresponding stat and all existing game/box persistence invariants still pass.

## Strategy integrity batch 5 — position traits reach the matchup

Team profiles now blend current overall/health/wear with role-specific traits:
QB technique and processing, skill speed/technique, line power/technique/IQ,
front power/technique/speed, and coverage technique/speed/IQ. Those profiles feed
the same matchup edges, recommendations, quick sim and detailed sim already used
by Game Lab, so changing the relevant player ratings changes team success rather
than merely reallocating a predetermined box score.

A controlled matchup test holds overall and the opponent fixed, then verifies
that line traits move pass protection without moving pass-game skill and coverage
traits reduce the opponent pass edge without changing protection.

## Player identity batch 4 — specialist outcomes

Quick and detailed field-goal results now use the active kicker's technique,
power and composure plus attempt distance. Detailed broadcasts name that kicker.
Punt distance now uses both the punter's power and technique, and Watch names the
active punter. K/P scouting prose explains those real effects and explicitly says
that hang time and direction are not tracked.

No return statistics or invented specialist events were added. Existing boxes
and saves retain the same fields. Focused game and identity checks cover rating
direction, distance, K/P play-log attribution and team/player reconciliation.

## Player identity batch 3 — ratings-backed archetypes

Every existing position archetype now declares three real rating emphases. New
roster players and recruits receive the best-supported archetype for their
generated rating shape, with small bounded variation so similar players are not
forced into one label. Recruiting and player scouting panels explain both the
archetype emphasis and the usage the engine actually models.

Existing saves are deliberately not relabeled or rerolled. Their identities and
history remain intact; the new assignment rule applies only when the game creates
a new player or recruit. Focused tests cover all archetype definitions, controlled
rating shapes and the visible usage explanation.

## Strategy integrity batch 4 — actual Watch participants

Detailed games now choose each runner and target from the same role/archetype
usage shares used by quick simulation. QB keepers therefore occur according to
QB style, mobility and scheme. Passing outcomes also read the selected target's
technique. The play updates that passer, runner or receiver directly, and the
box consumes those exact lines instead of redistributing offense afterward.
Touchdown type and player credit come from the scoring play.

No structured play payload was added to permanent saves; existing drive text is
retained, so this batch adds no new archive field. Eleven focused game, Game Lab
and identity tests pass. They verify dynamic drive bounds, team/player totals,
targets/completions, and that every named runner or target has the corresponding
credited opportunity.

## Strategy integrity batch 3 — shared matchup decisions

Added a shared matchup evaluator over the current game profiles: passing versus
coverage, run game versus front, and pass protection versus rush for both teams.
The Game Lab now shows those numeric edges after health, wear, scheme, staff and
the active gameplan are applied. It also exposes expected opponent pass mix,
home-field context and unavailable-player counts.

The staff recommendation now combines scheme tendency with personnel edges; for
example, it recommends pressure against a pass-heavy offense only when protection
is vulnerable. Corrected the existing outcome test's reversed inequality. Nine
focused gameplan checks pass, including displayed gameplan tradeoffs.

## Strategy integrity batch 1 — persistent recruit truth

Recruit position-domain scouting previously evaluated deterministic variations
around overall rating. Signing then generated unrelated player attributes while
retaining those evaluations. New recruits now receive the same seven hidden
traits as roster players; scouting reads those traits and enrollment preserves
them exactly. Current-cycle recruits loaded from older saves keep the compatible
fallback and display a legacy-evaluation note rather than pretending continuity.

A seeded fresh save with 2,800 recruits grew from 16,606,083 to 16,865,918 bytes,
an increase of 259,835 bytes (1.56%). Focused scouting checks cover real-domain
truth, portable persistence, signing continuity and legacy compatibility.

## Strategy integrity batch 2 — real scheme-fit recruiting priority

The Scheme Fit preference previously awarded a fixed bonus based only on whether
the school ran Multiple. It now evaluates the recruit's persistent position
traits against the offered offensive or defensive scheme and can reward a strong
fit or penalize a poor one. The profile's pitch breakdown uses the same helper as
the recruiting engine, so the displayed reason and actual decision cannot drift.

## Player identity batch 1 — QB quick-sim rushing allocation

The old allocation inspected whether the scheme's list contained the words
Run-First, so every quarterback in that scheme received the same rushing share.
The replacement combines the active quarterback's style, speed and versatility
with a bounded scheme adjustment. Team rushing volume is unchanged; the fix only
assigns that existing production more honestly. Watch Mode still needs structured
play attribution before its narration can credit actual QB runs and scrambles.

Focused validation: 6 player-identity and games tests passed. No long simulation
or full suite was run for this source checkpoint.

## Player identity batch 2 — all-position quick-sim allocation

Added a shared archetype opportunity layer. Back styles now distinguish carries
from receiving work, receiver and tight-end styles affect target share, front
and coverage identities direct the defensive production they describe, and line
styles affect the distribution of sacks and pressures allowed. Existing rating
formulas still control role fit and production efficiency. K1 and P1 already own
all team attempts by role; Watch attribution and specialist outcomes remain
explicit roadmap work.

## v0.9.39 — Game-completion consistency

First built and ran the focused games suite for the existing quick-sim
home-field patch (fafbb1b), committed its generated HTML at 9f33ae3, pushed
source and published production with explicit user approval. Verified the live
HTML against that source build. The subsequent work is preview-only v0.9.39.

The detailed-game path wrote the schedule directly, bypassing the rivalry hook.
simWeek then skipped the already-played row, so the rivalry never settled.
completeScheduledGame now owns the shared completion step. Already-played rows
are also offered to the idempotent rivalry settlement when advancing, covering
an unsettled current-week game in an older save. No historical backfill occurs.

The existing lastYear guard previously protected only series counters, allowing
repeat calls to change fans and emit events again. Moved that guard ahead of all
effects. Tests cover immediate detailed results, save/load then advance, repeat
settlement, and the old current-week case. Actual fast and detailed simulations
are tested with controlled draws for low/high crowd support and neutral sites.

Restored original title/save browser tests directly from the v0.9.36 source
branch, retaining current gameplay and version hotfixes. Focused gate: 13 games,
rivalries and Game Lab tests passed. Final gate recorded in CONTINUATION.md.
Only the standard final suite is run; no separate long calibration.

The full engine pass found a test-only name collision: two Tyler Whitakers in
the same game's injury list, one with a 1-week hamstring strain and one with a
3-week back strain. The recap correctly named the latter; the test found the
former by name alone. It now matches the quoted type and duration as well.
Only that failed check is rerun, followed by the remaining browser suites.
The visual-only fixture also encountered a legitimate opening-week decision
from random player generation. Browser setup now resolves blocking choices
through the real UI before clicking Sim Week, rather than waiting forever on
a correctly disabled button. Both affected browser suites are rerun.

## v0.9.37 — merging two parallel v0.9.36 releases

The collision this session had been risking finally happened: GPT and this
branch both cut v0.9.36 from v0.9.35, and my publish landed second and
overwrote theirs in production. The user caught it, not me — worth stating
plainly. `gh-pages` history made it fully recoverable (`5e293d2`), but the
right lesson is that publishing to a shared target without checking whether
the version number is already taken is the actual defect, not the merge.

Merge approach, once the two builds were identified: extract GPT's source out
of their published bundle with the usual anchor technique, restore it as the
working tree, verify `cmp` byte-identical against their build **before**
touching anything, then reapply this branch's much smaller diff on top. All
three of my edit sites survived verbatim in their `app.js`, so the rebase was
clean; had they not, the honest move would have been to merge by hand rather
than force either side.

The substantive call was whose gameplan design wins. GPT's is better and it
supersedes mine on both axes:

1. They replaced the intensity slider (scout/balance/standard) with
   directional prep — stop the run, protect the pass, pressure the QB — each
   giving one thing and costing another (front +6 / coverage −4). My v0.9.35
   fix made "always full scout" *expensive*; theirs makes it *not a question*,
   because there is no strictly-best option left to always pick. That is the
   better fix to the problem the user originally raised.
2. They deferred the wear charge from decision time to game time via
   `wearPending`/`wearApplied`. Mine charged on answering the card, which
   meant a gameplan for a game you never played still tired your starters.
   Theirs is simply correct.

So my wear values survive (3/1/0) but inside their better structure. Kept all
of it; changed none of it.

Three of my gameplan tests then failed — all three asserting my own superseded
contract, none a real regression: option count (3 → 5 directional), a second
decision for the same opponent now refused by an idempotency guard, and wear
no longer landing at decision time. Rewrote them against the new contract,
including explicit coverage that answering the card charges nothing and that
the same game can never be double-charged, since that deferred behavior is now
the real invariant worth protecting.

Validation: 148/148 Node, 144/144 browser on the merged tree.

## v0.9.36 — Game Lab freshness

A player-reported inconsistency, and a good example of a bug that no test would
have caught because nothing was technically wrong: every function did what it
said, and the tab still lied.

`universe.lastDetailedGame` has exactly one writer (`simulateUserDetailed`) and
`simWeek` has never touched it — correct in isolation, incoherent on screen,
because `renderGameLab` renders the current next-game card and that frozen
object in the same view with no temporal marker on either.

Two changes, and the second is the one worth being careful about:

1. Stamp the detail at capture time with `season` and `g.week`. The result
   object from `detailedGame` carries neither, and resolving them later from
   the archive is unreliable once the archive is deferred — so record them at
   the one moment both are known for certain.
2. Clear it when the *fast* engine plays the user's own game. The subtlety is
   that a game already played through the Game Lab is skipped by `simWeek`'s
   loop (`if(g.played)continue`), so its detail correctly survives the same
   week's remaining games being simulated. A naive "clear on any simWeek" would
   have thrown away the detail for the very game you just watched. There are
   tests for both directions, plus one that other programs' games never clear
   it, and one that a full `simSeason` fast-forward leaves nothing stale.

Deliberately not done: making the Game Lab display dashboard-simmed games. It
looks tempting for consistency, but the fast engine records `drives: []` and no
play-by-play, so the Drive/Play Log panel would render empty — trading a stale
panel for a hollow one. Verified that difference directly before ruling it out
rather than assuming the archive was uniform.

Validation: 4 new tests, 148/148 Node, 144/144 browser.

## v0.9.35 — reconcile v0.9.34, close the free-scout hole, fix what reconciling exposed

Second GPT reconciliation this session, same playbook as v0.9.29-32: extract
the changed source files out of the live bundle by finding byte-identical
unchanged neighbors as anchors, verify the rebuild matches production exactly
before doing anything else. This time `app.js`, `body.html`,
`sports-presentation.js` and `polish.css` changed (a title screen); every
other source file matched byte-for-byte.

One wrinkle repeated from the first reconciliation: `polish.css` is the last
CSS file concatenated before `</style>`, so a prefix-match check on it gives a
false "unchanged" when content was appended to its end. Caught it the same way
as before — a byte diff pointed at `</style></head><body>`, not inside any
individual file's expected content — and fixed the extraction to use that
boundary directly rather than trusting the prefix match. Worth writing down
plainly: **any file that is last in a concatenation order cannot be verified
by `indexOf`-prefix-matching alone; only files with a known file after them
can.** The next reconciliation should extract polish.css using the
`</style>` boundary from the start, not rediscover this.

Then the actual work: the player who asked for the wear-cost fix pointed out
what was really a design bug from v0.9.33, invisible until someone actually
played with a settled program (which is nearly always true — new scheme
installs are rare). Confirmed with `schemeFitFor` months ago during the
original build that familiarity only matters mid-transition, so the fix needed
an unconditional lever. Wear was the obvious, already-real one: it directly
feeds `conditionRating`, so a scouted-heavy program's key starters measurably
degrade, which is the property the new test asserts directly rather than
trusting the number alone.

Reconciling also surfaced two things that were not part of either task but
were blocking validation, so they got fixed as part of this release rather
than punted:

1. **A missing binary asset.** The title screen's background image lives on
   `gh-pages` but was never committed — GPT's publish flow apparently uploads
   `assets/` separately from the single-file build. Nobody would have noticed
   locally; the browser suite caught it as a 404 console error, which is
   exactly the class of bug that check exists to catch. Pulled the real file
   from `gh-pages` and committed it. This is the project's first dependency
   on an external file rather than one self-contained HTML page — flagged in
   the changelog as a trade-off worth a deliberate look, not something to
   quietly normalize.
2. **Every browser test's bootstrap.** All four files waited on `#userTeam`
   existing immediately after `page.goto`; it now only exists after a
   dynasty is started from the title screen. One shared `startNewDynasty`
   helper, copied into each file the same way `goTab` was for the tab-groups
   migration.

Real lesson from this session, worth keeping: a background test run started
with a bare `&` inside a single Bash call can silently die with zero output
when the tool call returns, twice now. The fix each time was to run it as a
plain foreground call (which the harness promotes to a tracked background job
on its own if it runs long) rather than backgrounding it by hand.

Validation: 1 new test, 144 Node tests total (all passing), 144/144 browser
checks — the browser suite specifically re-run and read in full this time,
not treated as passed because Node was.

## v0.9.33 — program history + weekly gameplan

Two remaining IDEAS.md items, built together since the history page reads data
the coaching tree already produces and the gameplan closes out the last real
mechanic on the list.

Program history's coaching-lineage half needed zero new state — `careerHistory`
already records every stint, dated, per school, from the coaching tree work.
The all-time-record half is genuinely new and additive-only; my first test
asserted it started empty and it did not, because world generation already
opens a day-one stint for every program's starting staff. Not a bug — the
test's assumption was wrong, and fixing it (asserting 5 stints, not 0) is a
more accurate test than the one I wrote first.

Gameplan's cost mechanism was the one real design decision. IDEAS.md specified
"trading practice time against scheme familiarity" — checked whether
`playerSchemeFit` reads position familiarity in steady state before assuming
that was a real lever, and it does not; familiarity only matters during an
active `schemeTransition`. So the honest cost is against schemeTransition's own
familiarity meter, which means a fully-installed program pays nothing for
scouting — a real, load-bearing distinction rather than a cosmetic one, and the
tests cover both states explicitly.

The edge itself is applied directly on the `H`/`A` profile objects gameSim
already computes, keyed by `teamGameplanFor(t, opponentName)` matching
year/week/opponent exactly — cannot apply to the wrong game or carry over,
tested directly rather than relying on gameSim's own randomness to prove it.

One real bug the browser suite caught before it shipped, not a flaky test: the
browser check `page.click('#simWeek')` timed out because the button stayed
disabled forever. Traced it to the gameplan card — `hasPendingWeeklyDecisions`
and `renderWeeklyDecisions`'s own `blocked` calculation both treat any
unresolved Coach's Desk decision as calendar-blocking, which is correct for
every existing decision type because all of them are situational (an injury,
a redshirt threshold, a transfer complaint). A scheduled game exists almost
every week, so the gameplan card is not situational — it would have forced a
choice every single week, turning a light weekly touch into a mandatory gate.
Fixed by excluding `WEEKLY_GAMEPLAN` specifically from both blocking checks;
the card still renders and still applies its real effect if chosen, it simply
cannot be the sole reason the calendar refuses to advance. Every other
decision type's blocking behavior is untouched — confirmed by re-running
`tests/weeklydecisions.js` and `tests/playeragency.js` unchanged.

Validation: 10 new tests (the pacing fix added one), full Node (143/143) and
browser (144/144) suites, both actually green — not just the Node half.

## v0.9.29-32 — reconciling GPT's untracked production releases

Checked `git fetch` vs the live site and found production four versions ahead of this branch's
source, with the extra work existing nowhere in git except baked into `gh-pages`'s built
`index.html` history (no branch, no PR — `list_pull_requests` came back empty). Confirmed via
the user this was a parallel GPT/codex session, the same shared-repo pattern as the three codex
branches reconciled earlier in this project's history — except this time nothing was pushed to
reconcile *from*.

The approach that made this tractable: `tools/build.js` concatenates named files with '\n' and no
markers, but each file's exact text is still a locatable substring of the bundle if it didn't
change. Checked every source file with `String.indexOf` against the live bundle; six were
byte-identical (found instantly), five had changed (`app.js`, `sports-presentation.js`,
`body.html`, `sports-presentation.css`, `polish.css`). For the changed ones, sliced the bundle
between the offsets of its known-unchanged neighbors. Two gotchas: `sports-presentation.js`'s
extraction was right the first time, but the *first* CSS check falsely reported `polish.css`
unchanged because `indexOf` only proves the known text is a substring somewhere — `polish.css` is
the last file before `</style>`, and the new keyframes were appended to its end, so the old
content was a true prefix of the new. Fixed by re-slicing to the `</style>` tag as the hard
boundary instead of trusting the substring match. Verified by rebuilding from the swapped-in
files and diffing against the live bundle with `cmp` — got byte-identical only after both CSS
fixes landed, which is the actual proof this is correct, not a good guess.

One test broke against the reconciled `app.js`: `tests/games.js` hardcoded a drive count (24) for
seed 922. The user confirmed drive count is now intentionally variable per game rather than
fixed, so this was never a real invariant — updated to the current value (23) and left the
invariant that does matter (drive points reconcile to the final score) in place, independently
re-verified before touching anything.

Validation: full Node suite (133/133) and browser suite (144/144) both green on the reconciled
tree before committing.

## v0.9.28 — blocking the calendar on an unresolved job offer

Plan: fix the freeze found during a 7-season headless soak test of v0.9.21-27.
A closed tenure's job offers, if never resolved, left careerHistory,
adminConfidence and the tenure record frozen forever while the rest of the
game — that team's games, recruiting, rosters — kept running normally. Not a
crash, just silently stuck, and the wire's CAREER tile kept saying so every
week without anything actually being blocked.

Chose to block the calendar over auto-accepting an offer after N weeks,
because it is the smaller, lower-risk change: `simWeek` already has this exact
pattern for the Coach's Desk (`hasPendingWeeklyDecisions`), so
`hasPendingCareerChoice` is the same shape, not a new one. Auto-accept would
have needed a week-counter, a rule for which offer gets picked, and an answer
to what happens on the weeks in between anyway — this fix is one boolean and
three call sites.

The one place a naive version of this would have broken something new:
`simSeason`'s `while(universe.phase==='regular'){delegateWeeklyDecisions(...);
simWeek(true)}`. If only `simWeek` were guarded, a blocked `simWeek` returns
without changing `universe.week` or `universe.phase`, so the while condition
stays true forever — an actual hang, not a gameplay bug. `simSeason` needed its
own guard before the loop starts. The test for this asserts `simSeason`
returns in under two seconds, since "does not hang" is the property that
actually matters and a normal assertion wouldn't have caught a spin loop
directly.

Also guarded `simulateUserDetailed`, the single-game path, the same way.
`simConferenceChampionships`/`simPlayoff` need no guard: they only run once a
regular season has already completed, and a pending career choice can only
exist starting at week 0 of the *next* season (offers are created inside
`runOffseason`, which itself resets the season to `regular`/week 0 right
before returning) — so the block at `simWeek`'s first week already prevents
the postseason functions from ever being reached with an unresolved choice.

Validation: 4 new tests, full Node and browser suites.

## v0.9.27 — coaching tree, cache fix, roadmap B measurement

**The tree** was cheap because `c.careerHistory` already held dated stints per
school and `universe.coachArchive` kept departed coaches. The only real design
question was what counts as a branch. "Anyone who worked here and is now
elsewhere" wrongly claims credit for a veteran head coach who took a
coordinator job with you late in his career; the rule is that the later job has
to start at or after the stint here ended. A test constructs precisely that
inverted career and asserts he is excluded.

Prestige credit is per-coach, tracked in `t.coachTreeCredited`, because the tree
is derived fresh every time it is read — without the ledger the same branch
would pay out every offseason forever. Capped at two a season and at
`program_ceiling`, both tested.

**The cache fix** came out of a real report: the published site showed the
previous version after a promote. Diagnosis: the deploy and the file were both
correct, and GitHub Pages sends `Cache-Control: max-age=600` on HTML, so a
browser can hold the old single-file app for ten minutes. One meta tag in
`tools/build.js`. Worth noting the proxy in this environment returns 403 for
github.io, so the live URL could not be fetched to confirm — the diagnosis
rested on the branch content being provably correct and there being no service
worker in the build.

**Roadmap B is the interesting one.** The instruction in CONTINUATION.md was
"measure before touching anything", and measuring immediately invalidated the
roadmap's own hypothesis. It named `universe.events` and `seasonHistory` as the
growth drivers at ~4 MB/season. They are 2.0% and +0.33 MB/season respectively;
real growth is 11.4 MB/season and 80% of it is `gameArchive` plus
`playerArchive`. Had anyone implemented the roadmap as written — an events
rollup — they would have spent the work for under 3% and broken the wire, the
story surface and everything built on the ledger since v0.9.19.

Deliberately stopped at measurement. The numbers are of `packUniverse`, and
`STORAGE.md` records that the browser already chunks and defers
`playerArchive`, so the resident cost differs from the export cost. Optimising
now would be optimising a shape that is not what gets stored. The write-up says
the next step is instrumenting `saveBrowser` and reading back real record sizes.

Validation: 5 new tests, full Node and browser suites.

## v0.9.26 — tab groups (roadmap milestone C)

Plan: the last open roadmap milestone. Fourteen flat tabs, and the strip had
1387px of buttons in a 390px viewport.

**The constraint that shaped the implementation.** Four browser test files
navigate with `page.click('.tabs button[data-tab="X"]')`, and Playwright's
`click` requires the element to be visible. Any grouping that hides tabs breaks
all of them. Three options: keep all fourteen visible and merely decorate them
(no real win), hide them and update the tests, or something clever. It is the
second — the information architecture genuinely changed, so how a test reaches a
tab genuinely changed, and pretending otherwise would have meant not doing the
milestone. The tests now share a `goTab()` helper that selects the group first.

**What deliberately did not change.** The tab buttons: same markup, same
`data-tab` values, same `.tabs` container. `go()` in sports-presentation.js,
every hub tile's `data-tab`, and every weekly-plan step still resolve without
knowing groups exist. Grouping is a visibility layer on top, not a rewrite of
navigation.

**The subtle part.** `el.click()` works on a hidden element, so a hub tile
jumping to a tab in another group succeeded — but left that tab open with the
wrong group highlighted and its siblings hidden, which is worse than not
grouping at all. Fixed by syncing the group inside `setActiveTab()`, which every
activation path already funnels through, rather than at each call site. The
browser check clicks a tab element directly, bypassing the group bar entirely,
and asserts the group follows.

Verified before running the suite: five groups, group switching opens the first
tab, a direct jump switches groups, and tab-strip overflow is 0 at both 1280px
and 390px. That last number was 997px of hidden content on mobile.

Validation: 10 new browser checks, full Node and browser suites.

## v0.9.25 — academic eligibility

Plan: the last of the "data the game stores but barely reads" items.
`t.academics` fed one recruiting pitch term and nothing else.

**Where it hooks.** `gameAvailable(p)` is the single availability gate —
`participants`, the depth chart and the sim all run through it — so
ineligibility is one clause there rather than a new concept threaded through
every selection path. The test asserts through `participants()` rather than
through `gameAvailable` alone, because the gate being right matters less than
no selection path being able to route around it.

**The tuning bug, which is the real story of this release.** The first
formula was `academics*.55 + (iq-50)*.45 + 34 - wear*.06`. Two tests failed and
both looked like my test setup being unrealistic. Working out why showed the
opposite: under the weekly -1 drag, standing equilibrates about 8 below target,
and that formula bottomed out near 38 for the worst possible player at the worst
possible program. The floor is 30. So no player could ever have gone
ineligible, in any universe, ever — the feature would have shipped completely
inert and every test I had written would still have passed except the two that
happened to poke at the extreme.

Retuned to `(academics-50)*.5 + (iq-50)*.6 + 55 - wear*.08`, which puts a weak
student carrying a heavy season at a thin-support program in the twenties and a
good student at a strong program around 91. The test now builds that at-risk
case explicitly and asserts it takes more than one week to fall through, since
"you see it coming" is the property that makes this fair rather than random.

**The desk card.** Most Coach's Desk options have one that is plainly correct.
This one does not: study table is the biggest academic gain and the biggest
scheme-familiarity cost, practice is the reverse, and the split is neither. That
was the point of picking this feature.

Validation: 6 new tests, full Node and browser suites.

## v0.9.24 — live signing day

Plan: the highest-value remaining item from IDEAS.md, and the cheapest, because
`pressure` and `challenger` were already modelled all season and then thrown
away at the end of it.

**The one real design decision** was where the randomness lives. The obvious
implementation rolls each flip as the player reveals it, which is dramatic and
wrong: the outcome would then depend on whether somebody clicks "next" or
"announce the rest", and a save/reload mid-reveal would re-roll the board.
Everything is decided inside `buildSigningDay()` during `finalizeRecruiting`,
and revealing moves a counter and nothing else. The test asserts the serialised
board is unchanged across a full reveal, which is the property that actually
matters.

Placement also mattered: `buildSigningDay()` runs at the *top* of
`finalizeRecruiting`, before the bulk auto-commit fills every remaining
scholarship. Run it after and the challenger would routinely have no room left
to take the recruit, so nearly every contested commitment would hold for the
wrong reason.

**A pre-existing bug the tests found.** The first assertion I wrote was that a
recruit is never contested by his own school, which read as tautological — the
challenger search explicitly skips `t.name===r.committed`. It failed anyway.
The cause was staleness, not the search: when a recruit flips to his challenger
through the normal in-season path, `r.challenger` still names that school, and
nothing ever cleared it. So the recruiting board could show a recruit WAVERING
against the program he had just committed to, and the weekly plan could tell you
to go hold a recruit nobody was chasing. Fixed in `commitRecruit` by clearing
`challenger` and `pressure` on commitment — a fresh commitment is not under
challenge, and `advanceRecruiting` recomputes both every cycle. `buildSigningDay`
also guards against it independently, since a board built on stale state would
be nonsense regardless of where the staleness came from.

That is the second time in three releases that writing an assertion I expected
to be trivially true found a real bug. Worth continuing to write them.

Validation: 5 new tests, full Node and browser suites.

## v0.9.23 — bowl season and dynamic fan support

Plan: the two highest-ranked remaining items from IDEAS.md, built together
because they feed each other — a bowl win is one of the things that should move
a fanbase.

**The blast-radius decision.** Bowls want their own phase: it is a distinct
thing the player does, and burying it inside the conference round would hide
it. But thirteen test files call `simConferenceChampionships()` and then
`simPlayoff()` back to back, and inserting a mandatory phase between them would
have broken all thirteen — `simPlayoff` would no-op, the phase would never
reach 'complete', and `runOffseason` would return early. Rather than edit
thirteen files, `simPlayoff` now plays the bowls itself if it is called while
still in `bowlReady`. Old callers keep working, the new step is still real and
visible in the weekly plan, and bowls become impossible to skip. There is a
test for exactly that path.

**Fan support, centred rather than shifted.** The home-field formula is
`2.2 + (fan_support-60)*0.03`. 2.2 was the old flat constant and 60 is the
middle of the fan_support range, so a median program gets exactly what it got
before and the change is a spread around current behaviour, not a rebalance of
it. That matters because `gameSim` is the single most load-bearing function in
the engine and this touches every game played. The test pins the median case to
2.2 so a future edit cannot quietly shift the whole league.

The decay term matters as much as the movement one. Without decaying toward a
per-program `fanBaseline`, a decade of good results would ratchet every
controlled program to 100 and the number would stop meaning anything. A team
that merely meets expectations settles back to its baseline within a few
seasons; the test runs twelve to prove it.

Two test failures, both real gaps in the engine rather than the test:
`seedField` was not exported from the harness, so the test could not check that
bowl teams are outside the playoff field; and `universe.bowls` was backfilled
in `normalizeUniverse` but never initialised in `initUniverse`, so a fresh
universe had it undefined. Both fixed in the engine, which is where they
belonged.

Two existing tests then failed, and both were the tests owing an update rather
than the code owing a fix:

- `tests/weeklyplan.js` asserted the plan names 'playoff' straight after the
  conference round. It now correctly names 'bowls'. Updated to walk the real
  sequence — conf, bowls, playoff — which is a stronger assertion than before.
- `tests/games.js` pinned the season's archive at exactly 745 games (720
  regular + 10 conference + 15 playoff). Bowls are real games and belong in the
  permanent archive, so the count is higher. Rather than swap in a new magic
  number, the expectation is now derived — `745 + u.bowls.length` — with a
  comment naming where each component comes from, so it survives a change to
  the bowl field size.

Validation: 6 new tests, full Node and browser suites.

## v0.9.22 — career arc (closing the hole v0.9.21 opened)

Plan: v0.9.21's administration could end a tenure and then the run had nowhere
to go. That was a hole I introduced, so it was the right thing to close before
starting anything new from IDEAS.md.

The design question was what a program is willing to gamble on. A pure
win-percentage ceiling makes a 4-8 season at a blue-blood worth more than 9-3 at
a bad one, which is wrong; a pure prestige ceiling means results never matter.
The blend settled on is best-prestige-held at 72% plus win percentage worth up
to 46 points plus longevity worth up to 10 — so a strong record moves you up a
tier or two but does not vault a losing coach into a better job than the one he
just lost. Tested by holding the school constant and swapping only the record.

Two state guards took more thought than the feature:

1. A closed tenure must stop accruing. `reviewControlledProgram` runs every
   offseason; without a guard it would keep pushing reviews into a tenure the
   player had already been fired from, and `careerTotals` would double-count.
   It now returns null while offers are open.
2. The controlled program can be switched by hand from the picker at any time —
   this is a sandbox as much as a career. If that happens the tenure's school no
   longer matches the selected team, so the old tenure is closed as "stepped
   away" and a new one opened. Without it the career record would silently
   attribute one school's seasons to another.

One test failure, and it was the test: I asserted the wire tile appears three
weeks into season one, but `universe.tenure` does not exist until the first
offseason review creates it, so `closeTenure` correctly no-opped. Rewritten to
finish a season first, and it now also asserts the no-tenure no-op explicitly,
since that guard is worth pinning down.

Also worth recording: every string patch in this release used a replacer
function rather than a replacement string, after v0.9.21 shipped a bug where
`$$` in a replacement collapsed to `$` and broke two selectors.

Validation: 5 new tests, full Node and browser suites.

## v0.9.21 — three stakes features

Plan: the user picked the top three from the brainstorm — hot seat, rivalries,
NIL as a budget. Wrote `IDEAS.md` first so the other nine ideas survive the
session, then built in dependency order (rivalries feed administration
confidence).

**Rivalries — the assumption that was wrong.** The spec said an in-conference
rival is guaranteed to be played because weeks 4-11 are a conference
round-robin. It is not: `buildSchedule` runs `for(let r=0;r<8;r++)` over a
twelve-team conference, so each team plays eight of eleven conference
opponents, the same eight every season. The first implementation derived rivals
by pure geography and the test caught it immediately — Chicago Metropolitan's
nearest conference school is twelve miles away and is not on its schedule.
Fixed by deriving from the schedule instead: only opponents actually played
qualify. The cost is honest and worth naming — Chicago's rival is Fort Wayne
State at 140 miles, not the school across town, because the school across town
is never played. Guaranteeing the annual meeting was judged worth more than
geographic purity, since a rivalry you skip two years in three does not work.

Second correction in the same feature: per-team greedy pairing left six teams
unpaired, in three conferences, two apiece — the last two in a conference
having no unpaired opponent they meet. Switched to sorting all eligible pairs
by distance and taking the closest first. Still six unpaired, and the test now
asserts *why*: for each unpaired team, no eligible partner remained. That is a
real property of the schedule, not a bug, and the test says so rather than
hiding it behind a loose threshold.

**The administration.** The framing had to be checked before writing anything.
I pitched this as "you get fired and take a lower job", but the player hires
their own HC — `carousel()` creates an opening on the controlled team rather
than replacing the coach — so the player is the program's steward, not the head
coach. Firing the player would have contradicted the model. It became
administration confidence in the program instead, which fits and uses the same
`admin_patience` field that already drives AI firings, on the same expectation
formula, so the player is held to exactly the AI's standard. Being rehired
elsewhere and carrying a career record across tenures is deliberately out of
scope and noted in IDEAS.md as the follow-up.

Two test failures here were the test being wrong, not the code: a season record
is longer than twelve games once the postseason is included, and my "hopeless"
setup (0-4 with eight to play) still left eight wins arithmetically reachable.
Both fixed in the test with a comment saying why.

**NIL.** Cheapest of the three because both ends already existed: `transferRisk`
sums morale, promises, coach pressure and scheme fit, so retention relief is one
subtraction; `recruitPitch` already weighted `t.nil`, so a deal is one addition.
The only real design point is that recruit deals carry `schoolId` — recruits are
shared objects visible to all 120 programs, so without it every school would
benefit from a deal one school paid for. There is a test for exactly that.

Validation: 13 new tests, full Node and browser suites.

## v0.9.20 — story surface (roadmap milestone A, part 2)

Plan: the unbuilt slice from ROADMAP_V09.md — record-chase alerts and a player
career chronology, both from data already stored.

The thing worth knowing before writing the record chase: `updateSeasonRecords()`
is called from exactly one place, `finalizeSeasonHonors()`, at season end. That
single fact decides the whole design. Records are *not* live-updated weekly, so
through a season `t.records` and `universe.records.nationalSeason` hold prior
years' marks, and comparing a player's running stats against them is a real
chase rather than a comparison against the current leader (which would have
been himself, every week, forever). Had records been rewritten weekly this
feature would have needed its own snapshot state; it needs none.

Consequences handled explicitly: season one has no records at all, so the
guard is `!rec?.value` and the wire simply stays quiet. After honors finalize,
the new holder would otherwise be told he is 100% of the way to his own record,
so a holder check (`rec.playerId===p.id&&rec.year===universe.year`) skips him.
One tile per player, best-importance wins, two tiles total — a good quarterback
qualifies on passing yards and passing touchdowns simultaneously and would
otherwise eat a quarter of the nine-tile wire.

Importances sit on the same 0-100 scale v0.9.19 established: broken national 88
(above everything except a championship), broken school 72, watch 60/50 — above
a routine win, below a loss or a medical. Tested by asserting a broken-record
tile lands in the top four of the ranked wire, which is the property that
actually matters, not the number itself.

The chronology is the cheaper half: six already-stored sources merged, sorted
newest-year-first with a within-year rank so a season precedes the honor it
earned and signing sits at the bottom. It replaces the Season Timeline section
rather than adding a seventh place to look, which is the point of a story
surface. The Honors list in the Career section stays as a summary.

Validation: two new tests, full Node and browser suites re-run.

## v0.9.19 — hub priority sort (roadmap milestone A, part 1)

Plan: the one-function fix flagged in CONTINUATION.md — `buildWeeklyHub`
takes `items.slice(0,9)` in insertion order despite events carrying an
`importance` value. Sort by it, nothing more.

What the code actually said: the premise was only half true. Events in
`universe.events` all carry `importance`, but the *hub tiles* built from
them are a different shape, and only two of the tile sources (coach fallout,
familiar faces) copied the value across. The ten inline tiles that make up
most of a normal week had none. A bare `sort((a,b)=>b.importance-a.importance)`
would have compared `undefined` and produced a NaN-shuffled order that
happened to look fine in the common case — the exact bug class the polish
pass hit with the signing-class signature.

So the change is still one function's worth of logic but touches each push:
every inline tile gets an explicit importance on the event scale (loss 60 /
win 50, medical 55, wavering 52, next-up 48, rankings 45, commitment
40+3×stars, decommit 50+3×stars, flip 45+3×stars, top target 35, transfer
risk uses its own ≥42 score capped at 80). The three event-derived helpers
pass `e.importance` through (coaching search gets 62). The comparator
defaults to 40 so nothing can ever produce NaN again. Stable sort, so ties
keep insertion order and the week's narrative sequence survives within a
tier.

Deliberately untouched: the CSS `order` per tile type in `polish.css`
still groups alerts first — engine ranking now decides which nine survive
and the order within a group, which is what the milestone asked for.
`renderWeeklyHub`'s prepend-familiar-faces-then-reslice is also outside
the brief; those tiles are 55–70 importance so they would rank near the top
anyway.

Validation: the new test walks a full 12-week season asserting every tile
is numerically ranked and the wire is sorted, then plants a trivial
importance-5 promise event (inserted first by construction) and checks it
sinks. Full Node + browser suites re-run; preview published, production
untouched pending review.

## v0.9.18 — reconciling three feature branches with the polish pass

Plan: the previous session flagged three GPT/codex branches (v0.9.14 Coach's
Desk, v0.9.15 Player Agency, v0.9.16 Scouting Intelligence) as diverged and
unreconciled — built on the same v0.9.13 checkpoint as the commercial polish
pass, but not including it. All three were sequential (each built on the
last), so this was one rebase of the v0.9.16 tip onto v0.9.17, not three
separate merges.

What actually happened:
- 10 of 13 conflicts across the three commits were mechanical: VERSION.txt,
  package.json and the `APP_VERSION` line, plus `index.html` (generated,
  always dropped and rebuilt) and `CONTINUATION.md` (rewritten wholesale
  regardless). Renumbered straight to 0.9.18 rather than reusing any of
  14/15/16, since none had reached production and the polish pass already
  claimed 17.
- 3 real conflicts, all in `app.js`, all in the same shape: the polish pass
  had restructured the recruit profile and player profile into a
  `profile-sections` layout with real section classes; scouting-intelligence
  had independently added its own panels (`scoutingPanelHTML`,
  `scoutingHistoryHTML`) and a behavioral hook
  (`firstRecruitEvaluation` on first target) into the *old*, pre-polish
  markup. Resolved by keeping the polish pass's structure and weaving the
  scouting calls in at the same relative position the original branch put
  them, rather than picking one side wholesale.
- One judgment call inside that merge: the player profile used to show raw
  Speed/Power/Technique/IQ grades (present since v0.8). The scouting-intel
  branch's own diff removed them, replacing them with fuzzy ranges + a
  confidence label. That removal was deliberate on their part, not
  incidental — showing an exact number next to a feature whose entire point
  is that the number is *uncertain* would have contradicted it. Went with
  their removal rather than restoring the old rows.

Validation: did not trust the branches' own claims. Full suite from scratch
after the rebase (53 smoke + 86 Node, 10 new tests from the three branches;
134 browser checks across all three suites), plus a direct Playwright pass
of the merged UI specifically at the conflict sites: opened a player profile
(scouting panel + section layout together), a recruit profile (same), and
drove a live game state until a Coach's Desk decision card actually
appeared on the Dashboard to confirm it renders inside the polish pass's
`.plan-card` correctly. Zero console errors at any step.

## v0.9.17 — commercial polish pass

Plan: bring the previous session's (Fable) commercial polish work — dashboard
masthead, design-system tokens, profile/recruiting/Game Center presentation —
to production. The work itself was presentation-only, layered the same way
the earlier visual-identity/sports-presentation passes were: read the
already-rendered DOM, never touch engine state, load last in the build.

What I did:
- Bumped the version. The branch was left unbumped at 0.9.13 while three
  other preview branches (codex v0.9.14-16, gameplay features, not yet
  merged) had already claimed 14-16 in their own previews. Took 0.9.17 to
  avoid any collision, even though none of those three are in production.
- Ran the full suite fresh rather than trusting the handoff note's claim:
  53 smoke + 76 Node + 133 browser checks, all green.
- Found a real bug on visual inspection, not from a test: the new Signing
  Class card read "of 30 slots" while the summary line one row below it
  correctly said "12 spots left" — a flat 30 hardcoded back in v0.9.7,
  before v0.9.11 made scholarship capacity dynamic. `recruit-presentation.js`
  is a DOM-scraper by design (per its own header comment, it never touches
  app.js state), so the fix reads the real number from `#classSummary`'s
  already-rendered text the same way the file reads everything else.
- That fix didn't render on the first try. The component memoizes its
  markup behind a signature string to avoid re-rendering on every mutation;
  the signature didn't include capacity, so the very first render (before
  `#classSummary` had real data, capacity falling back to 30) got cached,
  and a later render with the correct capacity never re-fired because
  nothing else in the signature had changed. Added capacity to the
  signature. Confirmed by instrumenting the actual call sequence rather
  than guessing — the first call really did fire with an empty
  `summary.textContent`.

Validation: full suite re-run after the fix (53 smoke + 76 Node + 133
browser, unchanged pass count), plus a direct Playwright pass reading real
rendered pixels at 1280px and 390px (dashboard, staff, recruiting, Game
Center) rather than trusting the audit doc's screenshot claims.

Known gaps carried forward from the polish pass itself (not addressed here):
hub tile order still follows CSS `order` per type rather than the engine's
`importance` values; Roster/Season/Stats/Development got only the shared
design system, no screen-specific hierarchy pass; the 390px header is still
three rows.

## v0.9.13 — the weekly plan

Plan: close the coherence gap. Fourteen tabs, and nothing told a player which
of them advances the dynasty. The phase sequence in particular
(regular -> confReady -> playoffReady -> complete -> spring -> fall ->
offseason) was invisible until you got stuck wondering why Finalize Offseason
was disabled.

Decisions:
- Exactly one calendar gate is ever shown, because there is only ever one.
- The offseason is rendered as all three steps with done marks rather than
  one step at a time, since the sequence itself is the thing nobody could
  see.
- Everything is derived from live state, so a suggestion never appears
  without a real reason behind it and disappears once handled.
- Capped at six. A list long enough to feel like homework is not guidance.

Validation: `npm test` (53 smoke + 76 Node, including the new
`tests/weeklyplan.js`) and `npm run test:browser` (133 checks).

## v0.9.12 — chunked, deferred game archive

Plan: stop the core save row growing without bound. Measurement first: at
four seasons a dynasty was 63 MB, of which the game archive was 24 MB (38%)
and rising ~6 MB per season — and because it sat in the core blob, every
single save rewrote all of it.

Decisions:
- Mirror the career-archive design rather than invent a second scheme. Same
  chunk size, same ref shape, same optimistic revision check, same
  fail-closed reads. The pattern was already proven and already tested.
- Deferred hydration on demand, guarded at each entry point that reads
  across history (Game Center, school history, the newsletter) using the
  existing `storageOperation` re-entry pattern.
- `exportSave` hydrates both archives before packing. Portable JSON has to
  stay a complete dynasty or the format silently becomes lossy.
- Caught by the existing persistence test: the `loaded` flag was derived
  from `storageVersion !== 2`, meaning "legacy inline save". Introducing
  storage 3 made that predicate report chunked career archives as already
  loaded when they were in fact empty — an export would have produced a
  dynasty with no archived careers at all. Deferral is now derived per
  archive from the version that introduced its chunking.
- Two existing tests encoded the old contract and were corrected rather than
  widened: the legacy-upgrade test now asserts games split out on the same
  upgrade, and the Game Center identity test hydrates before reading, which
  is exactly what the feature requires of any consumer.

Also, on request: the recruiting board's headers now sort it. The whole pool
is ordered before the visible slice is taken, and columns whose interesting
end is the top open descending so the first click shows the best and the
arrow still tells the truth.

Validation: `npm test` (72 Node tests including the new `tests/gamestore.js`,
plus 53 smoke checks) and `npm run test:browser` (99 + 13 + 21 checks).
Measured after: a save at season three writes 29 MB instead of 53 MB, and the
18 MB of box scores is never rewritten again.

## v0.9.11 — scholarship scarcity and pulled offers

Plan: give recruiting a real constraint. `canTakeCommit` was
`classCommitCount < 30`, a flat number unrelated to the roster, so chasing a
recruit cost nothing and volume never mattered.

Decisions:
- Tuning this had to be measured, not guessed. The first model (85 minus
  projected returning) produced capacities of 4-9 because generated rosters
  start at 93 with only 7-9 seniors, and it then swung between 4 and 30 as
  the senior class oscillated. Instrumenting four seasons showed the real
  shape of roster churn; the band was set from that, not from intuition.
- Capacity is clamped to a signing-class band rather than tracking churn
  exactly. Programs sign toward a steady roster, initial counters are capped
  anyway, and the floor stops a thin-attrition year from making recruiting
  pointless.
- Over-signing is a program trait, not a universal habit. A flat allowance
  made all 120 teams over-sign by exactly two and pull exactly two every
  year — 240 identical events, pure noise. Tying appetite to admin patience
  and prestige gives roughly a third of the league a pulled offer in a
  season, which reads as news.
- A pulled offer had to cost something or it would be a free release valve:
  the recruit is permanently blocked from that program (enforced in both
  `commitRecruit` and `recruitPitch`) and the pipeline he came from drops.
- Discovered along the way: the offseason auto-fill to 85 had been quietly
  stocking rosters all along, which is why recruiting volume never mattered
  before. It is now a safety net rather than the main supply.

Two existing tests encoded the old flat cap and were corrected rather than
widened: the smoke audit now asserts the signing-class band plus a new check
that no program finished over its own limit, and the promises fixture clears
its class counter because it exercises promises, not recruiting.

Validation: `npm test` (63/63, including the new `tests/scholarships.js`) and
`npm run test:browser` (125/125 across all three suites).

## v0.9.10 — scheme installation and position-change agency

Plan: close the last simulation gap on the roadmap. The v0.9.6 coaching
market made hiring a coordinator easy and frequent, but a new coordinator's
scheme installed instantly and for free, so the hire carried no systemic
consequence.

Decisions:
- Schemes were never changed after world creation, so a transition system
  alone would never have fired. Coordinators therefore carry a
  `preferredScheme` and install it on arrival. That is what makes the
  coaching market a real decision, and it is the connective tissue the
  milestone was worth building for.
- The cost is fit, not ratings. `playerSchemeFit` carries the whole effect,
  which means it propagates correctly to role fit, camp reports, recruiting
  pitch and the scheme-fit leaderboard from one place, and no player's
  stored attributes are ever touched.
- First attempt got the curve backwards. Blending old-scheme fit into
  new-scheme fit by familiarity made the change painless in year one and
  progressively worse as it installed — the opposite of installing a system.
  Replaced with an installation drag that is largest at low familiarity and
  scales with how much a given player has to unlearn, so a scheme change
  hurts most immediately, eases as it goes in, and leaves old-system
  veterans permanently below where they were without ever touching a rating.
- Migration is conservative by design: inherited coordinators are recorded
  as running their program's current scheme, so no existing dynasty wakes up
  mid-installation.
- Position changes became a conversation rather than an order. A live
  Position Lock promise is close to a veto, which finally gives that promise
  type teeth outside the audit.

Validation: `npm test` (55/55, including the new `tests/schemes.js`),
`npm run test:browser` (123/123 across all three suites) and a six-season
longrun showing prestige spread and mean ratings unmoved, confirming
league-wide coordinator churn does not destabilise the simulation.

## v0.9.9 — game recaps and the weekly newsletter

Plan: turn the v0.9.2 permanent box scores into readable prose, then aggregate
a week of them into a newsletter scoped to the program, the conference or the
nation.

Decisions:
- Template generation, not a language model. The game is a single offline
  page with no server, and a recap attached to a permanent archived game has
  to read identically every time it is opened years later.
- Derived on demand, never stored. Recaps cost nothing in the save file and
  appear retroactively for every game in an existing dynasty. The trade is
  recomputation per render, which is trivial next to the box score already
  being rendered beside it.
- Recap wording comes from a stream seeded by the game ID, never
  `Math.random`. If it drew from the shared stream, merely opening a recap
  would shift every future simulated result. A test asserts zero draws.
- The prose may only claim what the record supports. The engine stores no
  clock or quarters, so recaps never say "late in the fourth" or invent
  attendance; a test bans that vocabulary outright.
- Notability bars are deliberately high. A first pass mentioned an
  interception and an injury in nearly every game, because one of each
  happens in nearly every game, and the recaps all read the same. Sacks now
  need 2+, interceptions 2+ (or 1 with real tackle volume), and injuries 3+
  weeks before they count as news.

Validation: `npm test` (47/47, including the new `tests/recaps.js`) and
`npm run test:browser` (89/89, covering the Newsletter tab, both coverage
scopes and the recap in the Game Center summary).

## v0.9.6 — coaching market

Plan: turn the v0.9.5 carousel's instant AI-only auto-fill into a real, bounded
hiring market for the controlled team, per `ROADMAP_V09.md`'s v0.9.6 slice —
openings, a candidate pool, interview-then-offer, salary/years/authority,
internal promotion, and AI hiring by fit (already true of the existing
carousel scoring; not duplicated).

Decisions:
- AI teams keep their existing instant-fill behavior unchanged — only the
  controlled team's vacancies route through `createOpening()`. This kept the
  blast radius small: `carousel()`/`replaceStaffCoach()`/`moveCoach()` for
  every AI team are untouched, so the v0.9.4/v0.9.5 test suites needed no
  changes.
- A vacancy on the controlled team is never silently unfilled: an interim
  coach (reduced ratings, half salary) holds the slot, so ignoring a search
  has a real cost and the rest of the engine (which assumes `t.staff[slot]`
  is always a real coach) never sees a hole.
- Hiring routes through the same `openCoachStint`/`closeCoachStint`/
  `archiveCoach` primitives every other coach transition uses — no parallel
  identity system, no risk of a coach existing in two places at once.
- Found and fixed during testing: promoting an internal candidate initially
  ran the same "close old stint, auto-regenerate the vacated slot" path used
  for cross-team hires, but since the origin and destination team are the
  *same* team object, that aliased `t.staff[OC]` and `t.staff[HC]` to the
  same coach and the follow-on `createOpening()` call closed the coach's
  brand-new HC stint by mistake. Fixed by only doing the auto-regenerate
  step for genuine cross-team moves; an internal promotion just closes the
  old stint and lets the deliberate follow-on `createOpening()` call install
  the real replacement.
- Interview-then-offer is a hard gate (no offer without an interview) and a
  per-team budget (same salary formula the engine already uses, summed
  across all five roles plus a cushion) hard-caps what can be offered —
  both enforced in the engine function, not just the UI, so there is no way
  to route around them from a modified request.

Validation: `npm test` (39/39, including the new `tests/coachmarket.js`),
`npm run test:browser` (79/79, including a real interview→offer→hire click
path added to `tests/browser.js`), and `npm run longrun` (12 seasons, stable).
An 8-season run with no user interaction confirmed openings persist correctly
(never duplicated, never auto-resolved) and the interim penalty compounds as
expected when a search is ignored.

## v0.9.4 — persistent coaching careers

Plan: turn the coach IDs introduced with promises into durable people before adding a hiring market. Preserve existing turnover behavior where possible, add retirement/internal-promotion paths only to exercise career continuity, and keep relationship portability for v0.9.5.

Decisions:
- Career history stores evidence we actually have. Legacy saves get a current/last stint but zero reconstructed wins or titles.
- Every completed season is recorded before the offseason carousel changes a staff.
- Cross-school `moveCoach()` is implemented as a stable-ID foundation and deterministic test seam; the general candidate/poaching market remains out of scope.
- Coach profiles expose specialties and plain-language career traits, not the raw hidden ambition/loyalty values.
- Departed and retired coaches live in `coachArchive`; active staff are not duplicated there after normalization.

Validation is performed by the v0.9.4 branch CI pass before preview publication.

Running log for the v0.8.1 follow-up work list. One entry per item: plan,
decisions a successor would otherwise re-derive, outcome, test result.
`npm test` is the gate; `npm run build` regenerates `index.html` before every
commit (index.html is generated — never hand-edit it).

## Item 1 — mobile cards for recruiting and development tables

Plan: add `stacked-table` to the `#recruiting` and `#development` sections in
body.html and `data-label` to every `<td>` in `renderRecruiting` and the
`trainingBody` rows in `renderDevelopment`. CSS in styles.css already handles
the rest below 700px.

Decisions:
- The Stats tab has no `<table>` — leaders are `.leader-row`/`.lineitem` divs
  that already stack. REVIEW.md §3.1 lists "stats" among the tables needing
  the treatment; that is wrong, nothing to do there.
- The first column of both tables is labelled `Player` in `data-label` (the
  recruiting header says "Recruit") so the existing
  `td[data-label="Player"]` full-width rule applies to the name cell.
- `.stacked-table td:empty::before` hides the label on the empty action cell;
  the recruiting Visit/Promise/Target controls are given labels so they read as
  fields on the card.

Outcome: done. `npm test` 46/46, `npm run test:browser` 43/43 (desktop + iPhone).

## Item 2 — Weekly Command Center items link to their tab

Plan: hub items built in `buildWeeklyHub`/`buildPreseasonHub` carry a `tab`
(and optionally `player`/`recruit` id). `renderWeeklyHub` renders those as
clickable cards (`.hub-link`, keyboard-operable) that call `goToTab(tab)`
and open the player/recruit profile dialog when an id is attached.

Decisions:
- `goToTab(id)` is a new helper that does what the nav button click handler
  does (toggle nav + section `.active`, `setActiveTab`) so hub links behave
  exactly like clicking the tab. Use it for any future deep link.
- Mapping: FINAL/RANKINGS → season; MEDICAL/LOCKER ROOM → roster + player
  dialog; COMMITMENT/TOP TARGET → recruiting + recruit dialog; NEXT UP →
  gamelab; preseason ROSTER → depth, RECRUITING → recruiting, REDSHIRTS →
  roster.
- Hub items persisted in older saves have no `tab` and simply render
  non-clickable; nothing to migrate.
- Browser test gains a check that clicking a hub link activates its tab.

Outcome: done. `npm test` 46/46, `npm run test:browser` 45/45 (two new checks).

## Item 3 — decommits and flips

Plan: committed recruits are no longer skipped in `advanceRecruiting`. A new
`pressureCommit(r,u)` scores the committed school against the best
challenger from a 12-team sample (the user's pitch gains the same
targeted/relationship/visit/promise boosts it gets for open recruits, so
attention both attacks other schools' commits and defends your own). A
positive gap gives a small weekly decommit chance; the recruit flips to the
challenger if it has room, otherwise reopens. `decommitRecruit(r)` reverses
`commitRecruit` (class count, team.commits, commitWeek) and records the event
in `universe.decommitLog` (bounded to the last 80).

Decisions:
- Commits are safe for their first two weeks (`commitWeek+2`) so a fresh
  commitment is never undone the next week.
- Weekly chance = clamp(.003 + gap*.0022, 0, .045) and only from week 6, so
  the outcome is a story beat, not churn. Target 3–8% of commits per cycle;
  `npm run audit` now prints the measured rate.
- A recruit flipping to the user requires `r.targeted` — the AI never gifts
  the user a flip. AI-to-AI flips need no attention.
- The recruiting table shows Target/Visit controls for other schools'
  commits (previously hidden) so the user can actually chase a flip.
- Hub: DECOMMIT (lost), FLIP (gained), WAVERING (own commit under the most
  pressure) items, all linked to the recruiting tab + recruit dialog.
- A recruit's `flippedFrom` is appended to the player's `origin` string on
  signing so the story survives into the roster and archive.

Tuning (measured with a one-season harness run, seed 7): the committed
school is the best of a 20-team sample plus a +6 incumbency bonus, so the
challenger gap is almost always negative (median −21, 90th pct −11, only 1%
positive). A linear hazard on positive gap produced 1 decommit per cycle.
Replaced with a logistic hazard `.07/(1+exp(-(gap+11)/4))`, ignored below
gap −30: median commit ≈0.6%/week, 90th-pct commit ≈3.4%/week.
Result: 80 decommits of 1,613 in-season commits (5.0%); multi-season audit
4.2%. Nearly all are flips because the challenger is by construction a school
with room. `universe.recruitCycle` records the cycle's totals for the audit.

Outcome: done. `npm test` 48/48 (two new checks), browser 45/45, audit
rosters still 85–105. Note: the audit's existing "signees/team" line is
meaningless — it counts every roster player whose origin says "star recruit",
which is everyone generated — mean 90 per team. Not fixed; out of scope.

## Item 4 — ID indexes for T() and findPlayer()

Plan: `Map` indexes (team name → team, player id → {p, team}, archive id →
row) held in module-level `IDX`. `rebuildIndexes()` is called from
`normalizeUniverse()` and lazily whenever a lookup detects the index is
stale. `T()` and `findPlayer()` keep their signatures and return shapes.

Decisions:
- No instrumentation of roster-mutation sites (six push/filter sites, easy
  to miss one). Instead the index self-validates: a team hit must still be at
  its recorded position in `universe.teams`; a player hit must still be on
  the recorded team's roster; the total roster population is compared with
  the indexed population on every findPlayer miss/stale hit and the index is
  rebuilt when they differ. A rebuild costs one full scan, i.e. what a single
  findPlayer cost before.
- The archive only grows by push, so its index is extended incrementally
  from the last indexed position rather than rebuilt.
- A miss that survives a rebuild is remembered (`IDX.miss`) so a render path
  asking for a dead id does not rebuild every call; the memo clears on the
  next rebuild.

Measured (harness, one season + camps + offseason, so the archive is
populated): `findPlayer` on a live player 2,000 lookups scan 218ms → index
5ms; on an archived player, 500 lookups scan 121ms → index 2ms; `T()`
20,000 lookups scan 19ms → index 1ms. `initUniverse()` also resets the
index so a New Universe doesn't reuse a prior game's stale Maps.

Outcome: done. `npm test` 51/51 (three new checks: archived lookup, live
lookup after roster turnover, T() over all 120 teams), browser 45/45.

---

## Session status — stopped after item 4

Items 1–4 are complete, committed, and tested (`npm test` 51/51, `npm run
test:browser` 45/45, `npm run build` produces no diff — tree is clean).

**Item 5 (move `playerArchive` into its own IndexedDB store) was not
started.** The work list marked it explicit risk — "do not start it unless
you can finish and keep npm test green" — and it is the one item that
touches save/load/export/import directly, three surfaces the project's own
guardrails say must never lose compatibility without a migration path.
Stopping before it, rather than leaving it half-built, is the safer place to
hand off. See `DYNASTY_LAB_GPT_HANDOFF.md` at the repo root for what item 5
would need and everything else a follow-up session should know.

## Continuation milestone 1 — archive persistence and recruiting audit

Base `ea4c324`; working branch `codex/v081-save-continuation`. User requested
continuing from the newest v0.8.1 and completing work in resumable chunks.

Decision: preserve the complete single-file JSON export and every archived
career. Split only browser persistence. Add `storage.js`, a dependency-free
IndexedDB adapter with atomic two-store saves, append-only archive chunks,
revision checks and explicit errors. Integrate deferred loading at archive UI,
export and offseason boundaries. Keep the app version 0.8.1 and production
unchanged. The store upgrade does not itself cap history growth; full archive
hydration/export remains a known limitation documented in `STORAGE.md`.

The recruiting audit suggestion needed correction: `seasonCommits` is a league
scalar. Record final `signeesByTeam` before rollover instead, and test it against
the actual finalized recruit pool. One-season result: 15–30, mean 23.3, rather
than counting all veterans with recruit origin strings.

The old harness did not export `packUniverse`, so its round-trip test silently
used the raw universe fallback. Expose the real packer and test that path.

Validation: 52 engine checks and 10 storage/integration scenarios; 45 Chromium
UI checks and 4 real-IndexedDB UI persistence scenarios; one-season audit and
standalone build. All passed. Engine integration preserves histories across two
seasons, versioned old JSON fixtures, export/import, failed imports and new
universe replacement. Failure tests cover quota-style write failure, explicit
transaction abort, stale tabs, missing chunks, blocked upgrade and unsupported
storage version. Tests use disposable DBs/profiles, not user saves.

Actual iOS Safari remains untested. No production or default branch changes.
The next operator should start with `CONTINUATION.md` and its next-chunk list.

## v0.9.0 — Promises Become Debts (preview batch)

- Recruiting offers now retain school and recruiter identity; signed players carry
  first-season obligations. A rival signing never inherits another school's offer.
- Early Role uses actual appearances (eight, reduced by recorded injury weeks);
  No Redshirt respects major injury exceptions; Position Lock remembers forced
  changes; Development Plan requires actual Technique training in both camps.
  NIL Priority is recorded passively.
- One-time offseason audits change morale, staff trust and transfer risk, append
  structured events, and retain results in active/archived profiles and exports.
  Significant breaches appear in the Weekly Hub. Transfer penalties follow the
  original school for one subsequent season, not the player's destination.
- Existing coach IDs remain stable; missing IDs are assigned once and departing
  coaches are archived. Legacy promise labels are retained without invented terms
  or retroactive penalties. IndexedDB remains schema 2.
- Checks: 52 engine checks, 12 persistence/promise test groups, 45 browser checks,
  five browser persistence scenarios. Recruiting audit: 15–30 signees per school,
  mean 23.3, flips 4.8%. Actual iPhone Safari remains untested.

Design boundaries: no coaching market, AI promise generation, recruiting-credibility
or high-school relationship tuning in this batch. Promises use official position,
not a guaranteed depth-chart slot; development delivery is camp-based. The existing
transfer and roster-cut mechanisms are otherwise unchanged. Obligations cut before
their first playing season remain recorded but have no season to audit yet.

User preference: conserve usage, finish one bounded batch, publish a playable
preview, then stop. Old saves are expendable; reliable future saves are the priority.

## v0.9.1 — Transfer destinations and memory (preview batch)

- Transfer destinations now weigh recruiting finalists/known offers, playing
  opportunity, scheme, geography, prestige, pipelines and retained coach ties.
  A weighted choice preserves variation; full rosters and the current school
  are excluded. No destination causes the player to remain in a saved portal queue.
- Moves preserve the same player, eligibility/redshirt record, injury history,
  hidden development profile, promises and career history. Season totals reset
  after archival, fixing transfer statistics being counted again the next year.
- Persistent transfer records and events retain origin/destination IDs and names,
  year, reason and coach references. Profiles show transfer history; the Weekly
  Hub flags upcoming matchups involving former players without claiming a start.
- Uncompleted obligations are explicitly released on roster cuts/portal departures.
  Existing broken promise history remains intact.
- Checks: 52 engine checks, 14 storage/promise/transfer test groups, 45 browser
  checks and five browser persistence scenarios. Three-season audit: 55/45/59
  transfers, zero unplaced players, bounded rosters; final recruiting flips 4.3%.
  Actual iPhone Safari testing remains outstanding.

Destination calibration is intentionally narrow: transfer-entry frequency is
unchanged (~0.4–0.5 transfers/team/season in this audit). No AI promises were
issued by the audit, so it does not calibrate broken-promise transfer rates.
The top-five snapshot is saved at commitment (updated on flips), not fabricated
for old players. Known offers are the accepted school and the explicit promise
school; there is no separate scholarship-offer UI yet. Initial rosters without
recruiting geography use their departing campus for proximity. Existing coach
movement is limited; scoring supports stable coach IDs at a future new employer.
Portal players with no seat remain outside rosters, searchable and exportable,
and retry next offseason; no off-campus development/aging simulation is added.

User budget agreement: publish this one batch and stop. Next: v0.9.2 Game Center.

## v0.9.5 — coach relationship portability

Plan: keep school interest and coach relationship separate, attach one stable
primary recruiter to commitments, then let that coach-specific relationship
follow stable coach IDs through the existing `moveCoach()` path.

Decisions:
- coach movement creates pressure, never an automatic commitment flip;
- the full hiring/interview/offer market stays deferred to v0.9.6;
- actual cross-school movement is bounded to coordinator jobs in the existing
  offseason carousel so the feature appears in normal saves;
- carousel timing moves ahead of portal decisions so current players can react
  to a coach move in the same offseason;
- no save-schema change; old recorded recruiter memory is the only migration
  evidence used.

Validation is performed by the one-shot v0.9.5 workflow before preview publish.

## Commercial polish pass (unreleased, presentation only)

Why these calls were made:

- **One masthead instead of two hero cards.** Record and rank belonged next to the program name; splitting them meant two competing headlines. The broadcast strip stays as the "scoreboard" so the masthead never duplicates the next matchup.
- **Duplicate hub tiles collapse rather than hide.** The strip already promotes NEXT UP and FINAL. Hiding them would break `tests/browser.js` (it clicks the first `.hub-link`) and lose the FINAL tile's direct Game Center link, so they render as one-line links at the bottom of the wire.
- **Urgency by CSS `order`, not engine sort.** Keeps the pass out of `buildWeeklyHub`. The real importance-based sort remains handoff item A.
- **A last-loaded `polish.css` instead of editing five CSS files.** Every rule in the pass is in one place another model can read top to bottom; the old two-card hero rules were the only deletions.
- **Game Center scoreboard is DOM-derived.** `sports-presentation.js` parses the existing title/meta/pregame text, and those elements stay in the DOM (visually hidden) for `aria-labelledby` and the storage regression test that reads `#gamePregame`.
- **Profile sections are markup edits in `app.js`.** The renderer is the only place the body markup exists; the edit wraps existing values in `<section>`s and moves nothing out of the save model.
