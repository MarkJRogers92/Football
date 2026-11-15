# Roadmap execution status

Last reconciled: 2026-11-15, source `457bef7` (`v0.33.1`).

## Current source and publication

PR #66 (v0.33.1: NFL outlook from scouting ranges, tighter Pro Hall of Fame, week result line fix) merged into the default branch at `457bef7e676fa840bd12e498126a343f9d42cd12`. Production commit `bf94d7d` serves v0.33.1 at https://markjrogers92.github.io/Football/; its `index.html` matches the release source byte for byte.

The publish workflow's full release gate passed in CI. Evidence is in `agent_docs/latest_session_work.md`. Work after v0.33.1 is on `claude/overnight-v034` (see `docs/NEXT_IDEAS_2026-11-15.md`).

## Next action

Release work is complete. Gather playtesting feedback before expanding the simulation. Do not rebuild systems already present in v0.33.

## Remaining work

- Real iPhone/Safari and screen-reader checks; automated desktop mobile viewports do not establish these.
- Human playtesting for session length, onboarding and whether the world stays enjoyable without chores.
- Fatigue, difficulty presets and alternate playoff formats are separate design/balance decisions, not part of this pass.
- Signed installers and a licence/pricing decision were previously declined or deferred by the owner; do not silently reopen them as blockers.

Use `CHANGELOG.md` for release history and `docs/DYNASTY_WORLD_MEASUREMENTS.md` for balance evidence. Historical release plans are not current task lists.
