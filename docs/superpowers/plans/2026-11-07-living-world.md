# Living World First Pass Implementation Plan

**Goal:** A short optional weekly briefing and recurring players/coaches, backed by accurate history.
**Architecture:** Read-only engine adapter, pure selection/following functions, and a DOM module inside the existing Command Center. Follow preferences live on the device, scoped to the world's existing RNG seed; no simulation or dynasty-save changes.
**Tech stack:** Existing vanilla JavaScript/CSS build, Node tests, browser regressions.
**Spec:** `agent_docs/REVIEW_2026-11-07_LIVING_WORLD.md`, approved in conversation to begin with briefing and recurring cast.

## Constraints and review focus

- Light route, direct implementation; preserve all prior work. No difficulty, balance, publish, or install changes.
- Briefing contains at most three factual items; no acknowledgement, unread badge, notification, or advance blocker.
- Following survives reloads and season rollover; switching worlds cannot mix entity IDs. Missing/deferred archives must not invent retirement or transfer events.
- Escape imported names; links must open canonical profiles. Preserve keyboard focus on follow/unfollow.
- Legacy migration must retain the old evidence while rebuilding unreliable title totals from authoritative history.
- Read adapters without changing the universe or drawing RNG. Keep the existing next-action and required decisions visible.

## Tasks

1. Add failing regressions for false national titles, duplicate season counts, old Legacy totals, and stale bowl years. Fix `legacy-snapshot-adapter.js`, `legacy.js`, and `ceremony-snapshot-adapter.js`; run focused regressions.
2. Test then implement `living-world.js` pure `toggleFollow`, `reconcile`, and `briefing` functions, and `living-world-adapter.js` read-only snapshots. Track player transfers, injury return, draft/exit and coach moves by recorded identity. Seed-context follow preferences do not affect saves. Use explicit current-week facts and existing story arcs; show callbacks against the next opponent.
3. Mount the compact briefing beneath the existing advance/decision controls. Add Follow buttons to existing player/coach profiles and story cards; keep the followed list in optional details. Move supporting Rival Watch and highlights into the existing optional briefing disclosure, keeping matchup and action access. Wire the build and regression suites, rebuild HTML, run Node suite and two-season integration. Run browser checks if supported; otherwise record the concrete blocker without claiming visual validation.

## Execution notes

- Managed-worktree tools failed. Continued in an isolated local clone at `.session-artifacts/living-world`, restoring the exact previously verified Claude snapshot as baseline `fe69239`. The original checkout is unchanged except review documentation.
- Commits and a delta patch will preserve the finished work for application to Claude's branch. No network publication is authorized.

## Completion

Tasks 1–3 are implemented. Full suite: 53 smoke checks and 581 Node tests passed, including the two-season integration; the final added profile regression passed separately, and 26 focused tests passed against the final sources. Build and whitespace checks passed. Self-review also added rollback and malformed-follow regressions. Browser regression is written but visual validation remains blocked: Chrome aborts during macOS application registration before page load. No launch policy was changed, no browser workaround attempted, and no release/install performed.
