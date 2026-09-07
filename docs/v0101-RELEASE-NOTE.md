# Dynasty Lab v0.10.1 — Interactive Game Day

Status: **PREVIEW CANDIDATE**  
Production baseline: **v0.10.0**  
Release branch: `codex/v0101-gameday-coaching`

## What changes

v0.10.1 turns Game Engine 2 into a player-facing head-coach experience while preserving the calibrated football model when decisions are delegated.

### Interactive Game Day

- live scoreboard with quarter, clock, possession, field position, down/distance and timeouts
- live play feed
- staged game state that does not mutate the dynasty until the final is made official
- permanent recording through the existing rollback-protected Game Engine 2 transaction path
- real-player statistics, drives and durable play-by-play
- coaching decisions retained in the permanent Game Center archive

### Head-coach decision windows

- fourth down: go for it / punt / field goal / delegate
- late-game tempo: hurry / normal / drain clock / delegate
- halftime adjustment: aggressive / balanced / ball control / delegate
- meaningful late-game conversion: kick PAT / go for two / delegate
- opponent decisions remain staff-controlled rather than prompting the user
- decision state is deterministic and resumable

### Game Day Intelligence

- six matchup edges using the same profiles consumed at kickoff
- opponent run/pass tendency
- injuries and availability
- key players
- rivalry, conference and home-field context
- active weekly game plan and staff recommendation

### Postgame Plan Receipt

The archived result is graded against the intended target of the weekly plan. The receipt reports whether the target result worked, missed or was mixed without claiming the plan alone caused the outcome.

## Validation completed before preview release

Focused v0.10.1 hardening is green for:

- deterministic decision tests
- Game Engine 2 targeted suite
- frozen v0.10 calibration guardrails
- staged Game Day zero-mutation browser test
- injected-failure rollback + permanent Game Day commit
- matchup intelligence + plan receipt browser test
- 12-game Interactive Game Day regular-season soak
- conference championship / bowl / playoff regression
- Year 1 → postseason → offseason → Year 2 Interactive Game Day lifecycle
- 390px mobile Game Day regression
- targeted Interactive Game Day IndexedDB Save/Load regression
- simulation audit

The preview release workflow must additionally rerun the standard engine, browser UI/visual, generic IndexedDB and audit suites against the v0.10.1 versioned standalone artifact before publishing.

## Production safety

This release is preview-only until explicitly promoted. Production must remain v0.10.0 during preview validation.
