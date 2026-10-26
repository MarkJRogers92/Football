# Latest Session Work

2026-10-25: Shipped v0.12.11 (release hygiene: real desktop save-folder usage in
Options, and a docs-consistency test) on top of v0.12.10 — Playbook search over
programs, coaches and players, storage reporting, desktop update notice and error
log, and the desktop packages for 0.12.8/0.12.9 which had reached the web only.

## Current state

- Version `0.12.13` in `VERSION.txt`, `APP_VERSION`, `package.json` and the
  generated `index.html`.
- Default branch `claude/review-improvement-dwjemy`; released source `628518b`
  (`v0.12.13`).
- [Release v0.12.13](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.13)
  is the current desktop Alpha (macOS arm64 + Windows x64 from validation run
  40250941307). The installed `/Applications/Dynasty Lab.app` is 0.12.13; earlier
  bundles are kept at `~/Applications/Dynasty Lab 0.12.9.app` … `0.12.12.app`; the
  three existing save slots are untouched.
- Earlier releases: [v0.12.12](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.12)
  (run 40233735858), [v0.12.11](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.11)
  (run 40232083893), [v0.12.10](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.10)
  (run 40229188911).
- Production publish for 0.12.13 is the `Publish Dynasty Lab` workflow run
  40251817638.
- Premium client roadmap milestones A-J remain shipped. Do not re-run them.

## What this version adds

- **Playbook search** (`app.js` `encyclopediaSearch`/`encyclopediaOpen`,
  `globalThis.DynastyEncyclopedia` bridge, `game-hud.js`): two characters list
  matching programs, coaches and players above the section matches; Enter or a
  click opens the program, coach profile or player dossier. Read-only over
  collections already in memory; it never loads a deferred archive.
- **Save storage reporting** (`app-health.js`): Options shows the device storage
  the dynasty's saves use and warns at 70% of the browser quota.
- **Desktop health** (`desktop/main.js`, `desktop/preload.js`): update notice
  against the latest GitHub release, renderer/preload/console errors appended to
  `dynasty-lab-errors.log` in the app's data folder, external links restricted to
  this project's GitHub pages/releases.
- **Release hygiene (0.12.11)**: Options reads the packed app's real
  `Saves` folder size over IPC, and `tests/docs-consistency.js` fails when the
  version file, changelog, README, agent context or roadmap disagree.
- **History index (0.12.13)**: History lists every recorded coach (searchable by
  name, program or role; opens the coach profile) and the national champion
  timeline (opens the read-only program card). Both are read-only.
- **Read-only search (0.12.12)**: a program result opens a read-only program card
  and never writes `#userTeam` (the earlier build could switch control and be
  recorded as "stepped away"). Entity rows are capped at six, the scan is cached
  while the highlight moves, and the desktop usage walk is asynchronous.

## Known limitation

Search reads `universe.playerArchive` directly. While a browser archive is
deferred, graduated players are not listed; opening one (which loads the archive)
still works from the Archive tab. The roadmap's history packet should add an
on-demand "search archived careers" row rather than loading 20 MB per keystroke.
- **Measurement** (`tools/save-size.js`): per-component save growth; see the
  2026-10-25 update in docs/SAVE_SIZE_MEASUREMENT.md.

## Known gaps

- **Long-dynasty size**: compaction has shipped since v0.9.49 and works
  (gameArchive +2.3 MB/season in steady state). The fastest-growing component is
  now `playerArchive` (+4.1 MB/season): retired players keep full season
  histories. 79.2 MB at six seasons, ~6-7 MB/season steady state.
- **Encyclopedia remainder**: no coach index, conference/season pages, national
  timeline or Hall of Fame. Search covers in-memory entities only.
- **Desktop distribution**: ad-hoc signature, no notarisation, no auto-update
  (the update notice links to the release page).

## Verification

- `npm run verify:release` PASS on the released source.
- `node tests/version.js`, `node tests/smoke.js` (53/53) PASS.
- `node --test tests/encyclopedia-search.js tests/saveslots.js tests/release-guard.js`
  23/23 PASS.
- `node tests/encyclopedia-search-browser.js` PASS at 1280x900 and 390x844
  (program opens, player dossier opens, no console errors, no overflow).
- Five-season audit and six-season save measurement recorded in
  docs/SAVE_SIZE_MEASUREMENT.md.

## Next entry point

docs/roadmap/STATUS.md named the history packet; its search slice is now shipped,
so the next bounded work is the coach index plus conference/season pages, or the
playerArchive rollup.
