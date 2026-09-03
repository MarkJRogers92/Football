# Dynasty Lab — v0.9.4 preview checkpoint

Repository: https://github.com/MarkJRogers92/Football
Development branch: `codex/v094-coaching-careers`
Production branch: `gh-pages`
Production remains v0.9.3 at https://markjrogers92.github.io/Football/

## This bounded batch

v0.9.4 adds persistent coaching careers on top of the completed v0.9.0 promises, v0.9.1 transfers, v0.9.2 Game Center and v0.9.3 Portrait V1.

- Active coaches keep stable IDs, school/role identity, specialties, season rows and career stints.
- Completed seasons are recorded before staff turnover, including real tracked wins/losses, conference titles, national titles and Coach of the Year.
- Fired, departed and retired coaches are preserved rather than deleted.
- A bounded internal coordinator-to-HC promotion path exercises role continuity without building the full market.
- A stable-ID `moveCoach()` foundation supports later cross-school hiring and verifies that player/recruit coach references survive a move.
- Staff and former-coach names open a career profile with descriptive traits and timeline; hidden personality numbers remain hidden.
- Old saves normalize additively. Unknown past results are not invented. Portable JSON keeps coach careers/archive.

## Explicitly not in v0.9.4

No interviews, candidate market, competing offers, salary negotiation, staff budgets, broad poaching system, or recruit/player relationship portability. Those remain later slices.

## Validation / release rule

The branch implementation must pass the existing engine/storage/persistence/promise/transfer/game/portrait suites plus new coach tests, build successfully, and pass desktop + 390px browser UI checks. Publish only a preview for review. Do not promote production automatically. Actual iPhone Safari remains separate real-device validation.

## Storage guardrail

Read `STORAGE.md` before altering saves. Game archives remain in the core save and were previously measured at about 6.6 MB per full 745-game season; 30–50-year mobile performance is not proven. This coaching batch does not change IndexedDB schema or prune history.

## Next roadmap sequence

### v0.9.5 — Coaches take relationships with them
- primary recruiter links
- tuned portable recruit relationship when a coach changes schools
- current-player transfer-risk / destination pressure toward recruiter
- new school gains pressure, never an automatic flip
- Weekly Hub recruiting fallout

### v0.9.6 — Coaching market
- openings and candidate pool
- interviews and offers
- salary/years/role/play-calling authority
- internal promotions and AI hiring based on fit

Then continue scholarship scarcity/pulled offers, scheme-change hangover, position-change willingness, record chases, high-school feedback and story-surface work. Preserve the existing decommit/flip implementation rather than rebuilding it.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`, `STORAGE.md`, `CHANGELOG.md` and `ROADMAP_V09.md`. v0.9.4 persistent coaching careers is the current preview milestone; do not redo promises, transfers, Game Center or Portrait V1. Review/validate the v0.9.4 preview before production. The next new gameplay slice is v0.9.5 coach relationship portability.
