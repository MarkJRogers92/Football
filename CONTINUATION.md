# Dynasty Lab — v0.9.5 production checkpoint

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `codex/v095-coach-relationships`
Production branch: `gh-pages`
Production: v0.9.5 at https://markjrogers92.github.io/Football/

## Current release

v0.9.5 is validated and promoted to production. It builds on v0.9.4 persistent
coaching careers by making coach relationships portable across schools.

- recruits store a stable primary recruiter and coach-specific relationship map;
- school interest remains separate from coach relationship;
- relationship boost follows a stable coach ID when the coach changes schools;
- commitments receive pressure only and are never auto-flipped by movement;
- current players tied to a departing coach receive bounded transfer risk;
- the coach's new school gains transfer-destination pressure;
- firing/retirement can create fallout even when there is no new school;
- the existing carousel can produce a capped number of real cross-school coordinator moves;
- Preseason/Weekly Hub surfaces recruiting fallout;
- old saves migrate additively from existing recruiting memory.

## Validation checkpoint

The v0.9.5 validation run completed successfully before production promotion:
- 52/52 engine smoke checks;
- 31/31 Node persistence/game/portrait/promise/transfer/coach/relationship tests;
- 69/69 desktop + iPhone-layout browser checks;
- 6 real-browser IndexedDB persistence scenarios;
- two-season simulation audit;
- successful GitHub Pages production deployment.

## Explicitly not in v0.9.5

No user interviews, candidate market, competing offers, salary negotiation, staff
budgets or open-job state machine. Those are the v0.9.6 coaching-market slice.
No coach move directly flips a committed recruit.

## Storage guardrail

Read `STORAGE.md` before altering saves. v0.9.5 adds only fields to existing
recruit/player records and ordinary dynasty events. IndexedDB remains schema 2.

## Next roadmap sequence

### v0.9.6 — Coaching Market
- openings and candidate pool;
- interviews and offers;
- salary / years / role / play-calling authority;
- internal promotions and AI hiring based on fit;
- old stint closes and new stint opens without duplicating coach identity.

Keep this bounded. Do not fold scholarship scarcity, pulled offers, scheme-change
hangover or position-change agency into the same milestone.

Then proceed to scholarship scarcity/pulled offers, scheme-change hangover,
position-change willingness, record chases, high-school feedback and broader
story-surface work.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `ROADMAP_V09.md`. v0.9.5 coach relationship
portability is the current production release; do not redo promises, transfers,
Game Center, Portrait V1, persistent coach careers or coach relationship
portability. The next new gameplay slice is v0.9.6 Coaching Market. Work in a
new bounded branch, validate fully, publish a preview first, then promote only
after review.
