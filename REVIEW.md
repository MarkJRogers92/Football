# Dynasty Lab v0.8 — review

Requested in `DYNASTY_LAB_V08_CLAUDE_HANDOFF.md`. Everything below is measured
against the engine, not inferred from reading it: `tools/harness.js` loads
`app.js` in Node behind a DOM shim, and `tools/audit.js`, `tools/longrun.js`,
`tools/diag*.js` produce the numbers quoted. Every figure is reproducible with
`npm run audit` / `npm run longrun`.

Work landed on `claude/review-improvement-dwjemy` as v0.8.1. The v0.8 build is
untouched at commit `c513162` and nothing has been deployed.

---

## Verdict first

The design is sound and the foundations are better than the handoff gives them
credit for. Prestige genuinely predicts success (top-20 programs average 8.6
wins, bottom-20 average 4.0), the scheme/role/fit architecture is real rather
than decorative, and there is no runaway feedback loop of the kind you were
worried about.

What I did find is that **three of the systems you consider finished were not
actually doing anything measurable**, and one long-term risk is far more
dangerous than the loader problem the handoff leads with:

1. The hidden development curves — the headline feature of v0.8 — moved late
   bloomers +4.1 rating points over a full career and early bloomers +4.9. The
   profiles were statistically indistinguishable. No player in 3,124 tracked
   careers ever grew 15 points.
2. Half of every recruiting class was a one-star and the entire country produced
   seven five-stars a year, so there was nothing to recruit against.
3. 78% of every roster never recorded a single statistic, ever, because only
   role starters accumulated production — while backups still accrued wear and
   injuries.
4. Saves grew **11.7 MB per season, without bound**. A twelve-season dynasty was
   a 162 MB save. That is the thing that will kill an iPhone save, not gzip.

All four are fixed and measured. Details below.

---

## 1. Top 10 bugs and risks

Ordered by severity. Status is what I did about it on the branch.

| # | Issue | Evidence | Status |
|---|---|---|---|
| 1 | **Unbounded save growth.** `addToArchive` stored a full player clone (~1.6 KB) for every departing player, ~3,000 per season. | 12-season save: **162 MB**. Growth 11.7 MB/season, linear forever. | **Mitigated** — slim archive rows + sparse stat serialization. 162 MB → 74 MB, growth → 4.3 MB/season. Still linear; see §4. |
| 2 | **Rushing yards double-counted.** Role shares were not merged, so a back listed at both `RB1` and `3DRB` was credited each role's split separately. | **112 of 120 teams** had such an overlap; average 1.63 unique players across 3 rushing roles. League rushing leader: **5,586 yards**. | **Fixed** — shares merged and capped. Leader now 1,582. |
| 3 | **Development curves inert.** Growth was ~0.8 raw points per phase against noise of σ≈1.4, then `Math.round`ed, destroying the signal. | Career growth by hidden profile: late 4.1, steady 4.5, volatile 4.7, physical 4.8, early 4.9. Breakouts (+15): **0%**. | **Fixed** — fractional carry between phases + magnitude scaled to real headroom. |
| 4 | **Recruit stars carried no information.** Generic `stars()` thresholds applied to a pool centred at 58 put the median recruit on the 1-star boundary. | Pool: 1,370 one-stars (49%), **7 five-stars nationally**. Elite programs signed 0.6 blue-chips per class. | **Fixed** — bands calibrated to the generator's percentiles. |
| 5 | **No depth in the box score.** Only role starters accumulated stats; backups accrued wear and injuries but never a snap. | **23% of all players** had ≥1 game. Exactly 120 quarterbacks — one per team — attempted more than 100 passes. | **Fixed** — rotation for RB/WR/TE, DL, LB, DB, and the backup QB in blowouts. Now ~40%. |
| 6 | **Universe-wide prestige deflation.** Expected wins were anchored at prestige 50 while the league averages 66, so a typical program lost prestige every year. | Mean prestige 65.8 → 60.9 over 12 seasons, monotonic; spread compressing 16.7 → 15.7. Extrapolates to ~45 by season 50. | **Fixed** — anchored on the league's own centre. Flat at 66.4 across 12 seasons. |
| 7 | **A JSON save round-trip splits the schedule.** `universe.schedule` and `team.schedule` share objects in memory; JSON turns them into independent copies. | After Export → Import, results written via the league schedule never reach team schedules. The Season tab and the weekly hub silently disagree forever. | **Fixed** — relinked in `normalizeUniverse()`; covered by a test. |
| 8 | **`ranked()` was quadratic in roster size.** `rankingScore()` profiles an entire roster and was called from inside a sort comparator. | One `ranked()` call: **124 ms**. It is called 24+ times per season. | **Fixed** — score once, then sort. 124 ms → 12 ms. |
| 9 | **`render()` rebuilt all thirteen tabs on every call**, twelve of them hidden, after every simulated week. | Sim-a-week in Chromium: 734 ms, most of it innerHTML for invisible DOM. | **Fixed** — renders the visible tab plus shared chrome. |
| 10 | **Operator-precedence bug in scouting.** `p.stats?.games \|\| 0 > 6` parses as `games \|\| (0 > 6)`. | Every player who had ever taken a snap received the "experienced" scouting-confidence bonus. | **Fixed** |

**Also fixed, lower severity:** `scheme.qb.includes('Run-First')` compared
against whole style names (`'Run-First Weapon'`) and was never true, so run-first
schemes never gave their quarterback carries; kickers and punters recorded no
statistics at all despite field goals being simulated; offensive-line snaps were
double-counted when injury pushed one lineman into two spots; the dashboard read
"Unranked" while the panel beside it showed the same team's exact rank; the
projected upside range could render *below* the current range; export wrote
`version: '0.7'` and the header disagreed with the title.

### Risks I did *not* change

- **Commitments are permanent.** Nothing anywhere clears `r.committed`, and
  `advanceRecruiting` early-returns on it. There are no decommits and no flips.
  Your handoff lists these as future additions, so this is a known gap, but it
  means the recruiting cycle has no second act.
- **Every recruit signs somewhere.** `finalizeRecruiting` force-assigns the
  remainder until every team hits the 30-man cap; capacity (3,600) exceeds
  supply (2,800), so **zero recruits go unsigned**. There is no scarcity, and a
  program can never miss on a class.
- **Coach contracts are decorative.** `contractYears` is decremented every year
  and never read by any decision. `salary` is generated and never used.
- **A conference with an odd number of teams silently plays no conference
  games** (`if(arr.length%2)return`). Harmless today; a landmine for v0.12
  realignment.
- **Conference schedules are unbalanced.** Each team plays 8 of its 11
  conference opponents, and standings sort on conference wins with no
  head-to-head or common-opponent tiebreaker.
- **`team.w` conflates regular-season, conference-title and playoff wins**,
  which makes "wins" ambiguous in prestige, awards and recruiting formulas.

---

## 2. Top 10 simulation improvements

Numbers 1–5 are implemented on the branch; 6–10 are recommendations.

1. **Rotation** *(done)* — backups take real snaps, so depth matters and a
   four-year career leaves a statistical trace. Player participation 23% → 40%.
2. **Development that produces careers** *(done)* — median four-year growth +4 →
   +9, 95th percentile +10 → +18, breakouts 0% → 15%, busts 32% → 11%, share of
   upside realised 35% → 57%, and the hidden profiles now span 4.4–10.3 instead
   of 2.2–4.9. A side effect worth noting: champions repeat now. Twelve seasons
   produced twelve different champions before and eight after.
3. **Recruiting stratification** *(done)* — top-20 programs sign 4.3 blue-chips
   per class against 0.1 for the bottom 20, where it was 0.6 against 0.0.
4. **Prestige stability** *(done)* — no drift over 12 seasons, spread preserved.
5. **Specialists exist** *(done)* — kickers and punters have stat lines.
6. **Make signing day cost something.** Cap classes by scholarship space
   (85 total, ~25 signings) rather than a flat 30, and let recruits go unsigned.
   Scarcity is what turns a board into a decision.
7. **Add decommits and flips.** Commitment should be a state with pressure on
   it, not a terminal one. This is the single largest missing recruiting beat.
8. **Give the play-by-play engine the rotation the box score now has.**
   `detailedGame` still names `starter(off,'QB'/'RB'/'WR')` in every log line,
   so the drive log reads as three players playing the whole game.
9. **Separate regular-season from postseason records** so prestige, awards and
   recruiting stop reading a 17-win playoff run as league form.
10. **Injuries should discriminate.** Risk is `.006 + wear/4200 +
    (100-durability)/9000` — a 20-durability player is barely more fragile than
    a 99. Roughly 8% of players are hurt in a season, which is plausible in
    aggregate but carries almost no signal about *who*.

---

## 3. Top 10 UI/UX improvements

Implemented on the branch: mobile roster cards, the rank contradiction, the
upside-range floor, the tab-strip fade, and the render-cost fix that makes the
whole interface feel responsive.

1. **The roster table was unusable on a phone** *(done)* — eleven columns at
   `min-width:820px` showed five on a 390px screen, with every rating hidden
   behind a horizontal scroll. Rows now stack into cards below 700px. The same
   treatment should be extended to the recruiting, stats and development tables,
   which have the identical problem.
2. **Thirteen tabs is too many.** They overflow the bar on desktop at 1400px —
   "History" is entirely off-screen. Group them: *Program* (Roster, Roles,
   Staff, Program Lab), *Season* (Dashboard, Season, Game Lab, Stats),
   *Future* (Recruiting, Development, Offseason), *Records* (Awards, History).
3. **The dashboard contradicted itself** *(done)* — "Unranked" beside "Up to
   #27".
4. **The mobile header consumes 470px** — half the first screen — before any
   content. Save/Load/Export/Import/New Universe should collapse behind one
   menu on small screens.
5. **The Weekly Command Center is not yet the command center.** It reports what
   happened but never links to the decision. Every hub item should be a button
   that lands on the relevant tab with the relevant row selected.
6. **Nothing explains *why*.** `recruitPitchBreakdown()` already computes a full
   itemised reason a recruit leans one way — it is one of the best things in the
   codebase — and the same idea should back a "why did we lose" panel on game
   results and a "why did he develop" panel on camp reports.
7. **No sorting, no search, no filtering** on any table except a single position
   dropdown on the roster. With 100-man rosters and a 2,800-recruit board this
   is the largest day-to-day friction in the app.
8. **Team names are not clickable.** Player names are, and it works well; the
   Top 15, schedule, standings and results should all open a program.
9. **The "Sim Regular Season" button is destructive and unguarded.** It skips
   twelve weeks of decisions with no confirmation and no way back.
10. **Terminology drifts.** "Current Read"/"Current"/"perceived",
    "Upside"/"Potential Read"/"perceivedUpside", "Role"/"Package"/"Slot" all name
    the same concepts in different places.

---

## 4. Performance

Chromium at iPhone viewport, first season, median of three runs:

| | v0.8 | v0.8.1 |
|---|---|---|
| Sim one week | 734 ms | 306 ms |
| Sim rest of season | 6,384 ms | 2,066 ms |
| `initUniverse()` | 850 ms | 475 ms |
| `ranked()` | 124 ms | 12 ms |

A real iPhone is roughly 3–5× slower than this container, so "Sim Regular
Season" was a 20–30 second freeze and is now closer to 7.

Every fix was the same anti-pattern: an expensive function called from inside a
sort comparator, or a static value recomputed in a hot loop. `rankingScore` →
`profiles` → whole roster, inside `ranked()`'s comparator. `roleFit` inside
`makeRoleDepth`'s comparator, twenty-four roles per team. `recruitDistance`
recomputing a great-circle distance between fixed coordinates for every
team–recruit pair every week, twice. `sort(() => Math.random() - .5)` over all
120 teams per recruit per week — which is also a biased shuffle.

**What remains** (self-time in a profiled season, after the fixes): `roleFit`
10.4%, `recruitPitch` 9.4%, `haversineMiles` 6.6%, `rolePlayers` 6.1%,
`ensureRoleDepth` 4.1%. The next win is `ensureRoleDepth`, which rebuilds a
validity `Set` per role on every `roleStarter()` call — and `applyGameStats`
calls `roleStarter` about forty times per team per game. Invalidate role depth
on roster change instead of revalidating on read.

**The structural recommendation from the handoff still stands and I did not do
it:** there are no indexes. `T(name)` is a linear scan of 120 teams,
`findPlayer(id)` scans every roster and then the whole archive, and both are
called from render paths. A `Map` by team name and a `Map` by player id, rebuilt
in `normalizeUniverse()`, is a contained change with a large payoff — but it
touches enough call sites that it deserves its own pass.

---

## 5. Save and migration

**Good news the handoff understates:** saves use IndexedDB, not `localStorage`,
so there is no 5 MB quota wall, and `normalizeUniverse()` is a genuinely
well-built migration function that defaults missing fields rather than rejecting
old saves. v0.7 and v0.8 saves load into v0.8.1 unchanged.

**The real risk was size.** 20 MB at season 1 with an empty archive, growing
11.7 MB per season without bound — 162 MB by season 12, and on the trajectory
you asked about (30–50 seasons) 350–600 MB. `JSON.stringify` on a structure that
size will exhaust a mobile tab long before IndexedDB objects. Export/import was
already impossible on a phone at season 10.

Fixed: archive rows keep only the fields the archive and records screens read;
stat blocks (29 keys, almost all zero) serialize sparsely and rehydrate through
the existing `normalizeUniverse()` path. 162 MB → 74 MB, growth 11.7 → 4.3
MB/season.

**Still linear.** Roughly 3,000 players enter the archive every season and none
ever leave. Before long dynasties are viable you need one of: prune archived
players to a career summary after N seasons; keep only players who recorded a
statistic, an award or a draft selection; or move the archive to its own
IndexedDB store loaded on demand rather than living inside the save blob. The
third is the right answer and is a natural companion to the v0.10 Encyclopedia.

**One migration hazard I fixed:** the schedule object-identity split described
in §1.7. Any save exported from v0.8 and re-imported has already silently
desynced its team schedules; v0.8.1 repairs this on load.

---

## 6. Safari and mobile

I could not test iOS Safari — this environment has Chromium only, so the
"Failed to Decode Data" report needs confirmation on your device. What I can
tell you:

- **The gzip loader is the wrong thing to be worried about.** It is a
  self-inflicted problem created by shipping a compressed blob to work around
  connector truncation. `tools/build.js` now generates the standalone HTML from
  `app.js` + `styles.css` + `body.html`, reproducing the shipped v0.8 file byte
  for byte. Deploy those three files as a normal static site through Git and the
  entire chunked-payload, pako-fallback, blob-loader apparatus disappears —
  along with the Safari decode failure, because there is nothing to decode.
  This is the single highest-value item in the whole review and it is now one
  command away.
- **The 162 MB save was a much bigger iOS threat than the loader**, and is
  halved.
- `tests/browser.js` runs 43 checks at both 1280×900 and 390×844 (iPhone 14
  viewport): every tab renders, the player dialog opens, there are no console
  errors, and the page does not scroll horizontally.
- **`<dialog>.showModal()` is guarded** with a `setAttribute('open')` fallback,
  which is correct for older iOS.
- Nothing in the codebase uses syntax newer than optional chaining, `??=` and
  `Array.at()`; the newest of those is `Array.at()`, which needs Safari 15.4
  (March 2022). No `structuredClone`, no `toSorted`/`findLast`/`Object.groupBy`. `crypto.randomUUID` requires a secure context
  and there is already a fallback.

---

## 7. Specific code changes made

All on `claude/review-improvement-dwjemy`, each commit independently revertable. `CHANGELOG.md` carries the full list; the material ones:

| Area | Change |
|---|---|
| `applyGameStats` | New `mergeShares(parts, cap)` merges duplicate role assignments and caps any one player's share. Rushing, receiving, defensive and OL groups all routed through it. |
| `applyGameStats` | Rotation: `rotationAt(t,pos,n)` supplies second- and third-string players to every share group; backup QB gets 20–32% in a blowout; kicker and punter statistics recorded; every rotation player gets an appearance. |
| `applyDevelopmentPhase` | `p.devFraction` carries the sub-point remainder between phases; base magnitude divisor `/20` → `/9`; delta clamps widened. |
| `generatePlayer` | Upside band `rng(.28,.72)` → `rng(.34,.92)`. |
| `generateRecruitPool` | New `recruitStars()` with bands calibrated to the generator's percentiles. `stars()` untouched for other callers. |
| `runOffseason` | Prestige target anchored on league mean wins and mean prestige rather than the constants 6 and 50. |
| `ranked`, `confStand`, `seedField`, `makeRoleDepth` | Score once per item, then sort. |
| `recordGame` | Accepts precomputed profiles from the caller. |
| `recruitDistance` | Memoised. `advanceRecruiting`/`finalizeRecruiting` use an O(n) `sample()` instead of a biased full sort. |
| `unitCached` | Memoises positional need for the duration of a recruiting pass. |
| `render` | `TAB_RENDERERS` map; renders the visible tab plus shared chrome. |
| `addToArchive` | `archiveRecord()` builds a slim row from an explicit field list. |
| `packUniverse` / `packStats` | Sparse stat serialization on export and browser save. |
| `normalizeUniverse` | Relinks team schedules to league schedule objects; rehydrates archive stats. |
| `scoutRange` | Upside range floored at the current range's floor. |

New files: `tools/build.js`, `tools/harness.js`, `tools/audit.js`,
`tools/longrun.js`, `tools/diag*.js`, `tests/smoke.js` (46 checks),
`tests/browser.js` (43 checks), `CHANGELOG.md`, `package.json`.
`index.html` is now generated; `app.js`, `styles.css` and `body.html` are the
sources.

---

## 8. Proposed v0.9 — coaching overhaul

Your v0.9 plan is right, and the branch has made it safer to attempt. One
sequencing change: **build the coaching market on top of a coach identity that
persists, and do that first**, because today a fired coach is destroyed and
replaced by `generateCoach()` with no memory. Coaching trees and career
histories are impossible until coaches outlive their jobs.

**9.0 — Coach persistence (prerequisite, ~small).** Give coaches a stable `id`,
move them into a `universe.coaches` pool, and have teams reference them by id.
`carousel()` moves coaches between pool and job instead of constructing new
ones. Record `{school, role, years, record, championships}` per stint. Nothing
user-visible ships; everything downstream becomes possible.

**9.1 — The market.** Openings generate candidate lists drawn from the existing
pool (coordinators, small-school HCs, position coaches) plus a thin stream of
new entrants. Candidate fields as your handoff lists them.

**9.2 — Negotiation.** Salary, years, title, play-calling control. Rival
programs bid. This is where `contractYears` and `salary` — currently decorative
— become load-bearing, which is a good reason to build it before v0.11
finances rather than after.

**9.3 — Careers and trees.** With 9.0 in place, the tree is a query over stint
history, not new state.

**9.4 — Staff chemistry and coach–player relationships.** Do this last: it
touches development and transfer risk, the two systems whose calibration I have
just changed, and it should be tuned against a stable baseline.

**Hold `career mode` for v0.9.5 or later.** It is a second game mode, not a
feature of this one, and it will double the surface area of every screen.

---

## 9. What to do *before* the coaching overhaul

In priority order.

1. **Ship the static-file deployment.** `npm run build` already reproduces your
   standalone byte for byte. Deploy `app.js`/`styles.css`/`body.html` normally
   and delete the chunked-gzip loader. This removes your Safari failure mode,
   your truncation workaround, and your riskiest deployment path in one step.
2. **Confirm v0.8.1 on your iPhone** before it replaces production.
3. **Bound the archive.** It is the only remaining unbounded growth in the save
   and it will decide whether 30-season dynasties are possible. It is also
   cheaper to do now than after v0.10 builds an Encyclopedia on top of it.
4. **Add the ID indexes** (`T()`, `findPlayer()`). Coaching adds another entity
   type that will want the same treatment; establish the pattern first.
5. **Decommits, flips and scholarship-limited classes.** Recruiting is a core
   pillar and is currently missing its second act. It is also independent of
   coaching, so it parallelises.
6. **Extend the mobile card treatment** to the recruiting, stats and development
   tables.
7. **Run `npm test` before every deploy.** 46 engine checks and 43 browser
   checks now exist; they caught three regressions while I was working.

---

## 10. What I would *not* change yet

- **The game simulation model.** `gameSim` produces believable scores, and
  prestige predicts wins (8.6 vs 4.0). Do not touch it until the deeper snap
  engine in v0.14.
- **The playoff format.** 16 teams with 10 auto-bids is producing eight
  different champions in twelve seasons with the strongest programs repeating —
  that is good dynasty texture. Resist adding variance knobs.
- **The scheme and role architecture.** `ROLE_DEFS` with per-role attribute
  weights is the best-designed part of the codebase. Extend it; do not
  restructure it.
- **The uncertainty presentation.** Scout ranges with confidence meters do
  exactly what the design document asks. Do not replace them with a number.
- **Division II.** Your own guardrail is right: D-I is not deep enough yet.
- **A rewrite into a framework or a component library.** `app.js` is 146 KB in
  333 lines — density, not length, is what makes it hard to work in — and it
  works. The build split plus a test suite gives you most of
  the maintainability benefit at a fraction of the risk. Revisit only if
  v0.9–v0.11 make the single file genuinely unworkable.
- **Compressed saves.** Fix what is *in* the save first. Compressing a 162 MB
  structure is treating the symptom, and it reintroduces exactly the decode
  fragility you already got burned by on Safari.

---

## Handoff notes for GPT

Material behaviour changes in v0.8.1 that affect anything built on top of it:

- **Stat distributions moved.** Rushing leaders 5,586 → ~1,600. Player
  participation 23% → 40%. Kickers and punters now have stat lines
  (`fgMade`, `fgAtt`, `punts`, `puntYds` added to `newStats()`).
- **Development is roughly 2× stronger** and now carries a fractional remainder
  in `p.devFraction`. Equilibrium league talent settled at 64.6 (was 62.5).
  Any tuning done against v0.8 growth rates is stale.
- **`recruitStars()` is a new function** used only by `generateRecruitPool`.
  `stars()` is unchanged. Recruit `stars` values are not comparable across
  versions.
- **Prestige no longer drifts.** Anything that assumed a slowly deflating
  universe is wrong.
- **Saves are written with sparse stat blocks** and rehydrated by
  `normalizeUniverse()`. Anything reading a raw save file must not assume all 33
  stat keys are present.
- **Archive rows are slim.** `ARCHIVE_FIELDS` is the explicit allowlist — add to
  it if the archive UI starts reading a new field, or it will be `undefined`.
- **`index.html` is generated.** Edit `app.js`, `styles.css` or `body.html` and
  run `npm run build`. Hand-edits to `index.html` will be overwritten.
- **`render()` no longer renders every tab.** A new tab must be registered in
  `TAB_RENDERERS` or it will never update.
