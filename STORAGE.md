# Browser archive persistence (v0.8.1 continuation)

## Scope

Previously every browser save packed and structured-cloned the entire alumni
archive. Saves now write the active universe separately and append newly retired
players to archive chunks. Browser load leaves careers deferred until archive
search, an archived-player profile, JSON export or offseason progression needs
them. First access materializes the full archive once for the current session.
No players or historical fields are intentionally removed by this change.

Portable Export remains `{version, userTeam, universe}` with an inlined
`universe.playerArchive`. Import remains compatible with that format and the
existing `normalizeUniverse()` migration path. Storage references never appear
in a portable export; raw browser records with detached history cannot be imported
as if they were complete backups.

## Storage schema

`DynastyLabDB`, version 2:

- `saves`, key `main`: `{version, savedAt, userTeam, universe, storageVersion: 2,
  revision, archiveRef: {id, count, chunks}}`. The core universe omits
  `playerArchive`.
- `archives`, integer chunk keys starting at 0: arrays of at most 128 packed
  retired-player records. Each append adds new chunks; partial old chunks are
  not rewritten. There is only one browser save slot, as before.

`storage.js` owns transactions and exports a small factory for disposable tests.
`app.js` owns current-universe migration, deferred hydration and UI actions. The
build includes both scripts in the generated standalone. No runtime dependency
or new network/decoder path was introduced. `fake-indexeddb` is test-only.

## Invariants

- Both stores participate in each save's single readwrite transaction. Report
  success only on transaction completion; abort/error leaves the prior record
  and archive intact. Replacing a dynasty clears its old archive only in that
  same transaction, with the new data already queued for write.
- A loaded universe remembers its save revision. A newer save from another tab
  causes a conflict error rather than a silent overwrite. A deliberately new or
  imported universe can replace the single save slot as before.
- Retired records are append-only within the engine. Future features that edit
  historical biographies or appearances must add a persistence update path;
  mutating a previously stored archive row in memory is not persisted by append.
- Deferred reads verify archive identity, chunk presence and total count. Never
  treat missing history as an empty valid archive. Shared hydration requests
  cannot duplicate records. Old reads cannot attach careers to a newly imported
  or newly generated universe.
- Browser actions temporarily disable controls while a save/import/export/load
  is pending, so the captured dynasty cannot be advanced during a write.
- The synchronous engine expects a materialized archive. UI offseason progression
  hydrates it before calling the engine; archive profile/search entry points do
  the same. Any new feature that directly scans `playerArchive` must honor that
  boundary. `packUniverse()` refuses to export a deferred archive accidentally.
- Save IDs use Web Crypto, never gameplay randomness.

## Migration and rollback

Opening the DB adds the new object store without rewriting an old `saves/main`
record. Legacy inlined browser saves load normally; the next explicit Save
moves their archive into the new store atomically. An open old-game connection
can block the schema upgrade; close those tabs and retry. Connections created by
this version close after transactions and respond to version changes.

The DB schema upgrade is one-way for older builds hard-coded to open version 1.
Those builds cannot reopen a version-2 DB. Keep a complete exported JSON backup
before any future production upgrade. To test or roll back the game itself,
import that complete JSON into the old build on a separate clean origin/profile.
Do not delete a user's browser DB as a migration strategy.

## Limits and next step

This reduces repeated archive packing/writing and initial load cost; it does not
cap total IndexedDB growth. Export and first archive access still materialize
all historical players; export still constructs the complete JSON in memory.
This is not proof of 30–50-season mobile performance. The next storage chunk
should investigate indexed search / individual-career reads and a portable,
streamable history export without discarding careers. Real iPhone Safari remains
a release gate; desktop Chromium at an iPhone viewport is not iOS validation.

## Verification

- `npm test`: 52 engine checks plus 9 storage failure/migration tests and one
  full engine persistence scenario. Test databases are disposable.
- `npm run test:browser`: 45 existing desktop/mobile-layout Chromium checks.
- `npm run test:browser-storage`: real browser UI → IndexedDB → deferred archive
  search/profile → complete JSON export → import → Save/Load.
- `SEASONS=1 npm run audit`: final class counts, not veteran roster counts.
- `npm run build`, then verify generated output is current.

Transaction design follows the event-lifetime rules documented at
https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction and blocked-upgrade
handling at https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/blocked_event.

## v0.9.0 additions

Roster promises, training evidence, coach IDs, event counters/events and departed
coach snapshots are part of the core portable universe. Archived player promises
are retained by ARCHIVE_FIELDS and travel through existing archive chunks.
No new IndexedDB version or loader. Active obligations resolve before retiring
players, so already stored append-only archive rows never need rewriting.

## v0.9.1 additions

Transfer history, recruiting memory and coach relationships are retained on active
and archived players. Transfers reset only current-season totals, after the
completed season was added to career history. Destination records store stable
school IDs plus name snapshots. A capacity-blocked transfer stays in the core
`transferPortal` array as the same player's full record; it is never silently cut.
The portal queue and transfer events travel in portable JSON and browser saves.
No database version change or archive rewrite is introduced.

## v0.9.2 additions

`universe.gameArchiveVersion: 1`, `gameCounter` and `gameArchive` are part of the
core browser/portable save. Records are write-once snapshots keyed by permanent
IDs; schedule/latest/event references carry those IDs. IDs do not depend on team
names. Normalize retains counters and rejects unsupported future archive formats.
Player game deltas use sparse fields, with copied ID/name/position. Team metadata
is captured before updating standings. Drive outcomes (not full play logs) are
retained for detailed simulations. No historical markup or mutable roster refs.

Current storage cost is approximately 6.6 MB per 745-game season, plus ordinary
roster/player archives. Game boxes still load/save with the core; this batch does
not establish 30–50-season performance. Future work should separate immutable
boxes into indexed, deferred chunks with atomic revision/archive checks, preserving
full portable JSON and all old game IDs. Never prune silently. Full play logs are
optional/temporary; boxes and drive summaries remain permanent.

## v0.9.5 additions

Primary recruiter IDs, coach-specific relationship maps and bounded coach-departure
pressure live on the existing recruit/player records. Archived players retain the
same fields through `ARCHIVE_FIELDS`. Relationship fallout is stored as ordinary
core dynasty events; no IndexedDB schema change, archive rewrite or new network
dependency is introduced. Old saves use their already-recorded
`recruitingMemory.recruiterCoachId`/relationship as the additive migration source.

## v0.9.6 additions

`universe.openings` (array) and `universe.candidateMarket` (opening ID → candidate
array) are new top-level core fields, both defaulted by `normalizeCoachState()` so
old saves migrate additively with no IndexedDB version bump. A coach object gains
an optional `interim` flag and `playCallAuthority`; both are already covered by the
existing coach fields that travel through `packUniverse`/browser saves — no new
ARCHIVE_FIELDS entries were needed since openings/candidates are program-level
state, not player-level. Interim/candidate coaches use the same `careerHistory`
stint machinery as every other coach (`openCoachStint`/`closeCoachStint`), so no
parallel identity system was introduced; a hired candidate keeps the coach ID they
already had if they came from another program (`coachId` on the candidate record),
or is minted once via `generateCoach` if they were a fresh/off-market hire.

## v0.9.9 additions

None. Game recaps and the weekly newsletter are computed from the existing
immutable `gameArchive` records at render time and are never persisted, so the
save format, IndexedDB schema and archive chunks are all unchanged. This is
deliberate: a stored recap would bloat every save and would go stale if the
prose were ever improved, and deriving it means recaps also appear for games
archived long before v0.9.9. Recap wording is seeded from the game ID rather
than `Math.random`, so rendering history never perturbs the simulation stream.

## v0.9.10 additions

`team.schemeTransition` ({off, def}, each null or a
{from, to, side, startSeason, familiarity, reason} record) and
`coach.preferredScheme` are new core fields, both backfilled by
`normalizeCoachState()`. The migration is deliberately conservative: an
inherited coordinator is recorded as preferring the scheme his program
already runs, so loading a v0.9.9 dynasty never starts an installation the
player did not ask for. Player records are unchanged — scheme cost is
computed in `playerSchemeFit` from the team's transition state rather than
stored per player, so nothing is written into the roster or the archive and
no IndexedDB version bump is needed. Position-change willingness is likewise
derived at call time from existing fields (role, staffTrust, versatility,
promises) and never persisted.

## v0.9.11 additions

`recruit.pulledBy` (an array of program names) and `recruit.pulledSeason` are
the only new persisted fields; they travel with the existing recruit records
in the core universe. Scholarship capacity, room and over-sign appetite are
all derived at call time from roster state and stable program traits rather
than stored, so nothing needs migrating and an older save simply starts
obeying the limit. Pulled offers are recorded as ordinary `OFFER_PULLED`
dynasty events. No IndexedDB version change.

## v0.9.12 additions

IndexedDB moves to **schema 3**, adding a `games` object store alongside
`saves` and `archives`. Permanent box scores leave the core save row and
become append-only chunks addressed by a `gameRef` ({id, count, chunks}) that
mirrors `archiveRef` exactly: same 128-row chunking, same optimistic revision
check, same fail-closed reads on a missing or damaged chunk, same refusal to
read a reference from a replaced dynasty.

Games are immutable once written, so an ordinary save appends only the ones
played since the last save. A storage-2 save keeps its games inline, loads
normally, and splits them out atomically on its next save — the same upgrade
path careers took in v0.9.0. Portable JSON is unchanged and still carries the
complete dynasty; `exportSave` hydrates both archives before packing so an
export can never silently omit history.

Deferral is now per-archive: careers are chunked from storage 2 onward, box
scores only from 3, so the `loaded` and `gamesLoaded` flags are derived
separately from the record's storage version rather than from one shared
test.

## v0.9.14 additions

`universe.weeklyDecisions` is a new additive core array. Each record identifies
the season, week, controlled team, decision type, linked player/recruit IDs,
options and resolution. It travels through the existing core browser save and
portable JSON paths; old saves normalize it to an empty array. Resolutions also
append an ordinary `WEEKLY_DECISION_RESOLVED` dynasty event. No IndexedDB schema
change, archive rewrite or new storage reference is introduced.

## v0.9.15 additions

Player-initiated locker-room conversations continue to use the existing
`universe.weeklyDecisions` core array. New records identify `source: "PLAYER"`
and may carry a requested position; older v0.9.14 records receive
`source: "STAFF"` idempotently on load. A player's latest deferred, declined or
approved position request is ordinary player state and is retained in an archive
record if the player departs. No IndexedDB schema change or archive rewrite.

## v0.9.16 additions

Evaluated recruits and players may carry `scoutingDomains` plus sparse
`scoutingHistory` checkpoints. These fields are ordinary nested core data and
travel through browser saves, portable exports/imports and player archives.
Existing saves add an empty history idempotently and create deterministic
domain estimates only when needed. No IndexedDB schema change or archive
rewrite is required.

## v0.9.21 additive state

Three features added persisted state. All of it is additive on records that
already existed, so there is no IndexedDB version bump — the schema stays at 3
and older saves migrate through `normalizeUniverse()` without special handling.

On each team:

- `rivalry: {rivalId, trophy, series:{w,l,streak,lastYear,lastResult,miles}}` —
  derived by `deriveRivalries()` from the built schedule. Backfilled when no
  team on the universe has one. Re-derivation preserves an existing series when
  the same pair comes back, so history is never silently reset.
- `adminConfidence` (0-100), `mandate` (`null`, or `{year,wins,text}`) — seeded
  from `admin_patience` by `ensureAdminState()`.
- `nilSpent` — reset every offseason by `resetNilSeason()`.

On the universe:

- `tenure: {startYear, school, seasons:[review], ended}` — one review appended
  per season by `reviewControlledProgram()`.

On players and recruits:

- `nilDeal: {amount, year, schoolId}` — cleared for prior seasons by
  `resetNilSeason()`. `schoolId` is required on recruits, which are shared
  objects visible to every program; without it a deal one school paid for would
  improve every school's pitch.

Events gain three types (`RIVALRY_RESULT`, `ADMIN_REVIEW`, `NIL_DEAL`), all
carrying `importance` on the same 0-100 scale the wire ranks by.

## v0.9.22 additive state

- `universe.careerHistory: [{school, prestige, startYear, endYear, seasons, w, l, reason}]`
  — one entry per closed tenure, appended by `closeTenure()`.
- `universe.jobOffers: [{schoolId, name, conference, prestige, why}]` — non-empty
  only while the player owes a decision; cleared by `acceptPost()`.
- `universe.tenure.closed: boolean` — guards against a closed tenure accruing
  further seasons.

Both universe fields are backfilled in `normalizeUniverse()`. Still schema 3.
