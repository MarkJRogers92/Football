# Roadmap execution status

Last reconciled: 2026-11-16, source `a2fee42` (`v0.36.0`).

## Current source and publication

PR #69 (v0.36.0: national Players of the Week, retired numbers) merged into the default branch at `a2fee427522c0c877d3b5a785578b9332b298d53`. Production commit `4427616` serves v0.36.0 at https://markjrogers92.github.io/Football/; its `index.html` matches the release source byte for byte.

The publish workflow's full release gate passed in CI. Evidence is in `agent_docs/latest_session_work.md`. Next ideas and open decisions: `docs/NEXT_IDEAS_2026-11-15.md`; save-size options: `docs/SAVE_SIZE_MEASUREMENT.md`.

## Next action

Release work is complete. Gather playtesting feedback before expanding the simulation. Do not rebuild systems already present in v0.33.

## Remaining work

- Real iPhone/Safari and screen-reader checks; automated desktop mobile viewports do not establish these.
- Human playtesting for session length, onboarding and whether the world stays enjoyable without chores.
- Fatigue, difficulty presets and alternate playoff formats are separate design/balance decisions, not part of this pass.
- Signed installers and a licence/pricing decision were previously declined or deferred by the owner; do not silently reopen them as blockers.

Use `CHANGELOG.md` for release history and `docs/DYNASTY_WORLD_MEASUREMENTS.md` for balance evidence. Historical release plans are not current task lists.
