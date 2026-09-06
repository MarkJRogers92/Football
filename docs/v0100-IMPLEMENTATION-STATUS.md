# v0.10.0 Game Engine 2 — Implementation Status

## Baseline
- Source branch: `codex/v0100-game-engine-2`
- Parent: validated v0.9.56 source `66c7375bc21d1edfa475aa173789da721935f07fbf`
- Production remains v0.9.56.
- Quick Sim and the current detailed Game Lab remain unchanged.

## Checkpoint 1 — state machine foundation
`game-engine-v2.js` owns quarter/clock, elapsed time, possession, offense-relative field position, down/distance, score, timeouts, kickoff state, compact events, RNG snapshot, exact pause/resume and college overtime transitions.

Source: `127f23a192f79073e22e2e2e437d200cc4cd809c`
Synchronized build: `c6a5cf628c89dc8fbcf40df586d2a6bc82c05acd`

## Checkpoint 2 — shadow adapter
`game-engine-v2-adapter.js` bridges existing `gameProfiles()` snapshots into v2 without mutating dynasty state. Regulation outcomes resolve offense vs opponent defense with deterministic RNG, calibrated play-clock use, bounded turnovers, home-field input and red-zone finishing.

Source: `d8791ed6a509c1c1657c63025aefe5236d34e565`
Initial synchronized build: `164e5ca0e848b18845dfba69654b7a84a6d1aa4b`

## Checkpoint 3 — real-profile calibration
`tools/game-engine-v2-compare.js` runs the existing v0.9.56 simulator and v2 across all 120 scheduled games from weeks 1–2 of a deterministic headless dynasty.

Safety boundaries:
- v0.9 runs only on cloned team objects;
- temporary archive/event writes are rolled back after every old-engine sample;
- v2 results are never installed into the dynasty;
- Quick Sim, standings, player stats and saves are untouched.

Current 120-game calibration candidate (`8ac47a5473f6e78e3211b56fedbeb3157d0b04f3`):

| Metric | v0.9.56 | v2 | Delta |
| --- | ---: | ---: | ---: |
| Points/game | 42.66 | 40.87 | -1.79 |
| Offensive plays/game | 120.31 | 124.53 | +4.22 |
| Yards/game | 592.13 | 625.90 | +33.77 |
| Turnovers/game | 2.48 | 2.47 | -0.01 |
| Touchdowns/game | 4.68 | 4.88 | +0.20 |
| FG made/game | 2.39 | 2.17 | -0.22 |
| FG attempts/game | 2.97 | 2.95 | -0.02 |
| Punts/game | 7.59 | 8.34 | +0.75 |
| Home win rate | 55% | 53% | -2 pts |
| Mean home margin | +1.94 | +1.45 | -0.49 |

These are close enough for a v0.10.0 shadow calibration baseline; v2 is not intended to reproduce every v0.9 box score exactly.

## Checkpoint 4 — frozen calibration contract
The calibration report is now treated as generated evidence, not a hand-maintained note.

- `tools/game-engine-v2-calibration-stamp.js` fingerprints `game-engine-v2.js`, `game-engine-v2-adapter.js` and the comparison harness.
- `tests/game-engine-v2-calibration-report.js` rejects stale reports.
- Guardrails bound deltas for scoring, pace, yardage, turnovers, TD/FG/punt mix, home win rate, home margin and coarse team-strength buckets.
- Any material v2 engine/adapter calibration change must regenerate `docs/v0100-CALIBRATION.json` before the normal full suite can pass.

## Explicit non-goals so far
- No player stat attribution yet (v0.10.1).
- No coaching decision windows yet (v0.10.2).
- No polished Watch/Broadcast UI or persistent browser resume surface yet (v0.10.3).
- No replacement of Quick Sim or the current detailed Game Lab.
- No production publication.

## Next bounded slice
Add a development-only Game Lab shadow preview using the real scheduled matchup and gameplan-adjusted profiles. It should show v2 score, clock/down/field state and event stream entirely in memory. It must not complete the scheduled game, alter standings/player stats, write saves or supersede the current detailed engine.
