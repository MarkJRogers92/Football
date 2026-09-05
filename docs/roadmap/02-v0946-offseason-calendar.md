# v0.9.46 — Offseason Calendar 2.0

## Goal

Replace the single backwards `runOffseason()` transaction with correct,
resumable phases. Departing players leave before camps; incoming freshmen and
transfers participate before the new season.

## Required phase model

`seasonComplete → review → departures → signing → portal → spring → fall → preseason`

Store this as `universe.offseason = {year, phase, completed, reports}`. Each
transition records completion before rendering and must be idempotent after a
save/load.

## Phase ownership

### Review

Finalize honors and records, archive team/player season statistics, update fan
support and administration confidence, credit coaching trees, and resolve the
coaching carousel. None may run twice.

### Departures

Increment eligibility, resolve redshirts, determine draft declarations,
graduate exhausted players, create portal entrants, and close/release affected
promises. Departing players are no longer eligible for development.

### Signing

Resolve contested commitments through the existing live signing presentation,
enroll signees, retain recruit identity/scouting/portrait/relationships, and
apply scholarship capacity.

### Portal

For this packet, retain automatic placement but isolate it behind phase APIs.
Packet 03 replaces the controlled-team portion with interactive recruiting.

### Spring

Develop only the post-departure, post-signing, post-portal roster. Record scheme
installation and scouting snapshots once.

### Fall

Run final development, position battles, recommendations and depth updates on
the actual opening-day roster.

### Preseason

Enforce roster bounds, fill legitimate walk-on gaps, reset seasonal counters,
generate the next recruit pool and schedule, and open the new year.

## Migration

- Legacy regular/postseason saves map directly to their current phase.
- A legacy `phase === complete` save with no camp completed starts at `review`.
- If legacy spring/fall flags exist, infer the furthest safe phase without
  replaying development.
- Preserve `developmentState` until the migration has been validated; remove it
  only in a later cleanup release.

## Likely files

`app.js` functions `simPlayoff`, `archiveSeason`, `runSpringCamp`,
`runFallCamp`, `runOffseason`, `finalizeRecruiting`, draft/transfer helpers and
offseason renderers; `body.html`; `tests/persistence.js`, `tests/promises.js`,
`tests/transfers.js`, `tests/career.js`, `tests/bowls.js`, `tests/signingday.js`,
and new `tests/offseason-calendar.js`.

## Suggested commits

1. Add normalized offseason state and migration tests.
2. Extract review/departure/enrollment/portal/preseason phase functions without
   changing outcomes.
3. Reorder phases and update controls/weekly plan.
4. Add save/load-at-every-boundary tests.
5. Calibrate one-, five-, and twelve-season simulations; build and document.

## Required invariants

- No player is archived, drafted, transferred, signed, developed, or promoted
  twice after reload or repeated clicks.
- Graduates and declared players receive no camp development.
- Enrolled freshmen and incoming transfers participate in fall camp.
- Player, coach, game and event IDs remain stable.
- Signing reveal remains presentation-only; outcomes are already resolved.
- A blocked career decision still blocks phase advancement cleanly.

## Exit criteria

The offseason can be saved and resumed at every phase; roster membership during
camp is correct; multi-season tests show bounded rosters and no duplicate
history; current save fixtures migrate without loss.

## Non-goals

No user portal board, new roster limits, conference realignment, or economic
system.

