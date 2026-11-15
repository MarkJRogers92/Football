# Roadmap execution status

Last reconciled: 2026-11-15, source `a0632cf` (`v0.35.0`).

## Current source and publication

PR #68 (v0.35.0: bet with the administration, home streaks, program traditions, dynasty page, smaller draft history) merged into the default branch at `a0632cfbde7faf48d4bb78f1fab6325b471a8f1c`. Production commit `ae0a4d9` serves v0.35.0 at https://markjrogers92.github.io/Football/; its `index.html` matches the release source byte for byte.

The publish workflow's full release gate passed in CI. Evidence is in `agent_docs/latest_session_work.md`. Next ideas and open decisions: `docs/NEXT_IDEAS_2026-11-15.md`; save-size options: `docs/SAVE_SIZE_MEASUREMENT.md`.

## Next action

Release work is complete. Gather playtesting feedback before expanding the simulation. Do not rebuild systems already present in v0.33.

## Remaining work

- Real iPhone/Safari and screen-reader checks; automated desktop mobile viewports do not establish these.
- Human playtesting for session length, onboarding and whether the world stays enjoyable without chores.
- Fatigue, difficulty presets and alternate playoff formats are separate design/balance decisions, not part of this pass.
- Signed installers and a licence/pricing decision were previously declined or deferred by the owner; do not silently reopen them as blockers.

Use `CHANGELOG.md` for release history and `docs/DYNASTY_WORLD_MEASUREMENTS.md` for balance evidence. Historical release plans are not current task lists.
