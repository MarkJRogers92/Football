# v0.9.55 Staff Identity, Recruiting Battles & Development Plans — Implementation Status

Updated: September 6, 2026

Branch: `codex/v0955-staff-recruiting-development`

Source baseline: `a16bcaa62c1d7fcdd78722445ee0276860fe7e2f` (validated v0.9.54 release candidate).

Production baseline: v0.9.54. This work does **not** authorize a v0.9.55 production publish.

## Scope

v0.9.55 is intentionally a compact bridge release before Game Engine 2. It connects the existing recruiting/scouting receipts and development systems without exposing hidden player truth.

### A. Staff scouting identity and reputation

- Every coach receives deterministic position-group evaluation specialties derived from durable coach identity.
- Primary specialties improve manual evaluation efficiency more than secondary specialties.
- Evaluation speed combines the Recruiting Coordinator, the relevant side coordinator, and a smaller Head Coach contribution.
- Coach scouting reputation is earned from settled signing-day receipts versus later observed player careers.
- Historical labels use only observed `Diamond`, `Hit`, `As Scouted`, `Bust`, and `Miss` outcomes. Hidden `trueNow`, hidden upside, hidden development curve, volatility, and hidden traits are excluded.
- The Staff screen gains an Evaluation Ledger so successful and costly evaluators develop an actual track record over a dynasty.

### B. Richer recruiting battles

- Up to three recruits per week can receive a `Priority Push`.
- A Priority Push gives a modest +4 controlled-program pitch boost for that week only; unused slots do not carry forward.
- The recruiting battle board exposes current top schools, visible pitch scores, user rank/gap, momentum, decision-window state, and flip pressure for challenged commitments.
- Weekly race snapshots create a compact visible battle history.
- Priority Push cannot be assigned to a prospect committed elsewhere.

### C. Featured individual development plans

- Up to five players per offseason may be marked as Featured Development Plans.
- The feature elevates the existing player training-focus system rather than creating a parallel hidden progression mechanic.
- Featured plans modestly concentrate trait-training chances around the chosen focus; they do not guarantee overall growth and do not alter the hidden growth curve.
- Plans lock when Spring Development begins and store observed Spring/Fall result receipts.
- The Development screen shows active plans and their observed outcomes.

## Anti-cheat / simulation rules

1. Staff reputation is outcome-derived from stored signing beliefs and later observed evidence only.
2. Recruiting battle UI uses existing visible pitch inputs, interest, momentum, leader/challenger state and user actions.
3. Development-plan concentration adjusts training emphasis, not hidden ceiling/growth-profile state.
4. No new UI should rank players directly from `trueNow`, hidden upside, growth profile, volatility, or hidden trait truth.

## Validation strategy

Focused pure tests cover:
- deterministic and bounded staff specialties;
- settled-only staff reputation grading;
- three-slot weekly Priority Push limits and weekly expiry;
- visible race rank/gap calculation;
- five-player Featured Development Plan cap;
- Spring/Fall observed plan receipts.

The temporary `sync-v0955-build.yml` workflow exists only to keep the committed standalone `index.html` synchronized while this branch is under development. Remove it before the release-candidate checkpoint.

## Release gate

Do not bump to v0.9.55 or publish a preview until the implementation branch passes the normal engine/browser/storage/audit validation path. Production remains v0.9.54 unless separately authorized after preview review.
