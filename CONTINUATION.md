# Dynasty Lab — v0.9.0 preview checkpoint

Repository: https://github.com/MarkJRogers92/Football
Branch: `codex/v081-save-continuation`
Base for this batch: `41e3da68b1809e1f522a20d3d310579f3c074660`

## Completed batch

v0.9.0's first promises implementation is complete. See CHANGELOG.md and WORKLOG.md.
Milestone 1 archive persistence remains intact; do not redo it. Version now 0.9.0.

- Scoped recruiting promises become persistent first-season obligations on signing.
- Early Role, No Redshirt, Position Lock and Development Plan are assessed once
  when finalizing that player's first offseason (after both camps, before exits).
- Major injury/participation allowances; remembered position changes; actual
  Technique delivery in both camps, not rating growth or a last-minute selection.
- Morale/trust consequences and bounded school-specific transfer risk.
- Permanent coach references, departed-coach archive and plain structured event log.
- Profile promise history and significant breach alerts; full portable JSON retained.

## Play this batch

Use the latest preview URL supplied in the publishing task / its
`outputs/VERCEL_PREVIEW_CHECKPOINT.md`. Production is unchanged. Start a new universe
or import an exported save. Choose a recruiting promise, sign that recruit, then
play their first season and finalize the offseason to see the assessment.

Early Role = eight appearances, adjusted for recorded injury absence.
Development Plan = select Technique before BOTH spring and fall camp.
No Redshirt = no first-season redshirt, except major injury (four missed weeks).
Position Lock = retain the official position. NIL Priority remains passive.

## Validation

52 engine checks (eight seasons); 12 storage/persistence/promise test groups
(including a two-season signing/assessment/round-trip); 45 browser checks; five
real Chromium/IndexedDB scenarios including archived promise profile rendering.
One-season audit: 15–30 signees/team, mean 23.3, flips 4.8%; archive 1,929 departures.
Build, syntax and diff checks passed. Actual iPhone Safari is still untested.

## Budget and working agreement

The user has a small remaining credit budget. One small batch at a time: implement,
run focused checks, build, commit, publish a playable preview, update this handoff,
then STOP. Do not automatically start the next milestone. Do not use subagents.
The user's old saves are expendable; prioritize safe saves created going forward.
No default-branch or production promotion without authorization.

## Next batch (only after user asks)

1. Get feedback on the promises preview. No need to rerun all previous research.
2. Read ROADMAP_V09.md; next planned milestone is v0.9.1 transfer memory/destinations.
3. v0.9.2 permanent Game Center comes BEFORE the deeper coaching market.

Deferred: AI promise offers, aggregate breach-rate calibration, future recruiting
credibility/high-school relationship effects, full coaching careers/market,
position-change negotiation UI and future academic/disciplinary exceptions.
Current pre-first-season roster cuts preserve obligations but cannot assess an
unplayed season. Deal with release/cut reasons alongside transfer lifecycle work.
Coach UUIDs are preserved; a universe counter assigns only missing legacy IDs.
Player-requested position change is supported by the rule helper, but there is
no negotiation UI yet. Camps and old-save normalization do not invent obligations.
Events/coaches remain in the main save; monitor their growth in future long runs.
See STORAGE.md for unchanged archive atomicity, lazy hydration and backup rules.

## Resume prompt

Continue Dynasty Lab from Football branch codex/v081-save-continuation. Read
CONTINUATION.md, STORAGE.md and ROADMAP_V09.md. The v0.9.0 promises preview batch is
complete. Work on one agreed small step, preserve reliable future saves, publish
an isolated playable Vercel preview, commit and update the handoff, then stop.
