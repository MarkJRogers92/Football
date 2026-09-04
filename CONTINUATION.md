# Dynasty Lab — v0.9.15 Player Agency / Locker Room preview

Repository: https://github.com/MarkJRogers92/Football
Source branch: `codex/v0915-player-agency`
Production remains unchanged until Mark explicitly approves promotion.

## Preview scope

- Players occasionally initiate playing-time, transfer, role, redshirt or position-change conversations through the existing Coach's Desk cards.
- Triggers use existing state only, and outcomes flow through morale, staff trust, transfer risk, promises, redshirts, rotations and position familiarity.
- Alternate-week cadence, a per-player cooldown and a maximum of three interactions in any four-week window keep frequency low.
- Sim Regular Season delegates unresolved conversations; single-week advancement still waits for the coach.

## Persistence

Player requests remain additive records in `universe.weeklyDecisions`; old
records normalize to staff-originated decisions. No IndexedDB schema change.

## Review focus

Review interaction frequency and consequence strength over a real season, plus
button wrapping on actual iPhone Safari. Production still requires Mark's
explicit approval.
