# Roadmap execution status

Last reconciled: 2026-11-15, source `61e09ae` (`v0.35.0`).

## Current source and publication

PR #67 (v0.34.0: coaching rivals, Senior Day, pro alumni coaches, trophy case, season card, trap games and statement wins, "you saw him first", draft class notes, Legacy in backups, faster recruiting weeks) merged into the default branch at `8916e0772057c8891a5f44e37173a26c2a05f750`. Production commit `9c9bf06` serves v0.34.0 at https://markjrogers92.github.io/Football/; its `index.html` matches the release source byte for byte.

The publish workflow's full release gate passed in CI. Evidence is in `agent_docs/latest_session_work.md`. v0.35.0 (bet with the administration, home streaks, dynasty page, smaller draft history) is on `claude/v035`, not merged. Next ideas and open decisions: `docs/NEXT_IDEAS_2026-11-15.md`; save-size options: `docs/SAVE_SIZE_MEASUREMENT.md` (v0.34 section).

## Next action

Release work is complete. Gather playtesting feedback before expanding the simulation. Do not rebuild systems already present in v0.33.

## Remaining work

- Real iPhone/Safari and screen-reader checks; automated desktop mobile viewports do not establish these.
- Human playtesting for session length, onboarding and whether the world stays enjoyable without chores.
- Fatigue, difficulty presets and alternate playoff formats are separate design/balance decisions, not part of this pass.
- Signed installers and a licence/pricing decision were previously declined or deferred by the owner; do not silently reopen them as blockers.

Use `CHANGELOG.md` for release history and `docs/DYNASTY_WORLD_MEASUREMENTS.md` for balance evidence. Historical release plans are not current task lists.
