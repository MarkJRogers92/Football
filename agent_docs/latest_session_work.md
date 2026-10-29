# Latest Session Work

## v0.12.28 — Calmer Command Center (2026-10-29)

- Review of the running game (screenshots at 1440 and 390 wide) found a 4,600px dashboard, three
  stacked headers for one Game Lab matchup, and layered status messages. This pass fixes those.
- `dashboard-views.js/.css`: classifies the dashboard's direct children (cards arrive from several
  modules) into week / stories / league and shows one at a time. Nothing is moved or re-rendered.
  Tests that need the stories cards call `DynastyDashboardViews.show('stories')` first.
- Game Lab: `.gameday-event-hero:not([hidden]) ~ #nextGameCard{display:none}`. The card stays in the
  DOM because `sports-presentation.js` reads its `.gameday-data`.
- Root cause of the dim Game Day hero: `interaction-polish.js` `watch()` observed `class` on the
  element it animates, so every replay re-triggered itself. Fixed by ignoring `dl-motion-*` changes.
- `app.js` weekLine says "Opening week" at week 0 (the HUD only flips on `Week N`).
- Recruiting Workspace cards gain portraits (`DynastyLabPortraits.paint`) and a confidence bar parsed from the Scout cell.
- `game-settings.js`: `universe.settings` {boardPatience, injuryRate, recruitingEdge}; lookup `gameSetting()` and defaults live in
  `app.js` because the engine reads them (extensions are absent from the non-full test harness). Neutral defaults = identical RNG stream.
- `career-milestones.js`: derived from `tenure.seasons` + `careerHistory`; `tenureDigest()` in `app.js` is stored on closed posts.
  `universe.milestones` maps id -> season first reached. Review records now include `champ`/`confChamp`.
- Measured, not tuned: ten seasons on seed 7 gave 8 distinct champions, 2 back-to-back, 5 of 10 titles from preseason top-10 prestige and
  9.4/10 top-10 retention, so no dynasty-persistence change was made.

## v0.12.27 — Smooth trophy turn (2026-10-28)

- v0.12.26 stepped 96 frames at 4 fps and read as jerky on the installed Mac app. Now 192
  frames (the original 96 plus 96 rendered half a step later with `--yaw 1.875`), driven by
  `title-trophy.js` with a per-frame crossfade, 30s per turn.

## v0.12.26 — New title trophy, slow turntable (2026-10-28)

- Replaced the v0.12.25 model with the owner's Meshy image-to-3D trophy (task
  `d180affe-…`, the same model as the Drive export `college_football_trophy_game_mesh`),
  rendered with its shipped PBR textures (Cycles, CPU, `pip install bpy`).
- 96-frame turntable in a 12x8 WebP sheet, 24s per turn, stepped by two nested
  transforms in `polish.css` (`.trophy-reel` rows, `.trophy-sheet` columns). The old
  single-strip `background-position` percentages drifted between frames; the transform
  steps land exactly.
- Season Review still regenerated from the same render (`trophy-still-v3.png`).

## v0.12.25 — Trophy turntable (2026-10-27)

- The title trophy is a genuine 360-degree turntable now: a symmetric Meshy model
  (football on a gold cup) re-shaded to gold, lit in Blender and pre-rendered to 36
  frames (`assets/trophy-turn-v2.webp`, 373 KB). It turns once every 12s, keeps the
  float, and stops under reduced motion. Season Review uses a matching still.
- Retired `assets/title-trophy-v1.png` and the asymmetric first model, whose football
  sat in front of the cup and broke a full rotation.
- `tools/render-meshy-trophy.py` re-shades the GLB (Meshy ships a grey material),
  splits the plinth and renders stills or turntables. `tests/trophy-turn-browser.js`
  covers sheet, size, spin and reduced motion on desktop and iPad widths.

## v0.12.24 — Championship trophy and team helmets (2026-10-27)

- Presentation-only release. Trophy and helmet were generated with Meshy
  (text-to-3D preview + PBR refine), rendered to transparent sprites with three.js.
- Title screen trophy (`polish.css`, `body.html`); Season Review champion trophy
  (`season-review.js/css`); Game Lab hero helmets (`gameday-season-presentation.js/css`).
- Helmet atlas: `tools/build-helmet-atlas.py <side-render.png>` recolors one helmet per team
  (shell = primary, facemask = secondary) into a lossy WebP atlas. A 256-colour PNG was tried
  first and posterized the shells; WebP fixed it. Logos are overlaid in CSS from the logo atlas.
- The first Meshy helmet carried a brand-like mark and crackle texture; it was regenerated
  with a plain-panel prompt. Known weakness: the lower shell shadows very dark on every team.
- Meshy credits spent: about 150 across trophy and both helmets.
- Validated before the PR: `npm test` 497/497 and `npm run test:browser` green (dev dependencies
  installed with `npm ci --ignore-scripts` in the cloud container).

## v0.12.23 — Dynasty persistence, first measured step (2026-10-26)

- Baseline measured first: prestige held its ranking almost perfectly (top-10
  retention 9.8/10), yet preseason top-10 programs won only 20% of titles (seed 7)
  and 40% (seed 11) — standing was sticky but did not convert into results.
- Change: recruit pitch weights prestige 0.32 → 0.42 (Prestige priority bonus
  0.18 → 0.22). No new fields; prestige stays derived from existing state.
- A/B, ten seasons: seed 7 blueblood titles **2/10 → 5/10**, back-to-back 1 → 2,
  distinct champions 9 → 8. Seed 11: 4/10 unchanged, back-to-back 0 → 1, distinct
  champions 9 → 8. Partial effect, reported as such.
- `tools/league-health.js` now reports distinct champions, most titles by one
  program, back-to-back titles, blueblood titles and top-10 prestige retention.
- Archive policy unchanged: old seasons are kept in full.

## v0.12.22 — Portal outcomes, roster needs, long soak (2026-10-26)

- **Portal realism.** A program needs two open slots at the position and a player
  competitive with its room; a prior relationship still opens a door. Unplaced
  entrants return to school (65%) or leave football (35%, archived "No landing
  spot"). Measured 29.6% (seed 7) and 31.5% (seed 11) unplaced over three seasons,
  matching the ~30% real-world D-I figure. First-offseason rate skews high — recorded
  as a known limitation.
- **Recruiting needs card** (`recruiting-needs.js`): thin position groups from
  returning players + commitments against `POS_COUNTS`. Read-only bridge
  `globalThis.DynastyRecruitingNeeds`; no save fields, simulation or randomness.
- **Twenty-season soak**: `tools/save-size.js` now drives the interactive offseason,
  throws if a season does not advance, and honours `SEED` (it previously hardcoded
  seed 7). Seed 7 reaches 206.6 MB at season 20, with the player archive at 93.9 MB
  and overtaking the game archive around season 13. Findings in
  docs/SOAK_20_SEASONS.md.
- **Notarisation blocked**: no Developer ID identity or App Store Connect key exists
  on this machine; requirements and steps in docs/NOTARIZATION.md.
- **Dynasty persistence is not started** — it changes simulation balance and needs
  its own measured design using the soak data.

## v0.12.21 — Kicking-game repair

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

- Version `0.12.23` in `VERSION.txt`, `APP_VERSION`, `package.json` and the
  generated `index.html`.
- Default branch `claude/review-improvement-dwjemy`; released source `f57e770`
  (`v0.12.21`), merged by PR #16 after full CI 40430159066.
- [Release v0.12.21](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.21)
  is the current desktop Alpha (macOS arm64 + Windows x64 from validation run
  40430159066). Installed `/Applications/Dynasty Lab.app` is CI-built v0.12.21
  (ZIP hash and signature verified, 17 save files untouched); backups are kept at
  `~/Applications/Dynasty Lab 0.12.9.app` … `0.12.20.app`.
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