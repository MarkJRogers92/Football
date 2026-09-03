# Dynasty Lab — v0.9.6 checkpoint

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `codex/v096-coaching-market`
Production branch: `gh-pages`
Production: v0.9.5 at https://markjrogers92.github.io/Football/ (v0.9.6 is validated on this branch but not yet published — see Next steps)

## Current release (this branch, not yet promoted)

v0.9.6 adds the Coaching Market on top of v0.9.5's coach relationship
portability.

- a vacancy on the controlled team opens a search instead of auto-filling; a
  weaker interim coach (ratings docked, half salary) holds the slot until the
  user acts, so an ignored search has a real, visible cost;
- AI-controlled teams are unaffected and keep resolving their own vacancies
  instantly, exactly as in v0.9.5;
- each opening gets a candidate market: two fresh candidates, up to two
  poachable coordinators/HCs from other programs, and (for Head Coach
  openings only) the team's own OC/DC as internal-promotion candidates;
- a candidate must be interviewed before an offer can be made; offers set
  salary, years and play-calling authority (full vs. shared) and are capped
  by a new per-team athletic department budget;
- hiring an external coach closes their old stint (their old program
  auto-fills its own vacancy immediately) and opens a new one under the same
  coach identity — no duplicated coach objects; promoting internally opens a
  follow-on search for the slot they vacated rather than leaving it unfilled;
- openings and the candidate market are core, portable universe state; old
  saves migrate additively, no IndexedDB schema change.

## Validation checkpoint

- 52/52 engine smoke checks;
- 39/39 Node persistence/game/portrait/promise/transfer/coach/relationship/
  coaching-market tests;
- 79/79 desktop + iPhone-layout browser checks, including a real
  interview → offer → hire click path through the Staff tab UI;
- 12-season `npm run longrun` audit, stable;
- a separate 8-season run with zero user interaction, confirming an ignored
  opening never duplicates, never silently auto-resolves, and the interim
  penalty persists as designed.

## Explicitly not in v0.9.6

No scholarship scarcity, pulled offers, scheme-change hangover, position-change
agency, competing-offer bidding wars between AI programs, or multi-week
negotiation — offers resolve immediately on submission. Those stay out of this
milestone per the v0.9.5 handoff's own "keep this bounded" note.

## Storage guardrail

Read `STORAGE.md` before altering saves. v0.9.6 adds `universe.openings` and
`universe.candidateMarket` as new top-level core fields (both migrated
additively by `normalizeCoachState()`), plus an optional `interim` flag and
`playCallAuthority` on coach objects. IndexedDB schema is unchanged.

## Next steps

This branch (`codex/v096-coaching-market`) is validated but **not yet
published**. Per the standing workflow: publish a preview build first
(`npm run publish:preview -- v096-coaching-market`), have it reviewed, and
only then promote to production (`npm run publish`) and fast-forward the
main working branch.

### v0.9.7 and beyond (not started)

Proceed to scholarship scarcity/pulled offers, scheme-change hangover,
position-change willingness, record chases, high-school feedback and broader
story-surface work — pick one bounded slice at a time, same as v0.9.4–v0.9.6.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `ROADMAP_V09.md`. v0.9.6 Coaching Market is
validated on `codex/v096-coaching-market` but production is still v0.9.5 until
it is previewed and promoted. Do not redo promises, transfers, Game Center,
Portrait V1, persistent coach careers, coach relationship portability or the
coaching market. Work in a new bounded branch, validate fully, publish a
preview first, then promote only after review.
