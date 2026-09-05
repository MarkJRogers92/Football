# v0.9.47 — Interactive Transfer Portal

## Goal

Let the controlled program recruit transfers using existing identity, history,
coach-relationship, scheme, playing-time, scholarship, promise and NIL systems.

## User flow

1. Portal opens after departures and signing.
2. The user sees needs, scholarship room and NIL remaining.
3. Transfers appear with position, eligibility, former school, reason, production
   and uncertain scouting ranges.
4. The user targets a bounded number, assigns recruiting attention, optionally
   offers NIL and one supported promise, and can withdraw before resolution.
5. Interest changes over two or three portal rounds while AI schools compete.
6. Commitments resolve live; unsigned players continue through the final round
   or remain unplaced for existing fallback handling.

## State

Add `universe.portalCycle` with year, round, status, targets, resolutions and a
bounded event log. Extend each portal entry with stable candidate ID, finalists,
interest map, scouting exposure and decision state. Do not duplicate the player
object; the portal entry continues to own the same player record.

## Decision model

Use the existing `transferFit()` as the base. Expose only explainable categories:

- immediate opportunity from projected role depth;
- offensive/defensive scheme fit;
- prior recruiter or coach relationship;
- NIL deal;
- prestige and recent trajectory;
- geography;
- prior recruiting finalists;
- promise credibility, including the program's recent breach record.

Tune AI competition and user attention in audit runs. Do not use a deterministic
highest-score winner; preserve bounded weighted uncertainty.

## UI

Add a Portal subview under Staff & Offseason with filters for position,
eligibility, former conference, interest and target status. The profile reuses
the player portrait and career chronology. Include roster-needs and scholarship
panels; do not create a second player-profile implementation.

## Likely files

`app.js` transfer helpers, offseason render/bind functions, scouting, NIL,
promises and scholarship helpers; `body.html`; presentation CSS; new
`tests/portal-recruiting.js`; extend transfer, persistence and browser tests.

## Suggested commits

1. Add normalized portal-cycle state and candidate migration.
2. Add targeting, interest, round advancement and AI competition engine.
3. Integrate NIL/promises/scholarship capacity and destination resolution.
4. Add portal UI/profile reuse and mobile layout.
5. Run distribution audit and multi-year persistence verification.

## Acceptance tests

- A transferred player keeps ID, portrait, eligibility, injuries, career stats,
  scouting history and transfer chronology.
- The player cannot sign beyond scholarship capacity or NIL remaining.
- A promise is attached to the destination school, not the origin.
- Withdrawing refunds only reversible current-round commitments.
- Coach movement meaningfully changes interest without forcing a commitment.
- Saving during any portal round resumes the same candidates and resolved state.
- AI teams remain roster-bounded over at least twelve seasons.

## Exit criteria

The user can deliberately fill a roster need through a competitive portal, the
result survives save/export/import, and existing automatic placement remains a
safe fallback for AI and unplaced players.

## Non-goals

No junior-college recruiting, tampering, transfer windows by date, or real-world
eligibility rules.

