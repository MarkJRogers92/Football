# Dynasty Lab — v0.9.14 Coach's Desk preview

Repository: https://github.com/MarkJRogers92/Football
Source branch: `codex/v0914-coachs-desk`
Production remains v0.9.13 until Mark explicitly approves promotion.

## Preview scope

- Up to three meaningful, state-backed decision cards appear above the existing Weekly Plan for the controlled team.
- The implemented decisions cover a compromised starter, the four-game redshirt threshold, a playing-time concern and a recruiting priority.
- Choices reuse weekly availability/rotation, redshirt and promise state, morale/staff trust, recruiting visits and the existing event ledger.
- The same subject has a short cooldown so decisions do not become constant interruptions.

## Persistence

`universe.weeklyDecisions` is additive core save data and old saves normalize to
an empty array. No IndexedDB schema change. See `STORAGE.md`.

## Review focus

Review the Coach's Desk on desktop and actual iPhone Safari, including button
wrapping, single-week blocking while a card is unresolved, season-sim staff
delegation, and the practical feel of limited-role and rotation choices. Publish
production only with Mark's explicit approval.
