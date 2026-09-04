# Dynasty Lab — v0.9.16 Scouting Intelligence preview

Repository: https://github.com/MarkJRogers92/Football
Source branch: `codex/v0916-scouting-intelligence`
Production remains unchanged until Mark explicitly approves promotion.

## Preview scope

- Recruit and player profiles show position-specific domain ranges rather than hidden true attribute grades.
- Confidence tightens through existing recruiting, coach, camp, class, transfer and participation state.
- Sparse scouting snapshots preserve first evaluation, signing day, first fall camp, freshman-year end and meaningful later revisions.
- All v0.9.15 Coach's Desk and player-agency behavior remains intact.

## Persistence

`scoutingDomains` and `scoutingHistory` are additive nested recruit/player data
in existing saves and exports. No IndexedDB schema change.

## Review focus

Review range readability, history usefulness and the 390px profile layout on
actual iPhone Safari. Production still requires Mark's explicit approval.
