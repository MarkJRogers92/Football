# v0.10.1 Game Engine 2 — Recorded-Game Transaction Status

## Baseline
- Working branch: `codex/v0101-v2-recorded-game`
- Parent synchronized dry-run checkpoint: `4684c4e9ed4abcfb6cc72d35ef98c22b92801b3c`
- Production remains v0.9.56.
- Quick Sim and the existing v0.9 recorded Detailed Game path remain unchanged.

## Completed foundation
The v2 path already has:
- deterministic clock-aware Game Engine 2 simulation;
- explicit pass/rush/sack event semantics;
- real-player attribution for offense, defense and specialists;
- strict player/team/event reconciliation;
- 120-game calibration inside frozen guardrails;
- an archive-compatible transaction candidate;
- 40 seeded attribution-to-transaction dry runs that mutate clones only.

## Current gate — development-only recorded game
This branch adds an explicit `Record with V2 (Dev)` path for the current regular-season user game only. It is intentionally isolated from production and from Quick Sim.

The commit sequence is:
1. resolve the current scheduled user game and existing Coach's Desk/career guards;
2. run weekly recovery once;
3. capture a rollback snapshot of every live surface the v2 commit may touch;
4. call the existing `beginGame()` boundary so preparation wear is charged exactly once;
5. simulate v2, attribute real players and require reconciliation;
6. require the existing transaction dry-run PASS before live mutation;
7. apply exact player deltas and the existing team-record contract;
8. run existing post-game condition/injury logic;
9. convert the clock-aware v2 event stream into durable drive/play-by-play records;
10. use the existing `finishGame()` archive boundary;
11. use the existing `completeScheduledGame()` schedule/rivalry boundary;
12. validate schedule, archive, team record and every player-stat delta;
13. rank and persist the gameplay RNG snapshot.

## Rollback contract
Any exception after the rollback snapshot restores:
- the scheduled game object;
- home/away W-L, conference record, PF/PA, SOS, rank and fan support;
- home/away gameplan and rivalry state;
- every home/away roster player object in place, including stats, wear, health and injury history;
- game archive length/version;
- universe event length and `nextEventId`;
- game counter;
- `latest` and `lastDetailedGame`;
- all team ranks;
- the gameplay RNG snapshot.

The rollback implementation restores player objects in place rather than replacing roster arrays so existing references and indexes remain valid.

## Watch / Game Center compatibility
V2 event streams are grouped into archived drive records with generated play-by-play text. The v2 archive recalculates `scoreAdjustment` against those actual drive points so touchdowns, PAT/two-point outcomes and safeties reconcile exactly in Watch Mode.

## Validation added in this gate
A dedicated browser regression will:
- start a fresh dynasty;
- run an injected failure after archive creation and require byte-equivalent rollback state;
- require the shadow transaction dry-run PASS;
- permanently record one current scheduled game with v2;
- verify exactly one archive/game-counter/team-game increment;
- verify the schedule points to the v2 archive;
- verify real-player lines and durable drive detail exist;
- verify drive points plus score adjustment equal the final score;
- reopen the game from the Season schedule;
- render its permanent Box Score and archived Play-by-Play;
- fail on browser console/page errors.

## Still not a production cutover
This is a development gate, not a release authorization. Even after it passes, production remains v0.9.56 until a separate release decision. The next decision after validation is whether to run a multiweek v2 recorded-game soak and then make v2 the user Detailed Game engine; Quick Sim should remain unchanged until that soak is clean.
