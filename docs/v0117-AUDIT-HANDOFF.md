# Dynasty Lab — measured audit and recommendations

Written against source `239ad93` (`VERSION.txt` = 0.11.6) with production
`gh-pages` at `7f02634` (v0.11.7). Every number below was produced by running
the engine in this repo, not inferred from reading it. Reproduction commands
are in the appendix; nothing here changes simulation, saves or production.

This file is a findings handoff, not a roadmap packet. It does not authorize
publishing, merging or changing production.

---

## Verdict

The engine is healthier than the document trail suggests. Prestige is stable,
schedules are valid, injuries and roster sizes sit in believable ranges, the
committed build matches source, and the unusual build architecture — 36
extension files textually injected into `app.js`'s closure — has **zero
top-level name collisions** across 598 `app.js` functions.

Three things are wrong, and they are not the things the roadmap is pointed at.

1. **Production is ahead of source again.** v0.11.7 is live; no branch has it.
2. **The league converges to parity.** Twelve seasons produced twelve different
   champions and prestige spread fell 17%. A dynasty simulator currently does
   not permit dynasties.
3. **The transfer portal does not run.** An entire shipped packet is gated
   behind a number that averages 2 out of 100.

Recommended order: 1, then 3, then 2. Reasons in each section.

---

## 1. Production is ahead of source (v0.11.7 exists only on `gh-pages`)

`gh-pages` serves **v0.11.7**. `VERSION.txt` was read on all 116 remote
branches; the highest is **0.11.6**. The live bundle is 1,193,482 bytes against
1,188,210 for a fresh `npm run build`, and the difference is real source, not a
rebuild artifact.

Diffing each source file against the live bundle by exact substring match — the
method `CONTINUATION.md` already documents — six files diverge:

```
app.js
body.html
game-engine-v2-postseason.js
game-engine-v2-record-state.js
game-engine-v2-record-run.js
game-engine-v2-gameday-record.js
```

Production contains ID-based postseason resolution that exists nowhere in the
repository:

```js
function teamById(id,u=universe){...}
function conferenceChampionIdsFor(u=universe){...}
function normalizeConferenceChampions(){...}
function conferenceChampionTeams(){...}
function playoffFieldIdsFor(u=universe){...}
```

That reads as a rename-safety fix: champions and playoff fields resolved by
stable ID rather than by name. It is exactly the class of change that must not
be lost, and exactly the class the v0.12 encyclopedia packet depends on
("record holders link even after transfers, retirement or program rename").

**This is the third recurrence.** `CONTINUATION.md` documents it at v0.9.29-32
("shipped from a parallel GPT/codex session directly to `gh-pages` with no
source ever pushed to any branch or PR") and again at v0.9.36. Both times the
remedy was hand-extraction and a written warning. The lesson never became a
mechanism, so it did not hold.

**Do:**
- Reconcile 0.11.7 now, while the delta is ~5 KB. `tools/build.js` is a plain
  concatenation, so extract each changed file out of the live bundle using
  byte-identical unchanged neighbours as anchors, then verify the rebuild is
  byte-identical to what is live. `polish.css` is still the last CSS file
  before `</style>` and still cannot be verified by prefix matching.
- Then make it structural: have `tools/publish.js` refuse to publish unless the
  commit being built is reachable from a pushed remote branch. Roughly ten
  lines, and it ends a failure mode that has now cost three reconciliations.

---

## 2. The league converges to parity — there are no dynasties

Twelve-season `longrun` (seed 7):

| season | prestige mean | prestige sd | trueNow mean | save MB |
| --- | --- | --- | --- | --- |
| 2027 | 66.5 | 16.8 | 66.4 | 36.1 |
| 2029 | 66.5 | 16.8 | 64.5 | 61.1 |
| 2031 | 66.5 | 16.4 | 64.4 | 76.5 |
| 2033 | 66.5 | 15.6 | 64.4 | 92.5 |
| 2035 | 66.5 | 15.1 | 65.0 | 108.7 |
| 2038 | 66.5 | **13.9** | 65.0 | 133.1 |

The mean is pinned at 66.5 — the v0.8 deflation fix is holding perfectly. But
the **spread falls monotonically from 16.8 to 13.9, about -0.3 per season**,
with no sign of a floor. Extrapolated to a 30-season dynasty the sd is near 8,
i.e. a league with no blue-bloods and no bottom-feeders.

The championship record over those same twelve seasons:

```
Bay Area · Utah Commonwealth · Louisiana Commonwealth · Cascade ·
Chicago Metropolitan · Knoxville Tech · Georgia Coastal ·
Tennessee Commonwealth · Georgia Commonwealth · Texas Republic ·
New York Metropolitan · Detroit Metropolitan
```

**Twelve champions in twelve seasons. No program repeats.** Real college
football over any twelve-year window produces two or three repeat champions and
one genuine dynasty. This is the mirror image of the v0.8 bug: that one was mean
deflation, this one is variance deflation, and it is harder to see because every
individual season looks plausible.

This matters more than it looks. Rivalries, the hot seat, program history, the
coaching tree and the planned encyclopedia all assume some programs stay great
and others stay bad. If prestige regresses to the mean, all of that history
becomes noise — the encyclopedia would be indexing a league where nothing
compounds.

**Do:** treat this as a measurement task before a tuning task, the way
`SAVE_SIZE_MEASUREMENT.md` was handled. Instrument where prestige moves each
season (wins vs expectation, titles, recruiting, the carousel) and find which
term is mean-reverting harder than the others. Do not guess a constant; the v0.8
review's central lesson was that three "finished" systems were measurably inert
and only measurement found it.

---

## 3. The transfer portal is effectively inert

v0.9.47 shipped portal rounds, targets, logs, destination fitting and a full UI.
The gate that decides who enters is one line, `app.js:2293`:

```js
if(gameplayRandom()<risk/360) portal.push(ensurePortalEntry({...}))
```

`transferRisk` (`app.js:2704`) leads with `(58-p.morale)`. Measured across
~10,700 players per season:

| season | morale mean | morale > 58 | mean transferRisk | risk ≥ 30 |
| --- | --- | --- | --- | --- |
| 2027 | 73.6 | 87% | **2.0** | 0.3% |
| 2030 | 76.1 | 90% | **2.6** | 0.5% |
| 2033 | 75.7 | 89% | **3.0** | 0.7% |
| 2036 | 75.7 | 89% | **2.9** | 0.6% |

The leading term is negative for roughly nine players in ten, so the risk score
sits near the bottom of its 0-100 range and `risk/360` becomes a sub-1% annual
chance. The audit confirms the outcome directly:

```
transfers=42 perTeam=0.3 causes={"BROKEN_PROMISE":0,"PLAYING_TIME":39,"FRESH_START":3}
transfers=59 perTeam=0.5 causes={"BROKEN_PROMISE":0,"PLAYING_TIME":46,"FRESH_START":13}
```

**`BROKEN_PROMISE` fires zero times in every season measured**, so the promise
system — which the portal was partly built to give consequences to — never
reaches the portal at all.

The same pattern appears in recruiting: **8 decommits out of 1,545 in-season
commits (0.5%)**, so the v0.9.24 live signing day and the v0.9.55 recruiting
battles have almost nothing to dramatize.

**Do:** recentre the pivot. The `58` in `(58-p.morale)` was presumably chosen
against an expected morale distribution that the game no longer produces; the
actual median is ~75. Moving the pivot near the real median, or rescaling the
`/360` divisor, changes one expression and activates surfaces that are already
built and already tested. This is the highest gameplay-per-line-changed change
available in the codebase right now, which is why it is ranked above the harder
parity work in section 2.

Guard rail: `tests/transfers.js` and `tests/portal-recruiting.js` exist; add an
assertion that pins league-wide portal volume into a defensible band so this
cannot silently drift inert again.

---

## 4. Save size: the target is met, the baseline is the problem

Twelve-season growth is **+8.8 MB/season** (36.1 → 133.1 MB), so v0.9.49's
"no more than 10 MB growth per season over twelve seasons" target is genuinely
met. But the **first season alone is 36.1 MB**, and season twelve is 133 MB in a
browser. Compaction flattened the slope; it did not address the base.

`docs/SAVE_SIZE_MEASUREMENT.md` already names the target — `gameArchive`, roll
old seasons' play-level detail down to box-score granularity. This has now been
measured three times (v0.9.27, v0.9.38, v0.9.49) and built once, partially. If
30-50 season dynasties are a goal, this is the blocker, and `STORAGE.md` says as
much: "this batch does not establish 30-50-season performance."

---

## 5. Release bookkeeping has stopped tracking reality

Four documents disagree about what version this is:

| source | says |
| --- | --- |
| `VERSION.txt` / `package.json` | 0.11.6 |
| `gh-pages` (live) | **0.11.7** |
| `CHANGELOG.md` top entry | v0.11.4 |
| `CONTINUATION.md` header | v0.9.51 |
| `docs/roadmap/STATUS.md` | last inspected v0.11.4 |

Additionally `CHANGELOG.md` has **two `# Changelog` headers mid-file** (lines 46
and 49) with v0.9.x entries below the v0.11.4 entry, so it no longer reads in
order. `CONTINUATION.md` names a codex branch three minor versions old as
"current branch", and its own resume prompt already concedes it "needs a real
rewrite, not a patch, next time someone has the credit budget for it."

**Do:** collapse the state trail to one file, then make drift impossible rather
than merely discouraged — `tests/version.js` already gates version consistency
across `VERSION.txt`, `package.json` and `APP_VERSION`; extend it to assert
`CHANGELOG.md` contains an entry matching `VERSION.txt`. Docs that are checked
stay true; docs that are merely maintained do not.

---

## 6. Most commits get shallow validation

`.github/workflows/validate.yml` selects its cadence like this:

```bash
count="$(git rev-list --count --first-parent HEAD)"
if [ $((count % 4)) -eq 0 ]; then mode="full"; fi
```

So the full Node suite, browser suites, storage suite and audit run only on
every fourth commit, or when a commit message contains `[full-ci]`. Three pushes
in four get build + `verify:release` + smoke + version only.

The cadence exists for a reason: `npm test` alone takes **23 minutes** on a
4-core container, before the browser, storage and audit steps. So "always run
full CI" is not a free recommendation.

But combined with parallel agent branches and a demonstrated history of
production drift (section 1), three-in-four shallow pushes is a plausible path
for a regression to reach `gh-pages`. `docs/roadmap/STATUS.md` independently
records the same worry: "Full suite + browser suite are still owed before the
next release."

**Do:** keep the cadence for ordinary pushes, but force full validation on any
commit the publish workflow will build — that is the one place where the
23 minutes is unambiguously worth paying. If the wall time becomes the binding
constraint, the suite parallelises cleanly by file; `node --test` already
accepts a concurrency flag.

---

## 7. Dead weight worth ten minutes

- **`weekly-postgame-engine.js`** (5,495 bytes, exports
  `DynastyPostgameConsequences`) is referenced by nothing: not `tools/build.js`,
  not any test, not any tool, not any doc. It ships in no build. Either wire it
  in or delete it.
- **Three branch-pinned workflows** still sit in `.github/workflows` firing on
  branches that are long finished: `patch-v0103-browser-weekly-gate.yml`,
  `v0102-weekly-coaching.yml`, `v0103-client-shell.yml`. The first *rewrites
  `tests/browser.js` and commits the result* — a CI job that edits tests is
  worth removing on principle. `docs/roadmap/README.md`'s own execution rules
  say "Do not create one-off release workflows."
- **116 remote branches.** Everything merged before v0.10 can go.
- **No linter, formatter or type checking** of any kind (no eslint, prettier,
  tsconfig, biome or editorconfig) across 68 root `.js` files and a 465 KB
  `app.js`. Given the shared-closure architecture, a `node --check` sweep plus a
  duplicate-top-level-declaration check would be cheap insurance. The good news:
  that check currently passes — see the appendix.

---

## 8. What to build next — and why it probably is not the encyclopedia

`docs/roadmap/STATUS.md` points at **v0.12 Encyclopedia** as the only unstarted
packet with a written contract. Recommend deferring it, for two reasons.

First, it is a presentation packet on top of an already presentation-heavy
stack: v0.10.4 through v0.11 were nearly all presentation
(recruiting workspace, development visualization, roster/depth, staff
organization, player identity, game-day and season presentation, world/history
presentation, motion polish, client shell). The engine has not gained a system
since v0.9.51.

Second, and more decisively: the encyclopedia is a museum, and section 2 shows
the exhibits are currently indistinguishable from each other. Indexing twelve
seasons that produced twelve different champions and a shrinking prestige spread
would faithfully record that nothing compounds.

Two candidates instead, in order:

**8a. Population and career dynamics (small).** Section 3's pivot fix, plus a
pinned test band. Activates the portal, the promise system, live signing day and
recruiting battles — all already built, tested and rendered.

**8b. Conference realignment (the real gap).** `realign` has **zero occurrences
anywhere in the codebase**. It is the largest genuinely missing system for a
game that wants thirty-season dynasties, and everything it needs already exists:
`lat`/`lon`, `conference`, `prestige`, `fan_support`, `resources`, and — since
v0.9.48 — a scheduler that derives conference slates and protected rivals
structurally rather than by hand. Today season 30 is structurally identical to
season 1, which is the one thing no real college football decade has ever been.
It is also the natural stress test of the v0.9.48 rivalry work: what happens to
a protected rivalry when one side changes leagues is exactly the drama that
system was built to carry.

Note the dependency: realignment driven by prestige and fan support will behave
oddly while prestige is regressing to the mean, so section 2 wants measuring
before 8b is tuned.

Other absent systems, for completeness — none are recommended ahead of the
above, but all are confirmed zero-occurrence: weather, crowd/attendance beyond
`fan_support` feeding home-field advantage, difficulty or scenario selection,
onboarding/tutorial, walk-ons and JUCO recruiting, team captains and leadership.

---

## What is healthy (do not "fix" these)

- **Prestige mean is flat at 66.5** across twelve seasons. The v0.8 anchoring
  fix works. Only the variance is drifting.
- **The committed `index.html` matches source.** `npm run build` produced no
  diff on `239ad93`.
- **The shared-closure build is sound.** 598 top-level `app.js` functions and 36
  injected extension files produce **0 name collisions**.
- **Schedules, injuries and roster sizes are believable**: injuries 7.6-9.7% of
  rosters per season; roster mean oscillates 86.6-93.3 with a floor at 85 and no
  secular decline; 12.5 signees per team per cycle.
- **Player usage is 40-41%** of the league recording at least one game. That is
  up from 23% pre-v0.8.1 and is defensible for a 90-man roster; noted only
  because it interacts with archive size.

---

## Appendix — reproducing every number

```bash
npm ci                      # required: six suites fail without fake-indexeddb
npm run build               # confirm committed artifact is current
SEASONS=4 npm run audit     # usage, injuries, transfers, decommits, timings
SEASONS=12 npm run longrun  # prestige mean/sd, trueNow, save MB, champions
npm test                    # full Node suite; ~23 min
```

**Test-suite result.** With dependencies installed: **342 tests, 342 pass,
0 fail.**

On a container without `node_modules`, six suites fail with `Cannot find module
'fake-indexeddb'` — `tests/coaches.js`, `tests/games.js`, `tests/gamestore.js`,
`tests/persistence.js`, `tests/portraits.js`, `tests/promises.js` — giving
336/342 and exit 1. These are environment failures, not product defects; all six
pass after `npm ci`. `docs/roadmap/STATUS.md` records the same trap ("eight
storage-backed files initially could not load because the ignored local
`fake-indexeddb` dependency was absent"), so this has now cost at least two
sessions. Anyone reporting suite results should state whether deps were
installed, because the failure presents as a storage regression and is not one.
Worth considering a preflight check in `tests/version.js` that fails with a
one-line "run npm ci" rather than six misleading stack traces.

**Morale / transfer-risk probe.** The morale and `transferRisk` distributions in
section 3 are not produced by any committed tool. They came from a throwaway
script driving the engine through `tools/harness.js`, advancing seasons with the
phase-driven loop from `tests/scheduling.js` — `simSeason`,
`simConferenceChampionships`, `simPlayoff`, then repeatedly reading
`normalizeOffseasonState().phase`, running the camp that phase calls for, and
calling `runOffseason` until the year advances, answering any pending job offer
with `acceptPost`. Do not use a fixed camp/offseason call order for multi-season
work; v0.9.48's changelog explains why it silently stops advancing.

**Production reconciliation.** The file-level divergence in section 1 was found
by reading each source file and testing `liveBundle.indexOf(source.trim()) >= 0`
against `git show origin/gh-pages:index.html`.

**Collision check.** Extract every `^function name(` from `app.js` and from each
file in `tools/build.js`'s `engineExtensionFiles`, then intersect. All 36
extension files are injected into `app.js`'s scope, so a collision there would
silently override engine behaviour. Currently zero. Worth running whenever an
extension file is added.
