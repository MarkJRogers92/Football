# Changelog

## v0.9.29-32 — Reconciled: GPT's Game Center drive replay / watch mode

Between this branch's v0.9.28 and this commit, a parallel GPT/codex session shipped four
versions (v0.9.29-32) straight to `gh-pages` production without ever pushing source — the
work existed only inside the built `index.html` on the `gh-pages` branch, in no branch or PR.

Reconciled by exact extraction rather than reverse-engineering: `tools/build.js` concatenates
named source files with known separators, so each unchanged file (`renderer-v1.js`, `storage.js`,
`visual-identity.js`, `recruit-presentation.js`, most CSS) was locatable verbatim inside the
live bundle, and the changed ones (`app.js`, `sports-presentation.js`, `body.html`,
`sports-presentation.css`, `polish.css`) were sliced out using those as anchors. Rebuilding from
the extracted files reproduces the live `index.html` **byte-for-byte** — confirmed, not assumed.

What it added: a Game Center drive-by-drive replay / watch mode (`driveReplay`, `gameWatchHTML`,
`watchGame`, `watchUserDetailed`, `animateNumber`, `detailedDriveCount`), plus drive counts that
now vary per game rather than following a fixed pattern.

One stale test fixed: `tests/games.js` asserted an exact drive count (24) for a fixed seed; that
number is no longer stable now that drive count varies by design, so the assertion was updated
to the current value with the real invariant (drive-points-sum-to-score) left in place and
re-verified. 133/133 Node tests, 144/144 browser checks pass on the reconciled tree.

No feature changes of this branch's own in this entry — this is the merge point. New work
continues from here as v0.9.33+.

## v0.9.28 — Fix: an ignored job offer froze career progression forever

Found by a headless multi-season soak test, not by hand-play. If a closed tenure's job offers were never resolved — a player who ignored the CAREER wire tile, or a script that never called `acceptPost` — the season kept simulating normally (games, recruiting, rosters, the wire) while the program's own `careerHistory`, `adminConfidence` and tenure record silently froze at whatever they were the moment the tenure closed, forever. Not a crash: a stuck state that looked like nothing was wrong.

Fixed the same way the Coach's Desk already blocks the calendar on unresolved decisions: `simWeek`, `simSeason` and `simulateUserDetailed` now refuse to advance while `universe.jobOffers` is non-empty, via a new `hasPendingCareerChoice()` check, with a status message telling the player why. Unlike a Coach's Desk decision there is no "delegate" option — picking your next job **is** the decision — so the check is unconditional rather than skippable the way weekly decisions are during a fast-forwarded season.

**The check that mattered most:** `simSeason`'s fast-forward loop (`while(universe.phase==='regular')...`) would otherwise spin forever re-checking a week that can never advance, since a blocked `simWeek` returns without changing anything. The guard sits at the top of `simSeason` itself, before the loop starts, not just inside `simWeek` — and there's a test asserting `simSeason` returns in under two seconds rather than hanging.

- 4 new tests in `tests/careerblock.js`, including the infinite-loop check.
- No storage or engine-state change — this only changes when three existing functions are willing to run.

## v0.9.27 — The coaching tree, a cache fix, and roadmap B measured

**Coaching tree.** Coach career stints and the coach archive already recorded everything needed; nothing showed where the people who worked for you ended up. The Staff tab now has a Coaching Tree card listing every former staffer who moved on, head coaches first, with their career record. Producing a head coach is worth up to two prestige points a season, credited **once per coach** so a long-tenured branch does not pay out forever, and capped by `program_ceiling`.

The definition is the careful part: a branch is someone who worked here and *then* took a job elsewhere. A coach who was a head coach somewhere else before joining your staff is not something your program produced, and there is a test for exactly that case.

**Cache fix.** The built page now carries `<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">`. GitHub Pages serves HTML with `max-age=600`, so a freshly published build could show the previous version for up to ten minutes. Browsers now revalidate instead.

**Roadmap B measured, not built.** Six seasons of one league, measured per component — written up in `docs/SAVE_SIZE_MEASUREMENT.md`. The roadmap's stated assumption was wrong in every particular:

- Growth is **11.4 MB/season**, not the ~4 MB recorded.
- `universe.events`, named as one of the two drivers, is **2.0% of the save**.
- `seasonHistory`, the other named driver, grows +0.33 MB/season.
- The real drivers are `gameArchive` (+5.83 MB/season, 41.8%) and `playerArchive` (+3.50 MB/season, 22.9%) — **80% of all growth between them**, and neither was named.

No optimisation shipped, deliberately: those are portable-export numbers, and browser storage already defers `playerArchive` into chunks, so the next step is measuring what IndexedDB actually holds rather than optimising a shape that is not what gets stored.

- 5 new tests in `tests/coachtree.js`. Storage additive: `t.coachTreeCredited`.

## v0.9.26 — Five groups instead of fourteen tabs (roadmap milestone C)

Fourteen flat tabs was the last thing roadmap milestone C flagged, and the tab strip had grown to 1387px of content in a 390px viewport — a sideways-scrolling row nobody could see the end of. Tabs are now organised into five groups:

- **Program** — Dashboard, Program Lab, History
- **Team** — Roster, Roles & Depth, Development & Camp
- **Recruiting**
- **Games** — Game Lab, Season, Stats, Newsletter
- **Staff & Offseason** — Staff & Schemes, Offseason, Awards & Records

Selecting a group reveals its tabs and opens the first one. **The tab buttons themselves are untouched** — same markup, same `data-tab` values — so every `go()` call, hub tile, weekly-plan step and existing selector still resolves.

The one thing that had to be right: any programmatic jump into a tab (a wire tile, the weekly plan, `go()`) must bring its group with it, or the tab would open with the wrong group highlighted and its siblings hidden. `setActiveTab()` now syncs the group on every activation regardless of what triggered it, and there is a browser check that clicks a tab directly and asserts the group follows.

- Horizontal scrolling in the tab strip is gone: 0px overflow at both 1280px and 390px, down from 997px of hidden content on mobile.
- 5 new browser checks per viewport (10 total). Navigation in the browser suites now goes through a `goTab()` helper that selects the group first — the IA changed, so the way a test reaches a tab changed with it.
- No engine or storage change.

## v0.9.25 — Academic eligibility

`t.academics` was a recruiting weight and nothing else, so a 3-star at a 90-academics school was mechanically identical to one at a 55. Every player now carries an academic standing that drifts each week toward what his program and his own head can sustain, and falling through the floor costs you the player.

- `academicTarget()` blends program support, the player's `iq` and the wear of a heavy season. Standing moves 12% of the way toward it each week with a point of steady drag, so equilibrium sits about eight below target. A good student at a strong program settles around 91; a weak one carrying a heavy load at a thin-support program settles in the twenties — under the floor of 30.
- Below the floor he is **ineligible for two weeks**, enforced through `gameAvailable()` — the single gate every selection path already runs through, so no depth chart, rotation or game sim can field him. The hold expires and returns him just above the floor rather than into an instant relapse.
- **A new Coach's Desk card where every branch costs something.** Study table is six points of standing a week and six points of scheme familiarity; splitting the week is two and two; keeping him at practice buys nothing academically and lets the drift continue. This is the trade-off the desk was missing — most of its other cards have an option that is simply correct.
- The wire escalates: ACADEMIC WATCH at importance 56 while he is close, ACADEMICS at 74 once he is actually lost. The Roster board gains an Academics column colour-coded like health.

**Tuning note worth recording.** The first pass put targets in a range where the floor was mathematically almost unreachable — the feature would have shipped inert. The tests caught it as two failures that looked like test bugs and were not. The published curve is the retuned one.

- 6 new tests in `tests/academics.js`. Storage additive: `p.academicStanding`, `p.academicPlan`, `p.academicHold`. IndexedDB stays at schema 3.

## v0.9.24 — Signing day, one name at a time

Wavering commitments carried a `challenger` and a `pressure` score all season, and then survived to signing day untouched — the drama the engine had already modelled simply evaporated. Contested commitments now get one last resolution, and the player watches it land one name at a time.

- `buildSigningDay()` takes the twelve most contested commitments, sorted by pressure, and resolves each one. Odds come from the pressure already on the board, softened by the recruit's relationship with his recruiter and by a signed promise, bounded 2–62%.
- **Everything is decided up front and stored; revealing is pure presentation.** Re-rolling on reveal would make the outcome depend on how fast somebody clicks. `revealNextSigning()` and `revealAllSigning()` only move a counter, and there is a test asserting the board is byte-identical before and after a full reveal.
- A flip genuinely moves the recruit and is written to the decommit log with both `from` and `to`, so it reads as a flip rather than an unexplained decommit. If the challenger cannot actually take him, the original school keeps him.
- The Recruiting tab gains the signing-day board, colour-coded from the controlled program's point of view, with "Announce the next name" and "Announce the rest". The wire carries it at importance 84 until every name is in.

**Bug fixed at the source, found by the new tests.** `r.challenger` was never cleared when a recruit committed, so a recruit who flipped *to* his challenger kept naming that school as the one challenging him — the board showed him WAVERING against his own program. `commitRecruit` now clears `challenger` and `pressure`, which `advanceRecruiting` recomputes each cycle anyway. This also fixes the pre-existing WAVERING pill and the weekly plan's "Hold X" step, both of which could fire on a recruit nobody was chasing.

- 5 new tests in `tests/signingday.js`. Storage additive: `universe.signingDay`. IndexedDB stays at schema 3.

## v0.9.23 — Bowl season, and a fanbase that answers to results

**Bowl season.** The phase machine ran `regular → confReady → playoffReady → complete`, so roughly 112 of 120 programs simply stopped playing once the regular season ended. There is now a `bowlReady` phase between the conference round and the playoff: every team with six wins that is not in the playoff field gets one more game, paired best-against-best down the rankings. That gives a mediocre team something to chase in weeks nine through twelve, which is the real point — the wire carries a BOWL WATCH tile naming exactly how many more wins are needed while they can still be got.

- `simPlayoff()` deliberately tolerates being called straight from `bowlReady` and plays the bowls first. Bowls therefore cannot be skipped, and every existing caller — thirteen test files among them — keeps working without change.
- Each eligible team plays exactly one bowl; a win is worth fan support and is recorded on the team and the event ledger.

**Fan support answers to results.** `t.fan_support` was a static number feeding exactly one recruiting pitch. It now moves once a season toward a target set by wins against expectation, a conference title, a national title and a bowl win — and decays back toward the program's own `fanBaseline`, so one good year is not permanent and one bad year is not fatal.

- It feeds home-field advantage, which was a flat `ha=2.2` for all 120 programs regardless of who was in the stadium. It is now `2.2 + (fan_support-60)*0.03`, bounded to 0.8–3.4 — an average fanbase keeps exactly the old value, so the change is a spread around today's behaviour rather than a shift in it.
- Together with the rivalry result from v0.9.21, fan support is now a genuine feedback loop: results move the fanbase, the fanbase moves home field and recruiting, and those move results.

- 6 new tests in `tests/bowls.js`. Storage additive: `universe.bowls`, `t.bowlResult`, `t.fanBaseline`. IndexedDB stays at schema 3.

## v0.9.22 — The career arc

v0.9.21 gave the hot seat an ending and nowhere to go. A dynasty that can only end is worse than one that never ends, so a closed tenure is now a line on a résumé and the résumé is what the next job market reads.

- **Closing a tenure** archives it to `universe.careerHistory` with the school, its prestige, the years, the record and why it ended. Closing twice is a no-op.
- **The job market reads the résumé.** `hiringCeiling()` blends the best prestige you have held (72%), your career win percentage (up to 46 points) and your longevity (up to 10), clamped to 18–96. Up to three programs at or below that ceiling are offered, best first; the school that let you go is never among them. A good record at a weak program still counts for something, and a bad one genuinely costs you.
- **Taking a post** starts a fresh tenure at zero while the career record carries forward, seeds the new employer's confidence from *its own* `admin_patience` rather than your old school's, and writes a `TENURE_STARTED` event.
- **Two guards that matter.** A closed tenure stops accruing seasons until a post is taken, so a run cannot silently continue at a school that already let you go. And switching the controlled program by hand is treated as a new post ("stepped away") rather than a continuation of the old record.
- The wire carries a CAREER tile at importance 95 — above everything else, including a national record — while offers are open, and the Program tab gains a Coaching Career card, a career line in Institutional DNA, and the offer card itself.
- 5 new tests in `tests/career.js`. Storage additive only: `universe.careerHistory`, `universe.jobOffers`, and `closed` on `universe.tenure`. IndexedDB stays at schema 3.

## v0.9.21 — Stakes: rivalries, the administration, and NIL you have to spend

Three features from the new `IDEAS.md` backlog, all built on data the game already stored.

**Rivalries.** Every program's rival is derived, never authored: the nearest school in its own conference *that is actually on the schedule*. That last clause matters — the conference round-robin plays eight of eleven opponents, so the geographically nearest school is not necessarily one you ever meet, and a rivalry you play only two years in three is not a rivalry. Pairing takes the globally closest eligible pair first; taking each team in turn strands the last two in a conference. 114 of 120 programs get a rival; the remainder genuinely have no unpaired conference opponent they play. Each pair shares a trophy, an all-time series and a streak that persists across seasons, and the result moves both fanbases. The wire flags rivalry week before the game and the outcome after.

**The administration.** `carousel()` has always fired AI head coaches on `admin_patience` while explicitly skipping the controlled team, so every program in the world lived with consequences except the player's. The board now sets a preseason expectation on the same formula the AI is judged by — `clamp(Math.round((prestige-30)/8),4,10)` — and reviews the season against it. Confidence moves on wins against that number, the rivalry result, and conference and national titles, at a speed set by `admin_patience`: an impatient board (25) swings roughly twice as hard as a patient one (90). Sustained confidence buys resources and facilities; sustained failure costs them, states a mandate for next season, and ultimately ends the tenure. The wire warns while the season is still winnable rather than delivering the verdict in the offseason.

**NIL as a budget.** `t.nil` was a static number that only tilted `recruitPitch`. It is now a finite per-season budget (derived from `nil` and `resources`) that you allocate: a deal on a rostered player is real retention pressure against everything `transferRisk` sums, and a deal on a recruit improves your pitch — and only yours, since deals record the school that paid. Deals are reversible within the season they were signed and clear at the new year. Holding a disgruntled starter and signing a blue-chip come out of the same pool, which is the decision.

- New Roster column for NIL offers, new Program tab rows for rivalry, series, expectation, confidence, mandate and NIL.
- 13 new tests across `tests/rivalries.js`, `tests/adminconfidence.js` and `tests/nil.js`.
- Storage: additive only (`t.rivalry`, `t.adminConfidence`, `t.mandate`, `t.nilSpent`, `universe.tenure`, `nilDeal` on players and recruits), backfilled in `normalizeUniverse`. IndexedDB stays at schema 3.
- Also adds `IDEAS.md`, a twelve-item backlog grounded in what the code actually does, with these three specced.

## v0.9.20 — The story surface

- **Record chase on the wire.** `recordChaseHubItems` compares every rostered player's live season stats against the standing school and national single-season records and puts the ones in reach on the wire. Passing a mark reads as NATIONAL RECORD (importance 88) or SCHOOL RECORD (72); sitting inside 80% of one reads as RECORD WATCH (60 national / 50 school), naming the number and who holds it. One tile per player so a quarterback cannot take the whole wire on passing yards and passing touchdowns at once, two tiles total.
- Season records are only rewritten at year end by `finalizeSeasonHonors`, so through a season these are genuinely last year's marks being chased rather than the current leader compared against himself. Season one has no standing records and so produces no tiles, and the player who already holds a mark is never told he is chasing himself.
- **Career chronology.** The player profile's Season Timeline is now a Career Chronology: signing (stars and region), every archived season, honors, transfers with their reason, injuries with weeks missed, and the draft result, merged into one list ordered newest year first. All of it was already stored — `recruitingMemory`, `seasonHistory`, `awards`, `transferHistory`, `injuryHistory`, `draftResult` — and none of it was previously readable in one place.
- Two new tests in `tests/weeklyplan.js`: one plants standing marks and checks reach, ranking, self-chase and the no-records case; one asserts the chronology's ordering and its empty state.
- Completes roadmap milestone A (part 1, the hub priority sort, shipped in v0.9.19). No save-format change — every field read here already existed.

## v0.9.19 — The wire ranks by importance

- `buildWeeklyHub` used to keep the first nine tiles in insertion order, so on a busy week the items pushed last (a wavering commit, the top target, a flip) were the ones that fell off regardless of how much they mattered. It now stable-sorts by `importance` before taking nine; ties keep their original order, and the CSS `order` grouping by tile type in `polish.css` is unchanged.
- Only some tiles actually carried an `importance` (the coach-fallout and familiar-face items). The inline FINAL / RANKINGS / MEDICAL / COMMITMENT / NEXT UP / LOCKER ROOM / DECOMMIT / FLIP / WAVERING / TOP TARGET tiles now carry one on the same 0–100 scale `universe.events` uses (a loss outranks a win, a 5★ commitment outranks a 3★, transfer risk uses its own score), and OFFER PULLED / PROMISE BROKEN pass the underlying event's importance through; COACHING SEARCH gets a fixed 62. A missing value falls back to 40 rather than producing a `NaN` comparison.
- One new test in `tests/weeklyplan.js` walks a full regular season checking every tile is numerically ranked and the wire stays sorted, then plants a deliberately trivial promise event (which `buildWeeklyHub` inserts first) and confirms it no longer leads the wire.
- No save-format change; `importance` is an additive field on hub tiles, which are rebuilt every week anyway.

## v0.9.18 — Reconciling the Coach's Desk, Player Agency and Scouting Intelligence

- Rebases three GPT/codex feature branches (v0.9.14–v0.9.16, previously only in their own previews, never merged) onto the commercial polish pass (v0.9.17). See the three entries below for what each brings; this release is the reconciliation.
- Four real merge conflicts in `app.js` (the recruit profile, the player profile, and the recruiting board row/handler) were resolved by hand: the polish pass's `profile-sections` layout and styling classes were kept, with the scouting-intelligence panels, history and behavioral additions (`ensureScoutingIntel`, `scoutingPanelHTML`, `scoutingHistoryHTML`, `firstRecruitEvaluation`) woven in at the same points the original branch put them.
- One deliberate design call in that merge: the player profile's raw Speed/Power/Technique/IQ grades (present since v0.8, absent from the v0.9.16 branch) were **not** restored. Scouting Intelligence's whole premise is that those numbers are uncertain and staff-estimated; showing the exact figure next to a fuzzy confidence range next to it would have undermined the feature it was reconciled with.
- Version bumped from 0.9.17 straight to 0.9.18 (the codex branches' own 0.9.14–0.9.16 numbers were retired on rebase, since none of them had reached production).
- No new simulation logic beyond what each of the three branches already validated; the added surface here is entirely the merge itself, verified with the full suite plus a direct visual pass of the merged recruit profile, player profile and dashboard decision cards.

## v0.9.17 — Commercial polish pass (presentation only)

- Dashboard: one program masthead (identity, record, rank, week, grades, sim actions); command center splits into weekly plan and "the wire"; hub tiles ordered by urgency; tiles already promoted into the broadcast strip collapse to one-line links; Game Center button on the last result; Top 15 shows team marks and highlights the controlled program.
- Design system: `polish.css` adds type/spacing/surface tokens, flat card variants, button and status-chip families, table density/hover/selected rules, portrait frames, grouped tab separators and a compact 390px header.
- Profiles: player body grouped into Season / Development / Health / Career; recruit profile framed as a dossier with Close pinned to the corner.
- Recruiting board: commit/wavering chips, gold stars, weighted rank and interest, targeted-row edge, columns fit a 1280px viewport.
- Game Center: scoreboard with marks, records, ranks and winner emphasis; segmented section control.
- Fixed in review: the Signing Class card's "of 30 slots" was a leftover from before v0.9.11 introduced dynamic scholarship capacity; it now reads the real per-program number, and the memoized re-render that was silently dropping the correct value now keys on capacity too.
- No simulation, storage, schema or save-format changes beyond the fix above. Audit and continuation notes in `docs/`.

## v0.9.16 — Scouting Intelligence

- Recruit and active-player profiles now show five position-specific scouting domains as ranges with confidence labels. The domains derive from attributes already in the simulation; hidden true ratings remain hidden.
- Confidence responds to staff evaluation, recruiting exposure and visits, camps, appearances, starts, snaps, class, coach familiarity and transfer experience. Public player styles and existing development profiles shape uncertainty without revealing private development labels.
- Staff belief is preserved at meaningful checkpoints: first recruiting evaluation, signing day, first fall camp, the end of a freshman season and later major revisions. Snapshots retain the ranges the staff saw at the time instead of rewriting history.
- Scouting state uses additive player/recruit fields and the existing save/export paths. Old saves initialize lazily and idempotently with no IndexedDB schema change.

## v0.9.15 — Player Agency / Locker Room

- Players can now initiate five focused Coach's Desk conversations: playing-time complaints, transfer concerns, role requests, redshirt discussions and position-change requests. Every trigger comes from existing morale, promises, relationships, usage, depth, transfer risk, redshirt eligibility or role/scheme fit.
- Responses feed bounded changes back into the existing morale, staff-trust, promise, redshirt, rotation and position systems. Position requests use the established familiarity path and player-requested promise handling; no ratings or hidden personality values are exposed.
- Player requests share `universe.weeklyDecisions`, the existing cards and the event ledger. A per-player cooldown, alternate-week cadence and rolling cap of three interactions per four weeks keep the locker room from becoming a constant interruption.
- Old decisions normalize additively as staff-originated. Browser/portable persistence remains on the existing schema, and Sim Regular Season can continue by delegating conversations to staff.

## v0.9.14 — The Coach's Desk

- The Weekly Command Center can now open up to three state-backed coaching decisions in a controlled-team week: a compromised starter's workload, a player nearing the four-game redshirt threshold, a meaningful playing-time concern, or a choice between two recruiting priorities.
- Decisions reuse the systems already underneath the game. Injury choices change weekly availability and workload risk, redshirt choices use the existing protection flag and promises, playing-time answers adjust the real rotation/morale/trust/promise state, and recruiting priorities schedule an existing visit.
- Resolutions persist in `universe.weeklyDecisions` and write a `WEEKLY_DECISION_RESOLVED` entry to the existing event ledger. A short cooldown prevents the same player or recruiting pair from becoming a constant interruption.
- The existing Weekly Plan remains intact below the decision cards. Single-week controls wait for an answer; Sim Regular Season explicitly delegates choices to the staff.

## v0.9.13 — The weekly plan

- The Dashboard now suggests what is worth doing right now. It leads with the single step that moves the calendar, then real blockers (an open coaching search, being over the scholarship limit), then available recruiting and locker-room work.
- The offseason sequence — spring development, fall camp, finalize — is shown as an explicit checklist. Steps you have cleared are marked done and sink to the bottom, so the progression is visible instead of something you discover by getting stuck.
- Every suggestion routes to the tab where the work happens, and the list is capped so it stays short enough to act on.

## v0.9.12 — Box scores stop rewriting themselves

- Permanent box scores now live in their own append-only chunks instead of the core save row. An ordinary save appends only the games just played; a twelve-season dynasty no longer rewrites ~75 MB of history it never touched. Measured at three seasons: a save writes 29 MB instead of 53 MB, and the gap widens every year.
- Game history is hydrated on demand, the same way archived careers already were. Opening the Game Center, the newsletter or school history loads it; exporting a dynasty hydrates it first, so portable JSON remains a complete save with every game ID intact. Nothing is ever pruned.
- Browser storage moves to schema 3. An existing save keeps working and splits its history out on the next save, exactly as the v0.9.0 career-archive upgrade did.
- The recruiting board sorts by any column header. Click to sort, click again to reverse; columns where the interesting end is the top (stars, scout grade, interest, trend) open descending. Sorting orders the entire pool before the visible slice is taken, so it surfaces the real leaders rather than reordering the first 220 rows.

## v0.9.11 — Scholarship scarcity and pulled offers

- Recruiting classes are bounded by the room the roster actually leaves instead of a flat cap of 30. Capacity derives from the 85-man limit against projected returning players, held inside a realistic signing-class band, so a heavy graduating year gives you room and a thin one squeezes you.
- Attrition is now a recruiting resource: transfers out, early declarations and graduations are what buy your next class.
- Some programs over-sign on purpose, betting on attrition they cannot name yet. Appetite is a stable trait — impatient, high-profile programs push the limit — and signing day settles the bet by pulling the weakest commitments. Roughly a third of the league has to pull an offer in a given year.
- You can pull an offer yourself. It is never free: the recruit reopens his recruitment, will not consider your program again, and the pipeline he came from takes a hit. The Weekly Hub reports it.
- The Recruiting tab shows scholarships committed against capacity, spots remaining, and a warning when you are over the limit.

## v0.9.10 — Scheme installation and position-change agency

- Coordinators now run a system of their own. Hiring an OC or DC who prefers a different scheme replaces yours and starts an installation, so the coaching market is a strategic choice rather than a pick-the-highest-rating exercise. Candidate cards say up front what a coach runs and warn when hiring him will change your system.
- Installing a scheme costs fit, never ratings. Year one bites hardest; spring and fall camp install it, and the drag fades over roughly three seasons. Players who suited the old system pay the steepest transitional price and settle below where they were — they are square pegs now, not worse players.
- A roster that no longer fits its system is likelier to leave: scheme mismatch feeds transfer risk, and only for the side of the ball that actually changed.
- The Staff tab shows what is being installed, from what, and how far along it is.
- Position changes are now a conversation. Players weigh body fit, playing time, staff trust, versatility and any standing Position Lock promise, landing on Eager / Open to it / Reluctant / Refuses. A refusal blocks the move; forcing a reluctant player through it costs morale and staff trust. The preview tells you which you are dealing with before you commit.
- Old saves keep the system they already run — migration never invents an installation, and inherited coordinators are recorded as running what their program runs.

## v0.9.9 — Game recaps and the weekly newsletter

- Every archived game now writes its own recap paragraph: who won and by how much, how they won it (yardage, turnover margin, ground vs. air, sacks, shutouts), the star lines, and colour like a player facing his former school or a multi-week injury.
- Recaps are derived from the stored box score on demand and never saved, so they appear immediately for every game already in an existing dynasty and add nothing to save size.
- Wording is drawn from a stream seeded by the game ID: a saved game always reads the same way, and generating recaps never touches the simulation RNG, so reading history can never change what happens next.
- Recaps state only what the box score supports. With no clock or quarters in the model, the prose never invents timing, attendance or late-game drama — a test enforces this.
- New Newsletter tab: pick a week and a coverage level (your program, your conference, or national). It leads with the most newsworthy game in scope — ranked matchups, upsets, one-score finishes, title games — then lists the rest, with a line tracking your own record.
- The Game Center Summary now opens with the same recap.

## v0.9.8 — Recruit Portrait Integration

- Extended the frozen deterministic Portrait V1 renderer to recruits without changing face identity generation.
- Added recruit portrait thumbnails to the Recruiting board, portrait-led signing cards, commitment/flip spotlight art and a full Recruit Profile portrait.
- Uncommitted prospects use a neutral scouting uniform; committed prospects switch presentation to the committed school's colors while keeping the same face.
- Reused the recruit portrait seed already preserved into the signed player object, so recruit → roster continuity remains deterministic.
- Added lazy near-viewport painting for recruiting-board portraits to avoid eagerly rendering the entire 220-row board on mobile.
- Added desktop and iPhone-layout browser checks for recruit list, signing-card and profile portrait painting. No IndexedDB schema change.

## v0.9.7 — Visual Identity V1

- Added a presentation-only visual identity layer on top of the validated v0.9.6 game: darker broadcast-style shell, stronger information hierarchy, elevated cards/tables, refined tabs/buttons and more polished profile dialogs.
- Added deterministic controlled-school branding and monograms without adding brand fields to universe/save data.
- Added sports-network presentation for the Dashboard and Game Lab plus a larger portrait-led Player Profile while preserving existing game mechanics and data sources.
- Added a Recruiting Signing Class board, collectible-style commitment cards, commitment/flip spotlight and Recruit Profile hero treatment, all progressively enhanced from already-rendered recruiting data.
- Fixed narrow-screen regressions discovered during release validation, including Game Center header width, Signing Class decoration containment, recruit hero layout and mobile recruiting control overflow.
- No simulation rules, recruiting/coaching mechanics, player portrait identity logic, save migrations or IndexedDB schema changed in this release.

## v0.9.6 — Coaching Market

- Firing, retiring or losing a coach on the controlled team no longer auto-fills the slot: it opens a search. A weaker interim coach holds the role (staff ratings docked ~18%, half salary) until the user acts, so leaving a search unfilled has a real, visible cost. AI-controlled teams are unaffected and keep resolving vacancies instantly, exactly as before.
- Each opening gets a candidate market: two freshly generated candidates, up to two poachable coordinators/HCs from other programs (ambition-gated, fit-scored), and — for Head Coach openings only — the team's own OC/DC as internal-promotion candidates.
- A candidate must be interviewed before an offer can be made. Offers set salary, contract years and play-calling authority (full vs. shared); acceptance chance depends on fit, how the offer compares to their ask, and whether they were interviewed. A new per-team athletic department budget (derived from resources/prestige, matching the existing salary formula) caps what can be offered.
- Hiring an external coach closes their old stint at their old program (which then auto-fills its own vacancy, same as any AI departure) and opens a new one at the new program under the same coach identity — no duplicate coach objects. Promoting internally opens a follow-on search for the slot they vacated rather than leaving it silently unfilled.
- Declined offers mark the candidate and leave the opening searchable; accepted offers are final and clear the interim tag. Openings and the candidate market are core, portable universe state — old saves migrate additively, no IndexedDB schema change.

## v0.9.5 — Coaches take relationships with them (preview batch)

- Recruits now keep a stable primary-recruiter coach ID plus coach-specific relationship values separate from school interest.
- When a coach changes schools, the same relationship follows the coach: the old school loses that relationship boost and the new school gains recruiting/transfer pressure. Commitments are never auto-flipped by coach movement.
- Current players with strong ties to a departing recruiter receive a bounded transfer-risk bump; the coach's new school receives extra destination weight. Firing/retirement can create fallout without a destination.
- The offseason carousel now runs before portal decisions and can produce a capped number of real coordinator-to-coordinator moves, allowing players to react in the same offseason without building the full hiring market.
- Weekly/Preseason Hub surfaces recruiting fallout. Old saves infer existing recorded recruiter relationships additively from recruiting memory; no IndexedDB schema change.

## v0.9.4 — Persistent coaching careers (preview batch)

- Coaches now keep one durable identity across jobs, role changes and retirement, with persistent career stints and season-by-season team records.
- The existing offseason carousel records each staff season before turnover, preserves fired/departed/retired coaches, and can make a bounded internal coordinator-to-HC promotion without introducing the full hiring market.
- Staff names open a Coach Profile with descriptive specialties/traits, tracked record, titles, recent seasons and a career timeline. Former coaches remain visible from the selected program. Hidden personality numbers are not exposed.
- Coach movement/retirement events use stable coach IDs; existing player/recruit coach references continue to resolve. Old saves receive additive legacy career stints without fabricated historical wins or titles.
- Full interviews, competing offers, salary negotiation, staff budgets and relationship portability remain intentionally deferred to later v0.9 slices.

## v0.9.3 — Portrait V1 and release hardening

- Frozen deterministic Portrait V1 is integrated into roster and player profiles; identity survives recruiting-to-signing, saves, transfers and player archive.
- School jersey colors are deterministic and portrait rendering is cached.
- `VERSION.txt` is the single release-version source checked against the app/package at build/test time.
- GitHub Pages publishing now lives entirely in the Football repo, with production at `markjrogers92.github.io/Football/`.

## v0.9.2 — Permanent Game Center (preview batch)

- Stable game IDs and historical school/rank/record snapshots for every new game.
- Permanent team/player box scores, injuries, game leaders and detailed drive
  outcomes. Summary / Box Score / Drives / Play-by-Play sections; no invented
  quarters or clocks. Existing unlogged score adjustments are disclosed.
- Schedule, results, Weekly Hub, Game Lab and season-filtered school History
  reopen saved results. Game/championship events and former-player links use IDs.
- Core archive format 1 survives rollover, IndexedDB and JSON import/export;
  unknown future formats are rejected. About 6.6 MB per full 745-game season.
  Full play logs remain temporary; permanent boxes/drives are never pruned.
- Validation: 52 engine checks, 16 Node groups, 59 desktop/mobile-layout browser
  checks and six browser persistence scenarios. Actual iPhone Safari untested.

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

## v0.8.1 — archive persistence continuation (unreleased)

- Browser saves separate archived careers from the main dynasty record, loading
  history only when required. Existing careers are written once; later saves
  append new departures. Every career and portable JSON export is retained.
- Save and archive writes commit atomically; stale loaded tabs cannot overwrite
  newer saves. Blocked upgrades, failed writes and missing archive chunks are
  reported instead of silently losing data. Invalid imports preserve the open game.
- IndexedDB schema advances to 2; game version remains 0.8.1. See `STORAGE.md`
  for migration and rollback details. No production deployment is included.
- Recruiting audits now use final per-team signee counts recorded before pool
  rollover. The previous origin-string count included veteran roster players.
- The harness now tests actual `packUniverse()` sparse serialization. Added
  storage failure tests, engine persistence integration, and a real-browser
  save/load/history/export/import test. Storage tests are part of `npm test`.
- The generated standalone includes `storage.js`; new universes carry the
  current app version instead of the stale 0.8 value.

## v0.8.1 — review pass

Behaviour-preserving where possible; every change below is either a defect fix,
a measured performance win, or a bounded simulation correction. v0.7 and v0.8
saves continue to load through `normalizeUniverse()`.

### Fixed

- **Rushing yardage inflation.** Role shares were not merged, so a back who was
  both `RB1` and `3DRB` — true on 112 of 120 teams — was credited each role's
  yards separately. League rushing leaders were ~5,500 yards; they are now
  ~1,600. Shares are now merged and capped so no player can exceed a plausible
  single-player workload.
- **Scouting-confidence precedence.** `p.stats?.games || 0 > 6` parses as
  `games || (0 > 6)`, so the experienced-player bonus applied to anyone who had
  ever taken a snap.
- **Run-first quarterback carries.** `scheme.qb.includes('Run-First')` compared
  against whole style names (`'Run-First Weapon'`) and was never true.
- **Schedule desync after a JSON save round-trip.** The league schedule and each
  team's schedule shared objects in memory but became independent copies through
  JSON. Results recorded on one were invisible to the other. They are relinked
  on load.
- **Specialists recorded nothing.** Kickers and punters accrued wear and
  injuries but never a statistic. Field goals, attempts, punts and punt yards
  are now tracked.
- **Duplicated offensive-line snaps** when an injury pushed one lineman into two
  spots.
- **Contradictory ranking display.** The dashboard read "Unranked" while the
  command centre beside it reported the team's exact ranking.
- **Upside range could sit below the current range**, which reads as a defect
  rather than as uncertainty.
- **Stale version strings.** Export wrote `version: '0.7'`; the header and the
  ready message disagreed with the title.

### Simulation

- **Rotation.** Backups now take real snaps: second-string running backs,
  receivers, defensive line and secondary, plus the backup quarterback in
  blowouts. Players recording an appearance rose from 23% of all rosters to
  ~40%, so depth and four-year careers can produce a statistical record.
- **Development produces visible careers.** The hidden growth curves added in
  v0.8 were statistically invisible: growth was ~0.8 raw points per phase
  against noise of standard deviation ~1.4, then rounded to an integer, so the
  signal was destroyed. Over a full career, late bloomers averaged +4.1 and
  early bloomers +4.9 — a difference of less than one rating point. The
  fractional remainder now carries between phases instead of being rounded
  away, the base magnitude is scaled to the headroom players actually have, and
  prospects with high development grades carry more of it.

  | Four-year arc (n=3,124) | v0.8 | v0.8.1 |
  | --- | --- | --- |
  | Median growth | +4 | +9 |
  | 95th percentile | +10 | +18 |
  | Breakouts (+15 or more) | 0% | 15% |
  | Busts (+2 or less) | 32% | 11% |
  | Share of upside realised | 35% | 57% |
  | Spread across hidden profiles | 2.2–4.9 | 4.4–10.3 |

  As a side effect the title race gains texture: a twelve-season run produced
  twelve different champions before, and eight after, with the strongest
  programs repeating.

- **Recruit star ratings mean something.** The generic `stars()` thresholds
  were applied to a recruit pool centred at 58, so the median recruit sat
  exactly on the one-star/two-star boundary: 49% of every class was one star and
  the entire country produced seven five-stars. There was nothing to fight over.
  Recruit bands are now calibrated against the generator's own distribution.

  | Recruit pool (n=2,800) | v0.8 | v0.8.1 |
  | --- | --- | --- |
  | 5-star | 7 | 27 |
  | 4-star | 58 | 320 |
  | 3-star | 390 | 1,342 |
  | 2-star | 975 | 895 |
  | 1-star | 1,370 | 216 |

  Blue-chip signings now stratify the way the design intends: the top twenty
  programs by prestige sign 4.3 four- and five-stars per class against 0.1 for
  the bottom twenty, where before it was 0.6 against 0.0.

- **Prestige no longer deflates.** Expected wins were anchored at prestige 50
  while the league averages 66, so a typical program lost prestige every year
  and the universe drifted down ~0.4 prestige per season indefinitely. The
  baseline is now the league's own centre; mean prestige is flat across a
  twelve-season run and the spread between elite and weak programs survives.

### Performance

Measured in Chromium at iPhone viewport, first season, median of three runs:

| Action | v0.8 | v0.8.1 |
| --- | --- | --- |
| Sim one week | 734 ms | 306 ms |
| Sim rest of season | 6,384 ms | 2,066 ms |
| Twelve-season save | 162 MB | 74 MB |
| Save growth per season | 11.7 MB | 4.3 MB |

- `ranked()` and `confStand()` called `rankingScore()` — which profiles an
  entire roster — from inside a sort comparator, evaluating it about thirteen
  times per team per sort. Score once, then sort.
- `gameSim` recomputed both team profiles inside `recordGame`.
- `render()` rebuilt the innerHTML of all thirteen tabs on every call; it now
  renders the visible tab plus the shared chrome.
- Recruiting shuffled all 120 teams with `sort(() => Math.random() - .5)` for
  every recruit every week, and re-derived positional need each time.
- `makeRoleDepth()` re-rated every player on every comparison, across
  twenty-four roles per team.
- `recruitDistance()` recomputed a great-circle distance between fixed
  coordinates for every team a recruit considered, every week, twice.
- Archive rows were full player clones. They now keep only the fields the
  archive and records screens read, and stat blocks serialize sparsely.

### Interface

- The roster table stacks into per-player cards below 700px. Six of eleven
  columns were previously off-screen behind a horizontal scroll on a phone.
- The tab strip fades at its right edge so the off-screen tabs are discoverable.

### Infrastructure

- `index.html` is generated from `app.js`, `styles.css` and `body.html` by
  `tools/build.js`, reproducing the shipped v0.8 file byte for byte.
- `tools/harness.js` runs the engine headless in Node behind a DOM shim.
- `tests/smoke.js` — 46 engine checks. `tests/browser.js` — 43 Chromium checks
  across desktop and iPhone viewports. Both pass.

### Follow-through on the review's own work list

Everything below is additive to v0.8.1; `APP_VERSION` is unchanged and no
existing save needs anything beyond the migration path `normalizeUniverse()`
already provides.

- **Mobile cards extended to Recruiting and Development.** Same treatment
  the roster table got in the review pass: `stacked-table` + `data-label`
  per cell. The Stats tab needed nothing — its leaderboards were already
  stacked `div` rows, not a `<table>`.
- **The Weekly Command Center is clickable.** Every hub item that names a
  screen (a result, a ranking move, an injury, a commitment, the next
  opponent, a transfer-risk flag, a hot target) now jumps to that tab and,
  where relevant, opens the player or recruit dialog, through a new
  `goToTab()` helper. Older saves' stored hub items simply have no
  destination and render as plain cards.
- **Decommits and flips.** The single largest gap the review named:
  `r.committed` was permanent. Committed recruits are now re-pressured every
  week against the field; a sustained pitch advantage from a challenger
  gives a small, tuned weekly chance of a flip. Measured at 4–5% of
  in-season commits per cycle (`npm run audit`) — a story beat, not churn.
  The user's attention (target/relationship/visits/promise) both defends a
  commit and wins a flip; the AI never flips a recruit to the user
  unprompted. New `universe.decommitLog` (capped at 80) and
  `universe.recruitCycle` back the hub alerts and the audit line.
- **`T()` and `findPlayer()` are now Map-indexed** instead of scanning the
  team list / every roster / the archive on every call, as the review's
  performance section recommended. Self-validating rather than
  instrumented at every mutation site: a hit is checked against the
  universe's current shape, and a miss triggers exactly one rebuild.
  Measured: `findPlayer` on a live player, 2000 lookups, 218ms → 5ms; on an
  archived player, 500 lookups, 121ms → 2ms; `T()`, 20000 lookups,
  19ms → 1ms.

Not attempted: moving `playerArchive` into its own IndexedDB store. It is
the highest-value remaining item from the review's save section but the
riskiest, since it touches save/export/import directly — see
`DYNASTY_LAB_GPT_HANDOFF.md` for what it needs.
