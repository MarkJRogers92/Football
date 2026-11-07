# Project Progress

Current continuation: `agent_docs/latest_session_work.md` (v0.14.2 integration candidate). Mark authorized integrating the reviewed changes and producing a playable build. Three affected browser suites passed in his normal Mac Terminal. Fresh candidate validation, remote integration and packaging are in progress; no new installation or public web publication yet.

## Recruiting continuation — 2026-11-06

Implemented active-view count visibility, shared full-pool search/reset, compact Workspace filters and a dedicated phone dossier with Back restoring list position and focus. Targeted recruiting and desktop/phone browser checks passed; see `latest_session_work.md`. Current/Rising peer views, roster outlook and position shortcuts are now also implemented, with 47 targeted tests and 119 smoke checks passed. Focused map/shortlist/summary/history views are now also implemented. Mark prefers fewer menus and a condensed, clean layout: use the flat direct-view strip. Latest validation: 54 targeted tests and 119 smoke checks passed. Next: visual-density review before release scope.

## Unreleased work in progress — 2026-11-04

Recruiting explanation parity, the first shorter weekly desk, postseason win-chart scaling and Game Cast scoring corrections are implemented and verified locally (final full run: 538 Node tests and 53 smoke checks passed) on `codex/recruiting-weekly-desk`, in `/Users/markrogers/.codex/worktrees/recruiting-weekly-desk/Football`, based on v0.14.1 commit `252a784e8a55ae48d09920be396d709b8e60dd7a`. No commit, push, publication or desktop install occurred. See `latest_session_work.md` for scope, verification, evidence and the continuation point. The complete proposed upgrade roadmap is `/Users/markrogers/Documents/Codex/2026-11-04/dynasty-upgrade-review/ROADMAP.html`.

## Version and branch

Source is `0.14.1` on `claude/review-improvement-dwjemy` (PR #33, merge 07d5ca8). Web published (production run 41775769252). GitHub
Release `v0.14.1` (prerelease, tag on 07d5ca8, no desktop assets; release workflow run 41851458748). No desktop build or Mac install yet.
v0.14.0 makes the rising class contested (scouting for watched prospects, AI early commitments); v0.14.1 is a visual pass (Game Center
layout, dashboard gate note, read-only Program Lab attributes with a season chart, nav icons, folds and fixes); see `CHANGELOG.md`.
v0.14.0 has no separate release or tag; it shipped in the same merge and the v0.14.1 release notes say so.

Previous: `0.13.1` on `claude/review-improvement-dwjemy` (PR #31, merge 7b35d0d). Web published (production run 41764427559).
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

The source baseline is v0.14.1. The unreleased recruiting explanation and weekly desk work above is ready for review. This session did not change published or installed builds; the release records above are historical context.

## Next milestone

Named in `docs/roadmap/STATUS.md`. Do not infer a milestone from older root
handoffs in `docs/archive/`.
