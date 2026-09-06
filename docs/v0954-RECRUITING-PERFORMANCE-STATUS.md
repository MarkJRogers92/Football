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

## Real generated-pool measurement

Measurement was run independently from the exact v0.9.54 checkpoint on temporary branch `codex/v0954-shortlist-measure`, workflow run `34041195616`. The measurement branch is diagnostic only and is not part of the release tree.

Five deterministic fresh Dynasty Lab universes were generated through the real headless engine harness. Each contained 2,800 recruits. For every universe, the optimized shortlist and exhaustive shortlist were required to produce identical top-eight IDs, scores and reasons before call counts were accepted.

| Seed | Optimized verdict calls | Exhaustive verdict calls | Reduction |
| ---: | ---: | ---: | ---: |
| 95401 | 865 | 2,800 | 69.1% |
| 95402 | 465 | 2,800 | 83.4% |
| 95403 | 227 | 2,800 | 91.9% |
| 95404 | 208 | 2,800 | 92.6% |
| 95405 | 237 | 2,800 | 91.5% |

Average Staff Verdict call reduction: **85.7%**, with exact ranking equivalence in all five generated pools.

Conclusion: do **not** add shortlist caching at this stage. The stateless exact-pruning change already removes most expensive verdict work while avoiding cache invalidation complexity across targeting, scouting actions, commitments, weekly changes, staff changes and roster changes. Revisit caching only if later browser profiling shows a remaining user-visible bottleneck.

## Temporary development plumbing

`.github/workflows/sync-v0954-build.yml` exists only to keep committed `index.html` synchronized while this branch is being developed through the GitHub connector. Remove it before any eventual release candidate is prepared.

## Validation state

Full validator run `34040297906` is still running on the coherent v0.9.54 checkpoint. Build generation, committed-build freshness and releasable-source verification have already passed; the long engine/presentation suite is currently in progress. Do not claim full v0.9.54 validation until that run completes.

## Exact next steps

1. Inspect full validator run `34040297906`; fix any real regression before adding another source slice.
2. If validation is clean, treat the shortlist optimization as complete and avoid stateful caching for now.
3. Continue with the next bounded recruiting/scouting/development polish item rather than doing more speculative performance work; the best current candidate is a historical recruiting-class/scouting-receipt view that lets the user review old staff calls and resulting player outcomes without exposing hidden truth.
4. Remove temporary v0.9.54 build-sync plumbing before any eventual release candidate is prepared.
5. Keep the frozen v0.9.53 preview/release candidate untouched and keep production at v0.9.52 unless separately authorized.
