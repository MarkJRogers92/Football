# v0.10.0 Game Engine 2 — Implementation Status

## Baseline

- Source branch: `codex/v0100-game-engine-2`
- Parent: v0.9.56 validated source `66c7375bc21a359ef3b401ea8143d83a7a2b2f48`
- Production remains v0.9.56.
- Quick Sim and the current detailed Game Lab are intentionally unchanged.

## Checkpoint 1 — state machine foundation

Added `game-engine-v2.js` as an isolated UMD/CommonJS module using the existing deterministic `DynastyRng` contract.

The v2 state owns quarter/clock, monotonic elapsed time, possession, offense-relative field position, down/distance, score, timeouts, kickoff state, compact events, exact RNG snapshot, and college-style overtime state.

Core transitions cover kickoffs, scrimmage gains/losses, first downs, turnovers, turnover on downs, touchdowns/extra points, field goals, punts/touchbacks, safeties, quarter/halftime/regulation transitions, and overtime completion.

Targeted tests cover deterministic full games, exact JSON pause/resume, state invariants, score/event reconciliation, halftime edge cases, overtime, and a 100-seed audit.

Checkpoint 1 source commit: `127f23a192f79073e22e2e2e437d200cc4cd809c`.
Synchronized standalone build commit: `c6a5cf628c89dc8fbcf40df586d2a6bc82c05acd`.

## Checkpoint 2 — shadow calibration adapter

Added `game-engine-v2-adapter.js` as a non-mutating bridge from the existing `profiles()` / `gameProfiles()` shape into v2.

The adapter:

- accepts existing team identity plus separate offense, defense and overall profile snapshots;
- runs regulation outcomes against offense-vs-opponent-defense rather than collapsing both sides to one overall rating;
- creates isolated deterministic shadow games without touching dynasty state;
- derives team/game calibration summaries directly from compact v2 events;
- reports points, scrimmage plays, yards, turnovers, punts, field goals, touchdowns, possessions and overtime;
- aggregates bounded seed sets into stable mean calibration metrics.

This checkpoint is deliberately shadow-only. It does **not** replace `gameSim()`, record a shadow result, mutate standings/stats, alter saves, or expose a user-facing switch.

Targeted adapter tests verify profile conversion, input immutability, deterministic shadow games, event-derived metric reconciliation, offense/defense sensitivity across 120 matched seeds, and stable 100-seed aggregate metrics.

## Explicit non-goals so far

- No player stat attribution yet (v0.10.1).
- No user coaching decision windows yet (v0.10.2).
- No Watch/Broadcast UI or browser resume surface yet (v0.10.3).
- No replacement of Quick Sim or current detailed Game Lab.
- No production publication.

## Next bounded slice

Add a development-only comparison harness that feeds real `gameProfiles()` snapshots into v2 and measures old-vs-v2 distribution deltas across the same matchup set. Calibrate pace, scoring, yardage, turnovers, home-field and team-strength sensitivity before any live-path cutover.
