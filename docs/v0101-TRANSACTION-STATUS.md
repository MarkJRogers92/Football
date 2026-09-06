# v0.10.1 Game Engine 2 — Transactional Integration Status

## Baseline
- Branch: `codex/v0101-transactional-v2`
- Parent: synchronized player-attribution checkpoint `42c77e04a73d4c556ae69de7e747992854b20ff4`
- Production remains v0.9.56.
- Quick Sim and the existing recorded Detailed Game path remain unchanged.

## Purpose
This slice proves that a fully simulated and attributed Game Engine 2 result can satisfy Dynasty Lab's existing team, player and game-archive contracts before any live scheduled game is allowed to use v2.

## Pure transaction module
`game-engine-v2-transaction.js` provides a development-only transaction contract:
- builds a candidate result from a final v2 state plus reconciled player attribution;
- adds game/start appearance deltas using supplied starter IDs;
- validates team boxes, player IDs and the existing player-stat schema;
- directly applies player stat deltas to cloned roster objects;
- updates cloned W/L, conference record, PF/PA and SOS;
- builds an archive candidate shaped like the current `finishGame()` record;
- computes the same score-adjustment concept used by the current archive;
- rejects ties, unknown players, unknown stats, duplicate player lines and malformed boxes;
- verifies the source teams remain byte-for-byte unchanged during a dry run.

## Game Lab proof surface
The existing v2 Shadow Preview now performs the transaction dry run automatically after simulation and attribution. A PASS receipt means:
1. the clock-aware v2 game finished;
2. real-player stats reconciled to team/event totals;
3. the result could be applied to cloned team/player season state;
4. an archive candidate passed the compatibility checks;
5. the live dynasty remained untouched.

This is still not a live result button.

## Tests
`tests/game-engine-v2-transaction.js` covers:
- candidate shape and score/box mapping;
- cloned team record/player-stat mutation with original immutability;
- archive core-contract shape and score adjustment;
- rejection of unknown players/stat keys;
- 40 seeded full v2 -> attribution -> transaction dry runs.

## Explicit non-goals
- No scheduled game is marked played by this module.
- No game is appended to `universe.gameArchive`.
- No universe event is written.
- No injuries/post-game condition mutation yet.
- No live v2 cutover.
- No production publication.

## Next gate
After the synchronized branch passes targeted and full validation, add a development-only transactional commit path behind an explicit Game Lab action. That path must be all-or-nothing: prepare and validate the result first, then apply record/player/archive/schedule changes exactly once, with rollback on any failure. Quick Sim remains unchanged until the v2 recorded-game path survives multiweek simulation and archive regression tests.
