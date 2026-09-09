# True Preseason Start — Continuation Note

Date: 2026-09-09
Branch: `codex/true-preseason-start`
Baseline: `0cc0d5140df66a1276c470508e326ca4b2be2146`
Implementation commit: `b6eeae80bbe799c4498c0c47497b0cb8653c8362`

## Current Checkout Status

Status checked on 2026-09-09. The implementation is safely committed and the
branch has no configured upstream. It was not pushed or published. Before this
status note was updated, the tracked implementation worktree was clean; only
the following pre-existing unrelated files were untracked and they remain out
of the milestone:

- `docs/TRUE-PRESEASON-START-IMPLEMENTATION-HANDOFF.md`
- `docs/v0120-DESKTOP-ALPHA-PACKAGING-HANDOFF 2.md`
- `docs/v0120-DESKTOP-ALPHA-REVIEW-HANDOFF.md`
- `forge.config 2.js`
- `tools/rename-desktop-zip 2.js`

## Result

The player-facing New Dynasty flow now creates the 2027 universe at week 0 in
durable `phase: 'preseason'`. The existing Command Center guides roster,
redshirt, depth-chart, recruiting, goals, and development setup while every
football progression path remains unavailable. **Begin Season** changes the
phase to `regular`, keeps week 0 and the generated world intact, consumes no
gameplay RNG, exposes the existing Week 1 matchup, and queues the established
safe autosave.

Low-level `initUniverse()` fixtures still default to the regular season. Old
regular Week 0 saves remain regular, valid preseason saves round-trip, and the
completed-season offseason lifecycle is unchanged. Manual recruit scouting is
available during the opening preseason only, so the initial board can be
evaluated before Week 1.

## Verification

- Focused preseason/save/offseason/next-action/save-slot tests: 34 passed,
  0 failed.
- Full Node suite: 368 passed, 0 failed. A later narrow scouting-availability
  fix was then verified by its final focused unit suite: 11 passed, 0 failed.
- Final focused preseason browser story: passed at 1280×900 and 390×844,
  including setup navigation, save/Continue, RNG stability, CTA reachability,
  error checks, and overflow checks.
- Final `npm run test:browser`: passed, including the 12-week Game Engine 2 soak
  and postseason routing.
- `npm run test:desktop-smoke`: passed native save, restart, preseason restore,
  and clean shutdown.
- `npm run build` and `git diff --check`: passed.
- Independent state/save/RNG diff review and final UX verification reported no
  confirmed defects.

## Boundary

No version bump, tag, package build, publication, deployment, production
`gh-pages` change, or unrelated asset/gameplay work was performed. The next
action is owner review and normal branch integration when desired.

## Resume Later

```bash
cd /Users/markrogers/Documents/Codex/2026-09-07/repository-markjrogers92-football-review-the-latest/work/Football
git switch codex/true-preseason-start
git status --short --branch
git show --stat b6eeae80bbe799c4498c0c47497b0cb8653c8362
```

Start by reviewing the implementation commit and this note. No known defect is
waiting for a fix. The next meaningful decision is whether to push the branch
for review or integrate it through the repository's normal process. Do not
publish production, tag, or bump the version without separate approval.
