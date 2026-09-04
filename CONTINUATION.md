# Dynasty Lab — v0.9.19 checkpoint

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `claude/v0919-hub-priority-sort` (merged into the
main working branch `claude/review-improvement-dwjemy`)
Production branch: `gh-pages`
Production: v0.9.19 at https://markjrogers92.github.io/Football/

## Current release

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

Read `STORAGE.md` before altering saves. v0.9.19 adds no save-format change of
its own (`importance` is an additive field on hub tiles, which are rebuilt
every week). v0.9.18 was a merge of already-shipped
additive changes — no new save-format changes of its own. IndexedDB remains
schema 3. Scouting/decision/agency state uses additive fields on existing
player/recruit/universe records with no IndexedDB version bump.

## Next roadmap sequence

### A) Story surface (recommended) — part 1 shipped in v0.9.19
The hub priority sort is done. What remains of this milestone is the story
surface: record-chase alerts and a player career chronology built from data
already stored (`seasonHistory`/`transferHistory`/`promises`/`awards`) — the
unbuilt slice from `ROADMAP_V09.md`. Both would feed the wire, which now
ranks properly, so a record-chase alert needs an importance on the same
0–100 scale to sit correctly among the other tiles.

### B) Live-league save size
The game archive is solved (v0.9.12). Remaining growth (~4 MB/season) is
`universe.events` and per-player `seasonHistory` across 120 teams, now with
scouting snapshots and weekly decisions added on top. Measure before
touching anything.

### C) 14-tab coherence
The weekly plan (v0.9.13), the Coach's Desk decision cards (v0.9.14/15) and
the polish pass (v0.9.17) covered the worst of it. What remains is the tab
surface itself — grouping, or a first-run path.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `WORKLOG.md`. v0.9.19 is production and all
known feature branches are reconciled into the main line — check
`git branch -r` for anything new before assuming that's still true. Work in
a new bounded branch, validate fully (`npm test` + `npm run test:browser`),
update CHANGELOG/WORKLOG/STORAGE/CONTINUATION, publish a preview first, then
promote only after review.
