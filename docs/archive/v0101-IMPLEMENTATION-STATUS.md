# v0.10.1 Player Attribution — Implementation Status

## Baseline
- Branch: `codex/v0101-player-attribution`
- Parent: synchronized v0.10.0 Game Lab shadow preview `2da9612922b70c7b8b0b58b20ab78795d5e0fcb5`
- Production remains v0.9.56.
- Quick Sim and the current recorded Detailed Game path remain unchanged.

## Checkpoint 1 — attribution-ready play semantics
The shadow adapter now persists the football meaning of each offensive snap into the v2 event stream:
- pass vs rush;
- completion vs incompletion;
- sacks;
- interceptions;
- rushing and quarterback fumbles.

Pass outcomes now explicitly model completions, incompletions and sacks rather than treating every non-turnover pass as generic yardage. The calibration workflow must therefore be rerun before this checkpoint can be considered distribution-safe.

## Checkpoint 2 — pure real-player attribution engine
`game-engine-v2-attribution.js` consumes a completed v2 state plus immutable depth-chart/player context and produces player game lines without mutating the dynasty.

Currently attributed:
- QB attempts, completions, yards, TD, INT and sacks taken;
- RB/QB carries, rushing yards, TD and fumbles;
- receiver targets, catches, yards, TD, drops and YAC;
- defensive tackles, TFL, sacks, pressures, interceptions, pass breakups and forced fumbles;
- offensive-line snaps and sack/pressure blame;
- field goals and punts.

The module uses a separate deterministic attribution RNG domain so the same v2 game state produces the same player box without changing the simulation outcome.

## Reconciliation contract
The attribution result is rejected unless all of these reconcile exactly:
- team pass attempts/completions/yards/TD/INT vs player passing totals;
- team rushing attempts/yards/TD vs player rushing totals;
- receptions/receiving yards/TD vs passing production;
- total targets vs pass attempts;
- team turnovers vs INT + lost fumbles;
- sacks allowed vs opponent defensive sacks;
- interceptions thrown vs opponent defensive interceptions;
- fumbles lost vs opponent forced fumbles;
- kicking and punting totals;
- pass yards + rush yards vs the v2 event-stream yardage total;
- total offensive plays vs pass attempts + rush attempts.

Sack losses use the college-stat convention and are charged to quarterback/team rushing production while remaining separately visible as sacks taken.

## Game Lab development surface
The existing shadow preview now builds immutable player context from the real depth chart/role system and shows shadow leaders for passing, rushing, receiving and defense. Its safety checksum now includes aggregate live roster statistics, so the preview aborts if it changes player stats in addition to standings/archive/schedule state.

## Explicit non-goals at this checkpoint
- No v2 result is recorded into standings or history.
- No v2 player line is applied to season/career stats.
- No injury/fatigue mutation from v2 yet.
- No live cutover from Quick Sim or Detailed Game.
- No production publication.

## Next gate
1. Rerun the 120-game v0.9.56-vs-v2 calibration with the explicit pass/incompletion/sack model.
2. Tune only if the frozen distribution guardrails fail.
3. Run targeted player-attribution tests and full validation on the synchronized artifact.
4. Once stable, add a development-only transactional `Sim with Game Engine 2` path that applies the reconciled player box to cloned dynasty state first, then validates archive compatibility before any real cutover.
