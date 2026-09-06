# v0.10.0 Game Engine 2 — Implementation Status

## Baseline
- Source branch: `codex/v0100-game-engine-2`
- Parent: validated v0.9.56 source `66c7375bc21d1edfa475aa173789da721935f07fbf`
- Production remains v0.9.56.
- Quick Sim and the current detailed Game Lab remain unchanged as result-recording paths.

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

Current 120-game calibration candidate:

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
The calibration report is generated evidence, not a hand-maintained note.

- `tools/game-engine-v2-calibration-stamp.js` fingerprints the v2 engine, adapter and comparison harness.
- `tests/game-engine-v2-calibration-report.js` rejects stale reports.
- Guardrails bound scoring, pace, yardage, turnovers, TD/FG/punt mix, home win rate, home margin and coarse team-strength buckets.
- Material v2 engine/adapter calibration changes must regenerate `docs/v0100-CALIBRATION.json` before the normal full suite can pass.

Frozen-guardrail synchronized checkpoint: `6e6be9dc632917641fe0e71452c0c193f5ce2d89`.

## Checkpoint 5 — development-only Game Lab shadow preview
New modules:
- `game-engine-v2-lab.js`: pure preview/presentation helpers for deterministic v2 games, clock labels, down/field context, event prose and summary markup.
- `game-engine-v2-lab-integration.js`: injected Game Lab bridge that builds gameplan-adjusted profiles from cloned live teams and runs the v2 preview entirely in memory.
- `game-engine-v2-lab.css`: compact scoreboard/event-feed presentation.
- `tests/game-engine-v2-lab.js`: deterministic preview and presentation coverage.

The Game Lab panel is explicitly **shadow only**:
- it does not mark the scheduled game played;
- it does not call `recordGame()` or `completeScheduledGame()`;
- it does not alter standings, player stats, game archive, event archive or save state;
- gameplan wear is charged only to cloned teams;
- an integrity snapshot is checked before/after every preview and throws if live dynasty state changes;
- replaying uses the same deterministic seed for the same season/week/matchup.

This is a development validation surface, not the v0.10.3 polished Watch/Broadcast mode.

## Explicit non-goals so far
- No player stat attribution yet (v0.10.1).
- No coaching decision windows yet (v0.10.2).
- No polished Watch/Broadcast UI or persistent browser resume surface yet (v0.10.3).
- No replacement of Quick Sim or the current detailed result-recording path.
- No production publication.

## Next bounded slice
Verify the shadow panel in the synchronized standalone artifact, then add a controlled v0.10.0 result adapter capable of converting a completed v2 state into the existing game-record shape **without enabling it by default**. Test score/identity/archive compatibility first. Only after that should a development toggle be allowed to complete one scheduled user game through v2.
