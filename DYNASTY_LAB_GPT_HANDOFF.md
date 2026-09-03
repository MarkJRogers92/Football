# Dynasty Lab — handoff back to GPT

Follow-up session on `claude/review-improvement-dwjemy`, continuing directly
from `REVIEW.md`'s own work list (its §9, "What to do before the coaching
overhaul"). `APP_VERSION` is unchanged at `0.8.1` — everything here is
additive within that release, not a new version. Four commits landed; a
fifth item was deliberately not started. Read `WORKLOG.md` for the
blow-by-blow (plan, decisions, tuning numbers) behind each one; this file is
the summary and the handback.

## What shipped

1. **Mobile cards on Recruiting and Development.** Same `stacked-table` /
   `data-label` treatment the roster table already had. The Stats tab needed
   nothing — its leaderboards are stacked `div` rows, not a `<table>`; the
   review's own list of tables needing this was wrong on that one point.

2. **The Weekly Command Center is clickable.** Every hub item that names a
   screen now jumps there — a new `goToTab()` helper — and opens the
   relevant player/recruit dialog where one applies. Hub items from an older
   save simply lack a destination and render as before.

3. **Decommits and flips.** The largest gap the review flagged: nothing
   anywhere cleared `r.committed`, so a commitment was permanent and
   recruiting had no second act. Committed recruits are now re-pressured
   weekly against the field (`pressureCommit()`); a sustained pitch
   advantage from a challenger gives a small, logistic-curve chance of a
   flip, tuned to **4–5% of in-season commits per cycle** (measured with
   `npm run audit`). The user's attention defends a commit and can win a
   flip; the AI never flips a recruit to the user unprompted. New state:
   `universe.decommitLog` (capped at 80 entries) and `universe.recruitCycle`.

4. **`T()` and `findPlayer()` are Map-indexed.** Both were linear scans
   called from render paths, as the review's performance section named.
   Self-validating rather than instrumented at every roster-mutation site —
   a hit is checked against the universe's current shape and a miss costs
   one rebuild. Measured: `findPlayer` on a live player, 2000 lookups,
   218ms → 5ms; on an archived player, 500 lookups, 121ms → 2ms; `T()`,
   20000 lookups, 19ms → 1ms.

Every item is its own commit; `npm test` (51 checks) and
`npm run test:browser` (45 checks) are green after each one, and after all
four together. `npm run build` produces no diff — `index.html` is current.

## What was not attempted, and why

**Item 5 from the work list — moving `universe.playerArchive` out of the
save blob into its own IndexedDB object store, loaded on demand — was not
started.** It was marked in the work list itself as the highest-value
remaining item but the riskiest, with an explicit instruction not to start
it without being able to finish it green. That instruction was right to
follow: it is the one item that touches save, export and import directly,
and REVIEW.md's own guardrail is that save compatibility must never break
without a migration path. Stopping cleanly after item 4, rather than landing
mid-way through a save-format change, is the safer handoff.

For whoever picks this up, the shape of the problem as it stands today:

- Saves currently live in one IndexedDB store (`DynastyLabDB` → object store
  `saves`, single key `'main'`), written by `saveBrowser()` as
  `{universe: packUniverse(universe), userTeam, savedAt, version}`.
  `packUniverse()` already maps `playerArchive` through slim `ARCHIVE_FIELDS`
  and sparse stat packing (that was the v0.8.1 archive-size fix); it is still
  inlined in the same blob.
- `exportSave()` builds the identical structure into a downloaded JSON file.
  A second object store for the archive doesn't remove the problem for
  *export* — a portable save still needs the archive data somewhere, so the
  real design question is whether Export should keep inlining the archive
  (simple, still growing, but portable) while only the *browser* save splits
  it into a second store (fast to open, not portable on its own), or whether
  the exported format needs to change shape too. That's a product decision,
  not an engineering one — flag it back to the user rather than picking
  silently.
- `normalizeUniverse()` is the migration function and would need to keep
  defaulting `universe.playerArchive` to `[]` for any save that still has it
  inlined (i.e., every existing save, and every fresh Export) — the split
  only changes how the *browser* auto-save stores and loads it.
- Growth is still linear per REVIEW.md §5: ~3,000 players enter the archive
  per season and none leave. The 74 MB / 4.3-MB-per-season figures in
  CHANGELOG.md are from the field-slimming fix already shipped, not from
  splitting storage. Splitting storage buys faster load/save (JSON.stringify
  and the IndexedDB write no longer include a multi-thousand-row array on
  every autosave) but does not by itself bound growth — pruning archived
  players to a career summary after N seasons is still the actual fix for
  the 30–50 season target REVIEW.md was asked about, and is independent of
  where the data is stored.

## One correction to REVIEW.md, found in passing

Its `tools/audit.js` output line `recruiting: signees/team this cycle
min=%d mean=%s max=%d` counts every roster player whose `origin` string
contains `"star recruit"` — which is every generated player, not just this
cycle's signees — so it reports something close to full roster size (mean
~90) rather than a class size. Not fixed here; it's a pre-existing
diagnostic bug in the audit tool, not something item 3 introduced, and
fixing audit tooling wasn't in scope. A real per-cycle signee count is now
available via `universe.recruitCycle.seasonCommits`, which the new
decommit-rate audit line already uses — `tools/audit.js`'s existing signee
line should probably be rewritten from that instead of the origin-string
heuristic.

## State to hand off

- Branch `claude/review-improvement-dwjemy`, four new commits on top of
  `efc5ac3` (the review's own last commit). Working tree clean, build
  current, both test suites green.
- `WORKLOG.md` has the full decision trail per item, including the tuning
  math for the decommit hazard curve — needed if the 4–5% rate ever needs
  retuning.
- Nothing was deployed, per the project's own guardrails. This is source
  only.
