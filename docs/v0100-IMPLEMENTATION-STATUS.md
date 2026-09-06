# v0.10.0 Game Engine 2 — Implementation Status

## Baseline
- Source branch: `codex/v0100-game-engine-2`
- Parent: v0.9.56 validated source `66c7375bc21a359ef3b401ea8143d83a7a2b2f48`
- Production remains v0.9.56.
- Quick Sim and the current detailed Game Lab remain unchanged.

## Checkpoint 1 — state machine foundation
`game-engine-v2.js` now owns quarter/clock, elapsed time, possession, offense-relative field position, down/distance, score, timeouts, kickoff state, compact events, RNG snapshot, pause/resume state and college overtime transitions.

Checkpoint 1 source: `127f23a192f79073e22e2e2e437d200cc4cd809c`
Synchronized build: `c6a5cf628c89dc8fbcf40df586d2a6bc82c05acd`

## Checkpoint 2 — shadow calibration adapter
`game-engine-v2-adapter.js` bridges existing `profiles()` / `gameProfiles()` snapshots into v2 without mutating dynasty state. Regulation shadow outcomes use offense-vs-opponent-defense strength, not a single collapsed overall rating.

Targeted tests cover deterministic shadow runs, event-derived metric reconciliation, input immutability, 120 matched-seed offense/defense sensitivity and 100-seed aggregate stability.

Checkpoint 2 source: `d8791ed6a509c1c1657c63025aefe5236d34e565`
Synchronized build: `164e5ca0e848b18845dfba69654b7a84a6d1aa4b`

## Checkpoint 3 — real-profile comparison harness
`tools/game-engine-v2-compare.js` compares the existing v0.9.56 simulator with v2 across 40 real week-one matchup profiles from a deterministic headless dynasty.

Safety boundaries:
- the current engine runs only on cloned team objects;
- temporary game archive/event writes are rolled back after each old-engine sample;
- v2 runs are shadow-only and are never installed into the dynasty;
- the comparison reports points, plays, yards, turnovers, home-win rate and team-strength sensitivity;
- results are calibration observations, not pass/fail release thresholds.

The one-shot calibration workflow writes the measured report to `docs/v0100-CALIBRATION.json`, rebuilds the standalone artifact, removes itself, then dispatches normal validation.

## Explicit non-goals so far
- No player stat attribution yet (v0.10.1).
- No coaching decision windows yet (v0.10.2).
- No Watch/Broadcast UI or browser resume surface yet (v0.10.3).
- No replacement of Quick Sim or current detailed Game Lab.
- No production publication.

## Next bounded slice
Use the captured calibration report to tune v2 pace/scoring/yardage/turnover constants and add home-field/team-strength sensitivity checks. Do not cut over a live simulation path until the calibrated v2 distributions are acceptably close to the established engine while preserving the new football-state invariants.
