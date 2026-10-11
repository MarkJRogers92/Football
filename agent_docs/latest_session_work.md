# Latest Session Work

2026-10-11: Merged, published, and installed v0.12.7 with the development/player-evidence improvements. The user authorized all three delivery actions.

## Detailed Current State

- Repository: Dynasty Lab, current/default branch `claude/review-improvement-dwjemy`.
- Released source and tag `v0.12.7`: `f7e3c03aa5b40e5e8d196cca25a01bbb64831240` (`release: integrate development and player insights for v0.12.7`). The local default branch was fast-forwarded to this merge.
- Player-evidence implementation checkpoint: `39193ee` (`feat: add scouting, career stories and production insights`).
- The previously verified featured-plan results and camp coaching work remains in `0b97487`, with its prior handoff in `48c27f3`. This package began with a clean working tree and preserves that work.
- Version is `0.12.7` in `VERSION.txt`, `APP_VERSION`, package metadata, the published page, and the installed desktop app. `app.js` and extensions are source; `tools/build.js` regenerates the standalone `index.html`.
- Integration preserves the already released v0.12.6 first-season flow, Game Cast, 3D Watch, rendering composition, school data, simulation improvements, and release gates. The previously declined full-detail Sim Week path remains disabled.
- Camp result recording still runs through the canonical completion path before autosave. Development rendering retains `extendRender`; the Stats evidence wrapper refreshes `TAB_RENDERERS.stats` so the active-tab renderer actually uses it.

## Session Changes

- `player-evidence-model.js` supplies pure scouting and statistics calculations; `player-evidence-adapter.js` connects the existing profiles, Stats, History, and event ledger. Build and runtime harness loading stay aligned.
- Scouting history separates estimate/range and confidence movement from measured camp growth. Current coaches interpret the shared scouting ranges using evaluation skill and positional expertise; these are not independent hidden-rating grades. New accepted checkpoints preserve coach identities and perspectives when recorded. Existing history is not backfilled.
- Accepted weekly personnel choices and Spring/Fall camp recommendations retain both players and the actual role/depth facts, timing, phase, and outcome. Held positions use truthful wording; replay does not duplicate milestones.
- Actual recorded games can create one early-career breakout per player/season using the existing story score. Eligibility exhaustion records college completion; cuts and early declarations do not receive that event. Game transaction rollback restores the event ledger alongside game records.
- Weekly cards show the latest recorded milestone. Selected-school History offers a season filter and player links, including saved names after transfers or deferred archive loading. Career chronology combines existing recruitment, seasons, honors, transfer/injury/draft history with recorded milestones, ordered newest first within each season. Same-week camps retain their recorded order and explicit phase labels.
- Profiles compare archived/current seasons and recent versus prior retained same-position game lines. Stats adds program/national position groups using pooled numerators and denominators, participating players, and player-games. Missing denominators or historical positions remain unavailable; archived/current final-season totals are not duplicated.
- Player archives now retain `campHistory`. Presentation helpers do not consume gameplay randomness or create gameplay decisions; repeated profile, Stats, and History reads preserve player/live-RNG state.

## Verification

- `npm run publish` completed successfully with the unchanged required `validate:full` gate: build, clean/reproducible release verification, 448/448 core tests, standard and extended browser suites, six browser persistence scenarios, and the five-season audit. The long core run completed without a five-minute cutoff.
- Integrated focused suites passed 28/28, first-season pure tests passed 9/9, and desktop storage tests passed 14/14. Counts overlap the full suite and are not additive.
- The parent feature flow passed at 1280x900 and 390x844 on the release build: actual personnel decisions, four recorded weeks, rollback, breakout deduplication, weighted statistics, career links, Spring/Fall camp acceptance and replay, phase order, saved coach perspectives, read purity, and layout/error checks. The fixture aligns both initial QB charts before the real promotion so independent random charts cannot change its participant.
- Independent native Sol review accepted the integrated diff and separately verified both downloadable packages and the disposable-profile installed-app verifier.
- [Source CI run 38111772628](https://github.com/MarkJRogers92/Football/actions/runs/38111772628) passed validation and both macOS/Windows packaging and native save/restart checks. Its fast cadence skipped browser/audit jobs; the required browser/audit checks ran in the local full publication gate.
- The locally made Mac app passed native save/restart/replacement checks and strict signature verification. Its packaged HTML is byte-identical to the validated source. The Windows artifact comes from the exact-source CI run and matches the game source after platform newline normalization; its separate raw hash is recorded.
- The actual `/Applications/Dynasty Lab.app` passed a fresh-profile launch with native storage, no Node exposure, the new player and statistics views, and no renderer errors. The regular user profile was then opened; its v0.12.7 title menu shows the existing Continue Dynasty and desktop save ready. No gameplay action was taken in that profile.

## Delivered Release

- [Production](https://markjrogers92.github.io/Football/) serves the exact validated v0.12.7 HTML, SHA-256 `fdfdb53688fa0efaef664beb9e3b3e721c02c64f970d4a962e756a2b708a3033`. Pages commit: `0d9e36ca19bf91deb83a4f7f57ccc5885f5e3b39`. Both referenced external image assets returned HTTP 200.
- [Release and downloads](https://github.com/MarkJRogers92/Football/releases/tag/v0.12.7) are published as a desktop Alpha prerelease, with Mac arm64 and Windows x64 ZIPs. The tag resolves to released source `f7e3c03`; both uploaded asset sizes and GitHub SHA-256 digests match the verified local packages.
- Installed version is v0.12.7, retaining bundle identity `com.electron.dynasty-lab` and the native save location. Its ASAR matches the verified Mac package. All 17 original native save files retained their exact checksums after replacement, fresh-profile verification, and normal user-profile startup.
- Release evidence, package hashes, browser screenshots, publication log, installation checks, and before/after save manifests are under `/Users/markrogers/Documents/Codex/2026-10-10/dynasty-release-0.12.7/`. The `backups/` directory retains the prior v0.12.2 app and exact save backup. Earlier implementation evidence remains under `dynasty-player-insights/` and `dynasty-development-upgrade/` in the same date directory.
- No blocker remains for this authorized release. Older saves may lack historical coach perspectives, positions, or retained game lines; the UI reports missing/partial evidence rather than backfilling it.

## Next Entry Point

The requested release is complete. Continue from the current default branch and inspect its actual state before new work. Player-evidence tests are registered in the standard suite and `test:development`, with `test:player-evidence` for focused iteration. Other framework documents contain older snapshots; this handoff is the release evidence for v0.12.7.
