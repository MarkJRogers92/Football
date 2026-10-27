# Latest Session Work

## v0.12.21 — Kicking-game repair (2026-10-26)

- The health metrics found the defect: walk-on fill picked positions at random, so
  thin kicker/punter depth grew 0 → 7 → 38 team-seasons and 11–22 programs a season
  had no second kicker or punter.
- `offseasonPreseason` now repairs critical depth (`CRITICAL_FLOOR` QB/K/P of 2)
  before general need, swapping the weakest surplus player for a walk-on at the
  missing position and recording the cut. Measured after: **K/P thin 36→0 (seed 7)
  and 47→0 (seed 11)**; QB 7→9 and LB 5→10 soft-depth deficits remain and are not
  unplayable.
- `tests/roster-repair.js` covers a gutted kicking game, the whole league, and
  determinism. Registered in `npm test`.

## v0.12.20 — League-health metrics and the rollup verdict

- `tools/league-health.js` reports portal churn, positional shortages, walk-on
  dependence and blue-chip concentration. Measured on three seasons of two seeds:
  466 transfers with no unplaced entrants, thin depth concentrated at kicker and
  punter (45–58 team-seasons), ~82% of rosters never signed through a class, and
  ~16% of blue chips reaching the ten strongest classes. Written up in
  docs/LEAGUE_HEALTH_2026-10-25.md, including the kicker/punter repair gap.
- `tools/save-size.js` now breaks the archive down by field. The playerArchive
  rollup is **not worth doing**: 3.8 season rows per career carrying real
  production, and only ~2.9 MB of 114 MB belongs to stateless careers. Verdict and
  numbers in docs/SAVE_SIZE_MEASUREMENT.md. No save-shape change shipped.

## v0.12.19 — Hall of Fame browsing and repository hygiene

- Hall of Fame now shows a count ("Showing 24 of 64 inductees"), a Players/Coaches
  category filter and a "Show all" control. Induction got stricter in v0.12.17, but
  a long dynasty still passed the old 24-row cap, leaving most inductees unreachable.
  Covered on desktop and 390px mobile in `tests/history-accuracy-browser.js`.
- `.session-artifacts/` (local evidence runs) is ignored instead of appearing as
  untracked work.
- This handoff no longer opens with v0.12.11 release notes.
- v0.12.18 history and offseason work shipped by PR #13 (merged 4157493, full CI
  40297216363). Details: [history_offseason_handoff.md](history_offseason_handoff.md).

## Current state

- Version `0.12.21` in `VERSION.txt`, `APP_VERSION`, `package.json` and the
  generated `index.html`.
- Default branch `claude/review-improvement-dwjemy`; released source `6f649c4`
  (`v0.12.20`), merged by PR #15 after full CI 40425813895.
- [Release v0.12.20](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.20)
  is the current desktop Alpha (macOS arm64 + Windows x64 from validation run
  40425813895). Installed `/Applications/Dynasty Lab.app` is CI-built v0.12.20
  (ZIP hash and signature verified, 17 save files untouched); backups are kept at
  `~/Applications/Dynasty Lab 0.12.9.app` … `0.12.19.app`.
- Earlier releases: [v0.12.16](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.16)
  (run 40259042984), [v0.12.15](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.15)
  (run 40256022466), [v0.12.14](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.14)
  (run 40253412593).
- Production publish for 0.12.19 is the `Publish Dynasty Lab` workflow run
  40421035607; the live site serves 0.12.19.
- Premium client roadmap milestones A-J remain shipped. Do not re-run them.

## What this version adds

- **Hall of Fame browsing (0.12.19)** (`history-index.js`): inductee count,
  players/coaches filter and `Show all`. Induction got stricter in 0.12.17, but a
  long dynasty still exceeded the old 24-row cap and the rest were unreachable.
  Desktop + mobile coverage in `tests/history-accuracy-browser.js`.
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
- **League health pass (0.12.17)**: `tools/league-health.js` reports ten-season
  distributions; findings in docs/LEAGUE_HEALTH_2026-10-25.md. Titles, prestige,
  rosters, injuries and recruiting measured healthy on two seeds. Hall of Fame
  selectivity fixed (254 → 64 inductees after ten seasons).
- **Archived-career summary (0.12.16)**: careers with no recorded games are
  archived as a summary record (identity, reads, draft, awards, career totals,
  exit). Measured before changing anything: those careers were 27.9% of the
  archive's bytes.
- **Ten-season measurement**: 115.4 MB at season ten; `playerArchive` 42.9 MB
  and the only accelerating component — see docs/SAVE_SIZE_MEASUREMENT.md.
- **Conference history (0.12.15)**: final standings for any archived season,
  ordered by league record, with the program card behind each row. Derived from
  the stored season records.
- **Hall of Fame (0.12.14)**: retired players qualify on major awards, a
  first-round draft result and career production; coaches on national titles,
  conference titles and Coach of the Year. Reasons are printed, induction is
  derived per read from the archive, and no save field is added.
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