# v0.10 — Game Engine 2

## Goal

Turn detailed games from precomputed drive stories into clock-, field- and
decision-aware simulations without requiring the user to call every play.

## Core state

Persist a compact game event model containing quarter, clock, possession, field
position, down, distance, score, timeouts and event result. Derive presentation
and play-by-play prose from events. Save an in-progress controlled game so closing
the browser does not forfeit it.

## Simulation stages

1. Possession setup and kickoff.
2. Situation-aware play selection from scheme, staff authority and gameplan.
3. Player matchup resolution.
4. Clock/timeout update.
5. Fourth-down or scoring decision.
6. Injury/wear update.
7. End-of-period, halftime, regulation and overtime transitions.

## User decision windows

Pause only for high-leverage choices:

- fourth down;
- two-point attempt;
- late-half clock posture;
- protect-lead versus remain aggressive;
- injured or ineffective quarterback decision;
- pressure versus coverage posture;
- onside-kick decision.

Every window needs a delegate option based on the relevant coach. Repeated low-
impact prompts should be suppressed.

## Statistical and archive constraints

- Team score must reconcile exactly with stored scoring events.
- Player totals must equal event-derived totals.
- Existing quick simulation remains available and statistically calibrated.
- Old archived games continue to render through the v1 adapter.
- New game detail must not recreate the prior storage-growth problem; encode
  structured events compactly and derive prose.

## Likely files

New game-engine modules from packet 06; Game Lab/watch presentation; archive
adapter; game/storage tests; new seeded distribution, clock and decision suites.

## Delivery slices

1. v0.10.0: state machine, clock, field position, scoring and overtime.
2. v0.10.1: player attribution and statistical reconciliation.
3. v0.10.2: interactive coaching windows and delegation.
4. v0.10.3: broadcast presentation and resumable in-progress games.
5. v0.10.4: calibration, archive compaction and release hardening.

## Exit criteria

Seeded games never violate clock/down/score/stat invariants; interrupted games
resume; coaching choices measurably affect risk rather than guaranteeing results;
quick and detailed engines remain within accepted distribution bounds.

## Non-goals

No every-play play-calling, 3D animation, physics engine or real-world playbook
licensing.

