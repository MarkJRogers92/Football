# Dynasty Lab v0.9.53 release candidate

Branch: `codex/v0953-recruiting-development-polish`

This release candidate makes recruiting and player development easier to understand, act on and remember while preserving the simulation and hidden-information model already in the game.

## Included

- save-safe player-facing metadata for all 69 archetypes, including clearer labels, strengths, tradeoffs and usage explanations;
- detailed Spring Development and Fall Camp receipts with exact visible changes, position-group summaries, movers, filters and player detail;
- observed growth-pattern clues that require repeated camp evidence and adequate staff confidence, never the hidden growth curve;
- a global Next Action button and checklist that reuse `weeklyPlan()` and route to decisions without blindly advancing the calendar;
- a bounded weekly recruit-evaluation budget with Quick Film and Full Evaluation actions;
- fallible Staff Verdicts based only on current staff information;
- a three-prospect Recruit Compare tray and staff shortlist driven by projected roster needs;
- immutable signing snapshots and later scouting-receipt outcomes, with evidence gates for watch and final labels;
- mobile recruiting layout corrections and reliable portrait rendering for signing cards;
- startup, deterministic browser-flow and current IndexedDB/save-slot regression coverage.

The release tree is additive and preserves existing saves. Production remains v0.9.52 until this candidate is deliberately previewed, approved and published.
