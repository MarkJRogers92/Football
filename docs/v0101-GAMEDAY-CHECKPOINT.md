# Dynasty Lab v0.10.1 — Interactive Game Day Checkpoint

Production remains **v0.10.0**. All work here is isolated on `codex/v0101-gameday-coaching`.

## Green through focused CI

The following are implemented and have passed the focused Game Day workflow, including the staged browser game and permanent rollback/commit regression:

- deterministic fourth-down decision windows
- user-sideline ownership (opponent fourth downs remain automatic)
- paused/resumable Game Day sessions
- live Game Day scoreboard, clock/down/field/possession/timeouts and play feed
- permanent recording of the exact staged result through the existing rollback-protected transaction path
- coaching-decision receipts in permanent archive / Game Center play-by-play
- cloned weekly recovery + preparation so staged kickoff inputs exactly match the eventual permanent transaction
- late-game tempo: hurry / normal / drain / delegate
- halftime adjustment: open it up / balanced / ball control / delegate
- all-delegated Game Day remains equivalent to the frozen calibrated adapter result apart from coaching-decision receipt events

Latest known-green focused gate before two-point work: workflow `V0.10.1 Game Day Decisions`, with targeted engine tests, frozen calibration, browser Game Day, injected archive rollback and permanent commit all passing.

## Current Game Day contract

`game-engine-v2-gameday.js` session version: **2**.

Interactive sessions carry:

- exact v2 game state and RNG
- controlled side
- calibrated matchup inputs
- late-game tempo strategy
- halftime approach
- pending strategy decision

Permanent archives retain compact coaching decision receipts and normal v2 player/team statistics.

## Next bounded task

Implement meaningful late-game **two-point conversion decisions** without faking the decision after an automatic PAT.

Preferred architecture:

1. Add an opt-in deferred-conversion capability to Game Engine 2.
2. Ordinary/AI/legacy v2 simulation remains unchanged by default.
3. Interactive Game Day enables deferred regulation conversions.
4. After a controlled-team touchdown in a meaningful late-game score state, pause before conversion.
5. Options: kick PAT / go for two / delegate.
6. Delegate must reproduce the current automatic PAT behavior and RNG stream.
7. Resolve the conversion before any kickoff or period transition.
8. Same seed + same choice must resume identically.
9. Conversion choice and result must be archived in normal play-by-play and coaching receipts.
10. Run core v2, calibration, staged browser, injected rollback, and permanent commit gates before proceeding to Slice 5.

Do not loosen calibration or transaction assertions to make the feature pass.
