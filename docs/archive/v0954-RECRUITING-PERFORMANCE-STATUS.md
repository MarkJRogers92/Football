# Dynasty Lab v0.9.54 Recruiting Performance — Status

Updated: September 6, 2026

Branch: `codex/v0954-recruiting-performance`

Base: frozen, preview-verified v0.9.53 release candidate. v0.9.53 production publication remains separately gated; production is still v0.9.52.

## Scope

This branch is deliberately post-v0.9.53 work. It must not alter or republish the frozen v0.9.53 preview candidate.

## Completed slice 1: exact Staff Shortlist pruning

Primary source/tests were added before this checkpoint; latest coherent pre-history code checkpoint was `e685a844bc9d4a9a71814ff49dd0bbbc07b97b99`.

The optimized shortlist is a branch-and-bound search, not a heuristic candidate filter:

- Cheap score components are computed first: roster-need urgency, interest, pipeline strength, stars and proximity.
- The scouting system clamps Staff Verdict score to 99, so each prospect has a mathematically safe maximum shortlist score: `cheapBase + 99 * .55`.
- Prospects are considered from highest possible score downward.
- Once eight resolved prospects exist, evaluation stops only when the next prospect's maximum possible score is strictly below the current eighth-place actual score.
- A strict `<` cutoff preserves exact ties and the existing national-rank tiebreak.
- Hidden true talent, hidden upside and hidden development fields remain excluded from shortlist ranking.
- `shortlistExhaustive()` remains as a regression oracle.

Focused tests cover exact ranking equivalence and aggressive pruning in synthetic pools.

### Real generated-pool measurement

Measurement was run independently from the exact v0.9.54 checkpoint on temporary diagnostic branch `codex/v0954-shortlist-measure`, workflow run `34041195616`.

Five deterministic fresh Dynasty Lab universes were generated through the real headless engine harness. Each contained 2,800 recruits. Optimized and exhaustive top-eight IDs, scores and reasons matched exactly in every universe.

| Seed | Optimized verdict calls | Exhaustive verdict calls | Reduction |
| ---: | ---: | ---: | ---: |
| 95401 | 865 | 2,800 | 69.1% |
| 95402 | 465 | 2,800 | 83.4% |
| 95403 | 227 | 2,800 | 91.9% |
| 95404 | 208 | 2,800 | 92.6% |
| 95405 | 237 | 2,800 | 91.5% |

Average Staff Verdict call reduction: **85.7%**, with exact ranking equivalence in all five generated pools.

Conclusion: do **not** add shortlist caching at this stage. The stateless exact-pruning change already removes most expensive verdict work while avoiding cache invalidation complexity.

### Full validation of shortlist checkpoint

Full validator run `34040297906` completed successfully on the coherent shortlist-optimization checkpoint:

- standalone build — passed
- committed-build freshness — passed
- releasable source tree — passed
- full engine/presentation suite — passed
- Chromium discovery — passed
- browser UI/visual regression suite — passed
- browser IndexedDB regression — passed
- simulation audit — passed

## Completed slice 2: historical Recruiting Class History

Feature commit: `525aff5bbb4122863bb2d58eacd5076f0dfcda09`
Latest synced standalone artifact after this feature: `ca2fb3edb070ceb19f3c84f414cb605d09989fb8`

The Recruiting page now extends Scouting Receipts into a historical class-by-class review without adding a new save schema.

- Uses the existing active roster plus `playerArchive` receipt data.
- Groups players by the signing season stored in `recruitingMemory.scoutingReceipt`.
- Shows up to six recent recruiting classes, newest first.
- Each class reports signed, settled, developing and pending counts.
- Compact outcome counts show Diamonds, Hits, Busts and Misses.
- Class context includes average observed outcome versus signing expectation, evaluation hours invested and costly misreads.
- Player rows show signing stars, the original Staff Verdict and evaluation stage, later observed receipt outcome, expectation delta, games and starts.
- The same maturity gates and anti-cheat Scouting Receipt classifier are reused; hidden true rating, hidden upside and hidden growth profile are never consulted.
- Archived player records already preserve `recruitingMemory`, observed ratings/confidence, season history, awards and career evidence required by this view.

### Prototype and focused validation

The feature was built first on temporary prototype branch `codex/v0954-receipt-history-prototype` to avoid cancelling the active branch's full validation.

Prototype targeted workflow runs passed:

- `34041408167` — focused Scouting Receipt/history tests + standalone build
- `34041464030` — focused tests + standalone build + verification that the Recruiting Class History surface is actually bundled in generated `index.html`

Focused history coverage proves:

1. classes group by signing season newest-first;
2. settled/developing/pending/evaluation-hour totals reconcile;
3. school filtering excludes other programs;
4. changing hidden `trueNow`, hidden upside or hidden growth profile cannot change the historical report.

On the active branch, `.github/workflows/sync-v0954-build.yml` then passed its focused shortlist regression, rebuilt the standalone artifact and committed the current `index.html` at `ca2fb3edb070ceb19f3c84f414cb605d09989fb8`.

## Temporary development plumbing

`.github/workflows/sync-v0954-build.yml` exists only to keep committed `index.html` synchronized while this branch is being developed through the GitHub connector. Remove it before any eventual v0.9.54 release candidate is prepared.

The diagnostic branches `codex/v0954-shortlist-measure` and `codex/v0954-receipt-history-prototype` contain measurement/prototype plumbing only. Do not merge their temporary workflows into the release tree.

## Current validation state

The first combined-tree validator attempts after Recruiting Class History failed at Verify committed build is current because each source or documentation push raced the temporary development build-sync workflow: validation checked the pre-sync commit, then the sync workflow committed the rebuilt index.html afterward. No engine, browser, storage or audit step ran on those failed attempts.

The synchronized standalone artifact is now committed at 7032f0a585573ce6ebe1bcbbf5d0937c0a46e4ca. This documentation-only checkpoint is intentionally being pushed after that artifact commit to trigger validation from a tree whose generated build is already current.

Do not claim the combined v0.9.54 tree is fully green until that validator completes.

## Exact next steps

1. Inspect the full validator triggered by this checkpoint and fix any real regression before adding another active-branch source slice.
2. If fully green, treat shortlist performance and historical class receipts as completed v0.9.54 slices.
3. Inspect the remaining recruiting/scouting/development workflow for the next bounded user-facing improvement; prioritize legibility or meaningful decisions over speculative optimization.
4. Before any eventual v0.9.54 release candidate, remove `.github/workflows/sync-v0954-build.yml`, rebuild/synchronize once through normal release tooling, and run a final coherent validator.
5. Keep the frozen v0.9.53 preview/release candidate untouched and keep production at v0.9.52 unless separately authorized.
