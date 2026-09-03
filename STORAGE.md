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
