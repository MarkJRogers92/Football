# Dynasty Lab v0.11.8 release handoff

Repository: `MarkJRogers92/Football`

Working branch: `codex/v0117-audit-items-1-4-7`

Production: `7f02634` on `gh-pages`, version 0.11.7. Production was not changed
by this work.

## Current source state

`0ce2c39` reconciled the live v0.11.7 ID-based conference-champion and frozen
playoff-field behavior back into source. A fresh source build was compared with
`origin/gh-pages:index.html`; both had SHA-256
`95f619bcded4d9975d5150a76a36d993afa6586a09e5fd81c8fd15ed91f773b7`.

The maintenance branch then added two bounded checkpoints:

- `6ba7647` requires the exact source commit to be reachable from a pushed
  remote source branch and makes preview/production publishing run the complete
  release validator.
- `73253c6` moves the transfer morale pivot from 58 to 70 after measuring the
  current first-season median at 72. Seed 11701 moved from 53 entrants (0.44 per
  team) to 164 (1.37 per team). The `/360` divisor, portal competition,
  promises, capacity and destination selection are unchanged.

## Validation and known state

- Source rebuild versus live v0.11.7 before the maintenance delta: byte-identical.
- Publish-guard unit test: passed.
- Transfer and portal regressions: 28/28 passed.
- Full Node regression suite: 362/362 passed with `npm ci` dependencies installed.
- Functional desktop/iPhone browser suite: 115/115 passed.
- Focused visual suite: 35/35 passed in the verified logo-refresh run. A fresh
  local rerun on this host is blocked because the bundled Chromium path is
  absent and the system Chrome binary aborts under Playwright here, so the
  previously recorded pass remains the current evidence for the presentation fix.
- Current multi-season audit: 5 seasons, seeded at 20260903, with portal
  transfers recorded at 159, 165, 165, 234 and 213 per season; transfer causes
  stayed concentrated in playing time plus fresh-start exits, with zero broken-
  promise exits in this run.

## Release boundary

Production publication of this completed branch was explicitly authorized on
2026-09-08. The release candidate is version 0.11.8 because production already
owns v0.11.7. The guarded publisher must still confirm that the exact source
commit is pushed and pass the complete release validator before promotion.

No remote branches were deleted. The three obsolete branch-pinned workflows
were removed, including the job that rewrote and committed `tests/browser.js`.
`weekly-postgame-engine.js` was removed only after repository-wide reference
search confirmed that neither the build, tests, tools nor docs used its
`DynastyPostgameConsequences` export.

## Next engineering task after review

Run the audit's multi-seed prestige/dynasty measurement before changing any
prestige constants. The original twelve-season, single-seed parity result is a
reason to measure, not enough evidence to tune.
