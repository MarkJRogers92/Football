# Dynasty Lab v0.9.54 — Recruiting / Scouting / Development Continuation

Updated: September 6, 2026

Active branch: `codex/v0954-recruiting-performance`

Production remains v0.9.52. The frozen v0.9.53 preview/release candidate remains untouched. Do not publish production without separate user authorization.

## Milestone completion estimate

The recruiting/scouting/development overhaul is approximately **94–96% complete** at this checkpoint.

The deep mechanics and information model are implemented. Remaining work is primarily final interaction polish, multi-season/browser verification, temporary-workflow cleanup, release notes/version alignment, and preview review rather than another major scouting-engine rewrite.

## Completed foundation from v0.9.53

- 69 canonical archetypes with player-facing labels/descriptions/strengths.
- Spring/Fall development report capture and Development Results Center.
- Global Next Action navigator.
- Weekly bounded Evaluation Hours (8–14), Quick Film (1h), Full Evaluation (3h).
- Read-only preliminary scouting; persistent detailed state begins only on real evaluation.
- Fallible Staff Verdict with conviction/confidence and no hidden-truth reads.
- Three-recruit Compare tray.
- Roster Outlook and eight-player Staff Shortlist.
- Delayed signing Scouting Receipts and later Diamond/Bust/Hit/Miss outcomes.
- Observed Development Tendencies from accumulated camp evidence only.
- Browser/startup/storage regressions fixed and v0.9.53 fully validated/previewed.

## v0.9.54 slice 1 — exact Staff Shortlist pruning

The shortlist now uses exact branch-and-bound pruning instead of calculating a Staff Verdict for every uncommitted recruit on every Recruiting render.

Five real generated 2,800-recruit universes retained identical top-eight recommendations while reducing Staff Verdict calls by an average of **85.7%**. Do not add caching unless later profiling identifies a remaining user-visible bottleneck.

Full coherent validator run `34040297906` passed engine/presentation, browser/visual, IndexedDB and simulation audit.

## v0.9.54 slice 2 — Recruiting Class History

- Historical classes are grouped by signing season from existing `recruitingMemory.scoutingReceipt` data.
- Uses active roster plus archived players, with deduplication and school filtering.
- Shows settled/developing/pending cases, Diamonds/Hits/Busts/Misses, costly misreads, evaluation hours and expectation delta.
- Reuses the anti-cheat Scouting Receipt classifier; no hidden true ratings/upside/growth fields are consulted.
- A latent sibling-extension scope issue was removed by making the history layer own its roster/archive pool and depend only on the public Scouting Receipts API.

## v0.9.54 slice 3 — Evaluation Trail

Recruit profiles now show the manual scouting receipt trail rather than only the latest verdict.

The trail records only already-stored observable scouting receipts:
- Quick Film / Full Evaluation action and cost,
- season/week,
- before -> after staff verdict,
- before -> after report confidence,
- before -> after average range width.

No new save schema, RNG use, or hidden talent read was added. The browser lifecycle regression verifies: open fresh recruit -> empty trail -> spend Quick Film -> receipt appears immediately without console errors.

## v0.9.54 slice 4 — Recruiting Board filters

Latest source slice adds responsive filters over the **full recruit pool before the existing 220-row visible slice**:

- Position,
- Evaluation stage: Preliminary / Film Reviewed / Full Evaluation,
- Staff Verdict,
- Targeted only,
- Reset and live matching/displayed count.

Performance safeguard: the default board and cheap filters do not calculate new Staff Verdicts. Verdicts are computed only when the user explicitly activates a Staff Verdict filter, after position/stage/target filters have already narrowed the candidate pool.

Focused tests verify:
- default filtering performs zero verdict evaluations,
- cheap filters execute before verdict evaluation,
- stage + targeted intersection,
- exact staff-facing verdict labels,
- source pool remains immutable.

A focused Chrome test verifies filter rendering, position filtering, reset, targeted-only filtering and no console errors.

The temporary v0.9.54 sync gate was expanded to run scouting-actions, Evaluation Trail, Recruiting Filters, Scouting Receipts, Recruiting History and Staff Shortlist regressions before every development rebuild.

The first expanded gate caught two test issues before rebuild:
1. illegal strict-mode directive inside a default-parameter function in the new filter module; fixed by using a simple parameter;
2. a stale workload-test expectation: after one recruit has only film review and another is fully evaluated, both the untouched recruit and film-reviewed recruit remain eligible for Full Evaluation, so capacity is 2 rather than 1.

After those fixes, focused recruiting/scouting regressions and standalone build both passed. The synchronized standalone artifact was committed by the development workflow at `65b3441330f155f7c372947a15543c01c3e7fddf`.

## What is genuinely left

1. Run the normal full validator from this documentation checkpoint against the synchronized filter tree. Fix only real failures.
2. Perform one intentional multi-season browser scenario that creates a signed class, advances far enough for receipt/history evidence, and verifies the historical Recruiting Class History path with non-empty data.
3. Decide whether one final Recruiting Board usability addition is worth doing. Candidate: quick text/search or a compact `Needs / Shortlist / Targets` board preset. This is optional polish, not missing scouting depth.
4. Remove `.github/workflows/sync-v0954-build.yml` before release-candidate preparation.
5. Align v0.9.54 version markers/release notes, build once without temporary plumbing, and run a final coherent validator.
6. Publish a v0.9.54 preview only when authorized; production remains separately gated.

## Exact next step

Inspect the full validator triggered by this checkpoint. If green, build the bounded multi-season historical-receipt browser regression next. Do not begin another major scouting mechanic unless that test reveals a real information gap.
