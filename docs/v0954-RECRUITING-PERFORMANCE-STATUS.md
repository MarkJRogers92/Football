# Dynasty Lab v0.9.54 Recruiting Performance — Status

Updated: September 6, 2026

Branch: `codex/v0954-recruiting-performance`

Base: frozen, preview-verified v0.9.53 release candidate. v0.9.53 production publication remains separately gated; production is still v0.9.52.

## Scope

This branch is deliberately post-v0.9.53 work. It must not alter or republish the frozen v0.9.53 preview candidate.

The first bounded slice optimizes the Staff Shortlist on the Recruiting page. Before this change, each Recruiting render computed a full fallible Staff Verdict for every uncommitted prospect, then sorted the entire pool down to eight recommendations.

## Implemented: exact shortlist pruning

Source commit: `6ae878ccf064a84a34312373413913b2c7036867`
Tests commit: `59fbb87f1ca06e510d380c2842420c23e3a31bcb`
Latest synced standalone artifact commit: `e21337eb3f4692fc24f3e95a0dc3819236b683d7`

The optimized shortlist is a branch-and-bound search, not a heuristic candidate filter:

- Cheap score components are computed first: roster-need urgency, interest, pipeline strength, stars and proximity.
- The scouting system clamps Staff Verdict score to 99, so each prospect has a mathematically safe maximum shortlist score: `cheapBase + 99 * .55`.
- Prospects are considered from highest possible score downward.
- Once eight resolved prospects exist, evaluation stops only when the next prospect's maximum possible score is strictly below the current eighth-place actual score.
- A strict `<` cutoff preserves exact ties and the existing national-rank tiebreak.
- Hidden true talent, hidden upside and hidden development fields remain excluded from shortlist ranking.

The module retains `shortlistExhaustive()` as a pure regression oracle for equivalence testing.

## Focused validation

`node --test tests/recruiting-shortlist.js` passes in the branch build workflow.

Coverage includes the pre-existing roster-need, hidden-rating and commitment tests plus:

1. a 180-prospect varied pool where optimized and exhaustive top-eight IDs, scores and reasons must be exactly identical;
2. a 200-prospect separable pool where the optimized path must return the exact top eight while making at most 12 Staff Verdict calls instead of 200.

The branch-only build workflow then rebuilt and committed the standalone artifact successfully.

## Temporary development plumbing

`.github/workflows/sync-v0954-build.yml` exists only to keep committed `index.html` synchronized while this branch is being developed through the GitHub connector. Remove it before any eventual release candidate is prepared.

## Validation state

This documentation checkpoint is intended to trigger the normal full validator against the already-synced `index.html` tree. Do not claim full v0.9.54 validation until that run completes.

## Exact next steps

1. Inspect the full validator triggered by this checkpoint; fix any real regression before adding another source slice.
2. If validation is clean or the long suite is still running, measure shortlist pruning against a real generated Dynasty Lab recruiting pool and record verdict-call reduction without changing ranking behavior.
3. Consider caching only after measurement demonstrates additional value; do not add stateful caching unless invalidation is proven safe across targeting, scouting actions, commitments, weekly changes, staff changes and roster changes.
4. Keep the v0.9.53 preview/release candidate frozen and keep production at v0.9.52 unless separately authorized.
