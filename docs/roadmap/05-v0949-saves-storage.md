# v0.9.49 — Save Experience and Long-Dynasty Protection

## Goal

Prevent ordinary progress loss, support multiple dynasties and slow the measured
approximately 11.5 MB-per-season storage growth without destroying history.

## Save slots

- Replace the single logical `main` slot with stable slot IDs.
- Provide at least three named manual slots.
- Store summary metadata separately: program, year, week/phase, record, version,
  saved time, approximate bytes and checkpoint type.
- Maintain one recoverable previous revision per slot.
- Keep cross-tab revision conflict protection scoped to the active slot.

## Autosave policy

Autosave only after a completed atomic action:

- week advancement;
- postseason phase;
- signing completion;
- portal round/closure;
- spring and fall camp;
- preseason transition.

Never autosave halfway through a transaction or while a modal decision is being
resolved. Debounce presentation-only changes. Show save success/failure without
blocking continued play after a recoverable error.

## Archive retention tiers

Permanent for every game: score, participants, context, team box, player deltas,
injuries, leaders and recap facts.

Full detail retained for controlled-team, rivalry, conference-title, bowl and
playoff games. Routine AI-versus-AI games older than a configurable horizon may
drop drive/play detail after recording a compaction manifest. Do not change game
IDs or break existing links.

Player archives retain full controlled-team and notable careers. Before reducing
non-contributor rows, measure actual field contribution and prove career/national
records remain reconstructable.

## Migration and recovery

- Import the current single-slot DB as the first named slot.
- Never delete the source slot until the new slot verifies successfully.
- Export remains complete and portable.
- Reject unknown future formats with a useful message.
- Provide a recovery choice when the current revision is corrupt but the prior
  checkpoint is valid.

## Likely files

`storage.js`, save/load/title functions in `app.js`, title markup and CSS,
`tests/storage.js`, `tests/persistence.js`, `tests/browser-storage.js`,
`tests/gamestore.js`, plus storage measurement tooling.

## Suggested commits

1. Add slot-aware storage API and migration/failure tests.
2. Add slot picker, naming and metadata UI.
3. Add safe autosave/checkpoint orchestration.
4. Add game-detail compaction with link/record invariants.
5. Measure 1/6/12/20-season resident and export sizes; document results.

## Acceptance tests

- Slots never read or overwrite another slot's archives.
- Failed writes retain the last complete revision.
- Autosave cannot capture a half-advanced week or offseason phase.
- Export/import reproduces the same archive counts and record links.
- Compacted games still open to Summary and Box Score.
- A 20-season test remains within the agreed storage target established during
  measurement, not an invented target in this file.

## Exit criteria

Users can safely maintain multiple dynasties, routine progress is automatically
checkpointed, rollback works, and measured long-dynasty growth is materially
lower with no broken history links.

## Non-goals

No cloud synchronization, accounts, cross-device merge or collaborative play.

