# Dynasty Lab — milestone 1 checkpoint

## Ready to continue

**Milestone 1 is implemented and validated: archive persistence and recruiting
audit correction, using the newest v0.8.1 as the base.**

- Repository: https://github.com/MarkJRogers92/Football
- Continuation branch: `codex/v081-save-continuation`
- Base: `ea4c324a91ce63e94164359c76392171fbce4fcb`, from default branch
  `claude/review-improvement-dwjemy`.
- Game version remains `0.8.1`; this is an unreleased continuation, not v0.9.
- Production/default branch have not been modified. No deployment was requested.
- Original project/portrait context is in the earlier chat handoff. This chunk
  contains no coaching or portrait implementation.

## Completed in this chunk

1. `storage.js`: IndexedDB schema 2 adds an archive store while retaining
   `saves/main`. Retired careers are appended in batches of 128; routine saves
   write no old archive chunks. Core and archive changes commit atomically.
2. Browser load defers history until search, archived profiles, export or
   offseason progression needs it. Hydration is shared and protected against
   stale reads; a new/imported universe cannot inherit another game's archive.
3. Export remains one complete portable JSON file containing every archived
   career. Existing inlined browser saves and JSON saves follow the migration
   path. Invalid imports retain the current game. Revision checks reject stale
   loaded tabs; aborts, missing chunks and blocked upgrades fail explicitly.
4. Recruiting audit records `recruitCycle.signeesByTeam` at finalization before
   rollover. The handoff's suggested `seasonCommits` was only a scalar, not
   per-team data. Veteran roster players no longer inflate class counts.
5. The engine harness now exposes `packUniverse`, so save round-trip tests use
   actual sparse packing instead of the old raw-universe fallback.
6. New universes now carry `APP_VERSION` rather than a stale `0.8` label.
7. Generated `index.html` includes `storage.js`; edit sources and rebuild.

## Validation completed on this continuation

- `npm test`: **52 engine checks + 10 persistence scenarios passed**. Includes
  eight seasons of engine stability; atomic failure/abort recovery, old DB
  upgrade, stale tab rejection, missing archive detection, two-season save/load,
  deferred hydration, complete export/import, v0.7/v0.8/v0.8.1 versioned JSON
  fixtures, invalid-import rollback and new-universe isolation.
- `npm run test:browser`: **45 checks passed**, desktop and iPhone viewport.
- `npm run test:browser-storage`: **4 end-to-end scenarios passed** in real
  Chromium/IndexedDB: Save/Load, archive search/profile, exported JSON integrity,
  import/re-save. No console errors.
- `SEASONS=1 npm run audit`: **15–30 signees/team, mean 23.3**; 78 flips of 1,638
  in-season commitments (4.8%); expected simulation ranges maintained.
- `npm run build` and syntax validation passed. Generated output is current.
- Test browser: desktop Google Chrome on macOS, using a disposable profile.
  This is **not actual iOS Safari validation**.

## Next chunk, in priority order

1. Review this branch and `STORAGE.md`, then test the standalone on actual iPhone
   Safari in an isolated preview/origin with an exported backup. Exercise new
   universe, old-save import, browser Save/Load, history search, Export/Import
   and offseason. Do not promote production automatically.
2. Plan indexed archive search / individual career reads, so the next storage
   pass need not materialize all historical players. Investigate portable
   streaming exports separately. Preserve every career unless the user makes
   an explicit retention choice.
3. Check for work in the separate portrait task before starting the approved
   standalone Portrait Lab. Preserve deterministic identity and keep it separate
   from coaching/save migration changes.
4. Begin v0.9 in bounded increments: persistent coach IDs/pool/history → hiring
   market → contracts/budget/negotiation → career trees → chemistry/relationships.
   Use v0.8.1 development/recruiting calibration, not the old v0.8 values.

## Guardrails and known limitations

- Football is canonical; use the continuation branch, not old ZIP handoffs.
- No production promotion, default-branch push, archive pruning, framework
  rewrite or fragile gzip-loader reintroduction in this chunk.
- All existing careers are preserved. Total history still grows. First history
  access and JSON export still materialize the complete archive; 30–50-season
  mobile scalability is not proven.
- Retired records are append-only. Future editing of stored alumni needs an
  explicit update path. New code scanning `playerArchive` must honor hydration.
- The browser DB upgrade is one-way for old builds that request DB version 1.
  Keep a complete portable backup before any future production upgrade; test an
  old build with the exported JSON on a clean, separate origin/profile for
  rollback. Never delete the user's DB as a migration shortcut.
- Existing saves are local to browser/origin; previews do not share production
  saves. No cloud-account saves have been added.
- See `STORAGE.md`, `CHANGELOG.md`, and `WORKLOG.md` for details.

## Resume prompt for normal ChatGPT

Continue Dynasty Lab from Football branch `codex/v081-save-continuation`. Read
`CONTINUATION.md` and `STORAGE.md` first. Milestone 1 (v0.8.1 archive persistence
and recruiting audit) is implemented and validated; do not redo it. Inspect the
live branch head and continue the next checklist item in a bounded chunk. Keep
all careers and portable JSON compatibility. Do not change production. Finish
each chunk with a commit and an updated continuation handoff.
