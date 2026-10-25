# Latest Session Work

2026-10-25: Reconciled the documentation and release state to v0.12.9. This
commit changes documents only; no gameplay, save or presentation behaviour.

## Current state

- Repository: Dynasty Lab, working/default branch `claude/review-improvement-dwjemy`,
  clean at `89727e8` (2026-10-21).
- Version `0.12.9` in `VERSION.txt`, `APP_VERSION`, `package.json`, the generated
  `index.html`, production and the installed desktop app.
- Production https://markjrogers92.github.io/Football/ serves v0.12.9
  (pages run 39686344045). Latest validation run 39686491263 is green on `89727e8`.
- Shipped since v0.12.7: v0.12.8 range-aware recruit comparison; v0.12.9 Game HUD
  (Playbook, pause menu, toasts, result splash and live ticker, kickoff intro,
  record flash, rank badges, week cards). Both are presentation-only.
- Premium client roadmap (docs/DYNASTY_LAB_PREMIUM_CLIENT_DESIGN_ROADMAP.md)
  milestones A-J are implemented: client rail shell, recruiting workspace,
  development visualisation, command-centre guidance and first-season flow,
  roster/depth studio, player identity, staff organisation, Game Day and season
  presentation, world history and the legacy museum. Do not re-run them.

## Known gaps (verified 2026-10-25)

- **Desktop download lag.** GitHub tags and releases stop at v0.12.7, so the
  published Alpha zip is two releases behind the web build. Release artifacts
  come from the `desktop-macos`/`desktop-windows` jobs in
  `.github/workflows/validate.yml` (manual dispatch sets `desktop=true`).
- **Long-dynasty save growth is unresolved.** Measured on v0.12.9 with
  `SEASONS=6 node tools/longrun.js`: 36.3 MB after season 1, 87.2 MB after
  season 6 (+10.7 MB/season, 13,308 archived players). This matches the v0.9.38
  measurement; nothing has been rolled up since. docs/SAVE_SIZE_MEASUREMENT.md
  owns the analysis and the recommendation (gameArchive first, then
  playerArchive).
- **Encyclopedia packet not built** (docs/roadmap/09-v012-encyclopedia.md): no
  team/coach search, coach index, conference pages, national timeline or Hall of
  Fame. Archive search matches player names only; the Playbook searches section
  titles only.
- **Desktop Alpha distribution is manual.** `forge.config.js` uses an ad-hoc
  signature, there is no notarisation, no update check and no renderer error log.

## Verification recorded this session

- `npm run verify:release`: PASS — the committed build is reproducible from
  source and the source is releasable.
- `node tools/audit.js`: PASS through 2031. Prestige mean 66.4-66.5, sd ~16.8;
  transfers 174-240 per season with 0 broken promises; ~10% of rosters injured
  in-season; 39-41% of rosters appear in a game.
- `SEASONS=6 node tools/longrun.js`: prestige mean 66.5, six different national
  champions, 87.2 MB save at season 6.
- `npm test` on this host is slow when season-length suites run concurrently;
  CI remains the authoritative full-suite result for this commit.

## Next entry point

docs/roadmap/STATUS.md "Next action" names the next bounded packet. Read this
file, then `docs/roadmap/STATUS.md`, then only the packet named there.
