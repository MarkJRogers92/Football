# v0.10.0 Game Engine 2 — Implementation Status

## Baseline

- Source branch: `codex/v0100-game-engine-2`
- Parent: v0.9.56 validated source `66c7375bc21a359ef3b401ea8143d83a7a2b2f48`
- Production remains v0.9.56.
- Quick Sim and the current detailed Game Lab are intentionally unchanged in this checkpoint.

## Checkpoint 1 — state machine foundation

Added `game-engine-v2.js` as an isolated UMD/CommonJS module using the existing deterministic `DynastyRng` contract.

The v2 state now owns:

- quarter and regulation clock;
- monotonic elapsed game time;
- possession;
- offense-relative 0–100 field position;
- down and distance;
- score and timeouts;
- opening/second-half kickoff possession;
- compact ordered events;
- RNG snapshot required for exact JSON pause/resume;
- college-style overtime possessions, including second-OT two-point requirements and third-OT shootout structure.

Implemented core transitions for:

- kickoffs and possession changes;
- scrimmage gains/losses and first downs;
- turnovers and turnover on downs;
- touchdowns and extra points;
- field goals;
- punts/touchbacks;
- safeties;
- quarter/halftime/regulation transitions;
- overtime entry and completion.

The module also includes a deliberately simple deterministic outcome generator so complete seeded games can exercise the state machine. It is **not** yet the calibrated v0.10 gameplay model and is not wired into live dynasty simulation.

## Invariants and targeted tests

`tests/game-engine-v2.js` covers:

- valid initial football state after kickoff;
- down/distance and mirrored possession transitions;
- first downs, touchdowns and turnover on downs;
- quarter and halftime state changes;
- no phantom post-score kickoff at 0:00 before halftime;
- same-seed full-game determinism;
- different-seed event divergence;
- JSON mid-game snapshot/restore producing the identical future;
- tied regulation entering and resolving college overtime;
- 100 seeded full games with final non-ties, bounded event logs and exact score/event reconciliation.

Local targeted result before push: **8/8 tests passed**.

## Explicit non-goals for this checkpoint

- No player stat attribution yet (v0.10.1).
- No user coaching decision windows yet (v0.10.2).
- No new Watch/Broadcast UI or browser resume surface yet (v0.10.3).
- No replacement of `gameSim()` or the existing detailed Game Lab.
- No production publication.

## Next bounded slice

After this checkpoint validates, add a v0.10 adapter that can construct v2 team inputs from existing game profiles and run shadow simulations beside the current engine. Compare score, pace, yardage and turnover distributions without changing user-visible results. That provides calibration evidence before any live-path cutover.
