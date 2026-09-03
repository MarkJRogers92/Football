# WORKLOG

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
