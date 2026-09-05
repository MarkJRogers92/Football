# v0.9.48 — Schedule Rotation and Protected Rivalries

## Goal

Stop repeating the same schedule forever and make rivalry identity independent
of accidental schedule eligibility.

## Scheduling model

- Persist `universe.scheduleRotation` with season index and conference rotation
  state.
- Each 12-team conference plays eight league games.
- Guarantee one protected rival annually.
- Rotate the other ten opponents so every team meets every non-rival within a
  bounded cycle.
- Reverse home/away for repeated pairings before granting a third home game.
- Generate four nonconference games with repeat avoidance and sensible home/away
  balance.
- Use stable IDs for schedule generation; names remain display snapshots.

The algorithm must be deterministic from universe RNG state and season, then
validated for every team rather than patched after generation.

## Rivalry model

Persist designated rivalry IDs. Migration may keep the current derived rival for
existing saves. New universes choose the nearest feasible same-conference rival
and store it permanently. Track series, streak, trophy holder, last meeting,
largest margin and major postseason meetings. Support one protected rivalry now;
design arrays so a later second rivalry does not require another schema rewrite.

## Validation rules

For every season:

- exactly 12 regular-season games per team;
- exactly eight conference games;
- no self-games or duplicate weekly appearances;
- protected rival scheduled once;
- home/away distribution within the declared bound;
- all game objects shared consistently between universe and team schedules.

Across a rotation cycle:

- all conference opponents appear;
- no opponent is permanently omitted;
- home/away reversals occur;
- nonconference repeat rate stays below the calibrated threshold.

## Likely files

`app.js` `circlePair`, `buildSchedule`, rivalry derivation/history and schedule
rendering; normalization; new `tests/scheduling.js`; extend rivalries,
persistence, games and browser tests.

## Suggested commits

1. Add a pure schedule validator and pin current failure with a multi-year test.
2. Add stable protected-rival state and migration.
3. Implement conference rotation and home/away reversal.
4. Implement nonconference repeat avoidance.
5. Expand rivalry history and presentation; run a twelve-season schedule audit.

## Exit criteria

Twelve simulated seasons contain valid schedules, complete conference-opponent
coverage, protected annual rivalries and bounded home/away imbalance; saved
historical schedules never mutate when a future schedule is generated.

## Non-goals

No user scheduling UI, conference realignment, neutral-site kickoff games or
conference-size changes.

