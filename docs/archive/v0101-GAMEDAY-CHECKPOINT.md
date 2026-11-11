# Dynasty Lab v0.10.1 — Interactive Game Day Checkpoint

Production remains **v0.10.0**. All work here is isolated on `codex/v0101-gameday-coaching`.

## Feature checkpoint — green through focused CI

The following are implemented and have passed the focused Game Day workflow, including staged browser play, frozen calibration, injected archive rollback and permanent recording:

- deterministic fourth-down decisions: go / punt / field goal / delegate
- user-sideline ownership; opponent decisions remain automatic
- paused/resumable deterministic Game Day sessions
- live scoreboard, clock, down/distance, field position, possession, timeouts and play feed
- exact staged result recorded through the existing v2 attribution/transaction/rollback path
- compact coaching-decision receipts in the permanent archive and Game Center play-by-play
- cloned weekly recovery + preparation so staged kickoff inputs exactly match the official transaction
- late-game tempo: hurry / normal / drain / delegate
- halftime adjustment: open it up / balanced / ball control / delegate
- meaningful Q4 touchdown conversion choice: PAT / two-point / delegate
- all-delegated Game Day remains equivalent to the frozen calibrated v0.10 adapter result apart from coaching-decision receipt events
- pregame Game Day Intelligence: matchup edges, opponent tendency, availability, key players, stakes, active plan and staff recommendation
- postgame Game Plan Receipt derived only from archived production; it grades the plan target without claiming unsupported causation

Latest focused gate with all of the above green: **V0.10.1 Game Day Decisions run 34076334883**.

## Current Game Day contract

`game-engine-v2-gameday.js` session version: **2**.

Interactive sessions carry:

- exact v2 game state and RNG
- controlled side
- calibrated matchup inputs
- late-game tempo strategy
- halftime approach
- pending touchdown conversion / strategy decision

Permanent archives retain compact coaching decision receipts, normal v2 player/team statistics, drives, play-by-play and the pregame game-plan snapshot.

## Release hardening — next

1. Prove a multiweek / full regular-season run using the Interactive Game Day transaction.
2. Re-run postseason v2 soak and confirm the new Game Day modules do not disturb conference/bowl/playoff settlement.
3. Re-run the two-season lifecycle soak.
4. Verify browser save / IndexedDB durability and clarify the contract for an in-progress Interactive Game Day session.
5. Add mobile Game Day / matchup regression.
6. Run simulation audit and broad browser suite.
7. Synchronize the generated standalone `index.html` only after the source tree is stable.
8. Prepare and publish **v0.10.1 preview only** for hands-on testing.
9. Production remains v0.10.0 until explicitly authorized.

Do not weaken calibration, transaction, rollback or lifecycle assertions to make a release gate pass.
