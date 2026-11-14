# Natural recruiting timelines

Most recruits do not publish a commitment date. The desk shows public list cuts
and clues such as exploring options, taking visits and weighing finalists. A
strong relationship adds context and may suggest that a decision is approaching;
it never exposes a hidden week or certainty percentage.

About 23% have a personality inclined toward an announcement. They name a week
only when approaching readiness. A close race, changed options or a remaining
visit can explain a postponement. If a postponed date no longer fits, the recruit
withdraws it with an explanation instead of leaving an overdue countdown. No date
is named after the final recruiting week (12); a postponement that would pass it
becomes "waiting for signing day", and signing day resolves him.

A program is only cut when it was pursuing the recruit (on the board or holding
an offer) at the time of the cut. Lists published before you showed interest stand,
but do not lock you out of working him.

Timing combines a stable personal threshold and tempo with current school fit,
competition, completed visits and bounded seeded weekly uncertainty. Every
uncommitted recruit follows the same process whether targeted or not. Top 5/3
cuts use varied readiness bands, not fixed offsets from an upcoming date.
Scholarship capacity, offers, dealbreakers, signing-day decisions and flip defense
remain in force. Some prospects legitimately wait until signing day.

## Engineering checks

- `node --test tests/recruit-timelines.js`: public redaction, target neutrality,
  deterministic/save behavior, visits, migration, announcements and reopening.
- `node --test tests/recruiting-actions.js tests/recruiting-calibration-tools.js`:
  actions, UI strings, real-season ledger and multi-season recruiting balance.
- `node tests/recruiting-actions-browser.js`: desktop and phone desk interactions.
- `npm test`, `npm run build`, `npm run verify:release`: repository-wide checks.

The engine reuses its stable AI shortlist, the week's explored leader and current
finalists, widening to the league only when no shortlisted AI school has room.
This avoids re-ranking all 120 programs for all 2,800 prospects every week.

## Validation snapshot (2026-11-13)

17 dedicated timeline regressions passed, including a real-engine target toggle
and RNG check. The 85 recruiting-action/calibration tests passed across the
full and corrective runs, including two staff-run seasons and one skilled-coach
season. The player-history, signing-day and rising-class regression run passed
42 tests. Local Chromium fails at launch with `socket() EPERM`, before any
browser assertion; desktop/phone checks must run in CI.

A separate market-only sample (seeds 3, 7, 11, no game results) exercised all
2,800 prospects through 12 recruiting weeks plus final signing. It produced
625–629 public announcements (22%), 164–173 postponements (26–28% of announced
dates, about 6% of all prospects), 1,947–1,977 regular-season commitments and
2,124–2,135 signed prospects. The controlled classes held 16–19 recruits.
Elite-program mean stars stayed above low-prestige programs in every sample.
This is a reproducible balance smoke check, not a promise about every dynasty.
