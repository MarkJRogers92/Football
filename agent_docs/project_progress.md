# Project Progress

## Version and branch

Source is `0.13.1` on `claude/review-improvement-dwjemy` (PR #31, merge 7b35d0d). Web published (production run 41764427559).
No GitHub Release or desktop build for 0.13.1. v0.13.1 is playthrough polish: Game Lab explains its gate, the Development training
table folds, version labels no longer show in the UI; see `CHANGELOG.md`.

Previous: `0.13.0` on `claude/review-improvement-dwjemy` (PR #27, merge 69b39d4). Web published (production run 41584185384).
GitHub Release `v0.13.0` (prerelease, tag on 69b39d4, no desktop assets) created by the release workflow (run 41610639932). No
desktop build or Mac install yet. v0.13.0 adds the rising class and watchlist, pool-wide recruiting counts, state filter and
search, and shorter Roster/Season/toast presentation; see `CHANGELOG.md`.

Releases: cloud sessions cannot write releases (HTTP 403), so use `.github/workflows/release.yml` (manual dispatch: `version`,
`title`, optional `target` SHA, `prerelease`, `note`). It refuses a version that does not match `VERSION.txt` at the target, a commit
not on a remote branch, an existing release, or a missing CHANGELOG section. It attaches no desktop builds. v0.12.26 to v0.12.29 never
got a release and can be created the same way with their merge commits as `target`.

Previous: `0.12.29` on `claude/review-improvement-dwjemy` (PR #25, merge ab7e6cf). Web published
(production run 41571572439); no GitHub Release, desktop build or Mac install yet.
v0.12.29 adds specialist recruits, a late market for unsigned prospects, smoother class sizes and
elite placement at signing day; see `CHANGELOG.md`.

Previous: source `0.12.28` on `claude/review-improvement-dwjemy` (PR #23, merge 918e5e7).
v0.12.28 adds dashboard views, a single Game Lab header, recruit-card portraits, per-dynasty
game settings and career milestones. Web published (run 40822227655); desktop artifacts
built (run 40822099911); GitHub Release and Mac install pending, see
`agent_docs/HANDOFF_2026-10-29_v0.12.28.md`.

Earlier: source `0.12.24` (PR #19, merge 23d219c).
v0.12.24 is presentation only: championship trophy and per-team helmets. It is
installed and released (web run 40450856688). v0.12.23 makes program standing buy
talent (prestige weight in a recruit pitch 0.32 → 0.42): blueblood titles went
2/10 → 5/10 on seed 7 and stayed 4/10 on seed 11, so it is a partial step. Mac
v0.12.23 is installed from its matching artifact (signature and ZIP hash verified,
17 save files untouched, v0.12.22 app backed up). Published desktop and web release
is v0.12.23 (web publish 40443754979). v0.12.22 added portal failure modes, the
recruiting roster-needs card and the corrected twenty-season soak (PR #17); v0.12.21 fixed kicker/punter depth (PR #16); v0.12.20 added the four league-health metrics (PR #15); v0.12.19
Hall of Fame browsing (PR #14); v0.12.18 history accuracy, off-field career
preservation and the offseason recap (PR #13).

## Overall progress

- Simulation: recruiting, scouting and development, transfer portal, coaching
  careers, bowls and playoffs, NIL, hot seat, rivalries, academic eligibility,
  guidance/first-season flow, Game Engine v2, 3D Game Cast replay.
- Presentation: premium client shell, recruiting workspace, development
  visualisation, Game HUD, playbook search, player identity, staff organisation,
  world history, legacy museum.
- Delivery: web production on `gh-pages`; Electron Alpha packages built by CI
  on `[release-ci]`; releases published from the packaged artifacts.

## Current position

v0.12.18 source merged and Mac installed: historical championship/conference facts,
off-field career preservation, roster accounting and offseason recap.
Live web remains v0.12.17. Further league-health metrics and Hall of Fame
transparency remain backlog; no balance tuning was performed.

## Next milestone

Named in `docs/roadmap/STATUS.md`. Do not infer a milestone from older root
handoffs in `docs/archive/`.
