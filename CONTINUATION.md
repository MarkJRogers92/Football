# Dynasty Lab — v0.9.1 preview checkpoint

Repository: https://github.com/MarkJRogers92/Football
Branch: `codex/v081-save-continuation`
Base for this batch: `a9b38ecee4b97b02fda3a62c7ff0535f8011c800`

## Completed

v0.9.1 transfer destinations/history, on top of v0.9.0 promises and milestone 1
safe archive persistence. Do not redo those milestones.

- Contextual, capacity-aware destinations; same player object moves.
- Recruiting memory on commitments/signees; coach ties remain keyed by ID.
- Permanent transfer history and events; player profiles show where/why they moved.
- Upcoming former-player matchup alerts (no unsupported starter claims).
- Correct rollover: season totals reset after archival; career totals remain one
  continuous career. Class year follows eligibility; injuries/redshirts survive.
- No-seat transfers persist in `universe.transferPortal`, searchable by name and
  shown in the departing school's Offseason movement list; retry next offseason.
- Remaining ACTIVE promises release on cuts/departures; past breaches remain.

## Play

Use the latest URL supplied in the task or outputs/VERCEL_PREVIEW_CHECKPOINT.md.
Production stays unchanged. Export from the previous preview and Import here to
continue, or start fresh. Finish a season and offseason, open transferred players'
profiles, and look for FAMILIAR FACE when a former player is on the next opponent.

## Validation

52 engine checks including eight seasons; 14 persistence/promise/transfer test
groups; 45 desktop/mobile-layout browser checks; five real IndexedDB scenarios.
Tests cover a 600-draw destination weighting check, capacity, no self-transfer,
one player/one career, season rollover, save/load/export, pending portal saves,
coach relocation scoring and former-player alerts.
Three-season audit: 55, 45, 59 transfers; zero pending; rosters 85–105 after rollover.
Final recruiting: 15–30 signees/team (mean 23.3), flips 4.3%.
Build, syntax and diff checks passed. Actual iPhone Safari remains untested.

## Boundaries / known limitations

Transfer frequency was retained, not raised: audit ~0.4–0.5/team/season. AI does
not yet make promises, so the audit's zero broken-promise transfers is expected.
Recruiting finalists are a commitment-time fit snapshot, updated on flips.
Known offers include accepted school and explicit promise school; no general
scholarship-offer mechanic exists yet. Older players retain unknown recruiting
history rather than invented data. Fallback proximity uses their departing school.
Coach-linked destination scoring is ready for future coach movement, but this
batch does not add hiring/careers. Pending players retain their last eligibility
and development state; there is no off-campus progression model.
Events, recruiting memory and portal records live in the core save. IndexedDB
schema remains 2. Archived player transfer history uses existing append-only
chunks. Read STORAGE.md before changes to save handling.

## Budget agreement and next step

User has a small remaining credit budget. Work on ONE small batch, test the
relevant flows, build, commit, publish a playable preview, update this handoff,
then STOP for feedback. No subagents, production promotion or default-branch push.
Old saves are expendable; safe future saves are the priority.

Next agreed roadmap milestone: **v0.9.2 permanent Game Center / box scores**,
before deeper coaching work. Read that section of ROADMAP_V09.md, inspect retained
game data, and keep the first slice small. Only display statistics actually
tracked. Stable game IDs, historic team snapshots and durable game storage matter.

## Resume prompt

Continue Dynasty Lab from Football branch codex/v081-save-continuation. Read
CONTINUATION.md and STORAGE.md. v0.9.1 transfers is complete. Work on the next
agreed bounded Game Center step from ROADMAP_V09.md, preserve safe future saves,
commit and publish an isolated playable Vercel preview, update notes, then stop.
