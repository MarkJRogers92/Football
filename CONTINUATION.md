# Dynasty Lab — v0.9.5 preview checkpoint

Repository: https://github.com/MarkJRogers92/Football
Development branch: `codex/v095-coach-relationships`
Production branch: `gh-pages`
Production remains v0.9.3 at https://markjrogers92.github.io/Football/

## This bounded batch

v0.9.5 makes coach relationships portable on top of v0.9.4 persistent coaching careers.

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

## Explicitly not in v0.9.5

No user interviews, candidate market, competing offers, salary negotiation, staff
budgets or open-job state machine. Those are the v0.9.6 coaching-market slice.
No coach move directly flips a committed recruit.

## Storage guardrail

Read `STORAGE.md` before altering saves. v0.9.5 adds only fields to existing
recruit/player records and ordinary dynasty events. IndexedDB remains schema 2.

## Next roadmap sequence

### v0.9.6 — Coaching market
- openings and candidate pool
- interviews and offers
- salary / years / role / play-calling authority
- internal promotions and AI hiring based on fit

Then scholarship scarcity/pulled offers, scheme-change hangover, position-change
willingness, record chases, high-school feedback and story-surface work.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `ROADMAP_V09.md`. v0.9.5 coach relationship
portability is the current preview milestone; do not redo promises, transfers,
Game Center, Portrait V1 or persistent coach careers. Validate the v0.9.5 preview
before production. The next new gameplay slice is v0.9.6 coaching market.
