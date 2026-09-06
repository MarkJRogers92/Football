# Handoff — Dynasty Lab v0.9.50

## Checkpoint

- Repository: `MarkJRogers92/Football`
- Working branch: `codex/v0950-continuation`
- Baseline: `1492070` (`claude/review-improvement-dwjemy`)
- Completed local commit: `de5a14f` — `Add deterministic RNG contract and tests`
- Release version remains **v0.9.49**. Nothing in this branch is published.
- Production `gh-pages`: `bdcf0d2`; rollback: `23e8aeb`.

## Completed: v0.9.50 suggested commit 1

- Added `rng.js`, a standalone UMD module using a versioned Mulberry32 stream.
- The API accepts a reported seed or saved `{version, seed, state, draws}` state.
- Added deterministic helpers (`next`, `float`, `int`, `pick`, `gauss`), snapshots,
  and deterministic named substreams that do not advance the parent stream.
- Added six focused tests covering a pinned sequence, exact save/resume,
  helper bounds/draw counts, substreams, distribution baselines, and invalid state.
- Added `rng.js` exactly once to the standalone build before `app.js` and added the
  test to the normal Node manifest.
- No gameplay caller has been switched. v0.9.49 outcomes are unchanged.

## Validation

- `node --check rng.js`: PASS
- `node --test tests/rng.js`: 6 PASS, 0 FAIL
- `node tools/build.js`: PASS, 671 KB standalone
- `node tests/version.js`: PASS
- Standalone inclusion check for `root.DynastyRng`: exactly 1
- `git diff --check`: PASS

The full Node and browser suites were not rerun because this slice adds an
isolated module and the user asked to conserve credits. Claude's immediately
preceding v0.9.49 browser run was 169/169 PASS.

## Next precise task

Implement suggested commit 2 from `docs/roadmap/06-v0950-modularization-rng.md`:
route utilities and low-risk generators through a saved RNG, with focused tests.

Design constraint discovered during inspection: `initUniverse()` generates
staff, rosters, and recruits before assigning `universe`. A gameplay RNG that
only attaches to an existing universe will silently fall back to `Math.random`
during initial generation. Establish the seeded stream before those generators
run, then store its final snapshot on the newly created universe. On load,
restore the runtime stream from `universe.rng`; on save/export, synchronize its
latest snapshot first.

Do not migrate all direct `Math.random` calls in one commit. Start with the
shared `rng`/`gi`/`pick`/`gauss` utilities and explicitly chosen low-risk
generators. Keep `uid()` and portrait identity on Web Crypto/non-game entropy,
and keep recap text on its existing isolated hash stream. Add a legacy-save
migration policy without consuming gameplay draws during normalization.

## Guardrails

- One domain per commit; do not tune distributions while routing randomness.
- Keep `index.html` self-contained and rebuild it after every source change.
- Preserve browser-test hooks and source anchors until the adapter work begins.
- Do not merge, publish, deploy, or touch `gh-pages` without explicit approval.
