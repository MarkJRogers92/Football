# v0.10 Game Engine 2 Framework — GPT Review Handoff

**Reviewer**: Please read this entire document carefully. Evaluate the framework for soundness, risks, and feasibility.

---

## Context

**Repository**: `MarkJRogers92/Football` (Dynasty Lab — college football dynasty simulator)

**Current State**:
- v0.9.x: Quick-sim (fast, score + box score only, no clock/field awareness)
- Game Lab: Manual play-by-play (detailed, but precomputed outcomes)
- No mid-game pause/resume
- No interactive decisions during auto-play

**The Ask**: Review the v0.10 framework for:
1. Architectural soundness
2. Risk assessment adequacy
3. Deliverable clarity
4. Test coverage
5. Feasibility and scope creep
6. Technical concerns
7. Missing pieces
8. Overall confidence

---

## Framework Summary

**Goal**: Build a real, clock-aware, field-aware game engine with pauseable decision windows and resume capability.

**5 Delivery Phases**:
- v0.10.0: State machine, clock, field position, scoring
- v0.10.1: Player stats attribution and reconciliation
- v0.10.2: Interactive decision windows (4th down, 2-point, injured starters, etc.)
- v0.10.3: Watch UI and in-progress game resume
- v0.10.4: Calibration, archive compaction, release hardening

**Core Invariants**:
1. Score = sum of scoring events
2. Clock moves forward only
3. Field position stays 0-100
4. Down/distance accuracy maintained
5. Player stats totals = event-derived sums
6. Determinism: same seed = identical events

**Event Model**:
```typescript
type GameEvent = {
  quarter: 1|2|3|4|5,
  clock: number,
  possession: 'home'|'away',
  fieldPosition: number,
  down: 1|2|3|4,
  distance: number,
  score: [homeScore, awayScore],
  timeouts: {home, away},
  type: 'pass'|'rush'|'penalty'|'fieldgoal'|'touchdown'|'turnover'|'timeout'|'quarter_end'|'game_end',
  yardage: number,
  resultingDown: 1|2|3|4|null,
  resultingDistance: number|null,
  actors?: {offense, defense},
  seed: string,
};
```

**Files to Create**:
- game-engine-v2.js (state machine, tick loop, validation)
- game-decisions-v2.js (pause logic, decision options, delegation)
- game-actors.js (actor selection, matchup resolution, stats capture)
- game-presentation.js (prose, Watch UI, drive summaries)

**Tests**:
- Determinism: same seed = identical events
- Invariant validation: 1000 seeded games, all invariants hold
- Stats reconciliation: box score = event totals
- Distribution comparison: v0.9 vs v0.10 stat distributions match

---

## Review Questions

### 1. Architectural Integrity

- Does the event model adequately capture all necessary state without bloat?
- Is the 4-file separation (engine/decisions/actors/presentation) clear?
- Are the 6 invariants sufficient?
- Any structural gaps?

### 2. Risk Assessment

- Are identified risks realistic?
- Do mitigations address them?
- What risks are missing?
- Is backward compatibility (archive adapter) sound?

### 3. Deliverable Clarity

- Can you describe v0.10.0-v0.10.4 in one sentence each?
- Are success criteria testable?
- Are phase dependencies correct?

### 4. Testing Strategy

- Is determinism testing sufficient for resume validation?
- Are invariant tests adequate?
- Is distribution comparison realistic?
- Test gaps?

### 5. Feasibility & Scope

- Can v0.10.0 stay isolated from v0.10.1 requirements?
- Scope creep hiding anywhere?
- Effort estimate for experienced solo dev?

### 6. Technical Concerns

- "Sparse stat encoding" — adequately deferred to v0.10.1?
- "Decision window framework" — too vague in v0.10.2?
- RNG determinism strategy (seed from gameId + RNG.snapshot()) — sound? Edge cases on resume?

### 7. Missing Pieces

- Special teams plays (onside, FG blocks)?
- Overtime rules detail?
- Injury recovery timelines?
- Performance expectations?

### 8. Overall Assessment

- Ready to hand off for v0.10.0 implementation?
- What 2-3 things need clarification?
- Confidence level (1-10) that this ships without major re-architecture?

---

## Full Framework Document

(See attached: `docs/v010-game-engine-2-framework.md`)

The framework is complete and ready for review. Please address all 8 questions above.
